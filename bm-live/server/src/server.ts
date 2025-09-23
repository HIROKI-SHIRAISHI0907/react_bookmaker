// server/src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prismaUser /* , prismaStats */ } from "./db"; // ← ここから使う
import jwt from "jsonwebtoken";
// ✅ サーバー配下のルーターを読む
import matches from "./routes/matches";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"; // 本番は必ず強い秘密鍵に

const app = express();

const PORT = Number(process.env.PORT || 8080);
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());
// ❌ app.use(express.json());  ← これを削除し、下で限定適用
// ✅ POST/PUT/PATCH のみ JSON パース
const jsonOnlyForBodyMethods: express.RequestHandler = (req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    return express.json()(req, res, next);
  }
  return next();
};
app.use(jsonOnlyForBodyMethods);

// ✅ JSON parse 失敗でプロセスを落とさない
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  next(err);
});

app.use("/api/matches", matches);

// ヘルス（どちらでも叩けるように2本）
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 入力スキーマ（username は無し）
const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

// 新規登録
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = RegisterInput.parse(req.body);

    // 既存チェック（email のみ）
    const exists = await prismaUser.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      return res.status(409).json({ message: "その email は既に使われています" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prismaUser.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    return res.status(201).json(created);
  } catch (err: any) {
    // Zod バリデーション
    if (err?.issues) {
      return res.status(400).json({ message: "入力値が不正です", issues: err.issues });
    }
    // Prisma ユニーク制約
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "その email は既に使われています" });
    }
    console.error("REGISTER FAILED:", err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// ログイン
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(8).max(128) }).parse(req.body);

    const user = await prismaUser.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "メールまたはパスワードが違います" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "メールまたはパスワードが違います" });

    // セッション用にJWTをCookieへ
    const token = jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("sid", token, {
      httpOnly: true,
      sameSite: "lax", // ローカルの http://localhost:3000 → 8080 でもOK
      secure: false, // 本番は true（https必須）
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ message: "入力が不正です", issues: err.issues });
    console.error("LOGIN FAILED:", err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// ログアウト（Cookie削除）
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("sid", { httpOnly: true, sameSite: "lax", secure: false });
  res.json({ ok: true });
});

// 認証確認用
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
