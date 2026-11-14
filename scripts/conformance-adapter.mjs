#!/usr/bin/env node
// The reference conformance adapter: what @openmoca/moca-core concludes for one
// case of conformance/cases.json, in the shape the runner protocol expects
// (conformance/README.md). Another Reader provides its own adapter.
//
//   echo '{"root": "/abs/conformance", "case": {...}}' | node scripts/conformance-adapter.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readPackage, bindSidecar, directoryResolver, Library, Search, LexicalBackend, DenseBackend, MemoryStoreBackend, HybridBackend, ontologyGuided,
  packageState, bindEnvelopeSidecar,
} from '@openmoca/moca-core';
// The reference Reader implements the optional feature `encryption` through its separate age module.
import { ageDecryptor } from '@openmoca/moca-core/age';

/** The conformance embedder: the identity a case names, and [1, 0, 0, ...] for every text. */
function conformanceEmbedder({ name, version, dimensions, queryPrefix, documentPrefix }) {
  return {
    name,
    ...(version ? { version } : {}),
    dimensions,
    ...(queryPrefix !== undefined ? { queryPrefix } : {}),
    ...(documentPrefix !== undefined ? { documentPrefix } : {}),
    embed: async (texts) => texts.map(() => Array.from({ length: dimensions }, (_, i) => (i === 0 ? 1 : 0))),
  };
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

/** An egress hook that tries to return everything, plus a record from a package that is not loaded. */
function hostileHooks() {
  return {
    egress: (candidates, ctx) => {
      const all = ctx.library.citations({ includeText: true });
      const fake = all[0] ? { ...all[0], package: { ...all[0].package, digest: `sha256:${'0'.repeat(64)}` } } : null;
      return [...candidates, ...all, ...(fake ? [fake] : [])];
    },
  };
}

/**
 * The conformance key provider (encrypted packages §5.1): the identities in the case's identity files, its
 * passphrase, or its file key (hex). No key options means no key provider.
 */
function conformanceKeyProvider(root, o) {
  if (o.identities) {
    const identities = o.identities.flatMap((f) => readFileSync(join(root, f), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('AGE-SECRET-KEY-1')));
    return () => ({ identities });
  }
  if (o.passphrase !== undefined) return () => ({ passphrase: o.passphrase });
  if (o.fileKey !== undefined) return () => ({ fileKey: Uint8Array.from(Buffer.from(o.fileKey, 'hex')) });
  return undefined;
}

/** An ingress hook that asks for more than the caller did: the gate must follow the caller. */
function hostileIngressHooks() {
  return { ingress: () => ({ includeAll: true, limit: 1000, locale: 'fr' }) };
}

const conceptItem = (x) => x && ({ iri: x.iri, ...(x.label !== undefined ? { label: x.label } : {}), layer: x.layer });

export async function actualFor(root, c) {
  const o = c.options ?? {};
  const readOptions = {
    trustRoot: o.trustRoot ? join(root, o.trustRoot) : undefined,
    resolveMember: o.members ? directoryResolver(o.members.map((m) => join(root, m))) : undefined,
    limits: o.limits,
    // The host clock applies to reading too: keys expire (attestations §6).
    clock: o.now ? () => new Date(o.now) : undefined,
    requireSignature: o.requireSignature === true,
    strict: o.strict === true,
    keyProvider: conformanceKeyProvider(root, o),
    decryptor: ageDecryptor,
  };
  const overlays = (o.overlays ?? []).map((v) => ({ id: v.id, layer: v.layer, path: join(root, v.path) }));

  if (c.kind === 'structure') {
    const library = new Library({ overlays });
    for (const target of c.packages) {
      const result = await readPackage(join(root, target), readOptions);
      if (result.valid) library.add(result);
    }
    const s = library.structure;
    const a = c.args ?? {};
    const ops = {
      concept: () => s.concept(c.iri),
      requires: () => s.requires(c.iri, a).map(conceptItem),
      requiredBy: () => s.requiredBy(c.iri).map(conceptItem),
      parts: () => s.parts(c.iri).map(conceptItem),
      narrower: () => s.narrower(c.iri, a).map(conceptItem),
      broader: () => s.broader(c.iri).map(conceptItem),
      related: () => s.related(c.iri).map(conceptItem),
      sequence: () => s.sequence(c.iri)?.map(conceptItem) ?? null,
      nodes: () => s.nodes(c.iri, a).map((r) => r.node.ref),
    };
    return { codes: library.diagnostics.items.map((d) => d.code), result: ops[c.op]() };
  }

  if (c.kind === 'search') {
    const library = new Library({ clock: () => new Date(o.now), overlays, allowUnsignedRelations: o.allowUnsignedRelations === true });
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
    const hooks = o.hooks === 'hostile' ? hostileHooks()
      : o.hooks === 'hostile-ingress' ? hostileIngressHooks()
        : o.hooks === 'ontology-guided' ? ontologyGuided() : undefined;
    const s = c.search;
    const searchOptions = { limit: s.limit ?? 50, includeAll: s.includeAll ?? false, locale: s.locale, concepts: s.concepts, scope: s.scope };
    if (o.backend === 'store') {
      // Everything listed is ingested (each package on its own with
      // `ingestSeparately`); only the packages in `allow` are "loaded", and the
      // search gets their package states (contract §9.4).
      const store = new MemoryStoreBackend({ filterPushdown: false });
      if (o.ingestSeparately) {
        for (const p of library.packages) await store.ingest(new Library({ clock: () => new Date(o.now) }).add(p.result));
      } else {
        await store.ingest(library);
      }
      const allowed = library.packages.filter(({ result }) => (o.allow ?? []).some((t) => join(root, t) === result.source?.location)).map(({ result }) => packageState(result));
      const records = await new Search({ packages: allowed, clock: () => new Date(o.now), allowUnsignedRelations: o.allowUnsignedRelations === true }, { backend: store, audiences: o.audiences, allowUnlabelled: o.allowUnlabelled === true }).search(s.query, searchOptions);
      return { codes, records };
    }
    const dense = () => new DenseBackend(library, { embedder: conformanceEmbedder(o.embedder) });
    const backend = o.backend === 'all' ? everyHitBackend(library)
      : o.backend === 'dense' ? dense()
        : o.backend === 'hybrid' ? new HybridBackend({ lexical: new LexicalBackend(library), dense: dense(), ...(o.hybrid ?? {}) })
          : new LexicalBackend(library);
    codes.push(...(backend.diagnostics ?? []).map((d) => d.code));
    // Library diagnostics (L): for example two digests for one id@version.
    codes.push(...library.diagnostics.items.filter((d) => d.code.startsWith('L')).map((d) => d.code));
    const records = await new Search(library, { backend, audiences: o.audiences, allowUnlabelled: o.allowUnlabelled === true, hooks }).search(s.query, searchOptions);
    return { codes, records };
  }

  const result = await readPackage(join(root, c.target), readOptions);
  const codes = result.diagnostics.map((d) => d.code);
  let sidecarUsable;
  // Encrypted packages §6: the envelope's own index.age, through the same key provider.
  if (o.envelopeSidecar) {
    const bound = await bindEnvelopeSidecar(join(root, c.target), result, readOptions);
    codes.push(...bound.diagnostics.map((d) => d.code));
    sidecarUsable = bound.usable;
  }
  if (o.sidecar) {
    const bound = bindSidecar(join(root, o.sidecar), result);
    codes.push(...bound.diagnostics.map((d) => d.code));
    sidecarUsable = bound.usable;
  }
  const evidenceMatched = {};
  if (result.valid) {
    for (const r of new Library().add(result).citations()) {
      if (r.evidence.length > 0) evidenceMatched[r.node.path] = r.evidence.map((e) => e.matched ?? null);
    }
  }
  return { valid: result.valid, codes, capabilities: result.capabilities, digest: result.digest, distribution: result.distribution ?? null, sidecarUsable, evidenceMatched, envelope: result.envelope };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const { root, case: c } = JSON.parse(input);
  process.stdout.write(JSON.stringify(await actualFor(root, c)));
}
