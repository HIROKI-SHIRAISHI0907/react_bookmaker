import React, { useState } from "react";
import { Link } from "react-router-dom";
import { registerMailInfoApi, requestMailInfoApprovalApi } from "../../../api/mailinfo";
import MailInfoForm, { MailInfoFormValues } from "./MailRegisterFormPage";
import { useCurrentRole } from "../../../hooks/useCurrentRole";

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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>メール情報登録</h1>
        <p style={styles.desc}>メールID・件名・本文・送信元メールアドレスを登録します。</p>

        {isAdminSub && (
          <div style={styles.noticeBox}>
            担当者としてログインしています。登録すると、この内容は管理者への「登録依頼」として送信され、
            管理者が承認した時点でメール一覧に反映されます。
          </div>
        )}

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

        <div style={{ marginTop: 14 }}>
          <Link to="/admin/mailinfo">一覧へ戻る</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "#f6f7fb",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "white",
    border: "1px solid #e6e8ef",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  title: { margin: "0 0 8px", fontSize: 22 },
  desc: {
    margin: "0 0 12px",
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 1.5,
  },
  noticeBox: {
    margin: "0 0 16px",
    padding: 12,
    borderRadius: 10,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 13,
    lineHeight: 1.6,
  },
};
