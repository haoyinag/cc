'use strict';

const fs = require('fs');
const path = require('path');

const constants = require('./constants');
const assetRegistry = require('./assets/registry');

const CONFIG_VERSION = 1;

function getBackupPath(configPath) {
  return `${configPath}.bak`;
}

function getConfigPath(configDir = constants.CONFIG_DIR) {
  return path.join(configDir, 'config.json');
}

function loadConfig({ configDir = constants.CONFIG_DIR, logger = console } = {}) {
  const configPath = getConfigPath(configDir);
  if (!fs.existsSync(configPath)) {
    return { data: null, path: configPath, exists: false, valid: true };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);
    return { data, path: configPath, exists: true, valid: true };
  } catch (error) {
    const backupPath = getBackupPath(configPath);
    try {
      fs.copyFileSync(configPath, backupPath);
      logger.warn(`[cmdcc] 配置文件解析失败，已备份到 ${backupPath}: ${error.message}`);
    } catch (copyError) {
      logger.warn(`[cmdcc] 配置文件解析失败 (${error.message})，且无法备份: ${copyError.message}`);
    }
    return { data: null, path: configPath, exists: true, valid: false, error, backup: backupPath };
  }
}

function saveConfig(data, { configDir = constants.CONFIG_DIR } = {}) {
  const configPath = getConfigPath(configDir);
  fs.mkdirSync(configDir, { recursive: true });
  const payload = JSON.stringify(data, null, 2);
  const tmpPath = `${configPath}.tmp`;
  const backupPath = fs.existsSync(configPath) ? getBackupPath(configPath) : null;

  if (backupPath) {
    try {
      fs.copyFileSync(configPath, backupPath);
    } catch (error) {
      // 备份失败不应阻断写入，但需要提醒
      // 使用 console 以避免循环依赖
      console.warn(`[cmdcc] 无法备份原配置 ${configPath}: ${error.message}`);
    }
  }

  fs.writeFileSync(tmpPath, `${payload}\n`, 'utf8');
  if (fs.existsSync(configPath)) {
    try {
      fs.unlinkSync(configPath);
    } catch (error) {
      console.warn(`[cmdcc] 无法替换旧配置 ${configPath}: ${error.message}`);
      throw error;
    }
  }
  fs.renameSync(tmpPath, configPath);
  return { path: configPath, backup: backupPath };
}

function resolveEnabledAssets({ manifest = assetRegistry.list(), config, logger = console } = {}) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    return [];
  }

  const modulesConfig = config?.modules;
  const moduleKeys = modulesConfig && typeof modulesConfig === 'object' ? Object.keys(modulesConfig) : [];
  const hasModuleConfig = moduleKeys.length > 0;

  const byId = new Map(manifest.map((entry) => [entry.id, entry]));
  const enabled = [];

  if (hasModuleConfig) {
    for (const entry of manifest) {
      const fallback = entry.defaultEnabled !== false;
      if (readModuleEnabled(modulesConfig, entry.id, fallback)) {
        enabled.push(entry);
      }
    }

    const unknownModules = moduleKeys.filter((key) => !byId.has(key));
    if (unknownModules.length > 0) {
      logger.warn(`[cmdcc] 配置中存在未知模块: ${unknownModules.join(', ')}`);
    }

    return enabled;
  }

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
  const modules = {};
  const enabledAssets = [];
  for (const entry of manifest) {
    const enabled = entry.defaultEnabled !== false;
    modules[entry.id] = { enabled };
    if (enabled) {
      enabledAssets.push(entry.id);
    }
  }
  return {
    version: CONFIG_VERSION,
    modules,
    enabledAssets,
    shell: {
      rcFiles: []
    }
  };
}

function readModuleEnabled(modulesConfig, moduleId, fallback) {
  if (!modulesConfig || typeof modulesConfig !== 'object') {
    return fallback;
  }
  if (!Object.prototype.hasOwnProperty.call(modulesConfig, moduleId)) {
    return fallback;
  }

  const value = modulesConfig[moduleId];
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'object') {
    if (typeof value.enabled === 'boolean') {
      return value.enabled;
    }
    if ('enabled' in value) {
      return Boolean(value.enabled);
    }
    return true;
  }
  return Boolean(value);
}

function getEnabledModuleIds(modulesConfig, manifest = assetRegistry.list()) {
  const ids = [];
  for (const entry of manifest) {
    const fallback = entry.defaultEnabled !== false;
    if (readModuleEnabled(modulesConfig, entry.id, fallback)) {
      ids.push(entry.id);
    }
  }
  return ids;
}

function ensureModulesContainer(config) {
  if (!config.modules || typeof config.modules !== 'object') {
    config.modules = {};
  }
  return config.modules;
}

function setModuleEnabled(config, moduleId, enabled, manifest = assetRegistry.list()) {
  const modules = ensureModulesContainer(config);
  if (!Object.prototype.hasOwnProperty.call(modules, moduleId)) {
    modules[moduleId] = { enabled: Boolean(enabled) };
  } else {
    const existing = modules[moduleId];
    if (typeof existing === 'object' && existing !== null) {
      existing.enabled = Boolean(enabled);
    } else {
      modules[moduleId] = { enabled: Boolean(enabled) };
    }
  }

  config.enabledAssets = getEnabledModuleIds(modules, manifest);
  return config;
}

function isModuleEnabled(config, moduleId, manifest = assetRegistry.list()) {
  const modules = config?.modules;
  const match = manifest.find((entry) => entry.id === moduleId);
  const fallback = match ? match.defaultEnabled !== false : false;
  return readModuleEnabled(modules, moduleId, fallback);
}

module.exports = {
  CONFIG_VERSION,
  getConfigPath,
  loadConfig,
  saveConfig,
  resolveEnabledAssets,
  resolveRcFiles,
  createDefaultConfig,
  setModuleEnabled,
  isModuleEnabled,
  getEnabledModuleIds
};
