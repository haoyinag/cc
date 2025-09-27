'use strict';

const { test, assert } = require('./harness');

const config = require('../lib/config');
const assetRegistry = require('../lib/assets/registry');

const manifest = assetRegistry.list();

function createLogger() {
  const warnings = [];
  return {
    warnings,
    log() {},
    warn(message) {
      warnings.push(message);
    }
  };
}

test('resolveEnabledAssets defaults to manifest defaults when config missing', () => {
  const logger = createLogger();
  const enabled = config.resolveEnabledAssets({ manifest, config: undefined, logger });
  const defaultIds = assetRegistry.getDefaultEnabled(manifest);
  assert.deepStrictEqual(enabled.map((asset) => asset.id), defaultIds);
  assert.strictEqual(logger.warnings.length, 0);
});

test('resolveEnabledAssets读取modules.enabled标记', () => {
  const logger = createLogger();
  const configData = {
    modules: {
      pnpm: { enabled: false },
      docker: true
    }
  };
  const enabled = config.resolveEnabledAssets({ manifest, config: configData, logger });
  assert.deepStrictEqual(enabled.map((asset) => asset.id), ['docker']);
  assert.strictEqual(logger.warnings.length, 0);
});

test('resolveEnabledAssets 解析未知模块时给出提示', () => {
  const logger = createLogger();
  const configData = {
    modules: {
      pnpm: { enabled: true },
      'unknown-one': true
    }
  };
  const enabled = config.resolveEnabledAssets({ manifest, config: configData, logger });
  assert.ok(enabled.find((asset) => asset.id === 'pnpm'));
  assert.ok(logger.warnings[0].includes('unknown-one'));
});

test('resolveEnabledAssets 仍兼容 legacy enabledAssets 列表', () => {
  const logger = createLogger();
  const configData = { enabledAssets: [], version: 1 };
  const enabled = config.resolveEnabledAssets({ manifest, config: configData, logger });
  assert.strictEqual(enabled.length, 0);
  assert.strictEqual(logger.warnings.length, 0);
});

test('resolveRcFiles uses overrides with dedupe', () => {
  const configData = { shell: { rcFiles: ['/tmp/.bashrc', '/tmp/.zshrc', '/tmp/.bashrc'] } };
  const rcFiles = config.resolveRcFiles({ config: configData, defaultRcFiles: ['/a', '/b'] });
  assert.deepStrictEqual(rcFiles, ['/tmp/.bashrc', '/tmp/.zshrc']);
});
