#!/usr/bin/env node
// Runs the MOCA MCP server over stdio. Logs go to stderr; stdout is the protocol.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Command } from 'commander';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadLibrary, createServer } from '../lib/index.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const program = new Command();
program
  .name('moca-mcp')
  .description('Serve MOCA packages to any MCP client over stdio.')
  .version(version)
  .argument('<packages...>', 'package directories or .moca archives; use path=sidecar to bind a sidecar index')
  .option('--trust-root <file>', 'trust root for verifying package and review attestations')
  .option('--members <dirs...>', 'directories to search for member packages')
  .option('--audience <list>', 'comma-separated audiences this host may serve (default: no filter)')
  .option('--embedder <module>', 'experimental: a module whose default export is an embedder { name, version?, dimensions, embed(texts) }; search then uses sidecar vectors')
  .action(async (packages, opts) => {
    const log = (line) => process.stderr.write(`moca-mcp: ${line}\n`);
    const entries = packages.map((p) => {
      const i = p.indexOf('=');
      return i > 0 ? { package: p.slice(0, i), sidecar: p.slice(i + 1) } : { package: p };
    });
    const library = await loadLibrary({ packages: entries, trustRoot: opts.trustRoot, memberDirs: opts.members, log });
    if (library.packages.length === 0) {
      log('no valid packages to serve');
      process.exit(1);
    }
    const audiences = opts.audience ? opts.audience.split(',').map((a) => a.trim()).filter(Boolean) : undefined;
    const embedder = opts.embedder ? (await import(pathToFileURL(resolve(opts.embedder)).href)).default : undefined;
    const server = createServer(library, { audiences, embedder, version, log });
    await server.connect(new StdioServerTransport());
  });

program.parseAsync(process.argv);
