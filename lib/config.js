'use strict';

const fs = require('fs');
const path = require('path');

const constants = require('./constants');
const assetRegistry = require('./assets/registry');

const CONFIG_VERSION = 1;

function getConfigPath(configDir = constants.CONFIG_DIR) {
  return path.join(configDir, 'config.json');
}

function loadConfig({ configDir = constants.CONFIG_DIR, logger = console } = {}) {
  const configPath = getConfigPath(configDir);
  if (!fs.existsSync(configPath)) {
    return { data: null, path: configPath, exists: false };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);
    return { data, path: configPath, exists: true };
  } catch (error) {
    logger.warn(`[cmdcc] Failed to read config at ${configPath}: ${error.message}`);
    return { data: null, path: configPath, exists: false, error };
  }
}

function saveConfig(data, { configDir = constants.CONFIG_DIR } = {}) {
  const configPath = getConfigPath(configDir);
  fs.mkdirSync(configDir, { recursive: true });
  const payload = JSON.stringify(data, null, 2);
  fs.writeFileSync(configPath, `${payload}\n`, 'utf8');
  return configPath;
}

function resolveEnabledAssets({ manifest = assetRegistry.list(), config, logger = console } = {}) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    return [];
  }

  const byId = new Map(manifest.map((entry) => [entry.id, entry]));
  const enabled = [];

  const hasExplicitList = Array.isArray(config?.enabledAssets);
  const configIds = hasExplicitList ? config.enabledAssets : null;
  if (!hasExplicitList) {
    for (const entry of manifest) {
      if (entry.defaultEnabled !== false) {
        enabled.push(entry);
      }
    }
    return enabled;
  }

  if (!configIds || configIds.length === 0) {
    return enabled;
  }

  const unknown = [];
  const seen = new Set();
  for (const id of configIds) {
    if (typeof id !== 'string') {
      continue;
    }
    const normalized = id.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    const match = byId.get(normalized);
    if (match) {
      enabled.push(match);
    } else {
      unknown.push(normalized);
    }
  }

  if (unknown.length > 0) {
    logger.warn(`[cmdcc] Unknown asset id(s) in config: ${unknown.join(', ')}`);
  }

  return enabled;
}

function resolveRcFiles({ config, defaultRcFiles = constants.RC_FILES } = {}) {
  const base = Array.isArray(defaultRcFiles) ? defaultRcFiles : Array.from(defaultRcFiles || []);
  const overrides = config?.shell?.rcFiles;
  if (!Array.isArray(overrides) || overrides.length === 0) {
    return base.slice();
  }
  const result = [];
  const seen = new Set();
  for (const entry of overrides) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result.length > 0 ? result : base.slice();
}

function createDefaultConfig(manifest = assetRegistry.list()) {
  return {
    version: CONFIG_VERSION,
    enabledAssets: assetRegistry.getDefaultEnabled(manifest),
    shell: {
      rcFiles: []
    }
  };
}

module.exports = {
  CONFIG_VERSION,
  getConfigPath,
  loadConfig,
  saveConfig,
  resolveEnabledAssets,
  resolveRcFiles,
  createDefaultConfig
};
