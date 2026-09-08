# [Tool] Formalize the `moca-lint` Validation Contract

## Roadmap context

[ROADMAP.md item 5](../ROADMAP.md#5-open-source-cli-application-and-developer-tooling)
has a dedicated subsection, "moca-lint Validation Contract":

> Treat `moca-lint` as an independently versioned validation contract
> within the CLI ecosystem.
>
> - Define which schema, package-boundary, integrity, profile, and
>   conformance checks are normative for each release.
> - Treat schema or lint errors that allow invalid manifests to pass as
>   security-sensitive issues, consistent with `SECURITY.md`.
> - Track contract changes explicitly in `CHANGELOG.md`, including the
>   existing change that removed profile-owned `profileData` validation and
>   added path-boundary checks.
> - Keep profile-specific linting out of this repository's core linter;
>   profile owners may provide separate validation tooling as documented
>   in `profiles/README.md`.
> - Publish compatibility fixtures and migration notes when validation
>   behavior changes.

This is not a proposal for a new tool — `moca-lint` (`tools/moca-lint/`)
already exists and already satisfies some of these bullets. This proposal
scopes only the parts that are genuinely missing, so it can be picked up
independently of `moca-convert`, `moca-pack`, and `moca-index`.

## Current state (what's already satisfied)

- **Profile-specific linting stays out of core.** Already true and
  enforced by a test:
  `tools/moca-lint/test/profiles.test.js` — "profileData is opaque to
  core-only validation" — and documented in
  `tools/moca-lint/README.md` "Profile support" and
  [profiles/README.md](../profiles/README.md).
- **Findings are documented per check.** `tools/moca-lint/lib/codes.js`
  is the finding-code registry; `tools/moca-lint/README.md` documents each
  of the four validation passes (`E101`–`E106`, `E201`–`E210`,
  `E301`/`E303`/`E304`/`I301`, `E401`–`E403`/`E405`/`I404`), default
  severities, and exit codes (0/1/2).
- **Known gaps are documented, not silently absent.**
  `tools/moca-lint/README.md` "Known limitations (v1)" already lists SHACL
  (`E302`), signature verification (`I404`), the `ro-crate-metadata.json`
  heuristic (`E405`), and the single-target-directory `composition` gap.
- **`SECURITY.md` already treats schema errors as security-sensitive**
  in general terms ("Errors in `schemas/` that would let an invalid or
  malicious `moca.json` pass validation").
- **Some contract changes are already recorded in `CHANGELOG.md`**, e.g.
  the `[Unreleased]` entry: "Narrowed repository validation to MOCA Core
  conformance and structural checks; `moca-lint` no longer validates
  profile-owned `profileData` against profile schemas."

## What's missing

1. **No explicit "normative for this release" declaration.** The README
   documents *what each check currently does*, but nothing states which
   checks are binding commitments a consumer can rely on for release
   `0.1.0-beta.N` versus which are provisional/heuristic and may change
   without a major-version-style signal. `tools/moca-lint/README.md`
   "Default severity" comes closest (it explains *why* `E203`/`E303`/
   `E304`/`E403`/`E405` default to warning) but that's a design rationale,
   not a release-scoped compatibility commitment.
2. **`SECURITY.md` doesn't yet mention `moca-lint` findings themselves**,
   only schema errors. A regression where an error-severity `moca-lint`
   check (e.g. `E402` integrity mismatch, or `E401` skills-without-
   signature) stops firing on a manifest that should fail it is the same
   class of security-sensitive false negative as a schema gap, but
   `SECURITY.md`'s "Scope" section doesn't say so explicitly.
3. **No published, consumer-facing compatibility fixture corpus.**
   `tools/moca-lint/test/fixtures/` exists and is exercised by
   `tools/moca-lint/test/broken-fixtures.test.js`, but it's framed as
   internal test data for this repository's own suite, not as a published,
   versioned corpus other implementers (e.g. someone writing an
   alternative or IDE-integrated linter against the same contract) can
   pull and check their own implementation against.
4. **No migration notes mechanism distinct from `CHANGELOG.md` prose.**
   The roadmap asks for "migration notes when validation behavior
   changes," which for a *behavioral* change (a finding that used to pass
   now fails, or vice versa) is a different kind of artifact than a
   `CHANGELOG.md` bullet: it needs to tell an existing package author what
   to do about it, not just what changed.

## Proposed change

1. **Add a "Validation Contract" section to `tools/moca-lint/README.md`**
   stating, per release, which finding codes are normative (binding,
   covered by semver-style compatibility expectations for the `0.x` beta
   per `docs/versioning-and-release.md`) versus explicitly provisional
   (the codes already listed under "Known limitations," which may change
   behavior — e.g. `E302` going from "not evaluated" to "evaluated" — in a
   later beta without that being treated as a breaking contract change).
   This is documentation-only; it does not change any check's current
   behavior.
2. **Extend `SECURITY.md` "Scope"** to explicitly include: "A `moca-lint`
   error-severity check that fails to flag a manifest or package it
   should reject (a false negative in `E1xx`–`E4xx`), in addition to the
   schema errors already listed above." This makes the roadmap's "treat
   schema or lint errors ... as security-sensitive" bullet literally true
   in the document it references, rather than only in the roadmap.
3. **Document `tools/moca-lint/test/fixtures/` as the compatibility
   fixture corpus** in `tools/moca-lint/README.md`'s "Development"
   section: what each fixture demonstrates (already implicit in the test
   file's `describe` blocks — e.g. "excluded-properties fixture reports
   E103"), and that it is intended to be stable and diffable across
   releases so an external implementation can use it as a conformance
   suite. No new fixtures are required by this proposal; existing ones
   just get an explicit "this is a published contract" framing.
4. **Add a `MIGRATIONS.md`** (at the repo root, alongside `CHANGELOG.md`)
   that starts empty except for one retroactive entry documenting the
   already-shipped `profileData`/path-boundary change referenced in the
   roadmap bullet, written from the affected user's point of view ("if
   your package relied on `moca-lint` validating `profileData` against a
   profile schema, that check no longer runs; profile owners should now
   provide separate validation tooling — see `profiles/README.md`").
   Going forward, any change that flips an existing check's pass/fail
   outcome for a previously-valid or previously-invalid package gets an
   entry here, cross-linked from the corresponding `CHANGELOG.md` bullet.

## What this does not specify

- **No new finding codes.** This proposal is about documenting and
  formalizing the existing contract, not adding SHACL evaluation,
  signature verification, or full RO-Crate conformance — those stay
  tracked separately (`tools/moca-lint/README.md` "Known limitations,"
  and roadmap item 6 for signatures).
- **No contract version number distinct from `moca-lint`'s own
  `package.json` version.** `docs/versioning-and-release.md` already
  states the repository release and `moca-lint` release move together
  (`0.1.0-beta.1` for both); this proposal reuses that existing version,
  rather than introducing a second, separately-incrementing "contract
  version" the roadmap text doesn't actually ask for.
- **No automated cross-implementation conformance runner.** Publishing the
  fixture corpus (item 3) makes external conformance testing *possible*;
  building a shared test harness other implementations plug into is a
  larger effort better scoped alongside the SDK conformance work in
  `ROADMAP.md` item 7 ("Consistent behavior and conformance tests across
  languages"), not bundled here.

## Impact on existing conformance levels / profiles

None. This is documentation and process, not a behavior change — every
existing check keeps its current severity and semantics. No example
package, schema, or spec section changes.

## Alternatives considered

- **Do nothing further; treat the existing README + CHANGELOG coverage as
  sufficient.** Rejected: the roadmap subsection lists five distinct
  bullets, and two of them (explicit per-release normative scoping,
  published migration notes) genuinely don't exist yet in a form a
  consumer could point to, as opposed to being inferable from reading the
  whole README and CHANGELOG history. Leaving this implicit undercuts the
  roadmap's own stated goal of `moca-lint` being "an independently
  versioned validation contract," which implies the contract is
  legible on its own, not just to someone who already knows the project's
  history.
- **Fold this into whichever PR next changes `moca-lint`'s behavior**,
  rather than doing it as its own change. Rejected: the missing pieces
  (contract framing, `SECURITY.md` wording, fixture-corpus framing,
  `MIGRATIONS.md` scaffolding with its one retroactive entry) are all
  documentation of the *current* state and don't depend on any pending
  behavior change, so there's no reason to block them on one.

## Implementation scope

If accepted, implementation touches only:

- `tools/moca-lint/README.md` (new "Validation Contract" section;
  "Development" section update documenting fixtures as a compatibility
  corpus).
- `SECURITY.md` (Scope section addition).
- New `MIGRATIONS.md` at the repo root, with one retroactive entry.
- `CHANGELOG.md` (cross-link to the new `MIGRATIONS.md` entry).

This proposal does not change `moca-core-spec.md`, `schemas/core/`, any
`tools/moca-lint/lib/` validation logic, or any example package.
