import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { validateSidecar } from './validate.js';
import { UsageError } from './target.js';

export class BuildFailedError extends Error {
  /**
   * @param {string} message
   * @param {string[]} errors
   */
  constructor(message, errors) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Writes a sidecar draft to disk, gated on validateSidecar() reporting no
 * errors -- mirrors moca-convert's lib/write.js and moca-lint's pack.js:
 * build into a scratch dir first, self-validate, and only then place the
 * result at the real destination. Nothing invalid is ever left on disk.
 *
 * @param {object} params
 * @param {object} params.indexManifest
 * @param {object[]} params.payloadItems
 * @param {string} params.targetDir
 * @param {string} params.outPath - a directory (default) or, with `zip`, a file path
 * @param {boolean} [params.force]
 * @param {boolean} [params.zip]
 */
export function writeSidecar({ indexManifest, payloadItems, targetDir, outPath, force = false, zip = false }) {
  if (zip) {
    if (existsSync(outPath) && !force) {
      throw new UsageError(`Output file "${outPath}" already exists; pass --force to overwrite.`);
    }
  } else {
    const outDirNonEmpty = existsSync(outPath) && readdirSync(outPath).length > 0;
    if (outDirNonEmpty && !force) {
      throw new UsageError(`Output directory "${outPath}" already exists and is not empty; pass --force to overwrite.`);
    }
  }

  const stageDir = mkdtempSync(join(tmpdir(), 'moca-index-'));
  try {
    writeFileSync(join(stageDir, 'index.json'), `${JSON.stringify(indexManifest, null, 2)}\n`);
    mkdirSync(join(stageDir, 'payload'), { recursive: true });
    const jsonl = payloadItems.map((item) => JSON.stringify(item)).join('\n') + (payloadItems.length ? '\n' : '');
    writeFileSync(join(stageDir, 'payload', 'index.jsonl'), jsonl);

    const { valid, errors } = validateSidecar({ indexManifest, payloadItems, targetDir });
    if (!valid) {
      throw new BuildFailedError('The built sidecar failed its own validation; no output was written.', errors);
    }

    if (zip) {
      const archive = new AdmZip();
      archive.addLocalFolder(stageDir);
      archive.writeZip(outPath);
    } else {
      rmSync(outPath, { recursive: true, force: true });
      renameSync(stageDir, outPath);
    }
  } finally {
    // In the directory-output success path, stageDir was already moved to
    // outPath (renameSync consumes it); this is then a harmless no-op since
    // rmSync(..., { force: true }) tolerates a nonexistent path.
    rmSync(stageDir, { recursive: true, force: true });
  }
}
