// A reference store backend, kept in memory: spec/moca-reader-contract.md §9.4.
// It stands in for a host's vector store in tests and shows what a store
// binding must record at ingest: the whole citation record, including the
// package digest. Search then resolves hits from those records, so the host
// never has to load every package to search its store (Reader contract §9.4).
import { citationFor } from '../citation.js';
import { bm25 } from './bm25.js';
import { cosine } from './dense.js';

export class MemoryStoreBackend {
  /**
   * @param {{ embedder?: import('../search.js').Embedder, filterPushdown?: boolean }} [options]
   *   Without an embedder the store is searched lexically.
   */
  constructor({ embedder, filterPushdown = true } = {}) {
    this.embedder = embedder ?? null;
    this.features = [embedder ? 'dense' : 'lexical', ...(filterPushdown ? ['filterPushdown'] : [])];
    this.diagnostics = [];
    /** @type {Array<{ hit: object, text: string, audience?: string, concepts: string[], vector?: number[] }>} */
    this.records = [];
  }

  /**
   * Ingests every node representation (or sidecar chunk) of every package in
   * the library, through the Reader's citation records.
   * @param {import('../library.js').Library} library
   */
  async ingest(library) {
    const index = library.relationIndex();
    const now = library.clock();
    const pending = [];
    for (const { result, chunks } of library.packages) {
      const byPath = new Map(result.nodes.map((n) => [n.path, n]));
      const units = chunks
        ? chunks.map((c) => ({ node: byPath.get(c.path), locale: c.locale ?? null, span: { start: c.start, end: c.end }, text: c.text ?? '' }))
        : result.nodes.flatMap((node) => node.representations.map((rep) => ({ node, locale: rep.locale, text: rep.body })));
      for (const u of units) {
        const rep = u.node?.representations.find((r) => (r.locale ?? null) === u.locale);
        if (!rep) continue;
        const record = citationFor(result, u.node, rep, { now, index, text: u.text });
        if (u.span) record.span = { ...u.span };
        pending.push({
          hit: { digest: result.digest, node: record.node.id, path: u.node.path, ...(rep.locale ? { locale: rep.locale } : {}), ...(u.span ? { span: u.span } : {}), record },
          text: `${record.node.title ?? ''} ${u.text}`,
          ...(record.audience ? { audience: record.audience } : {}),
          concepts: record.concepts ?? [],
        });
      }
    }
    if (this.embedder && pending.length > 0) {
      const vectors = await this.embedder.embed(pending.map((p) => p.text));
      pending.forEach((p, i) => { p.vector = vectors[i]; });
    }
    this.records.push(...pending);
    return this;
  }

  /** Removes everything ingested from a package digest. */
  remove(digest) {
    this.records = this.records.filter((r) => r.hit.digest !== digest);
    return this;
  }

  async search(query, { limit, filters }) {
    let candidates = this.records;
    if (this.features.includes('filterPushdown')) {
      const digests = new Set(filters.digests ?? []);
      const excluded = new Set((filters.exclude ?? []).map((x) => `${x.digest} ${x.node}`));
      candidates = candidates.filter((r) => digests.has(r.hit.digest)
        && !excluded.has(`${r.hit.digest} ${r.hit.node}`)
        && (!filters.audiences || !r.audience || filters.audiences.includes(r.audience))
        && (!filters.concepts || r.concepts.some((c) => filters.concepts.includes(c))));
    }
    if (!this.embedder) {
      return bm25(candidates.map((r) => ({ item: r.hit, text: r.text, key: `${r.hit.node}\u0000${r.hit.locale ?? ''}\u0000${r.hit.span?.start ?? 0}` })), query)
        .slice(0, limit)
        .map(({ item, score }) => ({ ...item, score }));
    }
    const [q] = await this.embedder.embed([query]);
    return candidates
      .map((r) => ({ ...r.hit, score: Math.round(cosine(q, r.vector) * 1e4) / 1e4 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
