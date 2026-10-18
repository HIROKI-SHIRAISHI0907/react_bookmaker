import { useMemo, useRef, useState } from "react";
import { List, Save, Search, Undo2 } from "lucide-react";
import {
  ConsoleButton,
  ConsoleColumn,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleTable,
  ConsoleToolbar,
  SegmentedTabs,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

/** =========================
 * API base path
 * バックエンド側の context-path (/v1) を含めた基点。
 * ========================= */
const API_BASE = "/v1/api/team-color-master";

/** 一覧の1ページあたりの表示件数 */
const PAGE_SIZE = 20;

/** 一覧の絞り込みタブ */
type ViewFilter = "all" | "dirty" | "noMain" | "noSub";

/** =========================
 * Types
 * ========================= */
type TeamColorRow = {
  id: string;
  country: string | null;
  league: string | null;
  team: string | null;
  teamColorMainHex: string | null;
  teamColorSubHex: string | null;
};

type TeamColorCond = {
  country: string;
  league: string;
  team: string;
};

/** 最後に実行した取得方法（保存後の再取得で同じ条件を使う） */
type LastQuery = { mode: "search"; cond: TeamColorCond } | { mode: "all" };

/** =========================
 * Utils
 * ========================= */

/** レスポンスが JSON かどうかを確認してからパースする（HTML が返ってきた場合に原因を出す） */
async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`想定外のレスポンス形式です (status: ${res.status}, content-type: ${contentType || "unknown"})。` + `APIのパスやプロキシ設定を確認してください。\n${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function buildQuery(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s !== "") q.set(k, s);
  });
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

async function getJson<T>(url: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${url}${buildQuery(params ?? {})}`, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return parseJsonOrThrow<T>(res);
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? ((await res.json().catch(() => null)) as T | null) : null;
}

function str(v: string | null | undefined) {
  return v == null ? "" : String(v);
}

function toNullableString(v: string) {
  const t = v.trim();
  return t === "" ? null : t;
}

/** 色コードを #RRGGBB に正規化（空欄は null） */
function normalizeHexColor(raw: string): { ok: true; value: string | null } | { ok: false; reason: string } {
  const s = (raw ?? "").trim();
  if (s === "") return { ok: true, value: null };

  const t = s.startsWith("#") ? s : `#${s}`;

  const m3 = /^#([0-9a-fA-F]{3})$/.exec(t);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return { ok: true, value: `#${r}${r}${g}${g}${b}${b}`.toLowerCase() };
  }
  const m6 = /^#([0-9a-fA-F]{6})$/.exec(t);
  if (m6) return { ok: true, value: `#${m6[1].toLowerCase()}` };

  return { ok: false, reason: "# + 6桁（例: #1a2b3c）で入力してください" };
}

function isSameRow(a: TeamColorRow, b: TeamColorRow) {
  return (
    str(a.country) === str(b.country) &&
    str(a.league) === str(b.league) &&
    str(a.team) === str(b.team) &&
    str(a.teamColorMainHex) === str(b.teamColorMainHex) &&
    str(a.teamColorSubHex) === str(b.teamColorSubHex)
  );
}

/** =========================
 * Color cell（スウォッチ＋カラーピッカー＋テキスト入力）
 * ========================= */
function ColorInput({ value, onChange, ariaLabel }: { value: string; onChange: (next: string) => void; ariaLabel: string }) {
  const norm = normalizeHexColor(value);
  const color = norm.ok && norm.value ? norm.value : null;

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label
          className="relative h-7 w-7 shrink-0 cursor-pointer rounded-md border border-gray-300 shadow-inner"
          style={{
            background: color ?? "repeating-linear-gradient(45deg,#f3f4f6 0 4px,#e5e7eb 4px 8px)",
          }}
          title="クリックで色を選択"
        >
          <input
            type="color"
            value={color ?? "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${ariaLabel}（カラーピッカー）`}
          />
        </label>
        <ConsoleInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          aria-label={ariaLabel}
          className={["h-7 w-28 font-mono text-[12.5px]", norm.ok ? "" : "!border-red-300 !bg-red-50"].join(" ")}
        />
      </div>
      {!norm.ok && <div className="mt-1 text-[11px] font-bold text-red-700">{norm.reason}</div>}
    </div>
  );
}

/** =========================
 * Page
 * ========================= */
export default function TeamColorPage() {
  const [condInput, setCondInput] = useState<TeamColorCond>({ country: "", league: "", team: "" });
  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /** 取得時点の値（変更判定・破棄に使う） */
  const [originals, setOriginals] = useState<Record<string, TeamColorRow>>({});
  /** 画面上で編集中の値 */
  const [rows, setRows] = useState<TeamColorRow[]>([]);

  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewFilter>("all");

  const abortRef = useRef<AbortController | null>(null);

  const isDirty = (r: TeamColorRow) => {
    const o = originals[r.id];
    return !o || !isSameRow(o, r);
  };

  const dirtyRows = useMemo(() => rows.filter(isDirty), [rows, originals]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(
    () => ({
      total: rows.length,
      dirty: dirtyRows.length,
      noMain: rows.filter((r) => !str(r.teamColorMainHex).trim()).length,
      noSub: rows.filter((r) => !str(r.teamColorSubHex).trim()).length,
    }),
    [rows, dirtyRows],
  );

  const viewRows = useMemo(() => {
    switch (view) {
      case "dirty":
        return rows.filter(isDirty);
      case "noMain":
        return rows.filter((r) => !str(r.teamColorMainHex).trim());
      case "noSub":
        return rows.filter((r) => !str(r.teamColorSubHex).trim());
      default:
        return rows;
    }
  }, [rows, view, originals]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(viewRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => viewRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [viewRows, currentPage]);

  /** 取得（検索 / 全件）。成功時は編集中の内容を破棄して置き換える */
  const load = async (q: LastQuery, message?: (n: number) => string) => {
    if (dirtyRows.length > 0 && !message && !window.confirm(`未保存の変更が ${dirtyRows.length} 件あります。破棄して再取得しますか？`)) {
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = q.mode === "search" ? await getJson<TeamColorRow[]>(`${API_BASE}/search`, q.cond, ac.signal) : await getJson<TeamColorRow[]>(API_BASE, undefined, ac.signal);
      const list = data ?? [];
      setRows(list);
      setOriginals(Object.fromEntries(list.map((r) => [r.id, r])));
      setLastQuery(q);
      setPage(1);
      setSuccess(message ? message(list.length) : `${q.mode === "search" ? "検索結果" : "全件取得"}: ${list.length}件`);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => void load({ mode: "search", cond: { ...condInput } });
  const handleFetchAll = () => void load({ mode: "all" });

  const updateCell = (id: string, key: keyof TeamColorRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const revertRow = (id: string) => {
    const o = originals[id];
    if (o) setRows((prev) => prev.map((r) => (r.id === id ? o : r)));
  };

  const revertAll = () => {
    setRows((prev) => prev.map((r) => originals[r.id] ?? r));
    setSuccess(null);
  };

  const handleSave = async () => {
    const targets = dirtyRows;
    if (targets.length === 0) return;

    // バリデーション（1件でもNGなら保存しない）
    const errors: string[] = [];
    for (const r of targets) {
      const main = normalizeHexColor(str(r.teamColorMainHex));
      const sub = normalizeHexColor(str(r.teamColorSubHex));
      if (!main.ok) errors.push(`[${r.team ?? r.id}] メインカラー: ${main.reason}`);
      if (!sub.ok) errors.push(`[${r.team ?? r.id}] サブカラー: ${sub.reason}`);
    }
    if (errors.length > 0) {
      setError(errors.join("\n"));
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    let saved = 0;
    try {
      for (const r of targets) {
        const main = normalizeHexColor(str(r.teamColorMainHex));
        const sub = normalizeHexColor(str(r.teamColorSubHex));
        await postJson(`${API_BASE}/update`, {
          id: r.id,
          country: toNullableString(str(r.country)),
          league: toNullableString(str(r.league)),
          team: toNullableString(str(r.team)),
          teamColorMainHex: main.ok ? main.value : null,
          teamColorSubHex: sub.ok ? sub.value : null,
        });
        saved++;
      }
      await load(lastQuery ?? { mode: "all" }, () => `保存完了: ${saved}件`);
    } catch (e: any) {
      setError(`${saved}/${targets.length} 件保存した時点でエラーになりました。\n${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const textCell = (key: "country" | "league" | "team", label: string) => (r: TeamColorRow) => (
    <ConsoleInput value={str(r[key])} onChange={(e) => updateCell(r.id, key, e.target.value)} aria-label={`${r.team ?? r.id} の ${label}`} className="h-7 w-full min-w-0 text-[12.5px]" />
  );

  const columns: ConsoleColumn<TeamColorRow>[] = [
    {
      key: "id",
      header: "ID",
      cell: (r) => <span className="font-mono text-[11px] text-gray-500">{r.id}</span>,
    },
    { key: "country", header: "国", className: "min-w-[140px]", cell: textCell("country", "国") },
    { key: "league", header: "リーグ", className: "min-w-[160px]", cell: textCell("league", "リーグ") },
    { key: "team", header: "チーム", className: "min-w-[180px]", cell: textCell("team", "チーム") },
    {
      key: "main",
      header: "メインカラー",
      className: "min-w-[180px]",
      cell: (r) => <ColorInput value={str(r.teamColorMainHex)} onChange={(v) => updateCell(r.id, "teamColorMainHex", v)} ariaLabel={`${r.team ?? r.id} のメインカラー`} />,
    },
    {
      key: "sub",
      header: "サブカラー",
      className: "min-w-[180px]",
      cell: (r) => <ColorInput value={str(r.teamColorSubHex)} onChange={(v) => updateCell(r.id, "teamColorSubHex", v)} ariaLabel={`${r.team ?? r.id} のサブカラー`} />,
    },
    {
      key: "status",
      header: "状態",
      cell: (r) =>
        isDirty(r) ? (
          <div className="flex items-center gap-1.5">
            <StatusBadge tone="warn">編集中</StatusBadge>
            <ConsoleButton size="sm" onClick={() => revertRow(r.id)} disabled={saving}>
              戻す
            </ConsoleButton>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        ),
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="チームカラー情報反映設定" info="チームごとのメイン / サブカラーを確認・更新">
        <ConsoleButton onClick={revertAll} disabled={stats.dirty === 0 || saving}>
          <Undo2 className="h-3.5 w-3.5" />
          変更を破棄
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => void handleSave()} disabled={stats.dirty === 0 || loading} loading={saving}>
          {!saving && <Save className="h-3.5 w-3.5" />}
          {saving ? "保存中…" : `変更を保存（${stats.dirty}件）`}
        </ConsoleButton>
      </ConsoleToolbar>

      {error && (
        <ConsoleNotice tone="ng" title="エラー" onClose={() => setError(null)}>
          <span className="whitespace-pre-wrap">{error}</span>
        </ConsoleNotice>
      )}
      {success && !error && (
        <ConsoleNotice tone="ok" title={success} onClose={() => setSuccess(null)}>
          {null}
        </ConsoleNotice>
      )}

      <ConsolePanel title="検索条件" info="国・リーグ・チームのいずれか一つだけでも絞り込めます">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <ConsoleField label="国">
            <ConsoleInput value={condInput.country} onChange={(e) => setCondInput({ ...condInput, country: e.target.value })} placeholder="例）日本" className="w-48" />
          </ConsoleField>
          <ConsoleField label="リーグ">
            <ConsoleInput value={condInput.league} onChange={(e) => setCondInput({ ...condInput, league: e.target.value })} placeholder="例）J1リーグ" className="w-48" />
          </ConsoleField>
          <ConsoleField label="チーム">
            <ConsoleInput value={condInput.team} onChange={(e) => setCondInput({ ...condInput, team: e.target.value })} placeholder="例）浦和レッズ" className="w-56" />
          </ConsoleField>
          <ConsoleButton type="submit" variant="primary" disabled={loading || saving}>
            <Search className="h-3.5 w-3.5" />
            検索
          </ConsoleButton>
          <ConsoleButton onClick={handleFetchAll} disabled={loading || saving}>
            <List className="h-3.5 w-3.5" />
            全件取得
          </ConsoleButton>
          {lastQuery?.mode === "search" && (
            <StatusBadge tone="info" dot={false}>
              絞り込み中
            </StatusBadge>
          )}
        </form>
      </ConsolePanel>

      <StatChips
        loading={loading && rows.length === 0}
        items={[
          { label: "件数", value: stats.total },
          { label: "変更あり", value: stats.dirty, tone: stats.dirty > 0 ? "warn" : "default" },
          { label: "メインカラー未設定", value: stats.noMain, tone: stats.noMain > 0 ? "ng" : "ok" },
          { label: "サブカラー未設定", value: stats.noSub, tone: stats.noSub > 0 ? "warn" : "ok" },
        ]}
      />

      <div className="mb-2">
        <SegmentedTabs<ViewFilter>
          value={view}
          onChange={(v) => {
            setView(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "すべて", count: stats.total },
            { value: "dirty", label: "変更あり", count: stats.dirty },
            { value: "noMain", label: "メイン未設定", count: stats.noMain },
            { value: "noSub", label: "サブ未設定", count: stats.noSub },
          ]}
        />
      </div>

      <ConsoleTable
        columns={columns}
        rows={pagedRows}
        rowKey={(r) => r.id}
        loading={loading}
        emptyText={lastQuery ? "データがありません。" : "条件を入力して「検索」または「全件取得」を押してください。"}
        rowClassName={(r) => (isDirty(r) ? "!bg-amber-50" : "")}
        paging={{ page: currentPage, pageSize: PAGE_SIZE, total: viewRows.length, onChange: setPage }}
      />
      <div className="mt-1.5 text-[11px] text-gray-400">色は #RRGGBB 形式に自動で正規化されます（例: #1a2b3c、#abc → #aabbcc）。空欄で保存すると NULL として更新されます。</div>
    </div>
  );
}
