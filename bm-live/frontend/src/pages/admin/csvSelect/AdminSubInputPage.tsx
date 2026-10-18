import React, { useMemo, useState } from "react";
import { ConsoleButton, ConsoleField, ConsoleInput, ConsoleNotice, ConsolePanel, ConsoleSelect, ConsoleToolbar } from "../../../api/commonAdminDesign";

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

const EMPTY_FORM: SubInput = { optionNum: "1", options: "", validFlg: "0" };

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
  const [form, setForm] = useState<SubInput>(EMPTY_FORM);
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
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
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
      await postJson(API_URL, { subList: [form] });
      setServerMessage("登録しました。");
      setForm(EMPTY_FORM);
      setClientErrors([]);
    } catch (err: any) {
      setServerError(String(err?.message ?? err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setClientErrors([]);
    setServerMessage(null);
    setServerError(null);
  };

  return (
    <div className="max-w-4xl">
      <ConsoleToolbar title="統計用CSV作成前詳細設定" info="SubInput（optionNum / options / validFlg）を登録します" />

      {clientErrors.length > 0 && (
        <ConsoleNotice tone="ng" title="入力エラー" onClose={() => setClientErrors([])}>
          {clientErrors.map((err) => `・${err}`).join("\n")}
        </ConsoleNotice>
      )}
      {serverMessage && <ConsoleNotice tone="ok" title={serverMessage} onClose={() => setServerMessage(null)} />}
      {serverError && (
        <ConsoleNotice tone="ng" title="登録に失敗しました" onClose={() => setServerError(null)}>
          {serverError}
        </ConsoleNotice>
      )}

      <ConsolePanel title="登録内容">
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr_160px]">
            <ConsoleField label="選択肢No.（optionNum）">
              <ConsoleSelect value={form.optionNum} onChange={handleChange("optionNum")}>
                <option value="1">1 : スコア形式</option>
                <option value="2">2 : 国:リーグ形式</option>
              </ConsoleSelect>
            </ConsoleField>

            <ConsoleField label="選択肢（options）" hint={form.optionNum === "1" ? "optionNum=1 の場合は 例: 1-2" : "optionNum=2 の場合は 例: 日本:J1 リーグ"}>
              <ConsoleInput type="text" value={form.options} onChange={handleChange("options")} placeholder={placeholder} />
            </ConsoleField>

            <ConsoleField label="有効フラグ（validFlg）">
              <ConsoleSelect value={form.validFlg} onChange={handleChange("validFlg")}>
                <option value="0">0 : 有効</option>
                <option value="1">1 : 無効</option>
              </ConsoleSelect>
            </ConsoleField>
          </div>

          <div className="flex gap-1.5">
            <ConsoleButton type="submit" variant="primary" loading={submitting}>
              {submitting ? "登録中…" : "登録"}
            </ConsoleButton>
            <ConsoleButton onClick={handleClear} disabled={submitting}>
              クリア
            </ConsoleButton>
          </div>
        </form>
      </ConsolePanel>

      <ConsolePanel title="入力例">
        <ul className="m-0 grid gap-1 pl-4 text-[13px] text-gray-700">
          <li>
            <b>optionNum=1</b> → options: <code className="rounded bg-gray-100 px-1.5 font-mono text-xs">1-2</code>
          </li>
          <li>
            <b>optionNum=2</b> → options: <code className="rounded bg-gray-100 px-1.5 font-mono text-xs">日本:J1 リーグ</code>
          </li>
          <li>
            <b>validFlg</b> → <code className="rounded bg-gray-100 px-1.5 font-mono text-xs">0</code>（有効）または <code className="rounded bg-gray-100 px-1.5 font-mono text-xs">1</code>（無効）
          </li>
        </ul>
      </ConsolePanel>
    </div>
  );
}
