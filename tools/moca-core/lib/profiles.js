// Profiles this reference reader recognises. Recognising a profile stops F001
// from being reported. Only the ontology profile changes what the Reader does
// (lib/ontology.js); other profile data stays opaque to core.
export const PROFILE_ONTOLOGY = 'https://w3id.org/moca/profiles/ontology/v1';

export const KNOWN_PROFILES = Object.freeze([PROFILE_ONTOLOGY]);
