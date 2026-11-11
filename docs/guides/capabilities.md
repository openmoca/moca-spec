# Capabilities

MOCA has no conformance levels to aim for. Instead, a Reader looks at a
package and reports the **capabilities** it actually has: what it contains,
and what verified. You add only what your use needs, and a reader can see
exactly what it is getting
([package spec §11](../../spec/moca-package-spec.md#11-capabilities)).

## See a package's capabilities

`moca-lint` prints them under the digest:

```sh
npx @openmoca/moca-lint lint support-kb.moca --trust-root example-trust-root.json
```

```text
No findings.

sha256:4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da
capabilities: core, localized, located-evidence, reviewed, self-contained-evidence, signed
```

In code, they are the package's `capabilities` after you read it
([consuming packages](consuming.md#1-read-once-verify-once)), so an
application can require the ones it needs, such as refusing any package that
is not `signed`.

## What each one means

| Capability | What it gives you | How to get it | Example |
| --- | --- | --- | --- |
| `core` | A valid package: identity, version, digest, pages, and citation records. Every other capability needs it. | A manifest and a `type` on each page ([authoring, step 1](authoring.md#1-a-package-and-its-first-page)). | All of them |
| `located-evidence` | Answers that point at the exact sentence, page or moment of a source. | `sources` with ids, and `moca.evidence` selectors ([step 2](authoring.md#2-evidence-from-the-source-document)). | `airplane-flying-handbook` (cited to the PDF page) |
| `self-contained-evidence` | The originals travel inside the package, so each quote can be checked offline. | Put cited files under `sources/` or `media/`, and cite them by package path. | `support-kb`, `youtube-video` |
| `localized` | One page in several languages; each caller gets theirs. | `locales`, and `<page>.<language>.md` files ([step 5](authoring.md#5-a-translation)). | `support-kb` (English and French) |
| `structured` | Topics, parts, order and what requires what: structure questions, search within a topic, ontology-guided search. | `structure.ttl` and `moca.concepts` on pages ([structure](structure.md)). | `handbook-incident-response`, `airplane-flying-handbook` |
| `composed` | One package assembled from others, each pinned to an exact version. | `members` pinned by digest ([composing](authoring.md#composing-packages)). | `handbook` |
| `signed` | Proof of who published it. | A package attestation that verifies against the reader's trust root ([signing](signing-and-review.md)). | `support-kb` |
| `reviewed` | Proof of who checked which page, and that every reviewed page was found accurate. | A signed package, and for each reviewed page a current review that says `accurate`, with none against it. | `support-kb` |

Each example is a `.moca` file in the
[latest release](https://github.com/openmoca/moca-spec/releases/latest), as
used in the command above.

## A capability is earned, not declared

A Reader decides each capability from what it finds, every time it reads the
package. So a capability can be lost:

- **`structured`** is withheld while any structure problem remains, such as
  a concept used but not declared (`O002`).
- **`signed`** and **`reviewed`** depend on the **reader's** trust root. The
  same package is `signed` for a reader who trusts its publisher, and not for
  one who does not. Without a trust root, it is never `signed`.
- **`reviewed`** stops counting for a page as soon as the page changes.
- **`self-contained-evidence`** says the originals are in the package, not
  that every quote matches. A quote that does not match is reported as
  `C011_EVIDENCE_SELECTOR_UNMATCHED`, and shows as `matched: false` in the
  citation.

## Where to start

| Situation | Capabilities |
| --- | --- |
| One team, an internal assistant | `core` |
| Content shared with another team or organisation | `core`, `signed` |
| Regulated or high-stakes answers | `core`, `signed`, `reviewed`, `located-evidence`, `self-contained-evidence` |
| Knowledge moved to another platform, or read on a device with no network | add `self-contained-evidence` |
| A handbook or product line assembled from parts | add `composed` |
| Procedures, regulations, guidelines or courses: anything with parts, order or prerequisites | add `structured` |
| Readers in more than one language | add `localized` |
