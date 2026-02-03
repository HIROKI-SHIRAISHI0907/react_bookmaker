# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# フロントの依存関係
COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# フロントのソース
COPY frontend/ ./

# 本番ビルド（/app/dist を作る）
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA対応（/foo 直アクセスでも index.html）
RUN printf '%s\n' \
'server {' \
'  listen 80;' \
'  server_name _;' \
'  root /usr/share/nginx/html;' \
'  index index.html;' \
'  location / {' \
'    try_files $uri $uri/ /index.html;' \
'  }' \
'}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
