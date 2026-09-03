// Implements `moca-lint pack`: lints first, then zips the package (fail-closed).
import AdmZip from 'adm-zip';
import { walkFiles } from './walk.js';
import { lintPackage } from './lint.js';

const DEFAULT_EXCLUDES = ['.git', '.git/**', 'node_modules', 'node_modules/**', '**/.DS_Store'];

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {string} params.outPath
 * @param {boolean} [params.strict]
 * @param {string[]} [params.exclude]
 * @param {(entry: string) => void} [params.onLog]
 * @returns {{ success: boolean, findings: import('./findings.js').Finding[] }}
 */
export function packPackage({ rootDir, outPath, strict = false, exclude = [], onLog = () => {} }) {
  const { findings } = lintPackage({ rootDir, strict, onLog });
  const hasErrors = findings.some((f) => f.severity === 'error');
  if (hasErrors) {
    return { success: false, findings };
  }

  const patterns = [...DEFAULT_EXCLUDES, ...exclude].map(globToRegExp);
  const zip = new AdmZip();
  for (const relPath of walkFiles(rootDir)) {
    if (patterns.some((re) => re.test(relPath))) continue;
    zip.addLocalFile(joinRoot(rootDir, relPath), dirnameOrEmpty(relPath));
  }
  zip.writeZip(outPath);

  return { success: true, findings };
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

function joinRoot(rootDir, relPath) {
  return `${rootDir}/${relPath}`;
}

function dirnameOrEmpty(relPath) {
  const idx = relPath.lastIndexOf('/');
  return idx === -1 ? '' : relPath.slice(0, idx);
}
