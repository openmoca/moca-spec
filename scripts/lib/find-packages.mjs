// Shared package discovery for the repository's validation scripts.
//
// Previously each script rolled its own, and two of them combined a
// single-level readdir over examples/ with a hardcoded tail list of nested
// paths. That silently stopped covering any example added below the first
// level -- which is exactly what happened when examples/use-cases/ was added.
// Recursive discovery keyed on the presence of moca.json removes the class.
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const IGNORED = new Set(['node_modules', '.git']);

/**
 * Finds every MOCA package root beneath `dir`. A directory containing
 * moca.json is a package root and is not descended into further.
 *
 * @param {string} dir
 * @param {string[]} [found]
 * @returns {string[]} absolute package-root paths
 */
export function findPackages(dir, found = []) {
  if (!existsSync(dir)) return found;
  if (existsSync(join(dir, 'moca.json'))) {
    found.push(dir);
    return found;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !IGNORED.has(entry.name)) {
      findPackages(join(dir, entry.name), found);
    }
  }
  return found;
}

/**
 * Every example/profile package in the repository, as repo-relative POSIX
 * paths, sorted for deterministic output.
 *
 * @param {string} root
 * @returns {string[]}
 */
export function findAllExamplePackages(root) {
  return ['examples', 'profiles']
    .flatMap((searchRoot) => findPackages(join(root, searchRoot)))
    .map((abs) => relative(root, abs).split('\\').join('/'))
    .sort();
}
