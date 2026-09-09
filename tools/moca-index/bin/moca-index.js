#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { buildSidecar } from '../lib/build.js';
import { writeSidecar, BuildFailedError } from '../lib/write.js';
import { UsageError } from '../lib/target.js';

// npm always includes package.json in a published tarball, regardless of the
// "files" field, so reading the version from it works once installed.
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

const program = new Command();
program
  .name('moca-index')
  .description('Build a .moca.idx sidecar index for a MOCA package.')
  .version(version);

// Commander's own usage errors (missing required options, unknown flags,
// --help) default to exit code 1; override so they participate in the same
// 0/2 usage-error convention as everything this CLI throws itself. Must be
// called before any .command() below: commander copies the parent's
// exitOverride setting onto a subcommand at the moment .command() creates
// it, so a subcommand defined before this call would silently keep the
// default (wrong) exit-code-1 behavior.
program.exitOverride();

program
  .command('build')
  .argument('<package-dir>', 'target MOCA package directory')
  .requiredOption('-o, --output <path>', 'output directory (or file path with --zip)')
  .option('--allow-unbound', 'build a sidecar even when the target has no canonicalDigest', false)
  .option('--zip', 'write a single .moca.idx archive instead of a directory', false)
  .option('--force', 'allow overwriting a non-empty output directory / an existing output file', false)
  .option('--embedder <name>', 'embedding provider; only "none" (lexical-only) is implemented so far', 'none')
  .action((packageDir, options) => {
    run(packageDir, options);
  });

program.parseAsync(process.argv).catch((err) => {
  if (err.code && err.code.startsWith('commander.')) {
    process.exit(err.code === 'commander.helpDisplayed' ? 0 : 2);
  }
  throw err;
});

function run(packageDir, options) {
  try {
    const { indexManifest, payloadItems } = buildSidecar({
      targetDir: packageDir,
      options: { allowUnbound: options.allowUnbound, embedder: options.embedder },
    });

    writeSidecar({
      indexManifest,
      payloadItems,
      targetDir: packageDir,
      outPath: options.output,
      force: options.force,
      zip: options.zip,
    });

    const boundNote = indexManifest.target_package_hash ? '' : ', unbound';
    console.log(`Wrote ${options.output} (${payloadItems.length} item(s)${boundNote})`);
    process.exit(0);
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`moca-index: ${err.message}`);
      process.exit(2);
    }
    if (err instanceof BuildFailedError) {
      console.error(`moca-index: ${err.message}`);
      for (const detail of err.errors) {
        console.error(`  ${detail}`);
      }
      process.exit(1);
    }
    throw err;
  }
}
