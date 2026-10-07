#!/usr/bin/env bash
#
# LitePortal 构建脚本（Go 后端 + Vue 前端）
#
# 一次性产出 dist/：
#   server              Go 单文件二进制（CGO_ENABLED=0）
#   web/                前端构建产物（被 server 在 production 托管）
#   migrations/schema.sql  建表 DDL
#   .env                由 backend/.env.production 复制（非敏感默认值）
#   data/               运行时 SQLite 目录（首次启动自动创建）
#
# 前端仍用 Node/pnpm 构建——本项目除前端外不再使用 Node。
#
# 用法：
#   本地构建：          bash build.sh
#   交叉编译（示例）：  GOOS=windows GOARCH=amd64 bash build.sh
#   Windows 用户：在 WSL 或 Git Bash 中执行 `bash build.sh`
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DIST_DIR="dist"
WEB_DIR="$DIST_DIR/web"
MIGRATIONS_DIR="$DIST_DIR/migrations"
DATA_DIR="$DIST_DIR/data"

# 交叉编译：优先用环境变量，否则用宿主 GOOS（如 Windows 宿主产出 server.exe）
GOOS_VAL="${GOOS:-}"
GOARCH_VAL="${GOARCH:-}"
BIN="$DIST_DIR/server"
if [ "$GOOS_VAL" = "windows" ] || { [ -z "$GOOS_VAL" ] && [ "$(go env GOOS)" = "windows" ]; }; then
  BIN="$DIST_DIR/server.exe"
fi

# 版本信息注入（与 pkg.yml / Dockerfile 三条链路同构）：
#   优先取 git describe 的 tag；无 tag 时回退到短提交哈希；再不行用 dev。
#   可用 VERSION 环境变量显式覆盖（发版时由 CI 传入 tag 名）。
VERSION_VAL="${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo dev)}"
COMMIT_VAL="$(git rev-parse --short HEAD 2>/dev/null || echo '')"
BUILD_TIME_VAL="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LDFLAGS="-X backend/internal/version.Version=$VERSION_VAL \
-X backend/internal/version.Commit=$COMMIT_VAL \
-X backend/internal/version.BuildTime=$BUILD_TIME_VAL"

echo "==> 清理输出目录 $DIST_DIR"
rm -rf "$DIST_DIR"
mkdir -p "$WEB_DIR" "$MIGRATIONS_DIR" "$DATA_DIR"

echo "==> 构建前端 ($FRONTEND_DIR)"
( cd "$FRONTEND_DIR" && pnpm install && pnpm run build:prod )

echo "==> 复制前端产物 -> $WEB_DIR"
cp -r "$FRONTEND_DIR/dist/." "$WEB_DIR/"

echo "==> 构建后端 (go build, CGO_ENABLED=0, version=$VERSION_VAL)"
( cd "$BACKEND_DIR" && CGO_ENABLED=0 GOOS="$GOOS_VAL" GOARCH="$GOARCH_VAL" \
  go build -ldflags "$LDFLAGS" -o "../$BIN" . )

echo "==> 复制 schema.sql -> $MIGRATIONS_DIR"
cp "$BACKEND_DIR/migrations/schema.sql" "$MIGRATIONS_DIR/schema.sql"

echo "==> 复制 .env.production -> $DIST_DIR/.env"
cp "$BACKEND_DIR/.env.production" "$DIST_DIR/.env"

echo ""
echo "✅ 构建完成：输出目录 $DIST_DIR"
echo "   启动: cd dist && ./server   (Windows: server.exe)"
