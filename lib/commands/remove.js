'use strict';

const { printRemoveSummary } = require('./helpers');

module.exports = {
  name: 'remove',
  aliases: ['uninstall'],
  description: '删除快捷脚本并清理 shell 初始化文件',
  usage: 'cc remove',
  handler(ctx) {
    const summary = ctx.setup.remove({
      logger: ctx.logger,
      manifest: ctx.manifest,
      configDir: ctx.configDir
    });
    printRemoveSummary(summary, ctx.logger);
  }
};
