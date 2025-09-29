#!/bin/sh
set -eu

# もし CRLF で保存されていたら sh が誤動作するので、必ず LF で保存してください。
# VSCode: 右下の改行コードを「LF」に変更

echo "[start.sh] install deps"
npm ci || npm i

echo "[start.sh] prisma migrate deploy (user)"
npx prisma migrate deploy --schema=prisma-user/schema.prisma

echo "[start.sh] prisma migrate deploy (stats)"
npx prisma migrate deploy --schema=prisma-stats/schema.prisma

echo "[start.sh] prisma generate (user)"
npx prisma generate --schema=prisma-user/schema.prisma

echo "[start.sh] prisma generate (stats)"
npx prisma generate --schema=prisma-stats/schema.prisma

echo "[start.sh] start dev server"
exec npm run dev
