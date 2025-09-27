'use strict';

const os = require('os');
const path = require('path');

const PACKAGE_ROOT = path.join(__dirname, '..');
const CONFIG_DIR = path.join(os.homedir(), '.config', 'cmdcc');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const LEGACY_CONFIG_DIRS = [
  path.join(os.homedir(), '.config', 'cmdsc'),
  path.join(os.homedir(), '.config', 'dcc'),
  path.join(os.homedir(), '.config', 'cmsc')
];
const RC_FILES = Array.from(
  new Set([
    path.join(os.homedir(), '.zshrc'),
    path.join(os.homedir(), '.bashrc'),
    path.join(os.homedir(), '.bash_profile')
  ])
);
const MARKER_START = '# >>> cmdcc shortcuts start >>>';
const MARKER_END = '# <<< cmdcc shortcuts end <<<';
const LEGACY_MARKERS = [
  { start: '# >>> cmdsc shortcuts start >>>', end: '# <<< cmdsc shortcuts end <<<' },
  { start: '# >>> cmsc shortcuts start >>>', end: '# <<< cmsc shortcuts end <<<' },
  { start: '# >>> dcc shortcuts start >>>', end: '# <<< dcc shortcuts end <<<' }
];

module.exports = {
  PACKAGE_ROOT,
  CONFIG_DIR,
  CONFIG_FILE,
  LEGACY_CONFIG_DIRS,
  RC_FILES,
  MARKER_START,
  MARKER_END,
  LEGACY_MARKERS
};
