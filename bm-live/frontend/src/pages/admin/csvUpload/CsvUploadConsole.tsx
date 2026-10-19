import React, { useCallback, useMemo, useRef, useState } from "react";
import { Download, FileArchive, Upload, X } from "lucide-react";
import { ConsoleButton, ConsoleColumn, ConsoleModal, ConsoleNotice, ConsolePanel, ConsoleTable, ConsoleToolbar, StatChips, StatChipItem, fmtNum } from "../../../api/commonAdminDesign";
import { getAccessToken, getTokenType } from "../../../utils/auth";

/**
 * CSV アップロード画面の共通部品（シーズン / チーム / 試合予定 / リアルタイム）
 *
 *   - フォーマット（見出し行だけの CSV を zip にしたもの）のダウンロード
 *       GET  /v1/api/admin/csv/upload/{masterName}/format
 *   - zip のアップロード（multipart/form-data、項目名 file）
 *       POST /v1/api/admin/csv/upload/{masterName}
 *       200: 受け付けた / 400: ファイル名・行エラー（どの行も反映しない）/ 401: 未ログイン / 500: サーバーエラー
 *
 *   どちらも Authorization: Bearer {JWT} を付けて送る（サーバーは JWT からログインユーザーを決める）。
 *
 *   zip の名前は「接頭辞_〇〇.zip」、中の CSV は zip と同じ名前（接頭辞_〇〇.csv）。
 *   Mac の「圧縮」で付く「接頭辞_〇〇.csv.zip」も同じ扱い（中の CSV は 接頭辞_〇〇.csv）。
 *   画面でも名前を先に確かめ、合わないときはアップロードしない（サーバー側でも同じチェックをする）。
 */

export type CsvMasterName = "season" | "team" | "future" | "realtime";

/** CSV の列の説明（画面の「CSV の書き方」に出す） */
export type CsvColumnGuide = {
  name: string;
  /** キー列（削除・非表示・再表示はこの列だけで対象を決める） */
  key?: boolean;
  /** 登録で必須 */
  requiredOnInsert?: boolean;
  note: string;
};

/** 処理区分の説明 */
export type CsvOperationGuide = {
  code: string;
  label: string;
  note: string;
};

type Props = {
  masterName: CsvMasterName;
  title: string;
  /** zip・CSV の名前の接頭辞（例: season_） */
  prefix: string;
  /** 対象テーブル（説明用） */
  tableName: string;
  description?: React.ReactNode;
  operations: CsvOperationGuide[];
  columns: CsvColumnGuide[];
  /** 画面固有の注意書き */
  notes?: React.ReactNode[];
};

type CsvUploadRowError = {
  rowNo: number;
  operation?: string;
  key?: string;
  message?: string;
};

type CsvUploadResponse = {
  masterName?: string;
  uploadId?: number;
  fileName?: string;
  /** PENDING（受け付けた・判定前）/ ERROR など */
  status?: string;
  errorPhase?: string;
  message?: string;
  totalCount?: number;
  insertCount?: number;
  updateCount?: number;
  deleteCount?: number;
  hideCount?: number;
  showCount?: number;
  errors?: CsvUploadRowError[];
};

type UploadResult = {
  status: number;
  body: CsvUploadResponse;
  fileName: string;
};

const API_BASE = "/v1/api/admin/csv/upload";

/** ログイン中の JWT を Authorization ヘッダーにする（未ログインなら付けない → サーバーが 401 を返す） */
function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `${getTokenType() || "Bearer"} ${token}` };
}

/** Content-Disposition からファイル名を取る（filename*= と filename= の両方） */
function fileNameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* 次を試す */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}

/** 画面側のファイル名チェック（サーバーと同じ決まり。中の CSV 名はサーバーで確かめる） */
function checkZipName(fileName: string, prefix: string): string | null {
  if (!fileName.toLowerCase().endsWith(".zip")) {
    return `zipファイルを選んでください。（${fileName}）`;
  }
  if (!fileName.startsWith(prefix)) {
    return `zipファイル名は「${prefix}」で始めてください。（${fileName}）`;
  }
  return null;
}

/** zip 名 → 中の CSV 名。Mac の「圧縮」で付く「〇〇.csv.zip」も「〇〇.csv」として扱う */
function expectedCsvName(zipName: string): string {
  return zipName.replace(/\.zip$/i, "").replace(/\.csv$/i, "") + ".csv";
}

const CsvUploadConsole: React.FC<Props> = ({ masterName, title, prefix, tableName, description, operations, columns, notes = [] }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadedName, setDownloadedName] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  /* ----- フォーマットのダウンロード ----- */
  const handleDownloadFormat = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);
    setDownloadedName(null);
    try {
      const response = await fetch(`${API_BASE}/${masterName}/format`, {
        credentials: "include",
        headers: { ...authHeaders() },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(response.status === 401 ? "ログインの有効期限が切れている可能性があります。ログインし直してください。" : `HTTP ${response.status}: ${text || response.statusText}`);
      }
      const blob = await response.blob();
      const name = fileNameFromDisposition(response.headers.get("content-disposition"), `${prefix}format.zip`);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setDownloadedName(name);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "フォーマットのダウンロードに失敗しました。");
    } finally {
      setDownloading(false);
    }
  }, [masterName, prefix]);

  /* ----- ファイル選択 ----- */
  const handleSelectFile = (selected: File | null) => {
    setResult(null);
    setRequestError(null);
    setFile(selected);
    setFileError(selected ? checkZipName(selected.name, prefix) : null);
  };

  const clearFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ----- アップロード ----- */
  const handleUpload = useCallback(async () => {
    if (!file) return;
    const nameError = checkZipName(file.name, prefix);
    if (nameError) {
      setFileError(nameError);
      setConfirmOpen(false);
      return;
    }

    setUploading(true);
    setRequestError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file, file.name);

      // Content-Type は付けない（FormData のときはブラウザが boundary 付きで自動で付ける）
      const response = await fetch(`${API_BASE}/${masterName}`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
        body: form,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const rawText = await response.text();
      if (!contentType.includes("application/json")) {
        throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 300) || response.statusText}`);
      }

      // 400 / 401 / 500 でも結果（メッセージ・エラー行）を JSON で返すので、そのまま表示する
      setResult({ status: response.status, body: JSON.parse(rawText) as CsvUploadResponse, fileName: file.name });
      if (response.ok) clearFile();
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
      setConfirmOpen(false);
    }
  }, [file, masterName, prefix]);

  /* ----- 結果 ----- */
  const body = result?.body;
  const errors = body?.errors ?? [];
  const succeeded = result != null && result.status === 200 && body?.status !== "ERROR" && errors.length === 0;

  const resultChips: StatChipItem[] = useMemo(
    () => [
      { label: "CSV行数", value: fmtNum(body?.totalCount ?? 0) },
      { label: "登録", value: fmtNum(body?.insertCount ?? 0), tone: (body?.insertCount ?? 0) > 0 ? "ok" : "default" },
      { label: "更新", value: fmtNum(body?.updateCount ?? 0), tone: (body?.updateCount ?? 0) > 0 ? "ok" : "default" },
      { label: "削除", value: fmtNum(body?.deleteCount ?? 0), tone: (body?.deleteCount ?? 0) > 0 ? "warn" : "default" },
      { label: "非表示", value: fmtNum(body?.hideCount ?? 0), tone: (body?.hideCount ?? 0) > 0 ? "warn" : "default" },
      { label: "再表示", value: fmtNum(body?.showCount ?? 0), tone: (body?.showCount ?? 0) > 0 ? "info" : "default" },
      { label: "エラー", value: fmtNum(errors.length), tone: errors.length > 0 ? "ng" : "default" },
    ],
    [body, errors.length],
  );

  const errorColumns: ConsoleColumn<CsvUploadRowError>[] = [
    { key: "rowNo", header: "行", mono: true, align: "right", cell: (e) => (e.rowNo === 0 ? "-" : e.rowNo) },
    { key: "operation", header: "処理区分", cell: (e) => e.operation || "-" },
    { key: "key", header: "キー", wrap: true, className: "min-w-[220px] break-all", cell: (e) => e.key || "-" },
    { key: "message", header: "エラー内容", wrap: true, className: "min-w-[280px]", cell: (e) => <span className="text-red-700">{e.message || "-"}</span> },
  ];

  const operationColumns: ConsoleColumn<CsvOperationGuide>[] = [
    { key: "code", header: "値", mono: true, align: "center", cell: (o) => o.code },
    { key: "label", header: "名前", cell: (o) => <b>{o.label}</b> },
    { key: "note", header: "内容", wrap: true, cell: (o) => o.note },
  ];

  const columnGuideColumns: ConsoleColumn<CsvColumnGuide>[] = [
    { key: "no", header: "No", mono: true, align: "right", cell: (_c, i) => <span className="text-gray-500">{i + 1}</span> },
    { key: "name", header: "列名（1行目）", cell: (c) => <span className="font-bold">{c.name}</span> },
    { key: "key", header: "キー", align: "center", cell: (c) => (c.key ? <span className="font-bold text-indigo-700">●</span> : "") },
    { key: "required", header: "登録で必須", align: "center", cell: (c) => (c.requiredOnInsert ? <span className="font-bold text-emerald-700">●</span> : "") },
    { key: "note", header: "説明", wrap: true, className: "min-w-[320px]", cell: (c) => c.note },
  ];

  const sampleZip = `${prefix}20261018.zip`;

  /** 結果欄の見出しメッセージ */
  const resultTitle = (() => {
    if (body?.message) return body.message;
    if (succeeded) return "受け付けました。";
    if (result?.status === 401) return "ログインしてからアップロードしてください。";
    return "反映できませんでした。";
  })();

  return (
    <div>
      <ConsoleToolbar
        title={title}
        info={tableName}
        description={description ?? "フォーマットをダウンロードして行を追記し、同じ名前のまま zip にしてアップロードします。1 行でもエラーがあれば、どの行も反映しません。"}
      >
        <ConsoleButton onClick={() => void handleDownloadFormat()} loading={downloading}>
          {!downloading && <Download className="h-3.5 w-3.5" />}
          フォーマットをダウンロード
        </ConsoleButton>
      </ConsoleToolbar>

      {downloadError && (
        <ConsoleNotice tone="ng" title="フォーマットをダウンロードできませんでした。" onClose={() => setDownloadError(null)}>
          {downloadError}
        </ConsoleNotice>
      )}
      {downloadedName && (
        <ConsoleNotice tone="ok" title={`${downloadedName} をダウンロードしました。`} onClose={() => setDownloadedName(null)}>
          中の CSV（{expectedCsvName(downloadedName)}）に行を追記し、名前を変えずに zip にし直してアップロードしてください。
        </ConsoleNotice>
      )}

      {/* ----- アップロード ----- */}
      <ConsolePanel
        title="アップロード"
        info={`zip の名前は「${prefix}」で始め、中の CSV は zip と同じ名前にする（例: ${sampleZip} の中に ${expectedCsvName(sampleZip)}。Mac の「圧縮」で付く 〇〇.csv.zip も可）`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)} disabled={uploading} />
          <ConsoleButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <FileArchive className="h-3.5 w-3.5" />
            zip を選ぶ
          </ConsoleButton>

          {file ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs text-gray-800">
              {file.name}
              <span className="text-gray-400">（{fmtNum(Math.ceil(file.size / 1024))} KB）</span>
              <button type="button" onClick={clearFile} disabled={uploading} className="text-gray-400 hover:text-gray-700" aria-label="選択を取り消す">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <span className="text-xs text-gray-400">ファイルが選ばれていません。</span>
          )}

          <ConsoleButton variant="primary" className="ml-auto" onClick={() => setConfirmOpen(true)} disabled={!file || fileError != null || uploading} loading={uploading}>
            {!uploading && <Upload className="h-3.5 w-3.5" />}
            アップロード
          </ConsoleButton>
        </div>

        {fileError && (
          <ConsoleNotice tone="ng" className="mt-2.5 mb-0">
            {fileError}
          </ConsoleNotice>
        )}
      </ConsolePanel>

      {requestError && (
        <ConsoleNotice tone="ng" title="アップロードできませんでした。" onClose={() => setRequestError(null)}>
          {requestError}
        </ConsoleNotice>
      )}

      {/* ----- 結果 ----- */}
      {result && (
        <ConsolePanel title="結果" info={result.fileName} right={<span className={`text-xs font-bold ${succeeded ? "text-emerald-700" : "text-red-700"}`}>HTTP {result.status}</span>}>
          <ConsoleNotice tone={succeeded ? "ok" : "ng"} title={resultTitle}>
            {!succeeded && errors.length > 0 && "下の行を直して、もう一度アップロードしてください（どの行も反映していません）。"}
            {!succeeded && result.status === 401 && "ログインの有効期限が切れている可能性があります。ログインし直してからもう一度アップロードしてください。"}
            {succeeded && "反映はバッチで行います。結果は「ファイルアップロード状況管理」で確認できます。"}
          </ConsoleNotice>
          <StatChips items={resultChips} />
          {errors.length > 0 && <ConsoleTable columns={errorColumns} rows={errors} rowKey={(e, i) => `${e.rowNo}-${i}`} maxHeight="420px" emptyText="エラーはありません。" />}
        </ConsolePanel>
      )}

      {/* ----- CSV の書き方 ----- */}
      <ConsolePanel title="処理区分" info="CSV の「処理区分」列に、値（番号）か名前のどちらかを書く" flush>
        <ConsoleTable columns={operationColumns} rows={operations} rowKey={(o) => o.code} />
      </ConsolePanel>

      <ConsolePanel title="CSV の列" info="1 行目は見出し（フォーマットのまま変えない）。文字コードは UTF-8" flush>
        <ConsoleTable columns={columnGuideColumns} rows={columns} rowKey={(c) => c.name} />
      </ConsolePanel>

      {notes.length > 0 && (
        <ConsolePanel title="注意">
          <ul className="m-0 list-disc space-y-1 pl-5 text-xs leading-relaxed text-gray-600">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </ConsolePanel>
      )}

      {/* ----- 確認 ----- */}
      <ConsoleModal
        open={confirmOpen}
        title="アップロードして反映しますか？"
        description={`${tableName} に反映します。1 行でもエラーがあれば、どの行も反映しません。`}
        onClose={() => setConfirmOpen(false)}
        busy={uploading}
        width={560}
        footer={
          <div className="ml-auto flex gap-1.5">
            <ConsoleButton onClick={() => setConfirmOpen(false)} disabled={uploading}>
              キャンセル
            </ConsoleButton>
            <ConsoleButton variant="success" onClick={() => void handleUpload()} loading={uploading} className="min-w-[80px]">
              {uploading ? "反映中…" : "OK"}
            </ConsoleButton>
          </div>
        }
      >
        <div className="grid gap-1 text-sm">
          <div>
            <span className="text-gray-500">ファイル：</span>
            <span className="font-mono">{file?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">中の CSV：</span>
            <span className="font-mono">{file ? expectedCsvName(file.name) : "-"}</span>
          </div>
        </div>
      </ConsoleModal>
    </div>
  );
};

export default CsvUploadConsole;
