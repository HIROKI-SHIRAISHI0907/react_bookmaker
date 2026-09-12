import React from "react";

/**
 * 承認フロー（依頼/指令）で扱う target_approvement_info の共通表示ロジック。
 *
 * target_approvement_info は targetKind によって中身が変わる:
 *  - MAIL_INFO: メール情報登録の依頼。メール情報登録画面(MailInfoForm)と同じ
 *    項目(mailId/mailSubject/fromAddress/mailBody)を持つJSON文字列。
 *  - NOTICE / SCREEN 等: 上記以外。JSON文字列の場合は同様に項目ごとに整形して表示し、
 *    JSONでなければプレーンテキストとしてそのまま表示する。
 *
 * 以前は一覧行に target_approvement_info の生JSON文字列をそのまま出力していたため、
 * 「メール情報: {"mailId":"...","mailBody":"..."}」のような読みにくい表示になっていた。
 * ここで一度パースし、(1)一覧行用の簡易タイトル/概要、(2)モーダル用の
 * メール情報登録画面と同じフォーマットの詳細表示、の2種類を共通関数として提供する。
 */

export type TargetItemLike = {
  targetKind?: string;
  targetApprovementInfo?: string;
};

export function targetKindLabel(targetKind?: string): string {
  if (targetKind === "NOTICE") return "お知らせ";
  if (targetKind === "SCREEN") return "画面";
  if (targetKind === "MAIL_INFO") return "メール情報";
  return targetKind ?? "-";
}

type ParsedTargetInfo =
  | { kind: "mailInfo"; mailId?: string; mailSubject?: string; mailBody?: string; fromAddress?: string }
  | { kind: "generic"; fields: { label: string; value: string }[] }
  | { kind: "plain"; text: string };

// 既知のキー名 → 画面表示用ラベル。MailInfoFormの項目名・順序に合わせている。
const FIELD_LABEL_ORDER: { key: string; label: string }[] = [
  { key: "mailId", label: "メールID" },
  { key: "mailSubject", label: "メール件名" },
  { key: "fromAddress", label: "送信元メールアドレス" },
  { key: "mailBody", label: "メール本文" },
  { key: "noticeId", label: "お知らせID" },
  { key: "noticeTitle", label: "タイトル" },
  { key: "title", label: "タイトル" },
  { key: "noticeBody", label: "本文" },
  { key: "body", label: "本文" },
  { key: "screenName", label: "画面名" },
];
const FIELD_LABELS: Record<string, string> = Object.fromEntries(FIELD_LABEL_ORDER.map((f) => [f.key, f.label]));

export function parseTargetInfo(raw?: string): ParsedTargetInfo {
  if (!raw || !raw.trim()) return { kind: "plain", text: "-" };

  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { kind: "plain", text: raw };
  }

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { kind: "plain", text: raw };
  }

  const record = obj as Record<string, unknown>;

  if ("mailId" in record || "mailSubject" in record || "mailBody" in record) {
    return {
      kind: "mailInfo",
      mailId: valueToText(record.mailId),
      mailSubject: valueToText(record.mailSubject),
      mailBody: valueToText(record.mailBody),
      fromAddress: valueToText(record.fromAddress),
    };
  }

  // 既知のキーを優先しつつ、その他のキーもそのままラベル化して表示する
  const knownFirst = [...FIELD_LABEL_ORDER.map((f) => f.key), ...Object.keys(record).filter((k) => !(k in FIELD_LABELS))];
  const seen = new Set<string>();
  const fields = knownFirst
    .filter((key) => key in record && !seen.has(key) && seen.add(key))
    .map((key) => ({ label: FIELD_LABELS[key] ?? key, value: valueToText(record[key]) ?? "" }))
    .filter((f) => f.value !== "");

  if (fields.length === 0) {
    return { kind: "plain", text: raw };
  }
  return { kind: "generic", fields };
}

function valueToText(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "object") return undefined;
  return String(v);
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim();
  return trimmed.length > n ? `${trimmed.slice(0, n)}…` : trimmed;
}

/** 一覧行に出す簡易タイトル(1行目相当) */
export function targetSummaryTitle(item: TargetItemLike): string {
  const parsed = parseTargetInfo(item.targetApprovementInfo);
  if (parsed.kind === "mailInfo") {
    return parsed.mailSubject || parsed.mailId || targetKindLabel(item.targetKind);
  }
  if (parsed.kind === "generic") {
    const titleField = parsed.fields.find((f) => /タイトル|件名/.test(f.label));
    return titleField?.value ?? parsed.fields[0]?.value ?? targetKindLabel(item.targetKind);
  }
  return truncate(parsed.text, 40);
}

/** 一覧行に出す簡易概要(2行目相当。無ければ空文字) */
export function targetSummaryDetail(item: TargetItemLike): string {
  const parsed = parseTargetInfo(item.targetApprovementInfo);
  if (parsed.kind === "mailInfo") {
    return parsed.mailBody ? truncate(parsed.mailBody, 60) : "";
  }
  if (parsed.kind === "generic") {
    const bodyField = parsed.fields.find((f) => /本文/.test(f.label));
    return bodyField ? truncate(bodyField.value, 60) : "";
  }
  return "";
}

/** モーダル用: メール情報登録画面と同じ並びで項目ごとに表示する */
export function TargetInfoView({ item }: { item: TargetItemLike }) {
  const parsed = parseTargetInfo(item.targetApprovementInfo);

  if (parsed.kind === "mailInfo") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <ReadOnlyField label="メールID" value={parsed.mailId ?? "-"} />
        <ReadOnlyField label="メール件名" value={parsed.mailSubject ?? "-"} />
        <ReadOnlyField label="送信元メールアドレス" value={parsed.fromAddress ?? "-"} />
        <ReadOnlyField label="メール本文" value={parsed.mailBody ?? "-"} multiline />
      </div>
    );
  }

  if (parsed.kind === "generic") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {parsed.fields.map((f) => (
          <ReadOnlyField key={f.label} label={f.label} value={f.value} multiline={f.value.length > 40} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ fontSize: 14, color: "#374151" }}>
      対象: {targetKindLabel(item.targetKind)} / {parsed.text}
    </div>
  );
}

export function ReadOnlyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>{label}</div>
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          fontSize: 14,
          color: "#111827",
          whiteSpace: multiline ? "pre-wrap" : "normal",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}
