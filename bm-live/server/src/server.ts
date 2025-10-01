// server/src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { prismaUser } from "./db"; // <- User用 PrismaClient
import leaguesRouter from "./routes/league"; // <- 複数形ファイル名
import matches from "./routes/matches";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const app = express();
const PORT = Number(process.env.PORT || 8080);
// Vite開発は 5173。必要なら .env / compose 側で合わせてOK
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// 基本ミドルウェア
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ルーター
app.use("/api/leagues", leaguesRouter);
app.use("/api/matches", matches);

// ヘルス
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== Auth =====
const RegisterInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(64),
  password: z.string().min(8).max(128),
});

// 新規登録
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, name, password } = RegisterInput.parse(req.body);

    // 既存チェック（email）
    const exists = await prismaUser.user.findUnique({
      where: { email },
      select: { email: true },
    });
    if (exists) {
      return res.status(409).json({ message: "その email は既に使われています" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ※ 主キーは userid を想定
    const user = await prismaUser.user.create({
      data: { email, name, passwordHash },
      select: { userid: true, email: true, name: true, createdAt: true },
    });

    return res.status(201).json({
      userId: user.userid,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({ message: "入力値が不正です", issues: err.issues });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "その email は既に使われています" });
    }
    console.error("REGISTER FAILED:", err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

// ログイン
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = LoginInput.parse(req.body);

    // 必要なフィールドだけ取得
    const user = await prismaUser.user.findUnique({
      where: { email },
      select: { userid: true, email: true, name: true, passwordHash: true },
    });
    if (!user) return res.status(401).json({ message: "メールまたはパスワードが違います" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "メールまたはパスワードが違います" });

    const token = jwt.sign({ uid: user.userid, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("sid", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // 本番は true（https）
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user: { id: user.userid, email: user.email, name: user.name } });
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ message: "入力が不正です", issues: err.issues });
    console.error("LOGIN FAILED:", err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// ログアウト
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("sid", { httpOnly: true, sameSite: "lax", secure: false });
  res.json({ ok: true });
});

// 認証確認
app.get("/api/auth/me", (req, res) => {
  const raw = req.cookies?.sid;
  if (!raw) return res.status(401).json({ message: "unauthorized" });
  try {
    const payload = jwt.verify(raw, JWT_SECRET) as { uid: number; email: string };
    return res.json({ ok: true, user: payload });
  } catch {
    return res.status(401).json({ message: "unauthorized" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
