import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ConsoleButton, ConsoleModal, ConsoleNotice } from "../../../api/commonAdminDesign";
import { getAccessToken, getTokenType } from "../../../utils/auth";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";

/**
 * 大会一括アップロード（cup_competition_master）  /admin/csv-upload/cup
 *   どの大会（ACL など）を日程の取得対象にするかを zip（cup_〇〇.zip の中に cup_〇〇.csv）でまとめて登録する。
 *   GET  /v1/api/admin/csv/upload/cup/format
 *   POST /v1/api/admin/csv/upload/cup
 *   POST /v1/api/admin/csv/upload/cup/url-json  登録した大会（大会名・URL）を S3（aws-s3-cup-schedule-csv）の b026_cup_competition.json に出力
 *   バッチは使わず、その場で反映する（1 行でもエラーがあれば、どの行も反映しない）。
 *   反映した結果は「ファイルアップロード状況管理」に 正常終了 / 異常終了 で残る（種類: 大会）。
 */
const COLUMNS: CsvColumnGuide[] = [
  { name: "大会名", requiredOnInsert: true, note: "例: AFCチャンピオンズリーグエリート（100 文字まで）" },
  {
    name: "大会URL",
    key: true,
    requiredOnInsert: true,
    note: "Flashscore の大会ページ。例: https://www.flashscore.co.jp/soccer/asia/afc-champions-league/（日程・結果のページの URL でも可。500 文字まで）",
  },
];

const NOTES: React.ReactNode[] = [
  "大会名・大会URL のどちらかが空の行があると、アップロードできません（どの行も反映しない）。",
  "大会URL が同じ大会がすでにあれば大会名を更新し、日程を取る状態にします。無ければ新しく登録します。",
  "CSV に書かなかった大会は変わりません（取得をやめるときは「大会出場チーム登録設定」で「取らない」にするか削除）。",
  "同じ大会URL がファイル内に 2 回出てくるとエラーになります。",
  "出場チームは「大会出場チーム登録設定」で選んでください。反映すると、日程スクレイパーの入力（b026_cup_competition.json）も出力し直します。",
  "アップロードの結果は「ファイルアップロード状況管理」に残ります（バッチを通さないので、反映できたものはすぐ「正常終了」になります）。",
  "「登録したURLをJSONでアップロード」を押すと、取得対象の大会の大会名・URL を b026_cup_competition.json に出力します（反映したときにも自動で出力します）。結果タブのスクレイパーはこの URL の「結果」タブを読み、b001_country_league.json のチームが出た試合だけを取ります。",
];

type UrlJsonResult = { responseCode: string; message: string; count: number };

/** 登録した大会（大会名・URL）を JSON（b026_cup_competition.json）で S3 に出力するボタン */
const CupUrlJsonButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const token = getAccessToken();
      const response = await fetch("/v1/api/admin/csv/upload/cup/url-json", {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `${getTokenType() || "Bearer"} ${token}` } : {}) },
      });
      const body = (await response.json().catch(() => null)) as UrlJsonResult | null;
      const ok = response.ok && body?.responseCode === "0";
      setResult({ ok, message: body?.message || (ok ? "出力しました" : `出力できませんでした（HTTP ${response.status}）`) });
    } catch (e) {
      setResult({ ok: false, message: `出力できませんでした: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <ConsoleButton variant="primary" onClick={() => setOpen(true)} loading={busy}>
        登録したURLをJSONでアップロード
      </ConsoleButton>
      {result && (
        <div className="basis-full">
          <ConsoleNotice tone={result.ok ? "ok" : "ng"} title={result.ok ? "JSON を出力しました" : "JSON を出力できませんでした"} onClose={() => setResult(null)}>
            {result.message}
          </ConsoleNotice>
        </div>
      )}
      <ConsoleModal
        open={open}
        title="登録したURLをJSONでアップロード"
        description="取得対象（日程を取る）の大会の 大会名・大会URL を S3 の b026_cup_competition.json に出力します（前の内容は置き換わります）。"
        onClose={() => !busy && setOpen(false)}
        busy={busy}
        width={560}
        footer={
          <>
            <ConsoleButton onClick={() => setOpen(false)} disabled={busy}>
              キャンセル
            </ConsoleButton>
            <ConsoleButton variant="primary" onClick={run} loading={busy}>
              出力する
            </ConsoleButton>
          </>
        }
      >
        <p className="text-[13px] text-slate-600">結果タブのスクレイパー（CupResultData_aws_S3.py）は、次の起動からこの URL の「結果」タブを読み、b001_country_league.json のチームが出た試合だけを取ります。</p>
      </ConsoleModal>
    </>
  );
};

const CupCsvUploadPage: React.FC = () => (
  <CsvUploadConsole
    masterName="cup"
    title="大会一括アップロード"
    prefix="cup_"
    tableName="cup_competition_master"
    description="どの大会を日程の取得対象にするかを、大会名と大会URL の CSV（zip）でまとめて登録します。1 行でもエラーがあれば、どの行も反映しません。"
    operations={[]}
    columns={COLUMNS}
    notes={NOTES}
    requiredLabel="必須"
    resultCounts={["insert", "update"]}
    successNote="反映しました。出場チームは「大会出場チーム登録設定」で選んでください。"
    confirmDescription="cup_competition_master にその場で反映します。1 行でもエラーがあれば、どの行も反映しません。"
    toolbarExtra={
      <>
        <CupUrlJsonButton />
        <Link to="/admin/cup-competition">
          <ConsoleButton>大会出場チーム登録設定へ</ConsoleButton>
        </Link>
      </>
    }
  />
);

export default CupCsvUploadPage;
