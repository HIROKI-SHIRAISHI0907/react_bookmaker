import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { registerMailInfoApi, requestMailInfoApprovalApi } from "../../../api/mailinfo";
import MailInfoForm, { MailInfoFormValues } from "./MailRegisterFormPage";
import { useCurrentRole } from "../../../hooks/useCurrentRole";
import { ConsoleNotice, ConsolePanel, ConsoleToolbar } from "../../../api/commonAdminDesign";

/**
 * メール情報登録画面
 * メールID・件名・本文・送信元メールアドレスを登録する。
 * メールIDが既に登録済みの場合は重複エラーを表示する。
 *
 * ロールがADMINの場合はそのままメール情報マスタへ登録する(従来通り)。
 * ロールがADMIN_SUB(担当者)の場合は直接登録せず、承認フロー経由でADMINに
 * 登録を依頼する。ADMINが申請確認画面で承認すると、その時点で実際に
 * メール情報マスタへ登録され、メール一覧に出てくるようになる
 * (dev.web.api.bm_a028.AdminApproveService#approveRequest 内のMAIL_INFO分岐を参照)。
 *
 * ※現状のMailSendService.regMailMasterは、メールIDの重複を
 *   responseCode="404"で返す実装になっており、このページの"409"分岐は
 *   現状到達しません(重複時はelse分岐でres.messageがそのまま表示されます。
 *   その内容自体は「登録されているメールIDです。」なので実害はありませんが、
 *   ステータスコードとしては409の方が適切です。挙動を変える場合は
 *   バックエンド側の対応も必要なため、ここでは変更していません)。
 */

const EMPTY_VALUES: MailInfoFormValues = {
  mailId: "",
  mailSubject: "",
  mailBody: "",
  fromAddress: "",
};

export default function MailInfoRegisterPage() {
  const role = useCurrentRole();
  const isAdminSub = role === "ADMIN_SUB";

  const [values, setValues] = useState<MailInfoFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setSubmitting(true);

    const res = isAdminSub ? await requestMailInfoApprovalApi(values) : await registerMailInfoApi(values);
    setSubmitting(false);

    if (res.responseCode === "200") {
      setMessage(isAdminSub ? "管理者に登録を依頼しました。承認されるとメール一覧に反映されます。" : "登録しました。");
      setValues(EMPTY_VALUES);
    } else if (res.responseCode === "409") {
      setErrorMessage("このメールIDは既に登録されています。");
    } else {
      setErrorMessage(res.message || "登録に失敗しました。");
    }
  };

  return (
    <div className="max-w-3xl">
      <ConsoleToolbar title="メール情報登録" info="メールID・件名・本文・送信元メールアドレスを登録します">
        <Link to="/admin/mailinfo" className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-bold text-gray-500 no-underline hover:bg-gray-100 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />
          一覧へ戻る
        </Link>
      </ConsoleToolbar>

      {isAdminSub && (
        <ConsoleNotice tone="info" title="担当者としてログインしています">
          登録すると、この内容は管理者への「登録依頼」として送信され、管理者が承認した時点でメール一覧に反映されます。
        </ConsoleNotice>
      )}

      <ConsolePanel title="登録内容">
        <MailInfoForm
          values={values}
          mailIdEditable
          submitting={submitting}
          submitLabel={isAdminSub ? "登録を依頼する" : "登録する"}
          onChange={setValues}
          onSubmit={onSubmit}
          message={message}
          errorMessage={errorMessage}
        />
      </ConsolePanel>
    </div>
  );
}
