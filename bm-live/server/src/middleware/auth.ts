import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
export type JWTPayload = { userId: number };

export const signToken = (p: JWTPayload) => jwt.sign(p, JWT_SECRET, { expiresIn: "7d" });

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}