'use strict';

const { CliError } = require('../errors');
const { printInstallSummary } = require('./helpers');

module.exports = {
  name: 'disable',
  description: '禁用指定快捷模块并重新应用安装，如 cc disable pnpm 禁用 pnpm 模块',
  usage: 'cc disable <asset-id>',
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

    const configToSave = configData ? cloneConfig(configData) : ctx.config.createDefaultConfig(ctx.manifest);
    ctx.config.normaliseConfig(configToSave, { manifest: ctx.manifest });

    if (!ctx.config.isModuleEnabled(configToSave, asset.id, ctx.manifest)) {
      ctx.logger.log(`[cmdcc] 模块 ${asset.id} 已处于禁用状态。`);
      return;
    }

    ctx.config.setModuleEnabled(configToSave, asset.id, false, ctx.manifest);
    ctx.config.saveConfig(configToSave, { configDir: ctx.configDir });

    ctx.logger.log(`[cmdcc] 已禁用模块: ${asset.id}`);
    const summary = ctx.setup.install({
      logger: ctx.logger,
      manifest: ctx.manifest,
      configDir: ctx.configDir
    });
    printInstallSummary(summary, ctx.logger);
  }
};

function cloneConfig(config) {
  if (!config) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(config));
  } catch (error) {
    throw new CliError(`无法复制配置: ${error.message}`);
  }
}
