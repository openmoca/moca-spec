# A small guide to rock pools

A short, original guide in five pages, written for this repository as the
running example of what a MOCA package carries beyond its text. The press, the
author and the model named in it are made up; the source it cites is real.

| What it shows | Where |
| --- | --- |
| **Credits**: a publisher, the work's own page, and its author ([package spec §4.13](../../spec/moca-package-spec.md#413-credits)) | `moca.json`: `publisher`, `url`, `contributors` |
| **Dates**: first published, and when these bytes were made (§4.12) | `moca.json`: `datePublished`, `datePackaged` |
| **The creator's terms**, signed: AI use on a device, in the host's service or with a provider that keeps nothing and trains on nothing; no training; a rating; rights, copyright and a message from the creator (§4.14) | `moca.json`: `terms` |
| **A stricter term on one part**: the author's field notes are never sent to a third party's model, and never machine-translated | `terms.nodes` |
| **Machine-made, not checked**: a summary a model made (`generated`, with `model`) | `content/at-a-glance.md` |
| **Machine-made, checked by a person**: a glossary a model drafted and the author checked (`generated` and `verified`) | `content/glossary.md` |
| **A citation that opens its source**: quotes from a NOAA page, each checked against a dated copy inside the package, and one that links to the page itself | `content/when-to-go.md`, `sources/` |
| **A publisher signature** over all of it, terms included | `attestations/` |

The signature is made with the published, insecure example key in
`fixtures/signing-keys/`, which may sign only ids under `https://example.com/`.
Never trust that key for real content. Check the package and its terms with:

```sh
npx @openmoca/moca-lint lint examples/rock-pools \
  --trust-root fixtures/signing-keys/trust-root.json
```

## The source

`sources/noaa-what-is-a-tide-pool.txt` is an excerpt, word for word, of
[What is a tide pool?](https://oceanservice.noaa.gov/facts/tide-pool.html)
from NOAA's National Ocean Service, a work of the United States government in
the public domain in the United States. The copy is dated, so a quote checked
against it stays checked if the page changes; the link lets a reader open the
page itself.

## Licence

The guide is under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
like the other examples. The NOAA excerpt is in the public domain, as above.
