import { mkdtempSync, statSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';

// Defense in depth against malicious .moca/.zip input: adm-zip 0.6 already
// guards against zip-slip, but a small archive can still decompress to an
// enormous payload (a "zip bomb"), so cap total size and entry count too.
export const MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024; // 512MB
export const MAX_ENTRIES = 20_000;

/**
 * Validates a Zip's entries against the size/entry-count/path-traversal
 * guards before anything is extracted. Shared by resolveTarget()'s internal
 * temp-dir extraction and the user-facing `extract` command, so the limits
 * are defined once. Limits are injectable (defaulting to the real
 * production limits above) so tests can exercise the entry-count/size
 * rejection paths with small fixtures instead of constructing an actual
 * 20,000-entry or 512MB archive.
 *
 * @param {import('adm-zip')} zip
 * @param {{ maxEntries?: number, maxUncompressedBytes?: number }} [limits]
 */
export function validateArchiveEntries(zip, { maxEntries = MAX_ENTRIES, maxUncompressedBytes = MAX_UNCOMPRESSED_BYTES } = {}) {
  const entries = zip.getEntries();

  if (entries.length > maxEntries) {
    throw new UsageError(
      `Archive has ${entries.length} entries, exceeding the ${maxEntries} limit; refusing to extract.`
    );
  }

  let totalSize = 0;
  for (const entry of entries) {
    totalSize += entry.header.size;
    if (totalSize > maxUncompressedBytes) {
      throw new UsageError(
        `Archive uncompressed size exceeds the ${maxUncompressedBytes} byte limit; refusing to extract (possible zip bomb).`
      );
    }
    if (entry.entryName.includes('..')) {
      throw new UsageError(`Archive entry "${entry.entryName}" contains "..": refusing to extract.`);
    }
  }
}

/**
 * Validates and extracts a .moca/.zip archive to `destDir` (which must
 * already exist). Used both by resolveTarget() (extracting to a throwaway
 * temp dir) and by the `extract` command (extracting to a user-chosen
 * destination).
 *
 * @param {string} archivePath
 * @param {string} destDir
 */
export function extractArchive(archivePath, destDir) {
  if (!existsSync(archivePath)) {
    throw new UsageError(`Archive does not exist: ${archivePath}`);
  }
  if (!(archivePath.endsWith('.moca') || archivePath.endsWith('.zip'))) {
    throw new UsageError(`Target must be a .moca/.zip archive: ${archivePath}`);
  }
  const zip = new AdmZip(archivePath);
  validateArchiveEntries(zip);
  zip.extractAllTo(destDir, true);
}

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
    extractArchive(targetPath, scratchDir);
    return {
      rootDir: scratchDir,
      cleanup: () => rmSync(scratchDir, { recursive: true, force: true }),
      isArchive: true,
    };
  }

  throw new UsageError(`Target must be a directory or a .moca/.zip archive: ${targetPath}`);
}

export class UsageError extends Error {}
