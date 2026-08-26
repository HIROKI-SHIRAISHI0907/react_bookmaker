import React, { useState } from "react";
import { Link } from "react-router-dom";
import { registerMailInfoApi } from "../../../api/mailinfo";
import MailInfoForm, { MailInfoFormValues } from "./MailInfoForm";

/**
 * メール情報登録画面
 * メールID・件名・本文・送信元メールアドレスを登録する。
 * メールIDが既に登録済みの場合は重複エラーを表示する。
 *
 * ※現状のMailSendService.regMailMasterは、DBの一意制約違反も含めて
 *   例外を全てresponseCode="500"（システムエラー）として扱っており、
 *   重複だけを判別してresponseCode="409"を返す実装にはなっていません。
 *   「重複エラーメッセージ」を出すには、regMailMaster側で
 *   事前にfindByIdして存在チェックするか、DuplicateKeyExceptionを
 *   個別にキャッチしてresponseCode="409"を返すよう直す必要があります。
 *   ここではその対応がされた前提で、409を専用メッセージにしています。
 */

const EMPTY_VALUES: MailInfoFormValues = {
  mailId: "",
  mailSubject: "",
  mailBody: "",
  fromAddress: "",
};

export default function MailInfoRegisterPage() {
  const [values, setValues] = useState<MailInfoFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setSubmitting(true);

    const res = await registerMailInfoApi(values);
    setSubmitting(false);

    if (res.responseCode === "200") {
      setMessage("登録しました。");
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

        <MailInfoForm values={values} mailIdEditable submitting={submitting} submitLabel="登録する" onChange={setValues} onSubmit={onSubmit} message={message} errorMessage={errorMessage} />

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
};
