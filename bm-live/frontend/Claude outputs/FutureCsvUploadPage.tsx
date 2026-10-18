import React from "react";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";
import { COMMON_NOTES, MASTER_OPERATIONS } from "./csvUploadGuides";

/** 試合予定データ CSV アップロード（future_master） */
const NUMBER_NOTE = "数値。任意。";

const COLUMNS: CsvColumnGuide[] = [
  { name: "処理区分", requiredOnInsert: true, note: "1:登録 2:更新 3:削除 4:非表示 5:再表示（名前でも可）" },
  { name: "ID", note: "更新でチーム名・カテゴリを変えるときだけ書く（future_master.seq）。それ以外は空欄。" },
  { name: "試合国及びカテゴリ", key: true, requiredOnInsert: true, note: "例: 日本: J1リーグ - ラウンド 30" },
  { name: "試合予定時間", requiredOnInsert: true, note: "日本時間。yyyy-MM-dd HH:mm（秒付き・/ 区切りも可）。更新で書けば日時を変えられる。" },
  { name: "ホーム順位", note: NUMBER_NOTE },
  { name: "アウェー順位", note: NUMBER_NOTE },
  { name: "ホームチーム", key: true, requiredOnInsert: true, note: "例: 鹿島アントラーズ" },
  { name: "アウェーチーム", key: true, requiredOnInsert: true, note: "例: 浦和レッズ" },
  { name: "ホームチーム最大得点取得者", note: "任意。" },
  { name: "アウェーチーム最大得点取得者", note: "任意。" },
  { name: "ホームチームホーム得点", note: NUMBER_NOTE },
  { name: "ホームチームホーム失点", note: NUMBER_NOTE },
  { name: "アウェーチームホーム得点", note: NUMBER_NOTE },
  { name: "アウェーチームホーム失点", note: NUMBER_NOTE },
  { name: "ホームチームアウェー得点", note: NUMBER_NOTE },
  { name: "ホームチームアウェー失点", note: NUMBER_NOTE },
  { name: "アウェーチームアウェー得点", note: NUMBER_NOTE },
  { name: "アウェーチームアウェー失点", note: NUMBER_NOTE },
  { name: "試合リンク文字列", note: "Flashscore の試合 URL。任意。" },
  { name: "データ取得時間", note: "日本時間。任意。" },
];

const FutureCsvUploadPage: React.FC = () => (
  <CsvUploadConsole
    masterName="future"
    title="試合予定データ CSV アップロード"
    prefix="future_"
    tableName="future_master"
    operations={MASTER_OPERATIONS}
    columns={COLUMNS}
    notes={[...COMMON_NOTES, "登録した試合は開始フラグ（start_flg）= 1 で登録する（スクレイピングで登録したものと同じ）。"]}
  />
);

export default FutureCsvUploadPage;
