// お気に入りチームの編集  /favorite-edit（ログイン必須）
//  GET/POST/DELETE /v1/api/favorite-edit/*
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { queryClient } from "../../../lib/queryClient";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import AppHeader from "../../../components/layout/AppHeader";
import { isAuthenticated } from "../../../utils/auth";
import { isUnauthorized, addFavoriteTeam, deleteFavoriteTeam, fetchFavoriteLeagues, fetchFavoriteTeams, searchFavoriteCandidates } from "../../../api/team/teamapi";
import type { FavoriteEditResponse } from "../../../api/team/teamtypes";
import { TeamLink } from "../teams/TeamForm";

export const FAVORITE_EDIT_PATH = "/favorite-edit";

export default function FavoriteEdit() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const [keyword, setKeyword] = useState("");
  const [leagueKey, setLeagueKey] = useState(""); // "国|リーグ"
  const [message, setMessage] = useState<string | null>(null);

  const [country, league] = leagueKey ? leagueKey.split("|") : ["", ""];

  const teams = useQuery({ queryKey: ["favorite-edit-teams"], queryFn: fetchFavoriteTeams, enabled: loggedIn });
  const leagues = useQuery({ queryKey: ["favorite-edit-leagues"], queryFn: fetchFavoriteLeagues, enabled: loggedIn, staleTime: 10 * 60_000 });
  const searching = keyword.trim().length > 0 || !!leagueKey;
  const candidates = useQuery({
    queryKey: ["favorite-edit-search", keyword.trim(), country, league],
    queryFn: () => searchFavoriteCandidates(keyword.trim(), country, league),
    enabled: loggedIn && searching,
    staleTime: 30_000,
  });

  const onDone = (r: FavoriteEditResponse) => {
    queryClient.setQueryData(["favorite-edit-teams"], r);
    setMessage(r.message);
    queryClient.invalidateQueries({ queryKey: ["favorite-edit-search"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-favorites"] });
  };
  const add = useMutation({ mutationFn: (t: { country: string; league: string; team: string }) => addFavoriteTeam(t.country, t.league, t.team), onSuccess: onDone });
  const remove = useMutation({ mutationFn: (id: number) => deleteFavoriteTeam(id), onSuccess: onDone });

  const grouped = useMemo(() => {
    const m = new Map<string, NonNullable<typeof teams.data>["teams"]>();
    for (const t of teams.data?.teams ?? []) {
      const k = `${t.country} / ${t.league}`;
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return [...m.entries()];
  }, [teams.data]);

  const count = teams.data?.teams.length ?? 0;
  const max = teams.data?.maxTeams ?? 30;
  const busy = add.isPending || remove.isPending;

  // 未ログイン → ログインページへ（ログイン後はこのページに戻す）
  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: FAVORITE_EDIT_PATH }} />;
  }
  // ログイン済みなのに API が 401 → 自動でログインへ飛ばすとループするので、画面に出して止める
  const unauthorized = [teams.error, leagues.error, candidates.error, add.error, remove.error].some(isUnauthorized);
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="お気に入りの編集" />
        <main className="container mx-auto max-w-3xl px-4 py-10 text-center text-sm">
          認証に失敗しました（401）。ログインし直してください。
          <Link to="/login" state={{ from: FAVORITE_EDIT_PATH }} className="ml-2 font-bold text-emerald-600 underline">
            ログイン
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="お気に入りの編集" subtitle={`${count} / ${max} チーム`} />

      <main className="container mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1fr]">
        <div className="lg:col-span-2 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} data-testid="button-back">
            <ArrowLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          {message && <span className="rounded-lg bg-muted px-3 py-1 text-xs">{message}</span>}
          {(add.error || remove.error) && <span className="rounded-lg bg-red-50 px-3 py-1 text-xs text-red-700">{((add.error ?? remove.error) as Error).message}</span>}
        </div>

        {/* 登録済み */}
        <section className="rounded-2xl border bg-card p-4">
          <div className="mb-3 text-sm font-bold">★ 登録済み</div>
          {teams.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : teams.error ? (
            <div className="text-sm text-red-700">取得に失敗しました: {(teams.error as Error).message}</div>
          ) : count === 0 ? (
            <div className="text-xs text-muted-foreground">まだありません。右の検索から追加してください。</div>
          ) : (
            <div className="space-y-3">
              {grouped.map(([label, list]) => (
                <div key={label}>
                  <div className="mb-1 text-[11px] font-bold text-muted-foreground">{label}</div>
                  <div className="divide-y rounded-lg border">
                    {list.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
                        <TeamLink country={t.country} league={t.league} team={t.team} className="truncate text-sm font-semibold" />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove.mutate(t.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                          title="削除"
                          data-testid={`button-remove-${t.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 追加 */}
        <section className="rounded-2xl border bg-card p-4">
          <div className="mb-3 text-sm font-bold">チームを追加</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex flex-1 items-center gap-1 rounded-lg border px-2 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="チーム名" className="w-full bg-transparent text-sm outline-none" data-testid="input-team-keyword" />
            </label>
            <select value={leagueKey} onChange={(e) => setLeagueKey(e.target.value)} className="rounded-lg border bg-transparent px-2 py-1.5 text-sm sm:w-56" data-testid="select-league">
              <option value="">すべての国・リーグ</option>
              {(leagues.data ?? []).map((l) => (
                <option key={`${l.country}|${l.league}`} value={`${l.country}|${l.league}`}>
                  {l.country} / {l.league}（{l.teamCount}）
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            {!searching ? (
              <div className="text-xs text-muted-foreground">チーム名を入れるか、国・リーグを選んでください</div>
            ) : candidates.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (candidates.data ?? []).length === 0 ? (
              <div className="text-xs text-muted-foreground">見つかりませんでした</div>
            ) : (
              <div className="max-h-[480px] divide-y overflow-y-auto rounded-lg border">
                {(candidates.data ?? []).map((c) => (
                  <div key={`${c.country}|${c.league}|${c.team}`} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.team}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {c.country} / {c.league}
                      </div>
                    </div>
                    {c.favoriteId != null ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove.mutate(c.favoriteId as number)}
                        className="shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 disabled:opacity-40"
                      >
                        ★ 登録済み
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || count >= max}
                        onClick={() => add.mutate({ country: c.country, league: c.league, team: c.team })}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold hover:bg-muted disabled:opacity-40"
                        data-testid="button-add-team"
                      >
                        <Plus className="h-3 w-3" />
                        追加
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(candidates.data ?? []).length >= 50 && <div className="mt-1 text-[11px] text-muted-foreground">50件まで表示しています。絞り込んでください。</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
