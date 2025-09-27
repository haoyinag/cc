'use strict';

const path = require('path');
const { spawn } = require('child_process');

module.exports = {
  name: 'daemon',
  description: '启动 cmdcc 后台服务，为 Web UI 提供 API',
  usage: 'cc daemon [--port <port>]',
  handler(ctx) {
    const args = ctx.args;
    let port = process.env.CMDCC_PORT || '3777';
    const portIndex = args.findIndex((value) => value === '--port');
    if (portIndex !== -1 && args[portIndex + 1]) {
      port = args[portIndex + 1];
    }

    const serverPath = path.join(__dirname, '..', '..', 'packages', 'daemon', 'src', 'server.js');
    const child = spawn(process.execPath, [serverPath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        CMDCC_PORT: String(port)
      }
    });

    child.on('exit', (code) => {
      ctx.logger.log(`[cmdcc] daemon 退出，代码 ${code ?? 0}`);
    });
  }
};
