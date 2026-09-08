#!/usr/bin/env node
import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import pc from 'picocolors';
import { signPackage } from '../lib/sign.js';
import { verifyPackageSignature } from '../lib/verify.js';
import { generateKeyPair } from '../lib/keys.js';

const program = new Command();
program.name('moca-sign').description('Reference Sigstore/DSSE signing and verification for MOCA packages.');

program
  .command('generate-key')
  .description('generate an Ed25519 keypair for dsse-mode signing')
  .requiredOption('-o, --out <prefix>', 'writes <prefix>.pem (private) and <prefix>.pub.pem (public)')
  .action((options) => {
    const { privateKeyPem, publicKeyPem } = generateKeyPair();
    writeFileSync(`${options.out}.pem`, privateKeyPem, { mode: 0o600 });
    writeFileSync(`${options.out}.pub.pem`, publicKeyPem);
    console.log(`Wrote ${options.out}.pem (private, keep secret) and ${options.out}.pub.pem`);
  });

program
  .command('sign')
  .argument('<target>', 'package directory to sign in place')
  .requiredOption('--mode <mode>', 'signing mode: dsse|sigstore')
  .option('--key <path>', 'dsse mode: PEM Ed25519 private key path')
  .option('--keyid <id>', 'dsse mode: key identifier recorded in the signature and looked up in verifiers\' trust roots')
  .option('--fulcio-url <url>', 'sigstore mode: Fulcio instance URL')
  .option('--rekor-url <url>', 'sigstore mode: Rekor instance URL')
  .option('--identity-token <token>', 'sigstore mode: OIDC identity token (defaults to ambient CI/env credentials)')
  .action(async (target, options) => {
    try {
      const { canonicalDigest, signature } = await signPackage({
        rootDir: target,
        mode: options.mode,
        privateKeyPath: options.key,
        keyid: options.keyid,
        signOptions: {
          fulcioURL: options.fulcioUrl,
          rekorURL: options.rekorUrl,
          identityToken: options.identityToken,
        },
      });
      console.log(pc.green('Signed.'));
      console.log(`  canonicalDigest: ${canonicalDigest.algorithm}:${canonicalDigest.value}`);
      console.log(`  signature.type:  ${signature.type}`);
    } catch (err) {
      console.error(`moca-sign: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('verify')
  .argument('<target>', 'package directory to verify')
  .option('--trust-root <path>', 'dsse mode: trust-roots.json (spec/moca-trust-model.md §4.2); sigstore mode: pinned TUF cache dir (§4.1)')
  .option('--identity-constraint <constraint...>', 'sigstore mode: repeatable "<issuer>=<identity-pattern>" (§4.1)')
  .option('--online-verify', 'sigstore mode: confirm live Rekor inclusion and refresh the trust root (§5)', false)
  .option('--allow-offline-fallback', 'sigstore mode: degrade to offline verification if --online-verify cannot reach the network', false)
  .option('--format <fmt>', 'output format: text|json', 'text')
  .action(async (target, options) => {
    const identityConstraints = (options.identityConstraint ?? []).map((entry) => {
      const eq = entry.indexOf('=');
      if (eq === -1) {
        console.error(`moca-sign: --identity-constraint must be "<issuer>=<pattern>", got "${entry}"`);
        process.exit(2);
      }
      return { issuer: entry.slice(0, eq), pattern: entry.slice(eq + 1) };
    });

    const result = await verifyPackageSignature({
      rootDir: target,
      dsseTrustRootPath: options.trustRoot,
      sigstoreTrustRootPath: options.trustRoot,
      identityConstraints,
      onlineVerify: options.onlineVerify,
      allowOfflineFallback: options.allowOfflineFallback,
    });

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else if (result.outcome === 'valid') {
      console.log(pc.green('Valid.'), result.keyid ? `keyid=${result.keyid}` : '');
    } else {
      console.log(pc.red(`${result.outcome[0].toUpperCase()}${result.outcome.slice(1)}.`), result.reason);
    }

    process.exit(result.outcome === 'valid' ? 0 : 1);
  });

program.parseAsync(process.argv);
