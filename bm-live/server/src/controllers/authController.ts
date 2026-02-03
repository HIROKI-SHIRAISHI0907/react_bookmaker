import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { signToken } from "../middleware/auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false, // 本番は true（HTTPS 必須）
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ userId: user.id });
  res.cookie("token", token, COOKIE_OPTIONS);
  return res.json({ id: user.id, email: user.email });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  res.json(user);
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", { path: "/" });
  res.status(204).end();
}

// 開発用: 簡易登録（必要なら使う）
export async function register(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, passwordHash: hashed }, select: { id: true, email: true } });
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ message: "User already exists?" });
  }
}
