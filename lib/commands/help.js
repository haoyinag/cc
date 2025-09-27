'use strict';

const { CliError } = require('../errors');

module.exports = {
  name: 'help',
  description: '显示此帮助或命令详情',
  usage: 'cc help [command]',
  handler(ctx) {
    const query = (ctx.args[0] || '').toLowerCase();
    if (!query) {
      renderGeneralHelp(ctx);
      return;
    }

    const command = ctx.commands.resolve(query);
    if (!command) {
      throw new CliError(`未知命令: ${query}`, { exitCode: 1 });
    }

    renderCommandHelp(ctx, command);
  }
};

function renderGeneralHelp(ctx) {
  ctx.logger.log('用法: cc <command> [options]');
  ctx.logger.log('可用命令:');
  for (const command of ctx.commands.list()) {
    const aliasText = Array.isArray(command.aliases) && command.aliases.length
      ? ` (别名: ${command.aliases.join(', ')})`
      : '';
    ctx.logger.log(`  ${command.name.padEnd(10)} ${command.description}${aliasText}`);
  }
  ctx.logger.log('\n更多信息: cc help <command>');
}

function renderCommandHelp(ctx, command) {
  ctx.logger.log(`命令: ${command.name}`);
  ctx.logger.log(`描述: ${command.description}`);
  if (command.usage) {
    ctx.logger.log(`用法: ${command.usage}`);
  }
  if (Array.isArray(command.aliases) && command.aliases.length) {
    ctx.logger.log(`别名: ${command.aliases.join(', ')}`);
  }
}
