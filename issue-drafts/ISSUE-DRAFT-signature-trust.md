# [Spec+Tooling] Signature & Trust Infrastructure

## Precondition — satisfied

The signature envelope design below binds to `canonicalDigest` (core §5.5),
which **roadmap item 3 (Canonical Package Hashing) is complete**. The
canonical-hashing issue draft explicitly left "whether a future Level 3
signature signs over `canonicalDigest` versus the full archive" as an open
follow-up; this proposal resolves it (see "What this signs over" below).

## Affected section(s)

- `moca-core-spec.md` §8.2 and §5.1 — add a cross-reference to a new
  `docs/trust-model.md`, matching the existing pattern where §5.5/§9 point to
  standalone docs (`sidecar-index-spec.md`) for operational detail instead of
  inlining it into core. No normative rule in §8.2/§3.1 changes.
- `docs/trust-model.md` (new) — the signer/verifier trust model: envelope
  shape, DSSE-over-`canonicalDigest` binding, `dsse` vs `sigstore` modes,
  trust-root configuration, identity constraints, offline/online
  verification behavior, revocation handling, key rotation guidance.
- `tools/moca-sign` (new workspace package) — reference signing and
  verification CLI + reusable library.
- `tools/moca-lint` — Security pass gains real cryptographic verification;
  new finding codes; `README.md` Validation Contract and Known Limitations
  sections updated.
- `tools/moca-lint/test/fixtures/signatures/` (new) — valid, invalid,
  missing, and placeholder signature fixtures.
- Three existing skill-bearing examples (`examples/level-3-extended`,
  `profiles/education/examples/education-profile`,
  `profiles/eu-ai-act/examples/eu-ai-act-profile`) — placeholder signatures
  replaced with real ones; READMEs updated.
- `package.json` (`lint:moca` script continues to pass once examples are
  re-signed), `.github/workflows/validate.yml`.
- `MIGRATIONS.md` (behavior change: an informational, unimplemented check
  becomes an enforced error) and `CHANGELOG.md`.

## Problem

Core §8.2/§3.1 already make `signature` mandatory for any package containing
`skills/`, but nothing in the repo can produce or check a real one:
`moca-lint`'s Security pass (`E401`) only confirms a `signature` object is
*structurally present* — the literal string
`"PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST"` satisfies it today. The
three existing skill-bearing examples ship exactly that placeholder, by
design, with README disclaimers. This is roadmap item 6, called out as "a
specification requirement without an implementation path."

## Proposed change

### What this signs over

`signature` binds to the package's `canonicalDigest.value` (core §5.5), not
to the raw archive. Concretely, an
[in-toto v1 Statement](https://github.com/in-toto/attestation) is the DSSE
payload:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [{
    "name": "urn:moca:example:course@2.0.0",
    "digest": { "sha256": "b17ef6d19c7a5b1ee83b907c595526dcb1eb06db8227d650d5dda0a9f4ce8dc" }
  }],
  "predicateType": "https://openmoca.org/attestations/package-signature/v1",
  "predicate": {}
}
```

This means a package with a `signature` MUST also declare a `canonicalDigest`
— signing has nothing else stable to bind to (an unsigned archive hash is not
reproducible; see the canonical-hashing issue draft). This is a new
conditional requirement layered on top of §8.2's existing rule, not a change
to §5.5 itself.

### Two signature modes, one existing schema

No `moca.schema.json` change is needed — `signature.type` (`"sigstore"` |
`"dsse"`), `.value`, `.keyid`, `.certificate` (already defined, core §5.1)
are sufficient carriers for both modes:

- **`type: "sigstore"`** — keyless signing via Fulcio (short-lived cert bound
  to an OIDC identity — e.g. a maintainer's email or a CI workload identity)
  and Rekor (transparency log). `value` holds a full
  [Sigstore Bundle](https://github.com/sigstore/protobuf-specs) (cert chain +
  DSSE envelope + Rekor inclusion proof), base64-encoded, so verification
  never has to re-derive proof material. This is the recommended default for
  any package signed in CI or by an individual maintainer.
- **`type: "dsse"`** — a raw DSSE envelope signed with a long-lived keypair,
  for offline/air-gapped signing or private-PKI orgs that can't or won't use
  Fulcio/OIDC. `certificate` or `keyid` identifies the key against a
  host-supplied trust-root file (see below). This mode is also what CI uses
  for this repo's own deterministic fixtures and re-signed examples, since a
  live Fulcio/Rekor round-trip is unsuitable for reproducible tests.

### Trust roots and identity constraints

- **`sigstore` mode:** defaults to Sigstore's public-good TUF trust root,
  fetched and cached via `sigstore-js`. `--trust-root <tuf-repo-dir>` pins a
  vendored copy for air-gapped verification. `--identity-constraint
  <issuer>=<SAN-pattern>` (repeatable) restricts which OIDC
  issuer/identity pairs are accepted — mirroring `cosign verify
  --certificate-oidc-issuer`/`--certificate-identity` — so a host can require
  "signed by someone `@example.org`" rather than accepting any valid
  keyless signature.
- **`dsse` mode:** `--trust-root <trust-roots.json>` supplies an explicit
  `keyid` → public key (+ optional identity label, optional expiry) map. A
  `keyid` absent from the supplied trust root fails closed.
- Core does not mandate either trust-root's contents; that's host security
  policy (consistent with the architecture's Application/Host layer owning
  identity and policy, core §1.1).

### Offline vs. online verification

- **Offline (default):** no network calls. `dsse` verification is always
  offline. `sigstore` verification checks the bundle's embedded cert chain
  against the locally pinned trust root and the embedded Rekor inclusion
  proof/checkpoint against a locally pinned Rekor public key — sufficient for
  reproducible CI and air-gapped hosts, but can't see anything published
  *after* the bundle was produced (e.g. a since-revoked cert, a rotated TUF
  root).
- **`--online-verify`:** additionally queries the live Rekor API to confirm
  transparency-log inclusion and refreshes the TUF trust root. On network
  failure, verification fails closed (new `E407`) unless
  `--allow-offline-fallback` is explicitly passed.
- Revocation: Sigstore's short-lived certs (minutes) make classic CRL/OCSP
  revocation largely moot — `--online-verify` picks up not-yet-cached
  incidents instead. For `dsse`, revocation is an `expires`/removal entry in
  the host's own `trust-roots.json`; core does not specify a revocation
  service.

### `moca-lint` Security pass changes

New finding codes (Pass 4, next unused numbers in the existing registry):

| Code | Severity | Meaning |
|---|---|---|
| `E404_SIGNATURE_MALFORMED` | error | `signature` present but not a parseable envelope for its declared `type`. |
| `E406_SIGNATURE_INVALID` | error | Envelope parses but verification fails: bad signature, digest/subject mismatch against `canonicalDigest`, or identity outside the supplied trust root/constraints. |
| `E407_SIGNATURE_VERIFICATION_INDETERMINATE` | error | `--online-verify` requested but the live check couldn't complete and `--allow-offline-fallback` wasn't passed. |

`E401_UNSIGNED_SKILLS` (no `signature` object at all) is unchanged.
`I404_SIGNATURE_NOT_VERIFIED` is retired — verification is now implemented,
so its "not implemented yet" meaning no longer applies. `--trust-root`,
`--identity-constraint`, `--online-verify`, and `--allow-offline-fallback`
flags pass through to `tools/moca-sign`'s exported verification function,
which `moca-lint` depends on as a workspace package rather than
reimplementing crypto.

### Conformance fixtures

Under `tools/moca-lint/test/fixtures/signatures/`, primarily `dsse` mode for
deterministic, network-free CI, plus one vendored real `sigstore` bundle
verified fully offline against a pinned trust-root snapshot:

- `valid-dsse/`, `valid-sigstore/` — pass cleanly.
- `invalid-tampered/` — valid envelope, resource bytes changed after
  signing → `canonicalDigest` mismatch → `E406`.
- `invalid-wrong-signer/` — valid signature, `keyid`/identity outside the
  test trust root → `E406`.
- `missing/` — `skills/` present, no `signature` key → `E401` (existing).
- `placeholder/` — today's literal placeholder string → `E404`, **not** a
  pass. This fixture is what proves the three existing examples must change.

## What this proposal does not specify

- A hosted/managed Rekor or Fulcio instance for this project — it uses the
  public-good Sigstore instance for `sigstore` mode.
- Non-JS/TS signing tooling (Python/.NET equivalents of `tools/moca-sign`)
  — left to roadmap item 7 (Core SDKs) once this design is stable.
- A revocation *service*; only the local trust-root shape each mode consults.

## Impact on existing conformance levels / profiles

No schema or Level 1/2 change. Level 3 gains a concrete, checkable meaning
for the `signature` requirement it already had on paper. The three existing
skill-bearing examples currently pass `moca-lint`'s structural `E401` check
only because verification didn't exist; once implemented they will fail
(`E404`, malformed placeholder) until re-signed. That is the intended
outcome — it is the gap this item exists to close — not a regression.

## Alternatives considered

- **Sign the raw `.moca` archive instead of `canonicalDigest`.** Rejected:
  archive bytes are sensitive to Zip entry order/compression/timestamps, so
  two byte-identical-content packages could need re-signing for no
  content reason — the same argument that motivated `canonicalDigest`
  itself (item 3).
- **Invent a bespoke envelope instead of DSSE + in-toto.** Rejected: DSSE and
  in-toto Statement are maintained standards with existing verifier
  libraries (`sigstore-js`), consistent with this repo's preference for
  adopting maintained standards over ad hoc formats (see the RFC 8785 choice
  in the canonical-hashing draft).
- **Require `sigstore` mode only, drop `dsse`.** Rejected: forces every
  signer through OIDC/Fulcio, which is unavailable in air-gapped or
  private-PKI environments and unsuitable for deterministic CI fixtures.

## Implementation scope (phased — each phase independently reviewable/mergeable)

1. **Design doc.** `docs/trust-model.md` + core §8.2/§5.1 cross-references.
   Gates everything else on the envelope/trust-root design landing first.
2. **`tools/moca-sign`.** New workspace package: `sign`/`verify` subcommands
   for both modes, exported `verifyPackageSignature()` API, own
   README/tests — independent of `moca-lint`.
3. **`moca-lint` integration.** Security pass wired to `tools/moca-sign`;
   `E404`/`E406`/`E407` added, `I404` retired; README Validation Contract +
   Known Limitations updated; `MIGRATIONS.md` entry for the behavior change.
4. **Conformance fixtures.** Valid/invalid/missing/placeholder fixtures plus
   `moca-lint` tests asserting each maps to the right code.
5. **Re-sign existing examples.** Replace the three placeholder signatures
   with real `dsse`-mode signatures under a documented, clearly-labeled
   non-production "repo example signing key"; update each README's
   disclaimer; confirm `npm run lint:moca` (CI) passes.
6. **Changelog/roadmap.** `CHANGELOG.md` per phase; mark `ROADMAP.md` item 6
   complete once phase 5 lands.
