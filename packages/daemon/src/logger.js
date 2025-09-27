'use strict';

const MAX_LOGS = 200;

class LogStore {
  constructor() {
    this.entries = [];
  }

  push(level, message, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_LOGS) {
      this.entries.shift();
    }
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    // eslint-disable-next-line no-console
    console[consoleMethod](`[cmdcc][${entry.timestamp}] ${level.toUpperCase()}: ${message}`);
    return entry;
  }

  list(limit = 50) {
    return this.entries.slice(-limit).reverse();
  }
}

module.exports = new LogStore();
