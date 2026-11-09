// サブリーグ保有国リーグ登録設定  /admin/sub-league-season（2026-11-09 追加）
//  GET / POST /v1/api/admin/sub-league-season、POST /v1/api/admin/sub-league-season/skip
//  コロンビア・ペルー・メキシコなど、サブリーグ（アペルトゥーラ／クラウスラ など）単位でシーズンが分かれている 国・リーグ を登録する。
//  対象はシーズンデータ（country_league_season_master）の 国・リーグ。期間はシーズン期間の画面で管理するので、ここでは名前だけ持つ。
//  未設定の 国・リーグ が残っている間は、ほかの管理画面は開けない（未対応チェック SUB_LEAGUE_UNSET）。
//  サブリーグが無い国だけなら「設定しない」で、未設定を全部「サブリーグなし」にできる。
//  ※ チームをサブリーグへ割り当てる「サブリーグ名反映設定」（/admin/sub-league）とは別の画面。
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, RefreshCw, RotateCcw, Save } from "lucide-react";
import {
  fetchSubLeagueSeasons,
  saveSubLeagueSeasons,
  skipSubLeagueSeasons,
  MAX_SUB_LEAGUE_NAME_LENGTH,
  MAX_SUB_LEAGUES,
  type SubLeagueSeasonEntity,
  type SubLeagueSeasonItem,
  type SubLeagueSeasonSaveResponse,
  type SubLeagueStatus,
} from "../../../api/subLeagueSeason/subLeagueSeason";
import {
  ConsoleButton,
  ConsoleCellInput,
  ConsoleField,
  ConsoleModal,
  ConsoleNotice,
  ConsoleSelect,
  ConsoleTable,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
  type ConsoleColumn,
} from "../../../api/commonAdminDesign";
import { SETUP_STATUS_QUERY_KEY } from "../SetupGate";

const QUERY_KEY = ["admin-sub-league-season"];

type Row = SubLeagueSeasonEntity & {
  key: string;
  /** 選んでいる状態 */
  inputStatus: SubLeagueStatus;
  /** 入力中のサブリーグ名（「、」「,」・改行区切り） */
  inputNames: string;
};

const keyOf = (country: string, league: string) => `${country}||${league}`;

/** 入力 → サブリーグ名の並び（空は除く） */
const parseNames = (text: string) =>
  text
    .split(/[,、，\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const joinNames = (names: string[]) => names.join("、");

function isDirty(r: Row): boolean {
  if (r.inputStatus !== r.status) return true;
  if (r.inputStatus === "HAS") return joinNames(parseNames(r.inputNames)) !== joinNames(r.subLeagues);
  return false;
}

function toRows(items: SubLeagueSeasonEntity[]): Row[] {
  return items.map((e) => ({ ...e, key: keyOf(e.country, e.league), inputStatus: e.status, inputNames: joinNames(e.subLeagues) }));
}

/** 行の入力チェック（エラーが無ければ null） */
function validate(r: Row): string | null {
  if (r.inputStatus !== "HAS") return null;
  const names = parseNames(r.inputNames);
  if (names.length === 0) return "サブリーグありのときは、サブリーグ名を 1 つ以上入力してください";
  if (names.length > MAX_SUB_LEAGUES) return `サブリーグは ${MAX_SUB_LEAGUES} 個までです`;
  const long = names.find((n) => n.length > MAX_SUB_LEAGUE_NAME_LENGTH);
  if (long) return `サブリーグ名は ${MAX_SUB_LEAGUE_NAME_LENGTH} 文字以内で入力してください（${long}）`;
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) return `サブリーグ名「${dup}」が重複しています`;
  return null;
}

const STATUS_LABEL: Record<SubLeagueStatus, string> = { UNSET: "未設定", HAS: "サブリーグあり", NONE: "サブリーグなし" };

export default function SubLeagueSeasonPage() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [country, setCountry] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | SubLeagueStatus>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [skipOpen, setSkipOpen] = useState(false);

  const q = useQuery({ queryKey: QUERY_KEY, queryFn: fetchSubLeagueSeasons });

  useEffect(() => {
    if (q.data) setRows(toRows(q.data));
  }, [q.data]);

  /** 保存・設定しない の後: 一覧を差し替えて、管理画面の入口チェック（ブロック）も取り直す */
  const applyResult = (res: SubLeagueSeasonSaveResponse, text: string) => {
    setErrors([]);
    setMessage(text);
    queryClient.setQueryData(QUERY_KEY, res.items);
    void queryClient.invalidateQueries({ queryKey: SETUP_STATUS_QUERY_KEY });
  };

  const onError = (err: unknown) => {
    setMessage("");
    setErrors((err instanceof Error ? err.message : "保存中にエラーが発生しました").split("\n"));
  };

  const saveMutation = useMutation({
    mutationFn: saveSubLeagueSeasons,
    onSuccess: (res) => applyResult(res, `保存しました（${res.updatedLeagues} リーグ）`),
    onError,
  });

  const skipMutation = useMutation({
    mutationFn: skipSubLeagueSeasons,
    onSuccess: (res) => {
      setSkipOpen(false);
      applyResult(res, `未設定の ${res.updatedLeagues} リーグを「サブリーグなし」にしました`);
    },
    onError: (err) => {
      setSkipOpen(false);
      onError(err);
    },
  });

  const busy = saveMutation.isPending || skipMutation.isPending;

  const countries = useMemo(() => Array.from(new Set(rows.map((r) => r.country))).sort((a, b) => a.localeCompare(b, "ja")), [rows]);

  const filtered = useMemo(
    () => rows.filter((r) => (!country || r.country === country) && (!statusFilter || r.inputStatus === statusFilter)),
    [rows, country, statusFilter],
  );

  const counts = useMemo(
    () => ({
      unset: rows.filter((r) => r.status === "UNSET").length,
      has: rows.filter((r) => r.status === "HAS").length,
      none: rows.filter((r) => r.status === "NONE").length,
      dirty: rows.filter(isDirty).length,
    }),
    [rows],
  );

  const setRow = (key: string, patch: Partial<Row>) => {
    setMessage("");
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const resetAll = () => {
    setMessage("");
    setErrors([]);
    setRows((prev) => prev.map((r) => ({ ...r, inputStatus: r.status, inputNames: joinNames(r.subLeagues) })));
  };

  const handleSave = () => {
    setMessage("");
    const changed = rows.filter(isDirty);
    if (changed.length === 0) {
      setErrors(["変更がありません"]);
      return;
    }
    const errs: string[] = [];
    const items: SubLeagueSeasonItem[] = [];
    changed.forEach((r) => {
      if (r.inputStatus === "UNSET") {
        errs.push(`${r.country} / ${r.league}: 「サブリーグあり」か「サブリーグなし」を選んでください`);
        return;
      }
      const e = validate(r);
      if (e) {
        errs.push(`${r.country} / ${r.league}: ${e}`);
        return;
      }
      items.push({
        country: r.country,
        league: r.league,
        hasSubLeague: r.inputStatus === "HAS",
        subLeagues: r.inputStatus === "HAS" ? parseNames(r.inputNames) : [],
      });
    });
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    saveMutation.mutate(items);
  };

  const columns: ConsoleColumn<Row>[] = [
    { key: "country", header: "国", cell: (r) => r.country },
    { key: "league", header: "リーグ", cell: (r) => <span className="font-bold">{r.league}</span> },
    {
      key: "has",
      header: "サブリーグ",
      className: "py-1",
      cell: (r) => (
        <ConsoleSelect
          value={r.inputStatus}
          onChange={(e) => setRow(r.key, { inputStatus: e.target.value as SubLeagueStatus })}
          className={`w-36 ${isDirty(r) ? "!border-amber-300 !bg-amber-50" : ""}`}
          data-testid={`select-sub-league-${r.key}`}
        >
          {/* 一度決めた 国・リーグ は未設定に戻せない */}
          {r.status === "UNSET" && <option value="UNSET">未設定</option>}
          <option value="HAS">サブリーグあり</option>
          <option value="NONE">サブリーグなし</option>
        </ConsoleSelect>
      ),
    },
    {
      key: "names",
      header: "サブリーグ名（「、」区切り・表示順）",
      className: "py-1",
      cell: (r) => {
        if (r.inputStatus !== "HAS") return <span className="text-gray-400">-</span>;
        const invalid = validate(r) != null;
        return (
          <ConsoleCellInput
            value={r.inputNames}
            dirty={isDirty(r)}
            placeholder="例: アペルトゥーラ、クラウスラ"
            onChange={(e) => setRow(r.key, { inputNames: e.target.value })}
            className={`!min-w-[280px] w-full ${invalid ? "!border-red-400 !bg-red-50" : ""}`}
            data-testid={`input-sub-league-names-${r.key}`}
          />
        );
      },
    },
    {
      key: "state",
      header: "状態",
      cell: (r) =>
        isDirty(r) ? (
          <StatusBadge tone="info">変更あり</StatusBadge>
        ) : r.status === "UNSET" ? (
          <StatusBadge tone="warn">未設定</StatusBadge>
        ) : r.status === "HAS" ? (
          <StatusBadge tone="ok">あり（{r.subLeagues.length}）</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">なし</StatusBadge>
        ),
    },
    {
      key: "updated",
      header: "最終更新",
      cell: (r) => (
        <span className="text-[11px] text-gray-500">
          {r.updateTime ?? "-"}
          {r.updateId ? `（${r.updateId}）` : ""}
        </span>
      ),
    },
  ];

  return (
    <div>
      <ConsoleToolbar
        title="サブリーグ保有国リーグ登録設定"
        info="サブリーグ（アペルトゥーラ／クラウスラ など）単位でシーズンが分かれている国・リーグ"
        description={
          <>
            シーズンデータの国・リーグごとに、サブリーグの<b>あり・なし</b>を決めます。ありの場合はサブリーグ名を表示順に「、」区切りで入力してください（期間はシーズン期間の画面で管理します）。
            未設定の国・リーグが残っている間は、ほかの管理画面は開けません。サブリーグが無い国だけなら<b>「設定しない」</b>を押してください。
          </>
        }
      >
        <ConsoleButton onClick={() => void q.refetch()} loading={q.isFetching && !q.isLoading}>
          {!(q.isFetching && !q.isLoading) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
        <ConsoleButton onClick={resetAll} disabled={counts.dirty === 0 || busy}>
          <RotateCcw className="h-3.5 w-3.5" />
          変更を戻す
        </ConsoleButton>
        <ConsoleButton onClick={() => setSkipOpen(true)} disabled={q.isLoading || q.isError || counts.unset === 0 || busy} data-testid="button-skip-sub-league">
          <Ban className="h-3.5 w-3.5" />
          設定しない{counts.unset > 0 ? `（未設定 ${counts.unset} 件）` : ""}
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={handleSave} disabled={q.isLoading || q.isError || counts.dirty === 0 || busy} loading={saveMutation.isPending} data-testid="button-save-sub-league">
          {!saveMutation.isPending && <Save className="h-3.5 w-3.5" />}
          {saveMutation.isPending ? "保存中…" : `保存${counts.dirty > 0 ? `（${counts.dirty}件）` : ""}`}
        </ConsoleButton>
      </ConsoleToolbar>

      {message && <ConsoleNotice tone="ok" title={message} onClose={() => setMessage("")} />}
      {errors.length > 0 && (
        <ConsoleNotice tone="ng" title="入力エラー" onClose={() => setErrors([])}>
          {errors.map((m) => `・${m}`).join("\n")}
        </ConsoleNotice>
      )}
      {!q.isLoading && counts.unset > 0 && (
        <ConsoleNotice tone="warn" title={`未設定の国・リーグが ${counts.unset} 件あります。設定が終わるまで、ほかの管理画面は開けません。`}>
          サブリーグがある国・リーグを「サブリーグあり」にして保存したあと、残りは「設定しない」で「サブリーグなし」にできます。
        </ConsoleNotice>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <StatChips
          loading={q.isLoading}
          items={[
            { label: "国・リーグ", value: rows.length },
            { label: "表示中", value: filtered.length },
            { label: "未設定", value: counts.unset, tone: counts.unset > 0 ? "warn" : "default" },
            { label: "サブリーグあり", value: counts.has },
            { label: "サブリーグなし", value: counts.none },
            { label: "変更あり", value: counts.dirty, tone: counts.dirty > 0 ? "info" : "default" },
          ]}
        />
        <div className="mb-2.5 ml-auto flex flex-wrap items-end gap-2">
          <ConsoleField label="国">
            <ConsoleSelect value={country} onChange={(e) => setCountry(e.target.value)} className="w-44" data-testid="select-country">
              <option value="">すべて</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>
          <ConsoleField label="状態">
            <ConsoleSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | SubLeagueStatus)} className="w-40" data-testid="select-status">
              <option value="">すべて</option>
              {(Object.keys(STATUS_LABEL) as SubLeagueStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </ConsoleSelect>
          </ConsoleField>
        </div>
      </div>

      <ConsoleTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.key}
        loading={q.isLoading}
        error={q.isError ? (q.error instanceof Error ? q.error.message : "取得に失敗しました") : undefined}
        emptyText="データがありません"
        plain
        rowClassName={(r) => (isDirty(r) ? "bg-amber-50/50" : r.status === "UNSET" ? "bg-red-50/40" : "")}
        maxHeight="calc(100vh - 320px)"
      />

      <ConsoleModal
        open={skipOpen}
        title="設定しない"
        width={560}
        busy={skipMutation.isPending}
        onClose={() => setSkipOpen(false)}
        footer={
          <>
            <ConsoleButton onClick={() => setSkipOpen(false)} disabled={skipMutation.isPending}>
              キャンセル
            </ConsoleButton>
            <ConsoleButton variant="primary" onClick={() => skipMutation.mutate()} loading={skipMutation.isPending} data-testid="button-skip-confirm">
              「サブリーグなし」にする
            </ConsoleButton>
          </>
        }
      >
        <p className="m-0 text-sm text-gray-700">
          未設定の <b>{counts.unset}</b> 件の国・リーグを、すべて「サブリーグなし」にします。設定済みの国・リーグは変わりません。
        </p>
        {counts.dirty > 0 && (
          <p className="mb-0 mt-2 text-sm font-bold text-amber-700">保存していない変更（{counts.dirty} 件）は反映されません。先に「保存」してください。</p>
        )}
      </ConsoleModal>
    </div>
  );
}
