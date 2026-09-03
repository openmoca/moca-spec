// Epistemic status vocabulary — core §7.2, extended per-profile in §7.2 / education §3.
export const CORE_EPISTEMIC_STATUS = new Set([
  'sourced',
  'verified',
  'inferred',
  'generated',
  'disputed',
  'deprecated',
]);

// Hardcoded until profiles publish a machine-readable vocabulary extension list.
const PROFILE_EPISTEMIC_STATUS_EXTENSIONS = {
  'https://openmoca.org/profiles/education/v1': ['authoritative', 'peer-reviewed'],
};

/**
 * @param {string[]} activeProfiles - profile URIs declared in moca.json
 * @returns {{ allowed: Set<string>, hasUnrecognizedProfile: boolean }}
 */
export function allowedEpistemicStatusValues(activeProfiles = []) {
  const allowed = new Set(CORE_EPISTEMIC_STATUS);
  let hasUnrecognizedProfile = false;
  for (const profile of activeProfiles) {
    if (profile in PROFILE_EPISTEMIC_STATUS_EXTENSIONS) {
      for (const extra of PROFILE_EPISTEMIC_STATUS_EXTENSIONS[profile]) allowed.add(extra);
    } else {
      hasUnrecognizedProfile = true;
    }
  }
  return { allowed, hasUnrecognizedProfile };
}
