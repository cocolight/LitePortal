# 0. 多阶段构建：编译 → 运行
FROM node:22-slim AS builder

# 安装编译 better-sqlite3 所需工具（slim 版够用）
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# 分别复制前后端的描述文件
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
COPY backend/package.json  backend/pnpm-lock.yaml  ./backend/

# 2. 全局装 pnpm → 装依赖 → 编译前端 → 编译后端
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile && \
    pnpm rebuild better-sqlite3 && \
    pnpm -C frontend build:prod && \
    pnpm -C backend  build:prod

# 3. 收集运行时文件
RUN mkdir -p /app && \
    cp -r backend/dist/*        /app && \
    cp -r frontend/dist         /app/web && \
    cp -r backend/migrations    /app && \
    cp    backend/package.json  /app && \
    cp    backend/pnpm-lock.yaml /app && \
    cp    backend/.env.production /app/.env.production

# 4. 生产依赖二次安装（仅 runtime）
WORKDIR /app
RUN corepack enable pnpm && \
    pnpm install --production --shamefully-hoist && \
    pnpm rebuild better-sqlite3 && \
    rm -rf /root/.local /root/.npm /root/.pnpm-store

# 5. 运行阶段（最小镜像）
FROM node:22-slim
WORKDIR /app

# 6. 复制编译产物
COPY --from=builder /app /app

# 7. 默认环境变量（可被 docker-compose 或 -e 覆盖）
ENV NODE_ENV=production \
    PORT=8080 \
    DB_PATH=./data/liteportal.sqlite \
    MAX_BODY_SIZE=10mb \
    LOG_LEVEL=info \
    INIT_DATA=true \
    IS_PKG=false \
    WEB_ROOT=web

# 8. 持久化目录 & 端口
VOLUME ["/app/data"]
EXPOSE 8080

# 9. 启动
CMD ["node","main.js"]