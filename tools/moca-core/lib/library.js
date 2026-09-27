// A library of loaded packages: citation records, relations between
// packages, the default retrieval policy, and lexical search.
// See spec/moca-reader-contract.md §7 and §8.
const WORD = /[\p{L}\p{N}]+/gu;

/**
 * @typedef {object} LibraryOptions
 * @property {() => Date} [clock]  defaults to the system clock
 */

export class Library {
  /** @param {LibraryOptions} [options] */
  constructor({ clock = () => new Date() } = {}) {
    this.clock = clock;
    /** @type {Array<{ result: object, chunks: object[]|null }>} */
    this.packages = [];
  }

  /**
   * Adds a package read by readPackage(). Invalid packages are refused.
   * @param {object} result
   * @param {{ chunks?: object[] }} [options]  items from a bound sidecar (see bindSidecar)
   */
  add(result, { chunks } = {}) {
    if (!result.valid || !result.digest) throw new Error(`refusing to add an invalid package: ${result.manifest?.id ?? '(unknown)'}`);
    const key = (r) => `${r.manifest.id}@${r.manifest.version}`;
    if (this.packages.some((p) => key(p.result) === key(result))) return this;
    this.packages.push({ result, chunks: chunks ?? null });
    // A composed package brings its verified members with it.
    for (const member of result.members) {
      if (member.status === 'resolved' && member.result?.valid) this.add(member.result);
    }
    return this;
  }

  /** Package-level relation effects among the loaded packages. */
  relationIndex() {
    const superseded = new Map();
    const contested = new Map();
    const push = (map, key, value) => {
      if (!map.has(key)) map.set(key, []);
      if (!map.get(key).includes(value)) map.get(key).push(value);
    };
    const loaded = this.packages.map((p) => p.result.manifest);
    for (const m of loaded) {
      for (const r of Array.isArray(m.relations) ? m.relations : []) {
        const targets = loaded.filter((t) => t.id === r.target && (!r.version || t.version === r.version));
        for (const t of targets) {
          const key = `${t.id}@${t.version}`;
          if (r.type === 'supersedes') push(superseded, key, `${m.id}@${m.version}`);
          if (r.type === 'conflictsWith') {
            push(contested, key, `${m.id}@${m.version}`);
            push(contested, `${m.id}@${m.version}`, key);
          }
        }
      }
    }
    return { superseded, contested };
  }

  /**
   * Citation records for every node (one per node, in the requested locale).
   * @param {{ locale?: string, includeText?: boolean }} [options]
   */
  citations({ locale, includeText = false } = {}) {
    const index = this.relationIndex();
    const now = this.clock();
    const out = [];
    for (const { result } of this.packages) {
      for (const node of result.nodes) {
        const rep = pickRepresentation(node, locale);
        out.push(citationFor(result, node, rep, { now, index, text: includeText ? rep.body : undefined }));
      }
    }
    return out;
  }

  /**
   * Lexical (BM25) search over loaded packages, or over sidecar chunks when a
   * package was added with them. Applies the default retrieval policy unless
   * includeAll is set, and filters by audience when audiences is given.
   *
   * @param {string} query
   * @param {{ limit?: number, includeAll?: boolean, audiences?: string[], locale?: string }} [options]
   */
  search(query, { limit = 5, includeAll = false, audiences, locale } = {}) {
    const index = this.relationIndex();
    const now = this.clock();
    const docs = [];
    for (const { result, chunks } of this.packages) {
      const byPath = new Map(result.nodes.map((n) => [n.path, n]));
      if (chunks) {
        for (const c of chunks) {
          const node = byPath.get(c.path);
          if (!node) continue;
          const rep = node.representations.find((r) => (r.locale ?? null) === (c.locale ?? null)) ?? node.representations[0];
          const record = citationFor(result, node, rep, { now, index, text: c.text });
          record.span = { start: c.start, end: c.end };
          docs.push({ record, text: `${record.node.title ?? ''} ${c.text ?? ''}` });
        }
      } else {
        for (const node of result.nodes) {
          const rep = pickRepresentation(node, locale);
          const record = citationFor(result, node, rep, { now, index, text: rep.body });
          const fm = rep.frontmatter;
          docs.push({ record, text: [fm.title, fm.description, ...(fm.tags ?? []), rep.body].filter(Boolean).join(' ') });
        }
      }
    }
    const eligible = docs.filter(({ record }) => (includeAll || passesDefaultPolicy(record))
      && (!audiences || !record.audience || audiences.includes(record.audience)));
    return bm25(eligible, query).slice(0, limit).map(({ record, score }) => ({ ...record, score }));
  }

  /** Finds a node by its full id (`<package id>#<path>`). */
  get(nodeId, { locale, includeText = true } = {}) {
    const hash = nodeId.lastIndexOf('#');
    if (hash < 0) return null;
    const pkgId = nodeId.slice(0, hash);
    const path = nodeId.slice(hash + 1);
    const index = this.relationIndex();
    for (const { result } of this.packages) {
      if (result.manifest.id !== pkgId) continue;
      const node = result.nodes.find((n) => n.path === path);
      if (!node) continue;
      const rep = pickRepresentation(node, locale);
      return citationFor(result, node, rep, { now: this.clock(), index, text: includeText ? rep.body : undefined });
    }
    return null;
  }
}

/** The default retrieval policy, spec/moca-reader-contract.md §8. */
export function passesDefaultPolicy(record) {
  return record.trust.inForce && !record.trust.superseded && record.trust.status !== 'deprecated';
}

function pickRepresentation(node, locale) {
  if (!locale) return node.representations[0];
  const want = locale.toLowerCase();
  return node.representations.find((r) => r.locale?.toLowerCase() === want)
    ?? node.representations.find((r) => r.locale && want.startsWith(`${r.locale.toLowerCase()}-`))
    ?? node.representations.find((r) => r.locale && r.locale.toLowerCase().startsWith(`${want}-`))
    ?? node.representations[0];
}

/**
 * Builds one citation record (schemas/v1/citation-record.schema.json).
 */
export function citationFor(result, node, rep, { now = new Date(), index, text } = {}) {
  const { manifest } = result;
  const fm = rep.frontmatter;
  const moca = fm.moca && typeof fm.moca === 'object' ? fm.moca : {};
  const key = `${manifest.id}@${manifest.version}`;
  const validFrom = moca.valid_from ?? manifest.validFrom;
  const validUntil = moca.valid_until ?? manifest.validUntil;
  const t = now.getTime();
  const supersededBy = index?.superseded.get(key) ?? [];
  const contestedBy = [...(Array.isArray(moca.contested_by) ? moca.contested_by : []), ...(index?.contested.get(key) ?? [])];
  const sources = new Map((Array.isArray(fm.sources) ? fm.sources : []).filter((s) => s?.id).map((s) => [s.id, s]));

  const record = {
    package: {
      id: manifest.id,
      version: manifest.version,
      digest: result.digest,
      signed: result.signers.length > 0,
      ...(result.signers.length > 0 ? { signers: [...result.signers] } : {}),
    },
    node: {
      id: `${manifest.id}#${node.path}`,
      path: node.path,
      ...(rep.locale ? { locale: rep.locale } : manifest.language ? { locale: manifest.language } : {}),
      type: fm.type,
      ...(typeof fm.title === 'string' ? { title: fm.title } : {}),
      ...(typeof fm.description === 'string' ? { description: fm.description } : {}),
      ...(Array.isArray(fm.tags) ? { tags: fm.tags.filter((x) => typeof x === 'string') } : {}),
      ...(rep.sha256 ? { digest: `sha256:${rep.sha256}` } : {}),
    },
    span: { start: rep.bodyOffset, end: rep.bodyOffset + Buffer.byteLength(rep.body) },
    trust: {
      status: ['draft', 'stable', 'deprecated'].includes(fm.status) ? fm.status : 'stable',
      generated: fm.generated && typeof fm.generated === 'object' ? { by: String(fm.generated.by), ...(fm.generated.at ? { at: String(fm.generated.at) } : {}) } : null,
      declaredVerified: (Array.isArray(fm.verified) ? fm.verified : fm.verified ? [fm.verified] : [])
        .filter((v) => v && typeof v === 'object')
        .map((v) => ({ by: String(v.by), ...(v.at ? { at: String(v.at) } : {}) })),
      attestedReviews: result.reviewsByFile.get(rep.file) ?? [],
      ...(fm.stale_after ? { staleAfter: String(fm.stale_after) } : {}),
      ...(validFrom ? { validFrom: String(validFrom) } : {}),
      ...(validUntil ? { validUntil: String(validUntil) } : {}),
      stale: fm.stale_after ? t >= Date.parse(fm.stale_after) : false,
      inForce: (!validFrom || t >= Date.parse(validFrom)) && (!validUntil || t < Date.parse(validUntil)),
      superseded: supersededBy.length > 0,
      ...(supersededBy.length > 0 ? { supersededBy } : {}),
      contested: contestedBy.length > 0,
      ...(contestedBy.length > 0 ? { contestedBy } : {}),
    },
    evidence: (Array.isArray(moca.evidence) ? moca.evidence : [])
      .filter((e) => e && typeof e === 'object')
      .map((e) => ({ source: sources.get(e.source) ?? { id: e.source }, ...(e.selector ? { selector: e.selector } : {}), ...(e.note ? { note: e.note } : {}) })),
    ...(typeof moca.audience === 'string' ? { audience: moca.audience } : {}),
    ...(result.profiles.length > 0 ? { profiles: [...result.profiles] } : {}),
  };
  if (text !== undefined) record.text = text;
  return record;
}

function tokens(text) {
  return (text.toLowerCase().match(WORD) ?? []);
}

function bm25(docs, query, k1 = 1.2, b = 0.75) {
  const q = [...new Set(tokens(query))];
  if (q.length === 0 || docs.length === 0) return [];
  const tokenized = docs.map((d) => tokens(d.text));
  const avg = tokenized.reduce((s, t) => s + t.length, 0) / tokenized.length || 1;
  const df = new Map(q.map((term) => [term, tokenized.filter((t) => t.includes(term)).length]));
  const scored = docs.map((d, i) => {
    const t = tokenized[i];
    let score = 0;
    for (const term of q) {
      const f = t.filter((x) => x === term).length;
      if (f === 0) continue;
      const idf = Math.log(1 + (docs.length - df.get(term) + 0.5) / (df.get(term) + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * t.length) / avg)));
    }
    return { record: d.record, score: Math.round(score * 1e4) / 1e4 };
  });
  return scored.filter((s) => s.score > 0).sort((a, b2) => b2.score - a.score || (a.record.node.id < b2.record.node.id ? -1 : 1));
}
