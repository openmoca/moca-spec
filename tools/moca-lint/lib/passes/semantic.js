// Pass 3: Semantic & Graph Validation (E300 series, Level 2+) — core §6.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Parser as TurtleParser } from 'n3';
import { walkFiles } from '../walk.js';

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {object} params.manifest
 * @param {Array<{ curie: string, file: string }>} params.referencedConcepts
 * @param {import('../findings.js').FindingCollector} params.findings
 */
export function runSemanticPass({ rootDir, manifest, referencedConcepts, findings }) {
  const ontologiesDir = join(rootDir, 'ontologies');
  if (!existsSync(ontologiesDir)) return;

  const files = walkFiles(ontologiesDir, rootDir);
  /** @type {Map<string, { type: string|undefined, file: string }[]>} */
  const declaredConcepts = new Map();
  let parsedAnyGraph = false;
  let hasShapesOntology = declaresShapesRole(manifest);

  for (const relPath of files) {
    const absPath = join(rootDir, relPath);
    if (relPath.endsWith('.jsonld')) {
      let doc;
      try {
        doc = JSON.parse(readFileSync(absPath, 'utf8'));
      } catch (err) {
        findings.add('E301_RDF_SYNTAX_ERROR', `Invalid JSON-LD: ${err.message}`, { file: relPath });
        continue;
      }
      parsedAnyGraph = true;
      for (const node of doc['@graph'] ?? []) {
        const id = node['@id'];
        if (!id) continue;
        const list = declaredConcepts.get(id) ?? [];
        list.push({ type: node['@type'], file: relPath });
        declaredConcepts.set(id, list);
      }
    } else if (relPath.endsWith('.ttl')) {
      try {
        new TurtleParser().parse(readFileSync(absPath, 'utf8'));
      } catch (err) {
        findings.add('E301_RDF_SYNTAX_ERROR', `Invalid Turtle: ${err.message}`, { file: relPath });
      }
    }
  }

  for (const [id, declarations] of declaredConcepts) {
    const distinctTypes = new Set(declarations.map((d) => d.type));
    if (distinctTypes.size > 1) {
      const files = declarations.map((d) => d.file).join(', ');
      findings.add(
        'E303_DUPLICATE_CONCEPT_DECLARATION',
        `Concept "${id}" is declared with conflicting @type across ${files}.`,
        { file: declarations[0].file }
      );
    }
  }

  if (parsedAnyGraph) {
    for (const { curie, file } of referencedConcepts) {
      if (!declaredConcepts.has(curie)) {
        findings.add(
          'E304_UNDEFINED_CONCEPT',
          `Concept "${curie}" does not resolve to an @id declared in any ontologies/ graph in this package.`,
          { file }
        );
      }
    }
  }

  if (hasShapesOntology) {
    findings.add(
      'I301_SHACL_NOT_EVALUATED',
      'A shapes ontology is declared; moca-lint does not evaluate SHACL shape conformance yet.',
      { file: 'ontologies/' }
    );
  }
}

function declaresShapesRole(manifest) {
  const ontologies = manifest.ontologies ?? {};
  return Object.entries(ontologies).some(([role, value]) => {
    if (role === 'shapes') return true;
    if (value && typeof value === 'object' && value.role === 'shapes') return true;
    if (value && typeof value === 'object' && value.format === 'shacl') return true;
    return false;
  });
}
