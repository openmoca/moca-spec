// The reference Reader: spec/moca-reader-contract.md.
//
// readPackage() opens a package from any source, checks it, computes its
// digest, verifies its attestations against a host trust root, resolves
// members through a host resolver, and returns everything an application
// needs. It never executes package content, never performs network I/O of
// its own, and never acts on a location or setting a package supplies.
import { checkManifest } from './manifest.js';
import { readContent } from './content.js';
import { readSkills, SKILLS_DIR } from './skills.js';
import { Diagnostics } from './diagnostics.js';
import { openSource, TargetError } from './source.js';
import { packageFiles, computeDigest, MANIFEST, ATTESTATIONS_DIR } from './digest.js';
import {
  loadTrustRoot, parseAttestation, verifySignature, checkPackageStatement, checkReviewStatement,
  PREDICATE_PACKAGE, PREDICATE_REVIEW,
} from './attestations.js';
import { KNOWN_PROFILES, PROFILE_ONTOLOGY } from './profiles.js';
import { readOntology } from './ontology.js';

const INVALIDATING = /^(T|P|M|C)\d/;

/**
 * @typedef {object} ReadOptions
 * @property {string|object} [trustRoot]  path, trust-root document, or loadTrustRoot() result
 * @property {(member: { id: string, version: string, digest: string }) => (string|object|null|Promise<string|object|null>)} [resolveMember]
 *   host resolver returning a target (path or source) for a member, or null
 * @property {boolean} [strict]  promote warnings to errors
 * @property {{ maxEntries?: number, maxBytes?: number }} [limits]
 * @property {Iterable<string>} [knownProfiles]
 * @property {boolean} [online]  opt in to online Sigstore verification
 * @property {boolean} [allowOfflineFallback]
 * @property {string} [tufCachePath]
 */

/**
 * @param {string|object} target  directory, .moca/.zip path, or host source
 * @param {ReadOptions} [options]
 */
export async function readPackage(target, options = {}) {
  return readInternal(target, options, []);
}

async function readInternal(target, options, stack) {
  const diagnostics = new Diagnostics({ strict: options.strict });
  const result = {
    manifest: null,
    digest: null,
    nodes: [],
    fileDigests: new Map(),
    attestations: [],
    reviewsByFile: new Map(),
    signers: [],
    skills: { present: false, exposed: false, list: [] },
    members: [],
    profiles: [],
    diagnostics: diagnostics.items,
    valid: false,
    capabilities: [],
    ontology: null,
    source: null,
  };

  let source;
  try {
    source = openSource(target, options.limits);
    source.list();
  } catch (err) {
    if (err instanceof TargetError) {
      diagnostics.add(err.code, err.message);
      return result;
    }
    throw err;
  }
  result.source = source;

  const { ok: entriesOk, files } = packageFiles(source, diagnostics);
  if (!files.has(MANIFEST)) {
    diagnostics.add('T002_MANIFEST_NOT_FOUND', 'the target has no moca.json at its root');
    return finish(result, diagnostics);
  }

  const bytes = new Map();
  let readable = true;
  for (const [nfc, stored] of files) {
    try {
      bytes.set(nfc, source.read(stored));
    } catch (err) {
      diagnostics.add('P002_UNREADABLE_ENTRY', `"${stored}" could not be read: ${err.message}`, { file: stored });
      readable = false;
    }
  }

  let manifest;
  try {
    manifest = JSON.parse(bytes.get(MANIFEST).toString('utf8').replace(/^﻿/, ''));
  } catch (err) {
    diagnostics.add('M001_MANIFEST_INVALID_JSON', `moca.json is not valid JSON: ${err.message}`, { file: MANIFEST });
    return finish(result, diagnostics);
  }
  result.manifest = manifest;
  checkManifest(manifest, diagnostics, { knownProfiles: options.knownProfiles ?? KNOWN_PROFILES });
  result.profiles = Object.keys(manifest?.profiles ?? {});

  if (entriesOk && readable) {
    const { digest, fileDigests } = computeDigest(source, manifest, files, (stored) => bytes.get(stored.normalize('NFC')));
    result.digest = digest;
    result.fileDigests = fileDigests;
  }

  result.nodes = readContent({ manifest, files, bytes, fileDigests: result.fileDigests, diagnostics });
  const knownProfiles = [...(options.knownProfiles ?? KNOWN_PROFILES)];
  if (result.profiles.includes(PROFILE_ONTOLOGY) && knownProfiles.includes(PROFILE_ONTOLOGY)) {
    result.ontology = readOntology({ manifest, bytes, nodes: result.nodes, diagnostics });
  }
  const members = Array.isArray(manifest?.members) ? manifest.members : [];
  if (result.nodes.length === 0 && members.length === 0) {
    diagnostics.add('M003_NO_CONTENT', 'a package needs at least one content node under content/ or at least one member');
  }

  const trustRoot = options.trustRoot === undefined ? undefined
    : typeof options.trustRoot.key === 'function' ? options.trustRoot : loadTrustRoot(options.trustRoot);
  if (result.digest) await readAttestations(result, bytes, trustRoot, options, diagnostics);

  const skillPaths = [...bytes.keys()].filter((p) => p.startsWith(`${SKILLS_DIR}/`));
  if (skillPaths.length > 0) {
    result.skills.present = true;
    const list = readSkills(bytes, diagnostics);
    if (result.signers.length > 0) {
      result.skills.exposed = true;
      result.skills.list = list;
    } else {
      diagnostics.add('A005_SKILLS_WITHHELD', 'skills/ requires a valid package attestation; the skills are withheld and the rest of the package is usable', { file: SKILLS_DIR });
    }
  }

  await resolveMembers(result, members, options, stack, diagnostics);
  return finish(result, diagnostics);
}

async function readAttestations(result, bytes, trustRoot, options, diagnostics) {
  const { manifest, digest } = result;
  const files = [...bytes.keys()].filter((p) => p.startsWith(`${ATTESTATIONS_DIR}/`) && /\.(dsse|sigstore)\.json$/.test(p)).sort();
  for (const file of files) {
    const parsed = parseAttestation(file, bytes.get(file));
    if (!parsed.ok) {
      diagnostics.add('A001_ATTESTATION_MALFORMED', parsed.reason, { file });
      result.attestations.push({ file, outcome: 'malformed', reason: parsed.reason });
      continue;
    }
    const type = parsed.statement.predicateType;
    if (type !== PREDICATE_PACKAGE && type !== PREDICATE_REVIEW) {
      result.attestations.push({ file, predicateType: type, outcome: 'ignored', reason: 'unknown predicate type' });
      continue;
    }
    const role = type === PREDICATE_PACKAGE ? 'package' : 'review';
    const sig = await verifySignature(parsed, trustRoot, role, options);
    const record = { file, predicateType: type, role, format: parsed.format, outcome: sig.outcome, signer: sig.signer, reason: sig.reason };
    result.attestations.push(record);
    if (sig.outcome === 'unverifiable') {
      diagnostics.add('A003_ATTESTATION_UNVERIFIABLE', `${role} attestation not checked: ${sig.reason}`, { file });
      continue;
    }
    if (sig.outcome === 'indeterminate') {
      diagnostics.add('A004_ATTESTATION_INDETERMINATE', sig.reason, { file });
      continue;
    }
    if (sig.outcome === 'invalid') {
      diagnostics.add('A002_ATTESTATION_INVALID', `${role} attestation signature did not verify: ${sig.reason}`, { file });
      continue;
    }

    if (role === 'package') {
      const mismatch = checkPackageStatement(parsed.statement, { id: manifest.id, version: manifest.version, digest });
      if (mismatch) {
        record.outcome = 'invalid';
        record.reason = mismatch;
        diagnostics.add('A002_ATTESTATION_INVALID', `package attestation does not match this package: ${mismatch}`, { file });
      } else {
        result.signers.push(sig.signer);
      }
      continue;
    }

    const review = checkReviewStatement(parsed.statement, manifest.id, result.fileDigests);
    if (review.error) {
      record.outcome = 'invalid';
      record.reason = review.error;
      diagnostics.add('A002_ATTESTATION_INVALID', review.error, { file });
      continue;
    }
    record.current = review.current;
    record.outdated = review.outdated;
    for (const path of review.outdated) {
      diagnostics.add('A006_REVIEW_OUTDATED', `review of ${path} no longer matches the file`, { file });
    }
    for (const path of review.current) {
      const entry = {
        reviewer: review.predicate.reviewer,
        reviewedAt: review.predicate.reviewedAt,
        outcome: review.predicate.outcome,
        signer: sig.signer,
        ...(review.predicate.scope ? { scope: review.predicate.scope } : {}),
      };
      const key = path.normalize('NFC');
      if (!result.reviewsByFile.has(key)) result.reviewsByFile.set(key, []);
      result.reviewsByFile.get(key).push(entry);
    }
  }
}

async function resolveMembers(result, members, options, stack, diagnostics) {
  const id = result.manifest?.id;
  for (const member of members) {
    if (!member?.id || !member?.digest) continue;
    const entry = { id: member.id, version: member.version, digest: member.digest, status: 'unresolved', result: null };
    result.members.push(entry);
    if (!options.resolveMember) continue;
    if (member.id === id || stack.includes(member.id)) {
      diagnostics.add('R003_MEMBER_CYCLE', `members form a cycle: ${[...stack, id, member.id].join(' -> ')}`, { file: MANIFEST });
      entry.status = 'cycle';
      continue;
    }
    const target = await options.resolveMember({ id: member.id, version: member.version, digest: member.digest });
    if (!target) {
      diagnostics.add('R001_MEMBER_UNRESOLVED', `member ${member.id}@${member.version} could not be resolved`, { file: MANIFEST });
      continue;
    }
    const child = await readInternal(target, options, [...stack, id]);
    entry.result = child;
    if (child.diagnostics.some((d) => d.code === 'R003_MEMBER_CYCLE')) {
      diagnostics.add('R003_MEMBER_CYCLE', `member ${member.id} is part of a cycle`, { file: MANIFEST });
      entry.status = 'cycle';
    } else if (child.digest !== member.digest) {
      diagnostics.add('R002_MEMBER_DIGEST_MISMATCH', `member ${member.id}@${member.version} has digest ${child.digest ?? '(none)'}, but ${member.digest} is pinned`, { file: MANIFEST });
      entry.status = 'mismatch';
    } else {
      entry.status = 'resolved';
    }
  }
}

function finish(result, diagnostics) {
  result.valid = !diagnostics.items.some((d) => d.severity === 'error' && INVALIDATING.test(d.code));
  if (!result.valid) return result;
  const caps = new Set(['core']);
  let allEvidenceLocal = true;
  for (const node of result.nodes) {
    for (const rep of node.representations) {
      if (Array.isArray(rep.frontmatter.moca?.evidence) && rep.frontmatter.moca.evidence.length > 0) caps.add('located-evidence');
      if (rep.evidenceChecks?.some((c) => !c.local)) allEvidenceLocal = false;
      if (rep.locale) caps.add('localized');
      if (result.reviewsByFile.has(rep.file)) caps.add('reviewed');
    }
  }
  if (caps.has('located-evidence') && allEvidenceLocal) caps.add('self-contained-evidence');
  if (result.ontology?.ok) caps.add('ontology');
  if (result.members.length > 0) caps.add('composed');
  if (result.signers.length > 0) caps.add('signed');
  if (result.skills.exposed) caps.add('skills');
  result.capabilities = [...caps].sort();
  return result;
}
