# 多阶段构建：前端(pnpm) + 后端(Go) → 最小运行镜像
FROM golang:1.22 AS builder
WORKDIR /build

# 1. 前端依赖与构建
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
RUN npm install -g pnpm@8.15.5
RUN pnpm -C frontend install --frozen-lockfile
COPY frontend ./frontend
RUN pnpm -C frontend build:prod

# 2. 后端 Go 编译（modernc.org/sqlite 纯 Go，无 CGO，无需 better-sqlite3 编译）
COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download
COPY backend ./backend
RUN cd backend && CGO_ENABLED=0 go build -o /build/server .

# 3. 运行阶段（最小镜像）
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /build/server /app/server
COPY --from=builder /build/frontend/dist /app/web
COPY backend/migrations/schema.sql /app/migrations/schema.sql
COPY backend/.env.production /app/.env

# 4. 默认环境变量（可被 -e / docker-compose 覆盖）
ENV PORT=8080 \
    MAX_BODY_SIZE=10mb \
    LOG_LEVEL=info \
    INIT_DATA=true \
    WEB_ROOT=web

# 5. 持久化目录 & 端口
VOLUME ["/app/data"]
EXPOSE 8080

# 6. 启动
CMD ["/app/server"]
