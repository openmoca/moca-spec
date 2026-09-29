#!/usr/bin/env node
// Downloads the PDFs a pdfs.json lists (see tools/moca-convert, `pdf`
// adapter) into the folder beside it, and checks each against its sha256.
//
//   node scripts/fetch-pdfs.mjs <folder> [--pin]
//
// A file already present with the right digest is not downloaded again.
// --pin records the digest of each file that has none, so later fetches and
// conversions can tell when the publisher has changed a document.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [folder, ...flags] = process.argv.slice(2);
if (!folder) {
  console.error('usage: node scripts/fetch-pdfs.mjs <folder> [--pin]');
  process.exit(2);
}
const pin = flags.includes('--pin');
const descriptorPath = join(folder, 'pdfs.json');
const descriptor = JSON.parse(readFileSync(descriptorPath, 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

let failed = 0;
let pinned = 0;
for (const doc of descriptor.documents) {
  const path = join(folder, doc.file);
  if (existsSync(path) && (!doc.sha256 || sha256(readFileSync(path)) === doc.sha256)) {
    console.log(`have  ${doc.file}`);
  } else if (!doc.url) {
    console.error(`FAIL  ${doc.file}: missing, and pdfs.json gives no url`);
    failed++;
    continue;
  } else {
    // Some publishers' CDNs (the FAA's among them) refuse any agent string
    // they do not recognise.
    const res = await fetch(doc.url, { headers: { 'user-agent': 'Mozilla/5.0', accept: '*/*' } });
    if (!res.ok) {
      console.error(`FAIL  ${doc.file}: ${res.status} ${res.statusText} from ${doc.url}`);
      failed++;
      continue;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (doc.sha256 && sha256(bytes) !== doc.sha256) {
      console.error(`FAIL  ${doc.file}: downloaded SHA-256 ${sha256(bytes)}, pdfs.json pins ${doc.sha256}; the publisher has changed it`);
      failed++;
      continue;
    }
    writeFileSync(`${path}.part`, bytes);
    renameSync(`${path}.part`, path);
    console.log(`got   ${doc.file}  ${(bytes.length / 1e6).toFixed(1)} MB`);
  }
  if (pin && !doc.sha256) {
    doc.sha256 = sha256(readFileSync(path));
    pinned++;
  }
}
if (pinned > 0) {
  writeFileSync(descriptorPath, `${JSON.stringify(descriptor, null, 2)}\n`);
  console.log(`pinned ${pinned} digest(s) in ${descriptorPath}`);
}
if (failed > 0) process.exitCode = 1;
