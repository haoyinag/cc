'use strict';

const fs = require('fs');
const path = require('path');
const setup = require('../../lib/setup');

function checkConfig(configPath) {
  const backupPath = `${configPath}.bak`;
  const exists = fs.existsSync(configPath);
  const backupExists = fs.existsSync(backupPath);
  return {
    id: 'config-integrity',
    result: exists ? 'pass' : 'fail',
    details: exists ? (backupExists ? `检测到备份文件 ${path.basename(backupPath)}` : undefined) : '配置文件缺失'
  };
}

function checkRcFiles(configData) {
  const responses = [];
  const rcFiles = setup.constants.RC_FILES;
  for (const rc of rcFiles) {
    const hasFile = fs.existsSync(rc);
    const details = hasFile ? undefined : '文件缺失';
    responses.push({ path: rc, exists: hasFile, details });
  }
  const missing = responses.filter((item) => !item.exists);
  return {
    id: 'rc-files',
    result: missing.length ? 'warn' : 'pass',
    details: missing.length ? `缺失: ${missing.map((item) => item.path).join(', ')}` : undefined
  };
}

function buildDoctorReport({ configPath, configData }) {
  const checks = [
    checkConfig(configPath),
    checkRcFiles(configData)
  ];
  let status = 'ok';
  if (checks.some((check) => check.result === 'fail')) {
    status = 'fail';
  } else if (checks.some((check) => check.result === 'warn')) {
    status = 'warn';
  }
  return { status, checks };
}

module.exports = {
  buildDoctorReport
};
