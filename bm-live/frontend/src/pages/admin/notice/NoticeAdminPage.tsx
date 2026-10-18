import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, RefreshCw, Send } from "lucide-react";
import { queryClient } from "../../../lib/queryClient";
import {
  BadgeTone,
  ConsoleButton,
  ConsoleColumn,
  ConsoleField,
  ConsoleInput,
  ConsoleNotice,
  ConsolePanel,
  ConsoleSelect,
  ConsoleTable,
  ConsoleTextarea,
  ConsoleToolbar,
  NoticeTone,
  SegmentedTabs,
  StatChips,
  StatusBadge,
} from "../../../api/commonAdminDesign";

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

function statusTone(status: string): BadgeTone {
  const s = (status ?? "").toUpperCase();
  if (s.includes("PUBLISH")) return "ok";
  if (s.includes("ARCHIVE")) return "neutral";
  if (s.includes("DRAFT")) return "warn";
  return "info";
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
  const [toast, setToast] = useState<{ type: NoticeTone; title: string; message: string } | null>(null);

  // 更新後に「即」一覧APIを叩く共通関数
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

  const pendingCount = useMemo(() => Array.from(latestRequestByNoticeId.values()).filter((r) => r.flowStatus === "申請済").length, [latestRequestByNoticeId]);

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

      setToast({ type: "ok", title: "登録完了", message: "DRAFT として登録しました。" });
    },
    onError: (e) => {
      console.error("[createMutation] error", e);
      setToast({ type: "ng", title: "登録失敗", message: safeText((e as any)?.message) || "登録に失敗しました" });
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
      setToast({ type: "ok", title: "承認依頼を送信しました", message: "管理者の承認をお待ちください。" });
    },
    onError: (e) => {
      console.error("[requestApprovalMutation] error", e);
      setToast({ type: "ng", title: "送信失敗", message: safeText((e as any)?.message) || "承認依頼の送信に失敗しました" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchOrThrow(`/v1/api/admin/notices/${id}/archive`, { method: "POST", headers: { Accept: "application/json" } });
    },
    onSuccess: async () => {
      await refetchAdminList();
      await refetchFrontActive();
      setToast({ type: "ok", title: "アーカイブ完了", message: "アーカイブしました。" });
    },
    onError: (e) => {
      console.error("[archiveMutation] error", e);
      setToast({ type: "ng", title: "アーカイブ失敗", message: safeText((e as any)?.message) || "アーカイブに失敗しました" });
    },
  });

  // --- Form validation ---
  const canSubmitNormal = title.trim().length > 0 && body.trim().length > 0;
  const canSubmitFeatured = selectedFutureId !== "";
  const canSubmit = noticeType === "NORMAL" ? canSubmitNormal : canSubmitFeatured;

  const isRefreshing = noticesQuery.isFetching || approveRequestsQuery.isFetching;

  const columns: ConsoleColumn<Notice>[] = [
    { key: "id", header: "ID", mono: true, align: "right", cell: (n) => <span className="text-gray-500">{n.id}</span> },
    {
      key: "state",
      header: "状態",
      cell: (n) => {
        const req = latestRequestByNoticeId.get(n.id);
        return (
          <span className="inline-flex flex-col items-start gap-1">
            <StatusBadge tone={statusTone(n.status)}>{n.status}</StatusBadge>
            {req?.flowStatus === "申請済" && <StatusBadge tone="info">承認待ち</StatusBadge>}
            {req?.flowStatus === "差し戻し" && <StatusBadge tone="ng">差し戻し</StatusBadge>}
          </span>
        );
      },
    },
    {
      key: "type",
      header: "種別",
      cell: (n) => (
        <span className="inline-flex flex-col items-start gap-1">
          <StatusBadge tone={n.noticeType === "FEATURED_MATCH" ? "info" : "neutral"} dot={false}>
            {n.noticeType ?? "NORMAL"}
          </StatusBadge>
          {n.featureMatchId ? <span className="font-mono text-[11px] text-gray-500">match {n.featureMatchId}</span> : null}
        </span>
      ),
    },
    {
      key: "content",
      header: "タイトル / 内容",
      wrap: true,
      className: "min-w-[280px] max-w-[460px]",
      cell: (n) => {
        const req = latestRequestByNoticeId.get(n.id);
        return (
          <>
            <div className="font-bold">{n.title}</div>
            <div className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-xs text-gray-600">{n.body}</div>
            {req?.flowStatus === "差し戻し" && req.comment ? <div className="mt-1 text-[11px] text-red-700">差し戻し理由: {req.comment}</div> : null}
          </>
        );
      },
    },
    {
      key: "period",
      header: "表示期間",
      mono: true,
      className: "text-[11px] text-gray-600",
      cell: (n) => (
        <>
          <div>{n.displayFrom ?? "-"}</div>
          <div>{n.displayTo ?? "-"}</div>
        </>
      ),
    },
    { key: "publishedAt", header: "publishedAt", mono: true, className: "text-[11px] text-gray-600", cell: (n) => fmt(n.publishedAt) },
    { key: "updateTime", header: "updateTime", mono: true, className: "text-[11px] text-gray-600", cell: (n) => fmt(n.updateTime) },
    {
      key: "ops",
      header: "操作",
      align: "right",
      cell: (n) => {
        const isRequesting = requestingId === n.id;
        const isArchiving = archivingId === n.id;
        const rowBusy = isRequesting || isArchiving;

        const relatedRequest = latestRequestByNoticeId.get(n.id);
        const isPendingRequest = relatedRequest?.flowStatus === "申請済";
        const isRejectedRequest = relatedRequest?.flowStatus === "差し戻し";
        const isDraft = (n.status ?? "").toUpperCase() === "DRAFT";
        const canRequestApproval = isDraft && !isPendingRequest;

        return (
          <span className="inline-flex gap-1.5">
            {canRequestApproval ? (
              <ConsoleButton
                size="sm"
                variant="primary"
                disabled={rowBusy}
                loading={isRequesting}
                onClick={async () => {
                  setRequestingId(n.id);
                  try {
                    await requestApprovalMutation.mutateAsync(n.id);
                  } finally {
                    setRequestingId(null);
                  }
                }}
              >
                {!isRequesting && <Send className="h-3 w-3" />}
                {isRequesting ? "送信中…" : isRejectedRequest ? "再度、承認依頼" : "承認依頼"}
              </ConsoleButton>
            ) : isPendingRequest ? (
              <ConsoleButton size="sm" disabled>
                承認待ち
              </ConsoleButton>
            ) : null}

            <ConsoleButton
              size="sm"
              disabled={rowBusy}
              loading={isArchiving}
              onClick={async () => {
                setArchivingId(n.id);
                try {
                  await archiveMutation.mutateAsync(n.id);
                } finally {
                  setArchivingId(null);
                }
              }}
            >
              {!isArchiving && <Archive className="h-3 w-3" />}
              {isArchiving ? "アーカイブ中…" : "アーカイブ"}
            </ConsoleButton>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="お知らせ設定" info="通常お知らせ / 注目試合お知らせ（future_master）を登録。公開は管理者への承認依頼を経て行われます">
        <ConsoleButton
          variant="primary"
          loading={isRefreshing}
          onClick={async () => {
            await refetchAdminList();
            await refetchApproveRequests();
          }}
        >
          {!isRefreshing && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
      </ConsoleToolbar>

      <StatChips
        loading={noticesQuery.isLoading}
        items={[
          { label: "total", value: stats.total },
          { label: "published", value: stats.published, tone: "ok" },
          { label: "draft", value: stats.draft, tone: "warn" },
          { label: "archived", value: stats.archived },
          { label: "承認待ち", value: pendingCount, tone: pendingCount > 0 ? "info" : "default" },
        ]}
      />

      {toast && (
        <ConsoleNotice tone={toast.type} title={toast.title} onClose={() => setToast(null)}>
          {toast.message}
        </ConsoleNotice>
      )}

      {/* ===== 登録 ===== */}
      <ConsolePanel
        title="登録（DRAFT）"
        info="表示期間は任意。注目試合は候補から選択して登録します"
        right={
          <SegmentedTabs<NoticeType>
            value={noticeType}
            onChange={(v) => {
              setNoticeType(v);
              if (v === "NORMAL") setSelectedFutureId("");
            }}
            options={[
              { value: "NORMAL", label: "通常" },
              { value: "FEATURED_MATCH", label: "注目試合" },
            ]}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ConsoleField label="表示開始">
            <ConsoleInput type="datetime-local" value={displayFrom} onChange={(e) => setDisplayFrom(e.target.value)} className="w-full" />
          </ConsoleField>
          <ConsoleField label="表示終了">
            <ConsoleInput type="datetime-local" value={displayTo} onChange={(e) => setDisplayTo(e.target.value)} className="w-full" />
          </ConsoleField>
        </div>

        <div className="mt-3">
          {noticeType === "NORMAL" ? (
            <div className="grid gap-3">
              <ConsoleField label="タイトル" hint={title.trim().length === 0 ? <span className="text-amber-700">タイトルは必須です</span> : undefined}>
                <ConsoleInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例）メンテナンスのお知らせ" className="w-full" />
              </ConsoleField>
              <ConsoleField label="内容" hint={body.trim().length === 0 ? <span className="text-amber-700">内容は必須です</span> : undefined}>
                <ConsoleTextarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="例）2/10 02:00-03:00 にメンテナンスします" className="w-full resize-y" />
              </ConsoleField>
            </div>
          ) : (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-[13px] text-gray-900">注目試合候補</b>
                <span className="text-xs text-gray-500">country / league / limit を調整して候補を取得 → 試合を選択</span>
                <span className="ml-auto">
                  <StatusBadge tone={futureQuery.isFetching ? "warn" : "ok"}>{futureQuery.isFetching ? "取得中…" : "候補OK"}</StatusBadge>
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 md:max-w-xl">
                <ConsoleField label="country">
                  <ConsoleInput value={country} onChange={(e) => setCountry(e.target.value)} placeholder="例）jp" className="w-full" />
                </ConsoleField>
                <ConsoleField label="league">
                  <ConsoleInput value={league} onChange={(e) => setLeague(e.target.value)} placeholder="例）j1" className="w-full" />
                </ConsoleField>
                <ConsoleField label="limit">
                  <ConsoleInput type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={1} max={200} className="w-full" />
                </ConsoleField>
              </div>

              <div className="mt-2.5">
                {futureQuery.isLoading ? (
                  <div className="text-xs text-gray-400">候補を読み込み中…</div>
                ) : futureQuery.error ? (
                  <div className="text-xs text-red-700">候補取得エラー: {safeText((futureQuery.error as any)?.message)}</div>
                ) : (
                  <>
                    <ConsoleSelect value={selectedFutureId} onChange={(e) => setSelectedFutureId(e.target.value ? Number(e.target.value) : "")} className="w-full">
                      <option value="">注目試合を選択してください</option>
                      {matches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.futureTime ? m.futureTime : ""}　{m.homeTeam} vs {m.awayTeam}（id={m.id}）
                        </option>
                      ))}
                    </ConsoleSelect>
                    {selectedMatch ? (
                      <div className="mt-1.5 text-xs text-gray-600">
                        選択中:{" "}
                        <b className="text-gray-900">
                          {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                        </b>{" "}
                        <span className="font-mono">（id={selectedMatch.id}）</span>
                        {selectedMatch.link ? <div className="mt-0.5 break-all font-mono text-[11px]">link: {selectedMatch.link}</div> : null}
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs text-amber-700">試合を選択してください</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ConsoleButton variant="primary" onClick={() => createMutation.mutate()} disabled={!canSubmit} loading={createMutation.isPending}>
            {createMutation.isPending ? "登録中…" : "登録（DRAFT）"}
          </ConsoleButton>
          <StatusBadge tone={noticeType === "NORMAL" ? "neutral" : "info"} dot={false}>
            {noticeType}
          </StatusBadge>
          <StatusBadge tone="neutral" dot={false}>
            {displayFrom || displayTo ? "期間指定あり" : "期間指定なし"}
          </StatusBadge>
          {createMutation.error ? <span className="text-xs text-red-700">{safeText((createMutation.error as any)?.message)}</span> : null}
        </div>
      </ConsolePanel>

      {/* ===== 一覧 ===== */}
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-sm font-bold text-gray-900">一覧</h2>
        <span className="text-xs text-gray-500">DRAFT は「承認依頼」→ 管理者が承認すると自動的に公開されます</span>
      </div>
      <ConsoleTable
        columns={columns}
        rows={notices}
        rowKey={(n) => n.id}
        loading={noticesQuery.isLoading}
        error={noticesQuery.error ? `一覧取得エラー: ${safeText((noticesQuery.error as any)?.message)}` : undefined}
        emptyText="データがありません。"
      />
    </div>
  );
}
