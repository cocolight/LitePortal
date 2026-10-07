# 三段构建：前端(node) → 后端(go) → 运行(alpine)
#
# 为什么要拆成三段：官方 `golang` 镜像基于 buildpack-deps，**不含 node/npm**，
# 无法在同一阶段里跑前端构建（表现为 `/bin/sh: npm: not found`，exit 127）。
# 前端单独用 node 镜像构建，再把它产出的 dist 拷进运行镜像。

# ── 1. 前端构建（Node + pnpm）──────────────────────────────────
FROM node:22-slim AS frontend
WORKDIR /build

# 先只复制依赖描述文件，让依赖安装层可被缓存
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm@8.15.5 && pnpm install --frozen-lockfile

# 再复制源码（frontend/node_modules 与 frontend/dist 已被 .dockerignore 排除）；
# frontend/.env.production 需要随源码一起进镜像，vite --mode production 依赖它
COPY frontend ./
RUN pnpm run build:prod

# ── 2. 后端编译（modernc.org/sqlite 纯 Go，无 CGO，无需 better-sqlite3 编译）──
FROM golang:1.22 AS backend
WORKDIR /build

# 版本号由 docker.yml 从 tag 推导后经 build-arg 传入（与 build.sh / pkg.yml 同构）；
# 默认 dev 保证直接 `docker build .` 也能成功。
ARG VERSION=dev

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend ./
RUN CGO_ENABLED=0 go build \
      -ldflags "-X backend/internal/version.Version=${VERSION}" \
      -o /build/server .

# ── 3. 运行阶段（最小镜像）─────────────────────────────────────
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=backend  /build/server           /app/server
COPY --from=frontend /build/dist             /app/web
COPY backend/migrations/schema.sql           /app/migrations/schema.sql
COPY backend/.env.production                 /app/.env

# 4. 默认环境变量（可被 -e / docker-compose 覆盖）
ENV PORT=8080 \
    MAX_BODY_SIZE=10mb \
    LOG_LEVEL=info \
    INIT_DATA=true \
    WEB_ROOT=web

# 5. 持久化目录 & 端口（data/ 由服务端首次启动自动创建）
VOLUME ["/app/data"]
EXPOSE 8080

# 6. 启动
CMD ["/app/server"]
