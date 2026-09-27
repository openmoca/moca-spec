# Migrations

Entries here describe changes to `moca-lint`'s validation behavior that flip
an existing check's pass/fail outcome for a previously-valid or
previously-invalid package — what an affected package or profile author
should actually do about the change, not just what changed. See
[CHANGELOG.md](CHANGELOG.md) for the full, dated history of every change;
this file is a curated subset written for someone acting on one specific
behavior change, not a second changelog.

This project is in **Beta `0.1.0-beta.1`** status; see
[docs/versioning-and-release.md](docs/versioning-and-release.md) for what
compatibility means during the `0.x` line.

## SDK contract split into Reader and Producer classes

**What changed:** [spec/moca-sdk-contract.md](spec/moca-sdk-contract.md) now
defines two conformance classes (§1.2). The eight existing capabilities are
the **Reader** class. Manifest creation (§4.3) is no longer required of every
SDK; it moves to the **Producer** class, together with integrity production and
archive writing (§2.2), and optional signing (§7.4) and sidecar building
(§10.1). A conformance claim must now name its class (§14).

**Why this is listed here:** contract §13 treats any change to *required* SDK
behaviour as breaking for implementers.

**What you should do:**

- If you implement the contract, state whether you are a Reader or a Producer.
  A Knowledge Harness is a Reader.
- If you are a Reader, you may drop manifest creation. Nothing else changes:
  every existing conformance case is Reader-class.
- If you are a Producer, check the new §2.2, §7.4, and §10.1 requirements,
  which describe what the reference CLIs already do.

## Education profile moved out of this repository

**What changed:** `profiles/education/` graduated to
`openmoca/moca-profile-education`, and `examples/augmentation-scorm2004/` was
removed. The profile URI `https://openmoca.org/profiles/education/v1` is
unchanged.

**What you should do:**

- Nothing, if your package only *declares* the profile. Declarations are by
  URI, not repository path, and core §11.2 already requires a consumer to
  process an unrecognised profile's package as valid core.
- Update links to `profiles/education/…` to point at the new repository.

## `moca-lint` no longer checks `education:competencies` in skill metadata

**What changed:** `moca-lint`'s skills pass used to resolve CURIEs in a
`SKILL.md`'s `metadata.education:competencies` field against the package's
`@context` and ontologies, reporting `E202` or `E304` when they did not
resolve. It no longer inspects that field. `metadata.concepts` is still
checked.

**Why:** it was profile-specific linting in a core-only linter, which
[profiles/README.md](profiles/README.md) rules out.

**What you should do:** a package that failed only because of an unresolved
competency CURIE now passes. If you relied on the check, validate profile
metadata with the profile's own tooling.

## Composition example and conformance cases renamed

**What changed:** `examples/composition-members/` and
`conformance/fixtures/valid-composition-members/` are now a handbook with two
chapters: `course/` → `handbook/`, `module-1/` → `chapter-1/`, and
`module-2/` → `chapter-2/`, with new package IDs and content. The conformance
cases were renamed to match (`valid-composition-members__handbook.json`,
`__chapter-1.json`, `__chapter-2.json`), and the `opaque-profile-data` fixture
now carries EU AI Act data. Expected codes and outcomes are unchanged.

**What you should do:** if your conformance runner pins case names, update the
three names. Runners that read every `cases/*.json` need no change.

## Specification documents moved to `spec/`, schemas to `schemas/v1/`

**What changed:** The three normative documents moved out of the repository
root and `docs/`, and the schema directory gained a version segment:

| Before | After |
|---|---|
| `moca-core-spec.md` | `spec/moca-core-spec.md` |
| `docs/sidecar-index-spec.md` | `spec/moca-sidecar-index-spec.md` |
| `docs/trust-model.md` | `spec/moca-trust-model.md` |
| `schemas/core/` | `schemas/v1/core/` |

Schema `$id` URIs changed correspondingly, and the one schema that used a
different host (`https://spec.openmoca.org/...` for the sidecar index) was
unified onto `https://openmoca.org/...`:

| Before | After |
|---|---|
| `https://openmoca.org/schemas/core/moca.schema.json` | `https://openmoca.org/schemas/v1/core/moca.schema.json` |
| `https://spec.openmoca.org/schemas/core/sidecar-index.schema.json` | `https://openmoca.org/schemas/v1/core/sidecar-index.schema.json` |
| `https://openmoca.org/schemas/<profile>/profile.schema.json` | `https://openmoca.org/schemas/v1/<profile>/profile.schema.json` |

**Why this is listed here and not only in the changelog:** the trust-model
path is not merely a documentation link. It is embedded in `moca-lint`'s
*normative* finding summaries — `E404_SIGNATURE_MALFORMED` and
`E407_SIGNATURE_VERIFICATION_INDETERMINATE` both cite it — and in
`moca-lint`/`moca-sign` `--help` text. Any consumer matching on those strings
sees a changed message.

**What you should do:**

- If you pin `$schema` in your `moca.json`, update it to the `/v1/` URI. This
  is cosmetic for validation (the schema is resolved locally by `moca-lint`),
  but keeps your manifest pointing at the identifier that will be a `1.0.0`
  compatibility commitment.
- If you parse `moca-lint` finding *summaries* as strings, stop — match on the
  finding `code` instead. Codes are stable; summary prose is not.
- If you link to the specification from your own documentation, update the
  paths above.

**Note:** changing `$schema` edits the manifest, which invalidates
`canonicalDigest` and therefore any `signature`. See
[spec/moca-trust-model.md §2.1](spec/moca-trust-model.md#21-any-manifest-edit-is-a-re-signing-event).

## `moca-lint` no longer validates `profileData` against profile schemas

**What changed:** `moca-lint` narrowed its scope to MOCA Core conformance
and structural checks. It no longer inspects or validates a package's
`profileData.<profile-name>` object against that profile's own
`profile.schema.json` (see [CHANGELOG.md](CHANGELOG.md), "Narrowed
repository validation to MOCA Core conformance and structural checks").
`profileData` content is now treated as opaque to core-only validation,
consistent with
[tools/moca-lint/README.md](tools/moca-lint/README.md#profile-support).

**Who's affected:** Anyone who relied on a clean `moca-lint lint` run as
evidence that a package's `profileData` matched its declared profile's
schema.

**What to do:** If you need that check, use (or build) profile-specific
validation tooling instead — profile owners MAY ship or link to their own
validator, as documented in [profiles/README.md](profiles/README.md).
`moca-lint` continues to validate everything else about a profiled package
unchanged: the core manifest schema, content/referential-integrity checks,
and (per [core §11.4](spec/moca-core-spec.md#114-profile-restrictions)) that a
profile stays additive at the structural level `moca-lint` can see.

**No action needed if:** your package doesn't declare a `profile`, or you
were already relying on separate profile-specific tooling rather than
`moca-lint` for `profileData` validation.

## `moca-lint` now cryptographically verifies `signature`, retiring `I404`

**What changed:** Pass 4's `I404_SIGNATURE_NOT_VERIFIED` informational code
(present but not implemented) is retired. `moca-lint` now performs real
Sigstore/DSSE verification via [`tools/moca-sign`](tools/moca-sign/README.md),
per [spec/moca-trust-model.md](spec/moca-trust-model.md), and reports one of three new
hard-error codes when a `signature` object is present but does not verify:
`E404_SIGNATURE_MALFORMED`, `E406_SIGNATURE_INVALID`,
`E407_SIGNATURE_VERIFICATION_INDETERMINATE`. `E401_UNSIGNED_SKILLS` (no
`signature` object at all) is unchanged. See [CHANGELOG.md](CHANGELOG.md).

A related, additive change: `canonicalDigest` (core §5.5) now excludes the
`signature` property from its manifest hash, the same self-reference reason
it already excluded `canonicalDigest` itself — a signature signs over
`canonicalDigest.value`, so that value cannot depend on the signature being
computed from it. No previously-shipped example combined both fields before
this release, so no existing `canonicalDigest.value` changes as a result.

**Who's affected:** Any package with a `signature` object — most commonly
one containing `skills/`, since core §8.2 requires `signature` there.

**What to do:**

- A signed package MUST also declare `canonicalDigest` (spec/moca-trust-model.md
  §2); a `signature` without one now reports `E404_SIGNATURE_MALFORMED`.
- Pass `--trust-root <path>` (and, for `sigstore` mode, optionally
  `--identity-constraint`) to `moca-lint lint`/`pack`/`extract --lint` — a
  `dsse`-mode signature reports `E406_SIGNATURE_INVALID` without one.
- A package still carrying the placeholder value
  `"PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST"` (this repo's own
  examples used it prior to this release) now fails with
  `E404_SIGNATURE_MALFORMED` instead of only the previously-informational
  `I404`. Sign it for real with `moca-sign` (see
  [tools/moca-sign/README.md](tools/moca-sign/README.md)).

**No action needed if:** your package declares no `signature` object at all
(a package without `skills/` is never required to have one).
