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

  const { allowed: allowedStatus, hasUnrecognizedProfile } = allowedEpistemicStatusValues(
    manifest.profile ?? []
  );
  const files = walkFiles(contentDir, rootDir).filter((f) => f.endsWith('.md'));

  checkLocaleFallback(files, findings);

  const nodeIdsSeen = new Map();

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

    if (data.id) {
      const owners = nodeIdsSeen.get(data.id) ?? [];
      owners.push(relPath);
      nodeIdsSeen.set(data.id, owners);
    }

    for (const concept of data.concepts ?? []) {
      const curie = typeof concept === 'string' ? concept : concept?.id;
      checkConceptRef([curie], relPath, manifest, findings, referencedConcepts);
    }

    for (const claim of data.claims ?? []) {
      if (!claim?.id || !claim?.subject || !claim?.predicate || !claim?.object) {
        findings.add(
          'E209_INVALID_CLAIM',
          'claims[] entry is missing a required id, subject, predicate, or object.',
          { file: relPath }
        );
      }
      checkConceptRef(
        [claim?.subject, claim?.predicate, claim?.object],
        relPath,
        manifest,
        findings,
        referencedConcepts
      );
      if (claim?.epistemicStatus && !allowedStatus.has(claim.epistemicStatus)) {
        reportInvalidEpistemicStatus(claim.epistemicStatus, 'claims[].epistemicStatus', relPath, hasUnrecognizedProfile, findings);
      }
    }

    if (data.epistemicStatus && !allowedStatus.has(data.epistemicStatus)) {
      reportInvalidEpistemicStatus(data.epistemicStatus, 'epistemicStatus', relPath, hasUnrecognizedProfile, findings);
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
      checkEvidenceLocator(evidence.locator, relPath, findings);
    }
  }

  for (const [id, owners] of nodeIdsSeen) {
    if (owners.length > 1) {
      findings.add(
        'E207_DUPLICATE_NODE_ID',
        `Content node id "${id}" is declared by more than one file: ${owners.join(', ')}.`,
        { file: owners[0] }
      );
    }
  }

  return { referencedConcepts };
}

// A package can declare a profile moca-lint has no vocabulary extension list for
// (core §10.2 graceful degradation) — in that case we can't prove the value is
// invalid, so downgrade to a warning instead of asserting a hard error.
function reportInvalidEpistemicStatus(value, field, file, hasUnrecognizedProfile, findings) {
  const code = hasUnrecognizedProfile ? 'E210_UNVERIFIABLE_EPISTEMIC_STATUS' : 'E204_INVALID_EPISTEMIC_STATUS';
  const suffix = hasUnrecognizedProfile
    ? ' (this package declares a profile moca-lint does not recognize, so this may be a valid profile-specific value).'
    : '.';
  findings.add(code, `${field} "${value}" is not in the core or active profile vocabulary${suffix}`, { file });
}

function checkEvidenceLocator(locator, file, findings) {
  if (!locator) return;
  const { type } = locator;
  if (type === 'page') {
    if (typeof locator.page !== 'number') {
      findings.add('E208_INVALID_EVIDENCE_LOCATOR', 'locator of type "page" requires a numeric "page" field.', { file });
    }
  } else if (type === 'FragmentSelector') {
    if (!locator.conformsTo || !locator.value) {
      findings.add(
        'E208_INVALID_EVIDENCE_LOCATOR',
        'locator of type "FragmentSelector" requires "conformsTo" and "value" fields.',
        { file }
      );
    }
  } else if (type === 'TextQuoteSelector') {
    if (!locator.exact) {
      findings.add(
        'E208_INVALID_EVIDENCE_LOCATOR',
        'locator of type "TextQuoteSelector" requires an "exact" field.',
        { file }
      );
    }
  } else {
    findings.add(
      'E208_INVALID_EVIDENCE_LOCATOR',
      `locator type "${type}" is not one of page, FragmentSelector, TextQuoteSelector (core §7.3).`,
      { file }
    );
  }
}

export function checkConceptRef(values, file, manifest, findings, referencedConcepts) {
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
