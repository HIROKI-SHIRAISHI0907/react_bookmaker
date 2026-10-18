import type { CsvOperationGuide } from "../../pages/admin/csvUpload/CsvUploadConsole";

/** シーズン・チーム・試合予定の処理区分（1〜5） */
export const MASTER_OPERATIONS: CsvOperationGuide[] = [
  { code: "1", label: "登録", note: "キーが重複していなければ追加する（表示状態で登録）。ID は空欄。" },
  { code: "2", label: "更新", note: "キー（または ID）で対象を探し、値が入っている列だけ書き換える（空欄の列は変えない）。キーそのものを変えるときは ID を書く。" },
  { code: "3", label: "削除", note: "キーだけで対象を決めて削除する（物理削除・元に戻せない）。ID は空欄。" },
  { code: "4", label: "非表示", note: "キーだけで対象を決めて非表示にする（del_flg = 1）。ID は空欄。" },
  { code: "5", label: "再表示", note: "キーだけで対象を決めて表示に戻す（del_flg = 0）。ID は空欄。" },
];

/** リアルタイムの処理区分（4・5 のみ） */
export const REALTIME_OPERATIONS: CsvOperationGuide[] = [
  { code: "4", label: "非表示", note: "キーに該当する行（その試合のデータすべて）を非表示にする（del_flg = 1）。" },
  { code: "5", label: "再表示", note: "キーに該当する行（その試合のデータすべて）を表示に戻す（del_flg = 0）。" },
];

/** 共通の注意 */
export const COMMON_NOTES: string[] = [
  "1 行でもエラーがあれば、どの行も反映しない（エラーの行番号と内容を一覧で表示する）。",
  "同じ対象がファイル内に 2 回出てくるとエラーになる。",
  "キーの比較では、全角・半角の違いと前後の空白は無視する。",
  "キーに 2 件以上該当したときは、対象を決められないためエラーになる。",
];
