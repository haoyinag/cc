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

test('resolveEnabledAssets respects explicit empty list', () => {
  const logger = createLogger();
  const configData = { enabledAssets: [], version: 1 };
  const enabled = config.resolveEnabledAssets({ manifest, config: configData, logger });
  assert.strictEqual(enabled.length, 0);
  assert.strictEqual(logger.warnings.length, 0);
});

test('resolveEnabledAssets warns on unknown ids and ignores them', () => {
  const logger = createLogger();
  const configData = { enabledAssets: ['docker', 'unknown-one'], version: 1 };
  const enabled = config.resolveEnabledAssets({ manifest, config: configData, logger });
  assert.deepStrictEqual(enabled.map((asset) => asset.id), ['docker']);
  assert.ok(logger.warnings[0].includes('unknown-one'));
});

test('resolveRcFiles uses overrides with dedupe', () => {
  const configData = { shell: { rcFiles: ['/tmp/.bashrc', '/tmp/.zshrc', '/tmp/.bashrc'] } };
  const rcFiles = config.resolveRcFiles({ config: configData, defaultRcFiles: ['/a', '/b'] });
  assert.deepStrictEqual(rcFiles, ['/tmp/.bashrc', '/tmp/.zshrc']);
});
