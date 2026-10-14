import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { ConsoleButton } from "../../../api/commonAdminDesign";

/**
 * 退会処理完了ページ。
 *
 * このページに来る時点でセッションは既に破棄済み（WithdrawalConfirmPage側でclearAuthSession()
 * 済み）のため、ログイン必須ガードの対象外にしてください。
 */
export default function WithdrawalCompletePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h1 className="m-0 text-[17px] font-bold text-gray-900">退会処理が完了しました</h1>
        <p className="m-0 mt-2 text-[13px] leading-relaxed text-gray-600">ご利用ありがとうございました。</p>
        <ConsoleButton variant="primary" className="mt-5 w-full" onClick={() => navigate("/login", { replace: true })}>
          ログイン画面へ
        </ConsoleButton>
      </div>
    </div>
  );
}
