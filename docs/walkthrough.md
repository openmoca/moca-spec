# Walkthrough

In about fifteen minutes you will take a small knowledge base and turn it into
a package that is checked, signed, reviewed, searchable and served to an AI
agent. Then you will change one word and watch the signatures fail.

Every command and output below was run with the 0.6.0 tools. You need some
comfort with a terminal, but no knowledge of MOCA.

## The story

**Acme** is a made-up online shop. Its support team keeps a knowledge base:
34 pages in Markdown, every one in English and French, on orders, delivery,
returns, payments, accounts and products, plus the team's own procedures.
Acme wants to hand this knowledge to AI assistants in a form they can trust.

Three roles take part. In this walkthrough you play all three, on one
machine. In real life each would be a different person or team, with their
own keys.

| Role | Who | What they do |
| --- | --- | --- |
| **Publisher** | Acme's publishing team | Signs the package, to say "this is ours, as we released it" |
| **Reviewer** | Sam Ortiz, Acme's support lead | Checks the refund page, in both languages, against Acme's customer terms, and signs a review of it |
| **Reader** | Anyone who loads the package, such as an AI assistant | Decides whose signatures to trust, and checks them |

## Before you start

You need:

- **Node.js 22 or later.** Each tool runs with `npx`, which downloads it the
  first time.
- **Git**, to get the example.
- **A Unix shell**: macOS, Linux, or WSL on Windows.

Get the example and make a working copy of it:

```sh
git clone --depth 1 --branch v0.6.0 https://github.com/openmoca/moca-spec.git
mkdir moca-walkthrough
cp -R moca-spec/examples/acme-support moca-walkthrough/acme-support
cd moca-walkthrough
rm -rf acme-support/attestations
```

The example ships already signed. The last line removes those signatures, so
you can make your own. Every command from here runs in `moca-walkthrough`.

The package is an ordinary folder:

```text
acme-support/
  moca.json       the manifest
  content/        the pages, in folders by topic
  sources/        the originals
  structure.ttl   how the topics fit together
```

- **`moca.json`** is the manifest: the package's id, version and title.
- **`content/`** holds the knowledge, one Markdown page per topic, such as
  `returns/refund-window.md`, with its French version beside it,
  `returns/refund-window.fr.md`.
- **`sources/`** holds the original documents the pages quote: here, Acme's
  customer terms, in English and French.
- **`structure.ttl`** says how the pages fit together, such as which steps
  come before returning an item ([structure](guides/structure.md)).

The five pages in `content/support/` are marked `audience: internal`: they are
for support staff, not customers. You will see that matter in step 8.

## 1. Check the package

`moca-lint` checks that the folder is a valid package.

```sh
npx @openmoca/moca-lint lint acme-support
```

```text
No findings.

sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
capabilities: core, localized, located-evidence, self-contained-evidence, structured
```

- **The `sha256:` line is the package's digest**: a fingerprint of every file
  in it. Change one character anywhere and the digest changes. Yours will
  match the one above, because you have the same files.
- **The capabilities** say what the package offers beyond the basics:
  - `localized`: its pages have translations (French);
  - `located-evidence`: pages point at the exact sentences they rely on;
  - `self-contained-evidence`: the documents those sentences come from are
    in `sources/`, inside the package, so every quote can be checked;
  - `structured`: `structure.ttl` parsed, and every page's topic resolved.

## 2. Create keys for the publisher and the reviewer

Each signer needs a key pair: a private key to sign with, and a public key that
others check signatures with.

```sh
npx @openmoca/moca-sign keygen --keyid acme-publisher --roles package --identity "Acme publishing key" --out keys
npx @openmoca/moca-sign keygen --keyid sam-reviewer --roles review --identity "Sam Ortiz" --out keys
```

```text
Wrote acme-publisher.pem and acme-publisher.pub.pem, and added the key to keys/trust-root.json. Keep private keys out of every package.
Wrote sam-reviewer.pem and sam-reviewer.pub.pem, and added the key to keys/trust-root.json. Keep private keys out of every package.
```

`keys/` now holds:

- **`*.pem`**: the private keys. In real life each signer keeps theirs
  secret.
- **`*.pub.pem`**: the public keys.
- **`trust-root.json`**: a list of public keys to trust, and for what. Acme's
  key may sign packages (`--roles package`). Sam's may only sign reviews
  (`--roles review`).

The trust root belongs to the **reader**, not the publisher: it is how a
reader says whom they trust. Here the tool wrote one for you, for the steps
that follow. See what it trusts:

```sh
npx @openmoca/moca-sign trust list keys/trust-root.json
```

```text
key  package  acme-publisher (Acme publishing key)
key  review   sam-reviewer (Sam Ortiz)
```

In real life, a reader who receives Acme's public key adds it to their own
trust root with `moca-sign trust add`
([Consuming packages](guides/consuming.md#your-trust-root)).

In production, prefer Sigstore (`--sigstore`). It signs with an identity you
already have, typically your CI workflow's, so there are no long-lived keys to
look after.

## 3. Sign as the publisher

```sh
npx @openmoca/moca-sign sign acme-support --key keys/acme-publisher.pem --keyid acme-publisher
```

```text
Signed sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
Wrote attestations/package.acme-publisher.dsse.json
```

Acme's signature is a file in `acme-support/attestations/`. It signs the digest,
so it covers every file in the package. The digest itself did not change:
signatures are kept outside it, so adding one never changes what was signed.

## 4. Record Sam's review

Sam has checked the refund page against Acme's customer terms, and signs a
review of that one page:

```sh
npx @openmoca/moca-sign review acme-support --nodes returns/refund-window.md returns/refund-window.fr.md \
  --reviewer human:sam.ortiz --scope "Checked against the customer terms" \
  --key keys/sam-reviewer.pem --keyid sam-reviewer
```

```text
Reviewed content/returns/refund-window.md, content/returns/refund-window.fr.md
Wrote attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json
```

- The file name carries the reviewer and the day. Yours will show today's
  date.
- **The review covers the exact text of both files.** If one changes, the
  review stops counting for that one (step 9).
- **Reviews are added without re-signing.** Adding one did not change the
  package or Acme's signature.

## 5. Verify, as a reader would

A reader checks the signatures against their own trust root:

```sh
npx @openmoca/moca-sign verify acme-support --trust-root keys/trust-root.json
```

```text
VALID         attestations/package.acme-publisher.dsse.json  (Acme publishing key)
VALID         attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json  (Sam Ortiz)

Verified sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
```

Check the package again, this time with the trust root:

```sh
npx @openmoca/moca-lint lint acme-support --trust-root keys/trust-root.json
```

```text
No findings.

sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
capabilities: core, localized, located-evidence, reviewed, self-contained-evidence, signed, structured
```

Two capabilities are new: `signed` (Acme's signature checks out) and
`reviewed` (Sam's review does).

Run the same check **without** `--trust-root` and both signatures are
reported as not checked, and the package is neither `signed` nor `reviewed`.
A signature only means something once a reader decides to trust the key
behind it.

## 6. Build a search index

A sidecar index is a separate file that holds the package's text in
search-sized chunks. Readers can search without one. With one, search runs
over those chunks, and the index can also carry embeddings for semantic
search, which step 8 adds.

```sh
npx @openmoca/moca-index build acme-support -o acme-support.moca.idx --chunk headings
```

```text
Wrote acme-support.moca.idx (68 item(s)) bound to sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
```

The index is **bound to the digest**. If the package changes, a Reader
reports the index as stale and ignores it, so search never returns text the
package no longer has. Check that the two belong together:

```sh
npx @openmoca/moca-lint lint acme-support --sidecar acme-support.moca.idx --trust-root keys/trust-root.json
```

```text
No findings.
```

(followed by the same digest and capabilities as in step 5).

## 7. Pack it into one file

```sh
npx @openmoca/moca-lint pack acme-support -o acme-support.moca --trust-root keys/trust-root.json
npx @openmoca/moca-lint digest acme-support.moca
```

```text
Wrote acme-support.moca
sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
```

`acme-support.moca` is the whole package, signatures included, in one file. It
has the same digest as the folder, so it is provably the same content. Ship it
however you ship files: a download, a release, object storage, or a
registry.

## 8. Serve it to an AI agent

The MOCA MCP server lets any MCP client, such as Claude Desktop, Cursor or VS
Code, search the package. Download the [MCP server](https://github.com/openmoca/moca-mcp-dotnet#readme), one file with
nothing to install, and run:

```sh
moca-mcp acme-support.moca --trust-root keys/trust-root.json --audience public
```

```text
moca-mcp: loaded https://example.com/moca/acme-support@1.0.0 sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b [core, localized, located-evidence, reviewed, self-contained-evidence, signed, structured]
```

It then waits for a client; stop it with Ctrl+C. `--audience public` says this
assistant serves customers, so internal pages are never returned.

To use it, add it to your MCP client's configuration, with full paths. Most
clients take a block like this:

```json
{
  "mcpServers": {
    "acme-support": {
      "command": "/full/path/to/moca-mcp",
      "args": ["/full/path/to/moca-walkthrough/acme-support.moca",
               "--trust-root", "/full/path/to/moca-walkthrough/keys/trust-root.json",
               "--audience", "public"]
    }
  }
}
```

To try it without a client, the MCP Inspector runs the server and lets you
call its tools in a browser:

```sh
npx @modelcontextprotocol/inspector moca-mcp acme-support.moca --trust-root keys/trust-root.json --audience public
```

Ask the agent "How long do I have to ask for a refund?", or call the
`moca_search` tool with that question and `detail` set to `full`. The top
result is a **citation record** for the refund page. Shortened, it holds:

```json
{
  "package": { "version": "1.0.0", "digest": "sha256:3fb4f2bb…", "signed": true, "signers": ["Acme publishing key"] },
  "node": { "ref": "https://example.com/moca/acme-support@1.0.0#returns/refund-window.md", "title": "Refund window" },
  "trust": {
    "attestedReviews": [{ "signer": "Sam Ortiz", "scope": "Checked against the customer terms", "outcome": "accurate" }],
    "stale": false, "inForce": true, "superseded": false
  },
  "evidence": [{
    "source": { "title": "Acme Customer Terms, section 7 (Refunds and returns)" },
    "selector": { "type": "TextQuoteSelector", "exact": "Customers may request a full refund within 30 days of delivery." },
    "matched": true
  }]
}
```

So the agent can say not just "30 days", but which version of which page says
so, that Acme published it, that Sam checked it, and the sentence in the
customer terms it rests on, found in the original.

A few more questions show the rest of the package at work, with `limit` 3:

| Question | Top results |
| --- | --- |
| How long do I have to ask for a refund | Refund window, Returns policy, Your data and privacy |
| Combien de temps pour demander un remboursement (`locale` `fr`) | Délai de remboursement, Vos données et votre vie privée, Politique de retour |
| How do staff handle a refund request | Refund window, Resetting your password, Returns policy |
| Fraud checks | No results |

- **The same answers in French.** With the locale `fr`, the French pages come
  back, with the same identity and citations as the English ones.
- **Internal pages never come back.** Acme has a procedure for handling
  refund requests, and one for fraud checks, but both are internal, and this
  server serves only the `public` audience, so a caller cannot reach them.
- **Old and future rules stay out.** The 2025 refund window has expired, and
  the 2027 returns portal has not started: neither is returned unless the host
  asks for everything.

### Ask by meaning

Search so far matches words. Ask "I want my money back" and nothing on the
refund pages shares those words. An index with embeddings, built with one of
MOCA's standard models, lets the server search by meaning too. The model runs
on your machine; install it once, then build the index with it:

```sh
moca-mcp models add bge-small-en-v1.5
npx @openmoca/moca-index build acme-support -o acme-support.bge-small-en-v1.5.moca.idx --chunk headings --model bge-small-en-v1.5
moca-mcp acme-support.moca=acme-support.bge-small-en-v1.5.moca.idx --trust-root keys/trust-root.json --audience public
```

(The same index is a download on the
[release](https://github.com/openmoca/moca-spec/releases/tag/v0.6.0), as
`acme-support.bge-small-en-v1.5.moca.idx.zip`. The server reads it as it is.)

`moca_search` takes a `mode`. With "I want my money back" and `limit` 3:

| `mode` | Top results |
| --- | --- |
| `lexical` | Damaged or faulty items |
| `semantic` | Refund window, Returns policy, Politique de retour |
| `hybrid`, the default | Damaged or faulty items, Refund window, Returns policy |

- **Meaning finds the refund pages**, though the question shares no words
  with them. Hybrid search keeps both kinds of match.
- **Semantic search always returns the nearest pages**, even when none is a
  good answer; the scores say how near. Set `locale` to keep to one language.
- **The rules still hold.** Internal pages, expired rules and the signatures
  work exactly as before: meaning changes how pages are found, not which ones
  a caller may see.

## 9. See what tampering looks like

Change one word on the refund page, from 30 days to 45, then verify again:

```sh
sed -i.bak 's/30 days of delivery/45 days of delivery/' acme-support/content/returns/refund-window.md
npx @openmoca/moca-sign verify acme-support --trust-root keys/trust-root.json
```

```text
INVALID       attestations/package.acme-publisher.dsse.json  (Acme publishing key)  subject digest does not match the package digest
VALID         attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json  (Sam Ortiz)

attestations/package.acme-publisher.dsse.json
  ERROR A008_PACKAGE_DIGEST_MISMATCH  package attestation does not match this package: subject digest does not match the package digest
attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json
  WARNING A006_REVIEW_OUTDATED  review of content/returns/refund-window.md no longer matches the file

1 error(s), 1 warning(s), 0 info

Verification failed.
```

- **Acme's signature fails**: the package is no longer what Acme signed.
- **Sam's review is outdated for the English page**: it was for the old text,
  not this one. It still counts for the French page, which did not change.

A Reader that loads this package reports both: the package is not `signed`,
and the changed page has no review. Nobody can quietly change the knowledge
an assistant answers from.

Put the original page back, and both signatures check out again:

```sh
mv acme-support/content/returns/refund-window.md.bak acme-support/content/returns/refund-window.md
npx @openmoca/moca-sign verify acme-support --trust-root keys/trust-root.json
```

```text
VALID         attestations/package.acme-publisher.dsse.json  (Acme publishing key)
VALID         attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json  (Sam Ortiz)

Verified sha256:3fb4f2bbdbe4d0793b2f61f8f01dec39f33189961f8627ecfb3f72948f26888b
```

## What you have done

You took a folder of Markdown and:

1. checked it, and got a digest that names its exact content;
2. made keys and a trust root;
3. signed it as the publisher;
4. added a named person's review of one page;
5. verified both, as a reader;
6. built a search index bound to that content;
7. packed it into one file;
8. served it to an AI agent, with citations and the audience filter, and
   searched it by meaning;
9. watched a one-word change break both signatures.

## Next

- [Quickstart](quickstart.md): make a package from your own Markdown.
- [Authoring packages](guides/authoring.md): evidence, validity and audience.
- [Signing and review](guides/signing-and-review.md): Sigstore, trust roots
  and reviews in depth.
- [Consuming packages](guides/consuming.md): use the Reader in your own code.
- [Try OpenMOCA](https://try.openmoca.org): this package, and seven others,
  in the browser.
