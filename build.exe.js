#!/usr/bin/env node
/**
 * 构建脚本
 * 1. 清理旧的构建, 新建构建目录; 2. 前端 build; 3. 复制前端 dist 到 web 目录; 4.准备后端构建文件
 * 5. 后端 build; 6. 复制后端 dist 到 backend 目录; 7. 使用@yao-pkg/pkg打包; 8. 创建启动脚本
 *
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { log } = require('console');

// ========== 配置 ==========
const config = {
  frontendDir: 'frontend',
  backendDir: 'backend',
  outputDir: 'dist',
  webDir: 'web'
};
const projectRoot = process.cwd();
const backendOutputDir = path.join(projectRoot, config.outputDir);
const webDir = path.join(backendOutputDir, config.webDir);
const dataDir = path.join(backendOutputDir, 'data');
const executableDir = path.join(backendOutputDir, 'executable');

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
  pnpmSilent(path.join(projectRoot, config.backendDir), 'run clean:build');
}

function prepareDir() {
  [backendOutputDir, executableDir, dataDir, webDir].forEach(d => fs.mkdirSync(d, { recursive: true }));
}

function buildFrontend() {
  const dir = path.join(projectRoot, config.frontendDir);
  pnpmSilent(dir, 'install');
  pnpmSilent(dir, 'run build:prod');
}

function copyFrontendDist() {
  const src = path.join(projectRoot, config.frontendDir, 'dist');
  if (fs.existsSync(src)) fs.cpSync(src, webDir, { recursive: true });

  // favicon
  // ['favicon.ico', 'favicon.png', 'favicon.svg'].forEach(f => {
  //   const from = path.join(projectRoot, config.frontendDir, 'public', f);
  //   if (fs.existsSync(from)) {
  //     fs.copyFileSync(from, path.join(webDir, f));
  //   }
  // });
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

function renameEnv(){
  const old = path.resolve(backendOutputDir, '.env.production');
  const newp = path.resolve(backendOutputDir, '.env');
  fs.renameSync(old, newp);
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
      execSync('npx @yao-pkg/pkg --version', { stdio: 'pipe' });
      console.log(' >>>@yao-pkg/pkg 已安装');
    }
    catch {
      console.log(' >>>🚀 正在安装 @yao-pkg/pkg ...');
      pnpmSilent('.', 'add -D @yao-pkg/pkg');
      console.log(' >>>✅ @yao-pkg/pkg 安装完成');
    }

    // 4. 写配置
    const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    pkgJson.bin = 'main.js';
    pkgJson.pkg = {
      // targets: ['node22-win-x64', 'node22-linux-x64', 'node22-macos-x64'],
      targets: ['node22-win-x64'],
      outputPath: path.join(backendOutputDir, 'executable'),
      outputName: 'server',
      assets: ['web/**/*', '.env.production', 'node_modules/better-sqlite3/**/*'],
      debug: true,
      log: 'info'
    };
    fs.writeFileSync('package.json', JSON.stringify(pkgJson, null, 2));

    // 5. 打包
    console.log(' >>>🚀 开始打包 exe , 耗时3分左右...');
    const out = execSync('npx @yao-pkg/pkg . -o executable/server.exe', {
      cwd: '.',
      stdio: 'pipe',          // 先截获日志
      encoding: 'utf8'
    });

    // ① 日志里出现失败关键字 → 抛错
    if (/Failed to fetch|checksum mismatch|ENOENT|404|ECONNRESET/i.test(out)) {
      throw new Error('pkg 预编译二进制下载失败：\n' + out);
    }

    // ② 最终文件必须存在 → 兜底
    const serverExe = path.join(process.cwd(), 'executable', 'server.exe');
    if (!fs.existsSync(serverExe)) {
      throw new Error('pkg 未生成目标文件：' + serverExe);
    }

    // 正常日志继续打印
    process.stdout.write(out);
    console.log('✅ 打包完成 →', serverExe);
    // 6. 清理
    cleanAfterPkg();
  } finally {
    process.chdir(originalDir);
  }
}

function cleanAfterPkg() {
  const white = new Set(['executable']); // 保留
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
    catch { }
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
    ['生成.env', renameEnv],
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