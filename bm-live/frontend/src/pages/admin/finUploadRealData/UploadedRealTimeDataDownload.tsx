import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import {
  ConsoleButton,
  ConsoleCheck,
  ConsoleColumn,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleTable,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

type UploadedRealTimeDataDownloadItem = {
  fileName: string;
  gameTeamName: string;
  gameProcess: string;
  size: string;
  lastUpdateDate: string;
};

const API_BASE = "/v1/api/admin/real-time-data/upload";
const PAGE_SIZE = 10;

function buildSearchQuery(params: { country: string; league: string; finFlg: boolean; uploadDate: string }) {
  const query = new URLSearchParams();

  if (params.country.trim() !== "") {
    query.set("country", params.country.trim());
  }
  if (params.league.trim() !== "") {
    query.set("league", params.league.trim());
  }
  if (params.finFlg) {
    query.set("finFlg", "true");
  }
  if (params.uploadDate !== "") {
    query.set("uploadDate", params.uploadDate);
  }

  return query.toString();
}

const onDownload = (fileName: string) => {
  const url = `${API_BASE}/download?fileName=${encodeURIComponent(fileName)}`;
  const anchor = document.createElement("a");
  anchor.href = url;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const COLUMNS: ConsoleColumn<UploadedRealTimeDataDownloadItem>[] = [
  { key: "fileName", header: "ファイル名", mono: true, wrap: true, className: "min-w-[220px] break-all", cell: (i) => i.fileName || "-" },
  { key: "game", header: "対戦情報", wrap: true, className: "min-w-[200px]", cell: (i) => i.gameTeamName || "-" },
  {
    key: "process",
    header: "状態",
    cell: (i) => (i.gameProcess === "0" ? <StatusBadge tone="neutral">終了済</StatusBadge> : <StatusBadge tone="ok">対戦中</StatusBadge>),
  },
  { key: "size", header: "サイズ", align: "right", mono: true, cell: (i) => i.size || "-" },
  { key: "lastUpdate", header: "最終更新日時", mono: true, cell: (i) => i.lastUpdateDate || "-" },
  {
    key: "dl",
    header: "",
    align: "right",
    cell: (i) => (
      <ConsoleButton size="sm" onClick={() => onDownload(i.fileName)}>
        <Download className="h-3 w-3" />
        ダウンロード
      </ConsoleButton>
    ),
  },
];

export default function UploadedRealTimeDataDownloadPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [finFlg, setFinFlg] = useState(false);
  const [uploadDate, setUploadDate] = useState("");

  const [items, setItems] = useState<UploadedRealTimeDataDownloadItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  const finishedCount = useMemo(() => items.filter((i) => i.gameProcess === "0").length, [items]);

  const loadInit = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE}/init`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as UploadedRealTimeDataDownloadItem[];
      setItems(json ?? []);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setErrorMessage("一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const queryString = buildSearchQuery({ country, league, finFlg, uploadDate });
      const response = await fetch(`${API_BASE}/search${queryString ? `?${queryString}` : ""}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as UploadedRealTimeDataDownloadItem[];
      setItems(json ?? []);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setErrorMessage("検索に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onClearAndReload = () => {
    setCountry("");
    setLeague("");
    setFinFlg(false);
    setUploadDate("");
    void loadInit();
  };

  useEffect(() => {
    void loadInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <ConsoleToolbar title="アップロード済リアルタイムデータ参照" info="S3にアップロードされている試合ごとのzipファイルを検索・ダウンロード" />

      {errorMessage && <ConsoleNotice tone="ng" title={errorMessage} onClose={() => setErrorMessage("")} />}

      <ConsolePanel title="検索条件">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSearch();
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <ConsoleField label="国">
            <ConsoleInput type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="例: Japan" className="w-40" />
          </ConsoleField>
          <ConsoleField label="リーグ">
            <ConsoleInput type="text" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="例: J1" className="w-40" />
          </ConsoleField>
          <ConsoleField label="アップロード日">
            <ConsoleInput type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
          </ConsoleField>
          <ConsoleCheck checked={finFlg} onChange={setFinFlg}>
            終了済のみ
          </ConsoleCheck>
          <ConsoleButton type="submit" variant="primary" loading={loading}>
            {!loading && <Search className="h-3.5 w-3.5" />}
            検索
          </ConsoleButton>
          <ConsoleButton onClick={onClearAndReload} disabled={loading}>
            条件クリア
          </ConsoleButton>
        </form>
      </ConsolePanel>

      <StatChips
        loading={loading && items.length === 0}
        items={[
          { label: "件数", value: items.length },
          { label: "終了済", value: finishedCount },
          { label: "対戦中", value: items.length - finishedCount, tone: items.length - finishedCount > 0 ? "ok" : "default" },
        ]}
      />

      <ConsoleTable
        columns={COLUMNS}
        rows={pagedItems}
        rowKey={(i, idx) => `${i.fileName}-${idx}`}
        loading={loading}
        emptyText="該当するデータはありません。"
        paging={{ page: currentPage, pageSize: PAGE_SIZE, total: items.length, onChange: setCurrentPage }}
      />
    </div>
  );
}
