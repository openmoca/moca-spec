# Migrations

How to move packages and Readers between versions of the specification.

## From 0.5.0 to 0.6.0

Packages written for `mocaVersion` `0.5` read as before, with the same digests,
except for the rare cases in this table. Trust roots change.

| Change | Codes | What to do |
| --- | --- | --- |
| Trust roots: `roles` is required on every key and Sigstore identity, and `keyid`s are unique (attestations §6). An empty `roles` list trusts the entry for nothing | — (the trust root is refused) | Add `"roles": ["package", "review"]` to entries that had none. `moca-sign trust add` now always writes roles. |
| DSSE payloads and signatures must be base64 or base64url (attestations §7) | `A001`, `A002` | None for envelopes `moca-sign` wrote. Envelopes with other characters in `payload` are now malformed. |
| Sigstore identities listed in the trust root, but none for the attestation's role, make it invalid rather than unverifiable (attestations §7) | `A002` | None. |
| An absolute reference (`/x`, `C:/x`) or a malformed percent-encoding is `C008` (Reader contract §11) | `C008_UNSAFE_PATH` | Make links and `resource` paths relative to the node file. |
| `moca.json` that is not valid UTF-8 is `M001` | `M001_MANIFEST_INVALID_JSON` | Save it as UTF-8. |
| Dates: a date-time needs an offset; one without (`2026-01-01T00:00:00`) is reported and ignored. A node's window is the intersection with the package's, so a node can no longer stay in force after the package's `validUntil` (package spec §4.4) | `C005`, `M002` | Add `Z` or an offset to date-times. Move a node that must outlive its package into another package. |
| Keys expire at the instant of `expires` against the host clock; `readPackage` takes a clock | `A002` | Re-sign before a key expires. Hosts pass their clock to `readPackage` as to `Library`. |
| Audience fails closed (Reader contract §8, ADR-0016): under a host audience set, content with no `moca.audience` is left out unless the host allows unlabelled content, and a malformed label never matches. A translation with no label has its default-language file's. Bindings apply the audience set and the default policy to every record they hand to a model or user, and the opt-ins are host configuration | — | Authors: label every page. Hosts that relied on unlabelled content passing: label it, or allow unlabelled content (`allowUnlabelled`, moca-mcp `--allow-unlabelled`). moca-mcp's `include_all` argument is gone: start the server with `--include-excluded`. |
| Sidecars and search (contract §9, sidecar §5): an item's `text` must equal the package's bytes at its span, which must lie in the body (`S004`); lexical search reads the package, never the sidecar's text; a prefix declared by only the index or only the embedder is `S006`; the gate keeps one result per representation and span; hybrid ranking is informative | `S004`, `S006` | Rebuild sidecars with a current `moca-index`. Hosts: declare your embedder's prefixes, or use an index built without them. |
| Evidence (Reader contract §7): a `TextPositionSelector` on its own is no longer checked (`matched` absent); Markdown and HTML quotes are normalised like their sources, so a quote with markup can now match | `C011` (fewer) | None. To prove a position, pair it with a quote. |
| Strict JSON and YAML: `moca.json` or a statement that repeats a member name is `M001` or `A001`; frontmatter that repeats a key is `C002` | `M001`, `A001`, `C002` | Remove the repeated key. |
| Locales: tags compare case-insensitively; the fallback is exact, then the longest truncation of the request, then the lowest longer tag | — | None, unless a node has several partly matching translations. |
| Limits and archives (Reader contract §3): every source has the entry and byte limits, directories included; evidence work is bounded per package (`maxEvidenceChecksPerPackage`, `maxEvidenceBytesPerPackage`); archive names must be UTF-8 (flag set) and free of NUL, empty and `.` segments; only stored and deflated entries are read; duplicate entries collide | `T003`, `P002`, `P003` | Re-pack archives with a current tool (it sets the UTF-8 flag and deflates). Packages with very many evidence checks against large sources: raise the limits, or expect `matched` to be absent past them. |
| Identity and tampering: a library refuses a second digest for one `id@version` (`L001`); an attestation for this `id@version` with another digest is `A008`, not `A002`; a resolved member must match the pin's `id` and `version` (`R002`); hosts can read with `requireSignature` (`A009`, invalid) | `L001_IDENTITY_CONFLICT`, `A008_PACKAGE_DIGEST_MISMATCH`, `A009_SIGNATURE_REQUIRED` | Never republish a version with different content. Hosts that serve only signed content: read with `requireSignature`. |
| Store search (Reader contract §9.4): a store search takes the loaded packages' states (`packageState(result)`) instead of bare digests, and recomputes supersession, contest, signatures and reviews from them at query time | — | Keep each loaded package's state beside your store, and pass the states where you passed digests: `new Search({ packages, clock }, …)`, Python `StoreScope(states, clock)`, .NET `new MocaSearch(states, clock, …)`. |
| Reviews (ADR-0017): `reviewed` needs a signed package and every reviewed page approved; a `needs-change` or `inaccurate` review leaves the page `disputed`. Citation records add `reviewStatus` and each review's `packageVerified`; the latest review from each signer counts; a review dated in the future is ignored; trust-root entries may list `reviewers` | `A007_REVIEW_DATE_FUTURE` (warning), `A002` | Sign packages that carry reviews. Re-review pages whose latest review is not `accurate`. Applications: show `disputed` and `unverified` reviews as such. |
| `supersedes` and `conflictsWith` take effect only when the declaring package is signed by a key or Sigstore identity whose new `ids` cover the target's id (package spec §7.2). Otherwise they are reported and have no effect, unless the host allows unsigned relations | `R004_RELATION_UNAUTHORISED` (info) | Publishers: sign packages that supersede or contest others. Hosts: add `ids` to the trust-root entries of publishers you trust to retire their own packages, for example `"ids": ["https://acme.example/"]`; switch on the host option only for a library of your own packages. |
| Only entries under `attestations/` are left out of the digest; a top-level file named `attestations` is digested | — | None, unless a package has such a file: its digest changes. |
| `structure.json` is no longer read or checked ([ADR-0019](docs/adr/0019-park-structure-json.md)); `O004` is retired | — | Nothing breaks. Delete `structure.json` from packages if you like (the digest changes). Use `moca-lint structure` to print the view; `--write` is gone. |
| `supersedes` means the whole target package (package spec §7.2) | — | Use `amends` for a partial change. |
| Composition is bounded: `maxMemberDepth` 8, `maxMembers` 256 (contract §3) | `R001` | None for ordinary compositions. Hosts with deeper or larger ones raise the limits. |
| Deprecating or replacing a concept never hides its pages ([ADR-0020](docs/adr/0020-structure-never-hides-content.md)) | — | Mark retired pages `status: deprecated` or give them `moca.valid_until`. `moca-lint` warns (`LINT_RETIRED_CONCEPT`). |
| A `mocaVersion` newer than the Reader's is reported (package spec §14) | `M009_MOCA_VERSION_NEWER` (warning) | None. |
| Schema patterns are ECMAScript everywhere: a value with a trailing newline, non-ASCII digits or Unicode white space fails | `M002`, and the matching schema codes | Remove stray newlines and spaces from ids, versions and digests. |

## From 0.4.0-alpha.2 to 0.5.0

Packages written for `mocaVersion` `0.4` read exactly as before, with the same digests, and need no change. New
packages declare `mocaVersion` `0.5`. The addition (citations over AG-UI) is optional.

One rule is tightened: DSSE keys are Ed25519 (attestations §5). A DSSE attestation signed with an ECDSA or RSA key
no longer verifies in any Reader (`A002_ATTESTATION_INVALID`); before, it verified in the TypeScript and .NET Readers
only. Re-sign such packages with an Ed25519 key (`moca-sign keygen`), or with Sigstore, and give readers the new key
or identity. Packages signed by `moca-sign` already use Ed25519.

## From 0.4.0-alpha.1 to 0.4.0-alpha.2

Packages do not change, except for the rare paths in the first row.

| Change | Codes | What to do |
| --- | --- | --- |
| Path collisions (`P003`) name their lower-casing: the simple mapping per code point (package spec §6.3) | `P003_PATH_COLLISION` | Paths that differ only by İ and i now collide in every Reader; İ next to i + U+0307 no longer collides in the TypeScript Reader. Rename such files. |
| Embedders take a role, `query` or `document`, and may declare `queryPrefix` and `documentPrefix`; an index's prefixes are compared like `version` (Reader interface §5.3, contract §9.3) | `S006_MODEL_MISMATCH` | Embedders: apply your model's convention per role. JavaScript embedders that ignore the role keep working; .NET `IEmbedder.EmbedAsync` takes an `EmbeddingRole`. Producers: write the prefixes into `model`. |
| Dense search scores by `model.distance` (Reader contract §9.3) | — | Sidecars that declare `dot` or `euclidean` now rank by it; Readers used cosine for every sidecar. |
| New code | `S007_NO_VECTORS` (warning, from dense backends) | Hosts that treat backend warnings as errors will see it for each loaded package without vectors. Bind a dense sidecar to that package, or search it lexically. |

## From 0.3.0-alpha.1 to 0.4.0-alpha.1

Every change below that alters bytes or digests is breaking.

### Packages

| 0.3 | 0.4 | What to do |
| --- | --- | --- |
| `moca-digest-v1` (canonical JSON) | `moca-digest-v2`: the SHA-256 of a BagIt-style manifest of every file, `moca.json` included as bytes ([ADR-0003](docs/adr/0003-digest-v2-and-detached-attestations.md)) | Every digest changes. Re-pin members (`moca-lint digest`), re-sign, and re-review. Set `mocaVersion` to `0.4`; older packages are read with v2 and flagged `M008` (info). |
| Ontology profile: `ontologies/*.ttl` and `moca.profiles["https://w3id.org/moca/profiles/ontology/v1"].concepts` | Structure core: `structure.ttl` at the root, `moca.concepts` on nodes ([package spec §5.6](spec/moca-package-spec.md#56-structure)) | Move the concept scheme into `structure.ttl`, keep only the core terms there, declare every concept `a skos:Concept`, and move bindings to `moca.concepts`. Keep other vocabulary under the ontology profile. The `ontology` capability becomes `structured`. |
| `skills/` with a signing gate | No special meaning ([ADR-0011](docs/adr/0011-park-unconsumed-features.md)) | Ship agent skills as application code. `A005` and `K001` are retired. |
| Agent Skills, claims and EU AI Act profiles | Removed ([ADR-0011](docs/adr/0011-park-unconsumed-features.md)) | They are now reported as unrecognised (`F001`, info). |
| OCI binding | Removed ([ADR-0011](docs/adr/0011-park-unconsumed-features.md)) | Any registry can still carry the files. |
| Media and captions | Media Fragments time ranges and WebVTT captions are checked | Carry captions under `media/` to make video citations checkable. |

### Readers and applications

| 0.3 | 0.4 | What to do |
| --- | --- | --- |
| `evidence[].verified` | `evidence[].matched` | Rename. It says the quote is in the file, not that anyone verified the claim. |
| Citations keyed by `node.id` | `node.ref`, `<id>@<version>#<path>` | Key citations and logs by `node.ref`. |
| Quotes matched against raw bytes | Matched against normalised text (Markdown, HTML, WebVTT rules in [Reader contract §7](spec/moca-reader-contract.md#7-citation-records)) | Quotes copied from rendered text now match. |
| A Search conformance class | Search is part of the Reader; §9 is the pipeline and its gate | Nothing to change in calls. Hooks and `scope` are new options. |
| Store search resolved hits through a loaded Library | Store records carry whole citation records; `new Search({ digests, clock }, { backend })` | Store the citation record at ingest. |
| JSON `vector` on sidecar items | Binary `storage.vectors` (float32); JSON vectors deprecated | Rebuild dense sidecars with `moca-index`. |
| Unbounded YAML and structure parsing | Limits ([Reader contract §3](spec/moca-reader-contract.md#3-opening-a-package)) | Frontmatter with YAML aliases is now `C002`. |
| Reader contract §10-§13 | Now §11-§14, with §10 Structure | Update links. |

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
| One TypeScript Reader; other languages through MCP | A Reader interface and one Reader per language ([ADR-0006](docs/adr/0006-reader-interface-and-per-language-readers.md)) | Readers in other languages follow the [Reader interface](spec/moca-reader-interface.md) and the corpus runner protocol. |

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

No longer applies. Since 0.4, `skills/` has no special meaning and no signing
gate ([ADR-0011](docs/adr/0011-park-unconsumed-features.md)): ship agent skills
as application code, and never load package content as skills.

### Sidecars

Rebuild with `moca-index build`. The 0.1 `index.json` fields
(`target_package_id`, `target_package_hash`, `item_addressing`) are replaced by
`target { id, version, digest }`, and payload items carry byte offsets.

### Readers

Readers written against the 0.1 SDK contract need to be rewritten against the
[Reader contract](spec/moca-reader-contract.md). The diagnostic codes are new.
Use the [conformance corpus](conformance/README.md) as the test suite.
