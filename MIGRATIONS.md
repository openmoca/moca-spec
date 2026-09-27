# Migrations

How to move packages and Readers between versions of the specification.

## From 0.2.0-alpha.1 to 0.3.0-alpha.1

**Packages: nothing to do.** A `0.2` package is a valid `0.3` package. To use
what `0.3` adds:

- Put the files your nodes cite under `sources/` or `media/`, and point
  `sources[].resource` at them by package path. The package then has
  `self-contained-evidence`, and Readers check each quote against the file.
  Fix any `C011_EVIDENCE_SELECTOR_UNMATCHED` warning by correcting the quote.
- To bind nodes to a vocabulary, declare the
  [ontology profile](profiles/ontology/moca-ontology-profile.md).

**Readers and applications:**

| 0.2 | 0.3 | What to do |
| --- | --- | --- |
| `Library.search()` was the only search | `Search` over a backend; `Library.search()` remains as a synchronous lexical shortcut | Use `new Search(library, { backend, audiences })` for sidecar vectors or a store. |
| Search over sidecar chunks ignored `locale` | The requested locale is honoured | Expect only the requested locale's chunks, or the default for nodes without it. |
| Evidence copied through unchecked | `evidence[].verified` on citation records | Show whether a citation was verified against its original. |
| Enterprise vector stores: guidance only | Store backends; Search re-checks every hit | Wrap your store as a backend so the default policy applies to it. |
| Capabilities: 7 | Also `self-contained-evidence`, and `ontology` from the profile | Update any exact-match checks on capability lists. |
| New codes | `C011`, `S006`, `O001`-`O003` | Hosts that treat warnings as errors (strict mode) will see them. |
| [ADR-0003](docs/adr/0003-reader-mcp-server-and-adapters.md) | Superseded by [ADR-0007](docs/adr/0007-reader-interface-and-per-language-readers.md) | Readers in other languages follow the [Reader interface](spec/moca-reader-interface.md) and the corpus runner protocol. |

## From the 0.1.0-beta.1 draft to 0.2.0-alpha.1

The 0.1 draft was never published to a registry, but packages may exist
locally. Every change below is breaking.

### Manifest (`moca.json`)

| 0.1 draft | 0.2 | What to do |
| --- | --- | --- |
| `id: "urn:moca:..."` | Absolute URI; registered URN namespaces or `https:`/`tag:` URIs | Rename, for example to `https://<your-domain>/moca/<name>`. |
| `@context`, `ontologies`, `entryConcepts` | Removed from core | From 0.3, move ontologies and `entryConcepts` to the [ontology profile](profiles/ontology/moca-ontology-profile.md), as Turtle with absolute IRIs; `@context` has no successor. Claims went to the claims profile, which 0.4 removed ([tag v0.3.0-alpha.1](https://github.com/openmoca/moca-spec/blob/v0.3.0-alpha.1/profiles/claims/moca-claims-profile.md)). |
| `integrity` | Removed | Nothing to do: Readers compute per-file digests. |
| `canonicalDigest` | Removed: the digest is computed, never declared | Delete. Run `moca-lint digest` to see the digest. |
| `signature` | Detached attestation under `attestations/` | Delete, then run `moca-sign sign`. |
| `composition.members` with version ranges | `members` with exact `version` and `digest` | Pin each member: `moca-lint digest <member>`. |
| `composition.relates`, manifest `supersedes` | `relations` (`type`, `target`, optional `version`) | Convert each entry. |
| `lastReviewed` | Review attestations | Run `moca-sign review` for the nodes that were reviewed. |
| `profile` array + `profileData.<name>` | `profiles` map keyed by profile URI | Merge into one map. |
| `augmentation` | Removed | Reference external material through OKF `sources`. |
| `endpoints`, `settings`, `credentials`, `apiKeys` (forbidden) | Unknown keys, ignored and reported as info | Delete them; they never had any effect. |
| `title`/`description` as locale maps | Plain strings | Keep the default-language string. |

### Content nodes

| 0.1 draft | 0.2 | What to do |
| --- | --- | --- |
| Frontmatter optional | Required, with an OKF `type` | `moca-convert --from directory` adds `type` and `title` without touching the rest. |
| Frontmatter `id` | Path is identity (OKF) | Remove `id`; node id is `<package id>#<path>`. |
| `summary` | OKF `description` | Rename. |
| `epistemicStatus` | OKF `generated`, `verified`, `status`; `moca.contested_by` | `generated` becomes `generated: {by, at}`; `verified` becomes a `verified` entry; `deprecated` becomes `status: deprecated`; `disputed` becomes `moca.contested_by`. |
| `lastReviewed`, `validFrom` | OKF `stale_after`; `moca.valid_from`, `moca.valid_until` | Set `stale_after` to the next review date. |
| `evidence[].source` path + `locator` | OKF `sources[]` with `id` + `moca.evidence[]` with a W3C selector | Add a `sources` entry per document; point evidence at its `id`. A `page` locator becomes `FragmentSelector` `page=N` (RFC 3778). |
| `concepts` | Ontology profile (0.3) | Move to `moca.profiles["https://w3id.org/moca/profiles/ontology/v1"].concepts`, each as `{ iri, role }` with an absolute IRI. |
| `claims` | Claims profile | Move to nanopublications, or drop. |

### Skills

`SKILL.md` must match the Agent Skills specification exactly: `allowed-tools`
is a space-separated string and `metadata` values are strings. The package
needs a package attestation for skills to be exposed.

### Sidecars

Rebuild with `moca-index build`. The 0.1 `index.json` fields
(`target_package_id`, `target_package_hash`, `item_addressing`) are replaced by
`target { id, version, digest }`, and payload items carry byte offsets.

### Readers

Readers written against the 0.1 SDK contract need to be rewritten against the
[Reader contract](spec/moca-reader-contract.md). The diagnostic codes are new.
Use the [conformance corpus](conformance/README.md) as the test suite.
