// src/pages/admin/ManualDataTargetPage.tsx
import React, { useEffect, useMemo, useState } from "react";

export type AllLeagueDTO = {
  country: string;
  league: string;
  logicFlg: string; // 送信には使う（表示はしない）
  dispFlg: string; // "0"(対象) / "1"(対象外)
};

export type AllLeagueRequest = {
  country: string;
  league: string;
  logicFlg: string;
  dispFlg: string;
};

export type AllLeagueResponse = {
  responseCode: string;
  message?: string;
};

// タスク実行API
export type ExecTaskResponse = {
  returnCd: string;
  taskArn?: string;
  message?: string;
};
export type ExecTaskRequest = Record<string, never>;

const BASE = "/v1/api/all-league-master";
const EXEC_TASK_API = "/v1/api/admin/exec/task/all-league-scrape-master-json";

/** ===================== “全処理”の本体：JSON専用fetch ===================== */
type FetchJsonOptions = RequestInit & {
  /** 返ってきた本文の先頭をどれだけエラーに含めるか */
  snippetLength?: number;
  /** 空body(204含む)を許容するか（PATCH/POSTでたまにある） */
  allowEmptyBody?: boolean;
};

function buildNotJsonHint(ct: string, text: string, redirected: boolean) {
  const looksHtml = /<!doctype html>|<html[\s>]/i.test(text);
  if (looksHtml) {
    // これが今回の「Unexpected token '<'」の実態
    return [
      "HTMLが返っています。",
      "原因候補:",
      " - Viteのproxy未設定でフロント(index.html)が返っている",
      " - 認証が必要でログイン画面HTMLへリダイレクトされている（redirected: true になりがち）",
      " - APIパス違いでエラーページHTMLが返っている",
      `content-type=${ct}`,
      redirected ? "redirected: true（ログイン画面等に飛ばされている可能性）" : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return `JSON以外が返っています（content-type=${ct}）`;
}

async function fetchJsonStrict<T>(url: string, init?: FetchJsonOptions): Promise<T> {
  const snippetLength = init?.snippetLength ?? 500;
  const allowEmptyBody = init?.allowEmptyBody ?? false;

  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");

  // HTTPエラーはここで落とす（本文スニペット付き）
  if (!res.ok) {
    throw new Error(
      [`HTTP ${res.status} ${res.statusText}`, `url: ${res.url}`, `content-type: ${ct}`, res.redirected ? "redirected: true" : "", text ? `body(snippet):\n${text.slice(0, snippetLength)}` : ""]
        .filter(Boolean)
        .join("\n"),
    );
  }

  // 204/空body（PATCH/POSTでありえる）を許す場合
  if ((res.status === 204 || text.trim() === "") && allowEmptyBody) {
    return null as unknown as T;
  }

  // 200でもJSONじゃない → ここで“分かるエラー”にする
  if (!ct.includes("application/json")) {
    const hint = buildNotJsonHint(ct, text, res.redirected);
    throw new Error([`Expected JSON but got non-JSON response`, `url: ${res.url}`, hint, text ? `body(snippet):\n${text.slice(0, snippetLength)}` : ""].filter(Boolean).join("\n"));
  }

  // JSON parse
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error([`JSON parse failed`, `url: ${res.url}`, `content-type: ${ct}`, text ? `body(snippet):\n${text.slice(0, snippetLength)}` : ""].filter(Boolean).join("\n"));
  }
}

/** ================= API（全て fetchJsonStrict 統一） ================= */
export async function fetchAllLeagueMaster(): Promise<AllLeagueDTO[]> {
  const data = await fetchJsonStrict<AllLeagueDTO[] | null>(BASE, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function patchAllLeagueMaster(req: AllLeagueRequest): Promise<AllLeagueResponse> {
  const data = await fetchJsonStrict<AllLeagueResponse | null>(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    allowEmptyBody: true, // ★空bodyでも落ちないように
  });

  // サーバが空を返した場合の保険（成功扱いにする/厳密にしたいならここは throw に変更）
  return data ?? { responseCode: "200", message: "empty response (treated as success)" };
}

export async function execAllLeagueJsonTask(req: ExecTaskRequest = {}): Promise<ExecTaskResponse> {
  const data = await fetchJsonStrict<ExecTaskResponse | null>(EXEC_TASK_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    allowEmptyBody: false, // ここはJSON返却を期待（必要ならtrueに）
  });

  if (!data) throw new Error("exec task API returned empty body");
  return data;
}

/** ================= UI parts ================= */
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
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white/85 backdrop-blur shadow-sm ${className}`}>{children}</div>;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  title,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  title?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const v =
    variant === "primary"
      ? "bg-gray-900 text-white border-gray-900 hover:bg-black focus:ring-gray-400"
      : variant === "danger"
        ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 focus:ring-rose-500"
        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:ring-gray-300";

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} title={title} className={`${base} ${v} ${className}`}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Alert({ type, title, message, right }: { type: "info" | "success" | "warning" | "error"; title: string; message: string; right?: React.ReactNode }) {
  const cls =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : type === "error"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-blue-200 bg-blue-50 text-blue-900";

  const icon = type === "success" ? "✅" : type === "warning" ? "⚠️" : type === "error" ? "❌" : "💡";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/** ================= Domain helpers ================= */
type SaveState = { type: "idle" } | { type: "saving"; message?: string } | { type: "success"; message?: string } | { type: "error"; message?: string };

type RunState = { type: "idle" } | { type: "running"; message?: string } | { type: "success"; message?: string; taskArn?: string } | { type: "error"; message?: string };

type RowKey = string;
const keyOf = (r: Pick<AllLeagueDTO, "country" | "league">): RowKey => `${r.country}__${r.league}`;

/**
 * dispFlg の意味（要件どおり）
 * - checked = true  => dispFlg="0" （スクレイピング対象）
 * - checked = false => dispFlg="1" （対象外）
 */
const isScrapeTarget = (dispFlg: string) => dispFlg === "0";
const dispFlgFromChecked = (checked: boolean) => (checked ? "0" : "1");

export default function ManualDataTargetPage() {
  const [rows, setRows] = useState<AllLeagueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle" });
  const [runState, setRunState] = useState<RunState>({ type: "idle" });

  // 初期値（変更検知用）
  const [initialMap, setInitialMap] = useState<Record<RowKey, { logicFlg: string; dispFlg: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await fetchAllLeagueMaster();
        setRows(list);

        const m: Record<RowKey, { logicFlg: string; dispFlg: string }> = {};
        for (const r of list) m[keyOf(r)] = { logicFlg: r.logicFlg, dispFlg: r.dispFlg };
        setInitialMap(m);
      } catch (e: any) {
        setErr(e?.message ?? "一覧取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.country} ${r.league}`.toLowerCase().includes(s));
  }, [rows, q]);

  const changedCount = useMemo(() => {
    let cnt = 0;
    for (const r of rows) {
      const init = initialMap[keyOf(r)];
      if (!init) continue;
      if (r.logicFlg !== init.logicFlg || r.dispFlg !== init.dispFlg) cnt++;
    }
    return cnt;
  }, [rows, initialMap]);

  const targetCountVisible = useMemo(() => filtered.filter((r) => isScrapeTarget(r.dispFlg)).length, [filtered]);

  const setRowChecked = (row: AllLeagueDTO, checked: boolean) => {
    const k = keyOf(row);
    const nextDisp = dispFlgFromChecked(checked);
    setRows((prev) => prev.map((x) => (keyOf(x) === k ? { ...x, dispFlg: nextDisp } : x)));
  };

  // 表示中=filtered にだけ適用
  const setAllVisible = (checked: boolean) => {
    const targetKeys = new Set(filtered.map((r) => keyOf(r)));
    const nextDisp = dispFlgFromChecked(checked);
    setRows((prev) => prev.map((x) => (targetKeys.has(keyOf(x)) ? { ...x, dispFlg: nextDisp } : x)));
  };

  const saveAll = async () => {
    const changed = rows.filter((r) => {
      const init = initialMap[keyOf(r)];
      if (!init) return true;
      return r.logicFlg !== init.logicFlg || r.dispFlg !== init.dispFlg;
    });

    if (changed.length === 0) {
      setSaveState({ type: "success", message: "変更がないため保存は不要です" });
      setTimeout(() => setSaveState({ type: "idle" }), 1200);
      return;
    }

    setSaveState({ type: "saving", message: `保存中... (${changed.length}件)` });

    const errors: Array<{ key: string; code?: string; message?: string }> = [];

    for (const r of changed) {
      try {
        const res = await patchAllLeagueMaster({
          country: r.country,
          league: r.league,
          logicFlg: r.logicFlg,
          dispFlg: r.dispFlg,
        });

        if (res.responseCode !== "200") {
          errors.push({ key: keyOf(r), code: res.responseCode, message: res.message });
        }
      } catch (e: any) {
        errors.push({ key: keyOf(r), message: e?.message ?? "network error" });
      }
    }

    if (errors.length > 0) {
      setSaveState({
        type: "error",
        message: `保存失敗: ${errors.length}件（例: ${errors[0].key} ${errors[0].code ?? ""} ${errors[0].message ?? ""}）`,
      });
      return;
    }

    // 成功したら初期値を更新（変更点リセット）
    const m: Record<RowKey, { logicFlg: string; dispFlg: string }> = {};
    for (const r of rows) m[keyOf(r)] = { logicFlg: r.logicFlg, dispFlg: r.dispFlg };
    setInitialMap(m);

    setSaveState({ type: "success", message: `保存しました (${changed.length}件)` });
    setTimeout(() => setSaveState({ type: "idle" }), 1200);
  };

  const runUploadTask = async () => {
    try {
      setRunState({ type: "running", message: "タスク起動中..." });

      const res = await execAllLeagueJsonTask({});

      if (res.returnCd && res.returnCd !== "ACCEPTED") {
        setRunState({ type: "error", message: res.message ?? `タスク起動失敗: ${res.returnCd}` });
        return;
      }

      setRunState({
        type: "success",
        message: "タスクを起動しました（ECSで実行中）",
        taskArn: res.taskArn,
      });
    } catch (e: any) {
      setRunState({ type: "error", message: e?.message ?? "タスク起動に失敗しました" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6">
            <div className="h-6 w-72 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-4 w-96 bg-gray-200 rounded animate-pulse" />
            <div className="mt-6 h-48 bg-gray-200 rounded-2xl animate-pulse" />
          </Card>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert type="error" title="Error" message={err} />
        </div>
      </div>
    );
  }

  const saving = saveState.type === "saving";
  const running = runState.type === "running";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">スクレイピング対象データ設定</h1>
              <p className="text-sm text-gray-600 mt-1">チェックあり＝対象（dispFlg=0） / チェックなし＝対象外（dispFlg=1）</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">表示 {filtered.length}</Badge>
            <Badge tone="gray">全 {rows.length}</Badge>
            <Badge tone={changedCount > 0 ? "amber" : "emerald"}>変更 {changedCount}</Badge>
            <Badge tone="violet">対象(表示中) {targetCountVisible}</Badge>
          </div>
        </div>

        {/* Alerts */}
        {saveState.type === "error" ? <Alert type="error" title="保存エラー" message={saveState.message ?? ""} /> : null}
        {saveState.type === "success" ? <Alert type="success" title="保存" message={saveState.message ?? ""} /> : null}
        {runState.type === "error" ? <Alert type="error" title="タスク起動エラー" message={runState.message ?? ""} /> : null}

        {runState.type === "success" ? (
          <Alert
            type="success"
            title="タスク起動"
            message={`${runState.message ?? ""}${runState.taskArn ? `\n\ntaskArn:\n${runState.taskArn}` : ""}`}
            right={
              runState.taskArn ? (
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(runState.taskArn!)} className="px-3 py-2 text-xs">
                  taskArnコピー
                </Button>
              ) : null
            }
          />
        ) : null}

        {/* Controls */}
        <Card className="p-6">
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div className="w-full md:w-auto">
              <div className="text-lg font-extrabold text-gray-900">検索・操作</div>
              <div className="text-sm text-gray-600 mt-1">検索してもチェック状態は保持されます（rows に保持）</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => setAllVisible(true)} disabled={filtered.length === 0 || saving || running} title="表示中をすべて対象にする">
                全チェック
              </Button>

              <Button variant="secondary" onClick={() => setAllVisible(false)} disabled={filtered.length === 0 || saving || running} title="表示中をすべて対象外にする">
                全チェック外し
              </Button>

              <Button onClick={saveAll} disabled={saving || changedCount === 0 || running} loading={saving} title={changedCount === 0 ? "変更がありません" : "変更分をまとめて保存します"}>
                まとめて保存
              </Button>

              <Button variant="danger" onClick={runUploadTask} disabled={running} loading={running} title="B010タスクを起動してJSON生成→S3アップロードを実行します">
                対象データアップロード実行
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-extrabold text-gray-900 mb-2">検索</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="国 / リーグで検索（例: JP, J1）"
                className="w-full px-4 py-3 rounded-xl border bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
              <Badge tone={saving ? "amber" : "gray"}>保存: {saving ? "実行中" : "待機"}</Badge>
              <Badge tone={running ? "amber" : "gray"}>タスク: {running ? "起動中" : "待機"}</Badge>
            </div>
          </div>

          {saveState.type === "saving" ? (
            <div className="mt-4">
              <Alert type="info" title="保存" message={saveState.message ?? "保存中..."} />
            </div>
          ) : null}

          {runState.type === "running" ? (
            <div className="mt-4">
              <Alert type="info" title="タスク起動" message={runState.message ?? "タスク起動中..."} />
            </div>
          ) : null}
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50 flex items-center justify-between gap-4">
            <div className="font-extrabold text-gray-900">一覧</div>
            <div className="text-xs text-gray-600">※ 保存は「変更があった行だけ」送信します（API必須のため logicFlg も送信）</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">国</th>
                  <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">リーグ</th>
                  <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">スクレイピング対象</th>
                  <th className="px-6 py-3 text-xs font-extrabold text-gray-600 whitespace-nowrap">状態</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => {
                  const k = keyOf(r);
                  const init = initialMap[k];
                  const dirty = init ? r.dispFlg !== init.dispFlg : false;
                  const checked = isScrapeTarget(r.dispFlg);

                  return (
                    <tr key={k} className={`border-b transition-colors ${dirty ? "bg-amber-50/60" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.country}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.league}</td>

                      <td className="px-6 py-3 whitespace-nowrap">
                        <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                          <input type="checkbox" checked={checked} onChange={(e) => setRowChecked(r, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          {checked ? <Badge tone="emerald">対象</Badge> : <Badge tone="gray">対象外</Badge>}
                        </label>
                      </td>

                      <td className="px-6 py-3 whitespace-nowrap">{dirty ? <Badge tone="amber">未保存</Badge> : <Badge tone="gray">保存済み</Badge>}</td>
                    </tr>
                  );
                })}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                      該当データがありません
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="text-center text-xs text-gray-500 leading-relaxed">
          ※ もし再び「HTMLが返っている」旨のエラーが出た場合、ほぼ確実に <b>proxy未設定</b> または <b>ログインへリダイレクト</b> です。
        </div>
      </div>
    </div>
  );
}
