// Checks skills/ against the Agent Skills specification
// (https://agentskills.io/specification), as the agent-skills profile
// requires. See profiles/agent-skills/moca-agent-skills-profile.md.
import { posix } from 'node:path';
import { splitFrontmatter } from './frontmatter.js';

export const SKILLS_DIR = 'skills';
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * @param {Map<string, Buffer>} bytes NFC path -> bytes
 * @param {import('./diagnostics.js').Diagnostics} diagnostics
 * @returns {Array<{ name: string, dir: string, description?: string }>}
 */
export function readSkills(bytes, diagnostics) {
  const skillFiles = [...bytes.keys()].filter((p) => /^skills\/[^/]+\/SKILL\.md$/.test(p)).sort();
  const skills = [];
  for (const file of skillFiles) {
    const dir = posix.dirname(file);
    const dirName = posix.basename(dir);
    const split = splitFrontmatter(bytes.get(file).toString('utf8'));
    const problems = [];
    const fm = split.present && !split.error ? split.data : null;
    if (!fm) problems.push('SKILL.md needs a YAML frontmatter mapping');
    else {
      if (typeof fm.name !== 'string' || fm.name.length > 64 || !NAME.test(fm.name)) {
        problems.push('name must be 1-64 lowercase letters, digits and single hyphens');
      } else if (fm.name !== dirName) {
        problems.push(`name "${fm.name}" must match the directory name "${dirName}"`);
      }
      if (typeof fm.description !== 'string' || fm.description.length === 0 || fm.description.length > 1024) {
        problems.push('description must be 1-1024 characters');
      }
      if (fm.compatibility !== undefined && (typeof fm.compatibility !== 'string' || fm.compatibility.length > 500)) {
        problems.push('compatibility must be a string of at most 500 characters');
      }
      if (fm.metadata !== undefined && (typeof fm.metadata !== 'object' || fm.metadata === null || Array.isArray(fm.metadata)
        || Object.values(fm.metadata).some((v) => typeof v !== 'string'))) {
        problems.push('metadata must map string keys to string values');
      }
      if (fm['allowed-tools'] !== undefined && typeof fm['allowed-tools'] !== 'string') {
        problems.push('allowed-tools must be a space-separated string');
      }
    }
    for (const p of problems) diagnostics.add('K001_SKILL_INVALID', p, { file });
    skills.push({ name: dirName, dir, description: fm?.description });
  }
  const dirsWithoutSkill = new Set(
    [...bytes.keys()].filter((p) => p.startsWith(`${SKILLS_DIR}/`) && p.split('/').length >= 3).map((p) => p.split('/')[1]),
  );
  for (const s of skills) dirsWithoutSkill.delete(s.name);
  for (const d of dirsWithoutSkill) {
    diagnostics.add('K001_SKILL_INVALID', `skills/${d} has no SKILL.md`, { file: `skills/${d}` });
  }
  return skills;
}
