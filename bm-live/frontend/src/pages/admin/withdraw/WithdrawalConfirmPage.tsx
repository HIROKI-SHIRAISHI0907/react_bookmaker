import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { clearAuthSession, getAccessToken, getTokenType } from "../../../utils/auth";
import { useCurrentRole } from "../../../hooks/useCurrentRole";
import { ConsoleButton, ConsoleNotice } from "../../../api/commonAdminDesign";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** 退会完了ページのパス（App.tsx のルートに合わせて変更してください） */
const WITHDRAWAL_COMPLETE_PATH = "/withdrawal/complete";

/**
 * 退会確認ページ（担当者のみ）。
 */
export default function WithdrawalConfirmPage() {
  const navigate = useNavigate();
  const currentRole = useCurrentRole();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 担当者以外（管理者・未ログイン等）が直接URLを叩いても操作できないようにする。
  // 画面自体への遷移可否は別途ルーター側のガードでも制御することを推奨。
  if (currentRole !== "ADMIN_SUB") {
    return (
      <div className="mx-auto mt-16 max-w-md">
        <ConsoleNotice tone="warn" title="このページは担当者のみご利用いただけます。" />
      </div>
    );
  }

  const handleWithdraw = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = getAccessToken();
      const tokenType = getTokenType();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `${tokenType} ${token}`;
      }
      const res = await fetch(`${API_BASE}/v1/api/account/withdraw`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrorMessage(body?.message ?? "退会処理に失敗しました。時間をおいて再度お試しください。");
        setSubmitting(false);
        return;
      }
      // 退会が完了したので、クライアント側のセッションも破棄してから完了ページへ。
      clearAuthSession();
      navigate(WITHDRAWAL_COMPLETE_PATH, { replace: true });
    } catch {
      setErrorMessage("通信に失敗しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <h1 className="m-0 text-[17px] font-bold text-gray-900">退会確認</h1>
        </div>

        <div className="mt-3 grid gap-2 text-[13px] leading-relaxed text-gray-700">
          <p className="m-0">退会すると、以降このアカウントでログインできなくなります。</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            あなたが起票した「申請中」の依頼は「保留」に、あなたが確認済みの指令は「未確認」に変更されます。
          </div>
          <p className="m-0 font-bold">本当に退会しますか？</p>
        </div>

        {errorMessage && <ConsoleNotice tone="ng" title={errorMessage} className="mb-0 mt-3" />}

        <div className="mt-5 flex justify-end gap-1.5">
          <ConsoleButton onClick={() => navigate(-1)} disabled={submitting}>
            キャンセル
          </ConsoleButton>
          <ConsoleButton variant="danger" onClick={() => void handleWithdraw()} loading={submitting}>
            {submitting ? "処理中…" : "退会する"}
          </ConsoleButton>
        </div>
      </div>
    </div>
  );
}
