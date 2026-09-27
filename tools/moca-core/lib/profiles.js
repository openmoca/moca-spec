// Profiles this reference reader recognises. Recognising a profile only stops
// F001 from being reported; profile data stays opaque to core.
export const PROFILE_AGENT_SKILLS = 'https://w3id.org/moca/profiles/agent-skills/v1';
export const PROFILE_CLAIMS = 'https://w3id.org/moca/profiles/claims/v1';
export const PROFILE_EU_AI_ACT = 'https://w3id.org/moca/profiles/eu-ai-act/v1';

export const KNOWN_PROFILES = Object.freeze([PROFILE_AGENT_SKILLS, PROFILE_CLAIMS, PROFILE_EU_AI_ACT]);
