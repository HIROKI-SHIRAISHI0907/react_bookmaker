// src/pages/admin/mail/MailInfoList.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { deleteMailInfoApi, fetchMailInfoListApi, MailInfoMasterEntity } from "../../../api/mailinfo";
import { ConsoleButton, ConsoleColumn, ConsoleNotice, ConsoleTable, ConsoleToolbar } from "../../../api/commonAdminDesign";

/**
 * メール情報一覧画面
 * 現在登録されているメール情報マスタの内容を取得して表示する。
 * 「再読み込み」ボタン押下でGET /v1/api/admin/mailinfoを叩き直す。
 *
 * 削除は誤操作防止のため、ボタン押下で即削除せず、行内に確認表示を出してから
 * 「削除する」を押した場合のみ DELETE /v1/api/admin/mailinfo/{mailId} を呼ぶ。
 */

function formatBodyPreview(body: string): string {
  if (!body) return "";
  // テーブル内で改行が視認できるよう、改行を「 ↵ 」に変換して1行表示にする
  return body.split(/\r\n|\r|\n/).join(" ↵ ");
}

export default function MailInfoListPage() {
  const [list, setList] = useState<MailInfoMasterEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMailInfoListApi();
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleDelete = useCallback(
    async (mailId: string) => {
      setDeletingId(mailId);
      setError(null);
      setMessage(null);
      try {
        const res = await deleteMailInfoApi(mailId);
        if (res.responseCode && res.responseCode !== "200") {
          setError(res.message ?? "削除に失敗しました。");
        } else {
          setMessage(res.message ?? "削除しました。");
          await handleSearch();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "削除に失敗しました。");
      } finally {
        setDeletingId(null);
        setConfirmingId(null);
      }
    },
    [handleSearch],
  );

  const columns: ConsoleColumn<MailInfoMasterEntity>[] = [
    { key: "mailId", header: "メールID", mono: true, cell: (item) => item.mailId },
    { key: "mailSubject", header: "メール件名", wrap: true, className: "min-w-[180px]", cell: (item) => item.mailSubject },
    {
      key: "mailBody",
      header: "メール本文",
      wrap: true,
      className: "min-w-[280px] max-w-[520px] text-gray-600",
      cell: (item) => <span className="line-clamp-2">{formatBodyPreview(item.mailBody)}</span>,
    },
    {
      key: "ops",
      header: "操作",
      align: "right",
      cell: (item) => {
        const isConfirming = confirmingId === item.mailId;
        const isDeleting = deletingId === item.mailId;
        if (isConfirming) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1">
              <span className="text-xs font-bold text-red-700">本当に削除しますか？</span>
              <ConsoleButton size="sm" onClick={() => setConfirmingId(null)} disabled={isDeleting}>
                キャンセル
              </ConsoleButton>
              <ConsoleButton size="sm" variant="danger" onClick={() => void handleDelete(item.mailId)} loading={isDeleting}>
                {isDeleting ? "削除中…" : "削除する"}
              </ConsoleButton>
            </span>
          );
        }
        return (
          <span className="inline-flex gap-1.5">
            <Link
              to={`/admin/mailinfo/${encodeURIComponent(item.mailId)}/edit`}
              className="inline-flex h-7 items-center rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-900 no-underline hover:bg-gray-50"
            >
              更新
            </Link>
            <ConsoleButton
              size="sm"
              className="!border-red-200 !text-red-700 hover:!bg-red-50"
              onClick={() => {
                setError(null);
                setMessage(null);
                setConfirmingId(item.mailId);
              }}
            >
              削除
            </ConsoleButton>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <ConsoleToolbar title="メール情報登録設定" info={`メール情報マスタ・${list.length}件`}>
        <ConsoleButton onClick={() => void handleSearch()} loading={loading}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          再読み込み
        </ConsoleButton>
        <Link
          to="/admin/mailinfo/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-600 bg-indigo-600 px-3 text-[13px] font-bold text-white no-underline hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          新規登録
        </Link>
      </ConsoleToolbar>

      {error && <ConsoleNotice tone="ng" title={error} onClose={() => setError(null)} />}
      {message && <ConsoleNotice tone="ok" title={message} onClose={() => setMessage(null)} />}

      <ConsoleTable
        columns={columns}
        rows={list}
        rowKey={(item) => item.mailId}
        loading={loading}
        emptyText="データがありません。"
        rowClassName={(item) => (confirmingId === item.mailId ? "!bg-red-50/40" : "")}
      />
    </div>
  );
}
