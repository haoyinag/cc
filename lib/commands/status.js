'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'status',
  description: '查看当前安装状态',
  usage: 'cc status',
  handler(ctx) {
    const constants = ctx.setup.constants;
    const { data: configData, path: configPath, exists: configExists } = ctx.config.loadConfig({
      configDir: ctx.configDir,
      logger: ctx.logger
    });
    const enabledAssets = ctx.config.resolveEnabledAssets({ manifest: ctx.manifest, config: configData, logger: ctx.logger });
    const enabledIds = new Set(enabledAssets.map((asset) => asset.id));
    const rcFiles = ctx.config.resolveRcFiles({ config: configData, defaultRcFiles: constants.RC_FILES });

    ctx.logger.log(`[cmdcc] 主配置目录: ${ctx.configDir}`);
    if (fs.existsSync(ctx.configDir)) {
      const entries = fs.readdirSync(ctx.configDir);
      if (entries.length) {
        ctx.logger.log('[cmdcc] 当前托管的脚本文件:');
        for (const entry of entries) {
          ctx.logger.log(`  - ${path.join(ctx.configDir, entry)}`);
        }
      } else {
        ctx.logger.log('[cmdcc] 配置目录存在但为空。');
      }
    } else {
      ctx.logger.log('[cmdcc] 配置目录尚未创建，可执行 "cc setup"。');
    }

    if (configExists) {
      ctx.logger.log(`[cmdcc] 配置文件: ${configPath}`);
    } else {
      ctx.logger.log('[cmdcc] 配置文件尚未生成（将使用默认启用列表）。');
    }

    if (constants.LEGACY_CONFIG_DIRS.length) {
      ctx.logger.log('[cmdcc] 兼容处理的历史目录:');
      for (const dir of constants.LEGACY_CONFIG_DIRS) {
        const status = fs.existsSync(dir) ? '存在' : '不存在';
        ctx.logger.log(`  - ${dir} (${status})`);
      }
    }

    ctx.logger.log('[cmdcc] 资产启用状态:');
    for (const asset of ctx.manifest) {
      const status = enabledIds.has(asset.id) ? '启用' : '禁用';
      ctx.logger.log(`  - ${asset.id.padEnd(8)} ${status}  (${asset.file})`);
    }

    ctx.logger.log('[cmdcc] 已托管的 shell 初始化文件:');
    for (const rc of rcFiles) {
      const status = fs.existsSync(rc) ? '存在' : '缺失';
      ctx.logger.log(`  - ${rc} (${status})`);
    }
  }
};
