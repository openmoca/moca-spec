#!/usr/bin/env node
import { Command } from 'commander';
import { writeFileSync, appendFileSync } from 'node:fs';
import { formatText, formatJson } from 'moca-lint/lib/format.js';
import { resolveInputTarget, UsageError } from '../lib/target.js';
import { resolveAdapterName } from '../lib/detect.js';
import { getAdapter } from '../lib/adapters/index.js';
import { writeDraft, ConversionFailedError } from '../lib/write.js';

const program = new Command();
program
  .name('moca-convert')
  .description('Create a Level 1 MOCA package from an existing source (directory, Markdown, Obsidian vault, or suitable OpenAPI document).')
  .argument('<input>', 'source file or directory to convert')
  .requiredOption('-o, --output <dir>', 'output package directory')
  .requiredOption('--id <urn>', 'manifest id for the converted package')
  .option('--title <string>', 'manifest title for the converted package')
  .option('--version <semver>', 'manifest version for the converted package', '1.0.0')
  .option('--from <format>', 'source format: directory|markdown|obsidian|openapi (auto-detected if omitted)')
  .option('--force', 'allow writing into a non-empty output directory', false)
  .option('--strict', 'escalate warning-level output-validation findings to errors', false)
  .option('--format <fmt>', 'summary output format: text|json', 'text')
  .option('--report <file>', 'write the formatted summary to a file (in addition to console output)')
  .option('--log-file <file>', 'write a full debug trace (pass timings) regardless of verbosity')
  .option('-v, --verbose', 'increase console verbosity (repeatable)', (_, prev) => prev + 1, 0)
  .option('-q, --quiet', 'suppress non-error console output', false)
  .option('--no-color', 'disable colored output')
  .action((input, options) => {
    run(input, options);
  });

// Commander's own usage errors (missing required options, unknown flags,
// --help) default to exit code 1; override so they participate in the same
// 0/2 usage-error convention as everything this CLI throws itself.
program.exitOverride();

program.parseAsync(process.argv).catch((err) => {
  if (err.code && err.code.startsWith('commander.')) {
    process.exit(err.code === 'commander.helpDisplayed' ? 0 : 2);
  }
  throw err;
});

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

function run(input, options) {
  const logger = makeLogger(options);
  try {
    const target = resolveInputTarget(input);
    const adapterName = resolveAdapterName(target, options.from);
    const adapter = getAdapter(adapterName);

    const draft = adapter.convert({
      inputPath: input,
      options: {
        id: options.id,
        title: options.title,
        version: options.version,
      },
    });

    const { findings } = writeDraft({
      draft,
      outDir: options.output,
      force: options.force,
      strict: options.strict,
      onLog: logger.log,
    });

    if (!options.quiet) {
      console.log(`Wrote ${options.output} (${draft.contentNodes.length} content node(s), ${draft.warnings.length} warning(s))`);
    }
    for (const warning of draft.warnings) {
      console.error(`moca-convert: WARNING ${warning.code}  ${warning.file ? `${warning.file}: ` : ''}${warning.message}`);
    }
    if (findings.length > 0) {
      writeReport(options, formatFindings(findings, options.format));
    }
    process.exit(0);
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`moca-convert: ${err.message}`);
      process.exit(2);
    }
    if (err instanceof ConversionFailedError) {
      console.error(`moca-convert: ${err.message}`);
      writeReport(options, formatFindings(err.findings, options.format));
      process.exit(1);
    }
    throw err;
  } finally {
    logger.flush();
  }
}

function formatFindings(findings, format) {
  if (format === 'json') return formatJson(findings);
  return formatText(findings);
}
