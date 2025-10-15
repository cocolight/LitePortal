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
// const { log } = require('console');

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
// const executableDir = path.join(backendOutputDir, 'executable');

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
  [backendOutputDir,dataDir, webDir].forEach(d => fs.mkdirSync(d, { recursive: true }));
}

function buildFrontend() {
  const dir = path.join(projectRoot, config.frontendDir);
  pnpmSilent(dir, 'install');
  pnpmSilent(dir, 'run build:prod');
}

function copyFrontendDist() {
  const src = path.join(projectRoot, config.frontendDir, 'dist');
  if (fs.existsSync(src)) fs.cpSync(src, webDir, { recursive: true });
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
    ['生成.env', renameEnv]
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