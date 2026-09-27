// The ontology profile: profiles/ontology/moca-ontology-profile.md.
// Parses the package's own Turtle files and checks node concept bindings.
// Nothing is fetched: owl:imports and non-absolute IRIs are reported, never followed.
import { Parser } from 'n3';
import { PROFILE_ONTOLOGY } from './profiles.js';

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const OWL_IMPORTS = 'http://www.w3.org/2002/07/owl#imports';
const ABSOLUTE_IRI = /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$/;
const PREFIX_DECL = /^\s*(?:@prefix|PREFIX)\s+([A-Za-z][\w.-]*)?:/gim;

/**
 * Sets rep.concepts on every representation that binds concepts, and reports
 * O diagnostics.
 * @returns {{ ok: boolean, declared: Set<string> }}
 */
export function readOntology({ manifest, bytes, nodes, diagnostics, limits }) {
  const data = manifest?.profiles?.[PROFILE_ONTOLOGY];
  const before = diagnostics.items.length;
  const declared = new Set();
  const prefixes = new Set();
  const files = Array.isArray(data?.files) ? data.files : [];
  if (files.length === 0) diagnostics.add('O001_ONTOLOGY_UNPARSEABLE', 'the ontology profile lists no files', { file: 'moca.json' });

  for (const entry of files) {
    const path = typeof entry?.path === 'string' ? entry.path.replace(/^\.\//, '').normalize('NFC') : '';
    const text = bytes.get(path);
    if (!text) {
      diagnostics.add('O001_ONTOLOGY_UNPARSEABLE', `ontology file "${entry?.path}" is not in the package`, { file: 'moca.json' });
      continue;
    }
    if (text.length > limits.maxStructureBytes) {
      diagnostics.add('O001_ONTOLOGY_UNPARSEABLE', `ontology file is larger than the ${limits.maxStructureBytes}-byte limit`, { file: path });
      continue;
    }
    for (const m of text.toString('utf8').matchAll(PREFIX_DECL)) if (m[1]) prefixes.add(m[1]);
    let quads;
    try {
      quads = new Parser({ format: 'text/turtle' }).parse(text.toString('utf8'));
    } catch (err) {
      diagnostics.add('O001_ONTOLOGY_UNPARSEABLE', `ontology file is not parseable Turtle: ${err.message}`, { file: path });
      continue;
    }
    if (quads.length > limits.maxTriples) {
      diagnostics.add('O001_ONTOLOGY_UNPARSEABLE', `ontology file has ${quads.length} triples, over the ${limits.maxTriples} limit`, { file: path });
      continue;
    }
    for (const q of quads) {
      if (q.predicate.value === OWL_IMPORTS) {
        diagnostics.add('O003_REMOTE_REFERENCE', `owl:imports ${q.object.value} is not allowed; ontologies must be self-contained`, { file: path });
      }
      for (const term of [q.subject, q.predicate, q.object]) {
        if (term.termType === 'NamedNode' && !ABSOLUTE_IRI.test(term.value)) {
          diagnostics.add('O003_REMOTE_REFERENCE', `IRI <${term.value}> is not absolute`, { file: path });
        }
      }
      if (entry.role !== 'shapes' && q.predicate.value === RDF_TYPE && q.subject.termType === 'NamedNode') declared.add(q.subject.value);
    }
  }

  const check = (iri, file, what) => {
    if (typeof iri !== 'string' || !ABSOLUTE_IRI.test(iri)) {
      diagnostics.add('O003_REMOTE_REFERENCE', `${what} "${iri}" is not an absolute IRI`, { file });
      return false;
    }
    if (prefixes.has(iri.slice(0, iri.indexOf(':'))) && !declared.has(iri)) {
      diagnostics.add('O003_REMOTE_REFERENCE', `${what} "${iri}" is a prefixed name; write the absolute IRI`, { file });
      return false;
    }
    if (!declared.has(iri)) diagnostics.add('O002_CONCEPT_UNDECLARED', `${what} ${iri} is not declared by any ontology file`, { file });
    return true;
  };

  for (const iri of Array.isArray(data?.entryConcepts) ? data.entryConcepts : []) check(iri, 'moca.json', 'entry concept');
  for (const node of nodes) {
    for (const rep of node.representations) {
      const bindings = rep.frontmatter.moca?.profiles?.[PROFILE_ONTOLOGY]?.concepts;
      if (!Array.isArray(bindings)) continue;
      const concepts = bindings.map((b) => b?.iri).filter((iri) => check(iri, rep.file, 'concept'));
      if (concepts.length > 0) rep.concepts = [...new Set(concepts)];
    }
  }

  const ok = !diagnostics.items.slice(before).some((d) => d.code.startsWith('O'));
  return { ok, declared };
}
