import React from "react";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";

/**
 * リアルタイムデータ CSV アップロード（static_data に直接登録）  /admin/csv-upload/realtime-data  2026-11-28 追加
 *   スクレイパーが取れなかった試合（終了済のデータなど）を、取り直した CSV で入れる。
 *   GET  /v1/api/admin/csv/upload/realtimeData/format
 *   POST /v1/api/admin/csv/upload/realtimeData
 *   バッチは使わず、その場で登録する（1 行でもエラーがあれば、どの行も登録しない）。
 */
const COLUMNS: CsvColumnGuide[] = [
  { name: "ホームチーム", key: true, requiredOnInsert: true, note: "例: FC東京（マスタと同じ表記）" },
  { name: "アウェーチーム", key: true, requiredOnInsert: true, note: "例: 浦和レッズ" },
  { name: "試合国及びカテゴリ", key: true, requiredOnInsert: true, note: "「国: リーグ - ラウンド N」。例: 日本: J1 リーグ - ラウンド 9" },
  { name: "試合時間", key: true, requiredOnInsert: true, note: "終了済 / ハーフタイム / 45+2' など。終了後のデータだけなら「終了済」" },
  { name: "スコア時間", requiredOnInsert: true, note: "記録時間（record_time）。試合が行われた日時を入れる（シーズン・節の判定に使う）。例: 2026-10-04 16:55:00" },
  { name: "試合ID", key: true, note: "Flashscore の mid。試合リンク文字列（?mid=…）があれば省略可" },
  { name: "試合リンク文字列", note: "例: https://www.flashscore.co.jp/match/soccer/…/?mid=AbCdEfGh" },
  { name: "ホームスコア・アウェースコア", note: "その時点のスコア（終了済なら最終スコア）" },
  { name: "そのほかの列", note: "スクレイパーと同じ列名（全 104 列。ホーム期待値・ボール支配率・シュート数 など）。無い列は空として扱う。列の順番は自由" },
];

const NOTES: React.ReactNode[] = [
  "列名はリアルタイムデータのスクレイパー（BmData_aws_S3.py）と同じです。フォーマットには全 104 列と例の行（先頭が # の行は読みません）が入っています。",
  "同じ試合ID・試合時間の行がファイル内に 2 つあるとエラーになります。",
  "すでに同じ行（データカテゴリ・試合時間・ホーム・アウェー・試合ID が同じ）がある行は飛ばします（エラーにはしません）。",
  "登録した行は手動取得（add_manual_flg = 1）として入ります。seq_key は「試合ID-連番」（その試合の最後の連番の次）です。",
  "データカテゴリは CSV のまま登録します（スクレイパーの取り込みのような推定はしません）。",
  "登録後は通常の流れ（統計CSV作成 B011 → 反映 B006。終了済しか無い試合は B018）で統計に入ります。",
  "結果は「ファイルアップロード状況管理」に残ります（種類: リアルタイムデータ登録）。",
];

const RealtimeDataCsvUploadPage: React.FC = () => (
  <CsvUploadConsole
    masterName="realtimeData"
    title="リアルタイムデータCSVアップロード"
    prefix="realtimedata_"
    tableName="static_data"
    description="スクレイパーが取れなかった試合のリアルタイムデータ（終了済のデータなど）を、CSV（zip）で static_data に直接登録します。1 行でもエラーがあれば、どの行も登録しません。"
    operations={[]}
    columns={COLUMNS}
    notes={NOTES}
    requiredLabel="必須"
    resultCounts={["insert"]}
    successNote="登録しました。統計には次の統計CSV作成（B011 → B006 / B018）で入ります。"
    confirmDescription="static_data にその場で登録します。1 行でもエラーがあれば、どの行も登録しません。"
  />
);

export default RealtimeDataCsvUploadPage;
