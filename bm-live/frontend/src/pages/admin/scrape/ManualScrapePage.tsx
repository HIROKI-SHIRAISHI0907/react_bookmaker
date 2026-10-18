import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, Database, Play, RefreshCw, Search } from "lucide-react";
import {
  BadgeTone,
  ConsoleButton,
  ConsoleColumn,
  ConsoleField,
  ConsoleInput,
  ConsoleModal,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleTable,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

type StatExecuteRequest = {
  country?: string;
  league?: string;
  season?: string;
};

type StatExecuteResponse = {
  taskArn?: string;
  batchCd?: string;
};

type StatCountryLeagueOption = {
  country: string;
  leagues: string[];
};

type StatCountryLeagueOptionsResponse = {
  countries: StatCountryLeagueOption[];
};

/** API（サーバ）側のrunMode。dev.web.api.bm_a009.EcsScrapeTaskProgressRequest と一致させる */
type FutureRunMode = "WEEK" | "NEXT_DAY_ONLY" | "SPECIFIC_DATE";

type EcsRunRequest = {
  batchCd: string;
  // 以降は未来データ取得スクレイピング（B005）用のオプション項目
  runMode?: FutureRunMode;
  targetDate?: string;
};

type EcsRunResponse = {
  taskArn?: string;
  batchCd?: string;
};

/** UI側の選択肢。SPECIFIC_DATE を「未来日」「過去日」で分けて選べるようにするための表示用モード */
type FutureRunModeUi = "WEEK" | "NEXT_DAY_ONLY" | "SPECIFIC_DATE_FUTURE" | "SPECIFIC_DATE_PAST";

type ProgressRes = {
  taskId?: string;
  status?: "RUNNING" | "STOPPED" | "NOT_FOUND" | string;
  percent?: number | null;
  teamsDone?: number | null;
  teamsTotal?: number | null;
  logLine?: string | null;
  logTime?: string | null;
  message?: string | null;
};

type S3PrefixScope = "DEFAULT" | "ROOT" | "PARENT" | "CUSTOM";

type S3FileCountRequest = {
  batchCode: string;
  day?: string | null;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
};

type S3FileCountResponse = {
  batchCode?: string;
  bucket?: string | null;
  prefix?: string | null;
  recursive?: boolean | null;
  dayJst?: string | null;
  totalCount?: number | null;
  countOnDay?: number | null;
  message?: string | null;
};

type S3FileListRequest = {
  batchCode: string;
  scope?: S3PrefixScope | null;
  prefixOverride?: string | null;
  recursiveOverride?: boolean | null;
  limit?: number | null;
};

type S3FileItem = {
  key: string;
  size: number;
  lastModifiedIso: string;
};

type S3FileListResponse = {
  batchCode: string;
  bucket: string;
  prefix: string;
  recursive: boolean;
  returnedCount: number;
  message: string;
  items: S3FileItem[];
};

const COUNT_URL = `/v1/api/admin/s3/files/count`;
const LIST_URL = `/v1/api/admin/s3/files/list`;
const RUN_URL = `/v1/api/admin/scrape/ecs/run`;
const STAT_EACH_URL = `/v1/api/stat/each`;
const STAT_OPTIONS_URL = `/v1/api/admin/stat/options`;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body != null ? { "Content-Type": "application/json" } : undefined,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

/** "B010（FinGetting）" -> "B010" のように、括弧（全角/半角）以降を取り除いた「素の」batchCodeを返す */
function toPureBatchCode(code: string): string {
  return code.replace(/[（(].*$/, "").trim();
}

/** "YYYY-MM-DD" 形式に変換するヘルパー（ローカル日時基準） */
function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function statusTone(status?: string): BadgeTone {
  const s = (status ?? "").toUpperCase();
  if (s === "RUNNING") return "ok";
  if (s === "STOPPED") return "neutral";
  if (s === "NOT_FOUND") return "warn";
  if (!s) return "neutral";
  return "info";
}

const BATCH_CODES = [
  "B002（TeamMember）",
  "B003（CountryLeagueSeason）",
  "B004（CountryLeague）",
  "B005（Future）",
  "B007（AllLeague）",
  "B008（RealData）",
  "B009",
  "B010（FinGetting）",
  "B014",
  "B015",
];

const S3_COLUMNS: ConsoleColumn<S3FileItem>[] = [
  { key: "key", header: "key", wrap: true, className: "min-w-[420px] break-all font-mono text-[12px]", cell: (it) => it.key },
  { key: "size", header: "size", align: "right", mono: true, cell: (it) => (typeof it.size === "number" ? it.size.toLocaleString() : "-") },
  { key: "lastModified", header: "lastModifiedIso", mono: true, cell: (it) => it.lastModifiedIso ?? "-" },
];

/** ===================== Page ===================== */
export default function ManualScrapePage() {
  const [batchCode, setBatchCode] = useState(BATCH_CODES[0]);

  const isB007 = batchCode === "B007（AllLeague）";
  const isB014 = batchCode === "B014";
  const isB005 = batchCode === "B005（Future）";

  // API（URL・リクエストボディ）へ渡す際は、表示用の括弧書きを取り除いた「素の」コードを使う
  const pureBatchCode = useMemo(() => toPureBatchCode(batchCode), [batchCode]);

  const [lastTaskArn, setLastTaskArn] = useState<string | null>(null);

  // ===== B007 =====
  const [scope, setScope] = useState<S3PrefixScope>("DEFAULT");
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // ===== B014 =====
  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");

  // ===== B005 =====
  const [futureRunMode, setFutureRunMode] = useState<FutureRunModeUi>("WEEK");
  const [futureTargetDate, setFutureTargetDate] = useState("");

  // 「特定の過去日」モードで選択可能な範囲（今日 〜 7日前）。ブラウザのローカル日時基準。
  const todayDateStr = useMemo(() => toDateInputValue(new Date()), []);
  const minPastDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toDateInputValue(d);
  }, []);

  // 「特定の未来日」モードで選択可能な範囲（明日 〜 7日後）
  const tomorrowDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateInputValue(d);
  }, []);
  const maxFutureDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toDateInputValue(d);
  }, []);

  // UI上の選択肢（過去日/未来日）→ 実際にAPIへ送るrunMode（どちらもSPECIFIC_DATE）
  const toApiRunMode = (mode: FutureRunModeUi): FutureRunMode => (mode === "SPECIFIC_DATE_FUTURE" || mode === "SPECIFIC_DATE_PAST" ? "SPECIFIC_DATE" : mode);

  const isB005SpecificDateMode = futureRunMode === "SPECIFIC_DATE_FUTURE" || futureRunMode === "SPECIFIC_DATE_PAST";

  // 「特定の過去日」「特定の未来日」モードで、選択した日付が許容範囲内かどうか
  const isFutureTargetDateInRange = useMemo(() => {
    if (!futureTargetDate.trim()) return true; // 未入力は別途b005CanRunで弾く
    if (futureRunMode === "SPECIFIC_DATE_PAST") {
      return futureTargetDate >= minPastDateStr && futureTargetDate <= todayDateStr;
    }
    if (futureRunMode === "SPECIFIC_DATE_FUTURE") {
      return futureTargetDate >= tomorrowDateStr && futureTargetDate <= maxFutureDateStr;
    }
    return true;
  }, [futureRunMode, futureTargetDate, minPastDateStr, todayDateStr, tomorrowDateStr, maxFutureDateStr]);

  const futureRunModeLabel = (mode: FutureRunModeUi): string => {
    switch (mode) {
      case "WEEK":
        return "1週間分（従来通り）";
      case "NEXT_DAY_ONLY":
        return "翌日のみ";
      case "SPECIFIC_DATE_FUTURE":
        return "特定の未来日を指定";
      case "SPECIFIC_DATE_PAST":
        return "特定の過去日を指定（終了済試合）";
      default:
        return mode;
    }
  };

  // B005のリクエストボディを組み立てる（他バッチと同じ /ecs/run 宛。batchCd は常に必須）
  const buildFutureRequestBody = (runMode: FutureRunMode, targetDate?: string): EcsRunRequest => ({
    batchCd: pureBatchCode,
    runMode,
    targetDate: runMode === "SPECIFIC_DATE" ? targetDate?.trim() || undefined : undefined,
  });

  // ===== Progress =====
  const progressQuery = useQuery({
    queryKey: ["progress", batchCode],
    queryFn: () => getJson<ProgressRes>(`/v1/api/admin/scrape/ecs/${pureBatchCode}/latest/progress`),
    refetchInterval: 5000,
  });

  const isRunning = useMemo(() => progressQuery.data?.status === "RUNNING", [progressQuery.data]);

  // ===== B014 options =====
  const statOptionsQuery = useQuery({
    queryKey: ["stat-country-league-options"],
    enabled: isB014,
    queryFn: () => getJson<StatCountryLeagueOptionsResponse>(STAT_OPTIONS_URL),
    staleTime: 5 * 60 * 1000,
  });

  const countryOptions = useMemo(() => statOptionsQuery.data?.countries ?? [], [statOptionsQuery.data]);

  const leagueOptions = useMemo(() => {
    const selected = countryOptions.find((x) => x.country === country);
    return selected?.leagues ?? [];
  }, [countryOptions, country]);

  useEffect(() => {
    if (!country) {
      setLeague("");
      return;
    }
    if (!leagueOptions.includes(league)) {
      setLeague("");
    }
  }, [country, leagueOptions, league]);

  useEffect(() => {
    if (!isB014) {
      setCountry("");
      setLeague("");
      setSeason("");
    }
    if (!isB007) {
      setIsMasterModalOpen(false);
    }
    if (!isB005) {
      setFutureRunMode("WEEK");
      setFutureTargetDate("");
    }
  }, [isB014, isB007, isB005]);

  const b014CanRun = !isB014 || (country.trim() !== "" && league.trim() !== "" && !statOptionsQuery.isLoading && !statOptionsQuery.isError);
  const b005CanRun = !isB005 || !isB005SpecificDateMode || (futureTargetDate.trim() !== "" && isFutureTargetDateInRange);

  // ===== B007 request =====
  const countReq = useMemo<S3FileCountRequest>(() => ({ batchCode: pureBatchCode, scope, day: null }), [pureBatchCode, scope]);
  const listReq = useMemo<S3FileListRequest>(() => ({ batchCode: pureBatchCode, scope, limit: 100 }), [pureBatchCode, scope]);

  const s3CountQuery = useQuery({
    queryKey: ["s3-file-count", countReq],
    enabled: isB007,
    queryFn: () => postJson<S3FileCountResponse>(COUNT_URL, countReq),
    refetchInterval: isB007 ? 15000 : false,
  });

  const s3ListQuery = useQuery({
    queryKey: ["s3-file-list", listReq],
    enabled: isB007,
    queryFn: () => postJson<S3FileListResponse>(LIST_URL, listReq),
    refetchInterval: isB007 ? 15000 : false,
  });

  const csvItems = useMemo(() => {
    const items = s3ListQuery.data?.items ?? [];
    return items.filter((it) => it.key.toLowerCase().endsWith(".csv"));
  }, [s3ListQuery.data]);

  const canRegisterMaster = isB007 && csvItems.length === 1;

  // ===== Run =====
  const runMutation = useMutation({
    mutationFn: async () => {
      if (isB014) {
        const body: StatExecuteRequest = {
          country: country.trim() || undefined,
          league: league.trim() || undefined,
          season: season.trim() || undefined,
        };
        return await postJson<StatExecuteResponse>(STAT_EACH_URL, body);
      }

      if (isB005) {
        const body = buildFutureRequestBody(toApiRunMode(futureRunMode), futureTargetDate);
        return await postJson<EcsRunResponse>(RUN_URL, body);
      }

      const body: EcsRunRequest = { batchCd: pureBatchCode };
      return await postJson<EcsRunResponse>(RUN_URL, body);
    },
    onSuccess: async (res) => {
      setLastTaskArn(res?.taskArn ?? null);
      await progressQuery.refetch();
    },
  });

  // B005専用：プルダウンの選択状態に関わらず、即座に「翌日のみ」を実行する
  const nextDayMutation = useMutation({
    mutationFn: async () => {
      const body = buildFutureRequestBody("NEXT_DAY_ONLY");
      return await postJson<EcsRunResponse>(RUN_URL, body);
    },
    onSuccess: async (res) => {
      setLastTaskArn(res?.taskArn ?? null);
      await progressQuery.refetch();
    },
  });

  const masterMutation = useMutation({
    mutationFn: async () => {
      await postJson(`/v1/api/admin/exec/task/all-league-scrape-master`, {});
    },
    onSuccess: async () => {
      setIsMasterModalOpen(false);
      await Promise.all([progressQuery.refetch(), s3CountQuery.refetch(), s3ListQuery.refetch()]);
    },
  });

  const busy = runMutation.isPending || masterMutation.isPending || nextDayMutation.isPending;

  const percent = progressQuery.data?.percent ?? null;
  const percentSafe = Math.min(100, Math.max(0, typeof percent === "number" ? percent : 0));

  const teamsDone = progressQuery.data?.teamsDone ?? null;
  const teamsTotal = progressQuery.data?.teamsTotal ?? null;

  const numText = (v: number | null | undefined) => (typeof v === "number" ? v.toLocaleString() : "-");

  const runButtonDisabled = runMutation.isPending || isRunning || masterMutation.isPending || nextDayMutation.isPending || !b014CanRun || !b005CanRun;

  const runButtonTitle = isRunning
    ? "RUNNING中のため実行できません"
    : isB014 && statOptionsQuery.isLoading
      ? "B014 の選択肢を読み込み中です"
      : isB014 && statOptionsQuery.isError
        ? "B014 の選択肢取得に失敗しています"
        : isB014 && !country.trim()
          ? "B014 は国を選択してください"
          : isB014 && !league.trim()
            ? "B014 はリーグを選択してください"
            : isB005 && isB005SpecificDateMode && !futureTargetDate.trim()
              ? "B005 は対象日を指定してください"
              : isB005 && isB005SpecificDateMode && futureTargetDate.trim() && !isFutureTargetDateInRange
                ? futureRunMode === "SPECIFIC_DATE_PAST"
                  ? `B005 の過去日は ${minPastDateStr} 〜 ${todayDateStr} の範囲で指定してください`
                  : `B005 の未来日は ${tomorrowDateStr} 〜 ${maxFutureDateStr} の範囲で指定してください`
                : undefined;

  const status = progressQuery.data?.status;

  return (
    <div>
      <ConsoleToolbar
        title="スクレイピングCSV情報取得管理"
        info="ECS起動（RUN）と進捗監視"
        description="B005 は特定日（未来 / 過去）・翌日取得、B007 は S3 成果物からマスタ登録まで、B014 は国・リーグ指定実行に対応しています。"
      >
        <StatusBadge tone={statusTone(status)}>{status ?? "-"}</StatusBadge>
        {busy ? <StatusBadge tone="warn">処理中…</StatusBadge> : <StatusBadge tone="neutral">待機中</StatusBadge>}
        <ConsoleButton onClick={() => void progressQuery.refetch()} disabled={busy} loading={progressQuery.isFetching}>
          {!progressQuery.isFetching && <RefreshCw className="h-3.5 w-3.5" />}
          更新
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => runMutation.mutate()} disabled={runButtonDisabled} loading={runMutation.isPending} title={runButtonTitle}>
          {!runMutation.isPending && <Play className="h-3.5 w-3.5" />}
          {isRunning ? "実行中" : "実行"}
        </ConsoleButton>
      </ConsoleToolbar>

      {lastTaskArn && (
        <ConsoleNotice tone="ok" title="直近に起動したタスク" onClose={() => setLastTaskArn(null)}>
          {lastTaskArn}
        </ConsoleNotice>
      )}
      {runMutation.isError && (
        <ConsoleNotice tone="ng" title="起動エラー">
          {(runMutation.error as Error).message}
        </ConsoleNotice>
      )}
      {progressQuery.isError && (
        <ConsoleNotice tone="ng" title="進捗取得エラー">
          {(progressQuery.error as Error).message}
        </ConsoleNotice>
      )}
      {masterMutation.isError && (
        <ConsoleNotice tone="ng" title="マスタ登録エラー">
          {(masterMutation.error as Error).message}
        </ConsoleNotice>
      )}

      {/* ===== 操作 ===== */}
      <ConsolePanel
        title="操作"
        right={
          isB007 ? (
            <>
              <StatusBadge tone={canRegisterMaster ? "ok" : "ng"}>判定: {canRegisterMaster ? "OK（csv=1）" : `NG（csv=${csvItems.length}）`}</StatusBadge>
              <ConsoleButton
                size="sm"
                onClick={() => {
                  void s3CountQuery.refetch();
                  void s3ListQuery.refetch();
                }}
                disabled={busy}
                loading={s3CountQuery.isFetching || s3ListQuery.isFetching}
                title="S3のファイル状況を再取得します"
              >
                {!(s3CountQuery.isFetching || s3ListQuery.isFetching) && <Search className="h-3 w-3" />}
                S3確認
              </ConsoleButton>
              <ConsoleButton
                size="sm"
                variant="danger"
                onClick={() => setIsMasterModalOpen(true)}
                disabled={busy || isRunning || !canRegisterMaster}
                title={isRunning ? "RUNNING中はマスタ登録できません" : !canRegisterMaster ? "S3にcsvがちょうど1つ必要です" : undefined}
              >
                <Database className="h-3 w-3" />
                マスタ登録
              </ConsoleButton>
            </>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-end gap-2.5">
          <ConsoleField label="Batch">
            <ConsoleSelect value={batchCode} onChange={(e) => setBatchCode(e.target.value)} disabled={busy} className="w-56 font-mono">
              {BATCH_CODES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>

          {isB007 && (
            <ConsoleField label="Prefix scope（B007）">
              <ConsoleSelect value={scope} onChange={(e) => setScope(e.target.value as S3PrefixScope)} disabled={busy} className="w-48">
                <option value="DEFAULT">json/（DEFAULT）</option>
                <option value="ROOT">ルート（ROOT）</option>
              </ConsoleSelect>
            </ConsoleField>
          )}

          {isB005 && (
            <>
              <ConsoleField label="実行モード（B005）">
                <ConsoleSelect value={futureRunMode} onChange={(e) => setFutureRunMode(e.target.value as FutureRunModeUi)} disabled={busy} className="w-64">
                  <option value="WEEK">1週間分（従来通り）</option>
                  <option value="NEXT_DAY_ONLY">翌日のみ</option>
                  <option value="SPECIFIC_DATE_FUTURE">特定の未来日を指定</option>
                  <option value="SPECIFIC_DATE_PAST">特定の過去日を指定（終了済試合）</option>
                </ConsoleSelect>
              </ConsoleField>
              {isB005SpecificDateMode && (
                <ConsoleField label="対象日">
                  <ConsoleInput
                    type="date"
                    value={futureTargetDate}
                    onChange={(e) => setFutureTargetDate(e.target.value)}
                    disabled={busy}
                    min={futureRunMode === "SPECIFIC_DATE_PAST" ? minPastDateStr : tomorrowDateStr}
                    max={futureRunMode === "SPECIFIC_DATE_PAST" ? todayDateStr : maxFutureDateStr}
                    className={futureTargetDate && !isFutureTargetDateInRange ? "!border-red-400" : ""}
                  />
                </ConsoleField>
              )}
              <ConsoleButton
                onClick={() => nextDayMutation.mutate()}
                disabled={runMutation.isPending || masterMutation.isPending || isRunning}
                loading={nextDayMutation.isPending}
                title="実行モードの選択に関わらず、翌日分を即時取得します"
              >
                {!nextDayMutation.isPending && <CalendarClock className="h-3.5 w-3.5" />}
                次の日取得
              </ConsoleButton>
            </>
          )}

          {isB014 && (
            <>
              <ConsoleField label="Country（B014）">
                <ConsoleSelect value={country} onChange={(e) => setCountry(e.target.value)} disabled={busy || statOptionsQuery.isLoading} className="w-44">
                  <option value="">選択してください</option>
                  {countryOptions.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </ConsoleSelect>
              </ConsoleField>
              <ConsoleField label="League">
                <ConsoleSelect value={league} onChange={(e) => setLeague(e.target.value)} disabled={busy || statOptionsQuery.isLoading || !country} className="w-48">
                  <option value="">選択してください</option>
                  {leagueOptions.map((lg) => (
                    <option key={lg} value={lg}>
                      {lg}
                    </option>
                  ))}
                </ConsoleSelect>
              </ConsoleField>
              <ConsoleField label="Season（任意）">
                <ConsoleInput value={season} onChange={(e) => setSeason(e.target.value)} disabled={busy} placeholder="例: 2025" className="w-28" />
              </ConsoleField>
            </>
          )}
        </div>

        {/* 補足・実行条件 */}
        <div className="mt-2 text-[11px] text-gray-500">
          {isB005 ? (
            <>
              mode: <b>{futureRunModeLabel(futureRunMode)}</b>
              {isB005SpecificDateMode &&
                (futureRunMode === "SPECIFIC_DATE_PAST"
                  ? ` ／ 過去日は最大7日前（${minPastDateStr} 〜 ${todayDateStr}）まで。Flashscore側の制約で「終了した試合」タブから自動取得します。`
                  : ` ／ 未来日は最大7日後（${tomorrowDateStr} 〜 ${maxFutureDateStr}）まで指定できます。`)}
              {" ／ 「次の日取得」は上の選択に関わらず翌日分を即座に取得します。"}
            </>
          ) : isB007 ? (
            <>scope: {scope}</>
          ) : isB014 ? null : (
            <>進捗は5秒ごとに自動更新します。</>
          )}
        </div>

        {nextDayMutation.isError && (
          <ConsoleNotice tone="ng" title="翌日データ取得エラー" className="mb-0 mt-2.5">
            {(nextDayMutation.error as Error).message}
          </ConsoleNotice>
        )}

        {isB005 && !b005CanRun && (
          <ConsoleNotice tone="warn" title="B005の実行条件" className="mb-0 mt-2.5">
            {isB005SpecificDateMode && futureTargetDate.trim() && !isFutureTargetDateInRange
              ? futureRunMode === "SPECIFIC_DATE_PAST"
                ? `過去日は ${minPastDateStr} 〜 ${todayDateStr} の範囲で指定してください（Flashscore側の制約で最大7日前までしか遡れません）。`
                : `未来日は ${tomorrowDateStr} 〜 ${maxFutureDateStr} の範囲で指定してください。`
              : "「特定の未来日を指定」または「特定の過去日を指定」モードを選んだ場合は、対象日を指定してください。"}
          </ConsoleNotice>
        )}

        {isB014 && statOptionsQuery.isError && (
          <ConsoleNotice tone="ng" title="B014選択肢取得エラー" className="mb-0 mt-2.5">
            {(statOptionsQuery.error as Error).message}
          </ConsoleNotice>
        )}
        {isB014 && !statOptionsQuery.isLoading && !statOptionsQuery.isError && !countryOptions.length && (
          <ConsoleNotice tone="warn" title="B014選択肢なし" className="mb-0 mt-2.5">
            国・リーグの選択肢が取得できませんでした。マスタデータをご確認ください。
          </ConsoleNotice>
        )}
        {isB014 && !b014CanRun && !statOptionsQuery.isLoading && !statOptionsQuery.isError && countryOptions.length > 0 && (
          <ConsoleNotice tone="warn" title="B014の実行条件" className="mb-0 mt-2.5">
            B014を実行するには、国とリーグの両方を選択してください。
          </ConsoleNotice>
        )}
      </ConsolePanel>

      {/* ===== 進捗 ===== */}
      <ConsolePanel
        title="進捗"
        info="5秒ごとに更新"
        right={
          <span className="flex flex-wrap gap-2 font-mono text-[11px] text-gray-500">
            <span>task: {progressQuery.data?.taskId ?? "-"}</span>
            <span>time: {progressQuery.data?.logTime ?? "-"}</span>
          </span>
        }
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-bold tabular-nums text-gray-900">{percent != null ? `${percent.toFixed(1)}%` : "-"}</span>
          <span className="text-xs text-gray-500">
            {percent != null ? (teamsDone != null && teamsTotal != null ? `${teamsDone} / ${teamsTotal} teams` : "") : (progressQuery.data?.message ?? "進捗情報なし")}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full transition-[width] duration-300 ${isRunning ? "bg-indigo-600" : "bg-gray-400"}`} style={{ width: `${percentSafe}%` }} />
        </div>

        {progressQuery.data?.logLine && (
          <div className="mt-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">Latest Log</span>
              <ConsoleButton size="sm" variant="ghost" className="ml-auto" onClick={() => void navigator.clipboard.writeText(String(progressQuery.data?.logLine ?? ""))}>
                <Copy className="h-3 w-3" />
                ログコピー
              </ConsoleButton>
            </div>
            <pre className="m-0 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-200">{progressQuery.data.logLine}</pre>
          </div>
        )}
      </ConsolePanel>

      {/* ===== S3（B007のみ） ===== */}
      {isB007 && (
        <>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-sm font-bold text-gray-900">S3 成果物確認（B007）</h2>
            <span className="font-mono text-[11px] text-gray-500">
              {s3CountQuery.data?.bucket ?? "-"} / {s3CountQuery.data?.prefix ?? "-"}（recursive {String(s3CountQuery.data?.recursive ?? "-")}）
            </span>
          </div>

          {(s3CountQuery.isError || s3ListQuery.isError) && (
            <ConsoleNotice tone="ng" title="S3取得エラー">
              {((s3CountQuery.error as Error)?.message || (s3ListQuery.error as Error)?.message) ?? "unknown"}
            </ConsoleNotice>
          )}

          <StatChips
            loading={s3CountQuery.isLoading}
            items={[
              { label: "Total（prefix配下）", value: numText(s3CountQuery.data?.totalCount) },
              { label: "指定日（countOnDay）", value: numText(s3CountQuery.data?.countOnDay) },
              { label: "CSV files", value: csvItems.length.toLocaleString(), tone: canRegisterMaster ? "ok" : "ng" },
              { label: "Returned（list）", value: numText(s3ListQuery.data?.returnedCount) },
            ]}
          />

          {!canRegisterMaster && <ConsoleNotice tone="warn" title={`マスタ登録するには、S3に csv がちょうど 1つ必要です（現在: ${csvItems.length}）。`} />}

          {(s3CountQuery.data?.message || s3ListQuery.data?.message) && (
            <div className="mb-2 text-[11px] text-gray-600">
              {s3CountQuery.data?.message && (
                <div>
                  <b>count:</b> {s3CountQuery.data.message}
                </div>
              )}
              {s3ListQuery.data?.message && (
                <div>
                  <b>list:</b> {s3ListQuery.data.message}
                </div>
              )}
            </div>
          )}

          <ConsoleTable
            columns={S3_COLUMNS}
            rows={s3ListQuery.data?.items ?? []}
            rowKey={(it) => it.key}
            loading={s3ListQuery.isLoading}
            emptyText="ファイルがありません"
            rowClassName={(it) => (it.key.toLowerCase().endsWith(".csv") ? "!bg-indigo-50/70" : "")}
          />
        </>
      )}

      <div className="mt-3 text-center text-[11px] text-gray-400">取得できない場合は、管理者権限・セッション（credentials: include）・API到達性をご確認ください。</div>

      {/* マスタ登録の確認 */}
      <ConsoleModal
        open={isMasterModalOpen}
        title="マスタ登録"
        onClose={() => {
          if (!masterMutation.isPending) setIsMasterModalOpen(false);
        }}
        busy={masterMutation.isPending}
        width={520}
        footer={
          <div className="ml-auto flex gap-1.5">
            <ConsoleButton onClick={() => setIsMasterModalOpen(false)} disabled={masterMutation.isPending}>
              やめる
            </ConsoleButton>
            <ConsoleButton
              variant="danger"
              onClick={() => masterMutation.mutate()}
              disabled={!canRegisterMaster}
              loading={masterMutation.isPending}
              title={!canRegisterMaster ? "条件を満たしていないため実行できません" : undefined}
            >
              登録する
            </ConsoleButton>
          </div>
        }
      >
        {canRegisterMaster ? (
          <div className="text-[13px] text-gray-700">
            マスタに登録しますか？
            <div className="mt-2 break-all rounded-md bg-gray-50 px-2 py-1.5 font-mono text-xs">{csvItems[0]?.key ?? ""}</div>
          </div>
        ) : (
          <ConsoleNotice tone="warn" title="マスタ登録できません" className="mb-0">
            {`S3に csv がちょうど 1つ必要です（現在: ${csvItems.length}）。`}
          </ConsoleNotice>
        )}
      </ConsoleModal>
    </div>
  );
}
