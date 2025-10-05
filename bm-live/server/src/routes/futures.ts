// src/routes/future.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const futureRouter = Router();

/**
 * テーブル: future_master
 * 主要列:
 *   seq (bigint), game_team_category (text), future_time (timestamptz),
 *   home_team_name (text), away_team_name (text), game_link (text),
 *   start_flg (text '0'|'1'), data_time (timestamptz) など
 *
 * game_team_category 形式:
 *   "<国>: <リーグ> - <サブリーグ?> - ラウンド <数字>"
 *   サブリーグが無いケースもある想定。
 *
 * 仕様:
 *   - start_flg = '1' のみ
 *   - 指定チームが home/away いずれかに含まれるレコードのみ
 *   - 国/リーグで前方一致 ( "<国>: <リーグ>" ) もかける
 *   - ラウンド番号 (int) を抽出して返す
 *   - 並びは (round_no ASC NULLS LAST, future_time ASC)
 *
 * エンドポイント:
 *   GET /api/future/:country/:league/:team
 *
 * レスポンス例:
 * {
 *   team: "<日本語チーム名 or スラッグ>",
 *   items: [{
 *     seq: "123",                               // bigint は文字列化
 *     category: "日本: J1 リーグ - ラウンド 8",
 *     round_no: 8,
 *     round_label: "ラウンド 8",
 *     future_time: "2025-10-06T00:30:00.000Z",  // ISO
 *     home_team: "チームA",
 *     away_team: "チームB",
 *     link: "https://...",
 *   }, ...],
 *   meta: {
 *     country: "...",
 *     league: "...",
 *     teamJa: "...",
 *   }
 * }
 */

// --------- helpers ----------
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// JSON.stringify で BigInt / Date を安全に通す
function toJSONSafe<T>(input: T): T {
  return JSON.parse(
    JSON.stringify(input, (_k, v) => {
      if (typeof v === "bigint") return v.toString();
      if (v instanceof Date) return v.toISOString();
      return v;
    })
  );
}

// ラウンド番号＆ラベル抽出
// 例: "日本: J1 リーグ - 〜 - ラウンド 12" → { round_no: 12, round_label: "ラウンド 12" }
function extractRound(category: string) {
  const m = category.match(/ラウンド\s*([0-9]+)/);
  const round_no = m ? parseInt(m[1], 10) : null;
  const round_label = m ? `ラウンド ${m[1]}` : null;
  return { round_no, round_label };
}

// --------- route ----------
futureRouter.get("/:country/:league/:team", async (req, res) => {
  const country = safeDecode(req.params.country);
  const league = safeDecode(req.params.league);
  const teamSlug = req.params.team;

  try {
    // 日本語チーム名（country_league_master でスラッグ→表示名を引く）
    const teamNameRows = await prismaStats.$queryRaw<{ team: string }[]>`
      SELECT team
      FROM country_league_master
      WHERE country = ${country}
        AND league  = ${league}
        AND link LIKE ${`/team/${teamSlug}/%`}
      LIMIT 1
    `;
    const teamJa = teamNameRows[0]?.team ?? teamSlug;

    // "<国>: <リーグ>" 前方一致用のプリフィクス
    const catPrefix = `${country}: ${league}`;

    // 必要カラムを取得しつつ、DB側で round_no を抽出して並べ替える
    // 備考: 正規表現で "ラウンド <数字>" を取り出し、int化
    const rows = await prismaStats.$queryRawUnsafe<
      Array<{
        seq: bigint;
        game_team_category: string;
        future_time: Date;
        home_team_name: string;
        away_team_name: string;
        game_link: string | null;
        round_no: number | null;
      }>
    >(
      `
      SELECT
        f.seq,
        f.game_team_category,
        f.future_time,
        f.home_team_name,
        f.away_team_name,
        f.game_link,
        NULLIF(regexp_replace(f.game_team_category, '.*ラウンド\\s*([0-9]+).*', '\\1'), '')::int AS round_no
      FROM future_master f
      WHERE f.start_flg = '1'
        AND f.game_team_category LIKE $1 || '%'
        AND (f.home_team_name = $2 OR f.away_team_name = $2)
      ORDER BY round_no NULLS LAST, f.future_time ASC
      `,
      catPrefix,
      teamJa
    );

    // 念のためサーバ側でも丸める（将来の並べ替え要件変更に備えて）
    const items = rows
      .map((r) => {
        // ラベル（存在しない場合は game_team_category の末尾から推測）
        const { round_no, round_label } = extractRound(r.game_team_category);
        return {
          seq: r.seq, // BigInt は toJSONSafe で文字列化される
          category: r.game_team_category,
          round_no: r.round_no ?? round_no,
          round_label: round_label,
          future_time: r.future_time, // toJSONSafe で ISO 化
          home_team: r.home_team_name,
          away_team: r.away_team_name,
          link: r.game_link || null,
        };
      })
      // 念押しの安定ソート（DB に依存しすぎない）
      .sort((a, b) => {
        const ra = a.round_no ?? Number.POSITIVE_INFINITY;
        const rb = b.round_no ?? Number.POSITIVE_INFINITY;
        if (ra !== rb) return ra - rb;
        return new Date(a.future_time as any).getTime() - new Date(b.future_time as any).getTime();
      });

    const payload = {
      team: teamJa,
      items,
      meta: { country, league, teamJa },
    };

    return res.json(toJSONSafe(payload));
  } catch (e: any) {
    console.error("[GET /api/future] failed:", {
      params: req.params,
      err: e?.message,
      stack: e?.stack,
    });
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default futureRouter;
