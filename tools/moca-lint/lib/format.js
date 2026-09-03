import pc from 'picocolors';
import { CODES } from './codes.js';

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };
const SEVERITY_COLOR = { error: pc.red, warning: pc.yellow, info: pc.cyan };

/** @param {import('./findings.js').Finding[]} findings */
export function formatText(findings) {
  if (findings.length === 0) {
    return pc.green('No findings.');
  }

  const byFile = new Map();
  for (const f of findings) {
    const key = f.file ?? '(package)';
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push(f);
  }

  const lines = [];
  for (const [file, fileFindings] of byFile) {
    lines.push(pc.bold(file));
    for (const f of fileFindings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])) {
      const color = SEVERITY_COLOR[f.severity] ?? ((s) => s);
      lines.push(`  ${color(f.severity.toUpperCase())} ${f.code}  ${f.message}`);
    }
  }

  const counts = countBySeverity(findings);
  lines.push('');
  lines.push(`${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info`);
  return lines.join('\n');
}

/** @param {import('./findings.js').Finding[]} findings */
export function formatJson(findings) {
  return JSON.stringify(
    { findings, summary: countBySeverity(findings) },
    null,
    2
  );
}

/** @param {import('./findings.js').Finding[]} findings */
export function formatSarif(findings) {
  const rules = Object.keys(CODES).map((code) => ({
    id: code,
    shortDescription: { text: CODES[code].summary },
  }));

  const results = findings.map((f) => ({
    ruleId: f.code,
    level: sarifLevel(f.severity),
    message: { text: f.message },
    locations: f.file
      ? [
          {
            physicalLocation: {
              artifactLocation: { uri: f.file },
              ...(f.line ? { region: { startLine: f.line } } : {}),
            },
          },
        ]
      : [],
  }));

  return JSON.stringify(
    {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: { driver: { name: 'moca-lint', informationUri: 'https://github.com/moca-spec', rules } },
          results,
        },
      ],
    },
    null,
    2
  );
}

function sarifLevel(severity) {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  return 'note';
}

function countBySeverity(findings) {
  return findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    },
    { error: 0, warning: 0, info: 0 }
  );
}
