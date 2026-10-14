import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

/**
 * 無効画面（汎用エラー画面）
 * パスワード再設定リンクが期限切れ・使用済み・改ざん等、
 * いずれの理由であっても同じ汎用メッセージを表示する。
 * （AdminLayout の外で表示されるため、ページ全体の背景もここで持つ）
 */
export default function InvalidPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f6f8] p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="m-0 text-[17px] font-bold text-gray-900">システムエラー</h1>
        <p className="m-0 mt-2 text-[13px] leading-relaxed text-gray-600">システムエラーが発生しました。ログイン画面に遷移してください。</p>

        <Link
          to="/login"
          className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-lg border border-indigo-600 bg-indigo-600 text-[13px] font-bold text-white no-underline hover:bg-indigo-700"
        >
          ログイン画面へ
        </Link>
      </div>
    </div>
  );
}
