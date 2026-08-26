import React from "react";

/**
 * メール情報登録画面・更新画面で共有するフォーム部分。
 * 登録時はmailIdを入力可能、更新時はmailIdを非活性にして呼び出す。
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
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <label style={styles.label}>
        メールID
        <input
          type="text"
          value={values.mailId}
          onChange={(e) => update({ mailId: e.target.value })}
          required
          disabled={!mailIdEditable}
          style={{ ...styles.input, ...(!mailIdEditable ? styles.inputDisabled : {}) }}
          placeholder="例: PASSWORD_RESET"
        />
      </label>

      <label style={styles.label}>
        メール件名
        <input type="text" value={values.mailSubject} onChange={(e) => update({ mailSubject: e.target.value })} required style={styles.input} />
      </label>

      <label style={styles.label}>
        送信元メールアドレス
        <input type="email" value={values.fromAddress} onChange={(e) => update({ fromAddress: e.target.value })} required style={styles.input} placeholder="no-reply@example.com" />
      </label>

      <label style={styles.label}>
        メール本文
        <textarea value={values.mailBody} onChange={(e) => update({ mailBody: e.target.value })} required rows={10} style={styles.textarea} />
      </label>

      {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}

      <button type="submit" disabled={submitting} style={styles.primaryButton}>
        {submitting ? "処理中..." : submitLabel}
      </button>

      {message && <div style={styles.message}>{message}</div>}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d7dbe7",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },
  inputDisabled: {
    background: "#f3f4f6",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d7dbe7",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical",
  },
  primaryButton: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#111827",
    color: "white",
    fontWeight: 600,
  },
  message: {
    padding: 10,
    borderRadius: 10,
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
  },
};
