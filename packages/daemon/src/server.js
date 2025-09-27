'use strict';

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');

const config = require('../../lib/config');
const setup = require('../../lib/setup');
const assetRegistry = require('../../lib/assets/registry');
const logger = require('./logger');
const { buildDoctorReport } = require('./doctor');

const sharedTypesPath = path.join(__dirname, '../../shared/src/index.ts');

const PORT = Number(process.env.CMDCC_PORT || 3777);
const TOKEN = process.env.CMDCC_TOKEN || null;

function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    if (!TOKEN) {
      return next();
    }
    const header = req.headers.authorization || '';
    if (header === `Bearer ${TOKEN}`) {
      return next();
    }
    return res.status(401).json({ error: { code: 'auth:unauthorized', message: 'Invalid token' } });
  });

  app.get('/state', async (req, res) => {
    try {
      const state = buildState();
      res.json(state);
    } catch (error) {
      handleError(res, error, 'state:failed');
    }
  });

  app.post('/modules/:id/enable', async (req, res) => {
    const moduleId = req.params.id;
    try {
      const result = toggleModule(moduleId, true);
      res.json(result);
    } catch (error) {
      handleError(res, error, 'module:enable');
    }
  });

  app.post('/modules/:id/disable', async (req, res) => {
    const moduleId = req.params.id;
    try {
      const result = toggleModule(moduleId, false);
      res.json(result);
    } catch (error) {
      handleError(res, error, 'module:disable');
    }
  });

  app.post('/actions/setup', async (req, res) => {
    try {
      const summary = runSetup();
      res.json({ status: 'completed', summary });
    } catch (error) {
      handleError(res, error, 'setup:failed');
    }
  });

  app.post('/actions/remove', async (req, res) => {
    try {
      const summary = setup.remove();
      logger.push('info', 'remove executed', summary);
      res.json({ status: 'completed', summary });
    } catch (error) {
      handleError(res, error, 'remove:failed');
    }
  });

  app.post('/actions/doctor', async (req, res) => {
    try {
      const { data } = config.loadConfig();
      const report = buildDoctorReport({
        configPath: config.getConfigPath(),
        configData: data || {}
      });
      logger.push('info', 'doctor executed', report);
      res.json(report);
    } catch (error) {
      handleError(res, error, 'doctor:failed');
    }
  });

  app.get('/logs', (req, res) => {
    const limit = Number(req.query.limit || 50);
    res.json({ logs: logger.list(limit) });
  });

  app.get('/shared-types', (req, res) => {
    res.sendFile(sharedTypesPath);
  });

  return app;
}

function buildState() {
  const configDir = config.getConfigPath();
  const loadResult = config.loadConfig({ logger: console });
  const configData = loadResult.data || config.createDefaultConfig();
  config.normaliseConfig(configData);

  const modules = assetRegistry.list().map((asset) => ({
    id: asset.id,
    description: asset.description,
    group: asset.group,
    enabled: config.isModuleEnabled(configData, asset.id, assetRegistry.list()),
    keywords: asset.keywords || [],
    version: asset.version,
    requires: asset.requires || [],
    health: buildModuleHealth(asset)
  }));

  const rcFiles = setup.constants.RC_FILES.map((filePath) => ({
    path: filePath,
    exists: fsExists(filePath)
  }));

  return {
    configPath: configDir,
    configValid: loadResult.valid,
    rcFiles,
    modules,
    logs: logger.list(20)
  };
}

function toggleModule(moduleId, enabled) {
  const manifest = assetRegistry.list();
  const asset = manifest.find((entry) => entry.id === moduleId);
  if (!asset) {
    const error = new Error(`模块 ${moduleId} 不存在`);
    error.code = 'module:not-found';
    throw error;
  }
  const { data } = config.loadConfig({ logger: console });
  const configData = data ? JSON.parse(JSON.stringify(data)) : config.createDefaultConfig(manifest);
  config.normaliseConfig(configData, { manifest });
  config.setModuleEnabled(configData, moduleId, enabled, manifest);
  config.saveConfig(configData);
  const summary = runSetup();
  logger.push('info', `${enabled ? 'enable' : 'disable'} ${moduleId}`, summary);
  return {
    status: enabled ? 'enabled' : 'disabled',
    moduleId,
    summary
  };
}

function runSetup() {
  const summary = setup.install({ logger: console });
  logger.push('info', 'setup executed', summary);
  return summary;
}

function buildModuleHealth(asset) {
  const health = {
    commandAvailable: true,
    warnings: []
  };
  if (asset.group === 'node') {
    if (!commandExists('pnpm')) {
      health.commandAvailable = false;
      health.warnings.push('未检测到 pnpm 命令');
    }
  }
  if (asset.group === 'containers') {
    if (!commandExists('docker')) {
      health.commandAvailable = false;
      health.warnings.push('未检测到 docker 命令');
    }
  }
  return health;
}

function commandExists(binary) {
  const which = process.platform === 'win32' ? 'where' : 'which';
  const { spawnSync } = require('child_process');
  const result = spawnSync(which, [binary], { stdio: 'ignore' });
  return result.status === 0;
}

function fsExists(filePath) {
  try {
    const fs = require('fs');
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function handleError(res, error, defaultCode) {
  const code = error.code || defaultCode;
  const message = error.message || '未知错误';
  logger.push('error', message, { code, stack: error.stack });
  const status = code && code.startsWith('module:') ? 404 : 500;
  res.status(status).json({ error: { code, message } });
}

if (require.main === module) {
  const app = createServer();
  app.listen(PORT, () => {
    logger.push('info', `cmdcc daemon listening on http://localhost:${PORT}`, {
      host: os.hostname(),
      port: PORT
    });
  });
}

module.exports = { createServer };
