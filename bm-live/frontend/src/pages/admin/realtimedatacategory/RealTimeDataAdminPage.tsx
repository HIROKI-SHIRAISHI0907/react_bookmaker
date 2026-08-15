import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

/** =========================
 * Types
 * (dev.web.api.bm_a025.RealTimeDataDTO / RealTimeDataRequest / RealTimeDataResponse に対応)
 * ========================= */
type RealTimeDataDTO = {
  dataCategory?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  /** 3パターンのいずれかに一致した場合の dataCategory 値。一致しない場合は null */
  formattedDataCategory?: string | null;
  /** home/away の組み合わせ単位でのカテゴリ形式判定("同一カテゴリ名" または "混在") */
  categoryFormatIcon?: string | null;
  /** グルーピング件数(search時は未設定) */
  cnt?: number | null;
};

type RealTimeDataRequest = {
  id?: string;
  dataCategory: string;
  homeTeamName: string;
  awayTeamName: string;
};

type RealTimeDataResponse = {
  responseCode?: string;
  message?: string;
};

/** 画面表示用: home/away の組み合わせでまとめたグループ */
type MatchGroup = {
  key: string;
  homeTeamName: string;
  awayTeamName: string;
  categoryFormatIcon: string | null;
  categories: Array<{
    dataCategory: string;
    formattedDataCategory: string | null;
    cnt: number | null;
  }>;
};

/** =========================
 * UI helpers
 * ========================= */
type Tone = "gray" | "blue" | "emerald" | "amber" | "rose" | "violet";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
    violet: "bg-violet-100 text-violet-800 ring-violet-200",
  };

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Panel({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="text-base font-extrabold text-gray-900">{title}</div>
            {desc ? <div className="text-sm text-muted-foreground mt-1">{desc}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Alert({ type, title, message, onClose }: { type: "info" | "success" | "error"; title: string; message: string; onClose?: () => void }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" type="button">
          ✕
        </button>
      ) : null}
    </div>
  );
}

/** =========================
 * Utils
 * ========================= */
async function fetchJsonStrict<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }

  return (await res.json()) as T;
}

async function postRealTimeDataUpdate(req: RealTimeDataRequest, signal?: AbortSignal): Promise<RealTimeDataResponse> {
  const res = await fetch("/v1/api/real-time-data/update", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(req),
  });

  const body = (await res.json().catch(() => null)) as RealTimeDataResponse | null;

  if (!res.ok && !body) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  return body ?? { responseCode: String(res.status), message: res.statusText };
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

/** dataCategory × home × away の一覧を home/away 単位のグループにまとめる */
function groupByMatch(rows: RealTimeDataDTO[]): MatchGroup[] {
  const map = new Map<string, MatchGroup>();

  for (const row of rows) {
    const home = safeText(row.homeTeamName);
    const away = safeText(row.awayTeamName);
    const key = `${home}__${away}`;

    let group = map.get(key);
    if (!group) {
      group = {
        key,
        homeTeamName: home,
        awayTeamName: away,
        categoryFormatIcon: row.categoryFormatIcon ?? null,
        categories: [],
      };
      map.set(key, group);
    }

    if (row.dataCategory) {
      group.categories.push({
        dataCategory: row.dataCategory,
        formattedDataCategory: row.formattedDataCategory ?? null,
        cnt: row.cnt ?? null,
      });
    }

    if (!group.categoryFormatIcon && row.categoryFormatIcon) {
      group.categoryFormatIcon = row.categoryFormatIcon;
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.homeTeamName + a.awayTeamName).localeCompare(b.homeTeamName + b.awayTeamName));
}

/** =========================
 * Page
 * ========================= */
export default function RealTimeDataAdminPage() {
  const [homeInput, setHomeInput] = useState("");
  const [awayInput, setAwayInput] = useState("");

  const [homeFilter, setHomeFilter] = useState("");
  const [awayFilter, setAwayFilter] = useState("");
  const [searchVersion, setSearchVersion] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RealTimeDataDTO[]>([]);

  /** グループごとの入力中テキスト(dataCategoryの新しい値) */
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  /** グループごとの更新処理状態 */
  const [updateState, setUpdateState] = useState<Record<string, { loading: boolean; error?: string; success?: string }>>({});

  const abortRef = useRef<AbortController | null>(null);

  const isFiltered = homeFilter.trim().length > 0 && awayFilter.trim().length > 0;

  const apiUrl = useMemo(() => {
    if (isFiltered) {
      const params = new URLSearchParams();
      params.set("homeTeamName", homeFilter.trim());
      params.set("awayTeamName", awayFilter.trim());
      return `/api/real-time-data/search?${params.toString()}`;
    }
    return "/api/real-time-data";
  }, [isFiltered, homeFilter, awayFilter]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const doFetch = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchJsonStrict<RealTimeDataDTO[]>(apiUrl, ac.signal);
      setRows(res ?? []);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, searchVersion]);

  const groups = useMemo(() => groupByMatch(rows), [rows]);

  const stats = useMemo(() => {
    const sameCount = groups.filter((g) => g.categoryFormatIcon === "同一カテゴリ名").length;
    const mixedCount = groups.filter((g) => g.categoryFormatIcon === "混在").length;
    return { groupCount: groups.length, sameCount, mixedCount };
  }, [groups]);

  const handleSearch = () => {
    setHomeFilter(homeInput);
    setAwayFilter(awayInput);
    setSearchVersion((v) => v + 1);
  };

  const handleClearFilter = () => {
    setHomeInput("");
    setAwayInput("");
    setHomeFilter("");
    setAwayFilter("");
    setSearchVersion((v) => v + 1);
  };

  const handleEditChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async (group: MatchGroup) => {
    const newCategory = (editValues[group.key] ?? "").trim();

    if (!newCategory) {
      setUpdateState((prev) => ({ ...prev, [group.key]: { loading: false, error: "dataCategoryを入力してください。" } }));
      return;
    }

    setUpdateState((prev) => ({ ...prev, [group.key]: { loading: true } }));

    try {
      const req: RealTimeDataRequest = {
        dataCategory: newCategory,
        homeTeamName: group.homeTeamName,
        awayTeamName: group.awayTeamName,
      };

      const res = await postRealTimeDataUpdate(req);

      if (res.responseCode === "200") {
        setUpdateState((prev) => ({ ...prev, [group.key]: { loading: false, success: res.message ?? "更新成功しました。" } }));
        void doFetch();
      } else {
        setUpdateState((prev) => ({ ...prev, [group.key]: { loading: false, error: res.message ?? `更新に失敗しました。(code: ${res.responseCode ?? "-"})` } }));
      }
    } catch (e: any) {
      setUpdateState((prev) => ({ ...prev, [group.key]: { loading: false, error: e?.message ?? String(e) } }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4zM7 8h10M7 12h10M7 16h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">リアルタイムデータ管理</h1>
              <p className="text-sm text-muted-foreground mt-1">home/away の組み合わせ単位で dataCategory を確認・上書きします。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">組み合わせ数 {stats.groupCount}</Badge>
            <Badge tone="emerald">同一カテゴリ名 {stats.sameCount}</Badge>
            <Badge tone="amber">混在 {stats.mixedCount}</Badge>
          </div>
        </div>

        {error ? <Alert type="error" title="取得に失敗しました" message={error} onClose={() => setError(null)} /> : null}

        <Panel
          title="検索条件"
          desc="ホーム/アウェーの両方を入力して検索すると1組み合わせに絞り込みます。未入力のまま検索すると全件表示に戻ります。"
          right={
            <div className="flex items-center gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "検索中..." : "検索"}
              </Button>
              <Button variant="outline" onClick={handleClearFilter} disabled={loading}>
                全件表示
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">ホームチーム名</div>
              <input
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={homeInput}
                onChange={(e) => setHomeInput(e.target.value)}
                placeholder="例）FC東京"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">アウェーチーム名</div>
              <input
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={awayInput}
                onChange={(e) => setAwayInput(e.target.value)}
                placeholder="例）浦和レッズ"
              />
            </div>
          </div>
        </Panel>

        <Panel title="一覧" desc="ホーム vs アウェーごとに、紐づく dataCategory の状況と更新フォームを表示します。">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-sm text-muted-foreground">データがありません。</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {groups.map((group) => {
                const state = updateState[group.key];
                const editValue = editValues[group.key] ?? (group.categories.length === 1 ? group.categories[0].dataCategory : "");

                return (
                  <div key={group.key} className="rounded-2xl border bg-white hover:shadow-sm transition-shadow p-4">
                    <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                      <div className="min-w-0">
                        <div className="text-lg font-extrabold text-gray-900 truncate">
                          {group.homeTeamName} vs {group.awayTeamName}
                        </div>

                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {group.categoryFormatIcon === "混在" ? (
                            <Badge tone="amber">混在</Badge>
                          ) : group.categoryFormatIcon === "同一カテゴリ名" ? (
                            <Badge tone="emerald">同一カテゴリ名</Badge>
                          ) : (
                            <Badge tone="gray">-</Badge>
                          )}
                        </div>

                        <div className="mt-3 flex flex-col gap-1.5">
                          {group.categories.length === 0 ? (
                            <div className="text-sm text-muted-foreground">dataCategory なし</div>
                          ) : (
                            group.categories.map((c, idx) => (
                              <div key={`${group.key}-${idx}`} className="flex items-center gap-2 text-sm text-gray-700">
                                {c.formattedDataCategory ? <Badge tone="blue">形式一致</Badge> : <Badge tone="rose">形式不一致</Badge>}
                                <span className="truncate">{c.dataCategory}</span>
                                {c.cnt != null ? <span className="text-xs text-muted-foreground">({c.cnt}件)</span> : null}
                              </div>
                            ))
                          )}
                        </div>

                        {/* ホーム vs アウェー の表示の下に dataCategory 更新フォームを配置 */}
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          <input
                            className="flex-1 min-w-[240px] rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editValue}
                            onChange={(e) => handleEditChange(group.key, e.target.value)}
                            placeholder="新しい dataCategory (例: 日本: J1リーグ - ラウンド 5)"
                          />
                          <Button size="sm" onClick={() => handleUpdate(group)} disabled={state?.loading}>
                            {state?.loading ? "更新中..." : "更新"}
                          </Button>
                        </div>

                        {state?.error ? <div className="mt-2 text-xs font-semibold text-rose-700">{state.error}</div> : null}
                        {state?.success ? <div className="mt-2 text-xs font-semibold text-emerald-700">{state.success}</div> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
