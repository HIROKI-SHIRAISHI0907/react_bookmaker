import React from "react";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";
import { COMMON_NOTES, MASTER_OPERATIONS } from "../../../api/csvUpload/csvUploadGuides";

/** チームデータ CSV アップロード（country_league_master） */
const COLUMNS: CsvColumnGuide[] = [
  { name: "処理区分", requiredOnInsert: true, note: "1:登録 2:更新 3:削除 4:非表示 5:再表示（名前でも可）" },
  { name: "ID", note: "更新で国・リーグ・チーム名を変えるときだけ書く。それ以外は空欄。" },
  { name: "国", key: true, requiredOnInsert: true, note: "例: 日本" },
  { name: "リーグ", key: true, requiredOnInsert: true, note: "例: J1リーグ" },
  { name: "チーム", key: true, requiredOnInsert: true, note: "例: 鹿島アントラーズ" },
  { name: "リンク", note: "チームページのパス。任意。" },
];

const TeamCsvUploadPage: React.FC = () => (
  <CsvUploadConsole masterName="team" title="チームデータ CSV アップロード" prefix="team_" tableName="country_league_master" operations={MASTER_OPERATIONS} columns={COLUMNS} notes={COMMON_NOTES} />
);

export default TeamCsvUploadPage;
