# Search and sidecar indexes

Search is the retrieval in retrieval-augmented generation (RAG). A MOCA Reader
has one search call. What finds the candidates is a **backend**, which your
application chooses:

| Backend | Finds | Needs |
| --- | --- | --- |
| Lexical (`LexicalBackend`) | Pages or passages that share the question's words (keyword search), ranked by BM25 | Nothing. Works offline. |
| Semantic (`DenseBackend`) | Passages whose meaning is close to the question, even with no words in common | A sidecar index with vectors, and an embedder for the same model |
| Hybrid (`HybridBackend`) | Both lists, merged | Both of the above |
| Store | Hits from your own vector store | A store backend over it ([consuming](consuming.md#feeding-your-own-retrieval-stack)) |

Whatever the backend, the Reader turns each hit into a citation record and
applies the same trust rules: content that is out of force, superseded,
deprecated or for another audience never comes back
([Reader contract §9](../../spec/moca-reader-contract.md#9-search)). Changing
backend changes which passages are found, never what is allowed.

A **sidecar index** is a file kept beside a package, never inside it, that
holds the package's text cut into passages, and optionally a vector for each.
It makes search work on passages, not whole pages, and it is what semantic
search runs on.

This guide builds both kinds of index for the FAA's *Airplane Flying
Handbook* (251 pages, from [`examples/pdf`](../../examples/pdf)), then
searches it three ways. Every command and output below was run with the 0.6.0
tools, and the code was run in all three Readers, which print the same
results.

To follow along, download the package:

```sh
curl -fsSLO https://github.com/openmoca/moca-spec/releases/latest/download/airplane-flying-handbook.moca
```

## 1. Build a lexical index

```sh
npx @openmoca/moca-index build airplane-flying-handbook.moca -o afh.moca.idx --chunk headings
```

```text
Wrote afh.moca.idx (540 item(s)) bound to sha256:4dd2efa4ff7d047a4f52a6553fe29605d0591aaf6f18d1ed9d9a2328afe49be2
```

- **`--chunk headings`** cuts each page at its headings, so a result is the
  section that matched, not the whole page. `--chunk node` keeps one passage
  per page. `--max-chars <n>` also splits any passage longer than `n`
  characters, at a paragraph, line, sentence or space.
- **Bound to the digest.** The index names the exact package it was built
  from. If the package changes, a Reader reports the index as stale
  (`S003`) and searches the package directly, so search never returns text
  the package no longer has.
- **Exact offsets.** Every passage records where it starts and ends in its
  page, so a citation can point at the passage itself.

## 2. Add semantic search

Semantic search compares meanings, as vectors from an **embedding model**.
The index stores a vector for each passage; at query time, your application
embeds the question with the same model.

This guide uses `all-MiniLM-L6-v2`, the smallest of MOCA's four
[standard embedding models](../../spec/moca-sidecar-index-spec.md#51-embedders-the-moca-tools-support-informative).
They run on your machine, with no service, and every MOCA tool runs them the
same way, so an index built with one is searched with the same one anywhere:
by a Reader in any language, or by the MCP server. Install it once:

```sh
npx @openmoca/moca-embed models add all-MiniLM-L6-v2
```

It goes in `~/.moca/models` (or `MOCA_MODELS`), checked against its pinned
SHA-256. `all-MiniLM-L6-v2` reads at most 256 tokens of each text, about 1,000
characters, so keep passages that short with `--max-chars`:

```sh
npx @openmoca/moca-index build airplane-flying-handbook.moca -o afh-minilm.moca.idx \
  --chunk headings --max-chars 1000 --model all-MiniLM-L6-v2
npx @openmoca/moca-index check afh-minilm.moca.idx --package airplane-flying-handbook.moca
```

```text
Wrote afh-minilm.moca.idx (1651 item(s)) bound to sha256:4dd2efa4ff7d047a4f52a6553fe29605d0591aaf6f18d1ed9d9a2328afe49be2
No findings.

Usable: 1651 chunk(s)
```

It took about ten seconds. The index is a folder: `index.json` says what it
is, and `payload/` holds the passages and a binary file of vectors (2.4 MB
here). `index.json` records the model, so a Reader can refuse a question
embedded with a different one:

```json
{
  "indexVersion": 1,
  "target": {
    "id": "https://example.com/moca/pdf/airplane-flying-handbook",
    "version": "1.0.0",
    "digest": "sha256:4dd2efa4ff7d047a4f52a6553fe29605d0591aaf6f18d1ed9d9a2328afe49be2"
  },
  "indexType": "hybrid",
  "model": {
    "name": "sentence-transformers/all-MiniLM-L6-v2",
    "version": "onnx-q8",
    "dimensions": 384,
    "queryPrefix": "",
    "documentPrefix": ""
  },
  "chunking": { "strategy": "headings-h1-h3", "maxChars": 1000, "overlap": 0 },
  "storage": {
    "format": "moca-jsonl-v1",
    "file": "payload/items.jsonl",
    "vectors": { "file": "payload/vectors.f32", "dtype": "float32", "dimensions": 384 }
  },
  "createdBy": "moca-index"
}
```

**Any other model.** `moca-index --embedder <module.mjs>` takes your own
embedder: a module whose default export has the model's `name`, its
`dimensions`, and `embed(texts)`, returning one vector per text. It can call
any model or service, such as a local [Ollama](https://ollama.com). Only tools
that run the same model can search its vectors, so the MCP server, which runs
the standard models, cannot.

## 3. Search three ways

Bind the index to the package, then ask the same question with each backend.
The embedder is the same standard model the index was built with, loaded from
the model store; its files are checked before it runs.

<!-- tabs -->

**TypeScript:**

```js
import { readPackage, bindSidecar, Library, Search, LexicalBackend, DenseBackend, HybridBackend } from '@openmoca/moca-core';
import { standardEmbedder } from '@openmoca/moca-embed';

const embedder = await standardEmbedder('all-MiniLM-L6-v2');

const pkg = await readPackage('airplane-flying-handbook.moca');
const sidecar = bindSidecar('afh-minilm.moca.idx', pkg);
if (!sidecar.usable) throw new Error(sidecar.diagnostics.map((d) => d.message).join('; '));
const library = new Library().add(pkg, { chunks: sidecar.chunks, index: sidecar.index });

const lexical = new LexicalBackend(library);
const dense = new DenseBackend(library, { embedder });
const backends = { lexical, semantic: dense, hybrid: new HybridBackend({ lexical, dense }) };

const question = 'what should I do if the engine quits just after I leave the runway';
for (const [name, backend] of Object.entries(backends)) {
  const hits = await new Search(library, { backend }).search(question, { limit: 3 });
  console.log(`${name}:`);
  for (const h of hits) console.log(`  ${h.score.toFixed(3)}  ${h.node.title}`);
}
```

`npm install @openmoca/moca-core @openmoca/moca-embed`.

**.NET:**

```csharp
using OpenMoca.Reader;
using OpenMoca.Reader.Onnx;
using OpenMoca.Reader.Search;
using OpenMoca.Reader.Sidecars;

var store = new ModelStore(ModelStore.DefaultFolder);
using var embedder = store.Load(StandardModel.Find("all-MiniLM-L6-v2")!);

var pkg = await MocaReader.ReadPackageAsync("airplane-flying-handbook.moca");
var sidecar = SidecarBinder.Bind("afh-minilm.moca.idx", pkg);
if (!sidecar.Usable) throw new InvalidOperationException(string.Join("; ", sidecar.Diagnostics.Select(d => d.Message)));
var library = new Library().Add(pkg, sidecar);

var lexical = new LexicalBackend(library);
var dense = new DenseBackend(library, embedder);
var backends = new Dictionary<string, ISearchBackend>
{
    ["lexical"] = lexical,
    ["semantic"] = dense,
    ["hybrid"] = new HybridBackend(lexical, dense),
};

const string question = "what should I do if the engine quits just after I leave the runway";
foreach (var (name, backend) in backends)
{
    var hits = await new MocaSearch(library, backend).SearchAsync(question, new SearchOptions { Limit = 3 });
    Console.WriteLine($"{name}:");
    foreach (var h in hits) Console.WriteLine($"  {h.Score:F3}  {h.Node.Title}");
}
```

`dotnet add package OpenMoca.Reader.Onnx`. With `OpenMoca.Reader.Extensions.AI`,
any Microsoft.Extensions.AI `IEmbeddingGenerator` can be the embedder instead.

**Python:**

```python
from moca_reader import DenseBackend, HybridBackend, LexicalBackend, Library, Search, bind_sidecar, read_package
from moca_reader.embedders import standard_embedder

embedder = standard_embedder("all-MiniLM-L6-v2")

pkg = read_package("airplane-flying-handbook.moca")
sidecar = bind_sidecar("afh-minilm.moca.idx", pkg)
if not sidecar.usable:
    raise SystemExit("; ".join(d.message for d in sidecar.diagnostics))
library = Library().add(pkg, chunks=sidecar.chunks, index=sidecar.index)

lexical = LexicalBackend(library)
dense = DenseBackend(library, embedder)
backends = {"lexical": lexical, "semantic": dense, "hybrid": HybridBackend(lexical, dense)}

question = "what should I do if the engine quits just after I leave the runway"
for name, backend in backends.items():
    hits = Search(library, backend).search(question, limit=3)
    print(f"{name}:")
    for h in hits:
        print(f"  {h['score']:.3f}  {h['node']['title']}")
```

`pip install "moca-reader[onnx]"`.

<!-- /tabs -->

All three print the same:

```text
lexical:
  15.891  Before-Takeoff Check
  13.305  Door Opening In-Flight
  13.148  Normal and Crosswind Takeoff and Climb
semantic:
  0.541  Engine Failure During Flight
  0.505  Rejected Takeoff/Engine Failure
  0.494  Low Altitude Engine Failure Scenarios
hybrid:
  0.016  Engine Failure During Flight
  0.016  Before-Takeoff Check
  0.016  Door Opening In-Flight
```

- **Lexical** search misses: the question says "quits" and "leave the
  runway", and the handbook says "engine failure" and "takeoff".
- **Semantic** search finds the right sections by meaning.
- **Hybrid** merges the two ranked lists (reciprocal rank fusion), so a
  passage either search ranks well comes back. Its scores are small because
  they come from ranks, not from similarity.

The question is embedded on your machine; the Reader never sends anything
anywhere. The results are citation records, exactly as in
[consuming packages](consuming.md#3-use-the-citation-record).

## 4. When the model does not match

Vectors from different models cannot be compared. If the host's embedder is
not the index's model, the Reader does not search that index's vectors, and
says why. With `bge-small-en-v1.5` as the embedder:

```text
(package)
  WARNING S006_MODEL_MISMATCH  https://example.com/moca/pdf/airplane-flying-handbook@1.0.0: index model "sentence-transformers/all-MiniLM-L6-v2" is not the host embedder "BAAI/bge-small-en-v1.5"
```

The search returns nothing from that package. The model's `name`, its
`version` when both give one, its `dimensions`, and its query and document
prefixes must all match. Check the dense backend's diagnostics after
searching: `diagnostics` in TypeScript and Python, `Diagnostics` in .NET. A package with no vectors at all, from
no index or a lexical-only one, is reported as `S007_NO_VECTORS`: in a
library that mixes the two, a semantic search only returns results from the
packages that have vectors. Hybrid search still finds the others lexically.

**Prefixes.** Some models expect text before each query and document, such as
`search_query:` and `search_document:`, each followed by a space. The embedder
applies them, for the role it is given (`query` or `document`), and declares
them as `queryPrefix` and `documentPrefix`; `moca-index` records them in the
index, and a Reader compares them. The Reader itself never adds text. The
standard models' prefixes are part of the standard.

## 5. Over MCP

The [MCP server](https://github.com/openmoca/moca-mcp-dotnet#readme) searches
by meaning when a package's index was built with a standard model and that
model is installed. Name the index after the package and put it beside it:

```sh
moca-mcp models add all-MiniLM-L6-v2
mv afh-minilm.moca.idx airplane-flying-handbook.moca.idx
moca-mcp --library .
```

Its `moca_search` tool then searches by words and meaning together (hybrid)
by default, or by `mode`: `lexical`, `semantic` or `hybrid`.

## Search within a topic

When a package has a [structure](structure.md), a search can be limited to a
topic and everything under it (`scope`), and an ontology-guided strategy can
add what each result requires. Both work with every backend. Your application
can also plug in its own retrieval hooks, before and after the backend
([write your own hooks](structure.md#7-write-your-own-hooks)).

## Next

- [Structure](structure.md): search within a topic, and what each topic
  requires.
- [Consuming packages](consuming.md): the citation record, and feeding your
  own vector store.
- [Sidecar index specification](../../spec/moca-sidecar-index-spec.md): the
  index format.
- Try [Try OpenMOCA](https://try.openmoca.org): lexical, semantic and hybrid
  search over eight packages, with two models, and where each result ranked in
  each list.
