#!/usr/bin/env node
/**
 * 构建脚本
 * 1. 清理旧的构建, 新建构建目录; 2. 前端 build; 3. 复制前端 dist 到 web 目录; 4.准备后端构建文件
 * 5. 后端 build; 6. 复制后端 dist 到 backend 目录; 7. 使用@yao-pkg/pkg打包; 8. 创建启动脚本
 *
 */
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


cleanAll()