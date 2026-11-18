FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 2026-11-18 変更（デプロイ直後の「Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"」対策）
#   - index.html はキャッシュさせない（ブラウザが古い index.html から古い JS 名を取りにいかないように）
#   - /assets/ に無いファイルは 404（index.html を返さない。以前は JS の代わりに HTML が返ってエラーになっていた）
#   - /assets/ のファイルは名前にハッシュが付いているので長くキャッシュしてよい
#   - それ以外（画面の URL）は今までどおり index.html を返す
RUN printf '%s\n' \
'server {' \
'  listen 80;' \
'  server_name _;' \
'  root /usr/share/nginx/html;' \
'  index index.html;' \
'  location = /index.html {' \
'    add_header Cache-Control "no-cache, no-store, must-revalidate" always;' \
'    try_files $uri =404;' \
'  }' \
'  location /assets/ {' \
'    add_header Cache-Control "public, max-age=31536000, immutable" always;' \
'    try_files $uri =404;' \
'  }' \
'  location / {' \
'    add_header Cache-Control "no-cache, no-store, must-revalidate" always;' \
'    try_files $uri $uri/ /index.html;' \
'  }' \
'}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
