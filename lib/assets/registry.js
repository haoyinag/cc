'use strict';

const path = require('path');

const manifest = [
  {
    id: 'pnpm',
    file: 'pnpm-shortcuts.sh',
    group: 'node',
    description: 'PNPM shortcuts, PATH setup and completions.',
    defaultEnabled: true,
    keywords: ['pnpm', 'node', 'package']
  },
  {
    id: 'docker',
    file: 'docker-shortcuts.sh',
    group: 'containers',
    description: 'Docker Compose project discovery helpers and aliases.',
    defaultEnabled: true,
    keywords: ['docker', 'compose', 'containers']
  }
];

function list() {
  return manifest.slice();
}

function getById(id, entries = manifest) {
  return entries.find((entry) => entry.id === id);
}

function files(manifestEntries = manifest) {
  return manifestEntries.map((entry) => entry.file);
}

function getDefaultEnabled(manifestEntries = manifest) {
  return manifestEntries
    .filter((entry) => entry.defaultEnabled !== false)
    .map((entry) => entry.id);
}

function resolveInstallPlan({
  manifestEntries = manifest,
  enabledAssets,
  packageRoot,
  configDir
}) {
  if (!Array.isArray(enabledAssets) || enabledAssets.length === 0) {
    return [];
  }

  const resolved = [];
  const seen = new Set();
  for (const asset of enabledAssets) {
    const definition = typeof asset === 'string' ? getById(asset, manifestEntries) : asset;
    if (!definition || seen.has(definition.id)) {
      continue;
    }
    seen.add(definition.id);
    resolved.push({
      asset: definition,
      source: packageRoot ? path.join(packageRoot, definition.file) : definition.file,
      target: configDir ? path.join(configDir, definition.file) : definition.file
    });
  }
  return resolved;
}

module.exports = {
  list,
  getById,
  files,
  getDefaultEnabled,
  resolveInstallPlan
};
