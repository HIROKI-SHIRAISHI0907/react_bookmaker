// src/server.ts
import express from "express";
import http from "http";
import leaguesRouter from "./routes/leagues";
import { correlationRouter } from "./routes/correlation";
import eachStatsRouter from "./routes/eachscoredstats";
import futureRouter from "./routes/futures";
import gameRouter from "./routes/game";
import gameDetailRouter from "./routes/gameDetails";
import historyRouter from "./routes/histories";
import { playersRouter } from "./routes/players";
import liveRouter from "./routes/lives";
import overviewRouter from "./routes/overviews";
import standingsRouter from "./routes/standings";
import scheduledOverviewRouter from "./routes/scheduled_overviews";

const app = express();

app.use((req, _res, next) => {
  if (req.path.startsWith("/api/leagues")) {
    console.log("[leagues-hit]", req.method, req.originalUrl);
  }
  next();
});

// ルータのマウント
console.log("[mount-check] leaguesRouter:", !!leaguesRouter);
console.log("[mount-check] correlationRouter:", !!correlationRouter);
app.use("/api/leagues", leaguesRouter);
app.use("/api/leagues", correlationRouter);
app.use("/api/stats", eachStatsRouter);
app.use("/api/future", futureRouter);
app.use("/api/games", gameRouter);
app.use("/api/games/detail", gameDetailRouter);
app.use("/api/history", historyRouter);
app.use("/api/players", playersRouter);
app.use("/api/live-matches", liveRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/standings", standingsRouter);
app.use("/api/scheduled-overview", scheduledOverviewRouter);

// healthcheck（任意）
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 8080);

// --- ここがポイント：多重 listen を避ける ---
declare global {
  // ts-node-dev の再読み込みでモジュールが評価し直されても共有される
  // （型エラー回避のために any 指定でもOK）
  // eslint-disable-next-line no-var
  var __HTTP_SERVER__: http.Server | undefined;
}

// 既に起動中なら一旦閉じる（再読み込み時の競合回避）
if (global.__HTTP_SERVER__) {
  try {
    global.__HTTP_SERVER__.close();
  } catch {}
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
global.__HTTP_SERVER__ = server;

// SIGTERM/SIGINT でグレースフルシャットダウン
const shutdown = () => {
  console.log("[server] shutting down...");
  server.close(() => {
    console.log("[server] closed");
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
