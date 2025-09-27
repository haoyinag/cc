#!/usr/bin/env node
'use strict';

const commands = require('../lib/commands');
const constants = require('../lib/constants');
const assetRegistry = require('../lib/assets/registry');
const config = require('../lib/config');
const setup = require('../lib/setup');
const { CliError, isCliError } = require('../lib/errors');

async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    await runCommand('setup', []);
    return;
  }

  const rawCommand = rawArgs[0];
  if (rawCommand === '--help' || rawCommand === '-h') {
    await runCommand('help', rawArgs.slice(1));
    return;
  }

  if (rawCommand === '--version' || rawCommand === '-v') {
    const pkg = require('../package.json');
    console.log(pkg.version);
    return;
  }

  const normalized = normalizeCommand(rawCommand);
  const args = rawArgs.slice(1);
  await runCommand(normalized, args, rawCommand);
}

async function runCommand(commandName, args, rawInput) {
  const command = commands.resolve(commandName);
  if (!command) {
    handleUnknown(rawInput || commandName);
    return;
  }

  const context = {
    args,
    rawArgs: [commandName, ...args],
    logger: console,
    stdout: process.stdout,
    stderr: process.stderr,
    config,
    setup,
    assetRegistry,
    constants,
    manifest: assetRegistry.list(),
    configDir: constants.CONFIG_DIR,
    commands
  };

  try {
    await Promise.resolve(command.handler(context));
  } catch (error) {
    handleError(error);
  }
}

function normalizeCommand(value) {
  if (!value) {
    return 'setup';
  }
  const key = value.toLowerCase();
  if (key === 'rm') {
    return 'remove';
  }
  return key;
}

function handleUnknown(name) {
  const display = name || '<empty>';
  console.error(`[cmdcc] 未知命令: ${display}`);
  const suggestions = commands.suggest(name);
  if (suggestions.length) {
    console.error(`[cmdcc] 试试: ${suggestions.join(', ')}`);
  }
  process.exit(1);
}

function handleError(error) {
  if (isCliError(error)) {
    console.error(`[cmdcc] ${error.message}`);
    process.exit(error.exitCode);
  }
  console.error(`[cmdcc] 命令执行失败: ${error.message}`);
  if (process.env.CMDCC_DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}

main().catch((error) => {
  handleError(error);
});
