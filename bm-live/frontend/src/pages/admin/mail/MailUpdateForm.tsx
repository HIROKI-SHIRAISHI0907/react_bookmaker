import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchMailInfoByIdApi, updateMailInfoApi } from "../../../api/mailinfo";
import MailInfoForm, { MailInfoFormValues } from "./MailInfoForm";

/**
 * メール情報更新画面
 * 一覧画面の「更新」ボタンから mailId を受け取り、
 * GET /v1/api/mailinfo/{mailId} で登録済み内容を取得してフォームに反映する。
 * メールIDは非活性（変更不可）にし、PATCH /v1/api/mailinfo/update で更新する。
 */

const EMPTY_VALUES: MailInfoFormValues = {
  mailId: "",
  mailSubject: "",
  mailBody: "",
  fromAddress: "",
};

export default function MailInfoUpdatePage() {
  const { mailId = "" } = useParams<{ mailId: string }>();

  const [values, setValues] = useState<MailInfoFormValues>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchMailInfoByIdApi(mailId);
        if (cancelled) return;
        setValues({
          mailId: data.mailId,
          mailSubject: data.mailSubject,
          mailBody: data.mailBody,
          fromAddress: data.fromAddress,
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "データの取得に失敗しました。");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mailId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setSubmitting(true);

    const res = await updateMailInfoApi(values);
    setSubmitting(false);

    if (res.responseCode === "200") {
      setMessage("更新しました。");
    } else {
      setErrorMessage(res.message || "更新に失敗しました。");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>メール情報更新</h1>
        <p style={styles.desc}>件名・本文・送信元メールアドレスを更新します（メールIDは変更できません）。</p>

        {loading && <p style={styles.desc}>読み込み中...</p>}
        {loadError && <div style={styles.errorText}>{loadError}</div>}

        {!loading && !loadError && (
          <MailInfoForm values={values} mailIdEditable={false} submitting={submitting} submitLabel="更新する" onChange={setValues} onSubmit={onSubmit} message={message} errorMessage={errorMessage} />
        )}

        <div style={{ marginTop: 14 }}>
          <Link to="/mailinfo">一覧へ戻る</Link>
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
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginBottom: 12,
  },
};
