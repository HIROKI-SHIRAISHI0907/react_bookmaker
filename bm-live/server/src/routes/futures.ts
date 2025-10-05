// backend/src/routes/future.ts
import { Router } from "express";
import { prismaStats } from "../db";

export const futureRouter = Router();

type Row = {
  seq: bigint | number;
  game_team_category: string; // "国: リーグ - サブリーグ - ラウンド 12" など
  future_time: Date | string; // timestamptz
  home_team_name: string;
  away_team_name: string;
  game_link: string | null;
  start_flg: string | number; // 0: 開催中, 1: 予定
};

futureRouter.get("/", async (req, res) => {
  const team = req.query.team ? String(req.query.team) : undefined;

  try {
    // start_flg=0(開催中),1(予定) を両方取得。team があれば home/away どちらか一致で絞り込み
    const rows = await prismaStats.$queryRawUnsafe<Row[]>(
      `
      SELECT
        seq,
        game_team_category,
        future_time,
        home_team_name,
        away_team_name,
        game_link,
        start_flg
      FROM future_master
      WHERE start_flg IN ('0','1')
        ${team ? "AND (home_team_name = $1 OR away_team_name = $1)" : ""}
      `,
      ...(team ? [team] : [])
    );

    // 文字列から round_no を抽出（「ラウンド 12」→ 12）。無ければ null
    const pickRoundNo = (s: string): number | null => {
      const m = s.match(/ラウンド\s*(\d+)/);
      return m ? Number(m[1]) : null;
    };

    // game_team_category の先頭「国: リーグ - ...」はそのまま表示に使う場合もあるので保持
    const payload = rows.map((r) => {
      const seq = typeof r.seq === "bigint" ? Number(r.seq) : (r.seq as number);
      const ft = typeof r.future_time === "string" ? r.future_time : (r.future_time as Date).toISOString();
      const round_no = pickRoundNo(r.game_team_category);
      const status = (String(r.start_flg) === "0" ? "LIVE" : "SCHEDULED") as "LIVE" | "SCHEDULED";
      return {
        seq,
        game_team_category: r.game_team_category,
        future_time: ft,
        home_team: r.home_team_name,
        away_team: r.away_team_name,
        link: r.game_link ?? null,
        round_no,
        status,
      };
    });

    // サーバーでは並べ替えはせず、クライアント要件に従いフロントでソート
    return res.json({ matches: payload });
  } catch (e: any) {
    console.error("/api/future failed:", e);
    return res.status(500).json({ message: "server error", detail: e?.message ?? String(e) });
  }
});

export default futureRouter;
