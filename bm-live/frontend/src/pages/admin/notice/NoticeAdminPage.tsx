import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/queryClient";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

type NoticeType = "NORMAL" | "FEATURED_MATCH";

type Notice = {
  id: number;
  title: string;
  body: string;
  status: string;
  noticeType?: NoticeType;
  featureMatchId?: number | null;
  displayFrom?: string | null;
  displayTo?: string | null;
  publishedAt?: string | null;
  updateTime?: string | null;
};

type FutureMatch = {
  id: number; // future_master.id
  homeTeam: string;
  awayTeam: string;
  futureTime: string | null;
  link?: string | null;
  gameTeamCategory?: string | null;
  roundNo?: number | null;
};

type FutureMatchesResponse = { matches: FutureMatch[] };

function toOffsetJst(datetimeLocal: string): string | null {
  if (!datetimeLocal) return null;
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00+09:00` : `${datetimeLocal}+09:00`;
}

function safeText(s: unknown): string {
  return typeof s === "string" ? s : "";
}

/** OK: json / text を返す。NG: 本文も含めて throw して console に出す */
async function fetchOrThrow(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const bodyText = typeof body === "string" ? body : JSON.stringify(body);
    console.error(`[HTTP ${res.status}] ${url}`, body);
    throw new Error(`HTTP ${res.status} ${bodyText}`);
  }
  return body;
}

export default function NoticeAdminPage() {
  // --- Future match filter ---
  const [country, setCountry] = useState<string>("jp");
  const [league, setLeague] = useState<string>("j1");
  const [limit, setLimit] = useState<number>(50);

  // --- Form state ---
  const [noticeType, setNoticeType] = useState<NoticeType>("NORMAL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayFrom, setDisplayFrom] = useState("");
  const [displayTo, setDisplayTo] = useState("");
  const [selectedFutureId, setSelectedFutureId] = useState<number | "">("");

  // --- “押した感” 用：行ごとの処理中ID ---
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  // ✅ 更新後に「即」一覧APIを叩く共通関数
  const refetchAdminList = async () => {
    await queryClient.refetchQueries({ queryKey: ["admin-notices"] });
  };
  const refetchFrontActive = async () => {
    await queryClient.refetchQueries({ queryKey: ["notices-active"] });
  };

  // --- Queries ---
  const noticesQuery = useQuery<Notice[]>({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const data = await fetchOrThrow("/v1/api/admin/notices", { headers: { Accept: "application/json" } });
      return Array.isArray(data) ? (data as Notice[]) : [];
    },
    staleTime: 10_000, // 0にしない（“更新”が押せない感を減らす）
    refetchOnWindowFocus: false, // 勝手にfetchして isFetching が続くのを防ぐ
  });

  const futureQuery = useQuery<FutureMatchesResponse>({
    queryKey: ["future-admin-matches", country, league, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (country) params.set("country", country);
      if (league) params.set("league", league);
      params.set("limit", String(limit));

      const data = await fetchOrThrow(`/v1/api/future/admin/matches?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      return data && typeof data === "object" ? (data as FutureMatchesResponse) : { matches: [] };
    },
    staleTime: 30_000,
    enabled: noticeType === "FEATURED_MATCH",
    refetchOnWindowFocus: false,
  });

  const matches = futureQuery.data?.matches ?? [];
  const selectedMatch = useMemo(() => {
    if (selectedFutureId === "") return null;
    return matches.find((m) => m.id === selectedFutureId) ?? null;
  }, [matches, selectedFutureId]);

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        noticeType,
        displayFrom: toOffsetJst(displayFrom),
        displayTo: toOffsetJst(displayTo),
      };

      if (noticeType === "NORMAL") {
        payload.title = title;
        payload.body = body;
      } else {
        if (selectedFutureId === "") throw new Error("注目試合を選択してください。");
        payload.featureMatchId = selectedFutureId;
        payload.title = "注目試合";
        payload.body = "本日の注目対戦です！"; // 空で落ちるDB制約がある場合の保険
      }

      console.log("[POST /v1/api/admin/notices] payload =", payload);

      return await fetchOrThrow("/v1/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      // form reset
      setTitle("");
      setBody("");
      setDisplayFrom("");
      setDisplayTo("");
      setSelectedFutureId("");

      // ✅ 更新したら即一覧APIを叩く
      await refetchAdminList();
      await refetchFrontActive();
    },
    onError: (e) => console.error("[createMutation] error", e),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchOrThrow(`/v1/api/admin/notices/${id}/publish`, { method: "POST", headers: { Accept: "application/json" } });
    },
    onSuccess: async () => {
      await refetchAdminList();
      await refetchFrontActive();
    },
    onError: (e) => console.error("[publishMutation] error", e),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchOrThrow(`/v1/api/admin/notices/${id}/archive`, { method: "POST", headers: { Accept: "application/json" } });
    },
    onSuccess: async () => {
      await refetchAdminList();
      await refetchFrontActive();
    },
    onError: (e) => console.error("[archiveMutation] error", e),
  });

  // --- Form validation ---
  const canSubmitNormal = title.trim().length > 0 && body.trim().length > 0;
  const canSubmitFeatured = selectedFutureId !== "";
  const canSubmit = noticeType === "NORMAL" ? canSubmitNormal : canSubmitFeatured;

  const isRefreshing = noticesQuery.isFetching; // 表示用（disabledには使わない）

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-2">お知らせ管理</h1>
        <p className="text-muted-foreground mb-6">通常お知らせ / 注目試合お知らせ（future_master）を登録できます。</p>

        {/* --- Create form --- */}
        <div className="border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="font-bold">登録</div>

            <div className="flex items-center gap-2">
              <label className="text-sm">種別</label>
              <select
                className="border rounded px-2 py-1"
                value={noticeType}
                onChange={(e) => {
                  const v = e.target.value as NoticeType;
                  setNoticeType(v);
                  if (v === "NORMAL") setSelectedFutureId("");
                }}
              >
                <option value="NORMAL">通常</option>
                <option value="FEATURED_MATCH">注目試合</option>
              </select>
            </div>
          </div>

          {/* 表示期間 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm mb-1">表示開始</div>
              <input type="datetime-local" className="w-full border rounded px-2 py-1" value={displayFrom} onChange={(e) => setDisplayFrom(e.target.value)} />
            </div>
            <div>
              <div className="text-sm mb-1">表示終了</div>
              <input type="datetime-local" className="w-full border rounded px-2 py-1" value={displayTo} onChange={(e) => setDisplayTo(e.target.value)} />
            </div>
          </div>

          {noticeType === "NORMAL" ? (
            <>
              <div className="mb-3">
                <div className="text-sm mb-1">タイトル</div>
                <input className="w-full border rounded px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例）メンテナンスのお知らせ" />
              </div>
              <div className="mb-3">
                <div className="text-sm mb-1">内容</div>
                <textarea className="w-full border rounded px-2 py-1" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="例）2/10 02:00-03:00 にメンテナンスします" />
              </div>
            </>
          ) : (
            <div className="border rounded p-3 mb-3 bg-muted/20">
              <div className="font-bold mb-2">注目試合候補（次の日以降）</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="text-sm mb-1">country</div>
                  <input className="w-full border rounded px-2 py-1" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="例）jp" />
                </div>
                <div>
                  <div className="text-sm mb-1">league</div>
                  <input className="w-full border rounded px-2 py-1" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="例）j1" />
                </div>
                <div>
                  <div className="text-sm mb-1">limit</div>
                  <input type="number" className="w-full border rounded px-2 py-1" value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={1} max={200} />
                </div>
              </div>

              {futureQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              ) : futureQuery.error ? (
                <div className="text-red-600 text-sm">候補取得エラー: {safeText((futureQuery.error as any)?.message)}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  <select className="border rounded px-2 py-2" value={selectedFutureId} onChange={(e) => setSelectedFutureId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">注目試合を選択してください</option>
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.futureTime ? m.futureTime : ""}　{m.homeTeam} vs {m.awayTeam}（id={m.id}）
                      </option>
                    ))}
                  </select>

                  {selectedMatch && (
                    <div className="text-sm text-muted-foreground">
                      選択中: {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}（id={selectedMatch.id}）
                      {selectedMatch.link ? (
                        <span>
                          {" "}
                          / link: <span className="underline">{selectedMatch.link}</span>
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? "登録中..." : "登録（DRAFT）"}
            </Button>

            {createMutation.error ? <div className="text-red-600 text-sm">{safeText((createMutation.error as any)?.message)}</div> : null}
          </div>
        </div>

        {/* --- List --- */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">一覧</div>

            {/* ✅ “更新”は常に押せる：disabledしない（押した気にならない/押せないの回避） */}
            <Button variant="outline" size="sm" onClick={() => queryClient.refetchQueries({ queryKey: ["admin-notices"] })}>
              {isRefreshing ? "更新中..." : "更新"}
            </Button>
          </div>

          {noticesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : noticesQuery.error ? (
            <div className="text-red-600 text-sm">一覧取得エラー: {safeText((noticesQuery.error as any)?.message)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">内容</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">表示期間</th>
                    <th className="py-2 pr-3">操作</th>
                  </tr>
                </thead>

                <tbody>
                  {(noticesQuery.data ?? []).map((n) => {
                    const isPublishing = publishingId === n.id;
                    const isArchiving = archivingId === n.id;
                    const rowBusy = isPublishing || isArchiving;

                    return (
                      <tr key={n.id} className="border-b">
                        <td className="py-2 pr-3 align-top">{n.id}</td>

                        <td className="py-2 pr-3 align-top">
                          <div className="font-bold">{n.title}</div>
                          <div className="whitespace-pre-wrap text-sm">{n.body}</div>
                          {n.noticeType ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              type={n.noticeType}
                              {n.featureMatchId ? ` / featureMatchId=${n.featureMatchId}` : ""}
                            </div>
                          ) : null}
                        </td>

                        <td className="py-2 pr-3 align-top">{n.status}</td>

                        <td className="py-2 pr-3 align-top text-sm">
                          <div>{n.displayFrom ?? "-"}</div>
                          <div>{n.displayTo ?? "-"}</div>
                        </td>

                        <td className="py-2 pr-3 align-top whitespace-nowrap">
                          <Button
                            size="sm"
                            className="mr-2"
                            disabled={rowBusy}
                            onClick={async () => {
                              setPublishingId(n.id);
                              try {
                                await publishMutation.mutateAsync(n.id);
                              } finally {
                                setPublishingId(null);
                              }
                            }}
                          >
                            {isPublishing ? "公開中..." : "公開"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowBusy}
                            onClick={async () => {
                              setArchivingId(n.id);
                              try {
                                await archiveMutation.mutateAsync(n.id);
                              } finally {
                                setArchivingId(null);
                              }
                            }}
                          >
                            {isArchiving ? "アーカイブ中..." : "アーカイブ"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {(noticesQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td className="py-3 text-sm text-muted-foreground" colSpan={5}>
                        データがありません。
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
