// 統計詳細データ参照  /admin/match-detail（2026-11 追加）
//  GET /v1/api/admin/match-detail（一覧）・GET /v1/api/match-detail/extra?matchId=（試合ごとの中身）
//  B016 が登録した統計詳細データ（match_detail_* の 9 テーブル）を、試合ごとに確認する。
//  - 一覧: キーワード（試合ID・カテゴリ・チーム名）・試合日の範囲・取得エラーありで検索。各テーブルの行数を出す
//  - 行をクリック: モーダルで中身（概要・タイムライン・メンバー・選手スタッツ）を表示（試合詳細画面と同じ部品）
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Search } from "lucide-react";
import {
  fetchMatchDetailReference,
  type MatchDetailReferenceQuery,
  type MatchDetailReferenceRow,
} from "../../../api/matchDetailReference/matchDetailReference";
import { fetchMatchDetailExtra } from "../../../api/match/matchapi";
import { scrapeErrorsLabel } from "../../../utils/matchDetailLabels";
import {
  ConsoleButton,
  ConsoleCheck,
  ConsoleField,
  ConsoleInput,
  ConsoleModal,
  ConsoleNotice,
  ConsoleSelect,
  ConsoleTable,
  ConsoleToolbar,
  SegmentedTabs,
  StatChips,
  StatusBadge,
  fmtNum,
  type ConsoleColumn,
} from "../../../api/commonAdminDesign";
import {
  DetailGoalList,
  EventTimeline,
  HalfScores,
  LineupView,
  MomentumChart,
  PlayerStatsTable,
} from "../../personal/match/MatchDetailExtra";

const PAGE_SIZES = [50, 100, 200];

type Tab = "overview" | "timeline" | "lineup" | "players";

/** 行数のセル（0 は薄く） */
function CountCell({ n }: { n: number }) {
  return <span className={n === 0 ? "text-gray-300" : "font-mono"}>{fmtNum(n)}</span>;
}

/** 試合ごとの中身（モーダル） */
function DetailModal({ row, onClose }: { row: MatchDetailReferenceRow | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const q = useQuery({
    queryKey: ["admin-match-detail-extra", row?.matchId],
    queryFn: () => fetchMatchDetailExtra(row!.matchId),
    enabled: !!row,
  });
  const ex = q.data;
  const home = ex?.homeTeam ?? row?.homeTeam ?? "ホーム";
  const away = ex?.awayTeam ?? row?.awayTeam ?? "アウェー";

  return (
    <ConsoleModal
      open={!!row}
      onClose={onClose}
      width={1100}
      title={
        row ? (
          <span>
            {home} <span className="font-mono">{row.homeScore ?? "-"} - {row.awayScore ?? "-"}</span> {away}
          </span>
        ) : (
          ""
        )
      }
      description={row ? `${row.matchDate ?? "-"}　${row.category ?? ""}　試合ID: ${row.matchId}` : undefined}
    >
      {q.isLoading && <p className="text-sm text-gray-500">読み込み中…</p>}
      {q.isError && (
        <ConsoleNotice tone="ng" title="取得に失敗しました">
          {q.error instanceof Error ? q.error.message : ""}
        </ConsoleNotice>
      )}
      {ex && !ex.found && <ConsoleNotice tone="warn" title="統計詳細データがありません（削除された可能性があります）" />}
      {ex && ex.found && (
        <div className="space-y-3">
          {ex.scrapeErrors && (
            <ConsoleNotice tone="warn" title="取得できなかったページがあります">
              {scrapeErrorsLabel(ex.scrapeErrors)}
            </ConsoleNotice>
          )}
          <HalfScores ex={ex} />
          <SegmentedTabs<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "overview", label: "概要" },
              { value: "timeline", label: "タイムライン", count: ex.events.length },
              { value: "lineup", label: "メンバー", count: ex.lineups.length },
              { value: "players", label: "選手スタッツ", count: ex.playerStats.length },
            ]}
          />
          {tab === "overview" && (
            <div className="space-y-4">
              <section>
                <h4 className="mb-1 text-[13px] font-bold text-gray-700">ゴール</h4>
                {ex.goals.length > 0 ? <DetailGoalList goals={ex.goals} /> : <p className="text-sm text-gray-400">データなし</p>}
              </section>
              <section>
                <h4 className="mb-1 text-[13px] font-bold text-gray-700">勢い（マッチモメンタム）</h4>
                {ex.momentum.length > 0 ? (
                  <MomentumChart momentum={ex.momentum} incidents={ex.momentumIncidents} homeTeam={home} awayTeam={away} />
                ) : (
                  <p className="text-sm text-gray-400">データなし</p>
                )}
              </section>
            </div>
          )}
          {tab === "timeline" &&
            (ex.events.length > 0 ? <EventTimeline events={ex.events} halves={ex.halves} /> : <p className="text-sm text-gray-400">データなし</p>)}
          {tab === "lineup" &&
            (ex.lineups.length > 0 || ex.formations.length > 0 ? (
              <LineupView ex={ex} homeTeam={home} awayTeam={away} />
            ) : (
              <p className="text-sm text-gray-400">データなし</p>
            ))}
          {tab === "players" &&
            (ex.playerStats.length > 0 ? (
              <PlayerStatsTable stats={ex.playerStats} homeTeam={home} awayTeam={away} />
            ) : (
              <p className="text-sm text-gray-400">データなし</p>
            ))}
        </div>
      )}
    </ConsoleModal>
  );
}

export default function MatchDetailReferencePage() {
  // 入力中の条件と、検索に使う条件（「検索」を押したときだけ反映）
  const [keywordInput, setKeywordInput] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [errorsOnlyInput, setErrorsOnlyInput] = useState(false);
  const [cond, setCond] = useState<Omit<MatchDetailReferenceQuery, "offset" | "limit">>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [selected, setSelected] = useState<MatchDetailReferenceRow | null>(null);

  const query: MatchDetailReferenceQuery = { ...cond, offset: (page - 1) * pageSize, limit: pageSize };
  const q = useQuery({
    queryKey: ["admin-match-detail", query],
    queryFn: () => fetchMatchDetailReference(query),
    placeholderData: (prev) => prev,
  });
  const rows = q.data?.items ?? [];
  const total = q.data?.total ?? 0;

  const handleSearch = () => {
    setPage(1);
    setCond({
      keyword: keywordInput.trim() || undefined,
      dateFrom: dateFromInput || undefined,
      dateTo: dateToInput || undefined,
      errorsOnly: errorsOnlyInput || undefined,
    });
  };

  const columns: ConsoleColumn<MatchDetailReferenceRow>[] = [
    { key: "date", header: "試合日", mono: true, cell: (r) => r.matchDate ?? "-" },
    {
      key: "match",
      header: "試合",
      cell: (r) => (
        <div>
          <div className="font-bold">
            {r.homeTeam ?? "-"} <span className="font-mono font-normal">{r.homeScore ?? "-"} - {r.awayScore ?? "-"}</span> {r.awayTeam ?? "-"}
          </div>
          <div className="text-[11px] text-gray-500">{r.category ?? ""}</div>
        </div>
      ),
    },
    { key: "momentum", header: "マッチモメンタム", align: "right", cell: (r) => <CountCell n={r.momentumCount} /> },
    { key: "summary", header: "試合の出来事", align: "right", cell: (r) => <CountCell n={r.summaryCount} /> },
    { key: "goal", header: "ゴール", align: "right", cell: (r) => <CountCell n={r.goalCount} /> },
    { key: "formation", header: "フォーメーション", align: "right", cell: (r) => <CountCell n={r.formationCount} /> },
    { key: "lineup", header: "メンバー", align: "right", cell: (r) => <CountCell n={r.lineupCount} /> },
    { key: "missing", header: "欠場者", align: "right", cell: (r) => <CountCell n={r.missingCount} /> },
    { key: "stat", header: "選手スタッツ", align: "right", cell: (r) => <CountCell n={r.memberStatCount} /> },
    {
      key: "errors",
      header: "取得",
      cell: (r) =>
        r.scrapeErrors ? (
          <span title={`取得できなかったページ: ${scrapeErrorsLabel(r.scrapeErrors)}`}>
            <StatusBadge tone="warn">一部なし</StatusBadge>
          </span>
        ) : (
          <StatusBadge tone="ok">OK</StatusBadge>
        ),
    },
    { key: "registered", header: "登録日時", cell: (r) => <span className="text-[11px] text-gray-500">{r.registerTime ?? "-"}</span> },
    {
      key: "link",
      header: "リンク",
      cell: (r) =>
        r.matchUrl ? (
          <a
            href={r.matchUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
          >
            開く <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div>
      <ConsoleToolbar
        title="統計詳細データ参照"
        info="B016 が登録した試合詳細（モメンタム・出来事・メンバー・選手スタッツなど）"
        description="行をクリックすると、その試合の統計詳細データを表示します。取れなかったページがある試合は「一部なし」になります（J3 などリーグによって取れるデータが少ないことがあります）。"
      >
        <ConsoleButton onClick={() => void q.refetch()} loading={q.isFetching && !q.isLoading}>
          {!(q.isFetching && !q.isLoading) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
      </ConsoleToolbar>

      {q.isError && (
        <ConsoleNotice tone="ng" title="取得に失敗しました">
          {q.error instanceof Error ? q.error.message : ""}
        </ConsoleNotice>
      )}

      <div className="mb-2.5 flex flex-wrap items-end gap-2">
        <ConsoleField label="キーワード（試合ID・カテゴリ・チーム名）">
          <ConsoleInput
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="例）J1 リーグ / 浦和"
            className="w-64"
            data-testid="input-keyword"
          />
        </ConsoleField>
        <ConsoleField label="試合日（から）">
          <ConsoleInput type="date" value={dateFromInput} onChange={(e) => setDateFromInput(e.target.value)} className="w-40" />
        </ConsoleField>
        <ConsoleField label="試合日（まで）">
          <ConsoleInput type="date" value={dateToInput} onChange={(e) => setDateToInput(e.target.value)} className="w-40" />
        </ConsoleField>
        <ConsoleCheck checked={errorsOnlyInput} onChange={setErrorsOnlyInput}>
          取得エラーありのみ
        </ConsoleCheck>
        <ConsoleButton variant="primary" onClick={handleSearch} data-testid="button-search">
          <Search className="h-3.5 w-3.5" />
          検索
        </ConsoleButton>
        <div className="ml-auto">
          <ConsoleField label="1ページの件数">
            <ConsoleSelect
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="w-24"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>
        </div>
      </div>

      <StatChips
        loading={q.isLoading}
        items={[
          { label: "試合数", value: total },
          { label: "このページ", value: rows.length },
          {
            label: "取得エラーあり（このページ）",
            value: rows.filter((r) => r.scrapeErrors).length,
            tone: rows.some((r) => r.scrapeErrors) ? "warn" : "default",
          },
        ]}
      />

      <ConsoleTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.matchId}
        loading={q.isLoading}
        emptyText="統計詳細データがありません"
        onRowClick={(r) => setSelected(r)}
        rowClassName={(r) => (r.scrapeErrors ? "cursor-pointer bg-amber-50/40" : "cursor-pointer")}
        paging={{ page, pageSize, total, onChange: setPage }}
        maxHeight="calc(100vh - 340px)"
      />

      <DetailModal row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
