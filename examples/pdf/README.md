# PDF manuals

A package built with `moca-convert` from the 19 PDFs of the FAA's *Airplane
Flying Handbook* (FAA-H-8083-3C): its 18 chapters and its glossary, about
270 MB of PDF and 370 pages. Nothing in it was written by hand.

- `capture/pdfs.json` lists the PDFs in order, with each one's title, the URL
  the FAA publishes it at, and its SHA-256. The PDFs themselves are not in
  the repository; `scripts/fetch-pdfs.mjs` downloads them next to it.
- `airplane-flying-handbook/` is the package: 251 nodes, one per section of
  a chapter or letter of the glossary, about 210,000 words. Each chapter has
  an `index.md` listing its sections, and `structure.ttl` keeps the chapters
  in order (`skos:OrderedCollection`), makes each section a part of its
  chapter (`dcterms:hasPart`), and binds every node to its section with
  `moca.concepts`.

What it shows:

- **Large source documents split for retrieval.** Sections are found from
  the PDFs' type: 18pt handbook title, 14pt chapter, 12pt sections (a node
  each), and bold run-in subheadings, which stay inside the node as `##`
  headings for `moca-index --chunk headings`.
- **Page evidence.** Each node cites every PDF page it came from as an
  RFC 3778 fragment (`page=6`), noting the page number printed on it
  (`p. 4-6`), and its `resource` opens the PDF at its first page.
- **Evidence that stays with the publisher.** The PDFs are cited by their
  FAA URLs (`--sources link`) rather than carried in the package, so the
  package is `located-evidence` but not `self-contained-evidence`. Converted
  with the default `--sources copy`, the same package would carry the PDFs
  under `sources/` and be self-contained, at 270 MB.

Tables and diagrams come through as the text they contain; the figures
themselves stay in the PDFs, and each keeps its caption.

## Regenerating

From the repository root, with Node 22 or later:

```sh
node scripts/fetch-pdfs.mjs examples/pdf/capture

node tools/moca-convert/bin/moca-convert.js examples/pdf/capture \
  -o examples/pdf/airplane-flying-handbook \
  --id https://example.com/moca/pdf/airplane-flying-handbook \
  --language en --sources link --force
```

The fetch checks every download against its pinned SHA-256, and so does the
conversion, so the same PDFs always give a byte-identical package. When the
FAA revises a chapter, the fetch fails for it: download it again and update
its `sha256` (`fetch-pdfs.mjs --pin` records the digest of any document that
has none).

To search it with a sidecar index:

```sh
node tools/moca-index/bin/moca-index.js build examples/pdf/airplane-flying-handbook \
  -o afh.moca.idx --chunk headings
```

## Attribution

*Airplane Flying Handbook* (FAA-H-8083-3C), U.S. Department of
Transportation, Federal Aviation Administration, Flight Standards Service,
published at
<https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook>.
It is a work of the United States Government and is not subject to
copyright in the United States (17 U.S.C. § 105). The text here is extracted
from it unchanged apart from layout. The FAA is not affiliated with MOCA and
does not endorse it.
