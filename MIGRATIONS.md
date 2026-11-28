# Migrations

How to move packages and Readers between versions of the specification.

## Unreleased: towards 0.8.0
## From 0.7.0 to 0.8.0

Unreleased: this section grows as 0.8.0's proposals land. Packages written for
`mocaVersion` `0.7` read as before, with the same digests; a few read
differently in more than one language, as the tables say.

### Packages and Producers

| Change | Codes | What to do |
| --- | --- | --- |
| `moca.language` in a default-language file: the node's language when it is not the package's (package spec §5.3, §5.4) | `C005` in a translation, or for a tag that does not parse | Optional, for a genuinely mixed package. Make separate works editions instead (§7.4). |
| `captions` on a media description: caption and subtitle tracks, each `{ source, language, kind? }` with HTML's track kinds (package spec §5.7) | `C005`, `C006` for a bad entry, which is dropped | Optional. **If a package must work in 0.7 Readers, don't add `captions` yet:** a 0.7 Reader reports its `mocaVersion` `0.8` as newer (`M009`) and drops the whole description (`C005`), so the media, its `transcript` and its time-range checks are lost there. Keep the spoken-language WebVTT as `transcript`: only it is checked as evidence. |
| Edition groups (package spec §7.4): in a composite package, a slot is a concept with `schema:workExample` values naming member packages that are editions of one work, and one `moca:defaultEdition`. A Reader shows one edition per slot, chosen by language, and a search with a locale keeps only that edition's records | `O006` (warning) | Optional. Put each edition in its own package, compose them, declare the slot and its editions in the composite's `structure.ttl`, list the slot on the reading order in place of the editions, and sign the composite with a key whose `ids` cover the editions: unsigned, the slot only groups. |
| Relations `translationOf` and `editionOf` (package spec §7.2): this package is a translation of the target, or another edition of the work it stands for. They only report, so need no signer | — (`R005` from a 0.7 Reader) | Optional. Translators: declare `translationOf` the original, leaving out `version`. Use `crossReferences` instead if your package must read the same in 0.7 Readers, which report the new types as unknown (`R005`, info) and keep them. |
| A translation can be retired on its own: mark it `status: deprecated`, or end its window. A reader in that language then gets the next match or the default file (Reader contract §9.2 step 5.4). In 0.7.0 the page was returned in no language, so retired translations had to be removed | — | Mark retired translations instead of deleting them, if you want readers in that language to see the original. |
| Translations inherit `moca.concepts`, `status` and the validity window from their default file when they write none (package spec §5.4) | — | Nothing, if a translation should follow its original. A translation that should not (another topic, still live after the original is retired) writes its own key: `status: stable`, its own `moca.concepts` or window. |

### Readers and hosts

| Change | Codes | What to do |
| --- | --- | --- |
| A store search that cannot get the state of a package a record depends on (its own, a composing package's, or one whose relations act on it) withholds the record; relation effects come from the same states as `signed` (Reader contract §9.4) | `S011_STATE_MISSING` (warning) | Readers with states on demand: withhold such records and report it; check any cached index against the states you load. Readers with every state in memory: follow the host's allowlist, and withhold when a loaded package has no state. Hosts: treat `S011` as a short result and a fault in your state store; after a trust-root change, recompute states and what you derived from them. Corpus adapters: support `options.withhold`. |
| Locale lookup (package spec §5.4): the default representation is tagged with the manifest's `language`, and at each truncation of the request a Reader also tries tags that start with it and `-`. So `pt-AO` finds `pt-BR` or `pt-PT` (the lowest) instead of the default, and a request for `en` in a package whose `language` is `en` gets the default file instead of an `en-GB` file | — | Readers: implement the new lookup, for representations in `Library.citations`, `Library.get` and search. Hosts that asked for a full tag to avoid a regional file (`en-US` to get the default) can ask for the language itself. Authors who added a plain `pt` file only to catch `pt-AO` may keep it: it is still found first. |
| A store search chooses one representation per node, as a library search does (contract §9.4): the package state lists each node's files and their tags, the default file marked. In 0.7.0 a stored record passed when its own tag matched, so a list such as `["fr", "en"]` returned a node twice, and a node with no file in the language was not returned at all | — | Readers: carry `representations` in the package state and choose by the lookup, with the default file as the fallback. Hosts with a store: rebuild each package's state with a 0.8 Reader. A state from 0.7 has no `representations`, and its records are matched as before. |
| A translation inherits its default file's `moca.concepts`, `status`, `moca.valid_from` and `moca.valid_until` when it has no key of its own, as it already did `moca.audience` (package spec §5.4). So a translation is found by topic, placed on the reading order, and retired with its original | `C010` on the translation's file when the window it ends up with is invalid | Readers: take each of the four keys from the default representation when the translation has none, before binding concepts, the reading order and the default retrieval policy. Store searches: re-ingest, so stored records carry the inherited values. |
| A search chooses a node's representation for a locale only among those that pass the default retrieval policy and the audience set (contract §9.2 step 5.4). A retired translation (`status: deprecated`, or a window that has ended) falls back to the next match or the default, as a missing one does; in 0.7.0 the node was returned in no language. When a loaded node has a representation those steps remove and one they keep, `locale` is not pushed down (§9.5) | — | Readers: choose among the representations that pass steps 5.1 to 5.3 (all of them with the host's opt-in), and stop pushing `locale` down in that case. Store backends with pushdown: expect no `locale` filter for such packages. |
| When the default representation is not a candidate (it is retired, and so is every match), the candidate with the lowest tag is chosen (contract §9.2 step 5.4) | — | Readers: fall back to the default, then to the lowest tag. |
| When the Reader holds `locale` back, it passes the filter `everyRepresentation`, and a backend returns every representation of a node that matches (contract §9.5). Without it, a backend that kept its best hit per node could keep the retired file, and the live one never reached the gate | — | Backends: keep one representation per node only when you applied `locale`, or the caller named none. Readers: pass `everyRepresentation` whenever `locale` is held back. |
| A package state carries, for each file of a node with more than one, its `status`, window and audience, so a store search chooses among the files that pass steps 5.1 to 5.3, as a library search does (contract §9.4) | — | Hosts with a store: rebuild each package's state with a 0.8 Reader. |
| Core relation types `translationOf` and `editionOf`: reported, with no effect, and no `R005` (package spec §7.2) | — | Readers: add them to the core types. Hosts: show who declared the relation, and whether the declaring package's signers cover the target. |
| Edition groups: `editions(slot)` and `chooseEdition(slot, locale)` in the structure operations; the search option `editions` (`choose` or `all`); with a locale, the gate keeps one edition per slot, only where the composite's signers cover the record's package (contract §9.2 step 5.4, §10). Package states carry each member's `language` and the edition groups (§9.4) | `O006` | Readers: read `schema:workExample` and `moca:defaultEdition`, bind editions to their slot as parts are bound, choose by the §5.4 lookup, fold in the gate; implement the two operations. Store searches: rebuild package states. Corpus adapters: support `editions` and `chooseEdition` structure cases and the `editions` search option. |
| Edition groups, as reviewed: a slot's IRI must be in its composite's own namespace (`id` then `#` or `/`), or it is not read (`O006`); a slot chooses only among editions the search can return (loaded, and with a record that passes steps 5.1 to 5.3 and the terms gate); a composite that is superseded or out of force neither folds nor limits by `upTo`; where two slots that may hide a record disagree, a slot does not hide when another hides its choice; `editions` and `chooseEdition` answer from the declaring composite in force, then the highest version, never "the first loaded" (package spec §7.4, contract §9.2 step 5.4, §9.4, §10) | `O006`, `S013` (info), `S013` (warning) | Authors: name each slot inside your composite's `id`, such as `https://example.com/course#bread`. Readers: carry each package's own window and file summary (`files`) in its state; choose per search among editions that can return a record. Store searches: rebuild package states. |
| The search option `localeMode`: `choose` (the default, as before), `only` (records in another language drop out) or `first` (records ordered by the first locale entry they match, then the next) (contract §9) | — | Readers: implement it, applying `only` in the gate and `first` before the limit. Corpus adapters: pass `localeMode`, and support `expect.order`. Hosts: use `only` instead of filtering results afterwards. |
| Media `captions` (package spec §5.7): validated entry by entry; records carry them in `node.media` with `kind` filled in. The node and citation-record schemas gain `captions` | `C005`, `C006` | Readers: vendor both schemas; drop a bad entry, never the description; never check evidence against a caption track. |
| `moca.language` sets the default representation's tag in the lookup and its `node.locale`; the package result gains `localeCoverage` (Reader interface §4) | `C005` | Readers: read `moca.language` from default files only; compute `localeCoverage`. Corpus adapters: output `localeCoverage` for package cases. |
| `locale` may be a priority list, most preferred first (`["fr-CA", "en"]`), in `Library.citations`, `Library.get` and search; each entry is tried in full before the next. The pushdown filter `locale` is a list (contract §9.5) | — | Readers: accept a list; treat one tag as a list of one and an empty list as no locale. Store backends with pushdown: read `locale` as a list. Hosts: pass the person's languages in order (from `Accept-Language`, for example). |
| After review, package spec §5.4: a translation also takes `stale_after` and `moca.contested_by` from its default file; a window of one own bound and one inherited bound whose end is not after its start keeps the translation out of force; a translation tagged with its node's own language is ignored; when an entry names a script, the sibling step does not take another script; a priority list keeps 16 entries of at most 35 characters | `C012` (warning), `S014` (info) | Readers: inherit the two keys through the same helper as the others; fail closed on a mixed empty window; ignore a same-tag file; add the script guard and the caps. Package authors: remove a `<name>.<language>.md` beside `<name>.md` in that language. Hosts passing `Accept-Language`: nothing; long lists are trimmed and reported. |
| Contract §9.2: with `localeMode: "first"` and no bound from the host, a search examines at most 1,000 candidates (or `limit`), and reports `S010` when it stops there | `S010` | Readers: bound it. Hosts that need more set their own bound. |
| Both reference Readers declare `mocaVersion` `0.8` | — | Package authors may declare `0.8`; a 0.7 Reader reads such a package with `M009`. |

### What 0.7 Readers do with 0.8 packages

- **`translationOf` and `editionOf`** are unknown relation types (`R005`, info), kept and reported.
- **Edition groups** are ignored (`schema:workExample` and `moca:defaultEdition` are terms a 0.7 Reader does not read): every edition is listed and searched.
- **A media description with `captions`** fails the 0.7 node schema and is ignored (`C005`): the node loses that media, its transcript and the time-range checks.
- **`moca.language`** is ignored: the node's records are in the package's language.
- **`mocaVersion` `0.8`** is newer than the Reader (`M009`, warning); the package is read under the newest rules the Reader implements.

## From 0.6.0 to 0.7.0

Most packages written for `mocaVersion` `0.6` read as before, with the same digests, and need no change. A string
`publisher` now fails the schema (`M002`): write it as an object. A few rare packages also read differently: two
sources with one `id` (`C002`), a time range past the end of its media (`C011`), an implicit YAML key over 1,024
characters (`C002`), a Zip64 archive or one with two end records (`T003`), and text nested over 64 levels deep (see
the table). Trust-root entries that list `ids` now limit which packages they sign (`A010`). Every other addition is
optional. New packages that use one declare `mocaVersion` `0.7`. Trust roots that list the new role
`issued-copy` cannot be read by 0.6 Readers.

### Packages and Producers

| Change | Codes | What to do |
| --- | --- | --- |
| `distribution`: `open` (the default), `encrypted-only` or `service-only`. The publisher's signed intent, never access control (package spec §4.1, [ADR-0024](docs/adr/0024-distribution-is-signed-intent.md)) | `M002` for any other value | Nothing, unless you want to state an intent. Sign after setting it. `moca-lint pack` warns when it packs an `encrypted-only` package plain. |
| Encrypted packages: a `.mocae` envelope, an archive encrypted with age v1 to X25519 recipients or a passphrase, with an optional readable outline ([encrypted packages](spec/moca-encrypted-package.md), [ADR-0023](docs/adr/0023-encrypted-packages-in-an-age-envelope.md)) | `E001`–`E006` | Sign first, then `moca-sign encrypt`. Choose the outline fields with care: they are public. Encryption gives confidentiality only (encrypted packages §7). |
| `images`, `translations` and `tags` in the manifest ([ADR-0025](docs/adr/0025-catalogue-fields-travel-in-the-manifest.md)). Images are PNG, JPEG or WebP files under `media/`, at most `maxImageBytes` (1 MiB) each | `M010`–`M013` | Optional. Run `moca-lint lint` for the image shape, size and alt-text checks. |
| `apps`: where the publisher suggests the package is opened, as `https:` URIs and app-type tokens ([ADR-0026](docs/adr/0026-apps-is-a-hint.md)). A list of well-known types is on openmoca.org | `M002` for a bad entry | Optional. Never list conversation. |
| `readingOrder`: the IRI of the ordered collection in your own `structure.ttl` that orders the package ([ADR-0027](docs/adr/0027-reading-order-names-a-collection.md)) | `M014` (warning) when it does not resolve | Optional. Name a `skos:OrderedCollection` with a `skos:memberList`. |
| Issued copies: an issuer marks a licensee's copy and binds it to your package with an issued-copy attestation ([ADR-0028](docs/adr/0028-issued-copies.md)). Without `issuedCopies` in your manifest, no copy is accepted | `A002` for a copy you did not allow | Publishers: add `issuedCopies` (issuers by key or Sigstore identity, and the paths they may mark under `content/` or `media/`) and publish a new version. Issuers: `moca-sign issue`, with a DSSE key. |
| A sidecar index built from your package binds to an issued copy that verifies against the host's trust root; items of the files the issuer changed are replaced by whole-body chunks without vectors (sidecar spec §5, [ADR-0033](docs/adr/0033-issued-copies-match-pins-and-sidecars.md)) | `S009` (info); `S003` on a copy that does not verify | Publishers: let issuers mark only files that need not be found by meaning (a notice page, or `media/`). Issuers: no per-copy sidecar is needed. |
| `moca.media`: a description of a node's audio or video (media type, duration, optional SHA-256, transcript) ([ADR-0029](docs/adr/0029-media-is-described-never-fetched.md)) | `C005`, `C006` | Optional. Name the WebVTT transcript as `transcript`, so time ranges on hosted media are checked and count toward `self-contained-evidence`. |
| A node whose `sources` has two entries with the same `id` is invalid: none is chosen (package spec §5.1). Before 0.7.0, Readers disagreed on which applied | `C002` | Give each source in a node its own `id`. Run `moca-lint lint` to find repeats. |
| Alternate media: `alternateOf` and `sync` in `moca.media` mark audio and video versions of one node's content, lined up stretch by stretch ([ADR-0034](docs/adr/0034-alternate-media-sync-by-stretches.md)) | `C005` for an invalid alternate, which then stands on its own | Optional. Give the video version an `alternateOf` naming the audio, and a `sync` entry at each point where an intro or ad break changes the offset. |
| A time range may be refined by the words spoken in it: a `TextQuoteSelector` in the range's `refinedBy` ([ADR-0035](docs/adr/0035-time-ranges-refined-by-a-quote.md)) | `C011` when the words are not in the cues the range covers | Optional. Add `refinedBy` to time ranges whose words you want checked and located. |
| A composite package's reading order limits its member packages only when its signers' `ids` cover them ([ADR-0030](docs/adr/0030-series-bind-members-by-composition.md)) | — | Sign a composite package with a key whose trust-root `ids` cover its parts. |
| Media types: `application/vnd.openmoca.package+zip` (`.moca`), `application/vnd.openmoca.envelope+zip` (`.mocae`) and `application/vnd.openmoca.index+zip` (`.mocai`) (package spec §12.1) | — | Hosts: serve each file with its type. Readers keep recognising files from their bytes. |
| Single file extensions: an envelope is `.mocae` (was `.moca.enc`) and a sidecar index archive is `.mocai` (was `.moca.idx.zip`) | — | Nothing to convert: Readers recognise files by content, so files with the old names still read. The tools now write the new names: `moca-sign encrypt -o <name>.mocae`; `moca-index build -o <name>.mocai` writes the Zip archive (any other `-o` a folder); the MCP server finds `<name>.mocai` beside a package, and still finds the old names. Rename files when convenient. |
| Time ranges must end within the media: at or before the latest cue end, or the declared `duration` | `C011` | Check ranges that end after the last caption (a chapter that runs to the end of a video): declare the media's `duration`. |
| `datePublished` in the manifest and `moca.date_published` on nodes ([ADR-0031](docs/adr/0031-date-published.md)) | `M002`, `C005` | Optional. A full date or an RFC 3339 date-time with an offset. |
| **Breaking:** `publisher` is an object, `{ name, url?, description?, image?, sameAs? }`; there is no string form ([ADR-0038](docs/adr/0038-credits-in-fixed-shapes.md)) | `M002` for a string | Replace `"publisher": "Acme"` with `"publisher": { "name": "Acme" }`, declare `mocaVersion` `0.7`, and sign again. |
| Credits: a package-level `url`, and `contributors` in the manifest and in `moca.contributors`, with MARC relator roles (package spec §4.13) | `M002`, `C005`, `M010` | Optional. Credit people only as they credit themselves in public; never put an e-mail address or telephone number in a credit. Copy pictures into `media/`. |
| Binding by composition: a composite package's structure may use its members' package ids and node ids as concepts ([ADR-0030](docs/adr/0030-series-bind-members-by-composition.md)) | — | Optional. Declare each as a `skos:Concept`. See composite packages (package spec §7.3). |
| `isPartOf`, a core relation type; other types that no declared profile defines are reported ([ADR-0032](docs/adr/0032-is-part-of-and-unknown-relation-types.md)) | `R005` (info) | Rename invented relation types, or declare the profile that defines them. |
| An issued copy matches a member pin through its verified original digest ([ADR-0033](docs/adr/0033-issued-copies-match-pins-and-sidecars.md)) | `R002` when it does not verify | Pin the publisher's package in a members' composite package; hosts need the issuer in their trust root. |
| `ai.allowed.mention` in `terms`: whether a model that may not receive the work may be told it exists ([ADR-0041](docs/adr/0041-what-the-terms-gate-covers-and-hiding-a-closed-package.md)). Default `true`: a model a work is closed to may be told its title and publisher. Package level only | `U001` for a value that is not a boolean (it then hides the package); `U003` in a `nodes` entry | Optional. Set `false` only when the title itself must not reach a model the work is closed to. It cannot stop a model that already knows the work. |

### Readers and hosts

| Change | Codes | What to do |
| --- | --- | --- |
| Validity: a package is valid when it has no error in the `T`, `P`, `M`, `C` or `E` families (Reader contract §11) | `E001`–`E006` | Treat an envelope that does not open as invalid. |
| Result fields: `distribution`, `envelope`, `images`, `translations`, `tags`, `apps`, `readingOrder` and `issuedCopy` (Reader interface §4) | — | Read them if you need them. `apps` and `distribution` are advice: never fetch, open or enforce them. |
| Credits: the result carries `publisher` (an object), `url` and `contributors`; citation records carry `node.contributors` (Reader interface §4, contract §7) | `M010` for a credit's image | Readers: vendor the new manifest, node and citation-record schemas; expose credits as written, less images that fail their check. Hosts: show credits as the signer's claim, beside who signed; never as verified. |
| The optional feature `encryption` (Reader contract §14): a key provider, age for X25519 and scrypt, and the limits `maxScryptWorkFactor` (an integer from 1 to 22; default 20, about 1 GiB of memory per encrypted entry) and the decrypted `maxBytes` | `E001` with no key provider | Hosts that open envelopes supply a key provider (encrypted packages §5.1). In .NET, add `OpenMoca.Reader.Age`; in TypeScript, `@openmoca/moca-core/age`. Servers may lower `maxScryptWorkFactor`. |
| Trust roots gain the role `issued-copy`, which requires `ids` (attestations §6) | — (the trust root is refused when `ids` is missing) | Give the role only to issuers you trust to put a publisher's name on changed bytes, with `ids` that cover those publishers' packages. `moca-sign trust add --roles issued-copy --ids …`. |
| Issued copies are verified in two passes: the publisher's attestations against the rebuilt original digest (attestations §7.1). Records carry `package.issuedCopy` and `node.issuedChange`; reviews of changed files are listed with `fileChanged` and never count | `A002` | Applications: show that a record comes from a changed file. Share `issuedCopy.originalDigest`, not the copy's digest, outside the licensee's own use. |
| A library keeps the first of two issued copies of one original and notes the second | `L002_ISSUED_COPY_DUPLICATE` (info) | None. It replaces `L001` for this case only. |
| Search takes `upTo`, a point on a package's reading order; a search has `diagnostics` for its latest call (Reader contract §9) | `S008_UPTO_UNRESOLVED` (warning) | Optional. Store searches: rebuild your package states (`packageState`), which now carry the reading order and the issued copy. |
| `upTo` also limits the members of a package whose reading order places it, and `concepts`, `scope`, `upTo` and `nodes()` see bindings by composition (Reader contract §9 and §10). Package states carry the composition: every valid member, its direct bindings and the links above them (contract §9.4) | — | Store searches: rebuild your package states (`packageState`). |
| Result field `datePublished`; record fields `package.datePublished`, `node.datePublished` and `node.media` | — | Read them if you need them. Never fetch `node.media`. |
| Record field `evidence[].located` for a time range refined by a quote; `upTo` applies a composer's order to a member only when the composer's signers cover it, or the host allows unsigned relations (contract §7, §9) | — | Hosts with unsigned composite packages of their own: set the option that allows unsigned relations (`allowUnsignedRelations` in the reference Readers) on the library or store search. Apps: use `located` to play the cited words. |
| `node.media` entries carry `alternateOf` and `sync` for valid alternates; Readers offer `mapTime`; the corpus has `map-time` cases (Reader interface §4, package spec §5.7) | — | Readers: implement `mapTime` and validate alternates. Conformance runners and adapters: support the `map-time` case kind. Apps: switch between audio and video with `mapTime`. |
| `maxMembers` defaults to 4,096 (was 256) | `R001` past it | Hosts on small devices may set it lower: each resolved member is held in memory. |
| A member pinned more than once in one composition is read once and shared, and counts once. New limit `maxMemberBytes` (1 GiB): the bytes of all members read in one read (contract §3) | `R001` past it | None for ordinary compositions. Readers: share member results within a read, and keep structure work roughly linear. |
| The evidence budgets `maxEvidenceChecksPerPackage` and `maxEvidenceBytesPerPackage` cover the whole read: a package and its members share them (contract §3) | — (`matched` absent past them) | Hosts that read large compositions with many checked quotes may raise them. Readers: one budget per read; parse each transcript's cues once per package. |
| A source whose `id` is not a string has no `id`, and YAML's `.inf` and `.nan` are not numbers; nor is a number too large for a finite double, however it is written (package spec §5.1) | `C005` | Give every source a string `id`. |
| An implicit mapping key longer than 1,024 characters makes the frontmatter invalid, as YAML 1.2 says (package spec §5.1) | `C002` | Write a key that long as an explicit key, after `?`. |
| Filters come before the limit: a search returns the best `limit` records that pass the gate, however far down the unfiltered ranking (contract §9.2). Scores no longer depend on pushed-down filters; hybrid ranks are taken before filters (§9.6) | `S010_SEARCH_TRUNCATED` (warning), only with a host bound | Readers: keep asking the backend, for more each time, until `limit` records pass or it has no more; score before filtering. Hosts: expect fuller results for `upTo`, `concepts` and `scope`; set `maxCandidates` only if you must bound the work, and treat `S010` as a short result. Store backends with pushdown: score over the loaded packages, then filter. |
| `skos:altLabel` is read: `concept()` gains `altLabels`; the default ingress also matches alternative labels (package spec §5.6, Reader interface §5.4) | — | Readers: parse `skos:altLabel`; match it in the default ingress, as written. Producers: write other names, plurals and short forms as `skos:altLabel`. Corpus adapters: `concept` results carry `altLabels`. |
| Ingress concepts narrow under composition and without pushdown; a store search may take a structure source (Reader contract §9.2, §9.4) | — | Readers: narrow resolved hits by the concepts an ingress hook set, before egress and the gate, each round. Hosts with store searches: pass the show and season packages as `structure` so hooks see topics. Corpus adapters: support `options.structure` and hooks on store cases. |
| The manifest's `terms` block, the creator's terms for AI use, rating and rights (package spec §4.14, [ADR-0036](docs/adr/0036-creators-terms-travel-with-the-work.md)). Permissions are booleans under `ai.allowed` (`device`, `host`, `provider`, `training`, `machineTranslation`) and `rights.repackage.allowed`; an absent field is not set (package spec §2, "Values"). Readers expose the block with its problems and an authority, resolve it when asked, and apply a terms gate when a search has a terms request (Reader contract §15). The authority is `packager` or `unverified`. **In 0.7.0 no package can loosen the platform defaults:** a package's permissions only make them stricter, so, for example, `ai.allowed.training: true` has no effect until owner authority arrives in a later version. Nodes may also give `generated.model`, the model's name and version. | `U001`–`U003` (warning); `U004` (info) | Producers: write `terms` only with the signer's real knowledge; never state consent you do not hold. Write `true` or `false`, never `"allow"` or `"deny"` (a string there is `U001`, and counts as not allowed); leave out what you do not know. Readers: validate against `terms.schema.json` (warnings, never `M002`), expose exactly, implement §15. Hosts that hand content to models: send a terms request with the real destination and use. Store searches: rebuild package states, which carry `terms`. |
| Rights in `terms`: `rights.export.allowed`, `rights.copyright`, `rights.notice`, and `rights` (`license`, `copyright`) in `terms.nodes` entries (package spec §4.14) | `U001`, `U003` (warnings) | Producers: optional. Readers: check them with the rest of `terms`, resolve export (contract §15.3) and carry `node.license` and `node.copyright` in records (§7). Hosts that let people copy text out of the app check export first. |
| `datePackaged` in the manifest (package spec §4.12) | `M002` | Optional: an RFC 3339 date-time with an offset. Producers that want reproducible builds take it from the sources. Readers carry it in the result and as `package.datePackaged`. |
| A trust-root entry with the `package` role and `ids` signs only packages whose `id` its `ids` cover (attestations §6, [ADR-0040](docs/adr/0040-ids-bind-a-signer-to-package-ids.md)). Under 0.6.0, `ids` limited relations only | `A010_SIGNER_NOT_FOR_PACKAGE` (error); the package is not `signed` | Hosts: check each entry's `ids` cover every package you expect it to sign, or remove `ids` from an entry that should sign any id. Hosts with more than one publisher: give each entry the `ids` of its own packages. Readers: implement step 9 of attestations §7. |
| Terms and ratings fail closed: a container in `terms` with the wrong type sets everything under it to its strictest; a record rated only under a scheme the host did not list is unrated; a rating request with a member this version does not define (the drafted `mode` is removed) removes every record (contract §15.3–15.4) | — (`U004` counts what the gate removes) | Hosts: send only `explicit`, `schemes`, `allowUnrated` and `acceptFeedRatings` in a rating request. Readers: follow the "rated" rules exactly. |
| Archives: exactly one end-of-central-directory record, no Zip64, and local headers that agree with the central directory (contract §3) | `T003` | Producers: write plain Zip archives (every common tool does within the default limits). Readers: check these records before reading any entry. |
| New limits: `maxAttestations` (256 files), `maxAttestationBytes` (1 MiB each), 16 signature entries in one DSSE envelope (fixed), and collection members in a structure file counted against `maxTriples` (contract §3) | `A001`, `O001` | None for ordinary packages. Readers: enforce them, and keep work on links and evidence text roughly linear. |
| JSON and YAML frontmatter are nested at most 64 levels deep, counting the outermost object or mapping; the limit is fixed (contract §3) | `M001`, `C002` (`C004`), `A001`, `E005`, `S001`, `S004` | None for real packages. Readers: set your JSON and YAML parsers' depth limit to exactly 64 (defaults differ: some are 64 already, others 100 or more), or check the depth before parsing. |
| Sigstore: the minimum a Reader checks is listed in attestations §7; issuer and subject are compared by the Reader, as whole strings; offline verification makes no request at all (attestations §6) | `A002` | Readers that use a Sigstore library: compare the identity yourself unless the library's match is exact, and never start an update client offline. |
| Everything a Reader hands to a model goes through the terms gate: records, structure labels and definitions, text sent for embedding or indexing, and what is said about packages (Reader contract §9.4, §10, §12, §15.4, [ADR-0041](docs/adr/0041-what-the-terms-gate-covers-and-hiding-a-closed-package.md)). New: `Library.catalogue`, `Library.structureFor`, ingest with a terms request, `ai.allowed.mention`, and the `excluded` and `hidden` counts on `U004` | `U004` on an ingest | Readers: implement them, vendor `terms.schema.json` and the new `catalogue-entry.schema.json`, and support the runner's `options.ingestTerms`, `options.terms` on structure cases, `expect.termsExcluded` and the `catalogue` case kind. Bindings a model calls: always pass a terms request (default `provider`) to search, ingest, structure and the catalogue; follow the list in §15.4 so nothing names a hidden package. Hosts: name your embedder's destination when you ingest. |
| **Content embedded before 0.7.0** may include text a creator closed to your embedder's destination: ingest had no terms request | — | Hosts with a store: re-ingest with a terms request for your embedder's destination, or remove the closed packages' records (every reference store backend removes by package digest). |
| Citation records may carry new fields | — | Consumers ignore fields they do not know (Reader contract §7). |

### What 0.6 Readers do with 0.7 packages

- **An envelope** has no `moca.json` at its root: `T002_MANIFEST_NOT_FOUND`.
- **An issued copy** reads as a changed package: the publisher's attestation is `A008`, and the copy is refused
  under `requireSignature`. That fails safe.
- **A trust root that lists `issued-copy`** is refused, because the `roles` enum is closed.
- **New manifest keys** (`distribution`, `images`, `translations`, `tags`, `apps`, `readingOrder`,
  `issuedCopies`, `datePublished`, `datePackaged`, `url`, `contributors`) are unknown keys (`M004`, info) and are ignored.
- **A `publisher` object** fails the 0.6 manifest schema (`M002`): the package is invalid to a 0.6 Reader. A
  package that must reach 0.6 Readers leaves `publisher` out. `moca.media` and
  `moca.date_published` are ignored.
- **A composite package's structure** that uses member ids as concepts reads as before; its bindings have no effect.
- **`terms`** is an unknown key (`M004`, info): a 0.6 Reader never exposes it and has no terms gate, so a host that
  honours creators' terms needs a 0.7 Reader.
- **A member that is an issued copy** does not match its pin (`R002`), and the publisher's sidecar is stale on it
  (`S003`).
- **`mocaVersion` `0.7`** is newer than the Reader (`M009`, warning); the package is read under the newest rules the Reader implements.

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
