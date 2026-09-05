// Epistemic status vocabulary — core §7.2.
export const CORE_EPISTEMIC_STATUS = new Set([
  'sourced',
  'verified',
  'inferred',
  'generated',
  'disputed',
  'deprecated',
]);

/**
 * @param {string[]} activeProfiles - profile URIs declared in moca.json
 * @returns {{ allowed: Set<string>, hasUnrecognizedProfile: boolean }}
 */
export function allowedEpistemicStatusValues(activeProfiles = []) {
  const allowed = new Set(CORE_EPISTEMIC_STATUS);
  let hasUnrecognizedProfile = false;
  for (const profile of activeProfiles) {
    if (profile) hasUnrecognizedProfile = true;
  }
  return { allowed, hasUnrecognizedProfile };
}
