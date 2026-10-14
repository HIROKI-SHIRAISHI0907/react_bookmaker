import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ConsoleButton, ConsoleColumn, ConsoleNotice, ConsoleTable, ConsoleToolbar, DateStepper, StatChips, StatusBadge, fmtNum, todayYmd } from "../../../api/commonAdminDesign";

type CsvStatus = "CREATED" | "TARGET" | "NOT_TARGET";

type MatchDataByDateItem = {
  matchKey: string;
  matchId: string;
  gameId: string;
  dataCategory: string;
  homeTeamName: string;
  awayTeamName: string;
  addManualFlg: string;
  csvStatus: CsvStatus | string;
  recordTime: string;
};

type MatchDataByDateListResponse = {
  targetDate: string;
  page: number;
  size: number;
  count: number;
  totalPages: number;
  items: MatchDataByDateItem[];
};

const PAGE_SIZE = 10;

function CsvStatusBadge({ csvStatus }: { csvStatus?: string }) {
  if (csvStatus === "CREATED") return <StatusBadge tone="ok">統計CSV作成済</StatusBadge>;
  if (csvStatus === "TARGET") return <StatusBadge tone="info">統計CSV作成可</StatusBadge>;
  return <StatusBadge tone="neutral">統計CSV作成非対象</StatusBadge>;
}

async function getJsonSafe<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    if (isJson) {
      try {
        const body = await response.json();
        detail = body?.message || body?.error || detail;
      } catch {
        // ignore
      }
    } else {
      try {
        const text = await response.text();
        if (text) {
          detail = text;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(detail);
  }

  if (!isJson) {
    throw new Error("JSONレスポンスではありません。");
  }

  return (await response.json()) as T;
}

const COLUMNS: ConsoleColumn<MatchDataByDateItem>[] = [
  { key: "recordTime", header: "記録時間", mono: true, cell: (i) => i.recordTime || "-" },
  { key: "csvStatus", header: "対象区分", cell: (i) => <CsvStatusBadge csvStatus={i.csvStatus} /> },
  { key: "matchId", header: "matchId", mono: true, cell: (i) => i.matchId || "-" },
  { key: "gameId", header: "gameId", mono: true, cell: (i) => i.gameId || "-" },
  { key: "dataCategory", header: "dataCategory", wrap: true, className: "min-w-[220px]", cell: (i) => i.dataCategory || "-" },
  { key: "home", header: "home", cell: (i) => i.homeTeamName || "-" },
  { key: "away", header: "away", cell: (i) => i.awayTeamName || "-" },
  { key: "matchKey", header: "matchKey", mono: true, className: "text-gray-500", cell: (i) => i.matchKey || "-" },
];

export default function MatchDataByDatePage() {
  const [targetDate, setTargetDate] = useState<string>(todayYmd());
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [response, setResponse] = useState<MatchDataByDateListResponse>({
    targetDate: todayYmd(),
    page: 1,
    size: PAGE_SIZE,
    count: 0,
    totalPages: 0,
    items: [],
  });

  const items = useMemo(() => response.items ?? [], [response.items]);

  const fetchMatchData = async (date: string, nextPage: number) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getJsonSafe<MatchDataByDateListResponse>(`/v1/api/admin/matches/by-date?targetDate=${encodeURIComponent(date)}&page=${nextPage}&size=${PAGE_SIZE}`);

      setResponse({
        targetDate: data.targetDate ?? date,
        page: data.page ?? nextPage,
        size: data.size ?? PAGE_SIZE,
        count: data.count ?? 0,
        totalPages: data.totalPages ?? 0,
        items: Array.isArray(data.items) ? data.items : [],
      });
    } catch (error) {
      console.error(error);
      setResponse({
        targetDate: date,
        page: nextPage,
        size: PAGE_SIZE,
        count: 0,
        totalPages: 0,
        items: [],
      });
      setErrorMessage(error instanceof Error ? error.message : "対戦データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMatchData(targetDate, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 日付を変えたらすぐ1ページ目を読み込む
  const handleChangeDate = (date: string) => {
    setTargetDate(date);
    void fetchMatchData(date, 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (loading) return;
    if (nextPage < 1) return;
    if (response.totalPages > 0 && nextPage > response.totalPages) return;
    void fetchMatchData(targetDate, nextPage);
  };

  const csvCounts = useMemo(() => {
    let created = 0;
    let target = 0;
    items.forEach((i) => {
      if (i.csvStatus === "CREATED") created += 1;
      else if (i.csvStatus === "TARGET") target += 1;
    });
    return { created, target, other: items.length - created - target };
  }, [items]);

  return (
    <div>
      <ConsoleToolbar title="対戦データ検索" info="DBに登録された対戦データを日付ごとに表示">
        <DateStepper value={targetDate} onChange={handleChangeDate} disabled={loading} />
        <ConsoleButton variant="primary" onClick={() => void fetchMatchData(targetDate, response.page || 1)} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      <StatChips
        loading={loading && items.length === 0}
        items={[
          { label: "対象日", value: response.targetDate || "-" },
          { label: "総件数", value: fmtNum(response.count) },
          { label: "このページの作成済", value: fmtNum(csvCounts.created), tone: "ok" },
          { label: "このページの作成可", value: fmtNum(csvCounts.target), tone: "info" },
          { label: "このページの非対象", value: fmtNum(csvCounts.other) },
        ]}
      />

      {errorMessage && <ConsoleNotice tone="ng" title={errorMessage} onClose={() => setErrorMessage("")} />}

      <ConsoleTable
        columns={COLUMNS}
        rows={items}
        rowKey={(i, idx) => `${i.matchKey || "row"}-${idx}`}
        loading={loading}
        emptyText="指定日の対戦データはありません。"
        paging={{ page: response.page || 1, pageSize: response.size || PAGE_SIZE, total: response.count, onChange: handlePageChange }}
      />
    </div>
  );
}
