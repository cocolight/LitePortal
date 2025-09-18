@echo off
chcp 65001 >nul
echo 清理构建文件和临时文件...

echo [1/3] 清理前端构建文件...
REM 清理前端构建文件
if exist "frontend\dist" (
    echo 删除前端构建目录: frontend\dist
    rmdir /s /q "frontend\dist"
)

echo [2/3] 清理后端构建文件...
REM 清理后端构建文件
if exist "backen\dist" (
    echo 删除后端构建目录: backen\dist
    rmdir /s /q "backen\dist"
)

echo [3/3] 清理项目构建输出...
REM 清理项目构建输出
if exist "dist" (
    echo 删除项目构建目录: dist
    rmdir /s /q "dist"
)

REM 清理 stats.html 文件
if exist "frontend\stats.html" (
    echo 删除前端 stats.html
    del /f /q "frontend\stats.html"
)

if exist "web\stats.html" (
    echo 删除 web 目录下的 stats.html
    del /f /q "web\stats.html"
)

echo 清理完成！
pause
