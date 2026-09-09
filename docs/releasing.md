# Releasing

The operational runbook for cutting a release and publishing to npm.

This is the **procedure**. The **policy** — what the version numbers mean, what
compatibility is promised, what `beta` commits you to — is
[versioning and release](versioning-and-release.md). Read that first if you are
deciding *whether* to release; read this if you have decided *to*.

## What a release consists of

Two separate artifacts that happen to be cut together:

| Artifact | What it is | Where it goes |
|---|---|---|
| **The specification snapshot** | `spec/`, `schemas/`, `profiles/`, `examples/`, `conformance/` | An annotated git tag. Nothing is published to a registry. |
| **The reference tooling** | Four CLIs under `tools/` | npm, under the `@openmoca` scope |

The repository root `package.json` is `"private": true` and is never published.
Only the four `tools/*` packages are publishable.

## One-time setup

Do these once, before the first publish ever happens.

### 1. Claim the namespace

The scope must exist before anything can be published into it, and the
unscoped names (`moca-lint`, `moca-index`) are plausible squat targets.

```sh
npm login
# Create the organisation at https://www.npmjs.com/org/create  (name: openmoca)
npm org ls openmoca            # confirm you are a member
```

Reserve the equivalent namespaces on **PyPI** and **NuGet** at the same time,
before the Python and .NET SDKs exist. Names are cheap now and contested later.

### 2. Enable 2FA and create a publish token

```sh
npm profile enable-2fa auth-and-writes
```

For CI publishing, create a **granular access token** scoped to the
`@openmoca` packages with *Read and write* permission — not a classic
automation token. Store it as the `NPM_TOKEN` repository secret.

### 3. Confirm each package is publishable

Every `tools/*/package.json` must already have this (they do — verify, don't
add blindly):

```jsonc
{
  "name": "@openmoca/moca-lint",
  "publishConfig": { "access": "public" },  // scoped packages are private by default
  "files": ["bin/", "lib/", "README.md"],
  "repository": { "type": "git", "url": "git+https://github.com/openmoca/moca-spec.git",
                  "directory": "tools/moca-lint" }
}
```

`publishConfig.access` matters: **a scoped package publishes as restricted
unless told otherwise**, and a restricted package on a free account fails to
publish at all.

## Publish order

The tools depend on each other, so publish in dependency order. Publishing out
of order does not fail — npm does not verify that a dependency resolves — but
it leaves a window in which a published package cannot be installed.

```text
1. @openmoca/moca-sign      (depends on nothing in the scope)
2. @openmoca/moca-lint      (→ moca-sign)
3. @openmoca/moca-convert   (→ moca-lint)
4. @openmoca/moca-index     (→ moca-lint, moca-sign)
```

`moca-convert` and `moca-index` are independent of each other and can go in
either order.

## Pre-flight

Everything here must pass before a tag is created. Stop at the first failure;
do not publish "and fix it after".

```sh
# 1. Clean install from the lockfile, exactly as CI does
rm -rf node_modules && npm ci

# 2. Everything: validators, conformance suite, link check, all four test suites
npm test

# 3. Confirm derived artifacts are current (digests, signatures, sidecar binding)
npm run validate:derived

# 4. Confirm nothing unexpected is about to be shipped
for t in moca-sign moca-lint moca-convert moca-index; do
  echo "--- @openmoca/$t"; (cd tools/$t && npm pack --dry-run 2>&1 | grep -E "name:|files:|size:")
done
```

Then the check that actually matters, because it is the one that has caught
real breakage: **install the packed tarballs into an empty project and run
them.** A package can pass every test in the workspace and still be broken once
installed, because a published tarball contains only what `files` lists.

```sh
SCRATCH=$(mktemp -d)
for t in moca-sign moca-lint moca-convert moca-index; do
  (cd tools/$t && npm pack --pack-destination "$SCRATCH" >/dev/null)
done
cd "$SCRATCH" && npm init -y >/dev/null && npm install ./openmoca-moca-*.tgz

mkdir -p src && printf '# Note\n\nBody.\n' > src/a.md
B=./node_modules/.bin
$B/moca-convert src -o pkg --id urn:moca:release:check --title "Release check"
$B/moca-lint lint pkg
$B/moca-sign generate-key -o k --keyid release-check
$B/moca-sign sign pkg --mode dsse --key k.pem --keyid release-check
$B/moca-lint lint pkg --trust-root k.trust-root.json
$B/moca-index build pkg -o pkg.moca.idx
$B/moca-lint pack pkg -o out.moca --trust-root k.trust-root.json
$B/moca-lint extract out.moca -o roundtrip
cd - && rm -rf "$SCRATCH"
```

All eight steps must succeed. If any fails, the fix belongs in the packages —
not in this document.

## Versioning the workspace

All four tools and the repository currently move together. Bump them in one
step:

```sh
npm version 0.1.0-beta.2 --workspaces --no-git-tag-version
npm version 0.1.0-beta.2 --no-git-tag-version   # the root package
```

Then update the cross-dependency ranges in `tools/*/package.json` if the major
or minor changed, run `npm install` to refresh the lockfile, and re-run
`npm test`.

Record what changed in [CHANGELOG.md](../CHANGELOG.md), and anything that
alters existing packages' behaviour in [MIGRATIONS.md](../MIGRATIONS.md).

## Publishing

### Dist-tags: use `--tag beta` while pre-1.0

`npm publish` assigns the **`latest`** dist-tag by default — including for a
prerelease version like `0.1.0-beta.2`. Publishing a beta without `--tag` makes
it the default install for everyone.

```sh
npm publish -w tools/moca-sign    --tag beta
npm publish -w tools/moca-lint    --tag beta
npm publish -w tools/moca-convert --tag beta
npm publish -w tools/moca-index   --tag beta
```

Verify afterwards:

```sh
npm dist-tag ls @openmoca/moca-lint
```

Consumers then install explicitly:

```sh
npm install @openmoca/moca-lint@beta
```

> **Consequence to be aware of:** until a stable release publishes a `latest`
> tag, a bare `npm install @openmoca/moca-lint` has no `latest` to resolve
> against. For a format that is explicitly pre-`1.0.0` with no compatibility
> guarantee, requiring `@beta` is arguably correct — it makes the maturity
> impossible to miss. If you would rather bare installs work, publish without
> `--tag` and accept that the beta becomes `latest`. Decide once and keep it
> consistent across all four packages.

At `1.0.0`, drop `--tag beta` so the stable release becomes `latest`.

### Publishing from CI, with provenance

Recommended over publishing from a laptop, and thematically apt for a project
whose subject matter is signing and attestation: **npm provenance** publishes a
signed, Sigstore-backed attestation linking the tarball to the commit and
workflow that built it.

It requires a public repository, `id-token: write`, and publishing from a
GitHub Actions workflow.

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write        # required for npm provenance
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm test
      # Dependency order matters — see "Publish order" above.
      - run: npm publish -w tools/moca-sign    --tag beta --provenance
      - run: npm publish -w tools/moca-lint    --tag beta --provenance
      - run: npm publish -w tools/moca-convert --tag beta --provenance
      - run: npm publish -w tools/moca-index   --tag beta --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Set `NODE_AUTH_TOKEN` on every publish step, not only the last — the example
above is deliberately shown as it is commonly got wrong.

## Tagging

Create the annotated tag **only after** pre-flight passes, and push it after
publishing succeeds:

```sh
git tag -a v0.1.0-beta.2 -m "MOCA 0.1.0-beta.2"
git push origin v0.1.0-beta.2
```

If CI publishes on tag push, push the tag *instead of* publishing manually —
not as well.

Then create the GitHub Release from the tag, with the `CHANGELOG.md` section
for that version as the body.

## Post-publish verification

Install from the **registry**, not from a tarball, in a clean directory:

```sh
cd "$(mktemp -d)" && npm init -y >/dev/null
npm install @openmoca/moca-lint@beta
./node_modules/.bin/moca-lint --version      # must print the version you just published
npm view @openmoca/moca-lint dist-tags
npm view @openmoca/moca-lint files
```

> `moca-lint`, `moca-sign`, and `moca-index` report their own version with
> `--version`. **`moca-convert` uses `--cli-version`**, because its
> `--version <semver>` already sets the *generated package's* version and
> redefining it would be a breaking CLI change.

Confirm the version, the dist-tag, and that provenance appears on the package
page if you published with `--provenance`.

## If something is wrong after publishing

**Do not unpublish.** npm permits unpublishing within 72 hours under
conditions, but it breaks anyone who already installed, and the version number
is burned permanently either way.

Publish a fix as a new version, then mark the bad one:

```sh
npm deprecate @openmoca/moca-lint@0.1.0-beta.2 "Broken packaging; use 0.1.0-beta.3"
```

If a secret was published, treat it as compromised and rotate it — removing the
tarball does not undo disclosure.

## Checklist

```text
One-time
  [ ] @openmoca org created on npm (and PyPI, NuGet)
  [ ] 2FA enabled; granular token stored as NPM_TOKEN
  [ ] publishConfig.access = "public" on all four packages

Every release
  [ ] rm -rf node_modules && npm ci
  [ ] npm test                          (validators + conformance + 4 suites)
  [ ] npm run validate:derived          (digests/signatures current)
  [ ] npm pack --dry-run reviewed for all four
  [ ] tarball install smoke test — all 8 CLI steps pass
  [ ] versions bumped across workspaces + root; lockfile refreshed
  [ ] CHANGELOG.md updated; MIGRATIONS.md if behaviour changed
  [ ] publish in dependency order: sign → lint → convert, index
  [ ] --tag beta while pre-1.0
  [ ] npm dist-tag ls verified for each package
  [ ] annotated git tag created and pushed
  [ ] GitHub Release created from the tag
  [ ] installed from the registry in a clean directory and run
  [ ] --version on each CLI reports the published version
      (moca-convert: --cli-version)
```

## Not yet applicable

The Python and .NET SDKs do not exist. When they do, this document gains a
PyPI section (`build`, `twine`, trusted publishing) and a NuGet section, and
the "publish order" section grows to cover cross-language release coordination
against a shared [conformance suite](../conformance/README.md) version.
