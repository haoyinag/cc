'use strict';

class CliError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'CliError';
    this.exitCode = Number.isInteger(options.exitCode) ? options.exitCode : 1;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

function isCliError(error) {
  return error instanceof CliError;
}

module.exports = {
  CliError,
  isCliError
};
