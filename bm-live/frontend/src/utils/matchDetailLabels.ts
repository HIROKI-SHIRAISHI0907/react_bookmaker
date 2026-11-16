// 統計詳細データ（match_detail_*）の値を画面用の日本語にする（2026-11 追加）
//  - scrapeErrorsLabel : 取得できなかったページ（match_detail_match.scrape_errors）→「マッチモメンタム、メンバー（時間切れ）」
//  - positionLabel     : ポジション（英語・略号で入っていたら日本語に。日本語ならそのまま）
// ユーザー画面（試合詳細・チームページ）と管理画面（統計詳細データ参照）で使う。

/** スクレイパーのタブ名 → 日本語（MatchDetailData_aws_S3.py の PLAYER_STAT_TABS などと同じ） */
const TAB_LABEL: Record<string, string> = {
  lineups: "メンバー",
  momentum: "マッチモメンタム",
  summary: "試合の出来事",
  top: "選手スタッツ（主なスタッツ）",
  shots: "選手スタッツ（シュート）",
  attack: "選手スタッツ（アタック）",
  passes: "選手スタッツ（パス）",
  defense: "選手スタッツ（ディフェンス）",
  goalkeeping: "選手スタッツ（ゴールキーパー）",
  general: "選手スタッツ（基本情報）",
};

/** 決まった形のエラー → 日本語 */
const ERROR_LABEL: Record<string, string> = {
  momentum_not_found: "マッチモメンタム",
  summary_not_found: "試合の出来事",
  lineups_tab_absent: "メンバー（ページなし）",
  player_stats_tab_absent: "選手スタッツ（ページなし）",
  momentum_incident_minute_mismatch: "マッチモメンタムの出来事（時間のずれ）",
};

/** 1 つのエラー → 日本語（分からないものは「その他」） */
export function scrapeErrorLabel(token: string): string {
  const t = token.trim();
  if (!t) return "";
  if (ERROR_LABEL[t]) return ERROR_LABEL[t];
  const m = t.match(/^(.+)_(timeout|exception)$/);
  if (m) {
    const tab = TAB_LABEL[m[1]] ?? "その他のページ";
    return `${tab}（${m[2] === "timeout" ? "時間切れ" : "読み込みエラー"}）`;
  }
  return TAB_LABEL[t] ?? "その他のページ";
}

/** "momentum_not_found,lineups_timeout" → "マッチモメンタム、メンバー（時間切れ）"（同じものは 1 回だけ） */
export function scrapeErrorsLabel(errors: string | null | undefined): string {
  if (!errors) return "";
  const labels = errors
    .split(/[,\s]+/)
    .map(scrapeErrorLabel)
    .filter(Boolean);
  return Array.from(new Set(labels)).join("、");
}

const POSITION_LABEL: Record<string, string> = {
  gk: "ゴールキーパー",
  goalkeeper: "ゴールキーパー",
  df: "ディフェンダー",
  defender: "ディフェンダー",
  mf: "ミッドフィルダー",
  midfielder: "ミッドフィルダー",
  fw: "フォワード",
  forward: "フォワード",
  attacker: "フォワード",
};

/** ポジション（英語・略号なら日本語に。日本語・分からないものはそのまま） */
export function positionLabel(position: string | null | undefined): string {
  const p = (position ?? "").trim();
  if (!p) return "";
  return POSITION_LABEL[p.toLowerCase()] ?? p;
}
