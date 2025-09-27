'use strict';

const assert = require('assert');

const registry = [];

function test(name, fn) {
  registry.push({ name, fn });
}

async function run() {
  const total = registry.length;
  let failures = 0;
  for (const { name, fn } of registry) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`[FAIL] ${name}`);
      console.error(`  ${error.message}`);
      if (process.env.CMDCC_DEBUG) {
        console.error(error.stack);
      }
    }
  }

  if (failures > 0) {
    console.error(`[DONE] ${total - failures}/${total} tests passed`);
    const error = new Error(`Test run failed with ${failures} error(s)`);
    error.exitCode = 1;
    throw error;
  }

  console.log(`[DONE] ${total}/${total} tests passed`);
}

module.exports = {
  test,
  run,
  assert
};
