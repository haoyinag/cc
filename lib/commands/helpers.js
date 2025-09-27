'use strict';

function printInstallSummary(summary, logger = console) {
  if (summary.copied && summary.copied.length) {
    logger.log('[cmdcc] 已复制快捷脚本:');
    for (const file of summary.copied) {
      logger.log(`  - ${file}`);
    }
  } else {
    logger.log('[cmdcc] 快捷脚本已存在，无需更新。');
  }

  if (summary.pruned && summary.pruned.length) {
    logger.log('[cmdcc] 已清理禁用快捷脚本:');
    for (const file of summary.pruned) {
      logger.log(`  - ${file}`);
    }
  }

  if (summary.skipped && summary.skipped.length) {
    logger.log('[cmdcc] 下列脚本复制失败，请检查权限:');
    for (const file of summary.skipped) {
      logger.log(`  - ${file}`);
    }
  }

  if (summary.rcUpdated && summary.rcUpdated.length) {
    logger.log('[cmdcc] 已处理的 shell 初始化文件:');
    for (const { rcPath, status } of summary.rcUpdated) {
      logger.log(`  - ${rcPath} (${status})`);
    }
  }

  logger.log('[cmdcc] 请重新打开终端或执行 "exec $SHELL" 使别名生效。');
}

function printRemoveSummary(summary, logger = console) {
  if (summary.removed && summary.removed.length) {
    logger.log('[cmdcc] 已删除快捷脚本:');
    for (const file of summary.removed) {
      logger.log(`  - ${file}`);
    }
  } else {
    logger.log('[cmdcc] 没有发现需要清理的快捷脚本。');
  }

  if (summary.rcUpdated && summary.rcUpdated.length) {
    logger.log('[cmdcc] 已清理的 shell 初始化文件:');
    for (const { rcPath, status } of summary.rcUpdated) {
      logger.log(`  - ${rcPath} (${status})`);
    }
  }

  logger.log('[cmdcc] 如需恢复别名请再次执行 "cc setup"。');
}

module.exports = {
  printInstallSummary,
  printRemoveSummary
};
