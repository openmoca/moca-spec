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
| Ontology | `https://w3id.org/moca/profiles/ontology/v1` | Draft | [ontology/](ontology/moca-ontology-profile.md) |

The Agent Skills, claims and EU AI Act profiles were removed in 0.4
([ADR-0015](../docs/adr/0015-park-unconsumed-features.md)); they remain at tag
[`v0.3.0-alpha.1`](https://github.com/openmoca/moca-spec/blob/v0.3.0-alpha.1/profiles). A profile returns only with two named use
cases ([ADR-0011](../docs/adr/0011-three-pillars-and-admission-test.md)).

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

A profile never defines a capability, and never makes a package invalid. The
structure every Reader understands is part of core
([package spec §5.6](../spec/moca-package-spec.md#56-structure)), not a
profile.

A profile MUST NOT redefine a core field, make a core-optional field
required for packages that do not declare the profile, or add top-level
manifest keys.
