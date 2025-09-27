'use strict';

module.exports = {
  name: 'list',
  aliases: ['ls'],
  description: '列出所有可用快捷模块及启用状态',
  usage: 'cc list',
  handler(ctx) {
    const { data: configData } = ctx.config.loadConfig({
      configDir: ctx.configDir,
      logger: ctx.logger
    });
    const enabledAssets = ctx.config.resolveEnabledAssets({ manifest: ctx.manifest, config: configData, logger: ctx.logger });
    const enabledIds = new Set(enabledAssets.map((asset) => asset.id));

    ctx.logger.log('[cmdcc] 可用模块:');
    for (const asset of ctx.manifest) {
      const statusIcon = enabledIds.has(asset.id) ? '[x]' : '[ ]';
      const line = `${statusIcon} ${asset.id.padEnd(8)} ${asset.description}`;
      ctx.logger.log(`  ${line}`);
    }
  }
};
