# Profiles

A profile adds vocabulary or rules on top of MOCA core without changing what
core means ([package spec §9](../spec/moca-package-spec.md#9-profiles)). A
package declares a profile by listing its URI as a key of `profiles` in
`moca.json`; the value is that profile's package-level data.

A Reader that does not recognise a profile reports `F001_PROFILE_UNRECOGNISED`
(info) and reads the package as plain core. Profile data is never needed to
use a package.

## Registry

| Profile | URI | Status | Where |
| --- | --- | --- | --- |
| Agent Skills | `https://w3id.org/moca/profiles/agent-skills/v1` | Draft | [agent-skills/](agent-skills/moca-agent-skills-profile.md) |
| Claims | `https://w3id.org/moca/profiles/claims/v1` | Draft | [claims/](claims/moca-claims-profile.md) |
| EU AI Act data governance | `https://w3id.org/moca/profiles/eu-ai-act/v1` | Draft | [eu-ai-act/](eu-ai-act/moca-eu-ai-act-profile.md) |
| Ontology | `https://w3id.org/moca/profiles/ontology/v1` | Draft | [ontology/](ontology/moca-ontology-profile.md) |

**Claims or ontology?** Both use RDF, for different things. The
[ontology profile](ontology/moca-ontology-profile.md) carries vocabulary: the
concepts a package is about and how they relate, with nodes bound to them. The
[claims profile](claims/moca-claims-profile.md) carries assertions: individual
statements with their provenance. A package can use both, and claims can use
the ontology's concept IRIs.

Candidates, not yet written: NIST AI RMF, ISO/IEC 42001 and ISO/IEC 23894
data-governance profiles, following the pattern of the EU AI Act profile.
Profiles maintained outside this repository are listed here when their
owners ask; propose one with the profile issue template.

## Writing a profile

A profile document states:

1. its URI and version;
2. the package-level data it defines under `profiles["<uri>"]`, with a JSON
   Schema;
3. any node-level data under the node's `moca.profiles["<uri>"]`;
4. any additional files or directories it defines inside a package;
5. what a Reader that recognises it does differently, and confirmation that a
   core-only Reader loses nothing it needs.

A profile MAY also define a capability that Readers implementing it derive,
and diagnostics in its own code family, which are never errors that make a
package invalid ([package spec §9](../spec/moca-package-spec.md#9-profiles)).

A profile MUST NOT redefine a core field, make a core-optional field
required for packages that do not declare the profile, or add top-level
manifest keys.
