'use strict';

const setup = require('../lib/setup');

try {
  const summary = setup.remove({ logger: console });
  const removed = summary.removed.length ? `${summary.removed.length} shortcut file(s) removed` : 'no shortcut files removed';
  const cleaned = summary.rcUpdated.filter((entry) => entry.status === 'removed').length;
  console.log(`[cmdsc] Preuninstall cleanup: ${removed}, ${cleaned} shell file(s) cleaned.`);
} catch (error) {
  console.warn(`[cmdsc] Preuninstall failed: ${error.message}`);
}
