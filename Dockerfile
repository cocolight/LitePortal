# 阶段 1：编译前端
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend ./
RUN pnpm run build

# 阶段 2：编译后端
FROM node:22-alpine AS backend-builder
WORKDIR /build
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY backend ./
RUN pnpm run build:prod

# 阶段 3：运行镜像
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# 安装 pnpm + 原生依赖编译工具
RUN apk add --no-cache python3 make g++ curl

# 复制后端产物 & 锁文件
COPY --from=backend-builder /build/dist ./dist
COPY --from=backend-builder /build/package.json /build/pnpm-lock.yaml ./
COPY --from=backend-builder /build/node_modules ./node_modules

# 复制前端静态文件
COPY --from=frontend-builder /build/dist ./web

# 暴露端口
EXPOSE 3000

# 启动脚本
CMD ["node", "dist/main.js"]