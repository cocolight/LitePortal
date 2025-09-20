#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ========== 配置 ==========
const config = {
  frontendDir: 'frontend',
  backendDir:  'backend',
  outputDir:   'dist',
  webDir:      'web'
};
const projectRoot       = process.cwd();
const backendOutputDir  = path.join(projectRoot, config.outputDir, 'backend');
const webDir            = path.join(backendOutputDir, config.webDir);
const dataDir           = path.join(backendOutputDir, 'data');
const executableDir     = path.join(backendOutputDir, 'executable');

// ========== 工具：静默pnpm，出错才打印 ==========
function pnpmSilent(cwd, script) {
  try {
    execSync(`pnpm ${script}`, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe']   // 仅静默 stdout
    });
  } catch (e) {
    console.error(`\npnpm ${script} 失败：`);
    console.error(e.stderr?.toString() || e.message);
    throw e;               // 抛到最外层统一处理
  }
}

// ========== 工具：扁平化流程 ==========
function cleanAll() {
  if (fs.existsSync(config.outputDir)) fs.rmSync(config.outputDir, { recursive: true, force: true });
  // 前后端 clean:build
  pnpmSilent(path.join(projectRoot, config.frontendDir), 'run clean:build');
  pnpmSilent(path.join(projectRoot, config.backendDir),  'run clean:build');
}

function prepareDir() {
  [backendOutputDir, executableDir, dataDir, webDir].forEach(d => fs.mkdirSync(d, { recursive: true }));
}

function buildFrontend() {
  const dir = path.join(projectRoot, config.frontendDir);
  pnpmSilent(dir, 'install');
  pnpmSilent(dir, 'run build');
}

function copyFrontendDist() {
  const src = path.join(projectRoot, config.frontendDir, 'dist');
  if (fs.existsSync(src)) fs.cpSync(src, webDir, { recursive: true });

  // favicon 同时给 web 和 backend
  ['favicon.ico', 'favicon.png', 'favicon.svg'].forEach(f => {
    const from = path.join(projectRoot, config.frontendDir, 'public', f);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(webDir, f));
    }
  });
}

function buildBackend() {
  const dir = path.join(projectRoot, config.backendDir);
  pnpmSilent(dir, 'install');
  pnpmSilent(dir, 'run build:prod');
}

function prepareBackend() {
  ['package.json', 'pnpm-lock.yaml', '.env.production'].forEach(f => {
    const src = path.join(projectRoot, config.backendDir, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(backendOutputDir, f));
  });
}

function copyBackendDist() {
  const src = path.join(projectRoot, config.backendDir, 'dist');
  if (fs.existsSync(src)) fs.cpSync(src, backendOutputDir, { recursive: true });
}

async function usePkg() {
  const originalDir = process.cwd();
  try {
    process.chdir(backendOutputDir);

    // 1. 依赖
    pnpmSilent('.', 'install --production --shamefully-hoist');

    // 2. 原生模块
    fs.cpSync(
      path.join(projectRoot, 'backend/node_modules/better-sqlite3/build'),
      path.join(backendOutputDir, 'node_modules/better-sqlite3/build'),
      { recursive: true }
    );

    // 3. pkg 自身
    console.log(' >>>检查 pkg 是否已安装...');
    try {
      execSync('npx pkg --version', { stdio: 'pipe' });
      console.log(' >>>✅pkg 已安装');
    }
    catch {
      console.log(' >>>🚀 正在安装 pkg ...');
      pnpmSilent('.', 'add -D pkg');
      console.log(' >>>✅ pkg 安装完成');
    }

    // 4. 写配置
    const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    pkgJson.bin = 'main.js';
    pkgJson.pkg = {
      targets: ['node22-win-x64'],
      outputPath: 'executable',
      outputName: 'server',
      assets: ['web/**/*']
    };
    fs.writeFileSync('package.json', JSON.stringify(pkgJson, null, 2));

    // 5. 打包
    console.log(' >>>🚀 开始打包 exe , 耗时3分左右...');
    try {
      execSync('npx pkg .', { stdio: 'inherit' });
    } catch (e) {
      throw new Error('pkg 打包失败：' + (e.stderr?.toString() || e.message));

    }
    console.log('✅ 打包完成 → executable/server.exe');

    // 6. 清理
    cleanAfterPkg();
  } finally {
    process.chdir(originalDir);
    process.exit(1);
  }
}

function cleanAfterPkg() {
  const white = new Set(['executable', 'node_modules']); // 保留
  for (const entry of fs.readdirSync('.')) {
    if (!white.has(entry)) fs.rmSync(entry, { recursive: true, force: true });
  }
}

function createStartScript() {
  const win = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
cd backend\\executable
echo 启动 LitePortal 后端服务...
server.exe
pause
`;
  fs.writeFileSync(path.join(config.outputDir, 'start.bat'), win, 'utf-8');
  if (process.platform !== 'win32') {
    try { execSync(`chmod +x ${path.join(config.outputDir, 'start.sh')}`); }
    catch {}
  }
}

// ========== 主流程：只有一次 try/catch ==========
function main() {
  console.log('开始构建 LitePortal 项目...');
  const steps = [
    ['清理输出目录', cleanAll],
    ['创建输出目录', prepareDir],
    ['构建前端', buildFrontend],
    ['复制前端文件', copyFrontendDist],
    ['准备后端文件', prepareBackend],
    ['构建后端', buildBackend],
    ['复制后端文件', copyBackendDist],
    ['安装后端依赖+打包', usePkg],
    ['创建启动脚本', createStartScript]
  ];

  try {
    steps.forEach(([name, fn], idx) => {
      console.log(`[${idx + 1}/${steps.length}] ${name}...`);
      fn();
    });
    console.log('\n✅ 构建完成！输出目录:', config.outputDir);
  } catch (e) {
    console.error('\n❌ 构建失败:', e.message);
    process.exit(1);
  }
}

main();