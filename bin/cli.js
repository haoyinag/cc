#!/usr/bin/env node
'use strict';

const fs = require('fs');

const setup = require('../lib/setup');

const commands = {
  setup: runSetup,
  install: runSetup,
  remove: runRemove,
  uninstall: runRemove,
  status: runStatus,
  help: runHelp
};

const argv = process.argv.slice(2);
const cmd = normalizeCommand(argv[0] || 'setup');
const handler = commands[cmd] || runHelp;
handler(argv.slice(1));

function runSetup() {
  const summary = setup.install({ logger: console });
  if (summary.copied.length) {
    console.log('[cmdsc] 已复制快捷脚本:');
    for (const file of summary.copied) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log('[cmdsc] 快捷脚本已存在，无需更新。');
  }
  if (summary.rcUpdated.length) {
    console.log('[cmdsc] 已处理的 shell 初始化文件:');
    for (const { rcPath, status } of summary.rcUpdated) {
      console.log(`  - ${rcPath} (${status})`);
    }
  }
  console.log('[cmdsc] 请重新打开终端或执行 "exec $SHELL" 使别名生效。');
}

function runRemove() {
  const summary = setup.remove({ logger: console });
  if (summary.removed.length) {
    console.log('[cmdsc] 已删除快捷脚本:');
    for (const file of summary.removed) {
      console.log(`  - ${file}`);
    }
  }
  if (summary.rcUpdated.length) {
    console.log('[cmdsc] 已清理的 shell 初始化文件:');
    for (const { rcPath, status } of summary.rcUpdated) {
      console.log(`  - ${rcPath} (${status})`);
    }
  }
  console.log('[cmdsc] 如需恢复别名请再次执行 "cc setup"。');
}

function runStatus() {
  const { CONFIG_DIR, LEGACY_CONFIG_DIRS, RC_FILES, ASSET_FILES } = setup.constants;
  console.log(`[cmdsc] 主配置目录: ${CONFIG_DIR}`);
  if (fs.existsSync(CONFIG_DIR)) {
    const entries = fs.readdirSync(CONFIG_DIR).map((entry) => `  - ${entry}`);
    if (entries.length) {
      console.log('[cmdsc] 当前托管的脚本文件:');
      for (const entry of entries) {
        console.log(entry);
      }
    } else {
      console.log('[cmdsc] 配置目录存在但为空。');
    }
  } else {
    console.log('[cmdsc] 配置目录尚未创建，可执行 "cc setup"。');
  }

  if (LEGACY_CONFIG_DIRS.length) {
    console.log('[cmdsc] 兼容处理的历史目录:');
    for (const dir of LEGACY_CONFIG_DIRS) {
      const status = fs.existsSync(dir) ? '存在' : '不存在';
      console.log(`  - ${dir} (${status})`);
    }
  }

  console.log('[cmdsc] 预计应复制的脚本:');
  for (const file of ASSET_FILES) {
    console.log(`  - ${file}`);
  }

  console.log('[cmdsc] 已托管的 shell 初始化文件:');
  for (const rc of RC_FILES) {
    const status = fs.existsSync(rc) ? '存在' : '缺失';
    console.log(`  - ${rc} (${status})`);
  }
}

function runHelp() {
  console.log('用法: cc <command>');
  console.log('可用命令:');
  console.log('  setup|install     复制快捷脚本并写入 shell 初始化文件');
  console.log('  remove|uninstall  删除快捷脚本并清理 shell 初始化文件');
  console.log('  status            查看当前安装状态');
  console.log('  help              显示此帮助');
}

function normalizeCommand(value) {
  if (!value) {
    return 'setup';
  }
  const key = value.toLowerCase();
  if (key === 'rm') {
    return 'remove';
  }
  return key;
}
