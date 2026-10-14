import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ConsoleButton, ConsoleColumn, ConsoleTable, ConsoleToolbar, DateStepper, FlagBadge, StatChips, fmtNum, todayYmd } from "../../../api/commonAdminDesign";

type TodayCreatedCsvItem = {
  csvId: string;
  dataCategory: string;
  season: string;
  homeTeamName: string;
  awayTeamName: string;
  checkFinFlg: string;
  registerTime: string;
};

type TodayCreatedCsvListResponse = {
  targetDate: string;
  count: number;
  totalCount: number;
  startOffset: number;
  endOffset: number;
  items: TodayCreatedCsvItem[];
};

const PAGE_SIZE = 50;

const isFin = (flg: string | null | undefined) => String(flg ?? "").trim() === "1";

const COLUMNS: ConsoleColumn<TodayCreatedCsvItem>[] = [
  { key: "registerTime", header: "登録日時", mono: true, cell: (r) => r.registerTime || "-" },
  { key: "csvId", header: "CSV ID", mono: true, cell: (r) => r.csvId || "-" },
  { key: "dataCategory", header: "データカテゴリ", wrap: true, className: "min-w-[220px]", cell: (r) => r.dataCategory || "-" },
  { key: "season", header: "シーズン", cell: (r) => r.season || "-" },
  { key: "homeTeamName", header: "ホーム", cell: (r) => r.homeTeamName || "-" },
  { key: "awayTeamName", header: "アウェイ", cell: (r) => r.awayTeamName || "-" },
  {
    key: "checkFinFlg",
    header: "終了確認",
    align: "center",
    cell: (r) => (r.checkFinFlg ? <FlagBadge value={r.checkFinFlg} /> : <span className="text-gray-400">-</span>),
  },
];

export default function TodayCreatedCsvPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [targetDate, setTargetDate] = useState(todayYmd());
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<TodayCreatedCsvListResponse>({
    targetDate: todayYmd(),
    count: 0,
    totalCount: 0,
    startOffset: 0,
    endOffset: PAGE_SIZE,
    items: [],
  });

  const load = useCallback(async (date: string, page: number) => {
    setLoading(true);
    setErrorMessage("");

    const startOffset = (page - 1) * PAGE_SIZE;
    const endOffset = startOffset + PAGE_SIZE;

    try {
      const response = await fetch(`/v1/api/admin/csv/today?targetDate=${encodeURIComponent(date)}&startOffset=${startOffset}&endOffset=${endOffset}`, { method: "GET", credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as TodayCreatedCsvListResponse;
      setData({
        targetDate: json.targetDate ?? date,
        count: json.count ?? 0,
        totalCount: json.totalCount ?? 0,
        startOffset: json.startOffset ?? startOffset,
        endOffset: json.endOffset ?? endOffset,
        items: json.items ?? [],
      });
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
      setErrorMessage("作成CSV情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(targetDate, 1);
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 日付を変えたらすぐ1ページ目を読み込む
  const onChangeDate = (date: string) => {
    setTargetDate(date);
    load(date, 1);
  };

  const onMovePage = (page: number) => {
    if (loading) return;
    load(targetDate, page);
  };

  // 完了 / 未確認は API が総数を返さないため、表示中のページ分を数える
  const pageFin = useMemo(() => data.items.filter((it) => isFin(it.checkFinFlg)).length, [data.items]);
  const pageNotFin = data.items.length - pageFin;

  const displayStart = data.totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const displayEnd = Math.min(currentPage * PAGE_SIZE, data.totalCount);

  return (
    <div>
      <ConsoleToolbar title="作成CSV情報" info="csv_detail_manage・register_time 基準">
        <DateStepper value={targetDate} onChange={onChangeDate} disabled={loading} />
        <ConsoleButton variant="primary" onClick={() => load(targetDate, currentPage)} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      <StatChips
        loading={loading && data.items.length === 0}
        items={[
          { label: "対象日", value: data.targetDate },
          { label: "総件数", value: fmtNum(data.totalCount) },
          { label: "このページの完了", value: fmtNum(pageFin), tone: "ok" },
          { label: "このページの未確認", value: fmtNum(pageNotFin), tone: pageNotFin > 0 ? "warn" : "default" },
          { label: "表示", value: `${fmtNum(displayStart)}–${fmtNum(displayEnd)}` },
        ]}
      />

      <ConsoleTable
        columns={COLUMNS}
        rows={data.items}
        rowKey={(r, i) => `${r.csvId}-${i}`}
        loading={loading}
        error={errorMessage || undefined}
        emptyText="指定日に作成されたデータはありません。"
        maxHeight="calc(100vh - 220px)"
        paging={{ page: currentPage, pageSize: PAGE_SIZE, total: data.totalCount, onChange: onMovePage }}
      />
    </div>
  );
}
