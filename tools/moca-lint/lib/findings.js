import { defaultSeverity, SEVERITY } from './codes.js';

/**
 * @typedef {object} Finding
 * @property {string} code
 * @property {'error'|'warning'|'info'} severity
 * @property {string} message
 * @property {string} [file] - path relative to the package root
 * @property {number} [line]
 */

export class FindingCollector {
  /** @param {{ strict?: boolean }} [options] */
  constructor({ strict = false } = {}) {
    this.strict = strict;
    /** @type {Finding[]} */
    this.findings = [];
  }

  /** @param {string} code @param {string} message @param {{file?: string, line?: number}} [location] */
  add(code, message, location = {}) {
    let severity = defaultSeverity(code);
    if (this.strict && severity === SEVERITY.WARNING) {
      severity = SEVERITY.ERROR;
    }
    this.findings.push({ code, severity, message, ...location });
  }

  get hasErrors() {
    return this.findings.some((f) => f.severity === SEVERITY.ERROR);
  }

  counts() {
    return this.findings.reduce(
      (acc, f) => {
        acc[f.severity] = (acc[f.severity] ?? 0) + 1;
        return acc;
      },
      { error: 0, warning: 0, info: 0 }
    );
  }
}
