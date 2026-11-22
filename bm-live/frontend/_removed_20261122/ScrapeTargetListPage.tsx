// src/pages/admin/target/ScrapeTargetListPage.tsx
// スクレイピング対象リーグ一覧（2026-11-22 追加。見るだけ）
//  GET /v1/api/all-league-master（スクレイピング対象データ取得設定と同じ API）
//  ・スクレイピング対象のみ   : 対象（dispFlg=0）のリーグだけ（例: 日本 J1・J2・J3 / 韓国 K1 / イタリア セリエA・B）
//  ・対象の国のリーグ         : 対象のリーグがある国の、その国のリーグすべて（あとから入った新しいリーグも含む）。
//                              対象のリーグがない国は出さない
//  国単位でページングする（1 つの国のリーグはページをまたがない）。対象の切り替えは「スクレイピング対象データ取得設定」で行う。
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, RefreshCw, Settings } from "lucide-react";
import { ConsoleButton, ConsoleInput, ConsoleNotice, ConsoleSelect, ConsoleToolbar, SegmentedTabs, StatChips, StatusBadge } from "../../../api/commonAdminDesign";
import { adminPath } from "../../../api/auth/adminMenu";
import { fetchAllLeagueMaster, type AllLeagueDTO } from "./ManualDataTargetPage";
import {
  COUNTRIES_PER_PAGE_OPTIONS,
  DEFAULT_COUNTRIES_PER_PAGE,
  countriesOf,
  filterByViewMode,
  groupByCountry,
  pageByCountries,
} from "./scrapeTargetView";

type ListMode = "targetOnly" | "targetCountries";

const isTarget = (r: AllLeagueDTO) => r.dispFlg === "0";

export default function ScrapeTargetListPage() {
  const [rows, setRows] = useState<AllLeagueDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<ListMode>("targetOnly");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState<number>(DEFAULT_COUNTRIES_PER_PAGE);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      setRows(await fetchAllLeagueMaster());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () => ({
      targetOnly: filterByViewMode(rows, "targetOnly", isTarget).length,
      targetCountries: filterByViewMode(rows, "targetCountries", isTarget).length,
      countries: countriesOf(filterByViewMode(rows, "targetOnly", isTarget)).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const base = filterByViewMode(rows, mode, isTarget);
    const s = q.trim().toLowerCase();
    if (!s) return base;
    // 国名で絞ったときにその国のリーグがばらばらにならないよう、国名・リーグ名のどちらかに当たればその行を出す
    return base.filter((r) => `${r.country} ${r.league}`.toLowerCase().includes(s));
  }, [rows, mode, q]);

  const countries = useMemo(() => countriesOf(filtered), [filtered]);
  const paging = useMemo(() => pageByCountries(filtered, countries, page, perPage), [filtered, countries, page, perPage]);
  const groups = useMemo(() => groupByCountry(paging.rows), [paging.rows]);

  useEffect(() => setPage(0), [mode, q, perPage]);

  const first = countries.length === 0 ? 0 : page * perPage + 1;
  const last = Math.min((page + 1) * perPage, countries.length);

  return (
    <div>
      <ConsoleToolbar title="スクレイピング対象リーグ一覧" info="今スクレイピングしている国・リーグ（見るだけ。対象の切り替えはスクレイピング対象データ取得設定で行います）">
        <ConsoleButton onClick={() => void load()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
        <Link to={adminPath("manual/data/target")} className="no-underline">
          <ConsoleButton>
            <Settings className="h-3.5 w-3.5" />
            スクレイピング対象データ取得設定へ
          </ConsoleButton>
        </Link>
      </ConsoleToolbar>

      {err && <ConsoleNotice tone="ng" title="取得できませんでした">{err}</ConsoleNotice>}

      <div className="flex flex-wrap items-start gap-2">
        <StatChips
          loading={loading}
          items={[
            { label: "対象の国", value: counts.countries, tone: "ok" },
            { label: "対象のリーグ", value: counts.targetOnly, tone: "ok" },
            { label: "対象の国のリーグ", value: counts.targetCountries },
          ]}
        />
        <SegmentedTabs<ListMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "targetOnly", label: "スクレイピング対象のみ", count: counts.targetOnly },
            { value: "targetCountries", label: "対象の国のリーグ", count: counts.targetCountries },
          ]}
        />
        <ConsoleInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="国 / リーグで検索（例: 日本, J1）" className="ml-auto mb-2.5 w-72" />
      </div>

      <div className="mb-2 text-[12px] text-gray-500">
        {mode === "targetOnly"
          ? "スクレイピング対象（dispFlg=0）のリーグだけを出します。"
          : "スクレイピング対象のリーグがある国の、その国のリーグをすべて出します（対象 → 新しく入ったリーグ → 残りの順）。対象のリーグがない国は出しません。"}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">読み込み中…</div>
        ) : groups.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">該当する国・リーグはありません</div>
        ) : (
          groups.map((g) => (
            <div key={g.country} className="flex flex-wrap items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
              <div className="w-40 shrink-0 text-sm font-bold text-gray-900">
                {g.country}
                <span className="ml-1.5 text-[11px] font-normal text-gray-400">{g.leagues.length}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {g.leagues.map((l) => (
                  <span key={`${l.country}__${l.league}`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-[13px] text-gray-800">
                    {l.league}
                    {mode === "targetCountries" && (isTarget(l) ? <StatusBadge tone="ok">対象</StatusBadge> : l.newLeague ? <StatusBadge tone="warn">新規</StatusBadge> : null)}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-gray-600">
        <span className="tabular-nums">
          全 {countries.length} 国中 {first}〜{last} 国目（{countries.length === 0 ? 0 : page + 1} / {countries.length === 0 ? 0 : paging.totalPages} ページ）・{paging.rows.length} リーグ
        </span>
        <ConsoleSelect value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="w-28">
          {COUNTRIES_PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} 国／ページ
            </option>
          ))}
        </ConsoleSelect>
        <div className="ml-auto flex gap-1.5">
          <ConsoleButton size="sm" onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page <= 0}>
            <ChevronLeft className="h-3.5 w-3.5" />
            前の国へ
          </ConsoleButton>
          <ConsoleButton size="sm" onClick={() => setPage((p) => Math.min(p + 1, paging.totalPages - 1))} disabled={page >= paging.totalPages - 1}>
            次の国へ
            <ChevronRight className="h-3.5 w-3.5" />
          </ConsoleButton>
        </div>
      </div>
    </div>
  );
}
