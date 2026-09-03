import { isAbsolute, relative, resolve } from 'node:path';
import { realpathSync } from 'node:fs';

/**
 * Resolves a package-relative resource while keeping the result inside rootDir.
 * Returns null for non-path values, absolute paths, traversal, or symlink escapes.
 */
export function resolvePackagePath(rootDir, resourcePath, allowedDirectories = []) {
  if (typeof resourcePath !== 'string' || resourcePath.length === 0 || resourcePath.includes('\0')) {
    return null;
  }

  const normalized = resourcePath.replaceAll('\\', '/');
  if (isAbsolute(normalized) || /^[A-Za-z]:\//.test(normalized)) return null;

  const resolvedRoot = resolve(rootDir);
  const candidate = resolve(resolvedRoot, normalized);
  const relativeCandidate = relative(resolvedRoot, candidate);
  if (relativeCandidate === '..' || relativeCandidate.startsWith(`..${resolve('/', '..')}`)) return null;

  const relativePath = relativeCandidate.split('\\').join('/');
  if (allowedDirectories.length > 0 && !allowedDirectories.some((directory) =>
    relativePath === directory || relativePath.startsWith(`${directory}/`)
  )) return null;

  try {
    const realRoot = realpathSync(resolvedRoot);
    const realCandidate = realpathSync(candidate);
    const realRelative = relative(realRoot, realCandidate);
    if (realRelative === '..' || realRelative.startsWith(`..${resolve('/', '..')}`)) return null;
  } catch {
    // Missing resources are handled by the caller; containment is checked lexically above.
  }

  return candidate;
}