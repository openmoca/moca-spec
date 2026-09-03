// Orchestrates all four validation passes against a resolved package directory.
import { performance } from 'node:perf_hooks';
import { FindingCollector } from './findings.js';
import { runManifestPass } from './passes/manifest.js';
import { runContentPass } from './passes/content.js';
import { runSemanticPass } from './passes/semantic.js';
import { runSecurityPass } from './passes/security.js';

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {boolean} [params.strict]
 * @param {(entry: string) => void} [params.onLog] - receives debug trace lines for --log-file
 * @returns {{ findings: import('./findings.js').Finding[], manifest: object|null }}
 */
export function lintPackage({ rootDir, strict = false, onLog = () => {} }) {
  const findings = new FindingCollector({ strict });
  const log = (label, fn) => {
    const start = performance.now();
    const result = fn();
    onLog(`[${label}] ${(performance.now() - start).toFixed(1)}ms`);
    return result;
  };

  const manifest = log('pass1:manifest', () => runManifestPass({ rootDir, findings }));

  if (!manifest) {
    return { findings: findings.findings, manifest: null };
  }

  const { referencedConcepts } = log('pass2:content', () =>
    runContentPass({ rootDir, manifest, findings })
  );

  log('pass3:semantic', () =>
    runSemanticPass({ rootDir, manifest, referencedConcepts, findings })
  );

  log('pass4:security', () => runSecurityPass({ rootDir, manifest, findings }));

  return { findings: findings.findings, manifest };
}
