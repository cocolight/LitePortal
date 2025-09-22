@echo off
chcp 65001 >nul

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 运行构建脚本
echo 运行清理脚本clean.build.js...
node clean.build.js

if %errorlevel% neq 0 (
    echo 清理失败
    pause
    exit /b 1
)

echo 清理脚本clean.build.js运行完成!
pause
