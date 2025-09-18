# 阶段1：构建前端
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 阶段2：构建后端
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY backen/package.json backen/package-lock.json ./
RUN npm install --production
RUN npm install --save-dev pkg
COPY backen/ .
# 添加 pkg 配置
RUN echo '{ "bin": "server.js", "pkg": { "targets": ["node18-linux-x64"], "outputPath": "executable" } }' > package.json
# 打包后端
RUN npx pkg .

# 阶段3：最终镜像
FROM alpine:latest
WORKDIR /app
# 安装必要的依赖
RUN apk add --no-cache curl
# 设置非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser
# 复制前端构建文件
COPY --from=frontend-builder /app/dist ./web
# 复制后端可执行文件
COPY --from=backend-builder /app/executable/server ./server
# 创建数据目录
RUN mkdir -p ./data
# 环境变量
ENV NODE_ENV=production \
    PORT=8080
# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/health || exit 1
# 启动
EXPOSE 8080
CMD ["./server"]
