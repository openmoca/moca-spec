// Pass 1: Package Structure & Manifest (E100 series) — core §5.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { activeProfileNames, loadProfileSchema } from '../profiles.js';

const packageDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const repoRoot = join(packageDir, '..', '..');

const coreSchema = JSON.parse(
  readFileSync(join(repoRoot, 'schemas/core/moca.schema.json'), 'utf8')
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateCore = ajv.compile(coreSchema);
const compiledProfileValidators = new Map();

function getProfileValidator(profileName) {
  if (compiledProfileValidators.has(profileName)) return compiledProfileValidators.get(profileName);
  const schema = loadProfileSchema(profileName);
  const validate = schema ? ajv.compile(schema) : null;
  compiledProfileValidators.set(profileName, validate);
  return validate;
}

const EXCLUDED_KEYS = new Set(['endpoints', 'settings', 'credentials', 'apiKeys']);
const CURIE_PREFIX_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

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

  // Field names from any recognized declared profile's schema, for the E105 hint below.
  const profileNames = activeProfileNames(manifest);
  const profileFieldNames = new Set();
  for (const profileName of profileNames) {
    const schema = loadProfileSchema(profileName);
    for (const key of Object.keys(schema?.properties ?? {})) profileFieldNames.add(key);
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
        if (profileFieldNames.has(badKey)) {
          findings.add(
            'E105_PROFILE_DATA_MISPLACED',
            `"${badKey}" looks like profile data; move it under profileData.<profile> (core §10.3).`,
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

  for (const profileName of profileNames) {
    const validateProfile = getProfileValidator(profileName);
    const profileData = manifest.profileData?.[profileName];
    if (!profileData || !validateProfile) continue;
    if (!validateProfile(profileData)) {
      for (const err of validateProfile.errors) {
        findings.add(
          'E102_SCHEMA_INVALID',
          `profileData.${profileName}${err.instancePath} ${err.message}`.trim(),
          { file: 'moca.json' }
        );
      }
    }
  }

  return manifest;
}

