/**
 * 管理画面のメニュー定義（AdminLayout のサイドメニューと AdminMenuPage の両方で使う）
 *
 *   - to    : /admin からの相対パス（App.tsx の <Route path> と一致させる）
 *   - roles : 表示するロール。省略時は管理者・担当者の両方に表示
 *             ※ 画面そのものの制限は App.tsx の <RequireRole> で行う（メニューで隠すだけでは URL 直打ちで開けてしまう）
 */
export type AdminRole = "ADMIN" | "ADMIN_SUB";

export type AdminMenuItem = {
  label: string;
  to: string;
  desc?: string;
  roles?: AdminRole[];
};

export type AdminMenuGroup = {
  key: string;
  label: string;
  items: AdminMenuItem[];
};

export const ADMIN_BASE = "/admin";

const ADMIN_MENU: AdminMenuGroup[] = [
  {
    key: "scraping",
    label: "スクレイピング管理",
    items: [
      { label: "スクレイピング対象データ取得設定", to: "manual/data/target", desc: "国・リーグごとの取得対象（dispFlg）の切り替え" },
      { label: "スクレイピングCSV情報取得管理", to: "scrape/manual", desc: "ECS起動と進捗監視（B005 / B007 / B014 など）" },
      { label: "スクレイピングCSV情報データ登録管理", to: "data/fetch", desc: "バッチ起動と事前ファイル確認" },
    ],
  },
  {
    key: "master",
    label: "マスタデータ参照",
    items: [
      { label: "シーズンデータ取得情報", to: "season", desc: "country_league_season_master の確認" },
      { label: "チームデータ取得情報", to: "team", desc: "country_league_master の確認" },
      { label: "試合予定データ取得情報", to: "future/matches", desc: "指定日の future_master" },
    ],
  },
  {
    key: "other",
    label: "その他データ参照",
    items: [
      { label: "リアルタイムデータ登録済参照", to: "matches/by-date", desc: "日付ごとの対戦データ" },
      { label: "統計用CSV作成内容参照", to: "csv/today", desc: "指定日に作成されたCSV" },
      { label: "試合予定・リアルタイムデータ突合確認参照", to: "ingested", desc: "未来データ / 終了済データの不足確認" },
      { label: "アップロード済リアルタイムデータ参照", to: "upload/realtime", desc: "S3のzipを検索・ダウンロード" },
      { label: "未反映データ参照", to: "analyzeCsvError", desc: "登録できなかった試合と原因" },
    ],
  },
  {
    key: "maintenance",
    label: "データメンテナンス",
    items: [
      { label: "シーズンデータCSVアップロード", to: "csv-upload/season", desc: "country_league_season_master の登録・更新・削除・非表示" },
      { label: "チームデータCSVアップロード", to: "csv-upload/team", desc: "country_league_master の登録・更新・削除・非表示" },
      { label: "試合予定データCSVアップロード", to: "csv-upload/future", desc: "future_master の登録・更新・削除・非表示" },
      { label: "リアルタイムデータ非表示CSVアップロード", to: "csv-upload/realtime", desc: "static_data の非表示・再表示" },
      { label: "ファイルアップロード状況管理", to: "csv-upload/status", desc: "CSVアップロードの受付と結果（エラー行）" },
      { label: "データカテゴリ統一管理", to: "data-category", desc: "対戦ごとの dataCategory 上書き" },
    ],
  },
  {
    key: "otherSetting",
    label: "その他設定",
    items: [
      { label: "統計用CSV作成前詳細設定", to: "sub-input", desc: "SubInput の登録" },
      { label: "お気に入り国リーグ情報全体反映設定", to: "force/update", desc: "国リーグの表示 / 非表示（del_flg）" },
      { label: "リーグ勝ち点情報反映設定", to: "point-setting", desc: "国・リーグごとの勝ち点" },
      { label: "チームカラー情報反映設定", to: "manual/teamColor" },
      { label: "サブリーグ名反映設定", to: "sub-league", desc: "サブリーグへのチーム割り当て" },
      // お知らせの作成・編集ができる画面のため、担当者のみ。管理者は「申請確認画面」から承認/差し戻しするだけ。
      { label: "お知らせ設定", to: "notices", desc: "お知らせの登録と承認依頼", roles: ["ADMIN_SUB"] },
      { label: "メール情報登録設定", to: "mailinfo", desc: "メールテンプレートの登録・更新" },
    ],
  },
  {
    key: "approveFlow",
    label: "承認フロー",
    items: [
      // 管理者: 担当者から届いた依頼をまとめて確認・承認/差し戻しする画面
      { label: "申請確認画面", to: "approve/requests", desc: "担当者からの依頼の承認 / 差し戻し", roles: ["ADMIN"] },
      // 担当者: 管理者から届いた指令を確認する画面
      { label: "指令確認画面", to: "approve/instructions", desc: "管理者からの指令", roles: ["ADMIN_SUB"] },
      // 担当者: 自分が依頼した内容を確認する画面
      { label: "依頼確認画面", to: "approve/myrequest", desc: "自分が出した依頼の状況", roles: ["ADMIN_SUB"] },
    ],
  },
  {
    key: "user",
    label: "利用者情報",
    items: [{ label: "利用者情報管理", to: "users", desc: "ユーザーと権限の切り替え", roles: ["ADMIN"] }],
  },
  {
    key: "db",
    label: "ミドルウェア管理",
    items: [
      { label: "コネクション管理", to: "db/connections", desc: "HikariCP / PostgreSQL の接続状況" },
      { label: "非稼働ECS管理", to: "noecs", desc: "ECS停止時間と試合時間" },
      // IAM・IP・DNS などアカウント情報を表示するため管理者のみ
      { label: "AWSリソース状況", to: "aws/dashboard", roles: ["ADMIN"] },
    ],
  },
  {
    key: "account",
    label: "アカウント",
    items: [
      // 担当者のみ退会できる（WithdrawalConfirmPage 側でも担当者以外は操作不可）
      { label: "退会", to: "withdrawal/confirm", desc: "担当者アカウントの退会", roles: ["ADMIN_SUB"] },
    ],
  },
];

/** ロールで絞り込んだメニュー（項目が0件になったグループは出さない） */
export function buildAdminMenu(role: string | null | undefined): AdminMenuGroup[] {
  return ADMIN_MENU.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.roles || (role != null && (it.roles as string[]).includes(role))),
  })).filter((g) => g.items.length > 0);
}

export const adminPath = (to: string) => `${ADMIN_BASE}/${to}`;

/** 今のパスがその項目の画面（またはその配下: mailinfo/new など）か */
export function isMenuItemActive(pathname: string, to: string): boolean {
  const base = adminPath(to);
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function roleLabel(role: string | null | undefined): string {
  if (role === "ADMIN") return "管理者";
  if (role === "ADMIN_SUB") return "担当者";
  return "-";
}
