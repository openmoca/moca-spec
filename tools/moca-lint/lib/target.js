import { mkdtempSync, statSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';

/**
 * Resolves a lint/pack target (a directory, or a .moca/.zip archive) to a
 * plain directory on disk. Archives are extracted to a temp directory.
 *
 * @param {string} targetPath
 * @returns {{ rootDir: string, cleanup: () => void, isArchive: boolean }}
 */
export function resolveTarget(targetPath) {
  if (!existsSync(targetPath)) {
    throw new UsageError(`Target does not exist: ${targetPath}`);
  }

  const stats = statSync(targetPath);

  if (stats.isDirectory()) {
    return { rootDir: targetPath, cleanup: () => {}, isArchive: false };
  }

  if (stats.isFile() && (targetPath.endsWith('.moca') || targetPath.endsWith('.zip'))) {
    const scratchDir = mkdtempSync(join(tmpdir(), 'moca-lint-'));
    const zip = new AdmZip(targetPath);
    zip.extractAllTo(scratchDir, true);
    return {
      rootDir: scratchDir,
      cleanup: () => rmSync(scratchDir, { recursive: true, force: true }),
      isArchive: true,
    };
  }

  throw new UsageError(`Target must be a directory or a .moca/.zip archive: ${targetPath}`);
}

export class UsageError extends Error {}
