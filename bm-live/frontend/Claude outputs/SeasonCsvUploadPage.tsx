import React from "react";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";
import { COMMON_NOTES, MASTER_OPERATIONS } from "./csvUploadGuides";

/** シーズンデータ CSV アップロード（country_league_season_master） */
const COLUMNS: CsvColumnGuide[] = [
  { name: "処理区分", requiredOnInsert: true, note: "1:登録 2:更新 3:削除 4:非表示 5:再表示（名前でも可）" },
  { name: "ID", note: "更新で国・リーグ名を変えるときだけ書く。それ以外は空欄。" },
  { name: "国", key: true, requiredOnInsert: true, note: "例: 日本" },
  { name: "リーグ", key: true, requiredOnInsert: true, note: "例: J1リーグ" },
  { name: "シーズン年", note: "例: 2026 / 2026-2027" },
  { name: "シーズン開始日", note: "yyyy-MM-dd または yyyy/MM/dd（時刻付きも可）。日本時間。" },
  { name: "シーズン終了日", note: "シーズン開始日と同じ形式。" },
  { name: "ラウンド数", note: "数字。" },
  { name: "パス", note: "Flashscore のリーグのパス。例: /soccer/japan/j1-league/" },
  { name: "アイコン", note: "任意。" },
  { name: "有効フラグ", note: "0 または 1。登録で空欄なら 0。" },
];

const SeasonCsvUploadPage: React.FC = () => (
  <CsvUploadConsole
    masterName="season"
    title="シーズンデータ CSV アップロード"
    prefix="season_"
    tableName="country_league_season_master"
    operations={MASTER_OPERATIONS}
    columns={COLUMNS}
    notes={[...COMMON_NOTES, "非表示・再表示では、同じ国・リーグの point_setting_master の del_flg も同じ値にする。"]}
  />
);

export default SeasonCsvUploadPage;
