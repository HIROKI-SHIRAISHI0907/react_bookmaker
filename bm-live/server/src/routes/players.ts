// src/routes/players.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const playersRouter = Router();

/**
 * GET /api/players/:country/:league/:team
 * - country / league は完全一致
 * - team は英語スラッグを country_league_master で日本語名に解決
 * - retire_flg = '0'（現役）のみ
 * - 並び: 位置(GK→DF→MF→FW→その他) → 背番号昇順 → 名前
 */
playersRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  try {
    // スラッグ→日本語名
    const nameRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = nameRows[0]?.team ?? teamSlug;

    type Row = {
      id: number;
      jersey: string | null;
      member: string;
      face_pic_path: string | null;
      position: string | null;
      birth: string | null;
      age: number | null;
      market_value: string | null;
      height: string | null;
      weight: string | null;
      loan_belong: string | null;
      belong_list: string | null;
      injury: string | null;
      deadline_contract_date: string | null;
      latest_info_date: string | null;
    };

    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      SELECT
         t.id,
         NULLIF(TRIM(t.jersey), '') AS jersey,
         t.member,
         NULLIF(TRIM(t.face_pic_path), '') AS face_pic_path,
         NULLIF(TRIM(t.position), '') AS position,

         /* birth: text の可能性があるため timestamp にキャストしてから to_char */
         CASE
            WHEN t.birth IS NULL OR TRIM(t.birth::text) = '' THEN NULL
            ELSE to_char((t.birth::timestamp), 'YYYY-MM-DD')
         END AS birth,

         /* age: 数値化（text の場合にも対応） */
         NULLIF(TRIM(t.age::text), '')::int AS age,

         NULLIF(TRIM(t.market_value), '') AS market_value,
         NULLIF(TRIM(t.height), '') AS height,
         NULLIF(TRIM(t.weight), '') AS weight,
         NULLIF(TRIM(t.loan_belong), '') AS loan_belong,
         NULLIF(TRIM(t.belong_list), '') AS belong_list,
         NULLIF(TRIM(t.injury), '') AS injury,

         /* 契約期限・最新情報日: 同様に text→timestamp→to_char で安全化 */
         CASE
            WHEN t.deadline_contract_date IS NULL OR TRIM(t.deadline_contract_date::text) = '' THEN NULL
            ELSE to_char((t.deadline_contract_date::timestamp), 'YYYY-MM-DD')
         END AS deadline_contract_date,
         CASE
            WHEN t.latest_info_date IS NULL OR TRIM(t.latest_info_date::text) = '' THEN NULL
            ELSE to_char((t.latest_info_date::timestamp), 'YYYY-MM-DD')
         END AS latest_info_date

      FROM team_member_master t
      WHERE t.country = $1
         AND t.league  = $2
         AND t.team    = $3
         AND COALESCE(t.retire_flg, '0') = '0'
      ORDER BY
         CASE t.position
            WHEN 'ゴールキーパー' THEN 1
            WHEN 'ディフェンダー'   THEN 2
            WHEN 'ミッドフィルダー' THEN 3
            WHEN 'フォワード'       THEN 4
            ELSE 5
         END,
         /* 背番号は非数値に強い並び（数字以外を除去→int）*/
         NULLIF(regexp_replace(COALESCE(t.jersey, ''), '\\D', '', 'g'), '')::int NULLS LAST,
         t.member
      `,
      country,
      league,
      teamJa
    );

    const players = rows.map((r) => ({
      id: r.id,
      jersey: r.jersey ? Number.parseInt(r.jersey, 10) : null,
      name: r.member,
      face: r.face_pic_path ?? null,
      position: r.position ?? "-",
      birth: r.birth ?? null,
      age: r.age ?? null,
      market_value: r.market_value ?? null,
      height: r.height ?? null,
      weight: r.weight ?? null,
      loan_belong: r.loan_belong ?? null,
      belong_list: r.belong_list ?? null,
      injury: r.injury ?? null,
      contract_until: r.deadline_contract_date ?? null,
      latest_info_date: r.latest_info_date ?? null,
    }));

    return res.json({ players });
  } catch (e: any) {
    console.error("GET /api/players failed:", {
      params: req.params,
      err: e?.message,
      stack: e?.stack,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default playersRouter;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
