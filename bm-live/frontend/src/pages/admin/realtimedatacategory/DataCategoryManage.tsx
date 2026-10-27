import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, RefreshCw, Search, Upload } from "lucide-react";
import { getAccessToken, getTokenType } from "../../../utils/auth";
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
  type BadgeTone,
} from "../../../api/commonAdminDesign";

/** =========================
 * API base path
 * バックエンド側の context-path (/v1) を含めた基点。
 * パスを変更する場合はここだけ直せば全箇所に反映される。
 * ========================= */
const API_BASE = "/v1/api/real-time-data";

/** 一括アップロード用フォーマット（表示中のデータ入り）のダウンロード */
const FORMAT_URL = "/v1/api/admin/csv/upload/dataCategory/format";

/** 一括アップロード画面 */
const BULK_UPLOAD_PATH = "/admin/csv-upload/data-category";

/** 一覧の1ページあたりの表示件数（表にしたので5件 → 20件に増やしています） */
const PAGE_SIZE = 20;

/** 国リーグ候補の表示上限（これを超える分は「+N」） */
const MAX_CANDIDATES_SHOWN = 2;

/** 国リーグ（マスタ照合）の判定（バックエンド LeagueCandidateResolver と同じ値） */
type LeagueCheck = "一致" | "不一致" | "混在" | "不明";

/** シーズン期間の判定（バックエンド SeasonPeriodChecker と同じ値）。
 *  static_data.record_time が country_league_season_master のシーズン（開始の1日前〜終了の7日後）に入っているか */
type SeasonCheck = "期間内" | "期間外" | "期間不明";

const LEAGUE_CHECK_TONE: Record<LeagueCheck, BadgeTone> = {
  一致: "ok",
  不一致: "ng",
  混在: "warn",
  不明: "neutral",
};

/** 一覧の絞り込みタブ */
type ViewFilter = "all" | "mismatch" | "mixed" | "noRound";

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
  /** グルーピング件数 */
  cnt?: number | null;
  /** home/away 単位の国リーグ判定（一致 / 不一致 / 混在 / 不明） */
  leagueCheck?: LeagueCheck | null;
  /** 「国: リーグ」の候補（一致・不一致は1件、混在は2件以上） */
  leagueCandidates?: string[] | null;
  /** グループの最初・最後の記録日時（static_data.record_time。日本時間。手動取得の行は除く） */
  minRecordTime?: string | null;
  maxRecordTime?: string | null;
  /** 手動取得（add_manual_flg = 1）の行の最後の記録日時（取り直した日） */
  maxManualRecordTime?: string | null;
  /** シーズン期間の判定（期間内 / 期間外 / 期間不明） */
  seasonCheck?: SeasonCheck | null;
  /** 判定の説明（例: 期間内（2026-02-14〜2026-12-06）） */
  seasonLabel?: string | null;
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
  leagueCheck: LeagueCheck | null;
  leagueCandidates: string[];
  categories: Array<{
    dataCategory: string;
    formattedDataCategory: string | null;
    cnt: number | null;
    seasonCheck: SeasonCheck | null;
    seasonLabel: string | null;
    minRecordTime: string | null;
    maxRecordTime: string | null;
    maxManualRecordTime: string | null;
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

/** フォーマットの 1 行（dev.web.api.bm_a031.DataCategoryFormatRequest.Row に対応） */
type DataCategoryFormatRow = {
  homeTeamName: string;
  awayTeamName: string;
  currentDataCategory: string;
  newDataCategory: string;
  count: number | null;
  leagueCheck: string | null;
  leagueCandidates: string[];
  format: string;
};

/** ログイン中の JWT（CSV アップロード画面と同じ） */
function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `${getTokenType() || "Bearer"} ${token}` };
}

/** Content-Disposition からファイル名を取る */
function fileNameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* 次を試す */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}

/** 表示中のデータ入りのフォーマット（dataCategory_〇〇.zip）をダウンロードする。保存したファイル名を返す */
async function downloadDataCategoryFormat(rows: DataCategoryFormatRow[]): Promise<string> {
  const res = await fetch(FORMAT_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(res.status === 401 ? "ログインの有効期限が切れている可能性があります。ログインし直してください。" : `HTTP ${res.status}: ${text.slice(0, 200) || res.statusText}`);
  }
  const blob = await res.blob();
  const name = fileNameFromDisposition(res.headers.get("content-disposition"), "dataCategory_format.zip");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return name;
}

/** 参考の列の値をつなぐ（空は省く） */
function joinNote(...parts: string[]): string {
  return parts.filter((p) => p !== "").join(" / ");
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

/** グループ内のいずれかの dataCategory に「ラウンド」が付いていない場合 true（＝更新が必要 = 優先表示） */
function groupNeedsRoundUpdate(group: MatchGroup): boolean {
  if (group.categories.length === 0) return true;
  return group.categories.some((c) => !(c.dataCategory || "").includes("ラウンド"));
}

/**
 * 「国: リーグ - ラウンド N」の形（web の CsvRowValidator.CATEGORY_PAT・B015 と同じ）。
 * 「:」「-」・スペース・数字は半角、「: 」と「 - 」のスペースは 1 つ。
 */
const CATEGORY_PAT = /^[^:：\s　](?:[^:：]*[^:：\s　])?: [^\s　](?:.*[^\s　])? - ラウンド [0-9]+$/;

/** dataCategory が「国: リーグ - ラウンド N」の形か */
function isCategoryFormat(category: string): boolean {
  return CATEGORY_PAT.test((category || "").trim());
}

/** 仮の値（国が XXX またはリーグが YYY。例: XXX: YYY - ラウンド 0）。B015 の isPlaceholderCategory と同じ */
function isPlaceholderCategory(category: string): boolean {
  const n = (category || "").normalize("NFKC");
  const colon = n.indexOf(":");
  if (colon < 0) return false;
  const country = n.slice(0, colon).trim();
  const rest = n.slice(colon + 1).trim();
  const dash = rest.indexOf(" - ");
  const league = (dash >= 0 ? rest.slice(0, dash) : rest).trim();
  return country.toUpperCase() === "XXX" || league.toUpperCase() === "YYY";
}

/** 正しく設定済みの dataCategory か（「国: リーグ - ラウンド N」の形で、仮の値でない）。直す必要がない */
function isValidCategory(category: string): boolean {
  return isCategoryFormat(category) && !isPlaceholderCategory(category);
}

/** グループ内に直す必要がある dataCategory があるか（形式になっていない・仮の値・カテゴリなし） */
function groupHasBadFormat(g: MatchGroup): boolean {
  if (g.categories.length === 0) return true;
  return g.categories.some((c) => !isValidCategory(c.dataCategory));
}

/** 並べ替え用の比較キー（全角・半角とスペースの揺れをそろえる） */
function sortKey(s: string): string {
  return (s || "").normalize("NFKC").replace(/\s+/g, "");
}

/** dataCategory の「国: リーグ」部分（「 - ラウンド N」を外したもの） */
function leagueOfCategory(category: string): string {
  const cat = (category || "").trim();
  const idx = cat.indexOf(" - ");
  return idx >= 0 ? cat.slice(0, idx) : cat;
}

/**
 * 形は正しいが、国リーグがマスタの候補と合わない dataCategory か。
 * マスタの候補が無い（不明）ときは判定できないので false。
 */
function isLeagueMismatchCategory(g: MatchGroup, category: string): boolean {
  if (g.leagueCandidates.length === 0) return false;
  const league = sortKey(leagueOfCategory(category));
  return !g.leagueCandidates.some((c) => sortKey(c) === league);
}

/**
 * グループの「国: リーグ」（並べ替え用）。
 * マスタの候補が 1 件ならそれ、無ければ dataCategory から「 - ラウンド N」を外したもの。分からなければ空文字。
 */
function groupLeagueOf(g: MatchGroup): string {
  if (g.leagueCandidates.length === 1) return g.leagueCandidates[0];
  for (const c of g.categories) {
    const cat = (c.dataCategory || "").trim();
    if (!cat) continue;
    const idx = cat.indexOf(" - ");
    return idx >= 0 ? cat.slice(0, idx) : cat;
  }
  return g.leagueCandidates[0] ?? "";
}

/** 文字列の比較（空は最後） */
function compareText(a: string, b: string): number {
  if (!a && b) return 1;
  if (a && !b) return -1;
  return a.localeCompare(b, "ja");
}

/**
 * 一覧・フォーマットの並び順
 * 1. 同じ国リーグ（国リーグ順）
 * 2. 同じホームチーム（ホームチーム順）
 * 3. 「国: リーグ - ラウンド N」になっていないものを先に
 * （同じなら アウェーチーム順）
 */
function compareGroups(a: MatchGroup, b: MatchGroup): number {
  const league = compareText(sortKey(groupLeagueOf(a)), sortKey(groupLeagueOf(b)));
  if (league !== 0) return league;
  const home = compareText(sortKey(a.homeTeamName), sortKey(b.homeTeamName));
  if (home !== 0) return home;
  const bad = Number(groupHasBadFormat(b)) - Number(groupHasBadFormat(a));
  if (bad !== 0) return bad;
  return compareText(sortKey(a.awayTeamName), sortKey(b.awayTeamName));
}

/** 「国: リーグ - ラウンド N」から「 - ラウンド N」部分を取り出す（無ければ空文字） */
function roundPartOf(category: string): string {
  const idx = category.indexOf(" - ");
  return idx >= 0 ? category.slice(idx) : "";
}

/** グループ内の dataCategory から、ラウンド付きのものがあればそのラウンド部分を返す */
function currentRoundPart(g: MatchGroup): string {
  for (const c of g.categories) {
    const r = roundPartOf(c.dataCategory);
    if (r.includes("ラウンド")) return r;
  }
  return "";
}

/** 候補（国: リーグ）に今のラウンドを付けた値 */
function candidateWithRound(g: MatchGroup, candidate: string): string {
  return candidate + currentRoundPart(g);
}

/** 入力欄の初期値: 不一致なら候補＋今のラウンド、1件だけならその値 */
function defaultEditValue(g: MatchGroup): string {
  if (g.leagueCheck === "不一致" && g.leagueCandidates.length === 1) {
    return candidateWithRound(g, g.leagueCandidates[0]);
  }
  return g.categories.length === 1 ? g.categories[0].dataCategory : "";
}

function matchesView(g: MatchGroup, v: ViewFilter): boolean {
  switch (v) {
    case "mismatch":
      return g.leagueCheck === "不一致";
    case "mixed":
      return g.leagueCheck === "混在";
    case "noRound":
      return groupNeedsRoundUpdate(g);
    default:
      return true;
  }
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
        leagueCheck: row.leagueCheck ?? null,
        leagueCandidates: row.leagueCandidates ?? [],
        categories: [],
      };
      map.set(key, group);
    }

    if (row.dataCategory) {
      group.categories.push({
        dataCategory: row.dataCategory,
        formattedDataCategory: row.formattedDataCategory ?? null,
        cnt: row.cnt ?? null,
        seasonCheck: row.seasonCheck ?? null,
        seasonLabel: row.seasonLabel ?? null,
        minRecordTime: row.minRecordTime ?? null,
        maxRecordTime: row.maxRecordTime ?? null,
        maxManualRecordTime: row.maxManualRecordTime ?? null,
      });
    }

    if (!group.categoryFormatIcon && row.categoryFormatIcon) {
      group.categoryFormatIcon = row.categoryFormatIcon;
    }
    if (!group.leagueCheck && row.leagueCheck) {
      group.leagueCheck = row.leagueCheck;
      group.leagueCandidates = row.leagueCandidates ?? [];
    }
  }

  // グループ内のカテゴリも「国: リーグ - ラウンド N」になっていないものを先に
  for (const g of map.values()) {
    g.categories.sort((x, y) => Number(isValidCategory(x.dataCategory)) - Number(isValidCategory(y.dataCategory)));
  }

  // 表示順（フォーマットのダウンロードも同じ順）: 同じ国リーグ → 同じホームチーム → 形式になっていないものを先に
  return Array.from(map.values()).sort(compareGroups);
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
  /** 絞り込みタブ */
  const [view, setView] = useState<ViewFilter>("all");

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

  /** 一括アップロード用フォーマットのダウンロード状態 */
  const [formatState, setFormatState] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false });

  const abortRef = useRef<AbortController | null>(null);

  /** ホーム・アウェーのどちらか一方だけでも絞り込める */
  const isFiltered = homeFilter.trim().length > 0 || awayFilter.trim().length > 0;

  const apiUrl = useMemo(() => {
    if (isFiltered) {
      const params = new URLSearchParams();
      if (homeFilter.trim()) params.set("homeTeamName", homeFilter.trim());
      if (awayFilter.trim()) params.set("awayTeamName", awayFilter.trim());
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
    const formatMixedCount = groups.filter((g) => g.categoryFormatIcon === "混在").length;
    const needsCount = groups.filter(groupNeedsRoundUpdate).length;
    const mismatchCount = groups.filter((g) => g.leagueCheck === "不一致").length;
    const leagueMixedCount = groups.filter((g) => g.leagueCheck === "混在").length;
    const unknownCount = groups.filter((g) => g.leagueCheck === "不明").length;
    return { groupCount: groups.length, formatMixedCount, needsCount, mismatchCount, leagueMixedCount, unknownCount };
  }, [groups]);

  /** タブで絞り込んだ一覧 */
  const viewGroups = useMemo(() => groups.filter((g) => matchesView(g, view)), [groups, view]);

  useEffect(() => {
    setPage(1);
  }, [view]);

  const totalPages = Math.max(1, Math.ceil(viewGroups.length / PAGE_SIZE));

  /** 更新後の再取得などで件数が減り、現在ページが範囲外になった場合に補正する */
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedGroups = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return viewGroups.slice(start, start + PAGE_SIZE);
  }, [viewGroups, page]);

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
    const newCategory = (editValues[group.key] ?? defaultEditValue(group)).trim();

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
        setEditValues((prev) => {
          const next = { ...prev };
          delete next[group.key];
          return next;
        });
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

  /**
   * 表示中のデータ（検索・タブで絞り込んだ全ページ分。画面の並び順のまま）をフォーマットの行にする。
   * この画面は不正な形式を直すためのものなので、正しく設定済みの dataCategory（「国: リーグ - ラウンド N」で仮の値でない）の行は入れない。
   * ただし形が正しくても国リーグがマスタと合わない行は入れる（修正前と修正後が同じ行は入れない）。
   * country_league_season_master のシーズン期間外（記録日時がシーズンの開始の1日前〜終了の7日後に1日も入らない）の行も入れない
   * （前のシーズンのデータを巻き込まない）。シーズンが未登録などで判定できない行は入れる。
   * 1 行 = ホーム・アウェー・現在の dataCategory。「新しい dataCategory」には画面で入力中の値を入れる
   * （処理区分は、新しい値が今と違う行だけサーバー側で 2 にする）。
   */
  const { formatRows, seasonExcludedCount } = useMemo(() => {
    const out: DataCategoryFormatRow[] = [];
    let excluded = 0;
    for (const g of viewGroups) {
      const next = (editValues[g.key] ?? defaultEditValue(g)).trim();
      const base = {
        homeTeamName: g.homeTeamName,
        awayTeamName: g.awayTeamName,
        newDataCategory: next,
        leagueCheck: g.leagueCheck,
        leagueCandidates: g.leagueCandidates,
      };
      if (g.categories.length === 0) {
        out.push({ ...base, currentDataCategory: "", count: null, format: "" });
        continue;
      }
      for (const c of g.categories) {
        const same = next !== "" && sortKey(next) === sortKey(c.dataCategory);
        const valid = isValidCategory(c.dataCategory);
        // 形は正しい: 国リーグがマスタと合わないものだけ。修正前と修正後が同じなら入れない
        if (valid && (!isLeagueMismatchCategory(g, c.dataCategory) || same)) continue;
        // シーズン期間外（前のシーズンなど）は入れない
        if (c.seasonCheck === "期間外") {
          excluded++;
          continue;
        }
        const season = c.seasonLabel ? `シーズン: ${c.seasonLabel}` : "";
        if (valid) {
          out.push({ ...base, currentDataCategory: c.dataCategory, count: c.cnt, format: joinNote("国リーグ不一致", season) });
          continue;
        }
        // 形になっていない・仮の値: 直す必要があるので必ず入れる。
        // 新しい値が今と同じ（画面の初期値がそのまま）なら空欄にして、書いてもらう
        out.push({
          ...base,
          newDataCategory: same ? "" : next,
          currentDataCategory: c.dataCategory,
          count: c.cnt,
          format: joinNote(c.formattedDataCategory ? "形式一致" : "形式不一致", season),
        });
      }
    }
    return { formatRows: out, seasonExcludedCount: excluded };
  }, [viewGroups, editValues]);

  const handleDownloadFormat = async () => {
    if (formatRows.length === 0) {
      setFormatState({
        loading: false,
        error:
          "表示中のデータに、直す必要がある dataCategory（「国: リーグ - ラウンド N」になっていないもの・仮の値・国リーグがマスタと合わないもの）がありません。" +
          (seasonExcludedCount > 0 ? `（シーズン期間外の ${seasonExcludedCount} 行は入れていません）` : ""),
      });
      return;
    }
    setFormatState({ loading: true });
    try {
      const name = await downloadDataCategoryFormat(formatRows);
      const excludedNote = seasonExcludedCount > 0 ? ` シーズン期間外の ${seasonExcludedCount} 行は入れていません。` : "";
      setFormatState({ loading: false, success: `${name} をダウンロードしました（${formatRows.length} 行）。${excludedNote}変える行の処理区分を 2 にして、同じ名前のまま zip にし直し、一括アップロード画面からアップロードしてください。` });
    } catch (e: any) {
      setFormatState({ loading: false, error: e?.message ?? String(e) });
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
            {groupNeedsRoundUpdate(g) ? <StatusBadge tone="ng">ラウンドなし</StatusBadge> : <StatusBadge tone="neutral">ラウンドあり</StatusBadge>}
            {g.categoryFormatIcon === "混在" ? (
              <StatusBadge tone="warn" dot={false}>
                形式混在
              </StatusBadge>
            ) : g.categoryFormatIcon === "同一カテゴリ名" ? (
              <StatusBadge tone="ok" dot={false}>
                形式統一
              </StatusBadge>
            ) : null}
          </div>
        </>
      ),
    },
    {
      key: "league",
      header: "国リーグ（マスタ照合）",
      wrap: true,
      className: "min-w-[220px]",
      cell: (g) => {
        if (!g.leagueCheck) return <span className="text-xs text-gray-400">-</span>;
        const shown = g.leagueCandidates.slice(0, MAX_CANDIDATES_SHOWN);
        const rest = g.leagueCandidates.length - shown.length;
        return (
          <div className="grid gap-1">
            <div>
              <StatusBadge tone={LEAGUE_CHECK_TONE[g.leagueCheck] ?? "neutral"}>{g.leagueCheck}</StatusBadge>
            </div>
            {shown.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {shown.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleEditChange(g.key, candidateWithRound(g, c))}
                    title="クリックで「新しい dataCategory」に入れます（今のラウンドを付けます）"
                    className={[
                      "rounded-md border px-1.5 py-0.5 text-left text-[11px] font-bold transition-colors",
                      g.leagueCheck === "不一致"
                        ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                        : g.leagueCheck === "混在"
                          ? "border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                ))}
                {rest > 0 && (
                  <span className="self-center text-[11px] text-gray-400" title={g.leagueCandidates.slice(MAX_CANDIDATES_SHOWN).join(" / ")}>
                    +{rest}
                  </span>
                )}
              </div>
            )}
            {g.leagueCheck === "混在" && <div className="text-[10.5px] text-amber-700">同名チームが複数の国リーグにあり、自動では決められません</div>}
            {g.leagueCheck === "不明" && <div className="text-[10.5px] text-gray-400">マスタにどちらのチームもありません</div>}
          </div>
        );
      },
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
                {c.seasonCheck === "期間外" && (
                  <span title={`${c.seasonLabel ?? ""} 最終記録 ${c.maxRecordTime ?? (c.maxManualRecordTime ? `${c.maxManualRecordTime}（手動取得）` : "-")}（一括アップロード用フォーマットには入れない）`}>
                    <StatusBadge tone="neutral" dot={false}>
                      シーズン期間外
                    </StatusBadge>
                  </span>
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
        const editValue = editValues[g.key] ?? defaultEditValue(g);
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
      <ConsoleToolbar title="データカテゴリ統一管理" info="home / away の組み合わせ単位で dataCategory を確認・上書き">
        <ConsoleButton onClick={() => void handleDownloadFormat()} loading={formatState.loading} disabled={loading || formatRows.length === 0}>
          {!formatState.loading && <Download className="h-3.5 w-3.5" />}
          一括アップロード用フォーマット（直す対象 {formatRows.length} 行{seasonExcludedCount > 0 ? ` ・期間外 ${seasonExcludedCount} 行は除く` : ""}）
        </ConsoleButton>
        <Link
          to={BULK_UPLOAD_PATH}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-[13px] font-bold text-gray-800 no-underline hover:bg-gray-50"
        >
          <Upload className="h-3.5 w-3.5" />
          一括アップロード画面へ
        </Link>
        <ConsoleButton variant="primary" onClick={() => void doFetch()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      {formatState.error && (
        <ConsoleNotice tone="ng" title="フォーマットをダウンロードできませんでした" onClose={() => setFormatState({ loading: false })}>
          {formatState.error}
        </ConsoleNotice>
      )}
      {formatState.success && (
        <ConsoleNotice tone="ok" title="一括アップロード用フォーマット" onClose={() => setFormatState({ loading: false })}>
          {formatState.success}
        </ConsoleNotice>
      )}

      {error && (
        <ConsoleNotice tone="ng" title="取得に失敗しました" onClose={() => setError(null)}>
          {error}
        </ConsoleNotice>
      )}

      <ConsolePanel title="検索条件" info="ホーム・アウェーのどちらか一方だけでも絞り込めます。未入力で検索すると全件表示に戻ります">
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
          { label: "国リーグ不一致", value: stats.mismatchCount, tone: stats.mismatchCount > 0 ? "ng" : "ok" },
          { label: "国リーグ混在", value: stats.leagueMixedCount, tone: stats.leagueMixedCount > 0 ? "warn" : "default" },
          { label: "マスタ不明", value: stats.unknownCount },
          { label: "ラウンドなし", value: stats.needsCount, tone: stats.needsCount > 0 ? "ng" : "ok" },
          { label: "形式混在", value: stats.formatMixedCount, tone: stats.formatMixedCount > 0 ? "warn" : "default" },
        ]}
      />

      <div className="mb-2">
        <SegmentedTabs<ViewFilter>
          value={view}
          onChange={setView}
          options={[
            { value: "all", label: "すべて", count: stats.groupCount },
            { value: "mismatch", label: "不一致", count: stats.mismatchCount },
            { value: "mixed", label: "混在", count: stats.leagueMixedCount },
            { value: "noRound", label: "ラウンドなし", count: stats.needsCount },
          ]}
        />
      </div>

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
        rowClassName={(g) => (selectedKeys.has(g.key) ? "!bg-indigo-50" : g.leagueCheck === "不一致" ? "bg-red-50/60" : "")}
        paging={{ page, pageSize: PAGE_SIZE, total: viewGroups.length, onChange: setPage }}
      />
      <div className="mt-1.5 text-[11px] text-gray-400">
        国リーグ不一致 → 国リーグ混在 → ラウンドなし の順に表示しています。候補をクリックすると「新しい dataCategory」に入ります（今のラウンドを付けます）。Enter でも更新できます。
      </div>
    </div>
  );
}
