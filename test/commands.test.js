'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { test, assert } = require('./harness');

const enable = require('../lib/commands/enable');
const disable = require('../lib/commands/disable');
const config = require('../lib/config');
const assetRegistry = require('../lib/assets/registry');

function createContext(tmpDir) {
  const manifest = assetRegistry.list();
  const calls = [];
  const logger = createLogger();
  const setupStub = {
    install(options) {
      calls.push(options);
      return { copied: [], pruned: [], rcUpdated: [] };
    }
  };

  return {
    manifest,
    configDir: tmpDir,
    logger,
    setup: setupStub,
    config,
    assetRegistry,
    constants: {},
    commands: {
      resolve() {},
      list() { return []; }
    },
    get calls() {
      return calls;
    }
  };
}

function createLogger() {
  const logs = [];
  return {
    logs,
    log(message) {
      logs.push(message);
    },
    warn(message) {
      logs.push(message);
    }
  };
}

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cmdcc-cmd-'));
}

function readConfig(configDir) {
  return JSON.parse(fs.readFileSync(config.getConfigPath(configDir), 'utf8'));
}

test('enable adds asset id to config and triggers install', () => {
  const tmpDir = createTempDir();
  try {
    const ctx = createContext(tmpDir);
    ctx.args = ['docker'];

    const base = config.createDefaultConfig(ctx.manifest);
    base.enabledAssets = base.enabledAssets.filter((id) => id !== 'docker');
    config.saveConfig(base, { configDir: tmpDir });

    enable.handler(ctx);

    const stored = readConfig(tmpDir);
    assert.ok(stored.enabledAssets.includes('docker'));
    assert.strictEqual(ctx.calls.length, 1);
    assert.strictEqual(ctx.calls[0].configDir, tmpDir);

    enable.handler(ctx);
    const storedAgain = readConfig(tmpDir);
    assert.ok(storedAgain.enabledAssets.includes('docker'));
    assert.strictEqual(ctx.calls.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('disable removes asset id from config and triggers reinstall', () => {
  const tmpDir = createTempDir();
  try {
    const ctx = createContext(tmpDir);
    ctx.args = ['docker'];

    const base = config.createDefaultConfig(ctx.manifest);
    config.saveConfig(base, { configDir: tmpDir });

    disable.handler(ctx);

    const stored = readConfig(tmpDir);
    assert.ok(!stored.enabledAssets.includes('docker'));
    assert.strictEqual(ctx.calls.length, 1);
    assert.strictEqual(ctx.calls[0].configDir, tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
