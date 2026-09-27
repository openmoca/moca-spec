// BM25 over plain text, shared by the lexical and in-memory store backends.
const WORD = /[\p{L}\p{N}]+/gu;

export function tokens(text) {
  return (text.toLowerCase().match(WORD) ?? []);
}

/**
 * @template T
 * @param {Array<{ item: T, text: string, key: string }>} docs  key breaks ties
 * @param {string} query
 * @returns {Array<{ item: T, score: number }>} best first, zero scores dropped
 */
export function bm25(docs, query, k1 = 1.2, b = 0.75) {
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
    return { item: d.item, key: d.key, score: Math.round(score * 1e4) / 1e4 };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b2) => b2.score - a.score || (a.key < b2.key ? -1 : a.key > b2.key ? 1 : 0))
    .map(({ item, score }) => ({ item, score }));
}
