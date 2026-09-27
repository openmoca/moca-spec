// @openmoca/moca-lint: lint, pack and extract MOCA packages. All checking is
// done by the reference Reader in @openmoca/moca-core, so a lint result is
// exactly what a conformant Reader concludes about the package.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import AdmZip from 'adm-zip';
import { readPackage, bindSidecar, directoryResolver, openSource, TargetError } from '@openmoca/moca-core';

export class UsageError extends Error {}

/**
 * @param {object} p
 * @param {string} p.target  directory or .moca archive
 * @param {string} [p.trustRoot]  trust-root file
 * @param {string[]} [p.memberDirs]  where to look for members
 * @param {string} [p.sidecar]  sidecar directory or .zip to check against the package
 * @param {boolean} [p.strict]
 */
export async function lintPackage({ target, trustRoot, memberDirs, sidecar, strict = false }) {
  const resolveMember = memberDirs?.length ? directoryResolver(memberDirs) : undefined;
  const result = await readPackage(target, { trustRoot, resolveMember, strict });
  const diagnostics = [...result.diagnostics];
  if (sidecar && result.valid) {
    const bound = bindSidecar(sidecar, result, { strict });
    diagnostics.push(...bound.diagnostics);
  }
  return { result, diagnostics, ok: !diagnostics.some((d) => d.severity === 'error') };
}

/**
 * Lints, then writes a .moca archive of the package's regular files. Refuses
 * to write anything when lint reports an error.
 */
export async function packPackage({ dir, out, trustRoot, memberDirs, strict = false }) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new UsageError(`not a package directory: ${dir}`);
  const lint = await lintPackage({ target: dir, trustRoot, memberDirs, strict });
  if (!lint.ok) return { written: false, ...lint };
  const source = lint.result.source;
  const zip = new AdmZip();
  for (const entry of source.list()) {
    // Regular files only; hidden entries are never listed by a source.
    zip.addFile(entry.path, source.read(entry.path));
  }
  mkdirSync(dirname(out) || '.', { recursive: true });
  zip.writeZip(out);
  return { written: true, ...lint };
}

/** Safely extracts a .moca archive: the same checks a Reader applies. */
export function extractArchive({ archive, out }) {
  let source;
  try {
    source = openSource(archive);
  } catch (err) {
    if (err instanceof TargetError) throw new UsageError(err.message);
    throw err;
  }
  if (source.kind !== 'archive') throw new UsageError(`not a .moca/.zip archive: ${archive}`);
  const entries = source.list();
  const unsafe = entries.find((e) => e.kind !== 'file');
  if (unsafe) throw new UsageError(`archive entry "${unsafe.path}" is not a regular file; refusing to extract`);
  for (const e of entries) {
    const dest = join(out, ...e.path.split('/'));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, source.read(e.path));
  }
  return entries.length;
}
