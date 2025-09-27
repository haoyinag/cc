'use strict';

const modules = [
  require('./setup'),
  require('./remove'),
  require('./status'),
  require('./list'),
  require('./enable'),
  require('./disable'),
  require('./daemon'),
  require('./help')
];

const registry = new Map();
const canonical = [];

for (const mod of modules) {
  registerCommand(mod);
}

function registerCommand(command) {
  if (!command || !command.name) {
    throw new Error('Invalid command module: missing name');
  }
  if (registry.has(command.name)) {
    throw new Error(`Duplicate command name detected: ${command.name}`);
  }
  canonical.push(command);
  registry.set(command.name, command);
  if (Array.isArray(command.aliases)) {
    for (const alias of command.aliases) {
      if (!alias) {
        continue;
      }
      if (registry.has(alias)) {
        throw new Error(`Duplicate command alias detected: ${alias}`);
      }
      registry.set(alias, command);
    }
  }
}

function resolve(name) {
  if (!name) {
    return registry.get('setup');
  }
  return registry.get(name);
}

function list() {
  return canonical.slice();
}

function names() {
  return canonical.map((command) => command.name);
}

function suggest(name) {
  const lower = (name || '').toLowerCase();
  const candidates = names();
  if (!lower) {
    return candidates.slice(0, 3);
  }
  const directMatches = candidates.filter((commandName) => commandName.startsWith(lower));
  if (directMatches.length) {
    return directMatches.slice(0, 3);
  }
  const initial = lower.charAt(0);
  const initials = candidates.filter((commandName) => commandName.startsWith(initial));
  return initials.slice(0, 3);
}

module.exports = {
  resolve,
  list,
  names,
  suggest
};
