'use strict';

const { printInstallSummary } = require('./helpers');

module.exports = {
  name: 'setup',
  aliases: ['install'],
  description: '复制快捷脚本并写入 shell 初始化文件',
  usage: 'cc setup',
  handler(ctx) {
    const summary = ctx.setup.install({
      logger: ctx.logger,
      manifest: ctx.manifest,
      configDir: ctx.configDir
    });
    printInstallSummary(summary, ctx.logger);
  }
};
