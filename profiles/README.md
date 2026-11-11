# Profiles

A **profile** is an optional extension to MOCA. It lets a package carry extra
information for a particular kind of use, such as a full domain ontology,
without changing what any Reader does with the package.

MOCA's core is everything every Reader understands: the pages, their sources,
the digest, signatures and reviews, and the structure in `structure.ttl`
(topics, parts, order, what requires what). Some publishers and applications
need more than that. Rather than grow the core for each of them, a package
can declare a profile and carry the extra material alongside, for the
applications that want it.

## The rules

A profile can add, but never take away
([package spec §9](../spec/moca-package-spec.md#9-profiles)):

- **It is optional.** A Reader that does not know a profile reads the package
  as plain core, and reports `F001_PROFILE_UNRECOGNISED` as information, not
  as an error. Nothing anyone needs to use the package is ever inside a
  profile.
- **It only adds.** A profile never changes what a core field means, never
  adds top-level keys to the manifest, and never makes a package invalid.
- **It is sealed like everything else.** Files a profile adds are part of the
  package, so the digest covers them and the publisher's signature vouches
  for them.
- **It is named by a URI with a version**, such as
  `https://w3id.org/moca/profiles/ontology/v1`, so there is never doubt about
  which profile, and which version, a package means.

## Profile, structure or overlay?

Three places can hold "more than the pages". Choose by who needs it:

| You want to | Use | Why |
| --- | --- | --- |
| Give every Reader topics, parts, steps in order, or what requires what | **Structure** (`structure.ttl`, core) | Every Reader understands it: search, citations and navigation use it |
| Ship richer material for applications that know what to do with it, such as an OWL ontology or SHACL shapes | **A profile** | It travels inside the package, sealed and signed, and Readers that do not need it lose nothing |
| Add your organisation's or application's own rules to someone else's package, such as "this module is required before access" | **An overlay** | The host loads it beside the package, so the package is never edited ([architecture](../docs/architecture.md)) |

## Use a profile in a package

A package declares a profile in `moca.json`: the profile's URI is a key of
`profiles`, and its value is the profile's data. For the ontology profile,
that is the list of ontology files and the role of each:

```json
{
  "id": "https://example.com/moca/clinical-pathways",
  "version": "1.0.0",
  "title": "Clinical pathways",
  "profiles": {
    "https://w3id.org/moca/profiles/ontology/v1": {
      "files": [
        { "path": "ontologies/conditions.ttl", "role": "domain" },
        { "path": "ontologies/shapes.ttl", "role": "shapes" }
      ]
    }
  }
}
```

The files go where the profile says, here under `ontologies/`, and are packed,
digested and signed with the rest of the package. A single page can carry
profile data too, in its frontmatter under `moca.profiles` with the same URI as
the key, when a profile defines page-level data.

Check the package as usual:

```sh
npx @openmoca/moca-lint lint clinical-pathways
```

A Reader that recognises the profile reports nothing about it. One that does
not reports `F001_PROFILE_UNRECOGNISED` and carries on.

## Read a profile in an application

Readers check that a profile's files are part of the sealed package, then pass
them through untouched: they do not interpret them, and search, citations and
structure never depend on them. An application that uses a profile reads its
data from the manifest (`profiles["<uri>"]`) and its files from the verified
package, and does with them whatever the profile describes. For example, an
application can load a package's OWL ontology into its own reasoner, or check
pages against its SHACL shapes.

## Profiles today

| Profile | URI | Status | What it carries |
| --- | --- | --- | --- |
| [Ontology](ontology/moca-ontology-profile.md) | `https://w3id.org/moca/profiles/ontology/v1` | Draft | Full ontologies beyond the core structure: OWL, SKOS or SHACL files, each with a role (`domain`, `governance`, `shapes` or `extension`) |

All three Readers recognise the ontology profile.

Earlier drafts had profiles for agent skills, claims and the EU AI Act. They
were removed in 0.4 because nothing used them
([ADR-0011](../docs/adr/0011-park-unconsumed-features.md)). A profile joins
the list when there are two named, real uses for it
([ADR-0001](../docs/adr/0001-three-pillars-and-admission-test.md)), which
keeps the standard small.

## Profile URIs

A profile URI is a permanent name. MOCA's own profiles are named under
`https://w3id.org/moca/`, a permanent-identifier service that redirects to
openmoca.org, so the names outlive any one website. Open a profile URI in a
browser and you reach the profile's document; its schema is at the same
address plus `profile.schema.json`. A Reader never fetches either: it knows
the profiles it supports.

## Write a profile

Anyone can write a profile, under a URI on a domain they control. Profiles
maintained outside this repository are listed here when their owners ask:
propose one with the profile issue template.

A profile document states:

1. its URI and version;
2. the package-level data it defines under `profiles["<uri>"]`, with a JSON
   Schema;
3. any page-level data under a page's `moca.profiles["<uri>"]`;
4. any files or folders it adds inside a package;
5. what a Reader that recognises it does differently, and confirmation that a
   Reader without it loses nothing it needs.

A profile MUST NOT redefine a core field, make a core-optional field
required for packages that do not declare the profile, or add top-level
manifest keys. It never defines a capability, and never makes a package
invalid. Structure that every Reader must understand belongs in the core
([package spec §5.6](../spec/moca-package-spec.md#56-structure)), not in a
profile.
