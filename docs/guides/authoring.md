# Authoring packages

## Start from OKF

Every `.md` file under `content/` is an OKF concept document with frontmatter
and a `type`. Use OKF's fields for what they are for:

| Field | Use it for |
| --- | --- |
| `type` | What the node is: `Policy`, `Procedure`, `Guide`, `API Operation`... There is no fixed list. |
| `title`, `description`, `tags` | Display and search. |
| `sources` | What the node is based on. Give each an `id` so evidence can point at it. |
| `generated` | That a tool or model drafted it: `{ by: acme-drafter/2.1, at: ... }`. |
| `verified` | Who says they checked it and when. For a verifiable check, add a review attestation too. |
| `status` | `draft`, `stable` (default) or `deprecated`. |
| `stale_after` | When it must be re-checked. |

`content/index.md` and `content/log.md` are reserved by OKF: an index with no
frontmatter (the root one may declare `okf_version`), and a change log whose
`##` headings start with a date.

## Add what MOCA adds, under `moca`

### Evidence

Point at the exact part of a source that supports the node:

```yaml
sources:
  - id: terms-7
    resource: ../sources/refund-policy-2026.txt
  - id: talk
    resource: https://example.com/talks/refunds.mp4
  - id: handbook
    resource: ../sources/handbook.pdf
moca:
  evidence:
    - source: terms-7
      selector: { type: TextQuoteSelector, exact: "within 30 days of delivery" }
    - source: talk
      selector: { type: FragmentSelector, conformsTo: "http://www.w3.org/TR/media-frags/", value: "t=75,210" }
    - source: handbook
      selector: { type: FragmentSelector, conformsTo: "http://tools.ietf.org/rfc/rfc3778", value: "page=12" }
```

Put the source files in the package, under `sources/` or `media/`, and cite
them by package path, so the evidence travels with the claim. When every
cited source is inside the package, it has `self-contained-evidence`. Readers
check each `TextQuoteSelector` and `TextPositionSelector` against text sources
(`.txt`, `.md`) and mark the citation `verified`. A quote that does not match
the file exactly, character for character, is reported as
`C011_EVIDENCE_SELECTOR_UNMATCHED`.

### Validity

`moca.valid_from` and `moca.valid_until` say when a node is in force; the
manifest's `validFrom` and `validUntil` say it for the whole package. Readers
leave out-of-force content out of search by default. Use `stale_after` for
"check again by", and the validity window for "stops applying on".

### Contest

`moca.contested_by: [<node or package id>]` records that other content
disputes this node. Readers flag it; your application decides what to do.

### Audience

`moca.audience: internal` lets a host serving the public filter the node out
before retrieval. It is a label, not protection: do not put content in a
package that a group must never obtain.

## Versions

Bump `version` in `moca.json` whenever content changes:

- **major** when a statement changed meaning or was removed;
- **minor** when you only added;
- **patch** for editorial changes.

## Composing and relating packages

To build one package from others, list them as `members`, pinned by digest:

```json
"members": [
  { "id": "https://example.com/moca/handbook/service-ownership", "version": "1.0.0", "digest": "sha256:…" }
]
```

`moca-lint digest <member>` prints the digest to pin.

To retire an older version, or record a conflict, use `relations`:

```json
"relations": [
  { "type": "supersedes", "target": "https://example.com/moca/policies/data-retention", "version": "1.0.0" }
]
```

## Locales

Add `fr` to `locales` and write `refund-window.fr.md` beside
`refund-window.md`. It is the same node in French.

## Check before you ship

```sh
node tools/moca-lint/bin/moca-lint.js lint my-package --strict
```

Then sign it ([signing and review](signing-and-review.md)).
