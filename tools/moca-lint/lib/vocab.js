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

/** @param {string[]} activeProfiles */
export function allowedEpistemicStatusValues(activeProfiles = []) {
  const values = new Set(CORE_EPISTEMIC_STATUS);
  for (const profile of activeProfiles) {
    for (const extra of PROFILE_EPISTEMIC_STATUS_EXTENSIONS[profile] ?? []) {
      values.add(extra);
    }
  }
  return values;
}
