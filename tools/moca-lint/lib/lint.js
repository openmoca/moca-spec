// Orchestrates all four validation passes against a resolved package directory.
import { performance } from 'node:perf_hooks';
import { FindingCollector } from './findings.js';
import { runManifestPass } from './passes/manifest.js';
import { runContentPass } from './passes/content.js';
import { runSkillsPass } from './passes/skills.js';
import { runSemanticPass } from './passes/semantic.js';
import { runSecurityPass } from './passes/security.js';

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {boolean} [params.strict]
 * @param {(entry: string) => void} [params.onLog] - receives debug trace lines for --log-file
 * @param {string} [params.trustRoot] - see spec/moca-trust-model.md §4; passed through to the Security pass
 * @param {{issuer: string, pattern: string}[]} [params.identityConstraints] - sigstore mode only, §4.1
 * @param {boolean} [params.onlineVerify]
 * @param {boolean} [params.allowOfflineFallback]
 * @returns {Promise<{ findings: import('./findings.js').Finding[], manifest: object|null }>}
 */
export async function lintPackage({
  rootDir,
  strict = false,
  onLog = () => {},
  trustRoot,
  identityConstraints,
  onlineVerify,
  allowOfflineFallback,
}) {
  const findings = new FindingCollector({ strict });
  const log = async (label, fn) => {
    const start = performance.now();
    const result = await fn();
    onLog(`[${label}] ${(performance.now() - start).toFixed(1)}ms`);
    return result;
  };

  const manifest = await log('pass1:manifest', () => runManifestPass({ rootDir, findings }));

  if (!manifest) {
    return { findings: findings.findings, manifest: null };
  }

  const { referencedConcepts } = await log('pass2:content', () =>
    runContentPass({ rootDir, manifest, findings })
  );

  await log('pass2:skills', () =>
    runSkillsPass({ rootDir, manifest, referencedConcepts, findings })
  );

  await log('pass3:semantic', () =>
    runSemanticPass({ rootDir, manifest, referencedConcepts, findings })
  );

  await log('pass4:security', () =>
    runSecurityPass({ rootDir, manifest, findings, trustRoot, identityConstraints, onlineVerify, allowOfflineFallback })
  );

  return { findings: findings.findings, manifest };
}
