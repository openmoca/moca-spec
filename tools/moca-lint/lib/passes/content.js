// Pass 2: Content & Referential Integrity (E200 series) — core §7, §4.2.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { walkFiles } from '../walk.js';
import { allowedEpistemicStatusValues } from '../vocab.js';

const LOCALE_SUFFIX_PATTERN = /^(.+)\.([a-zA-Z]{2,3}(?:-[A-Za-z0-9]+)*)\.md$/;

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {object} params.manifest
 * @param {import('../findings.js').FindingCollector} params.findings
 * @returns {{ referencedConcepts: Array<{ curie: string, file: string }> }}
 */
export function runContentPass({ rootDir, manifest, findings }) {
  const contentDir = join(rootDir, 'content');
  const referencedConcepts = [];

  checkConceptRef(manifest.entryConcepts, 'moca.json', manifest, findings, referencedConcepts);

  if (!existsSync(contentDir)) {
    return { referencedConcepts };
  }

  const allowedStatus = allowedEpistemicStatusValues(manifest.profile ?? []);
  const files = walkFiles(contentDir, rootDir).filter((f) => f.endsWith('.md'));

  checkLocaleFallback(files, findings);

  for (const relPath of files) {
    const absPath = join(rootDir, relPath);
    let parsed;
    try {
      parsed = matter(readFileSync(absPath, 'utf8'));
    } catch (err) {
      findings.add('E201_FRONTMATTER_SYNTAX', `Invalid YAML frontmatter: ${err.message}`, {
        file: relPath,
      });
      continue;
    }

    const data = parsed.data ?? {};

    for (const concept of data.concepts ?? []) {
      const curie = typeof concept === 'string' ? concept : concept?.id;
      checkConceptRef([curie], relPath, manifest, findings, referencedConcepts);
    }

    for (const claim of data.claims ?? []) {
      checkConceptRef(
        [claim?.subject, claim?.object],
        relPath,
        manifest,
        findings,
        referencedConcepts
      );
      if (claim?.epistemicStatus && !allowedStatus.has(claim.epistemicStatus)) {
        findings.add(
          'E204_INVALID_EPISTEMIC_STATUS',
          `claims[].epistemicStatus "${claim.epistemicStatus}" is not in the core or active profile vocabulary.`,
          { file: relPath }
        );
      }
    }

    if (data.epistemicStatus && !allowedStatus.has(data.epistemicStatus)) {
      findings.add(
        'E204_INVALID_EPISTEMIC_STATUS',
        `epistemicStatus "${data.epistemicStatus}" is not in the core or active profile vocabulary.`,
        { file: relPath }
      );
    }

    for (const evidence of data.evidence ?? []) {
      if (!evidence?.source) continue;
      const evidencePath = join(rootDir, evidence.source);
      if (!existsSync(evidencePath)) {
        findings.add(
          'E203_DANGLING_EVIDENCE_SOURCE',
          `evidence source "${evidence.source}" does not exist.`,
          { file: relPath }
        );
      }
    }
  }

  return { referencedConcepts };
}

function checkConceptRef(values, file, manifest, findings, referencedConcepts) {
  const namespaces = manifest.namespaces ?? {};
  for (const value of values ?? []) {
    if (!value || typeof value !== 'string' || !value.includes(':')) continue;
    const prefix = value.slice(0, value.indexOf(':'));
    if (prefix === 'urn' || value.startsWith('http://') || value.startsWith('https://')) continue;
    if (!(prefix in namespaces)) {
      findings.add(
        'E202_UNRESOLVED_NAMESPACE_PREFIX',
        `Concept reference "${value}" uses prefix "${prefix}" which is not declared in namespaces.`,
        { file }
      );
      continue;
    }
    referencedConcepts.push({ curie: value, file });
  }
}

function checkLocaleFallback(files, findings) {
  const basenames = new Set(files);
  for (const file of files) {
    const match = file.match(LOCALE_SUFFIX_PATTERN);
    if (!match) continue;
    const defaultFile = `${match[1]}.md`;
    if (!basenames.has(defaultFile)) {
      findings.add(
        'E205_MISSING_LOCALE_FALLBACK',
        `Locale variant exists without its default fallback file "${defaultFile}".`,
        { file }
      );
    }
  }
}
