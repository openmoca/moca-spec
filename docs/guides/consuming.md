# Consuming packages

This guide is for building an application that answers from MOCA packages: a
RAG assistant, an agent, a search page. Every such application does three things:

1. **Read and verify** each package, once, when it loads it.
2. **Search** the packages it has loaded.
3. **Use the citation record** that every result comes back as: show where an
   answer came from, and keep proof of what was read.

The code is in TypeScript, .NET and Python. Each language's three parts, put
together in order, make one program, and they print the same thing. For a
ten-minute first run, see the getting-started guide for
[TypeScript](https://github.com/openmoca/moca-reader-typescript/blob/main/docs/getting-started.md),
[.NET](https://github.com/openmoca/moca-reader-dotnet/blob/main/docs/getting-started.md)
or [Python](https://github.com/openmoca/moca-reader-python/blob/main/docs/getting-started.md).

## Before you start

Install the Reader for your language:

<!-- tabs -->

**TypeScript:**

```sh
npm install @openmoca/moca-core
```

Node.js 22 or later. The code is an ES module (`"type": "module"` in
`package.json`).

**.NET:**

```sh
dotnet add package OpenMoca.Reader
```

.NET 10.

**Python:**

```sh
pip install moca-reader
```

Python 3.11 or later.

<!-- /tabs -->

Then download the example package and the trust root that verifies it:

```sh
curl -fsSLO https://github.com/openmoca/moca-spec/releases/latest/download/support-kb.moca
curl -fsSLO https://github.com/openmoca/moca-spec/releases/latest/download/example-trust-root.json
```

`support-kb` is a small customer-support knowledge base for Acme, a made-up
shop. It is signed by a publisher, one page has a signed review, and the refund
page quotes the customer terms it is based on, which travel inside the
package. The trust root lists the example keys, which are published on
purpose: use it for the examples only.

## 1. Read once, verify once

Reading a package is where all the checking happens. When you read one, the
Reader:

1. opens the folder or `.moca` file, without running anything in it;
2. computes the **digest**, a SHA-256 fingerprint over every file;
3. checks the package against the specification;
4. verifies its **signatures** against your trust root: whom you trust, and
   for what;
5. checks each **quote** a page relies on against the original in the
   package.

You get back a package object that holds the results. Keep it, and use it for
every search. There is no need to verify again per request: nothing in a
loaded package changes.

<!-- tabs -->

**TypeScript:**

```js
import { readPackage, Library, Search, LexicalBackend } from '@openmoca/moca-core';

const pkg = await readPackage('support-kb.moca', { trustRoot: 'example-trust-root.json' });

for (const d of pkg.diagnostics) console.warn(`${d.severity} ${d.code} ${d.message}`);
if (!pkg.valid) process.exit(1);

// Your policy: here, serve only packages signed by a publisher you trust.
if (!pkg.capabilities.includes('signed')) throw new Error('not signed by a trusted publisher');

console.log(pkg.digest);
console.log(pkg.signers.join(', '));
```

**.NET:**

```csharp
using OpenMoca.Reader;
using OpenMoca.Reader.Attestations;
using OpenMoca.Reader.Search;

var pkg = await MocaReader.ReadPackageAsync("support-kb.moca", new ReadOptions
{
    TrustRoot = TrustRoot.LoadFile("example-trust-root.json"),
});

foreach (var d in pkg.Diagnostics) Console.Error.WriteLine($"{d.Severity} {d.Code} {d.Message}");
if (!pkg.Valid) return 1;

// Your policy: here, serve only packages signed by a publisher you trust.
if (!pkg.Capabilities.Contains("signed")) throw new InvalidOperationException("not signed by a trusted publisher");

Console.WriteLine(pkg.Digest);
Console.WriteLine(string.Join(", ", pkg.Signers));
```

**Python:**

```python
import sys

from moca_reader import LexicalBackend, Library, Search, read_package

pkg = read_package("support-kb.moca", trust_root="example-trust-root.json")

for d in pkg.diagnostics:
    print(d.severity, d.code, d.message, file=sys.stderr)
if not pkg.valid:
    sys.exit(1)

# Your policy: here, serve only packages signed by a publisher you trust.
if "signed" not in pkg.capabilities:
    raise SystemExit("not signed by a trusted publisher")

print(pkg.digest)
print(", ".join(pkg.signers))
```

<!-- /tabs -->

```text
sha256:4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da
MOCA examples publisher (INSECURE, published private key)
```

What the package object tells you:

| Field | What it means |
| --- | --- |
| `valid` | Whether the package can be used at all. If it is false, do not serve it. |
| `digest` | The fingerprint of exactly these files. The same content always has the same digest, wherever it is read. |
| `capabilities` | What the package offers and what checked out, such as `signed` (a signature verified against your trust root), `reviewed` (a signed review did), and `self-contained-evidence` (the originals its quotes come from are inside it, so they can be checked offline). |
| `signers` | The names of the trusted keys that signed it. |
| `diagnostics` | Every problem found, each with a stable `code`, a `severity` and a `message`. |

**A bad package never throws.** Problems come back as diagnostics with stable
codes ([Reader contract §11](../../spec/moca-reader-contract.md#11-diagnostics)),
so you decide what to do. Only a problem with the package itself makes it
invalid. A signature that does not verify, a member that is missing or a stale
search index only switches off that one feature: the package is still read,
but it is not `signed`, say. That is why the code above checks for `signed`
itself, as a policy of its own.

**Composed packages** list other packages as members, pinned by digest. Tell
the Reader where to find them: `resolveMember: directoryResolver(['./packages'])`
in TypeScript, `ResolveMember = MemberResolvers.Directories(["./packages"])` in
.NET, or `resolve_member=directory_resolver(["./packages"])` in Python. A
member whose digest does not match its pin is refused.

### Your trust root

A trust root is a small JSON file that lists whose signatures you accept, and
for what: publishing a package (`package`), reviewing its pages (`review`), or
both.

**Is it required?** No. Without one, a package reads and searches as normal,
but none of its signatures counts. Each is reported as not checked
(`A003_ATTESTATION_UNVERIFIABLE`, a warning), the package is neither `signed`
nor `reviewed`, and every citation record says `signed: false`. A Reader never
trusts a signature just because it is mathematically valid: it must come from
someone you listed.

**Whose is it?** Yours. The trust root belongs to whoever reads packages, not
to whoever publishes them. A package cannot vouch for its own signer, so the
entries in your trust root must reach you some other way.

**Where do the entries come from?** From each publisher or reviewer you decide
to trust, over a channel you already trust: their website, their repository,
or your agreement with them.

- A signer with a key gives you its **public key** and key id. DSSE keys are
  Ed25519; a key of any other type verifies nothing.
- A signer that uses **Sigstore** gives you the identity it signs as: for a
  publisher, usually its CI workflow's address; for a reviewer, their account.

Acme's trust root, trusting its publishing key, its publishing workflow, and
Sam Ortiz as a reviewer, looks like this:

```json
{
  "keys": [
    { "keyid": "acme-publisher-2026",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n",
      "identity": "Acme publishing key",
      "expires": "2027-01-01T00:00:00Z",
      "roles": ["package"] }
  ],
  "sigstore": {
    "identities": [
      { "issuer": "https://token.actions.githubusercontent.com",
        "subject": "https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main",
        "roles": ["package"] },
      { "issuer": "https://accounts.google.com",
        "subject": "sam.ortiz@acme.example",
        "roles": ["review"] }
    ]
  }
}
```

- `roles` limits what each key or identity may sign. Without it, it may sign
  both.
- A key past its `expires` date is not trusted. When a publisher changes key,
  add the new one before the old one expires.
- The format is [`trust-root.schema.json`](../../schemas/v1/trust-root.schema.json),
  and the rules are in [attestations §6](../../spec/moca-attestations.md#6-trust-roots).

**How do I make one?** With `moca-sign trust add`, one entry at a time. It
creates the file if needed, checks each entry, and refuses a private key by
mistake.

```sh
# Trust Acme's publishing key, for packages, until it expires
npx @openmoca/moca-sign trust add trust-root.json --keyid acme-publisher \
  --public-key acme-publisher.pub.pem --identity "Acme publishing key" \
  --roles package --expires 2027-11-01

# Trust packages that Acme's GitHub workflow signs with Sigstore
npx @openmoca/moca-sign trust add trust-root.json \
  --issuer https://token.actions.githubusercontent.com \
  --subject https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main \
  --roles package

# See what you trust
npx @openmoca/moca-sign trust list trust-root.json
```

```text
key       package  acme-publisher (Acme publishing key, expires 2027-11-01T00:00:00Z)
sigstore  package  https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main (issuer https://token.actions.githubusercontent.com)
```

`moca-sign trust remove` stops trusting an entry. You can also write the file
by hand, or build the same document in your application's configuration.

- **To sign your own packages**, `moca-sign keygen` makes a key pair and adds
  its public key to a `trust-root.json` beside it (the
  [walkthrough](../walkthrough.md) does this in step 2). Give the public key,
  the `.pub.pem` file, to the people who will read your packages.
- **For the examples**, `example-trust-root.json` from the release trusts the
  example keys. Their private keys are published on purpose, so never use it
  for anything else.

Each Reader takes a trust root as a file path, as above, or as a document you
have already loaded:

<!-- tabs -->

**TypeScript:**

```js
import { readFileSync } from 'node:fs';

const trustRoot = JSON.parse(readFileSync('example-trust-root.json', 'utf8'));  // or from your configuration
const pkg = await readPackage('support-kb.moca', { trustRoot });
```

**.NET:**

```csharp
using System.Text.Json.Nodes;

var json = File.ReadAllText("example-trust-root.json");  // or from your configuration
var pkg = await MocaReader.ReadPackageAsync("support-kb.moca", new ReadOptions
{
    TrustRoot = TrustRoot.Load(JsonNode.Parse(json)),
});
```

**Python:**

```python
import json

with open("example-trust-root.json") as f:
    trust_root = json.load(f)  # or from your configuration
pkg = read_package("support-kb.moca", trust_root=trust_root)
```

<!-- /tabs -->

## 2. Search

A library holds every package your application serves. A search runs over the
library, through a backend, for an audience.

<!-- tabs -->

**TypeScript:**

```js
const library = new Library().add(pkg);   // add every package you serve
const search = new Search(library, {
  backend: new LexicalBackend(library),
  audiences: ['public'],                  // whom this application serves
});

const hits = await search.search('How long is the refund window?', { limit: 3 });
```

**.NET:**

```csharp
var library = new Library().Add(pkg);  // add every package you serve
var search = new MocaSearch(library, new LexicalBackend(library),
    audiences: ["public"]);            // whom this application serves

var hits = await search.SearchAsync("How long is the refund window?", new SearchOptions { Limit = 3 });
```

**Python:**

```python
library = Library().add(pkg)  # add every package you serve
search = Search(
    library,
    LexicalBackend(library),
    audiences=["public"],  # whom this application serves
)

hits = search.search("How long is the refund window?", limit=3)
```

<!-- /tabs -->

- **The backend** decides how text is matched. `LexicalBackend` is lexical (keyword)
  search over the package's own text, and needs nothing else. Dense and hybrid
  backends add semantic search with an embedding model you supply, and a store
  backend searches your own vector store
  ([search and sidecar indexes](search-and-indexes.md)).
- **The audience** is set by your application, not by the person asking.
  Here it is `public`, so the internal account-deletion procedure is never
  returned, whatever the query.

Each search can also take these options:

| Option | What it does |
| --- | --- |
| `limit` | The most results to return. The default is 5. |
| `locale` | Return each page in this language, where the package has it, such as `fr`. |
| `scope` | Search only within one topic and everything under it, from the package's structure. |
| `concepts` | Search only pages bound to these topics. |
| `includeAll` | Also return content the default policy leaves out (below), flagged. |

They are named in each language's style: `IncludeAll` in .NET and
`include_all` in Python, for example.

## 3. Use the citation record

Every result is a **citation record**: the text, and everything you need to
show where it came from and whether to trust it. It has the same shape in every
Reader. Shortened, the top result looks like this:

```json
{
  "text": "# Refund eligibility window\n\nCustomers may request a full refund within **30 days of delivery**. …",
  "package": {
    "id": "https://example.com/moca/support-kb",
    "version": "4.2.0",
    "digest": "sha256:4992176b…",
    "signed": true,
    "signers": ["MOCA examples publisher (INSECURE, published private key)"]
  },
  "node": {
    "ref": "https://example.com/moca/support-kb@4.2.0#refund-window.md",
    "title": "Refund eligibility window"
  },
  "trust": {
    "attestedReviews": [{ "signer": "MOCA examples reviewer (INSECURE, published private key)", "outcome": "accurate", "packageVerified": true }],
    "reviewStatus": "approved",
    "stale": false,
    "inForce": true,
    "superseded": false,
    "contested": false
  },
  "evidence": [{
    "source": { "title": "Acme Customer Terms, section 7" },
    "selector": { "type": "TextQuoteSelector", "exact": "Customers may request a full refund within 30 days of delivery." },
    "matched": true
  }],
  "audience": "public"
}
```

What each part is for:

| Part | What it tells you | What to do with it |
| --- | --- | --- |
| `text` | The passage that matched | Give it to the model as quoted reference material (step 4). |
| `node.title`, `package.id`, `package.version` | Which page of which package, at which version | Show your users where the answer came from. |
| `node.ref` | A versioned reference to the page | Cite by it. It names one page at one version, for good. |
| `package.digest` | The fingerprint of the package that was read | Log it with every answer. With `node.ref`, it proves later exactly what the assistant read. |
| `package.signed`, `package.signers` | Who published it, verified against your trust root | Show it, or refuse unsigned content. |
| `trust.attestedReviews` | Who checked this page, and when, in a signed review | Show "reviewed by", or prefer reviewed content. |
| `trust.reviewStatus` | `approved`, `disputed` (a reviewer found a problem), `unverified` (reviews in an unsigned package) or `none` | Show "reviewed" only for `approved`; show `disputed` as a warning. |
| `trust.stale`, `trust.contested` | The page is due for review, or disputed | Warn, rank it lower, or leave it out: your choice. |
| `evidence[].matched` | Whether the quote the page relies on was found in the original | `true`: found. `false`: not found, so treat the page with care. Absent: the Reader could not check it, for example because the original is not in the package. |
| `audience` | Whom the page is for | Already filtered for you; useful in logs. |

Here is the code that prints a citation from it:

<!-- tabs -->

**TypeScript:**

```js
const hit = hits[0];
console.log(hit.text.trim());
console.log(`Source:    ${hit.node.title}, ${hit.package.id} ${hit.package.version}`);
console.log(`Cite as:   ${hit.node.ref}`);
console.log(`Published: ${hit.package.signed ? hit.package.signers.join(', ') : 'not signed'}`);
console.log(`Reviewed:  ${hit.trust.attestedReviews.map((r) => r.signer).join(', ') || 'no'}`);
for (const e of hit.evidence) {
  console.log(`Evidence:  ${e.source.title}: ${e.matched === true ? 'quote found' : e.matched === false ? 'quote NOT found' : 'not checked'}`);
}
console.log(`Digest:    ${hit.package.digest}`);   // log this with the answer
```

**.NET:**

```csharp
var hit = hits[0];
Console.WriteLine(hit.Text?.Trim());
Console.WriteLine($"Source:    {hit.Node.Title}, {hit.Package.Id} {hit.Package.Version}");
Console.WriteLine($"Cite as:   {hit.Node.Ref}");
Console.WriteLine($"Published: {(hit.Package.Signers is { } signers ? string.Join(", ", signers) : "not signed")}");
var reviewers = string.Join(", ", hit.Trust.AttestedReviews.Select(r => r.Signer));
Console.WriteLine($"Reviewed:  {(reviewers.Length > 0 ? reviewers : "no")}");
foreach (var e in hit.Evidence)
{
    var found = e.Matched switch { true => "quote found", false => "quote NOT found", null => "not checked" };
    Console.WriteLine($"Evidence:  {e.Source["title"]}: {found}");
}
Console.WriteLine($"Digest:    {hit.Package.Digest}");  // log this with the answer
return 0;
```

**Python:**

```python
hit = hits[0]
print(hit["text"].strip())
print(f"Source:    {hit['node']['title']}, {hit['package']['id']} {hit['package']['version']}")
print(f"Cite as:   {hit['node']['ref']}")
print(f"Published: {', '.join(hit['package']['signers']) if hit['package']['signed'] else 'not signed'}")
print(f"Reviewed:  {', '.join(r['signer'] for r in hit['trust']['attestedReviews']) or 'no'}")
for e in hit["evidence"]:
    found = {True: "quote found", False: "quote NOT found"}.get(e.get("matched"), "not checked")
    print(f"Evidence:  {e['source']['title']}: {found}")
print(f"Digest:    {hit['package']['digest']}")  # log this with the answer
```

In Python, a citation record is a plain dict: the same JSON as above.

<!-- /tabs -->

```text
# Refund eligibility window

Customers may request a full refund within **30 days of delivery**. The window
runs from the delivery date recorded by the carrier, not the order date.

Items marked as final sale are not eligible. Where a carrier has not recorded a
delivery date, use the dispatch date plus five working days.
Source:    Refund eligibility window, https://example.com/moca/support-kb 4.2.0
Cite as:   https://example.com/moca/support-kb@4.2.0#refund-window.md
Published: MOCA examples publisher (INSECURE, published private key)
Reviewed:  MOCA examples reviewer (INSECURE, published private key)
Evidence:  Acme Customer Terms, section 7: quote found
Evidence:  Acme Customer Terms, section 7: quote found
Digest:    sha256:4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da
```

All three Readers print exactly this.

## 4. Hand it to a model

Package text is untrusted input. Put it in the model's context as quoted,
cited reference material, never as instructions, and never give the model
tools because content asks for them
([Reader contract §12](../../spec/moca-reader-contract.md#12-handing-content-to-a-model)).
Ask the model to cite `node.ref` for each claim, so your application can show
the source beside the answer.

## The default retrieval policy

Every search, whatever the backend, leaves out content that is:

- **not in force**: outside its validity window;
- **superseded**: replaced by a newer package you have also loaded;
- **deprecated**.

Pass `includeAll` to include it, flagged. Content that is stale or contested
is returned, flagged, and your application decides whether to warn, rank it
lower or refuse it.

## Feeding your own retrieval stack

If you already have a vector store, verify each package at ingest, then write
each chunk to your store with metadata from its citation record:

| Metadata | From |
| --- | --- |
| `moca_package_id`, `moca_package_version`, `moca_package_digest` | `package` |
| `moca_node_id`, `moca_node_digest` | `node` |
| `moca_status`, `moca_in_force_until`, `moca_stale_after`, `moca_superseded` | `trust` |
| `moca_attested_reviews`, `moca_signed` | `trust.attestedReviews`, `package.signed` |
| `moca_audience` | `audience` |
| `moca_node_ref` | `node.ref` (versioned node reference; the key to cite by) |
| `moca_concepts` | `concepts` (from the package structure) |
| `moca_evidence_matched` | `evidence[].matched` |

At query time, search the store through a store backend. Then the Reader
applies the default policy and your audience to every hit, and drops hits
from package versions you no longer load. Filters the store can apply itself
(`filterPushdown`) keep the top results relevant. When a package's digest
changes, compare `node.digest` values and re-ingest only the pages that
changed.

- **TypeScript:** `MemoryStoreBackend` in `@openmoca/moca-core` is the
  reference store backend. Retrievers for LangChain and LlamaIndex are on the
  [roadmap](../../ROADMAP.md).
- **.NET:** `OpenMoca.Reader.VectorData` is a store backend over any
  Microsoft.Extensions.VectorData store, and `OpenMoca.Reader.AgentFramework`
  grounds a Microsoft Agent Framework agent in your packages
  ([.NET Reader](https://github.com/openmoca/moca-reader-dotnet#framework-bindings)).
- **Python:** `moca-reader-langchain` and `moca-reader-llamaindex` are
  retrievers that carry each whole citation record, and these fields, in their
  results' metadata. `flat_metadata(record)` gives you the fields for your own
  store.

## Over MCP

`moca-mcp` does all of this for any MCP client, with no code. It is one
download with nothing to install ([MCP server](https://github.com/openmoca/moca-mcp-dotnet#readme)):

```sh
moca-mcp support-kb.moca --trust-root example-trust-root.json --audience public
```

Its tools are `moca_list_packages`, `moca_search` (optionally within
`concepts` or a `scope`), `moca_get_node` and `moca_structure`. The audience
is set when the server starts, and a caller cannot widen it. See the
[MCP server](https://github.com/openmoca/moca-mcp-dotnet#readme).

## Next

- [Search and sidecar indexes](search-and-indexes.md): semantic and hybrid
  search.
- [Structure](structure.md): search within a topic, and what each topic
  requires.
- [moca-examples](https://github.com/openmoca/moca-examples#readme): a command
  line and a chat over a package, in TypeScript and .NET.
