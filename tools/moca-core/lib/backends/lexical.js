// Lexical (BM25) backend over the packages in a library: each package's
// sidecar chunks when it was added with them, otherwise its nodes.
import { citationFor, pickRepresentation } from '../citation.js';
import { bm25 } from './bm25.js';

export class LexicalBackend {
  /** @param {import('../library.js').Library} library */
  constructor(library) {
    this.library = library;
    this.features = ['lexical', 'filterPushdown'];
    this.diagnostics = [];
  }

  /** @returns {import('../search.js').SearchHit[]} */
  search(query, { limit, filters }) {
    const excluded = new Set((filters.exclude ?? []).map((x) => `${x.digest} ${x.node}`));
    const digests = filters.digests ? new Set(filters.digests) : null;
    const docs = [];
    for (const { result, chunks } of this.library.packages) {
      if (digests && !digests.has(result.digest)) continue;
      const byPath = new Map(result.nodes.map((n) => [n.path, n]));
      const keep = (node, rep) => {
        const id = `${result.manifest.id}#${node.path}`;
        if (excluded.has(`${result.digest} ${id}`)) return null;
        if (filters.audiences && typeof rep.frontmatter.moca?.audience === 'string' && !filters.audiences.includes(rep.frontmatter.moca.audience)) return null;
        if (filters.concepts && !(rep.concepts ?? []).some((c) => filters.concepts.includes(c))) return null;
        return id;
      };
      if (chunks) {
        for (const c of chunks) {
          const node = byPath.get(c.path);
          const rep = node?.representations.find((r) => (r.locale ?? null) === (c.locale ?? null));
          if (!rep) continue;
          if (filters.locale && pickRepresentation(node, filters.locale) !== rep) continue;
          const id = keep(node, rep);
          if (!id) continue;
          const title = citationFor(result, node, rep).node.title ?? '';
          docs.push({
            item: { digest: result.digest, node: id, path: node.path, ...(rep.locale ? { locale: rep.locale } : {}), span: { start: c.start, end: c.end } },
            text: `${title} ${c.text ?? ''}`,
            key: `${id}\u0000${String(c.start).padStart(12, '0')}`,
          });
        }
      } else {
        for (const node of result.nodes) {
          const rep = pickRepresentation(node, filters.locale);
          const id = keep(node, rep);
          if (!id) continue;
          const fm = rep.frontmatter;
          docs.push({
            item: { digest: result.digest, node: id, path: node.path, ...(rep.locale ? { locale: rep.locale } : {}) },
            text: [fm.title, fm.description, ...(Array.isArray(fm.tags) ? fm.tags : []), rep.body].filter((x) => typeof x === 'string').join(' '),
            key: id,
          });
        }
      }
    }
    return bm25(docs, query).slice(0, limit).map(({ item, score }) => ({ ...item, score }));
  }
}
