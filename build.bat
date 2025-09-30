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
echo 运行构建脚本build.js...
node build.exe.js

if %errorlevel% neq 0 (
    echo 构建失败
    pause
    exit /b 1
)

echo 构建脚本build.js运行完成!
pause
