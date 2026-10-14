// src/pages/admin/mail/MailUpdateFormPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchMailInfoByIdApi, updateMailInfoApi } from "../../../api/mailinfo";
import MailInfoForm, { MailInfoFormValues } from "./MailRegisterFormPage";
import { ConsoleNotice, ConsolePanel, ConsoleToolbar } from "../../../api/commonAdminDesign";

/**
 * メール情報更新画面
 * 一覧画面の「更新」ボタンから mailId を受け取り、
 * GET /v1/api/admin/mailinfo/{mailId} で登録済み内容を取得してフォームに反映する。
 * メールIDは非活性（変更不可）にし、PATCH /v1/api/admin/mailinfo/update で更新する。
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
    <div className="max-w-3xl">
      <ConsoleToolbar title="メール情報更新" info={<span className="font-mono">{mailId || "-"}</span>}>
        <Link to="/admin/mailinfo" className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-bold text-gray-500 no-underline hover:bg-gray-100 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />
          一覧へ戻る
        </Link>
      </ConsoleToolbar>

      {loadError && <ConsoleNotice tone="ng" title={loadError} />}

      <ConsolePanel title="更新内容" info="件名・本文・送信元メールアドレスを更新します（メールIDは変更できません）">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">読み込み中…</div>
        ) : loadError ? (
          <div className="py-8 text-center text-sm text-gray-400">データを表示できません。</div>
        ) : (
          <MailInfoForm values={values} mailIdEditable={false} submitting={submitting} submitLabel="更新する" onChange={setValues} onSubmit={onSubmit} message={message} errorMessage={errorMessage} />
        )}
      </ConsolePanel>
    </div>
  );
}
