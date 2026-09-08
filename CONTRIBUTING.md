# Contributing to MOCA

MOCA is currently a solo/small-team beta project (see [GOVERNANCE.md](GOVERNANCE.md)).
This process is intentionally lightweight — there is no formal RFC process
at this stage.

## Proposing a Core Spec Change

1. Open an issue using the **Spec Change Proposal** template describing the
   problem, the affected section(s) of
   [moca-core-spec.md](spec/moca-core-spec.md), and the proposed change. The issue
   is where the proposal is developed and where its rationale is recorded —
   design discussion happens in the open, not in a working draft merged
   ahead of the discussion.
2. Once there's rough consensus in the issue, open a PR editing the spec
   directly. Keep the diff focused on the change under discussion.
3. A maintainer reviews for consistency with the rest of the spec (see
   keyword conventions below) before merging.

Breaking changes are possible during the `0.x` beta period, but should still
go through an issue first so the rationale and migration impact are captured.

Conformance level is derived from a package's contents and validation results;
it is not declared in `moca.json`.

## RFC 2119 Keyword Conventions

The spec uses RFC 2119 keywords (`MUST`, `MUST NOT`, `REQUIRED`, `SHOULD`,
`SHOULD NOT`, `MAY`, `OPTIONAL`) with their standard normative meanings.
When editing spec text:

- Use `MUST` / `MUST NOT` only for hard interoperability requirements.
- Use `SHOULD` / `SHOULD NOT` for strong recommendations that allow a
  documented exception.
- Use `MAY` for genuinely optional behavior.
- Don't downgrade or upgrade an existing keyword in a PR unless that's the
  explicit subject of the change — keyword changes affect conformance and
  deserve their own issue.

## Proposing a New Profile

Profiles are additive extensions to MOCA Core (see
[moca-core-spec.md §11](spec/moca-core-spec.md#11-profiles)). To propose one:

1. Open an issue using the **Profile Proposal** template naming the domain,
   the ontology roles / epistemic-status values / `profileData` fields it
   would add, and why it can't be expressed with existing profiles.
2. A profile MUST comply with the restrictions in
   [core §11.4](spec/moca-core-spec.md#114-profile-restrictions) — additive only,
   namespaced fields, no redefinition of core semantics.
3. Once agreed, the profile is authored at
   `profiles/<profile-name>/moca-<profile-name>-profile.md`, alongside its
   own `profile.schema.json` and `examples/`, following the structure of
   [moca-education-profile.md](profiles/education/moca-education-profile.md).

Profile-specific linting is the profile owner's responsibility and is not part
of this repository's `moca-lint`.

**Compliance and regulatory-standard profiles** follow the same process. See
[core §11.5](spec/moca-core-spec.md#115-compliance--standards-profiles) for how regulatory
standards (EU AI Act, NIST AI RMF, etc.) are modeled using the ordinary profile mechanism.
When proposing a compliance profile, the reference table in §11.5 should be updated
to avoid namespace collisions with other contributors working on compliance profiles.

## Schemas and Examples

Changes to `schemas/` or `examples/` should keep pace with the prose spec —
a manifest field described in the spec but not reflected in
`schemas/v1/core/moca.schema.json` is a bug. PRs touching the schema should
validate all existing examples still pass (see the repo's CI workflow).

### After editing an example package

Example packages carry **derived** artifacts that go stale as soon as any input
byte changes: `canonicalDigest` (which covers the manifest as well as the
content files), `signature` (which signs over that digest), and a sidecar's
`target_package_hash`. Editing a single word of Markdown — or a metadata field
as incidental as `license` — invalidates them, and the effect is transitive,
because a composed package folds its members' digests.

Rather than repairing these by hand in the right order, run:

```sh
npm run refresh:derived
```

It orders packages so members are refreshed before the packages composing them,
recomputes digests, re-signs signed packages with the repository's
non-production example key, and re-binds dependent sidecars. `npm test` runs
the read-only equivalent (`npm run validate:derived`) and fails if anything is
stale, so CI will tell you if you forget.

## Bug Reports

Use the **Bug Report** issue template for problems with the schemas, example
packages, or documentation (broken links, invalid JSON, inconsistencies
between spec prose and schema).
