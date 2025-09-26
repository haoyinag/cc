'use strict';

const setup = require('../lib/setup');

try {
  const summary = setup.install({ logger: console });
  const copied = summary.copied.length ? `copied ${summary.copied.length} file(s)` : 'no files copied';
  const patched = summary.rcUpdated.filter((entry) => entry.status === 'updated').length;
  const skipped = summary.rcUpdated.filter((entry) => entry.status === 'skipped').length;
  console.log(`[cmdcc] Postinstall complete: ${copied}, ${patched} shell file(s) updated, ${skipped} skipped.`);
  console.log('[cmdcc] Restart your terminal or run "exec $SHELL" to activate the shortcuts.');
} catch (error) {
  console.warn(`[cmdcc] Postinstall failed: ${error.message}`);
}
