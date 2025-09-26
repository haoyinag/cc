'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PACKAGE_ROOT = path.join(__dirname, '..');
const CONFIG_DIR = path.join(os.homedir(), '.config', 'cmdsc');
const LEGACY_CONFIG_DIRS = [
  path.join(os.homedir(), '.config', 'dcc'),
  path.join(os.homedir(), '.config', 'cmsc')
];
const RC_FILES = Array.from(
  new Set([
    path.join(os.homedir(), '.zshrc'),
    path.join(os.homedir(), '.bashrc'),
    path.join(os.homedir(), '.bash_profile')
  ])
);
const MARKER_START = '# >>> cmdsc shortcuts start >>>';
const MARKER_END = '# <<< cmdsc shortcuts end <<<';
const LEGACY_MARKERS = [
  { start: '# >>> cmsc shortcuts start >>>', end: '# <<< cmsc shortcuts end <<<' },
  { start: '# >>> dcc shortcuts start >>>', end: '# <<< dcc shortcuts end <<<' }
];
const RC_BLOCK = `${MARKER_START}
if [ -d "$HOME/.config/cmdsc" ]; then
  for __cmdsc_file in "$HOME/.config/cmdsc/"*.sh; do
    [ -f "$__cmdsc_file" ] && . "$__cmdsc_file"
  done
  unset __cmdsc_file
fi
${MARKER_END}`;

const ASSET_FILES = discoverScripts(PACKAGE_ROOT);

function install({ packageRoot = PACKAGE_ROOT, logger = console } = {}) {
  const summary = { copied: [], rcUpdated: [] };
  ensureDir(CONFIG_DIR, logger);

  const scripts = discoverScripts(packageRoot);
  for (const file of scripts) {
    const source = path.join(packageRoot, file);
    const target = path.join(CONFIG_DIR, file);
    try {
      fs.copyFileSync(source, target);
      fs.chmodSync(target, 0o644);
      summary.copied.push(target);
    } catch (error) {
      logger.warn(`[cmdsc] Failed to copy ${file}: ${error.message}`);
    }
  }

  cleanupLegacyConfigDirs(logger);

  for (const rcPath of RC_FILES) {
    const status = ensureRcBlock(rcPath, logger);
    if (status === 'updated' || status === 'skipped') {
      summary.rcUpdated.push({ rcPath, status });
    }
  }

  return summary;
}

function remove({ logger = console } = {}) {
  const summary = { removed: [], rcUpdated: [] };

  if (fs.existsSync(CONFIG_DIR)) {
    for (const entry of safeListDir(CONFIG_DIR)) {
      const target = path.join(CONFIG_DIR, entry);
      try {
        fs.unlinkSync(target);
        summary.removed.push(target);
      } catch (error) {
        logger.warn(`[cmdsc] Failed to remove ${target}: ${error.message}`);
      }
    }
  }

  for (const rcPath of RC_FILES) {
    const status = removeRcBlock(rcPath, logger);
    if (status !== 'absent') {
      summary.rcUpdated.push({ rcPath, status });
    }
  }

  cleanupConfigDirs(logger);

  return summary;
}

function ensureDir(dirPath, logger) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    logger.warn(`[cmdsc] Failed to create ${dirPath}: ${error.message}`);
  }
}

function ensureRcBlock(rcPath, logger) {
  try {
    const exists = fs.existsSync(rcPath);
    let content = exists ? fs.readFileSync(rcPath, 'utf8') : '';
    let mutated = false;

    for (const marker of LEGACY_MARKERS) {
      const stripped = stripBlock(content, marker.start, marker.end);
      if (stripped !== content) {
        content = stripped;
        mutated = true;
      }
    }

    if (content.includes(MARKER_START)) {
      if (mutated) {
        fs.writeFileSync(rcPath, normaliseTrailingNewline(content), 'utf8');
        return 'updated';
      }
      return 'skipped';
    }

    const prefix = content.trimEnd();
    const next = prefix ? `${prefix}\n\n${RC_BLOCK}\n` : `${RC_BLOCK}\n`;
    fs.writeFileSync(rcPath, next, 'utf8');
    return 'updated';
  } catch (error) {
    logger.warn(`[cmdsc] Failed to update ${rcPath}: ${error.message}`);
    return 'failed';
  }
}

function removeRcBlock(rcPath, logger) {
  if (!fs.existsSync(rcPath)) {
    return 'absent';
  }
  try {
    const content = fs.readFileSync(rcPath, 'utf8');
    let stripped = stripBlock(content, MARKER_START, MARKER_END);
    for (const marker of LEGACY_MARKERS) {
      stripped = stripBlock(stripped, marker.start, marker.end);
    }
    if (stripped === content) {
      return 'skipped';
    }
    fs.writeFileSync(rcPath, normaliseTrailingNewline(stripped), 'utf8');
    return 'removed';
  } catch (error) {
    logger.warn(`[cmdsc] Failed to clean ${rcPath}: ${error.message}`);
    return 'failed';
  }
}

function cleanupConfigDirs(logger) {
  cleanupDir(CONFIG_DIR, logger);
  for (const legacyDir of LEGACY_CONFIG_DIRS) {
    cleanupDir(legacyDir, logger, { strictKnown: true });
  }
}

function cleanupLegacyConfigDirs(logger) {
  for (const legacyDir of LEGACY_CONFIG_DIRS) {
    cleanupDir(legacyDir, logger, { strictKnown: true });
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
  const { strictKnown = false } = options;
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
    const unknown = entries.filter((entry) => !ASSET_FILES.includes(entry));
    if (unknown.length > 0) {
      return;
    }
    for (const entry of entries) {
      try {
        fs.unlinkSync(path.join(dirPath, entry));
      } catch (error) {
        logger.warn(`[cmdsc] Failed to remove ${path.join(dirPath, entry)}: ${error.message}`);
      }
    }
    fs.rmdirSync(dirPath);
  } catch (error) {
    logger.warn(`[cmdsc] Failed to tidy ${dirPath}: ${error.message}`);
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

module.exports = {
  install,
  remove,
  constants: {
    CONFIG_DIR,
    LEGACY_CONFIG_DIRS,
    RC_FILES,
    MARKER_START,
    MARKER_END,
    LEGACY_MARKERS,
    RC_BLOCK,
    ASSET_FILES
  },
  utils: {
    discoverScripts
  }
};
