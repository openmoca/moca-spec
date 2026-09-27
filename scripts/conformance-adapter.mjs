#!/usr/bin/env node
// The reference conformance adapter: what @openmoca/moca-core concludes for one
// case of conformance/cases.json, in the shape the runner protocol expects
// (conformance/README.md). Another Reader provides its own adapter.
//
//   echo '{"root": "/abs/conformance", "case": {...}}' | node scripts/conformance-adapter.mjs
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readPackage, bindSidecar, directoryResolver, Library, Search, LexicalBackend, DenseBackend,
} from '@openmoca/moca-core';

/** The conformance embedder: the identity a case names, and [1, 0, 0, ...] for every text. */
function conformanceEmbedder({ name, version, dimensions }) {
  return { name, ...(version ? { version } : {}), dimensions, embed: async (texts) => texts.map(() => Array.from({ length: dimensions }, (_, i) => (i === 0 ? 1 : 0))) };
}

/** A backend that returns every representation of every loaded package, plus one unknown digest. */
function everyHitBackend(library) {
  return {
    features: [],
    search: () => [
      ...library.packages.flatMap(({ result }) => result.nodes.flatMap((node) => node.representations.map((rep) => ({
        digest: result.digest, node: `${result.manifest.id}#${node.path}`, path: node.path, ...(rep.locale ? { locale: rep.locale } : {}), score: 1,
      })))),
      { digest: `sha256:${'0'.repeat(64)}`, node: 'https://example.com/not-loaded#x.md', path: 'x.md', score: 2 },
    ],
  };
}

export async function actualFor(root, c) {
  const o = c.options ?? {};
  const readOptions = {
    trustRoot: o.trustRoot ? join(root, o.trustRoot) : undefined,
    resolveMember: o.members ? directoryResolver(o.members.map((m) => join(root, m))) : undefined,
  };

  if (c.kind === 'search') {
    const library = new Library({ clock: () => new Date(o.now) });
    const codes = [];
    for (const target of c.packages) {
      const result = await readPackage(join(root, target), readOptions);
      if (!result.valid) continue;
      let bound = {};
      if (o.sidecar) {
        bound = bindSidecar(join(root, o.sidecar), result);
        codes.push(...bound.diagnostics.map((d) => d.code));
      }
      library.add(result, bound.usable ? { chunks: bound.chunks, index: bound.index } : {});
    }
    const backend = o.backend === 'all' ? everyHitBackend(library)
      : o.backend === 'dense' ? new DenseBackend(library, { embedder: conformanceEmbedder(o.embedder) })
        : new LexicalBackend(library);
    codes.push(...(backend.diagnostics ?? []).map((d) => d.code));
    const s = c.search;
    const records = await new Search(library, { backend, audiences: o.audiences }).search(s.query, {
      limit: s.limit ?? 50, includeAll: s.includeAll ?? false, locale: s.locale, concepts: s.concepts,
    });
    return { codes, records };
  }

  const result = await readPackage(join(root, c.target), readOptions);
  const codes = result.diagnostics.map((d) => d.code);
  let sidecarUsable;
  if (o.sidecar) {
    const bound = bindSidecar(join(root, o.sidecar), result);
    codes.push(...bound.diagnostics.map((d) => d.code));
    sidecarUsable = bound.usable;
  }
  const evidenceVerified = {};
  if (result.valid) {
    for (const r of new Library().add(result).citations()) {
      if (r.evidence.length > 0) evidenceVerified[r.node.path] = r.evidence.map((e) => e.verified ?? null);
    }
  }
  return { valid: result.valid, codes, capabilities: result.capabilities, digest: result.digest, sidecarUsable, evidenceVerified };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const { root, case: c } = JSON.parse(input);
  process.stdout.write(JSON.stringify(await actualFor(root, c)));
}
