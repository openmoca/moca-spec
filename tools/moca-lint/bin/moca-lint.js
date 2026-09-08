#!/usr/bin/env node
import { Command } from 'commander';
import {
  writeFileSync,
  appendFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  renameSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveTarget, extractArchive, UsageError } from '../lib/target.js';
import { lintPackage } from '../lib/lint.js';
import { packPackage } from '../lib/pack.js';
import { formatText, formatJson, formatSarif } from '../lib/format.js';

const program = new Command();
program.name('moca-lint').description('Static analysis CLI for MOCA packages.');

function addCommonOptions(cmd) {
  return cmd
    .option('--strict', 'escalate warning-level findings to errors', false)
    .option('--format <fmt>', 'output format: text|json|sarif', 'text')
    .option('--report <file>', 'write the formatted report to a file (in addition to console output)')
    .option('--log-file <file>', 'write a full debug trace (pass timings) regardless of verbosity')
    .option('-v, --verbose', 'increase console verbosity (repeatable)', (_, prev) => prev + 1, 0)
    .option('-q, --quiet', 'suppress non-error console output', false)
    .option('--no-color', 'disable colored output')
    .option('--online-verify', 'allow live Sigstore/Rekor network verification (not implemented)', false);
}

addCommonOptions(
  program
    .command('lint')
    .argument('<targets...>', 'directory or .moca/.zip file(s) to lint')
).action((targets, options) => {
  runLint(targets, options);
});

addCommonOptions(
  program
    .command('pack')
    .argument('<target>', 'directory to lint and package')
    .option('-o, --out <file>', 'output .moca file path')
    .option('--exclude <patterns...>', 'additional glob exclude patterns')
).action((target, options) => {
  runPack(target, options);
});

addCommonOptions(
  program
    .command('extract')
    .argument('<archive>', '.moca/.zip archive to extract')
    .option('-o, --out <dir>', 'destination directory (required)')
    .option('--force', 'allow extracting into a non-empty destination directory', false)
    .option('--lint', 'run lint against the extracted directory afterward and report findings', false)
).action((archive, options) => {
  runExtract(archive, options);
});

program.parseAsync(process.argv);

function makeLogger(options) {
  const lines = [];
  return {
    log: (line) => {
      lines.push(line);
      if (options.verbose > 0) console.error(`[trace] ${line}`);
    },
    flush: () => {
      if (options.logFile) {
        appendFileSync(options.logFile, lines.join('\n') + '\n');
      }
    },
  };
}

function writeReport(options, formatted) {
  if (options.report) {
    writeFileSync(options.report, formatted);
  }
  if (!options.quiet && (!options.report || options.format === 'text')) {
    console.log(formatted);
  }
}

function formatFindings(findings, format) {
  if (format === 'json') return formatJson(findings);
  if (format === 'sarif') return formatSarif(findings);
  return formatText(findings);
}

function runLint(targets, options) {
  const allFindings = [];
  let usageError = null;

  for (const targetPath of targets) {
    const logger = makeLogger(options);
    try {
      const { rootDir, cleanup } = resolveTarget(targetPath);
      try {
        const { findings } = lintPackage({ rootDir, strict: options.strict, onLog: logger.log });
        for (const f of findings) {
          allFindings.push({ ...f, file: prefixTarget(targetPath, f.file) });
        }
      } finally {
        cleanup();
        logger.flush();
      }
    } catch (err) {
      if (err instanceof UsageError) {
        usageError = err;
        console.error(`moca-lint: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  if (usageError) {
    process.exit(2);
  }

  writeReport(options, formatFindings(allFindings, options.format));
  process.exit(allFindings.some((f) => f.severity === 'error') ? 1 : 0);
}

function runPack(target, options) {
  const outPath = options.out ?? defaultOutName(target);
  const logger = makeLogger(options);

  let rootDir;
  let cleanup = () => {};
  try {
    ({ rootDir, cleanup } = resolveTarget(target));
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`moca-lint: ${err.message}`);
      process.exit(2);
    }
    throw err;
  }

  try {
    const { success, findings } = packPackage({
      rootDir,
      outPath,
      strict: options.strict,
      exclude: options.exclude ?? [],
      onLog: logger.log,
    });

    writeReport(options, formatFindings(findings, options.format));

    if (!success) {
      console.error('moca-lint: pack aborted, lint errors present.');
      process.exit(1);
    }
    if (!options.quiet) {
      console.log(`Wrote ${outPath}`);
    }
    process.exit(0);
  } finally {
    cleanup();
    logger.flush();
  }
}

function runExtract(archivePath, options) {
  if (!options.out) {
    console.error('moca-lint: -o/--out <dir> is required for extract.');
    process.exit(2);
  }

  const logger = makeLogger(options);
  const destDir = options.out;
  const destExists = existsSync(destDir);
  const destNonEmpty = destExists && readdirSync(destDir).length > 0;

  if (destNonEmpty && !options.force) {
    console.error(`moca-lint: destination "${destDir}" already exists and is not empty; pass --force to overwrite.`);
    process.exit(2);
  }

  const useScratch = destNonEmpty;
  const stageDir = useScratch ? mkdtempSync(join(tmpdir(), 'moca-lint-extract-')) : destDir;

  try {
    try {
      if (!existsSync(stageDir)) mkdirSync(stageDir, { recursive: true });
      extractArchive(archivePath, stageDir);

      if (useScratch) {
        rmSync(destDir, { recursive: true, force: true });
        renameSync(stageDir, destDir);
      }
    } catch (err) {
      // Never leave a partial extraction behind: in scratch mode that's a
      // temp dir (the pre-existing destDir is untouched); in direct mode
      // stageDir === destDir, so a freshly-created destination is cleaned up.
      if (existsSync(stageDir)) rmSync(stageDir, { recursive: true, force: true });
      throw err;
    }

    if (!options.quiet) {
      console.log(`Extracted to ${destDir}`);
    }

    if (options.lint) {
      const { findings } = lintPackage({ rootDir: destDir, strict: options.strict, onLog: logger.log });
      writeReport(options, formatFindings(findings, options.format));
      process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0);
    }

    process.exit(0);
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`moca-lint: ${err.message}`);
      process.exit(2);
    }
    throw err;
  } finally {
    logger.flush();
  }
}

function prefixTarget(targetPath, file) {
  if (!file) return targetPath;
  return `${targetPath}/${file}`;
}

function defaultOutName(targetPath) {
  const base = targetPath.replace(/\/$/, '').split('/').pop();
  return `${base}.moca`;
}
