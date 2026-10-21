import React from "react";
import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import CsvUploadConsole, { CsvColumnGuide } from "./CsvUploadConsole";
import { DATA_CATEGORY_OPERATIONS } from "../../../api/csvUpload/csvUploadGuides";

/**
 * データカテゴリ統一 CSV 一括アップロード（static_data.data_category / future_master.game_team_category）
 *
 *   - 表示中のデータ入りのフォーマットは「データカテゴリ統一管理」画面（/admin/data-category）からダウンロードする
 *     （この画面のフォーマットは見出し行だけ）。
 *   - 処理区分が 2 の行だけ反映する。空欄の行は何もしない。
 */
const COLUMNS: CsvColumnGuide[] = [
  { name: "処理区分", note: "2（更新）か空欄。空欄の行は反映しない。" },
  { name: "ホームチーム", key: true, requiredOnInsert: true, note: "例: 鹿島アントラーズ" },
  { name: "アウェーチーム", key: true, requiredOnInsert: true, note: "例: 浦和レッズ" },
  { name: "現在のデータカテゴリ", key: true, note: "今の static_data.data_category（ダウンロードした値のまま）。空欄はカテゴリが入っていない行。" },
  { name: "新しいデータカテゴリ", requiredOnInsert: true, note: "「国: リーグ - ラウンド N」（サブリーグ付きも可）。区切りは半角。仮の値（XXX: YYY）・現在と同じ値は不可。" },
  { name: "件数（参考）など", note: "件数・国リーグ判定・国リーグ候補・形式の列は参考。アップロードでは読まない（消してもよい）。" },
];

const DataCategoryCsvUploadPage: React.FC = () => (
  <CsvUploadConsole
    masterName="dataCategory"
    title="データカテゴリ統一 CSV 一括アップロード"
    prefix="dataCategory_"
    tableName="static_data / future_master"
    formatLabel="フォーマット（見出しだけ）"
    requiredLabel="2 の行で必須"
    toolbarExtra={
      <Link
        to="/admin/data-category"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-[13px] font-bold text-gray-800 no-underline hover:bg-gray-50"
      >
        <ListChecks className="h-3.5 w-3.5" />
        表示中のデータ入りフォーマットは管理画面から
      </Link>
    }
    description={
      <>
        「データカテゴリ統一管理」画面の <b>一括アップロード用フォーマット</b> で、表示中のデータを入れた CSV（dataCategory_〇〇.zip）をダウンロードし、変える行の
        <b>処理区分を 2</b>・<b>新しいデータカテゴリ</b>を書いて、同じ名前のまま zip にしてアップロードします。画面で入力中だった新しい値は、ダウンロードした時点で入っています。
      </>
    }
    operations={DATA_CATEGORY_OPERATIONS}
    columns={COLUMNS}
    notes={[
      "1 行でもエラーがあれば、どの行も反映しない（処理区分 2 の行がひとつも無いときもエラー）。",
      "キー（ホームチーム + アウェーチーム + 現在のデータカテゴリ）に該当する static_data が 1 件もないときはエラーになる。",
      "同じ対戦・同じカテゴリの future_master も一緒に書き換える（試合予定に無い試合は static_data だけ）。",
      "同じキーがファイル内に 2 回出てくるとエラーになる。キーの比較では、全角・半角の違いと前後の空白は無視する。",
      "画面の「更新」はホーム・アウェーの全カテゴリをまとめて書き換えるが、CSV は「現在のデータカテゴリ」ごとに書き換える（前のシーズンの同じ対戦を巻き込まない）。",
      "反映はバッチ（B015）で行う。結果は「ファイルアップロード状況管理」で確認できる。",
    ]}
  />
);

export default DataCategoryCsvUploadPage;
