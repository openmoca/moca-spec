#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { generateKeyPair, trustRootFor, signPackage, reviewNodes, verifyPackage, SignError } from '../lib/index.js';
import { formatText } from '../lib/deps.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const program = new Command();
program
  .name('moca-sign')
  .description('Write and verify MOCA package and review attestations (DSSE or Sigstore).')
  .version(version);

const keyOptions = (cmd) => cmd
  .option('--key <pem>', 'Ed25519 private key (PKCS#8 PEM) for DSSE signing')
  .option('--keyid <id>', 'key id recorded in the DSSE envelope; must match the verifier trust root')
  .option('--sigstore', 'sign keyless with Sigstore (needs an OIDC identity, e.g. in CI)', false);

function keyArgs(opts) {
  if (opts.sigstore) return { sigstore: true };
  if (!opts.key || !opts.keyid) throw new SignError('pass --key and --keyid, or --sigstore');
  return { privateKeyPem: readFileSync(opts.key, 'utf8'), keyid: opts.keyid };
}

program.command('keygen')
  .description('generate an Ed25519 key pair and a trust root that lists it')
  .requiredOption('--keyid <id>', 'key id')
  .requiredOption('-o, --out <dir>', 'output directory')
  .option('--identity <text>', 'human-readable label for the key')
  .option('--roles <roles>', 'comma-separated roles the key may sign for: package,review')
  .action((opts) => run(() => {
    const { privateKeyPem, publicKeyPem } = generateKeyPair();
    mkdirSync(opts.out, { recursive: true });
    writeFileSync(join(opts.out, `${opts.keyid}.pem`), privateKeyPem, { mode: 0o600 });
    writeFileSync(join(opts.out, `${opts.keyid}.pub.pem`), publicKeyPem);
    const roles = opts.roles ? opts.roles.split(',').map((r) => r.trim()) : undefined;
    const root = trustRootFor({ keyid: opts.keyid, publicKeyPem, identity: opts.identity, roles });
    writeFileSync(join(opts.out, 'trust-root.json'), `${JSON.stringify(root, null, 2)}\n`);
    console.log(`Wrote ${opts.keyid}.pem, ${opts.keyid}.pub.pem and trust-root.json to ${opts.out}. Keep the private key out of any package.`);
  }));

keyOptions(program.command('sign')
  .description('attest that this exact package is published by you (writes attestations/package.*.json)')
  .argument('<package>', 'package directory'))
  .action((dir, opts) => run(async () => {
    const out = await signPackage({ dir, ...keyArgs(opts) });
    console.log(`Signed ${out.digest}\nWrote ${out.file}`);
  }));

keyOptions(program.command('review')
  .description('attest that a reviewer checked these exact node files (writes attestations/reviews/*.json)')
  .argument('<package>', 'package directory')
  .requiredOption('--nodes <paths...>', 'node paths relative to content/')
  .requiredOption('--reviewer <actor>', 'OKF actor, e.g. human:jane.doe')
  .option('--outcome <outcome>', 'accurate | needs-change | inaccurate', 'accurate')
  .option('--at <iso>', 'review time (default: now)')
  .option('--scope <text>', 'what the review covered')
  .option('--note <text>', 'free-text note')
  .option('--name <stem>', 'file name stem under attestations/reviews/'))
  .action((dir, opts) => run(async () => {
    if (!['accurate', 'needs-change', 'inaccurate'].includes(opts.outcome)) throw new SignError(`unknown outcome ${opts.outcome}`);
    const out = await reviewNodes({
      dir, nodes: opts.nodes, reviewer: opts.reviewer, outcome: opts.outcome, reviewedAt: opts.at,
      scope: opts.scope, note: opts.note, name: opts.name, ...keyArgs(opts),
    });
    console.log(`Reviewed ${out.files.map((f) => f.path).join(', ')}\nWrote ${out.file}`);
  }));

program.command('verify')
  .description('verify every attestation in a package against a trust root')
  .argument('<package>', 'package directory or .moca archive')
  .requiredOption('--trust-root <file>', 'trust-root JSON (spec/moca-attestations.md section 6)')
  .option('--online', 'also check the live Sigstore transparency log', false)
  .option('--allow-offline-fallback', 'degrade to offline checks if online verification cannot complete', false)
  .option('--tuf-cache <dir>', 'pinned Sigstore TUF cache directory')
  .action((dir, opts) => run(async () => {
    const result = await verifyPackage({
      dir, trustRoot: opts.trustRoot, online: opts.online, allowOfflineFallback: opts.allowOfflineFallback, tufCachePath: opts.tufCache,
    });
    for (const a of result.attestations) {
      console.log(`${a.outcome.toUpperCase().padEnd(13)} ${a.file}${a.signer ? `  (${a.signer})` : ''}${a.reason ? `  ${a.reason}` : ''}`);
    }
    const relevant = result.diagnostics.filter((d) => /^(A|T|P|M)\d/.test(d.code));
    if (relevant.length > 0) console.log(`\n${formatText(relevant)}`);
    console.log(result.ok ? `\nVerified ${result.digest}` : '\nVerification failed.');
    process.exitCode = result.ok ? 0 : 1;
  }));

async function run(fn) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof SignError) {
      console.error(`moca-sign: ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}

program.parseAsync(process.argv);
