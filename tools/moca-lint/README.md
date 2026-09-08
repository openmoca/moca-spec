# moca-lint

Static analysis CLI for [MOCA](../../moca-core-spec.md) package directories and
`.moca`/`.zip` archives. It runs offline by default (`--online-verify` is the
one opt-in exception, for live Sigstore/Rekor checks — see
[docs/trust-model.md](../../docs/trust-model.md) §5) and never executes
package content, and checks a package against `moca-core-spec.md`, the
JSON Schemas in [`schemas/`](../../schemas), and referential-integrity rules
that the schemas alone can't express (e.g. dangling concept references,
locale fallback, the `skills/` + `signature` rule and its cryptographic
verification via [`moca-sign`](../moca-sign/README.md)).

## Install

From the repo root (moca-lint is an npm workspace):

```sh
npm install
```

This links the `moca-lint` binary via the workspace. You can then run it as:

```sh
npx moca-lint --help
# or, once installed:
npm run lint:moca
```

## Usage

### Lint

```sh
moca-lint lint <target> [<target> ...] [options]
```

`<target>` is a package directory, or a `.moca`/`.zip` archive (extracted to
a temp directory for analysis). Multiple targets can be linted in one call.

```sh
moca-lint lint examples/level-2-semantic
moca-lint lint examples/*                 # lint every example package
moca-lint lint dist/my-package.moca
```

### Pack

```sh
moca-lint pack <target> -o <out.moca> [options]
```

Lints `<target>` first and **refuses to write the archive if any
error-severity finding is present** (fail-closed). On success, zips the
directory with `moca.json` at the archive root.

```sh
moca-lint pack examples/level-2-semantic -o level-2-semantic.moca
moca-lint pack ./my-package -o out.moca --exclude "*.draft.md" "notes/**"
```

`-o/--out` defaults to `<target-dirname>.moca` in the current directory if
omitted. `--exclude` adds extra glob patterns on top of the built-in
`.git/`, `node_modules/`, and `.DS_Store` excludes.

### Extract

```sh
moca-lint extract <archive> -o <dest-dir> [options]
```

Extracts a `.moca`/`.zip` archive to a directory of your choosing, using the
same hardened extraction path (entry-count/uncompressed-size caps, `..`
entry-name rejection) `lint`/`pack` already use internally when reading an
archive target — use this instead of a generic unzip tool for that reason.
Refuses to extract into a destination that already exists and is non-empty
unless `--force` is passed.

```sh
moca-lint extract dist/my-package.moca -o my-package
moca-lint extract dist/my-package.moca -o my-package --force   # overwrite
```

Unlike `pack`, extraction is **not** fail-closed on content validity by
default — inspecting a package that fails `lint` is itself a legitimate
reason to extract it. Pass `--lint` to run `lint` against the extracted
directory afterward and report findings:

```sh
moca-lint extract dist/my-package.moca -o my-package --lint
```

## Options

| Option | Description |
|---|---|
| `--strict` | Escalate warning-level findings to errors (affects the exit code). |
| `--format <fmt>` | `text` (default, human-readable), `json`, or `sarif` (for GitHub code-scanning annotations). |
| `--report <file>` | Write the formatted report to a file. With `--format text`, the report is also still printed to the console. |
| `--log-file <file>` | Append a full debug trace (per-pass timings) to a file, independent of `--verbose`. |
| `-v, --verbose` | Increase console trace output (repeatable: `-vv`). |
| `-q, --quiet` | Suppress non-error console output. |
| `--no-color` | Disable colored text output. |
| `--trust-root <path>` | dsse mode: a `trust-roots.json` file; sigstore mode: a pinned TUF cache directory. See [docs/trust-model.md](../../docs/trust-model.md) §4. Required to verify any `dsse`-mode signature. |
| `--identity-constraint <issuer>=<pattern>` | Repeatable. sigstore mode only: restrict accepted signer identities (§4.1). |
| `--online-verify` | sigstore mode only: confirm live Rekor transparency-log inclusion and refresh the trust root before verifying (§5). |
| `--allow-offline-fallback` | sigstore mode only: if `--online-verify` can't reach the network, degrade to offline verification instead of failing closed. |

## Exit codes

- `0` — no error-severity findings (for `lint`/`pack`/`extract --lint`), or a
  plain `extract` completed successfully (it doesn't lint by default, so `0`
  there means "extracted," not "found no issues").
- `1` — one or more error-severity findings (or warnings escalated by
  `--strict`) for `lint`/`pack`/`extract --lint`.
- `2` — CLI usage error (bad target/archive path, missing `-o/--out`, a
  non-empty `extract` destination without `--force`, etc.).

## Validation passes & finding codes

Findings run across four passes, matching the package structure in
[core §4](../../moca-core-spec.md#4-logical-package-structure) /
[§5](../../moca-core-spec.md#5-package-manifest-mocajson-specification):

| Pass | Codes | What it checks |
|---|---|---|
| 1. Manifest | `E101`–`E106` | `moca.json` exists, conforms to `schemas/core/moca.schema.json` (+ any declared profile's `schemas/<profile>/profile.schema.json`, auto-discovered from the profile URI — see [Profile support](#profile-support)), has no forbidden keys, valid inline `@context` prefixes, no profile data misplaced at the root, and no remote `@context` in Level 1. |
| 2. Content | `E201`–`E210` | Frontmatter YAML syntax, concept/predicate CURIEs resolve to a declared namespace, `evidence[].source` files exist and `locator` shape is valid, `epistemicStatus` is in the core or active-profile vocabulary, locale-suffixed files have a default fallback, no duplicate content-node `id`s, `claims[]` has required fields, `SKILL.md` frontmatter is well-formed. |
| 3. Semantic | `E301`, `E303`, `E304`, `I301` | JSON-LD/Turtle syntax in `ontologies/`, within-package duplicate/conflicting concept declarations, concept (and predicate/skill-metadata) references that don't resolve to any declared `@id`. |
| 4. Security | `E401`–`E407` | `skills/` requires a `signature` object; a present `signature` is cryptographically verified against `canonicalDigest` via [`moca-sign`](../moca-sign/README.md) (`E404`/`E406`/`E407` — see [docs/trust-model.md](../../docs/trust-model.md) §6); SHA-256 `integrity` map matches files on disk; RO-Crate/BagIt hash cross-check; minimal `ro-crate-metadata.json` structural validity. |

Run `moca-lint lint <target> --format json` and inspect `findings[].code`, or
read [lib/codes.js](lib/codes.js) for the full registry with one-line
summaries.

**Default severity:** most codes are hard errors. `E203`, `E303`, `E304`,
`E403`, and `E405` default to `warning` (they rely on heuristics that can
have legitimate exceptions, e.g. a documentation fixture intentionally
omitting a media asset, or a predicate CURIE that's a property rather than a
declared concept) and only become errors under `--strict`. `E210` is also a
`warning` by default for a different reason (see below). `I301` is always
informational and never affects the exit code. `E404`/`E406`/`E407`
(signature malformed/invalid/indeterminate) are hard errors, matching
core §8.2's "refuse to load" requirement — there is no lesser severity for
a signature that doesn't verify.

## Profile support

[core §11](../../moca-core-spec.md#11-profiles) lets a package declare zero
or more **profiles** (e.g. `"profile": ["https://openmoca.org/profiles/education/v1"]`)
that additively extend core vocabulary. moca-lint handles profiles as follows:

- **Generic, works for any profile automatically:** namespace/CURIE
  resolution (`E202`, `E304`), ontology parsing (`E301`, `E303`) — these are
  driven entirely by `moca.json`'s own `@context`/`ontologies`, not by any
  hardcoded profile knowledge.
- **Profile data is opaque:** moca-lint validates only the core schema and does
  not inspect or validate `profileData.<name>` against a profile schema.
  Profile owners MAY ship or link to separate validation tooling for their
  profile-specific requirements.
- **Profile epistemic-status vocabularies are opaque:** Per
  [core §11.2](../../moca-core-spec.md#112-graceful-degradation), moca-lint
  can't prove a status value is invalid under a declared profile, so an
  unknown `epistemicStatus` in a profiled package is reported as `E210`
  (**warning**, not `E204`
  error) instead of being rejected outright.

## Known limitations (v1)

- **SHACL shape validation (`E302`) is not implemented.** `ontologies/*.shacl.ttl`
  is syntax-checked (`E301`) but shape conformance isn't evaluated yet; a
  shapes ontology declared in `moca.json` produces an `I301` note instead.
- **`sigstore`-mode signature *signing* is not exercised by this repo's own
  test suite**, since it requires a real OIDC identity token and network
  access to Fulcio/Rekor — see
  [tools/moca-sign/README.md](../moca-sign/README.md#known-limitations).
  `sigstore`-mode *verification* (what `moca-lint` runs) has no such
  limitation.
- **`ro-crate-metadata.json` validation (`E405`) is a minimal structural
  heuristic, not full RO-Crate 1.3 conformance checking** (core §2.1) — it
  only checks for a `@context`, a `@graph` array, a metadata descriptor
  entity, and a root data entity.
- Conformance level is not declared in `moca.json` or selected on the command
  line. It is derived from validated package capabilities. The current CLI
  does not yet print a derived level; the pass results remain the authoritative
  detail about which requirements were satisfied.
- `.moca`/`.zip` extraction rejects archives over 20,000 entries or 512MB
  uncompressed, and entries containing `..`, as a defense-in-depth measure
  against zip bombs and path traversal.
- **`composition` (core §10) is only validated within a single target
  directory.** `moca-lint` lints one package at a time, so it cannot detect
  a cycle across `composition.members`/`relates` (package A includes B
  which includes A) or a dangling reference to a package `id` that doesn't
  resolve anywhere. This requires a multi-package/workspace lint mode that
  does not exist yet; it's tracked for the MCP-adapter reference
  implementation phase (see `ROADMAP.md`), not left indefinitely
  deferred.

## Validation Contract

`moca-lint` is treated as an independently versioned validation contract,
per [ROADMAP.md](../../ROADMAP.md#delivered),
released in lockstep with the repository (`0.1.0-beta.1` for both, per
[docs/versioning-and-release.md](../../docs/versioning-and-release.md)).

**Normative for this release:** every finding code in
[Validation passes & finding codes](#validation-passes--finding-codes)
above, at its documented default severity, **except** the codes listed
under [Known limitations (v1)](#known-limitations-v1) — `E302` (SHACL shape
conformance) and `E405` (full RO-Crate conformance) — which are explicitly
provisional: their current behavior (not evaluated / minimal heuristic) MAY
change in a later `0.x` beta release without that being treated as a
breaking contract change. The multi-package `composition` gap (no
cross-directory cycle/dangling-reference detection) is likewise provisional
and tracked separately. `E404`/`E406`/`E407` (signature
malformed/invalid/indeterminate) are normative as of this release —
`moca-lint` performs real cryptographic verification, superseding the
previous `I404_SIGNATURE_NOT_VERIFIED` informational code, which is
retired; see [MIGRATIONS.md](../../MIGRATIONS.md). Every other code is a
binding compatibility commitment for the current beta: a package that
passes (or fails) a normative check today is expected to keep passing (or
failing) it across patch and minor releases of this `0.x` line, absent an
entry in [MIGRATIONS.md](../../MIGRATIONS.md).

A `moca-lint` error-severity check that fails to flag a manifest or package
it should reject is treated as a security-sensitive issue, the same as a
gap in `schemas/` — see [SECURITY.md](../../SECURITY.md).

Any change that flips an existing check's pass/fail outcome for a
previously-valid or previously-invalid package is recorded in both
[CHANGELOG.md](../../CHANGELOG.md) (what changed) and
[MIGRATIONS.md](../../MIGRATIONS.md) (what an affected package author
should do about it) — see, for example, the `profileData` validation
removal already recorded there.

## Development

```sh
cd tools/moca-lint
npm test              # node --test test/*.test.js
```

Tests assert zero error-severity findings against every package under
[`examples/`](../../examples) (with `--strict` fixtures covering the known,
documented gaps in `level-3-extended` and `education-profile`), plus a few
deliberately-broken fixtures under [test/fixtures/](test/fixtures).

The fixtures under [test/fixtures/](test/fixtures) double as this
contract's compatibility corpus: each is a minimal package demonstrating
one specific finding (e.g. `excluded-properties` → `E103`,
`duplicate-node-id` → `E207`). They're intended to stay stable and
diffable release over release, so an independent implementation of this
same validation contract (an alternative or IDE-integrated linter) can use
them as a conformance suite, not just as this repository's own internal
test data.
