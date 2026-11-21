# 0038 — Credits are labels in fixed shapes

- **Status:** Accepted (owner, 2026-11-20). Was: Proposed (2026-11-17)
- **Date:** 2026-11-17
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A package said who published it with `publisher`, a free string, and said
nothing about who made the work: no authors, hosts, narrators or
translators, no link to the work's own page, and no way to tie a name to an
identifier such as ISNI, ORCID or Wikidata. Catalogues, apps and assistants
need these to show credits and to say where an answer came from. The
sources MOCA packages already carry them: Podcasting 2.0 `podcast:person`,
a feed's channel link and description, an EPUB's `dc:creator` and
`dc:contributor`, LibriVox narrators.

## Options

1. Keep `publisher` a string, and add `publisher` details and contributors
   as optional extra keys.
2. Let `publisher` be a string or an object.
3. Make `publisher` an object only, and add a package-level `url` and
   `contributors` (package and node level) in one fixed shape, with roles
   as MARC relator codes.

## Decision

Option 3 ([package spec §4.13](../../spec/moca-package-spec.md)).

- **One shape for each field.** Either-or shapes make every Reader, schema,
  test and consumer handle both, and a mistake in one branch goes unnoticed.
  The string form is dropped before 1.0, as a stated breaking change
  ([MIGRATIONS.md](../../MIGRATIONS.md)).
- **Roles are MARC relator codes.** They are a maintained, widely mapped
  list (Dublin Core, schema.org, ONIX, EPUB). Readers check only the form,
  three lower-case letters, so a new code needs no new release. The spec
  gives an informative mapping from Podcasting 2.0 roles.
- **Node credits live in frontmatter** (`moca.contributors`), beside the
  node's other metadata: a guest belongs to one episode. A node's credits
  never inherit the package's.
- **Pictures are package files**, checked as manifest images are: a Reader
  never fetches anything for a credit.
- **Labels, not proof.** A credit is the signer's claim. A signature shows
  who signed, not who made the work or agreed to be named. Credits have no
  e-mail field, and producers must not put contact details in them.

## Consequences

- Catalogues and assistants can show who made a work, with identifiers that
  link to other catalogues, and map credits to schema.org, Dublin Core and
  ONIX without guessing.
- Every package with a string `publisher` fails the 0.7 schema (`M002`):
  producers must write the object and rebuild. A 0.6 Reader refuses a
  package with the object form for the same reason, so a package that must
  reach 0.6 Readers leaves `publisher` out.
- Credits name people and stay in every old version, so producers credit
  people only as they credit themselves in public.

## What would change this decision

Evidence that relator codes cannot express a role creators need, or that
consumers need a structured name (given and family names) rather than a
display name.
