#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
  frontendDir: 'frontend',
  backendDir: 'backen',
  outputDir: 'dist',
  webDir: 'web'
};

// 清理输出目录
function cleanOutputDir() {
  console.log('清理输出目录...');
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(config.outputDir, { recursive: true });
  console.log('输出目录已清理');
}

// 构建前端项目
function buildFrontend() {
  console.log('构建前端项目...');
  process.chdir(config.frontendDir);

  try {
    // 安装依赖
    console.log('安装前端依赖...');
    execSync('npm install', { stdio: 'inherit' });

    // 构建项目
    console.log('构建前端...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('前端构建完成');
  } catch (error) {
    console.error('前端构建失败:', error);
    process.exit(1);
  } finally {
    process.chdir('..');
  }
}

// 准备后端文件
function prepareBackend() {
  console.log('准备后端文件...');

  // 确保使用绝对路径
  const projectRoot = process.cwd();
  const backendOutputDir = path.join(projectRoot, config.outputDir, config.backendDir);
  fs.mkdirSync(backendOutputDir, { recursive: true });

  // 复制后端文件
  console.log('复制后端文件...');
  const backendFiles = [
    'server.js',
    'config.js',
    'package.json',
    'package-lock.json',
    'testDataInit.js',
    'resetDatabase.js'
  ];

  backendFiles.forEach(file => {
    const srcPath = path.join(projectRoot, config.backendDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(backendOutputDir, file));
    }
  });

  // 复制后端目录
  const backendDirs = ['db', 'middleware', 'routes', 'utils'];
  backendDirs.forEach(dir => {
    const srcDir = path.join(projectRoot, config.backendDir, dir);
    const destDir = path.join(backendOutputDir, dir);

    if (fs.existsSync(srcDir)) {
      fs.cpSync(srcDir, destDir, { recursive: true });
    }
  });

  // 复制前端构建文件到输出目录（与可执行文件同级）
  console.log('复制前端文件到输出目录...');
  const frontendDistDir = path.join(projectRoot, config.frontendDir, 'dist');
  const outputWebDir = path.join(projectRoot, config.outputDir, 'web');

  if (fs.existsSync(frontendDistDir)) {
    fs.cpSync(frontendDistDir, outputWebDir, { recursive: true });
  }
  
  // 同时复制一份到后端目录（供开发环境使用）
  const backendWebDir = path.join(backendOutputDir, 'web');
  if (fs.existsSync(frontendDistDir)) {
    fs.cpSync(frontendDistDir, backendWebDir, { recursive: true });
  }

  // 复制 favicon 文件
  const faviconFiles = ['favicon.ico', 'favicon.png', 'favicon.svg'];
  faviconFiles.forEach(file => {
    const faviconPath = path.join(projectRoot, config.frontendDir, 'public', file);
    if (fs.existsSync(faviconPath)) {
      fs.copyFileSync(faviconPath, path.join(backendWebDir, file));
    }
  });

  // 创建数据目录
  const dataDir = path.join(backendOutputDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  // 创建 executable 目录（pkg 输出目录）
  const executableDir = path.join(backendOutputDir, 'executable');
  fs.mkdirSync(executableDir, { recursive: true });

  // 安装后端依赖和打包工具
  console.log('安装后端依赖...');
  const originalDir = process.cwd();
  process.chdir(backendOutputDir);
  try {
    execSync('npm install --production', { stdio: 'inherit' });

    // 检查 pkg 是否已安装
    console.log('检查打包工具 pkg...');
    try {
      execSync('npx pkg --version', { stdio: 'pipe' });
      console.log('pkg 已安装，跳过安装步骤');
    } catch (error) {
      console.log('安装打包工具 pkg...');
      execSync('npm install --save-dev pkg', { stdio: 'inherit' });
    }

    // 添加 pkg 配置到 package.json
    console.log('配置打包选项...');
    const packageJsonPath = path.join(backendOutputDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.bin = 'server.js';
    packageJson.pkg = {
      'targets': [
        'node18-win-x64',
        'node18-linux-x64',
        'node18-macos-x64'
      ],
      'outputPath': 'executable',
      'outputName': 'server',
      'assets': [
        'data/**/*'
        // 不再包含web目录，改为外部读取
      ]
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // 打包后端应用
    console.log('打包后端应用...');
    execSync('npx pkg .', { stdio: 'inherit' });

    console.log('后端准备完成');
  } catch (error) {
    console.error('后端准备失败:', error);
    process.exit(1);
  } finally {
    process.chdir(originalDir);
  }
}

// 创建启动脚本
function createStartScript() {
  console.log('创建启动脚本...');

  // Windows 启动脚本 - 使用 \r\n 作为换行符
  const windowsScript = "@echo off\r\n" +
    "chcp 65001 >nul\r\n" +
    "cd /d \"%~dp0\"\r\n" +
    "cd backen\\executable\r\n" +
    "echo 启动 LitePortal 后端服务...\r\n" +
    "REM 查找Windows可执行文件\r\n" +
    "if exist \"server.exe\" (\r\n" +
    "    server.exe\r\n" +
    ") else if exist \"backen-win.exe\" (\r\n" +
    "    backen-win.exe\r\n" +
    ") else if exist \"backen.exe\" (\r\n" +
    "    backen.exe\r\n" +
    ") else (\r\n" +
    "    echo 错误：找不到可执行文件\r\n" +
    "    echo 请确保已正确构建项目\r\n" +
    ")\r\n" +
    "pause\r\n";

  // Linux/Mac 启动脚本
  const linuxScript = `#!/bin/bash
cd "$(dirname "$0")"
cd backen/executable
echo "启动 LitePortal 后端服务..."
if [ -f "server" ]; then
    ./server
elif [ -f "backen" ]; then
    ./backen
else
    echo "错误：找不到可执行文件"
    echo "请确保已正确构建项目"
fi
`;

  fs.writeFileSync(path.join(config.outputDir, 'start.bat'), windowsScript, 'utf-8');
  fs.writeFileSync(path.join(config.outputDir, 'start.sh'), linuxScript);

  // 给 Linux/Mac 脚本添加执行权限（仅在非Windows环境下）
  if (process.platform !== 'win32') {
    try {
      execSync(`chmod +x ${path.join(config.outputDir, 'start.sh')}`);
    } catch (error) {
      console.warn('无法设置启动脚本的执行权限:', error.message);
    }
  }

  console.log('启动脚本已创建');
}

// 主函数
function main() {
  console.log('开始构建 LitePortal 项目...');
  console.log('[1/5] 清理输出目录...');

  cleanOutputDir();

  console.log('[2/5] 构建前端...');
  buildFrontend();

  console.log('[3/5] 准备后端...');
  prepareBackend();

  console.log('[4/5] 创建启动脚本...');
  createStartScript();

  console.log('[5/5] 创建README文件...');
  // createReadme(); // 暂时注释掉，因为函数未定义

  console.log('构建完成！输出目录:', config.outputDir);
}

// 运行主函数
main();