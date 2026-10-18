import React from "react";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";
import { REALTIME_OPERATIONS } from "../../../api/csvUpload/csvUploadGuides";

/** リアルタイムデータ 非表示・再表示 CSV アップロード（static_data） */
const COLUMNS: CsvColumnGuide[] = [
  { name: "処理区分", note: "4:非表示 5:再表示 のみ（名前でも可）。" },
  { name: "ホームチーム", key: true, note: "例: 鹿島アントラーズ" },
  { name: "アウェーチーム", key: true, note: "例: 浦和レッズ" },
  { name: "データカテゴリ", key: true, note: "例: 日本: J1リーグ - ラウンド 30" },
];

const RealtimeCsvUploadPage: React.FC = () => (
  <CsvUploadConsole
    masterName="realtime"
    title="リアルタイムデータ 非表示・再表示 CSV アップロード"
    prefix="realtime_"
    tableName="static_data"
    description="リアルタイムデータはスクレイピングで登録するため、ここでは非表示・再表示だけを行います。キーに該当する行（その試合のデータすべて）をまとめて切り替えます。"
    operations={REALTIME_OPERATIONS}
    columns={COLUMNS}
    notes={["1 行でもエラーがあれば、どの行も反映しない。", "登録・更新・削除（1〜3）はできない（エラーになる）。", "キーに該当する行が 1 件もないときはエラーになる。"]}
  />
);

export default RealtimeCsvUploadPage;
