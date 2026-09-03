// Pass 1: Package Structure & Manifest (E100 series) — core §5.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const packageDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const repoRoot = join(packageDir, '..', '..');

const coreSchema = JSON.parse(
  readFileSync(join(repoRoot, 'schemas/core/moca.schema.json'), 'utf8')
);
const eduSchema = JSON.parse(
  readFileSync(join(repoRoot, 'schemas/education/profile.schema.json'), 'utf8')
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateCore = ajv.compile(coreSchema);
const validateEdu = ajv.compile(eduSchema);

const EXCLUDED_KEYS = new Set(['endpoints', 'settings', 'credentials', 'apiKeys']);
const CURIE_PREFIX_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

// Root-level field names that belong under profileData.<profile> for known profiles.
const PROFILE_FIELD_HINTS = {
  education: Object.keys(eduSchema.properties ?? {}),
};

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {import('../findings.js').FindingCollector} params.findings
 * @returns {object|null} the parsed manifest, or null if it could not be loaded
 */
export function runManifestPass({ rootDir, findings }) {
  const manifestPath = join(rootDir, 'moca.json');
  if (!existsSync(manifestPath)) {
    findings.add('E101_MANIFEST_MISSING', 'moca.json does not exist at the package root.', {
      file: 'moca.json',
    });
    return null;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    findings.add('E102_SCHEMA_INVALID', `moca.json is not valid JSON: ${err.message}`, {
      file: 'moca.json',
    });
    return null;
  }

  if (!validateCore(manifest)) {
    for (const err of validateCore.errors) {
      const property = err.instancePath.replace(/^\//, '').split('/')[0];
      if (err.keyword === 'additionalProperties') {
        const badKey = err.params.additionalProperty;
        if (EXCLUDED_KEYS.has(badKey)) {
          findings.add(
            'E103_EXCLUDED_PROPERTIES',
            `moca.json contains forbidden key "${badKey}" (core §5.3).`,
            { file: 'moca.json' }
          );
          continue;
        }
        if (Array.isArray(manifest.profile) && PROFILE_FIELD_HINTS.education.includes(badKey)) {
          findings.add(
            'E105_PROFILE_DATA_MISPLACED',
            `"${badKey}" looks like education profile data; move it under profileData.education (core §10.3).`,
            { file: 'moca.json' }
          );
          continue;
        }
      }
      // The schema's root "not" clause duplicates additionalProperties for excluded
      // keys; additionalProperties already reported it above with a clearer message.
      if (err.keyword === 'not' && err.instancePath === '') continue;
      findings.add(
        'E102_SCHEMA_INVALID',
        `${err.instancePath || '/'} ${err.message}`.trim(),
        { file: 'moca.json' }
      );
    }
  }

  if (manifest.namespaces && typeof manifest.namespaces === 'object') {
    for (const prefix of Object.keys(manifest.namespaces)) {
      if (!CURIE_PREFIX_PATTERN.test(prefix)) {
        findings.add(
          'E104_INVALID_NAMESPACES',
          `namespaces prefix "${prefix}" is not a valid CURIE prefix.`,
          { file: 'moca.json' }
        );
      }
    }
  }

  const eduData = manifest.profileData?.education;
  if (eduData && !validateEdu(eduData)) {
    for (const err of validateEdu.errors) {
      findings.add(
        'E102_SCHEMA_INVALID',
        `profileData.education${err.instancePath} ${err.message}`.trim(),
        { file: 'moca.json' }
      );
    }
  }

  return manifest;
}
