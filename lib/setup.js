'use strict';

const fs = require('fs');
const path = require('path');

const constants = require('./constants');
const assetRegistry = require('./assets/registry');
const config = require('./config');

const DEFAULT_MANIFEST = assetRegistry.list();
const DEFAULT_ASSET_FILES = assetRegistry.files(DEFAULT_MANIFEST);

function install(options = {}) {
  const {
    packageRoot = constants.PACKAGE_ROOT,
    logger = console,
    configDir = constants.CONFIG_DIR,
    rcFiles = constants.RC_FILES,
    manifest = DEFAULT_MANIFEST
  } = options;

  const summary = { copied: [], skipped: [], pruned: [], rcUpdated: [], assets: [] };

  ensureDir(configDir, logger);

  const loadResult = config.loadConfig({ configDir, logger });
  let effectiveConfig = loadResult.data;

  if (!loadResult.valid) {
    logger.warn('[cmdcc] 当前配置无法解析，已使用默认配置继续执行。');
    effectiveConfig = config.createDefaultConfig(manifest);
  }

  if (!effectiveConfig) {
    effectiveConfig = config.createDefaultConfig(manifest);
    config.saveConfig(effectiveConfig, { configDir });
  }

  const resolvedRcFiles = config.resolveRcFiles({ config: effectiveConfig, defaultRcFiles: rcFiles });
  const enabledAssets = config.resolveEnabledAssets({ manifest, config: effectiveConfig, logger });

  const plan = assetRegistry.resolveInstallPlan({
    manifestEntries: manifest,
    enabledAssets,
    packageRoot,
    configDir
  });

  if (plan.length === 0 && manifest.length > 0) {
    logger.warn('[cmdcc] No assets scheduled for installation; check your config.');
  }

  const knownFiles = new Set(assetRegistry.files(manifest));
  const plannedFiles = new Set(plan.map((item) => path.basename(item.target)));
  for (const entry of safeListDir(configDir)) {
    if (!knownFiles.has(entry) || plannedFiles.has(entry)) {
      continue;
    }
    const targetPath = path.join(configDir, entry);
    try {
      fs.unlinkSync(targetPath);
      summary.pruned.push(targetPath);
    } catch (error) {
      logger.warn(`[cmdcc] Failed to remove obsolete asset ${targetPath}: ${error.message}`);
    }
  }

  for (const entry of plan) {
    try {
      fs.copyFileSync(entry.source, entry.target);
      fs.chmodSync(entry.target, 0o644);
      summary.copied.push(entry.target);
      summary.assets.push(entry.asset.id);
    } catch (error) {
      logger.warn(`[cmdcc] Failed to copy ${entry.asset.file}: ${error.message}`);
      summary.skipped.push(entry.asset.file);
    }
  }

  cleanupLegacyConfigDirs(logger, { knownFiles: assetRegistry.files(manifest) });

  const rcBlock = buildRcBlock(configDir);
  for (const rcPath of resolvedRcFiles) {
    const status = ensureRcBlock(rcPath, { logger, rcBlock });
    if (status === 'updated' || status === 'skipped') {
      summary.rcUpdated.push({ rcPath, status });
    }
  }

  return summary;
}

function remove(options = {}) {
  const {
    logger = console,
    configDir = constants.CONFIG_DIR,
    rcFiles = constants.RC_FILES,
    manifest = DEFAULT_MANIFEST
  } = options;

  const summary = { removed: [], rcUpdated: [] };

  if (fs.existsSync(configDir)) {
    for (const entry of safeListDir(configDir)) {
      const target = path.join(configDir, entry);
      try {
        fs.unlinkSync(target);
        summary.removed.push(target);
      } catch (error) {
        logger.warn(`[cmdcc] Failed to remove ${target}: ${error.message}`);
      }
    }
  }

  const loadResult = config.loadConfig({ configDir, logger });
  const resolvedRcFiles = config.resolveRcFiles({ config: loadResult.data, defaultRcFiles: rcFiles });

  for (const rcPath of resolvedRcFiles) {
    const status = removeRcBlock(rcPath, logger);
    if (status !== 'absent') {
      summary.rcUpdated.push({ rcPath, status });
    }
  }

  cleanupConfigDirs(logger, { configDir, knownFiles: assetRegistry.files(manifest) });

  return summary;
}

function ensureDir(dirPath, logger) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    logger.warn(`[cmdcc] Failed to create ${dirPath}: ${error.message}`);
  }
}

function ensureRcBlock(rcPath, { logger = console, rcBlock = buildRcBlock() } = {}) {
  try {
    const exists = fs.existsSync(rcPath);
    let content = exists ? fs.readFileSync(rcPath, 'utf8') : '';
    let mutated = false;

    for (const marker of constants.LEGACY_MARKERS) {
      const stripped = stripBlock(content, marker.start, marker.end);
      if (stripped !== content) {
        content = stripped;
        mutated = true;
      }
    }

    if (content.includes(constants.MARKER_START)) {
      if (mutated) {
        fs.writeFileSync(rcPath, normaliseTrailingNewline(content), 'utf8');
        return 'updated';
      }
      return 'skipped';
    }

    const prefix = content.trimEnd();
    const next = prefix ? `${prefix}\n\n${rcBlock}\n` : `${rcBlock}\n`;
    fs.writeFileSync(rcPath, next, 'utf8');
    return 'updated';
  } catch (error) {
    logger.warn(`[cmdcc] Failed to update ${rcPath}: ${error.message}`);
    return 'failed';
  }
}

function removeRcBlock(rcPath, logger) {
  if (!fs.existsSync(rcPath)) {
    return 'absent';
  }
  try {
    const content = fs.readFileSync(rcPath, 'utf8');
    let stripped = stripBlock(content, constants.MARKER_START, constants.MARKER_END);
    for (const marker of constants.LEGACY_MARKERS) {
      stripped = stripBlock(stripped, marker.start, marker.end);
    }
    if (stripped === content) {
      return 'skipped';
    }
    fs.writeFileSync(rcPath, normaliseTrailingNewline(stripped), 'utf8');
    return 'removed';
  } catch (error) {
    logger.warn(`[cmdcc] Failed to clean ${rcPath}: ${error.message}`);
    return 'failed';
  }
}

function cleanupConfigDirs(logger, { configDir = constants.CONFIG_DIR, knownFiles = DEFAULT_ASSET_FILES } = {}) {
  cleanupDir(configDir, logger, { knownFiles });
  for (const legacyDir of constants.LEGACY_CONFIG_DIRS) {
    cleanupDir(legacyDir, logger, { strictKnown: true, knownFiles });
  }
}

function cleanupLegacyConfigDirs(logger, { knownFiles = DEFAULT_ASSET_FILES } = {}) {
  for (const legacyDir of constants.LEGACY_CONFIG_DIRS) {
    cleanupDir(legacyDir, logger, { strictKnown: true, knownFiles });
  }
}

function stripBlock(content, startMarker, endMarker) {
  if (!content.includes(startMarker)) {
    return content;
  }
  const blockRegex = new RegExp(`\n*${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\n*`, 'g');
  return content.replace(blockRegex, '\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

function cleanupDir(dirPath, logger, options = {}) {
  const { strictKnown = false, knownFiles = DEFAULT_ASSET_FILES } = options;
  try {
    if (!fs.existsSync(dirPath)) {
      return;
    }
    const entries = safeListDir(dirPath).filter((entry) => entry !== '.DS_Store');
    if (entries.length === 0) {
      fs.rmdirSync(dirPath);
      return;
    }
    if (!strictKnown) {
      return;
    }
    const unknown = entries.filter((entry) => !knownFiles.includes(entry));
    if (unknown.length > 0) {
      return;
    }
    for (const entry of entries) {
      try {
        fs.unlinkSync(path.join(dirPath, entry));
      } catch (error) {
        logger.warn(`[cmdcc] Failed to remove ${path.join(dirPath, entry)}: ${error.message}`);
      }
    }
    fs.rmdirSync(dirPath);
  } catch (error) {
    logger.warn(`[cmdcc] Failed to tidy ${dirPath}: ${error.message}`);
  }
}

function safeListDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    return [];
  }
}

function discoverScripts(rootDir) {
  try {
    return fs
      .readdirSync(rootDir)
      .filter((entry) => entry.endsWith('.sh'))
      .filter((entry) => fs.statSync(path.join(rootDir, entry)).isFile());
  } catch (error) {
    return [];
  }
}

function normaliseTrailingNewline(content) {
  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n` : '';
}

function buildRcBlock(configDir = constants.CONFIG_DIR) {
  const dir = configDir === constants.CONFIG_DIR ? '$HOME/.config/cmdcc' : configDir;
  return [
    constants.MARKER_START,
    `if [ -d "${dir}" ]; then`,
    `  for __cmdcc_file in "${dir}/"*.sh; do`,
    '    [ -f "$__cmdcc_file" ] && . "$__cmdcc_file"',
    '  done',
    '  unset __cmdcc_file',
    'fi',
    constants.MARKER_END
  ].join('\n');
}

module.exports = {
  install,
  remove,
  constants: {
    CONFIG_DIR: constants.CONFIG_DIR,
    LEGACY_CONFIG_DIRS: constants.LEGACY_CONFIG_DIRS,
    RC_FILES: constants.RC_FILES,
    MARKER_START: constants.MARKER_START,
    MARKER_END: constants.MARKER_END,
    LEGACY_MARKERS: constants.LEGACY_MARKERS,
    RC_BLOCK: buildRcBlock(),
    ASSET_FILES: DEFAULT_ASSET_FILES
  },
  utils: {
    discoverScripts,
    buildRcBlock
  }
};
