import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { ConsoleButton, ConsoleColumn, ConsoleField, ConsoleInput, ConsoleNotice, ConsolePanel, ConsoleTable, ConsoleToolbar, StatChips, StatusBadge } from "../../../api/commonAdminDesign";

/** =========================
 * API base path
 * バックエンド側の context-path (/v1) を含めた基点。
 * パスを変更する場合はここだけ直せば全箇所に反映される。
 * ========================= */
const API_BASE = "/v1/api/real-time-data";

/** 一覧の1ページあたりの表示件数（表にしたので5件 → 20件に増やしています） */
const PAGE_SIZE = 20;

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

/** 更新1件分(dev.web.api.bm_a025.RealTimeDataSubDTO に対応) */
type RealTimeDataSubDTO = {
  id?: string;
  dataCategory: string;
  homeTeamName: string;
  awayTeamName: string;
};

/** 更新リクエスト。requestDTO に複数件まとめて渡すとバックエンド側で一括更新される。 */
type RealTimeDataRequest = {
  requestDTO: RealTimeDataSubDTO[];
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
 * Utils
 * ========================= */

/** レスポンスが JSON かどうかを Content-Type で確認してからパースする。
 * SPA フォールバック等で HTML が返ってきた場合に
 * "Unexpected token '<'" という分かりにくいエラーではなく、
 * 原因の特定がしやすいエラーメッセージを出す。
 */
async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    const snippet = text.slice(0, 200);
    throw new Error(`想定外のレスポンス形式です (status: ${res.status}, content-type: ${contentType || "unknown"})。` + `APIのパスやプロキシ設定を確認してください。\n${snippet}`);
  }

  return (await res.json()) as T;
}

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

  return parseJsonOrThrow<T>(res);
}

async function postRealTimeDataUpdate(req: RealTimeDataRequest, signal?: AbortSignal): Promise<RealTimeDataResponse> {
  const res = await fetch(`${API_BASE}/update`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(req),
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? ((await res.json().catch(() => null)) as RealTimeDataResponse | null) : null;

  if (!res.ok && !body) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }

  return body ?? { responseCode: String(res.status), message: res.statusText };
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

/** グループ内のいずれかの dataCategory に「ラウンド」が付いていない場合 true（＝更新が必要 = 優先表示） */
function groupNeedsRoundUpdate(group: MatchGroup): boolean {
  if (group.categories.length === 0) return true;
  return group.categories.some((c) => !(c.dataCategory || "").includes("ラウンド"));
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

  // 「ラウンド」が付いていない（＝更新が必要な）グループを先に、
  // 「ラウンド」が付いている（＝更新不要な）グループは後ろに表示する。
  // 同じ優先度内はチーム名の五十音/アルファベット順。
  return Array.from(map.values()).sort((a, b) => {
    const aPriority = groupNeedsRoundUpdate(a) ? 0 : 1;
    const bPriority = groupNeedsRoundUpdate(b) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.homeTeamName + a.awayTeamName).localeCompare(b.homeTeamName + b.awayTeamName);
  });
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

  /** 一覧のページング */
  const [page, setPage] = useState(1);

  /** グループごとの入力中テキスト(dataCategoryの新しい値) */
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  /** グループごとの更新処理状態 */
  const [updateState, setUpdateState] = useState<Record<string, { loading: boolean; error?: string; success?: string }>>({});

  /** 一括更新用: 選択中のグループキー(ページをまたいで保持) */
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  /** 一括更新用: 選択したグループ全てに適用する新しい dataCategory */
  const [bulkValue, setBulkValue] = useState("");
  /** 一括更新の処理状態 */
  const [bulkState, setBulkState] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false });

  const abortRef = useRef<AbortController | null>(null);

  const isFiltered = homeFilter.trim().length > 0 && awayFilter.trim().length > 0;

  const apiUrl = useMemo(() => {
    if (isFiltered) {
      const params = new URLSearchParams();
      params.set("homeTeamName", homeFilter.trim());
      params.set("awayTeamName", awayFilter.trim());
      return `${API_BASE}/search?${params.toString()}`;
    }
    return API_BASE;
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
    setPage(1);
    setSelectedKeys(new Set());
    setBulkState({ loading: false });
    void doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, searchVersion]);

  const groups = useMemo(() => groupByMatch(rows), [rows]);

  const stats = useMemo(() => {
    const sameCount = groups.filter((g) => g.categoryFormatIcon === "同一カテゴリ名").length;
    const mixedCount = groups.filter((g) => g.categoryFormatIcon === "混在").length;
    const needsCount = groups.filter(groupNeedsRoundUpdate).length;
    return { groupCount: groups.length, sameCount, mixedCount, needsCount };
  }, [groups]);

  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));

  /** 更新後の再取得などで件数が減り、現在ページが範囲外になった場合に補正する */
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedGroups = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return groups.slice(start, start + PAGE_SIZE);
  }, [groups, page]);

  /** このページの全グループが選択済みか */
  const allOnPageSelected = pagedGroups.length > 0 && pagedGroups.every((g) => selectedKeys.has(g.key));

  const toggleSelectGroup = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pagedGroups.forEach((g) => next.delete(g.key));
      } else {
        pagedGroups.forEach((g) => next.add(g.key));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedKeys(new Set());
    setBulkState({ loading: false });
  };

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
    const newCategory = (editValues[group.key] ?? (group.categories.length === 1 ? group.categories[0].dataCategory : "")).trim();

    if (!newCategory) {
      setUpdateState((prev) => ({ ...prev, [group.key]: { loading: false, error: "dataCategoryを入力してください。" } }));
      return;
    }

    setUpdateState((prev) => ({ ...prev, [group.key]: { loading: true } }));

    try {
      const req: RealTimeDataRequest = {
        requestDTO: [
          {
            dataCategory: newCategory,
            homeTeamName: group.homeTeamName,
            awayTeamName: group.awayTeamName,
          },
        ],
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

  /** 選択中のグループ全てに同じ dataCategory を適用し、1回のAPI呼び出しで一括更新する */
  const handleBulkUpdate = async () => {
    const newCategory = bulkValue.trim();

    if (!newCategory) {
      setBulkState({ loading: false, error: "dataCategoryを入力してください。" });
      return;
    }

    const targets = groups.filter((g) => selectedKeys.has(g.key));

    if (targets.length === 0) {
      setBulkState({ loading: false, error: "更新対象が選択されていません。" });
      return;
    }

    setBulkState({ loading: true });

    try {
      const req: RealTimeDataRequest = {
        requestDTO: targets.map((g) => ({
          dataCategory: newCategory,
          homeTeamName: g.homeTeamName,
          awayTeamName: g.awayTeamName,
        })),
      };

      const res = await postRealTimeDataUpdate(req);

      if (res.responseCode === "200") {
        setBulkState({ loading: false, success: res.message ?? `${targets.length}件を一括更新しました。` });
        setSelectedKeys(new Set());
        setBulkValue("");
        void doFetch();
      } else {
        setBulkState({ loading: false, error: res.message ?? `一括更新に失敗しました。(code: ${res.responseCode ?? "-"})` });
      }
    } catch (e: any) {
      setBulkState({ loading: false, error: e?.message ?? String(e) });
    }
  };

  const columns: ConsoleColumn<MatchGroup>[] = [
    {
      key: "check",
      header: <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllOnPage} className="accent-indigo-600" aria-label="このページを全選択" />,
      cell: (g) => (
        <input
          type="checkbox"
          checked={selectedKeys.has(g.key)}
          onChange={() => toggleSelectGroup(g.key)}
          className="mt-0.5 accent-indigo-600"
          aria-label={`${g.homeTeamName} vs ${g.awayTeamName} を一括更新の対象として選択`}
        />
      ),
    },
    {
      key: "match",
      header: "対戦",
      wrap: true,
      className: "min-w-[200px]",
      cell: (g) => (
        <>
          <div className="font-bold">
            {g.homeTeamName} <span className="font-normal text-gray-400">vs</span> {g.awayTeamName}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {groupNeedsRoundUpdate(g) ? <StatusBadge tone="ng">要更新</StatusBadge> : <StatusBadge tone="neutral">更新不要</StatusBadge>}
            {g.categoryFormatIcon === "混在" ? (
              <StatusBadge tone="warn" dot={false}>
                混在
              </StatusBadge>
            ) : g.categoryFormatIcon === "同一カテゴリ名" ? (
              <StatusBadge tone="ok" dot={false}>
                同一カテゴリ名
              </StatusBadge>
            ) : null}
          </div>
        </>
      ),
    },
    {
      key: "categories",
      header: "現在の dataCategory",
      wrap: true,
      className: "min-w-[260px]",
      cell: (g) =>
        g.categories.length === 0 ? (
          <span className="text-xs text-gray-400">dataCategory なし</span>
        ) : (
          <div className="grid gap-1">
            {g.categories.map((c, idx) => (
              <div key={`${g.key}-${idx}`} className="flex items-center gap-1.5 text-xs">
                {c.formattedDataCategory ? (
                  <StatusBadge tone="info" dot={false}>
                    形式一致
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="ng" dot={false}>
                    形式不一致
                  </StatusBadge>
                )}
                <span className="min-w-0 break-words text-gray-800">{c.dataCategory}</span>
                {c.cnt != null && <span className="shrink-0 tabular-nums text-[11px] text-gray-400">({c.cnt}件)</span>}
              </div>
            ))}
          </div>
        ),
    },
    {
      key: "edit",
      header: "新しい dataCategory",
      className: "min-w-[320px] py-1",
      cell: (g) => {
        const state = updateState[g.key];
        const editValue = editValues[g.key] ?? (g.categories.length === 1 ? g.categories[0].dataCategory : "");
        return (
          <>
            <div className="flex items-center gap-1.5">
              <ConsoleInput
                value={editValue}
                onChange={(e) => handleEditChange(g.key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleUpdate(g)}
                placeholder="例: 日本: J1リーグ - ラウンド 5"
                className="h-7 min-w-0 flex-1 text-[12.5px]"
              />
              <ConsoleButton size="sm" variant="primary" onClick={() => void handleUpdate(g)} loading={state?.loading}>
                {state?.loading ? "更新中…" : "更新"}
              </ConsoleButton>
            </div>
            {state?.error && <div className="mt-1 text-[11px] font-bold text-red-700">{state.error}</div>}
            {state?.success && <div className="mt-1 text-[11px] font-bold text-emerald-700">{state.success}</div>}
          </>
        );
      },
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="リアルタイムデータ管理" info="home / away の組み合わせ単位で dataCategory を確認・上書き">
        <ConsoleButton variant="primary" onClick={() => void doFetch()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      {error && (
        <ConsoleNotice tone="ng" title="取得に失敗しました" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}

      <ConsolePanel title="検索条件" info="ホーム・アウェーの両方を入力すると1組み合わせに絞り込みます。未入力で検索すると全件表示に戻ります">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <ConsoleField label="ホームチーム名">
            <ConsoleInput value={homeInput} onChange={(e) => setHomeInput(e.target.value)} placeholder="例）FC東京" className="w-56" />
          </ConsoleField>
          <ConsoleField label="アウェーチーム名">
            <ConsoleInput value={awayInput} onChange={(e) => setAwayInput(e.target.value)} placeholder="例）浦和レッズ" className="w-56" />
          </ConsoleField>
          <ConsoleButton type="submit" variant="primary" disabled={loading}>
            <Search className="h-3.5 w-3.5" />
            検索
          </ConsoleButton>
          <ConsoleButton onClick={handleClearFilter} disabled={loading}>
            全件表示
          </ConsoleButton>
          {isFiltered && (
            <StatusBadge tone="info" dot={false}>
              絞り込み中
            </StatusBadge>
          )}
        </form>
      </ConsolePanel>

      <StatChips
        loading={loading && groups.length === 0}
        items={[
          { label: "組み合わせ数", value: stats.groupCount },
          { label: "要更新", value: stats.needsCount, tone: stats.needsCount > 0 ? "ng" : "ok" },
          { label: "同一カテゴリ名", value: stats.sameCount, tone: "ok" },
          { label: "混在", value: stats.mixedCount, tone: stats.mixedCount > 0 ? "warn" : "default" },
        ]}
      />

      {/* 一括更新（ページをまたいで選択を保持） */}
      {groups.length > 0 && (
        <div className={["mb-2 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2", selectedKeys.size > 0 ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-white"].join(" ")}>
          <span className="text-[13px] font-bold text-gray-900">選択中: {selectedKeys.size}件</span>
          <ConsoleInput
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            placeholder="選択した組み合わせに一括反映する dataCategory（例: 日本: J1リーグ - ラウンド 5）"
            className="min-w-[260px] flex-1"
            disabled={selectedKeys.size === 0}
          />
          <ConsoleButton variant="primary" onClick={() => void handleBulkUpdate()} disabled={selectedKeys.size === 0} loading={bulkState.loading}>
            {bulkState.loading ? "一括更新中…" : `選択した${selectedKeys.size}件を一括更新`}
          </ConsoleButton>
          <ConsoleButton onClick={handleClearSelection} disabled={selectedKeys.size === 0 || bulkState.loading}>
            選択解除
          </ConsoleButton>
          {bulkState.error && <div className="w-full whitespace-pre-wrap text-[11px] font-bold text-red-700">{bulkState.error}</div>}
          {bulkState.success && <div className="w-full text-[11px] font-bold text-emerald-700">{bulkState.success}</div>}
        </div>
      )}

      <ConsoleTable
        columns={columns}
        rows={pagedGroups}
        rowKey={(g) => g.key}
        loading={loading}
        emptyText="データがありません。"
        rowClassName={(g) => (selectedKeys.has(g.key) ? "!bg-indigo-50" : "")}
        paging={{ page, pageSize: PAGE_SIZE, total: groups.length, onChange: setPage }}
      />
      <div className="mt-1.5 text-[11px] text-gray-400">「ラウンド」が付いていない（更新が必要な）組み合わせを先に表示しています。新しい dataCategory の欄で Enter を押しても更新できます。</div>
    </div>
  );
}
