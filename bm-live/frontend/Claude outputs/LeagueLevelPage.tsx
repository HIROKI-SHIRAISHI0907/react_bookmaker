// リーグレベル情報反映設定  /admin/league-level
//  GET / POST /v1/api/admin/league-level（country_league_master.league_level）
//  国・リーグ ごとにリーグレベル（同じ国で 1 = 最上位、大きいほど下位）を設定する。昇格・降格の判定に使う。
//  保存すると、その 国・リーグ の全行（削除・非表示の行も）に同じ値が入る。
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, RotateCcw, Save } from "lucide-react";
import { fetchLeagueLevels, saveLeagueLevels, MAX_LEAGUE_LEVEL, type LeagueLevelEntity, type LeagueLevelItem } from "../../../api/adminLeagueLevel";
import {
  ConsoleButton,
  ConsoleCellInput,
  ConsoleCheck,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsoleSelect,
  ConsoleTable,
  ConsoleToolbar,
  StatChips,
  StatusBadge,
  type ConsoleColumn,
} from "../../../api/commonAdminDesign";

type Row = LeagueLevelEntity & {
  key: string;
  /** 入力中の値（空 = 未設定） */
  input: string;
};

const keyOf = (country: string, league: string) => `${country}||${league}`;
const original = (r: Row) => (r.leagueLevel == null ? "" : String(r.leagueLevel));

/** 入力 → 値（空は null、不正は undefined） */
function parseLevel(text: string): number | null | undefined {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return undefined;
  const n = Number(t);
  return n >= 1 && n <= MAX_LEAGUE_LEVEL ? n : undefined;
}

const isDirty = (r: Row) => r.input.trim() !== original(r);

function toRows(items: LeagueLevelEntity[]): Row[] {
  return items.map((e) => ({ ...e, key: keyOf(e.country, e.league), input: e.leagueLevel == null ? "" : String(e.leagueLevel) }));
}

export default function LeagueLevelPage() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [country, setCountry] = useState("");
  const [league, setLeague] = useState("");
  const [unsetOnly, setUnsetOnly] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const q = useQuery({ queryKey: ["admin-league-level"], queryFn: fetchLeagueLevels });

  useEffect(() => {
    if (q.data) setRows(toRows(q.data));
  }, [q.data]);

  const mutation = useMutation({
    mutationFn: saveLeagueLevels,
    onSuccess: (res) => {
      setErrors([]);
      setMessage(`保存しました（${res.updatedLeagues} リーグ・${res.updatedRows} 行）`);
      queryClient.setQueryData(["admin-league-level"], res.items);
    },
    onError: (err: unknown) => {
      setMessage("");
      setErrors((err instanceof Error ? err.message : "保存中にエラーが発生しました").split("\n"));
    },
  });

  const countries = useMemo(() => Array.from(new Set(rows.map((r) => r.country))).sort((a, b) => a.localeCompare(b, "ja")), [rows]);

  const filtered = useMemo(() => {
    const lk = league.trim().toLowerCase();
    return rows.filter((r) => (!country || r.country === country) && (!lk || r.league.toLowerCase().includes(lk)) && (!unsetOnly || r.input.trim() === "" || r.mixed));
  }, [rows, country, league, unsetOnly]);

  const counts = useMemo(
    () => ({
      countries: new Set(rows.map((r) => r.country)).size,
      unset: rows.filter((r) => r.leagueLevel == null && !r.mixed).length,
      mixed: rows.filter((r) => r.mixed).length,
      dirty: rows.filter(isDirty).length,
    }),
    [rows],
  );

  /** 同じ国で同じレベルのリーグ（地域リーグなどであり得るので、警告だけ） */
  const duplicates = useMemo(() => {
    const map = new Map<string, string[]>();
    rows.forEach((r) => {
      const lv = parseLevel(r.input);
      if (lv == null) return;
      const k = `${r.country}||${lv}`;
      map.set(k, [...(map.get(k) ?? []), r.league]);
    });
    return Array.from(map.entries())
      .filter(([, ls]) => ls.length > 1)
      .map(([k, ls]) => {
        const [c, lv] = k.split("||");
        return `${c} のレベル ${lv}: ${ls.join(" / ")}`;
      });
  }, [rows]);

  /** 選んだ国のリーグの並び（レベル順） */
  const ladder = useMemo(() => {
    if (!country) return [];
    return rows
      .filter((r) => r.country === country)
      .map((r) => ({ league: r.league, level: parseLevel(r.input) }))
      .sort((a, b) => (a.level ?? 999) - (b.level ?? 999) || a.league.localeCompare(b.league, "ja"));
  }, [rows, country]);

  const setInput = (key: string, value: string) => {
    setMessage("");
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, input: value } : r)));
  };

  const resetAll = () => {
    setMessage("");
    setErrors([]);
    setRows((prev) => prev.map((r) => ({ ...r, input: original(r) })));
  };

  const handleSave = () => {
    setMessage("");
    const changed = rows.filter(isDirty);
    if (changed.length === 0) {
      setErrors(["変更がありません"]);
      return;
    }
    const errs: string[] = [];
    const items: LeagueLevelItem[] = [];
    changed.forEach((r) => {
      const lv = parseLevel(r.input);
      if (lv === undefined) {
        errs.push(`${r.country} / ${r.league}: リーグレベルは 1〜${MAX_LEAGUE_LEVEL} の整数で入力してください（空欄は未設定）`);
        return;
      }
      items.push({ country: r.country, league: r.league, leagueLevel: lv });
    });
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    mutation.mutate(items);
  };

  const columns: ConsoleColumn<Row>[] = [
    { key: "country", header: "国", cell: (r) => r.country },
    { key: "league", header: "リーグ", cell: (r) => <span className="font-bold">{r.league}</span> },
    {
      key: "level",
      header: "リーグレベル",
      align: "right",
      className: "py-1",
      cell: (r) => {
        const invalid = parseLevel(r.input) === undefined;
        return (
          <ConsoleCellInput
            value={r.input}
            inputMode="numeric"
            dirty={isDirty(r)}
            placeholder="未設定"
            onChange={(e) => setInput(r.key, e.target.value)}
            className={`!min-w-[72px] w-20 text-right font-mono tabular-nums ${invalid ? "!border-red-400 !bg-red-50" : ""}`}
            data-testid={`input-league-level-${r.key}`}
          />
        );
      },
    },
    {
      key: "label",
      header: "表示",
      cell: (r) => {
        const lv = parseLevel(r.input);
        if (lv == null) return <span className="text-gray-400">-</span>;
        return <span className="text-gray-700">{lv === 1 ? "1部（最上位）" : `${lv}部`}</span>;
      },
    },
    { key: "teams", header: "有効チーム", align: "right", mono: true, cell: (r) => `${r.activeTeams} / ${r.totalRows}` },
    {
      key: "state",
      header: "状態",
      cell: (r) =>
        isDirty(r) ? (
          <StatusBadge tone="info">変更あり</StatusBadge>
        ) : r.mixed ? (
          <StatusBadge tone="ng">値がばらばら</StatusBadge>
        ) : r.leagueLevel == null ? (
          <StatusBadge tone="warn">未設定</StatusBadge>
        ) : (
          <StatusBadge tone="ok">設定済</StatusBadge>
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
        title="リーグレベル情報反映設定"
        info="国・リーグごとのリーグレベル（昇格・降格の判定用）"
        description={
          <>
            同じ国の中で <b>1 = 最上位</b>、数字が大きいほど下位のリーグです（1〜{MAX_LEAGUE_LEVEL}。空欄は未設定）。保存すると、その国・リーグの全チームの行に同じ値が入ります。
          </>
        }
      >
        <ConsoleButton onClick={() => void q.refetch()} loading={q.isFetching && !q.isLoading}>
          {!(q.isFetching && !q.isLoading) && <RefreshCw className="h-3.5 w-3.5" />}
          再取得
        </ConsoleButton>
        <ConsoleButton onClick={resetAll} disabled={counts.dirty === 0}>
          <RotateCcw className="h-3.5 w-3.5" />
          変更を戻す
        </ConsoleButton>
        <ConsoleButton variant="primary" onClick={handleSave} disabled={q.isLoading || q.isError || counts.dirty === 0} loading={mutation.isPending} data-testid="button-save-league-level">
          {!mutation.isPending && <Save className="h-3.5 w-3.5" />}
          {mutation.isPending ? "保存中…" : `保存${counts.dirty > 0 ? `（${counts.dirty}件）` : ""}`}
        </ConsoleButton>
      </ConsoleToolbar>

      {message && <ConsoleNotice tone="ok" title={message} onClose={() => setMessage("")} />}
      {errors.length > 0 && (
        <ConsoleNotice tone="ng" title="入力エラー" onClose={() => setErrors([])}>
          {errors.map((m) => `・${m}`).join("\n")}
        </ConsoleNotice>
      )}
      {duplicates.length > 0 && (
        <ConsoleNotice tone="warn" title="同じ国で同じレベルのリーグがあります（地域リーグなどでなければ見直してください）">
          {duplicates.map((m) => `・${m}`).join("\n")}
        </ConsoleNotice>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <StatChips
          loading={q.isLoading}
          items={[
            { label: "国", value: counts.countries },
            { label: "リーグ", value: rows.length },
            { label: "表示中", value: filtered.length },
            { label: "未設定", value: counts.unset, tone: counts.unset > 0 ? "warn" : "default" },
            { label: "値がばらばら", value: counts.mixed, tone: counts.mixed > 0 ? "ng" : "default" },
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
          <ConsoleField label="リーグで絞り込み">
            <ConsoleInput value={league} onChange={(e) => setLeague(e.target.value)} placeholder="例: プレミア" className="w-44" />
          </ConsoleField>
          <ConsoleCheck checked={unsetOnly} onChange={setUnsetOnly}>
            未設定・ばらばらだけ
          </ConsoleCheck>
        </div>
      </div>

      {/* 国を選んだときは、その国のリーグの並びを出す（入力中の値で） */}
      {ladder.length > 0 && (
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px]">
          <span className="mr-1 font-bold text-gray-700">{country} の並び</span>
          {ladder.map((l, i) => (
            <span key={l.league} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">›</span>}
              <span className={`rounded-md px-1.5 py-0.5 ${l.level == null ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>
                <b className="font-mono">{l.level ?? "?"}</b> {l.league}
              </span>
            </span>
          ))}
        </div>
      )}

      <ConsoleTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.key}
        loading={q.isLoading}
        error={q.isError ? (q.error instanceof Error ? q.error.message : "取得に失敗しました") : undefined}
        emptyText="データがありません"
        plain
        rowClassName={(r) => (isDirty(r) ? "bg-amber-50/50" : r.mixed ? "bg-red-50/50" : "")}
        maxHeight="calc(100vh - 300px)"
      />
    </div>
  );
}
