import React, { useMemo, useState } from "react";

type SubInput = {
  optionNum: string;
  options: string;
  validFlg: string;
};

type ApiErrorResponse = {
  message?: string;
  errors?: Array<{ field?: string; defaultMessage?: string }>;
};

const API_URL = "/v1/api/admin/sub-input";

function validateSubInput(input: SubInput): string[] {
  const errors: string[] = [];

  if (!input.optionNum.trim()) {
    errors.push("optionNumは必須です。");
  } else if (!/^[12]$/.test(input.optionNum.trim())) {
    errors.push("optionNumは 1 または 2 を指定してください。");
  }

  if (!input.options.trim()) {
    errors.push("optionsは必須です。");
  } else if (input.optionNum === "1") {
    if (!/^\d+\s*-\s*\d+$/.test(input.options.trim())) {
      errors.push("optionNum=1 の場合、optionsは '1-2' のような形式で入力してください。");
    }
  } else if (input.optionNum === "2") {
    if (!/^[^:]+\s*:\s*.+$/.test(input.options.trim())) {
      errors.push("optionNum=2 の場合、optionsは '日本:J1 リーグ' のような形式で入力してください。");
    }
  }

  if (!input.validFlg.trim()) {
    errors.push("validFlgは必須です。");
  } else if (!/^[01]$/.test(input.validFlg.trim())) {
    errors.push("validFlgは 0 または 1 を指定してください。");
  }

  return errors;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let msg = `HTTP ${res.status} ${res.statusText}`;
    if (ct.includes("application/json") && text) {
      try {
        const json = JSON.parse(text) as ApiErrorResponse;
        if (json.errors?.length) {
          msg += "\n" + json.errors.map((e) => `${e.field ?? "field"}: ${e.defaultMessage ?? ""}`).join("\n");
        } else if (json.message) {
          msg += `\n${json.message}`;
        }
      } catch {
        msg += `\n${text}`;
      }
    } else if (text) {
      msg += `\n${text}`;
    }
    throw new Error(msg);
  }

  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export default function AdminSubInputPage() {
  const [form, setForm] = useState<SubInput>({
    optionNum: "1",
    options: "",
    validFlg: "0",
  });

  const [submitting, setSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const placeholder = useMemo(() => {
    if (form.optionNum === "1") return "例: 1-2";
    if (form.optionNum === "2") return "例: 日本:J1 リーグ";
    return "";
  }, [form.optionNum]);

  const handleChange = (key: keyof SubInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setServerMessage(null);
    setServerError(null);

    const errs = validateSubInput(form);
    setClientErrors(errs);
    if (errs.length > 0) return;

    setSubmitting(true);
    try {
      await postJson(API_URL, {
        subList: [form],
      });
      setServerMessage("登録しました。");
      setForm({
        optionNum: "1",
        options: "",
        validFlg: "0",
      });
      setClientErrors([]);
    } catch (err: any) {
      setServerError(String(err?.message ?? err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>選択肢登録</h1>
        <p style={{ marginTop: 8, color: "#666", fontSize: 14 }}>SubInput（optionNum / options / validFlg）を管理画面から登録します。</p>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          background: "#fff",
          padding: 20,
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 700 }}>選択肢No. (optionNum)</label>
            <select
              value={form.optionNum}
              onChange={handleChange("optionNum")}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
              }}
            >
              <option value="1">1 : スコア形式</option>
              <option value="2">2 : 国:リーグ形式</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 700 }}>選択肢 (options)</label>
            <input
              type="text"
              value={form.options}
              onChange={handleChange("options")}
              placeholder={placeholder}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                outline: "none",
              }}
            />
            <div style={{ fontSize: 12, color: "#666" }}>{form.optionNum === "1" ? "optionNum=1 の場合は 例: 1-2" : "optionNum=2 の場合は 例: 日本:J1 リーグ"}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 700 }}>有効フラグ (validFlg)</label>
            <select
              value={form.validFlg}
              onChange={handleChange("validFlg")}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
              }}
            >
              <option value="0">0 : 有効</option>
              <option value="1">1 : 無効</option>
            </select>
          </div>

          {clientErrors.length > 0 && (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#991b1b",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>入力エラー</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {clientErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {serverMessage && (
            <div
              style={{
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                borderRadius: 12,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {serverMessage}
            </div>
          )}

          {serverError && (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#991b1b",
                borderRadius: 12,
                padding: 12,
                fontSize: 12,
              }}
            >
              {serverError}
            </pre>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #111827",
                background: submitting ? "#9ca3af" : "#111827",
                color: "#fff",
                cursor: submitting ? "default" : "pointer",
                fontWeight: 700,
              }}
            >
              {submitting ? "登録中..." : "登録"}
            </button>

            <button
              type="button"
              onClick={() => {
                setForm({ optionNum: "1", options: "", validFlg: "0" });
                setClientErrors([]);
                setServerMessage(null);
                setServerError(null);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              クリア
            </button>
          </div>
        </form>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          background: "#fff",
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>入力例</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#444", lineHeight: 1.8 }}>
          <li>
            <b>optionNum=1</b> → options: <code>1-2</code>
          </li>
          <li>
            <b>optionNum=2</b> → options: <code>日本:J1 リーグ</code>
          </li>
          <li>
            <b>validFlg</b> → <code>0</code> or <code>1</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
