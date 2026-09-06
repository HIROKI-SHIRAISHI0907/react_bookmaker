import React, { useEffect, useMemo, useState } from "react";
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

// dev.web.api.bm_a028.AdminApproveItemResponse に対応(このページではNOTICE宛の依頼のみ使う)
type ApproveRequestItem = {
  approveId?: string;
  targetKind?: string; // "NOTICE" | "SCREEN"
  targetApprovementInfo?: string; // NOTICEの場合はnotice.idの文字列
  flowStatus?: string; // 申請済 / 承認 / 差し戻し / 取り消し
  comment?: string;
  registerTime?: string;
};

type ApproveListResponse = {
  responseCode?: string;
  message?: string;
  items?: ApproveRequestItem[];
};

// dev.web.controller.AdminApproveController の @RequestMapping("/api/approve") に対応。
// 実際に使っているAPIパスの命名規則に合わせて変更してください。
const APPROVE_API_BASE = "/api/approve";

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

/** ================= UI helpers ================= */
type Tone = "gray" | "blue" | "emerald" | "amber" | "rose" | "violet";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  const cls: Record<Tone, string> = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    blue: "bg-blue-100 text-blue-800 ring-blue-200",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    rose: "bg-rose-100 text-rose-800 ring-rose-200",
    violet: "bg-violet-100 text-violet-800 ring-violet-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cls[tone]}`}>{children}</span>;
}

function Panel({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
      <div className="px-5 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="text-base font-extrabold text-gray-900">{title}</div>
            {desc ? <div className="text-sm text-muted-foreground mt-1">{desc}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Alert({ type, title, message, onClose }: { type: "info" | "success" | "error"; title: string; message: string; onClose?: () => void }) {
  const cls = type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900";

  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "💡";

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">{title}</div>
        <pre className="mt-1 text-xs whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>
      {onClose ? (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
          ✕
        </button>
      ) : null}
    </div>
  );
}

function statusTone(status: string): Tone {
  const s = (status ?? "").toUpperCase();
  if (s.includes("PUBLISH")) return "emerald";
  if (s.includes("ARCHIVE")) return "gray";
  if (s.includes("DRAFT")) return "amber";
  return "blue";
}

function typeTone(t?: NoticeType): Tone {
  if (t === "FEATURED_MATCH") return "violet";
  return "blue";
}

function fmt(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

/** ================= Page ================= */
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
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  // toast
  const [toast, setToast] = useState<{ type: "info" | "success" | "error"; title: string; message: string } | null>(null);

  // ✅ 更新後に「即」一覧APIを叩く共通関数
  const refetchAdminList = async () => {
    await queryClient.refetchQueries({ queryKey: ["admin-notices"] });
  };
  const refetchFrontActive = async () => {
    await queryClient.refetchQueries({ queryKey: ["notices-active"] });
  };
  const refetchApproveRequests = async () => {
    await queryClient.refetchQueries({ queryKey: ["notice-approve-requests"] });
  };

  // --- Queries ---
  const noticesQuery = useQuery<Notice[]>({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const data = await fetchOrThrow("/v1/api/admin/notices", { headers: { Accept: "application/json" } });
      return Array.isArray(data) ? (data as Notice[]) : [];
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  // お知らせの公開は「承認依頼→管理者の承認」を経由するため、自分が出した依頼一覧も取得し、
  // どのお知らせが承認待ち／差し戻しなのかを突き合わせる。
  const approveRequestsQuery = useQuery<ApproveListResponse>({
    queryKey: ["notice-approve-requests"],
    queryFn: async () => {
      const data = await fetchOrThrow(`${APPROVE_API_BASE}/requests`, { headers: { Accept: "application/json" } });
      return data && typeof data === "object" ? (data as ApproveListResponse) : { items: [] };
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
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

  const notices = noticesQuery.data ?? [];
  const stats = useMemo(() => {
    const total = notices.length;
    const published = notices.filter((n) => (n.status ?? "").toUpperCase().includes("PUBLISH")).length;
    const draft = notices.filter((n) => (n.status ?? "").toUpperCase().includes("DRAFT")).length;
    const archived = notices.filter((n) => (n.status ?? "").toUpperCase().includes("ARCHIVE")).length;
    return { total, published, draft, archived };
  }, [notices]);

  // notice.id -> 直近の承認依頼(NOTICE宛のみ)。サーバー側がregister_time DESCで返す前提で、
  // 同じお知らせに複数回申請していても最初に見つかったもの=最新を採用する。
  const latestRequestByNoticeId = useMemo(() => {
    const map = new Map<number, ApproveRequestItem>();
    for (const r of approveRequestsQuery.data?.items ?? []) {
      if (r.targetKind !== "NOTICE" || !r.targetApprovementInfo) continue;
      const noticeId = Number(r.targetApprovementInfo);
      if (Number.isNaN(noticeId) || map.has(noticeId)) continue;
      map.set(noticeId, r);
    }
    return map;
  }, [approveRequestsQuery.data]);

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
        payload.body = "本日の注目対戦です！";
      }

      return await fetchOrThrow("/v1/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setDisplayFrom("");
      setDisplayTo("");
      setSelectedFutureId("");

      await refetchAdminList();
      await refetchFrontActive();

      setToast({ type: "success", title: "登録完了", message: "DRAFT として登録しました。" });
    },
    onError: (e) => {
      console.error("[createMutation] error", e);
      setToast({ type: "error", title: "登録失敗", message: safeText((e as any)?.message) || "登録に失敗しました" });
    },
  });

  // 「公開」は直接叩かず、管理者への承認依頼を送る。承認されると自動的にPUBLISHEDになる
  // (dev.web.api.bm_a028.AdminApproveService#approveRequest 側でnotices.publishを呼んでいる)。
  const requestApprovalMutation = useMutation({
    mutationFn: async (noticeId: number) => {
      return await fetchOrThrow(`${APPROVE_API_BASE}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ targetKind: "NOTICE", targetApprovementInfo: String(noticeId) }),
      });
    },
    onSuccess: async () => {
      await refetchApproveRequests();
      setToast({ type: "success", title: "承認依頼を送信しました", message: "管理者の承認をお待ちください。" });
    },
    onError: (e) => {
      console.error("[requestApprovalMutation] error", e);
      setToast({ type: "error", title: "送信失敗", message: safeText((e as any)?.message) || "承認依頼の送信に失敗しました" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchOrThrow(`/v1/api/admin/notices/${id}/archive`, { method: "POST", headers: { Accept: "application/json" } });
    },
    onSuccess: async () => {
      await refetchAdminList();
      await refetchFrontActive();
      setToast({ type: "success", title: "アーカイブ完了", message: "アーカイブしました。" });
    },
    onError: (e) => {
      console.error("[archiveMutation] error", e);
      setToast({ type: "error", title: "アーカイブ失敗", message: safeText((e as any)?.message) || "アーカイブに失敗しました" });
    },
  });

  // --- Form validation ---
  const canSubmitNormal = title.trim().length > 0 && body.trim().length > 0;
  const canSubmitFeatured = selectedFutureId !== "";
  const canSubmit = noticeType === "NORMAL" ? canSubmitNormal : canSubmitFeatured;

  const isRefreshing = noticesQuery.isFetching;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white p-3 rounded-2xl shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M5 6h14v14H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">お知らせ管理</h1>
              <p className="text-sm text-muted-foreground mt-1">通常お知らせ / 注目試合お知らせ（future_master）を登録できます。公開は管理者への承認依頼を経て行われます。</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="blue">total {stats.total}</Badge>
            <Badge tone="emerald">published {stats.published}</Badge>
            <Badge tone="amber">draft {stats.draft}</Badge>
            <Badge tone="gray">archived {stats.archived}</Badge>
          </div>
        </div>

        {/* Toast */}
        {toast ? <Alert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} /> : null}

        {/* Create form */}
        <Panel
          title="登録（DRAFT）"
          desc="表示期間は任意。注目試合は候補から選択して登録します。"
          right={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">種別</span>
              <div className="inline-flex rounded-xl border bg-white overflow-hidden">
                <button
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${noticeType === "NORMAL" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
                  onClick={() => {
                    setNoticeType("NORMAL");
                    setSelectedFutureId("");
                  }}
                  type="button"
                >
                  通常
                </button>
                <button
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${noticeType === "FEATURED_MATCH" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
                  onClick={() => setNoticeType("FEATURED_MATCH")}
                  type="button"
                >
                  注目試合
                </button>
              </div>
            </div>
          }
        >
          {/* display window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">表示開始</div>
              <input
                type="datetime-local"
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={displayFrom}
                onChange={(e) => setDisplayFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">表示終了</div>
              <input
                type="datetime-local"
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={displayTo}
                onChange={(e) => setDisplayTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            {noticeType === "NORMAL" ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-800">タイトル</div>
                  <input
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例）メンテナンスのお知らせ"
                  />
                  {!canSubmitNormal && title.trim().length === 0 ? <div className="text-xs text-amber-700">タイトルは必須です</div> : null}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-800">内容</div>
                  <textarea
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="例）2/10 02:00-03:00 にメンテナンスします"
                  />
                  {!canSubmitNormal && body.trim().length === 0 ? <div className="text-xs text-amber-700">内容は必須です</div> : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-gradient-to-r from-violet-50 to-blue-50 p-4">
                <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
                  <div>
                    <div className="font-extrabold text-gray-900">注目試合候補</div>
                    <div className="text-sm text-muted-foreground mt-1">country/league/limit を調整して候補を取得 → 試合を選択</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="violet">FEATURED_MATCH</Badge>
                    <Badge tone={futureQuery.isFetching ? "amber" : "emerald"}>{futureQuery.isFetching ? "取得中…" : "候補OK"}</Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-800">country</div>
                    <input
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="例）jp"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-800">league</div>
                    <input
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={league}
                      onChange={(e) => setLeague(e.target.value)}
                      placeholder="例）j1"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-800">limit</div>
                    <input
                      type="number"
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      min={1}
                      max={200}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  {futureQuery.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                  ) : futureQuery.error ? (
                    <div className="text-rose-700 text-sm">候補取得エラー: {safeText((futureQuery.error as any)?.message)}</div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedFutureId}
                        onChange={(e) => setSelectedFutureId(e.target.value ? Number(e.target.value) : "")}
                      >
                        <option value="">注目試合を選択してください</option>
                        {matches.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.futureTime ? m.futureTime : ""}　{m.homeTeam} vs {m.awayTeam}（id={m.id}）
                          </option>
                        ))}
                      </select>

                      {selectedMatch ? (
                        <div className="text-sm text-muted-foreground">
                          選択中:{" "}
                          <span className="font-semibold text-gray-900">
                            {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                          </span>{" "}
                          <span className="text-xs">（id={selectedMatch.id}）</span>
                          {selectedMatch.link ? (
                            <div className="mt-1 text-xs">
                              link: <span className="underline break-all">{selectedMatch.link}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-xs text-amber-700">試合を選択してください</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? "登録中..." : "登録（DRAFT）"}
            </Button>

            <div className="flex items-center gap-2">
              <Badge tone={noticeType === "NORMAL" ? "blue" : "violet"}>{noticeType}</Badge>
              {displayFrom || displayTo ? <Badge tone="gray">期間指定あり</Badge> : <Badge tone="gray">期間指定なし</Badge>}
            </div>

            {createMutation.error ? <div className="text-rose-700 text-sm">{safeText((createMutation.error as any)?.message)}</div> : null}
          </div>
        </Panel>

        {/* List */}
        <Panel
          title="一覧"
          desc="DRAFTのお知らせは「承認依頼を送る」→管理者が承認すると自動的に公開されます。行カードの右側から操作します。"
          right={
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await refetchAdminList();
                await refetchApproveRequests();
              }}
            >
              {isRefreshing ? "更新中..." : "更新"}
            </Button>
          }
        >
          {noticesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : noticesQuery.error ? (
            <div className="text-rose-700 text-sm">一覧取得エラー: {safeText((noticesQuery.error as any)?.message)}</div>
          ) : notices.length === 0 ? (
            <div className="text-sm text-muted-foreground">データがありません。</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {notices.map((n) => {
                const isRequesting = requestingId === n.id;
                const isArchiving = archivingId === n.id;
                const rowBusy = isRequesting || isArchiving;

                const relatedRequest = latestRequestByNoticeId.get(n.id);
                const isPendingRequest = relatedRequest?.flowStatus === "申請済";
                const isRejectedRequest = relatedRequest?.flowStatus === "差し戻し";
                const isDraft = (n.status ?? "").toUpperCase() === "DRAFT";
                const canRequestApproval = isDraft && !isPendingRequest;

                return (
                  <div
                    key={n.id}
                    className="
                      rounded-2xl border bg-white hover:shadow-sm transition-shadow
                      p-4 flex items-start justify-between gap-4 flex-col md:flex-row
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="gray">ID {n.id}</Badge>
                        <Badge tone={typeTone(n.noticeType)}>{n.noticeType ?? "NORMAL"}</Badge>
                        <Badge tone={statusTone(n.status)}>{n.status}</Badge>
                        {n.featureMatchId ? <Badge tone="violet">featureMatchId {n.featureMatchId}</Badge> : null}
                        {isPendingRequest ? <Badge tone="blue">承認待ち</Badge> : null}
                        {isRejectedRequest ? <Badge tone="rose">差し戻し</Badge> : null}
                      </div>

                      <div className="mt-2 text-lg font-extrabold text-gray-900">{n.title}</div>
                      <div className="mt-1 text-sm whitespace-pre-wrap text-gray-800">{n.body}</div>

                      {isRejectedRequest && relatedRequest?.comment ? <div className="mt-2 text-xs text-rose-700">差し戻し理由: {relatedRequest.comment}</div> : null}

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="rounded-xl border bg-gray-50 px-3 py-2">
                          <div className="font-semibold text-gray-700">表示期間</div>
                          <div className="mt-1">{n.displayFrom ?? "-"}</div>
                          <div>{n.displayTo ?? "-"}</div>
                        </div>

                        <div className="rounded-xl border bg-gray-50 px-3 py-2">
                          <div className="font-semibold text-gray-700">publishedAt</div>
                          <div className="mt-1">{fmt(n.publishedAt)}</div>
                        </div>

                        <div className="rounded-xl border bg-gray-50 px-3 py-2">
                          <div className="font-semibold text-gray-700">updateTime</div>
                          <div className="mt-1">{fmt(n.updateTime)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {canRequestApproval ? (
                        <Button
                          size="sm"
                          disabled={rowBusy}
                          onClick={async () => {
                            setRequestingId(n.id);
                            try {
                              await requestApprovalMutation.mutateAsync(n.id);
                            } finally {
                              setRequestingId(null);
                            }
                          }}
                        >
                          {isRequesting ? "送信中..." : isRejectedRequest ? "再度、承認依頼を送る" : "承認依頼を送る"}
                        </Button>
                      ) : isPendingRequest ? (
                        <Button size="sm" disabled>
                          承認待ち
                        </Button>
                      ) : null}

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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
