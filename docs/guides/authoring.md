# Authoring packages

This guide builds one package step by step, the way you would for real
content, and checks it with `moca-lint` after every step. By the end it has
evidence quoted from its source document, a page that is not in force yet,
an internal page, a French translation, and it is packed into one file.
Every command and output below was run with the 0.6.0 tools.

You need Node.js 22 or later; `npx` fetches each tool. If you have not made a
package before, the [quickstart](../quickstart.md) takes five minutes. If
your content already exists as Markdown, PDFs or videos,
[`moca-convert`](https://github.com/openmoca/moca-convert#readme) writes the
package for you, and this guide explains what it wrote.

| Step | You add | What it gives you |
| --- | --- | --- |
| [1](#1-a-package-and-its-first-page) | A manifest and one page | `core`: a package any Reader can read and cite |
| [2](#2-evidence-from-the-source-document) | The source document, and the sentence the page relies on | `located-evidence`, `self-contained-evidence`: quotes checked against the original |
| [3](#3-when-a-page-is-in-force) | A page that is not in force yet | Search leaves it out until its date |
| [4](#4-who-a-page-is-for) | An internal page | A public assistant never returns it |
| [5](#5-a-translation) | A French version of a page | `localized`: the right language for each caller |
| [6](#6-check-and-pack) | Nothing: check and pack | One `.moca` file, ready to sign and ship |

## 1. A package and its first page

A package is a folder with a manifest, `moca.json`, and the knowledge under
`content/`, one Markdown page per topic. Acme, a made-up shop, starts with its
refund policy:

```sh
mkdir -p acme-policies/content
```

`acme-policies/moca.json`:

```json
{
  "id": "https://example.com/moca/acme-policies",
  "version": "1.0.0",
  "title": "Acme customer policies",
  "language": "en",
  "publisher": "Acme Ltd",
  "license": "CC-BY-4.0"
}
```

- **`id`** names the package across all its versions. Use an address under a
  domain you control, so no one else can claim the same name.
- **`version`** changes whenever the content does ([versions](#versions)).
- **`title`** is shown to people. `language`, `publisher` and `license` (an
  SPDX expression) are optional, and worth setting.

`acme-policies/content/refund-window.md`:

```markdown
---
type: Policy
title: Refund window
description: How long customers have to ask for a refund.
tags: [refunds]
generated:
  by: acme-drafter/2.1
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
stale_after: 2027-03-14T00:00:00Z
---

# Refund window

Customers may ask for a full refund within 30 days of delivery.
```

Each page is an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
document: Markdown with frontmatter. Use OKF's fields for what they are for:

| Field | Use it for |
| --- | --- |
| `type` | What the page is: `Policy`, `Procedure`, `Guide`, `API Operation`… There is no fixed list. The only required field. |
| `title`, `description`, `tags` | Display and search. |
| `sources` | What the page is based on (step 2). |
| `generated` | That a tool or model drafted it, and when. |
| `verified` | Who says they checked it, and when. It is the author's statement; a signed review makes it verifiable ([signing and review](signing-and-review.md)). |
| `status` | `draft`, `stable` (the default) or `deprecated`. Deprecated pages are left out of search. This is how to retire a page: deprecating its concept in `structure.ttl` does not ([package spec §5.5](../../spec/moca-package-spec.md#55-trust-fields)). |
| `stale_after` | When it is due to be checked again. After that date, results from it are flagged `stale`. |

`content/index.md` and `content/log.md` are reserved by OKF: an index with no
frontmatter, and a change log whose `##` headings start with a date.

Check it:

```sh
npx @openmoca/moca-lint lint acme-policies
```

```text
No findings.

sha256:8af8c7e923063d9f591f5841a1df0efc5ca836f1a3000a1b504f665d30433fa4
capabilities: core
```

The `sha256:` line is the package's digest, a fingerprint of every file.
`core` means any Reader can read, search and cite it.

## 2. Evidence from the source document

The refund page restates Acme's customer terms. Put the terms in the package,
and point at the exact sentence the page relies on. Then every Reader can
check the quote against the original, with no network.

`acme-policies/sources/customer-terms.txt`:

```text
Acme Customer Terms

7. Refunds

7.1 Customers may request a full refund within 30 days of delivery.
7.2 Items marked as final sale are not eligible for a refund.
```

Add the source and the evidence to the page's frontmatter:

```yaml
sources:
  - id: terms-7
    title: Acme Customer Terms, section 7
    resource: ../sources/customer-terms.txt
moca:
  evidence:
    - source: terms-7
      selector:
        type: TextQuoteSelector
        exact: Customers may request a full refund within 30 days of delivery.
```

- **`sources`** is OKF's. Give each source an `id`, so evidence can point at
  it, and a `resource`: here, a path from the page to the file.
- **`moca.evidence`** says which part of a source supports the page. MOCA's
  additions to a page all sit under one key, `moca`, so they never clash with
  OKF.

```sh
npx @openmoca/moca-lint lint acme-policies
```

```text
No findings.

sha256:6f05df9779b1bb967cf8bc4affda6f9e9cb5f46f4c04e94100c1da28704d3c83
capabilities: core, located-evidence, self-contained-evidence
```

- **`located-evidence`**: a page points at the exact part of a source.
- **`self-contained-evidence`**: every source it cites is inside the package,
  so each quote can be checked against the original, offline. Whether each
  one matches is reported separately, as below.

This is what a quote that does not match looks like. Say the page claimed 28
days:

```text
content/refund-window.md
  WARNING C011_EVIDENCE_SELECTOR_UNMATCHED  evidence TextQuoteSelector for source "terms-7" does not match sources/customer-terms.txt

0 error(s), 1 warning(s), 0 info
```

A Reader marks that evidence `matched: false` in every citation, so an
application can treat the page with care. Matching ignores differences in
spaces, line breaks and similar formatting
([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)),
so a quote copied from the rendered text still matches.

Text is not the only kind of source. A selector can point at any of these:

| To cite | Selector |
| --- | --- |
| A sentence in a text, Markdown, HTML or WebVTT file | `{ type: TextQuoteSelector, exact: "…" }`, or `TextPositionSelector` with `start` and `end` |
| A page of a PDF | `{ type: FragmentSelector, conformsTo: "http://tools.ietf.org/rfc/rfc3778", value: "page=12" }` |
| A moment in a video or recording | `{ type: FragmentSelector, conformsTo: "http://www.w3.org/TR/media-frags/", value: "t=75,210" }`; put the WebVTT captions under `media/` so the range can be checked |

Put source files under `sources/`, and media and captions under `media/`.
A source cited by a web address still works, as `located-evidence`, but the
quote cannot be checked offline.

## 3. When a page is in force

Acme's refund window grows to 45 days on 1 January 2027. Write the new page
now, with the date it starts:

`acme-policies/content/refund-window-2027.md`:

```markdown
---
type: Policy
title: Refund window from 2027
description: The refund window from 1 January 2027.
moca:
  valid_from: 2027-01-01T00:00:00Z
---

# Refund window from 2027

From 1 January 2027, customers may ask for a full refund within 45 days of delivery.
```

`moca.valid_from` and `moca.valid_until` say when a page is in force. The
manifest's `validFrom` and `validUntil` say it for the whole package. Until
its date, a search for "refund" returns only the current page; the 2027 page
comes back only if the application asks for everything (`includeAll`), and
then it is flagged `inForce: false`.

Two dates, two meanings:

- **`stale_after`**: "check this again by". The page still applies.
- **`valid_until`**: "this stops applying on". Search leaves it out after
  that date.

## 4. Who a page is for

Support staff have their own procedure, which customers should not see:

`acme-policies/content/handling-refunds.md`:

```markdown
---
type: Procedure
title: Handling a refund request
status: draft
moca:
  audience: internal
---

# Handling a refund request

Check the delivery date in the order system, then approve the refund.
```

An application serving customers searches for the `public` audience, and never
gets this page, whatever the query. A staff assistant asks for `public` and
`internal`, and does.

`audience` is a label, not protection: anyone with the package file can read
every page in it. Never put content in a package that some readers must never
see; make a separate package for them.

```sh
npx @openmoca/moca-lint lint acme-policies
```

```text
No findings.

sha256:4accf82ca9510801e51584d4f7962b894ceca8be282955cecd98a0047b5cb205
capabilities: core, located-evidence, self-contained-evidence
```

## 5. A translation

Add `fr` to the manifest's `locales`:

```json
"locales": ["fr"]
```

and write the French version beside the English one, named `<page>.<language>.md`:

`acme-policies/content/refund-window.fr.md`:

```markdown
---
type: Policy
title: Délai de remboursement
---

# Délai de remboursement

Les clients peuvent demander un remboursement complet dans les 30 jours suivant la livraison.
```

It is the same page in French, not a new page: it shares the English page's
identity and citations. A search with the locale `fr` returns the French text.

**Each language's file has its own frontmatter.** The Reader takes the trust
fields from the file it returns, so repeat in each translation what matters:
`moca.valid_from` and `valid_until`, `status`, `stale_after`, and evidence
from a source in that language. `moca.audience` is the exception: a
translation with no audience of its own has its English file's, so the French
version of the internal procedure in step 4 stays internal. A host that
filters by audience leaves out pages with no label at all, so label every
page you write. [`examples/acme-support`](../../examples/acme-support)
does this for 34 pages.

```sh
npx @openmoca/moca-lint lint acme-policies
```

```text
No findings.

sha256:e58a7cfca2bb0c8178e74d3f9408e4238809135d646a628685c60d78bf0c34ac
capabilities: core, localized, located-evidence, self-contained-evidence
```

## 6. Check and pack

Before you ship, check with `--strict`, which treats warnings as errors, so an
unmatched quote stops the release:

```sh
npx @openmoca/moca-lint lint acme-policies --strict
```

`moca-lint info` summarises what is in the package:

```sh
npx @openmoca/moca-lint info acme-policies
```

```json
{
  "id": "https://example.com/moca/acme-policies",
  "version": "1.0.0",
  "digest": "sha256:e58a7cfca2bb0c8178e74d3f9408e4238809135d646a628685c60d78bf0c34ac",
  "valid": true,
  "capabilities": ["core", "localized", "located-evidence", "self-contained-evidence"],
  "nodes": [
    { "path": "handling-refunds.md", "type": "Procedure", "locales": ["default"] },
    { "path": "refund-window-2027.md", "type": "Policy", "locales": ["default"] },
    { "path": "refund-window.md", "type": "Policy", "locales": ["default", "fr"] }
  ],
  "members": [],
  "attestations": [],
  "profiles": []
}
```

Pack it into one file:

```sh
npx @openmoca/moca-lint pack acme-policies -o acme-policies.moca
```

```text
Wrote acme-policies.moca
```

The `.moca` file has the same digest as the folder. Next,
[sign it](signing-and-review.md) so readers can verify it came from you.

## Versions

Change `version` in `moca.json` whenever the content changes, so a citation
always names the text it came from:

- **major** when a statement changed meaning or was removed;
- **minor** when you only added;
- **patch** for wording that changes nothing.

When a new package replaces an old one, say so with a relation, and sign the
new package. A Reader with both loaded marks the old one's pages
`superseded`, and leaves them out of search, when the reader's trust root lets
your signing key speak for the old package's id (its `ids`, for example
`https://example.com/moca/`). An unsigned relation, or one your key is not
trusted for, is reported (`R004`) and has no effect, so nobody can retire
another publisher's content just by naming it
([package spec §7.2](../../spec/moca-package-spec.md#72-relations)):

```json
"relations": [
  { "type": "supersedes", "target": "https://example.com/moca/acme-policies-2025", "version": "1.0.0" }
]
```

Other relations are `amends` (changes part of it), `conflictsWith` (the two
disagree, and both are flagged `contested`, under the same signing rule) and
`crossReferences` (a link).
[`examples/policy-corpus`](../../examples/policy-corpus) shows two versions
of a policy, the second superseding the first. For a single page that another
disputes, `moca.contested_by` lists the disputing pages or packages.

## Composing packages

A large handbook can be built from smaller packages. List them as `members`,
each pinned by its digest, so the handbook fixes exactly which version of each
it contains:

```json
"members": [
  { "id": "https://example.com/moca/handbook/service-ownership", "version": "1.0.0", "digest": "sha256:…" }
]
```

`npx @openmoca/moca-lint digest <member>` prints the digest to pin. A package
with members is `composed`; see
[`examples/handbook`](../../examples/handbook).

## Next

- [Structure](structure.md): topics, parts, order and what requires what.
- [Signing and review](signing-and-review.md): prove who published it and who
  checked it.
- [Capabilities](capabilities.md): which of these your use needs.
- [Package specification](../../spec/moca-package-spec.md): every field and
  rule.
