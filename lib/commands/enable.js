'use strict';

const { CliError } = require('../errors');
const { printInstallSummary } = require('./helpers');

module.exports = {
  name: 'enable',
  description: '启用指定快捷模块并重新应用安装，如 cc enable pnpm 启动 pnpm 模块',
  usage: 'cc enable <asset-id>',
  handler(ctx) {
    const assetId = (ctx.args[0] || '').trim().toLowerCase();
    if (!assetId) {
      throw new CliError('缺少模块 ID 参数', { exitCode: 1 });
    }

    const asset = ctx.manifest.find((entry) => entry.id === assetId);
    if (!asset) {
      throw new CliError(`未找到模块: ${assetId}`, { exitCode: 1 });
    }

    const { data: configData } = ctx.config.loadConfig({
      configDir: ctx.configDir,
      logger: ctx.logger
    });

    const defaults = ctx.config.createDefaultConfig(ctx.manifest);
    const configToSave = configData ? { ...configData } : { ...defaults };
    if (!Array.isArray(configToSave.enabledAssets)) {
      configToSave.enabledAssets = defaults.enabledAssets.slice();
    }

    const enabledSet = new Set(configToSave.enabledAssets);
    if (enabledSet.has(asset.id)) {
      ctx.logger.log(`[cmdcc] 模块 ${asset.id} 已经启用。`);
      return;
    }

    enabledSet.add(asset.id);
    configToSave.enabledAssets = orderEnabledIds(enabledSet, ctx.manifest);
    ctx.config.saveConfig(configToSave, { configDir: ctx.configDir });

    ctx.logger.log(`[cmdcc] 已启用模块: ${asset.id}`);
    const summary = ctx.setup.install({
      logger: ctx.logger,
      manifest: ctx.manifest,
      configDir: ctx.configDir
    });
    printInstallSummary(summary, ctx.logger);
  }
};

function orderEnabledIds(enabledSet, manifest) {
  const ordered = [];
  for (const asset of manifest) {
    if (enabledSet.has(asset.id)) {
      ordered.push(asset.id);
    }
  }
  for (const id of enabledSet) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
}
