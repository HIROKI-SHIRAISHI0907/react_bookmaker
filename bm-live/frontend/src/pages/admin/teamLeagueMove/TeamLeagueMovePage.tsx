// チーム昇格・降格確認設定  /admin/team-league-move（2026-11-24 追加）
//  GET /v1/api/admin/team-league-move、POST .../confirm、POST .../cancel
//  チームの所属リーグが変わると（B004 の付け替え・シーズン終了後の生き返り）、DB のトリガーが自動で記録する。
//  ここで 昇格・降格・その他 を決めて確定する。候補はリーグレベル（1 = 最上位）から決めている。
//  確定すると、お気に入りのチーム・大会出場チームのリーグを移動先に付け替え、チームカラーを引き継ぐ。
//  誤検知（チームマスタの取り違えなど）は「取り消し」。チームマスタは変えない。
//  未確定が残っている間は、ほかの管理画面は開けない（未対応チェック TEAM_MOVE_UNCONFIRMED）。
//  移動先リーグがスクレイピング対象外の移動は「保留」（一覧・入口チェックに出さない。全件表示でだけ見える）。
//  スクレイピング対象データ設定でそのリーグを対象に戻すと、未確定として出てくる。
//  ※ リーグ名の変更は「リーグ所属チーム付け替え設定」で付け替えると、自動で「リーグ名変更」として確定される。
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCheck, RefreshCw } from "lucide-react";
import {
  cancelTeamLeagueMoves,
  confirmTeamLeagueMoves,
  fetchTeamLeagueMoves,
  MOVE_TYPE_LABEL,
  type MoveType,
  type TeamLeagueMoveEntity,
  type TeamLeagueMoveResponse,
} from "../../../api/teamLeagueMove/teamLeagueMove";
import {
  ConsoleButton,
  ConsoleCheck,
  ConsoleField,
  ConsoleModal,
  ConsoleNotice,
  ConsoleSelect,
  ConsoleTable,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
  type BadgeTone,
  type ConsoleColumn,
} from "../../../api/commonAdminDesign";
import { SETUP_STATUS_QUERY_KEY } from "../SetupGate";

type Row = TeamLeagueMoveEntity & {
  /** 確定するときの種類（未確定の行だけ選べる） */
  inputType: MoveType;
};

const SELECTABLE: MoveType[] = ["UP", "DOWN", "OTHER"];

const TYPE_TONE: Record<MoveType, BadgeTone> = { UP: "ok", DOWN: "ng", OTHER: "neutral", RENAME: "info" };

const levelText = (lv: number | null) => (lv == null ? "未設定" : lv === 1 ? "1部" : `${lv}部`);

function toRows(items: TeamLeagueMoveEntity[]): Row[] {
  return items.map((e) => ({
    ...e,
    inputType: e.moveType && e.moveType !== "RENAME" ? e.moveType : e.suggestType === "RENAME" ? "OTHER" : e.suggestType,
  }));
}

/** 確定・取り消しできる行（未確定で、移動先がスクレイピング対象） */
const isOpen = (r: TeamLeagueMoveEntity) => r.confirmFlg === "0" && r.scrapeTarget;

type Action = { kind: "confirm" | "cancel"; ids: number[] };

export default function TeamLeagueMovePage() {
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<Action | null>(null);

  const queryKey = ["admin-team-league-move", showAll];
  const q = useQuery({ queryKey, queryFn: () => fetchTeamLeagueMoves(showAll) });

  useEffect(() => {
    if (q.data) {
      setRows(toRows(q.data));
      setSelected((prev) => new Set([...prev].filter((id) => q.data.some((e) => e.id === id && isOpen(e)))));
    }
  }, [q.data]);

  const applyResult = (res: TeamLeagueMoveResponse, text: string) => {
    setAction(null);
    setSelected(new Set());
    setErrors(res.warnings ?? []);
    setMessage(text);
    queryClient.setQueryData(queryKey, res.items);
    void queryClient.invalidateQueries({ queryKey: SETUP_STATUS_QUERY_KEY });
  };

  const onError = (err: unknown) => {
    setAction(null);
    setMessage("");
    setErrors((err instanceof Error ? err.message : "処理中にエラーが発生しました").split("\n"));
  };

  const confirmMutation = useMutation({
    mutationFn: (items: { id: number; moveType: MoveType }[]) => confirmTeamLeagueMoves(showAll, items),
    onSuccess: (res) =>
      applyResult(res, `${res.updated} 件を確定しました（お気に入り ${res.favorites} 件・大会出場チーム ${res.cupTeams} 件を付け替え、チームカラーを同期）`),
    onError,
  });

  const cancelMutation = useMutation({
    mutationFn: (ids: number[]) => cancelTeamLeagueMoves(showAll, ids),
    onSuccess: (res) => applyResult(res, `${res.updated} 件を取り消しました`),
    onError,
  });

  const busy = confirmMutation.isPending || cancelMutation.isPending;

  const countries = useMemo(() => Array.from(new Set(rows.map((r) => r.country))).sort((a, b) => a.localeCompare(b, "ja")), [rows]);
  const filtered = useMemo(() => rows.filter((r) => !country || r.country === country), [rows, country]);
  const pendingFiltered = useMemo(() => filtered.filter(isOpen), [filtered]);

  const counts = useMemo(
    () => ({
      pending: rows.filter(isOpen).length,
      up: rows.filter((r) => isOpen(r) && r.inputType === "UP").length,
      down: rows.filter((r) => isOpen(r) && r.inputType === "DOWN").length,
      other: rows.filter((r) => isOpen(r) && r.inputType === "OTHER").length,
      held: rows.filter((r) => r.confirmFlg === "0" && !r.scrapeTarget).length,
    }),
    [rows],
  );

  const allChecked = pendingFiltered.length > 0 && pendingFiltered.every((r) => selected.has(r.id));

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleAll = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      pendingFiltered.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
      return next;
    });

  const setType = (id: number, t: MoveType) => {
    setMessage("");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, inputType: t } : r)));
  };

  const open = (kind: Action["kind"]) => {
    setMessage("");
    if (selected.size === 0) {
      setErrors(["対象の行を選んでください"]);
      return;
    }
    setErrors([]);
    setAction({ kind, ids: [...selected] });
  };

  const run = () => {
    if (!action) return;
    if (action.kind === "cancel") {
      cancelMutation.mutate(action.ids);
      return;
    }
    const byId = new Map(rows.map((r) => [r.id, r]));
    confirmMutation.mutate(action.ids.map((id) => ({ id, moveType: byId.get(id)?.inputType ?? "OTHER" })));
  };

  const actionRows = useMemo(() => (action ? rows.filter((r) => action.ids.includes(r.id)) : []), [action, rows]);

  const columns: ConsoleColumn<Row>[] = [
    {
      key: "check",
      header: (
        <input
          type="checkbox"
          className="accent-indigo-600"
          checked={allChecked}
          disabled={pendingFiltered.length === 0 || busy}
          onChange={(e) => toggleAll(e.target.checked)}
          aria-label="表示中の未確定を全部選ぶ"
          data-testid="check-all"
        />
      ),
      cell: (r) =>
        isOpen(r) ? (
          <input
            type="checkbox"
            className="accent-indigo-600"
            checked={selected.has(r.id)}
            disabled={busy}
            onChange={(e) => toggle(r.id, e.target.checked)}
            data-testid={`check-${r.id}`}
          />
        ) : null,
    },
    { key: "country", header: "国", cell: (r) => r.country },
    {
      key: "team",
      header: "チーム",
      cell: (r) =>
        r.link ? (
          <a href={r.link} target="_blank" rel="noreferrer" className="font-bold text-indigo-700 hover:underline">
            {r.team}
          </a>
        ) : (
          <span className="font-bold">{r.team}</span>
        ),
    },
    {
      key: "move",
      header: "移動（リーグレベル）",
      cell: (r) => (
        <span className="whitespace-nowrap">
          {r.fromLeague}
          <span className="text-[11px] text-gray-500">（{levelText(r.fromLevel)}）</span>
          <span className="mx-1 text-gray-400">→</span>
          <b>{r.toLeague}</b>
          <span className="text-[11px] text-gray-500">（{levelText(r.toLevel)}）</span>
        </span>
      ),
    },
    {
      key: "suggest",
      header: "候補",
      cell: (r) => <StatusBadge tone={TYPE_TONE[r.suggestType]}>{MOVE_TYPE_LABEL[r.suggestType]}</StatusBadge>,
    },
    {
      key: "type",
      header: "種類",
      className: "py-1",
      cell: (r) =>
        isOpen(r) ? (
          <ConsoleSelect
            value={r.inputType}
            onChange={(e) => setType(r.id, e.target.value as MoveType)}
            className={`w-28 ${r.inputType !== r.suggestType ? "!border-amber-300 !bg-amber-50" : ""}`}
            disabled={busy}
            data-testid={`select-type-${r.id}`}
          >
            {SELECTABLE.map((t) => (
              <option key={t} value={t}>
                {MOVE_TYPE_LABEL[t]}
              </option>
            ))}
          </ConsoleSelect>
        ) : r.confirmFlg === "1" && r.moveType ? (
          <StatusBadge tone={TYPE_TONE[r.moveType]}>{MOVE_TYPE_LABEL[r.moveType]}</StatusBadge>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "state",
      header: "状態",
      cell: (r) =>
        r.confirmFlg === "0" && !r.scrapeTarget ? (
          <StatusBadge tone="neutral">保留（対象外）</StatusBadge>
        ) : r.confirmFlg === "0" ? (
          <StatusBadge tone="warn">未確定</StatusBadge>
        ) : r.confirmFlg === "1" ? (
          <StatusBadge tone="ok">確定</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">取り消し</StatusBadge>
        ),
    },
    {
      key: "time",
      header: "検知 / 確定",
      cell: (r) => (
        <span className="text-[11px] text-gray-500">
          {r.detectedTime}
          {r.confirmTime ? (
            <>
              <br />
              {r.confirmTime}
              {r.updateId ? `（${r.updateId}）` : ""}
            </>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <div>
      <ConsoleToolbar
        title="チーム昇格・降格確認設定"
        info="前のシーズンから所属リーグが変わったチーム（自動で検知）"
        description={
          <>
            チームの所属リーグが変わると自動で記録されます。<b>昇格・降格・その他</b>を選んで<b>確定</b>してください（候補はリーグレベルから決めています）。
            確定すると、お気に入りのチーム・大会出場チームのリーグを移動先に付け替え、チームカラーを引き継ぎます。
            誤検知は<b>取り消し</b>（チームマスタは変わりません）。未確定が残っている間は、ほかの管理画面は開けません。
            移動先がスクレイピング対象外のリーグは<b>保留</b>になり、対象に戻したときに未確定として出ます。
          </>
        }
      >
        <ConsoleButton onClick={() => void q.refetch()} loading={q.isFetching && !q.isLoading}>
          {!(q.isFetching && !q.isLoading) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
        <ConsoleButton onClick={() => open("cancel")} disabled={selected.size === 0 || busy} data-testid="button-cancel-move">
          <Ban className="h-3.5 w-3.5" />
          取り消し{selected.size > 0 ? `（${selected.size}件）` : ""}
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={() => open("confirm")} disabled={selected.size === 0 || busy} loading={confirmMutation.isPending} data-testid="button-confirm-move">
          {!confirmMutation.isPending && <CheckCheck className="h-3.5 w-3.5" />}
          確定{selected.size > 0 ? `（${selected.size}件）` : ""}
        </ConsoleButton>
      </ConsoleToolbar>

      {message && <ConsoleNotice tone="ok" title={message} onClose={() => setMessage("")} />}
      {errors.length > 0 && (
        <ConsoleNotice tone="ng" title="確認してください" onClose={() => setErrors([])}>
          {errors.map((m) => `・${m}`).join("\n")}
        </ConsoleNotice>
      )}
      {!q.isLoading && counts.pending > 0 && (
        <ConsoleNotice tone="warn" title={`未確定の移動が ${counts.pending} 件あります。確定・取り消しが終わるまで、ほかの管理画面は開けません。`}>
          リーグ名が変わっただけの場合は「その他」で確定してください（「リーグ所属チーム付け替え設定」で付け替えた分は自動で確定されます）。
        </ConsoleNotice>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <StatChips
          loading={q.isLoading}
          items={[
            { label: "未確定", value: counts.pending, tone: counts.pending > 0 ? "warn" : "default" },
            { label: "昇格", value: counts.up },
            { label: "降格", value: counts.down },
            { label: "その他", value: counts.other },
            { label: "選択中", value: selected.size, tone: selected.size > 0 ? "info" : "default" },
            ...(showAll ? [{ label: "保留（対象外）", value: counts.held }] : []),
            { label: "表示中", value: filtered.length },
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
          <ConsoleCheck checked={showAll} onChange={setShowAll} disabled={busy}>
            確定・取り消し済みも表示
          </ConsoleCheck>
        </div>
      </div>

      <ConsoleTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => String(r.id)}
        loading={q.isLoading}
        error={q.isError ? (q.error instanceof Error ? q.error.message : "取得に失敗しました") : undefined}
        emptyText={showAll ? "データがありません" : "未確定の移動はありません"}
        plain
        rowClassName={(r) => (selected.has(r.id) ? "bg-indigo-50/60" : isOpen(r) ? "bg-red-50/30" : "text-gray-500")}
        maxHeight="calc(100vh - 320px)"
      />

      <ConsoleModal
        open={action != null}
        title={action?.kind === "cancel" ? "取り消し（誤検知）" : "確定"}
        width={640}
        busy={busy}
        onClose={() => setAction(null)}
        footer={
          <>
            <ConsoleButton onClick={() => setAction(null)} disabled={busy}>
              キャンセル
            </ConsoleButton>
            <ConsoleButton variant="primary" onClick={run} loading={busy} data-testid="button-action-ok">
              {action?.kind === "cancel" ? "取り消す" : "確定する"}
            </ConsoleButton>
          </>
        }
      >
        {action?.kind === "cancel" ? (
          <p className="m-0 text-sm text-gray-700">
            選んだ <b>{actionRows.length}</b> 件を取り消します。チームマスタ・お気に入り・大会出場チームは変わりません（記録を「取り消し」にするだけです）。
          </p>
        ) : (
          <p className="m-0 text-sm text-gray-700">
            選んだ <b>{actionRows.length}</b> 件を確定します。お気に入りのチーム・大会出場チームのリーグを移動先に付け替え、チームカラーを引き継ぎます。
          </p>
        )}
        <ul className="mb-0 mt-2 max-h-64 overflow-auto pl-5 text-[13px] text-gray-700">
          {actionRows.map((r) => (
            <li key={r.id}>
              {r.country} / <b>{r.team}</b>：{r.fromLeague} → {r.toLeague}
              {action?.kind === "confirm" && <>（{MOVE_TYPE_LABEL[r.inputType]}）</>}
            </li>
          ))}
        </ul>
      </ConsoleModal>
    </div>
  );
}
