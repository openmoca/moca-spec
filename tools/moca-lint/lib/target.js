import { mkdtempSync, statSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';

// Defense in depth against malicious .moca/.zip input: adm-zip 0.6 already
// guards against zip-slip, but a small archive can still decompress to an
// enormous payload (a "zip bomb"), so cap total size and entry count too.
const MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024; // 512MB
const MAX_ENTRIES = 20_000;

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
    const zip = new AdmZip(targetPath);
    const entries = zip.getEntries();

    if (entries.length > MAX_ENTRIES) {
      throw new UsageError(
        `Archive has ${entries.length} entries, exceeding the ${MAX_ENTRIES} limit; refusing to extract.`
      );
    }

    let totalSize = 0;
    for (const entry of entries) {
      totalSize += entry.header.size;
      if (totalSize > MAX_UNCOMPRESSED_BYTES) {
        throw new UsageError(
          `Archive uncompressed size exceeds the ${MAX_UNCOMPRESSED_BYTES} byte limit; refusing to extract (possible zip bomb).`
        );
      }
      if (entry.entryName.includes('..')) {
        throw new UsageError(`Archive entry "${entry.entryName}" contains "..": refusing to extract.`);
      }
    }

    const scratchDir = mkdtempSync(join(tmpdir(), 'moca-lint-'));
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
