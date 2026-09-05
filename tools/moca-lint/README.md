# moca-lint

Static analysis CLI for [MOCA](../../moca-core-spec.md) package directories and
`.moca`/`.zip` archives. It runs entirely offline — no network calls, no
script execution — and checks a package against `moca-core-spec.md`, the
JSON Schemas in [`schemas/`](../../schemas), and referential-integrity rules
that the schemas alone can't express (e.g. dangling concept references,
locale fallback, the `skills/` + `signature` rule).

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
| `--online-verify` | Reserved for live Sigstore/Rekor verification. Accepted but not implemented (see [Known limitations](#known-limitations-v1)). |

## Exit codes

- `0` — no error-severity findings.
- `1` — one or more error-severity findings (or warnings escalated by `--strict`).
- `2` — CLI usage error (bad target path, unreadable archive, etc.).

## Validation passes & finding codes

Findings run across four passes, matching the package structure in
[core §4](../../moca-core-spec.md#4-logical-package-structure) /
[§5](../../moca-core-spec.md#5-package-manifest-mocajson-specification):

| Pass | Codes | What it checks |
|---|---|---|
| 1. Manifest | `E101`–`E106` | `moca.json` exists, conforms to `schemas/core/moca.schema.json` (+ any declared profile's `schemas/<profile>/profile.schema.json`, auto-discovered from the profile URI — see [Profile support](#profile-support)), has no forbidden keys, valid inline `@context` prefixes, no profile data misplaced at the root, and no remote `@context` in Level 1. |
| 2. Content | `E201`–`E210` | Frontmatter YAML syntax, concept/predicate CURIEs resolve to a declared namespace, `evidence[].source` files exist and `locator` shape is valid, `epistemicStatus` is in the core or active-profile vocabulary, locale-suffixed files have a default fallback, no duplicate content-node `id`s, `claims[]` has required fields, `SKILL.md` frontmatter is well-formed. |
| 3. Semantic | `E301`, `E303`, `E304`, `I301` | JSON-LD/Turtle syntax in `ontologies/`, within-package duplicate/conflicting concept declarations, concept (and predicate/skill-metadata) references that don't resolve to any declared `@id`. |
| 4. Security | `E401`–`E403`, `E405`, `I404` | `skills/` requires a `signature` object, SHA-256 `integrity` map matches files on disk, RO-Crate/BagIt hash cross-check, minimal `ro-crate-metadata.json` structural validity. |

Run `moca-lint lint <target> --format json` and inspect `findings[].code`, or
read [lib/codes.js](lib/codes.js) for the full registry with one-line
summaries.

**Default severity:** most codes are hard errors. `E203`, `E303`, `E304`,
`E403`, and `E405` default to `warning` (they rely on heuristics that can
have legitimate exceptions, e.g. a documentation fixture intentionally
omitting a media asset, or a predicate CURIE that's a property rather than a
declared concept) and only become errors under `--strict`. `E210` is also a
`warning` by default for a different reason (see below). `I301` and `I404`
are always informational and never affect the exit code.

## Profile support

[core §10](../../moca-core-spec.md#10-profiles) lets a package declare zero
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
  [core §10.2](../../moca-core-spec.md#102-graceful-degradation), moca-lint
  can't prove a status value is invalid under a declared profile, so an
  unknown `epistemicStatus` in a profiled package is reported as `E210`
  (**warning**, not `E204`
  error) instead of being rejected outright.

## Known limitations (v1)

- **SHACL shape validation (`E302`) is not implemented.** `ontologies/*.shacl.ttl`
  is syntax-checked (`E301`) but shape conformance isn't evaluated yet; a
  shapes ontology declared in `moca.json` produces an `I301` note instead.
- **Signature verification (`I404`) is not implemented.** `moca-lint` only
  checks that a `signature` object is structurally present when `skills/`
  exists (`E401`); it does not verify Sigstore/DSSE signatures. `--online-verify`
  is reserved for a future live-verification mode.
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

## Development

```sh
cd tools/moca-lint
npm test              # node --test test/*.test.js
```

Tests assert zero error-severity findings against every package under
[`examples/`](../../examples) (with `--strict` fixtures covering the known,
documented gaps in `level-3-extended` and `education-profile`), plus a few
deliberately-broken fixtures under [test/fixtures/](test/fixtures).
