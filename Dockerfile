# 阶段1：安装依赖
FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm install --production

# 阶段2：最终镜像
FROM node:22-alpine
WORKDIR /app
# 设置非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser
# 复制依赖和源码
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./web/
COPY backend/ ./backend/
# 环境变量
ENV NODE_ENV=production \
    PORT=8080
# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/health || exit 1
# 启动
EXPOSE 8080
CMD ["node", "backend/server.js"]
