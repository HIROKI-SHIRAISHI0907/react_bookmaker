// src/pages/admin/mail/MailRegisterFormPage.tsx
import React from "react";
import { ConsoleButton, ConsoleField, ConsoleInput, ConsoleNotice, ConsoleTextarea } from "../../../api/commonAdminDesign";

/**
 * メール情報登録画面・更新画面で共有するフォーム部分。
 * 登録時はmailIdを入力可能、更新時はmailIdを非活性にして呼び出す。
 * （Props・型は変更なし。見た目だけ共通部品に置き換え）
 */

export type MailInfoFormValues = {
  mailId: string;
  mailSubject: string;
  mailBody: string;
  fromAddress: string;
};

type Props = {
  values: MailInfoFormValues;
  mailIdEditable: boolean;
  submitting: boolean;
  submitLabel: string;
  onChange: (values: MailInfoFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  message?: string | null;
  errorMessage?: string | null;
};

export default function MailInfoForm({ values, mailIdEditable, submitting, submitLabel, onChange, onSubmit, message, errorMessage }: Props) {
  const update = (patch: Partial<MailInfoFormValues>) => onChange({ ...values, ...patch });

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ConsoleField label="メールID" hint={!mailIdEditable ? "メールIDは変更できません" : undefined}>
          <ConsoleInput
            type="text"
            value={values.mailId}
            onChange={(e) => update({ mailId: e.target.value })}
            required
            disabled={!mailIdEditable}
            placeholder="例: PASSWORD_RESET"
            className="w-full font-mono"
          />
        </ConsoleField>

        <ConsoleField label="送信元メールアドレス">
          <ConsoleInput type="email" value={values.fromAddress} onChange={(e) => update({ fromAddress: e.target.value })} required placeholder="no-reply@example.com" className="w-full" />
        </ConsoleField>
      </div>

      <ConsoleField label="メール件名">
        <ConsoleInput type="text" value={values.mailSubject} onChange={(e) => update({ mailSubject: e.target.value })} required className="w-full" />
      </ConsoleField>

      <ConsoleField label="メール本文">
        <ConsoleTextarea value={values.mailBody} onChange={(e) => update({ mailBody: e.target.value })} required rows={10} className="w-full resize-y leading-relaxed" />
      </ConsoleField>

      {errorMessage && <ConsoleNotice tone="ng" title={errorMessage} className="mb-0" />}
      {message && <ConsoleNotice tone="ok" title={message} className="mb-0" />}

      <div>
        <ConsoleButton type="submit" variant="primary" loading={submitting}>
          {submitting ? "処理中…" : submitLabel}
        </ConsoleButton>
      </div>
    </form>
  );
}
