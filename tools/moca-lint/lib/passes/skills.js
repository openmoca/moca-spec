// Skill frontmatter validation (core §8.1) — folded into Pass 2's referenced-concepts set.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { walkFiles } from '../walk.js';
import { checkConceptRef } from './content.js';

/**
 * @param {object} params
 * @param {string} params.rootDir
 * @param {object} params.manifest
 * @param {Array<{ curie: string, file: string }>} params.referencedConcepts
 * @param {import('../findings.js').FindingCollector} params.findings
 */
export function runSkillsPass({ rootDir, manifest, referencedConcepts, findings }) {
  const skillsDir = join(rootDir, 'skills');
  if (!existsSync(skillsDir)) return;

  const files = walkFiles(skillsDir, rootDir).filter((f) => f.endsWith('/SKILL.md'));

  for (const relPath of files) {
    let parsed;
    try {
      parsed = matter(readFileSync(join(rootDir, relPath), 'utf8'));
    } catch (err) {
      findings.add('E201_FRONTMATTER_SYNTAX', `Invalid YAML frontmatter: ${err.message}`, {
        file: relPath,
      });
      continue;
    }

    const data = parsed.data ?? {};

    if (typeof data.name !== 'string' || typeof data.description !== 'string') {
      findings.add(
        'E206_SKILL_FRONTMATTER_INVALID',
        'SKILL.md frontmatter requires string "name" and "description" fields (core §8.1).',
        { file: relPath }
      );
    }
    if ('allowed-tools' in data && !Array.isArray(data['allowed-tools'])) {
      findings.add(
        'E206_SKILL_FRONTMATTER_INVALID',
        '"allowed-tools" must be an array (core §8.1).',
        { file: relPath }
      );
    }

    const metadata = data.metadata ?? {};
    checkConceptRef(metadata.concepts, relPath, manifest, findings, referencedConcepts);
    checkConceptRef(metadata['education:competencies'], relPath, manifest, findings, referencedConcepts);
  }
}
