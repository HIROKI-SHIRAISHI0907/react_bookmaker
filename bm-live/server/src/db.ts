// 2つの PrismaClient を別名で import
// 生成先を server/generated/* にしたので相対パスで import
import { PrismaClient as UserClient } from "../generated/user";
import { PrismaClient as StatsClient } from "../generated/stats";

export const prismaUser = new UserClient(); // 書き込みもここ
export const prismaStats = new StatsClient(); // 読み取り専用のつもりで使う
