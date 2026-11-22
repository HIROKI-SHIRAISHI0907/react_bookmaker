// src/pages/admin/target/scrapeTargetView.ts
// スクレイピング対象（all_league_scrape_master）の一覧の絞り込み・国単位のページング（2026-11-22 追加）
//  スクレイピング対象データ取得設定（ManualDataTargetPage）で使う
import type { AllLeagueDTO } from "./ManualDataTargetPage";

/**
 * 一覧の表示
 *   targetOnly      : スクレイピング対象（dispFlg=0）のリーグだけ
 *   targetCountries : 対象のリーグがある国の、その国のリーグすべて（あとから入ってきた新しいリーグも含む）。
 *                     対象のリーグがない国は出さない
 *   target          : 対象のリーグ ＋ 新しく入ってきたリーグ（30 日以内）がある国は、その国のリーグをすべて
 *   excluded        : 対象外のリーグだけ
 *   all             : すべて
 */
export type ScrapeViewMode = "targetOnly" | "targetCountries" | "target" | "excluded" | "all";

/** 1 ページの国の数の選択肢 */
export const COUNTRIES_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;
export const DEFAULT_COUNTRIES_PER_PAGE = 10;

const countryOf = (r: AllLeagueDTO) => (r.country ?? "").trim();

/**
 * 表示に応じて絞り込み、国ごとに「対象 → 新しいリーグ → 残り」の順に並べる（国の並びは API の国・リーグ順のまま）
 * @param isTarget 対象か（画面では保存済みの値で判定する。チェックを変えただけで一覧から消えないように）
 */
export function filterByViewMode(rows: AllLeagueDTO[], mode: ScrapeViewMode, isTarget: (r: AllLeagueDTO) => boolean): AllLeagueDTO[] {
  if (mode === "all") return rows;
  if (mode === "excluded") return rows.filter((r) => !isTarget(r));
  if (mode === "targetOnly") return rows.filter((r) => isTarget(r));

  const targetCountries = new Set<string>();
  const newLeagueCountries = new Set<string>();
  for (const r of rows) {
    if (isTarget(r)) targetCountries.add(countryOf(r));
    if (r.newLeague) newLeagueCountries.add(countryOf(r));
  }
  const keep =
    mode === "targetCountries"
      ? (r: AllLeagueDTO) => targetCountries.has(countryOf(r))
      : (r: AllLeagueDTO) => isTarget(r) || newLeagueCountries.has(countryOf(r));
  const rank = (r: AllLeagueDTO) => (isTarget(r) ? 0 : r.newLeague ? 1 : 2);
  return rows
    .map((r, i) => ({ r, i }))
    .filter((x) => keep(x.r))
    .sort((x, y) => {
      if (countryOf(x.r) !== countryOf(y.r)) return x.i - y.i;
      return rank(x.r) - rank(y.r) || x.i - y.i;
    })
    .map((x) => x.r);
}

/** 出てくる順の国の一覧（重複なし） */
export function countriesOf(rows: AllLeagueDTO[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const c = countryOf(r);
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/** 国単位のページング。1 つの国のリーグはページをまたがない */
export function pageByCountries(
  rows: AllLeagueDTO[],
  countries: string[],
  page: number,
  perPage: number,
): { rows: AllLeagueDTO[]; pageCountries: string[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(countries.length / Math.max(1, perPage)));
  const p = Math.min(Math.max(page, 0), totalPages - 1);
  const pageCountries = countries.slice(p * perPage, (p + 1) * perPage);
  const set = new Set(pageCountries);
  return { rows: rows.filter((r) => set.has(countryOf(r))), pageCountries, totalPages };
}

/** 国ごとにまとめる（表示順のまま） */
export function groupByCountry(rows: AllLeagueDTO[]): Array<{ country: string; leagues: AllLeagueDTO[] }> {
  const map = new Map<string, AllLeagueDTO[]>();
  for (const r of rows) {
    const c = countryOf(r);
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(r);
  }
  return Array.from(map.entries()).map(([country, leagues]) => ({ country, leagues }));
}
