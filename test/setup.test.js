'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { test, assert } = require('./harness');

const setup = require('../lib/setup');
const config = require('../lib/config');
const constants = require('../lib/constants');
const assetRegistry = require('../lib/assets/registry');

function createTempWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cmdcc-setup-'));
  const configDir = path.join(root, 'config');
  const rcFile = path.join(root, '.testrc');
  fs.writeFileSync(rcFile, '# test rc\n', 'utf8');
  return { root, configDir, rcFile };
}

test('setup.install copies enabled assets and writes rc block', () => {
  const workspace = createTempWorkspace();
  const { root, configDir, rcFile } = workspace;
  const logger = createLogger();
  const manifest = assetRegistry.list();

  try {
    setup.install({
      packageRoot: constants.PACKAGE_ROOT,
      logger,
      configDir,
      rcFiles: [rcFile],
      manifest
    });

    const copiedFiles = manifest.map((entry) => path.join(configDir, entry.file));
    for (const file of copiedFiles) {
      assert.ok(fs.existsSync(file), `expected ${file} to exist`);
    }

    const configPath = config.getConfigPath(configDir);
    assert.ok(fs.existsSync(configPath));
    const stored = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.ok(Array.isArray(stored.enabledAssets));

    const rcContent = fs.readFileSync(rcFile, 'utf8');
    assert.ok(rcContent.includes(setup.constants.MARKER_START));
    assert.ok(rcContent.includes(setup.constants.MARKER_END));

    stored.enabledAssets = [];
    config.saveConfig(stored, { configDir });
    const summaryAfterDisable = setup.install({
      packageRoot: constants.PACKAGE_ROOT,
      logger,
      configDir,
      rcFiles: [rcFile],
      manifest
    });

    for (const file of copiedFiles) {
      assert.ok(!fs.existsSync(file), `expected ${file} to be pruned`);
    }
    assert.ok(summaryAfterDisable.pruned.length >= copiedFiles.length);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createLogger() {
  return {
    log() {},
    warn() {}
  };
}
