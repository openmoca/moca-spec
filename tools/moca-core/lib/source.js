// Package sources: a uniform view of a package, whether it is a directory, a
// .moca Zip archive, or a host-supplied object. Every source lists its
// entries and returns the bytes of a listed file. See
// spec/moca-reader-contract.md §3.
//
// A source never follows a symbolic link and never hides one: symlinks and
// other non-regular files are listed with kind "symlink"/"other" so the
// digest and the reader can refuse them (spec/moca-package-spec.md §6).
// Entries whose name begins with "." are not part of a package and are
// skipped entirely, including their subtrees.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';

export const DEFAULT_LIMITS = Object.freeze({ maxEntries: 20_000, maxBytes: 512 * 1024 * 1024 });

/**
 * @typedef {object} SourceEntry
 * @property {string} path  package-relative POSIX path, as stored
 * @property {'file'|'symlink'|'other'|'unreadable'} kind
 * @property {number} [size]
 *
 * @typedef {object} PackageSource
 * @property {string} kind  'directory' | 'archive' | 'host'
 * @property {string} [location]
 * @property {() => SourceEntry[]} list
 * @property {(path: string) => Buffer} read
 */

export class TargetError extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Names that are never part of a package. */
export function isHiddenSegment(name) {
  return name.startsWith('.');
}

/**
 * @param {string} rootDir
 * @returns {PackageSource}
 */
export function directorySource(rootDir) {
  let cache;
  return {
    kind: 'directory',
    location: rootDir,
    list() {
      if (!cache) cache = walkDirectory(rootDir);
      return cache;
    },
    read(path) {
      return readFileSync(join(rootDir, ...path.split('/')));
    },
  };
}

function walkDirectory(rootDir) {
  /** @type {SourceEntry[]} */
  const out = [];
  const visit = (absDir, relDir) => {
    let names;
    try {
      names = readdirSync(absDir);
    } catch {
      out.push({ path: relDir || '.', kind: 'unreadable' });
      return;
    }
    for (const name of names.sort()) {
      if (isHiddenSegment(name)) continue;
      const abs = join(absDir, name);
      const rel = relDir ? `${relDir}/${name}` : name;
      let st;
      try {
        st = lstatSync(abs);
      } catch {
        out.push({ path: rel, kind: 'unreadable' });
        continue;
      }
      if (st.isSymbolicLink()) out.push({ path: rel, kind: 'symlink' });
      else if (st.isDirectory()) visit(abs, rel);
      else if (st.isFile()) out.push({ path: rel, kind: 'file', size: st.size });
      else out.push({ path: rel, kind: 'other' });
    }
  };
  visit(rootDir, '');
  return out;
}

/**
 * Opens a .moca/.zip archive in memory, without extracting it.
 *
 * @param {string|Buffer} archive  path or bytes
 * @param {{ maxEntries?: number, maxBytes?: number }} [limits]
 * @returns {PackageSource}
 */
export function archiveSource(archive, limits = {}) {
  const { maxEntries, maxBytes } = { ...DEFAULT_LIMITS, ...limits };
  let zip;
  try {
    zip = new AdmZip(archive);
  } catch (err) {
    throw new TargetError('T003_ARCHIVE_REJECTED', `archive could not be opened: ${err.message}`);
  }
  const entries = zip.getEntries();
  if (entries.length > maxEntries) {
    throw new TargetError('T003_ARCHIVE_REJECTED', `archive has ${entries.length} entries, over the ${maxEntries} limit`);
  }
  let total = 0;
  /** @type {SourceEntry[]} */
  const listed = [];
  const byPath = new Map();
  for (const entry of entries) {
    const name = entry.entryName;
    assertSafeArchivePath(name);
    total += entry.header.size;
    if (total > maxBytes) {
      throw new TargetError('T003_ARCHIVE_REJECTED', `archive expands beyond the ${maxBytes}-byte limit`);
    }
    if (entry.isDirectory) continue;
    const path = name.replace(/\/+$/, '');
    if (path.split('/').some(isHiddenSegment)) continue;
    const mode = (entry.header.attr >>> 16) & 0o170000;
    let kind = 'file';
    if (mode === 0o120000) kind = 'symlink';
    else if (mode !== 0 && mode !== 0o100000) kind = 'other';
    listed.push({ path, kind, size: entry.header.size });
    byPath.set(path, entry);
  }
  listed.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    kind: 'archive',
    location: typeof archive === 'string' ? archive : undefined,
    list: () => listed,
    read(path) {
      const entry = byPath.get(path);
      if (!entry) throw new Error(`no such entry: ${path}`);
      return entry.getData();
    },
  };
}

function assertSafeArchivePath(name) {
  if (name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name)) {
    throw new TargetError('T003_ARCHIVE_REJECTED', `archive entry "${name}" is absolute or uses backslashes`);
  }
  if (name.split('/').includes('..')) {
    throw new TargetError('T003_ARCHIVE_REJECTED', `archive entry "${name}" contains a ".." segment`);
  }
}

/**
 * Wraps a host-supplied source: `{ list(): string[] | SourceEntry[], read(path): Buffer|Uint8Array }`.
 *
 * @param {{ list: () => Array<string|SourceEntry>, read: (path: string) => Buffer|Uint8Array }} host
 * @param {{ maxEntries?: number, maxBytes?: number }} [limits]
 * @returns {PackageSource}
 */
export function hostSource(host, limits = {}) {
  const { maxEntries, maxBytes } = { ...DEFAULT_LIMITS, ...limits };
  let cache;
  return {
    kind: 'host',
    list() {
      if (cache) return cache;
      const raw = host.list().map((e) => (typeof e === 'string' ? { path: e, kind: 'file' } : e));
      if (raw.length > maxEntries) {
        throw new TargetError('T003_ARCHIVE_REJECTED', `source lists ${raw.length} entries, over the ${maxEntries} limit`);
      }
      let total = 0;
      for (const e of raw) {
        assertSafeArchivePath(e.path);
        total += e.size ?? 0;
        if (total > maxBytes) throw new TargetError('T003_ARCHIVE_REJECTED', `source exceeds the ${maxBytes}-byte limit`);
      }
      cache = raw
        .filter((e) => !e.path.split('/').some(isHiddenSegment))
        .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
      return cache;
    },
    read(path) {
      if (!cache?.some((e) => e.path === path)) throw new Error(`path was not listed: ${path}`);
      return Buffer.from(host.read(path));
    },
  };
}

/**
 * Resolves a target: a directory path, a .moca/.zip path, or a host source object.
 *
 * @param {string|object} target
 * @param {{ maxEntries?: number, maxBytes?: number }} [limits]
 * @returns {PackageSource}
 */
export function openSource(target, limits) {
  if (target && typeof target === 'object' && typeof target.list === 'function') {
    const alreadyWrapped = ['directory', 'archive', 'host'].includes(target.kind) && typeof target.read === 'function';
    return alreadyWrapped ? target : hostSource(target, limits);
  }
  if (typeof target !== 'string' || !existsSync(target)) {
    throw new TargetError('T001_TARGET_NOT_FOUND', `target does not exist: ${target}`);
  }
  const st = statSync(target);
  if (st.isDirectory()) return directorySource(target);
  if (st.isFile() && /\.(moca|zip)$/i.test(target)) return archiveSource(target, limits);
  throw new TargetError('T001_TARGET_NOT_FOUND', `target is neither a directory nor a .moca/.zip archive: ${target}`);
}
