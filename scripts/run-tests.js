'use strict';

const fs = require('fs');
const path = require('path');

const harness = require('../test/harness');

async function main() {
  const testDir = path.join(__dirname, '..', 'test');
  const files = fs
    .readdirSync(testDir)
    .filter((file) => file.endsWith('.test.js'))
    .sort();

  for (const file of files) {
    require(path.join(testDir, file));
  }

  await harness.run();
}

main().catch((error) => {
  const exitCode = error && error.exitCode ? error.exitCode : 1;
  console.error(error.message || error);
  process.exit(exitCode);
});
