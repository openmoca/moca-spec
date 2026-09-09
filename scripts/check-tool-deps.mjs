// Asserts every workspace-internal import is a DECLARED dependency of the
// package that makes it.
//
// npm's flat node_modules makes an undeclared transitive dependency work by
// accident -- moca-index imported @openmoca/moca-sign while declaring only
// @openmoca/moca-lint, and resolved fine because moca-lint pulled moca-sign
// in. Under pnpm, Yarn PnP, or any strict installer that breaks. This check
// catches it before publication rather than in a user's install.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const TOOLS_DIR = join(root, 'tools');
const SCOPE = '@openmoca/';

function sourceFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(abs, found);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) found.push(abs);
  }
  return found;
}

let failed = false;

for (const entry of readdirSync(TOOLS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const toolDir = join(TOOLS_DIR, entry.name);
  const pkg = JSON.parse(readFileSync(join(toolDir, 'package.json'), 'utf8'));
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    pkg.name,
  ]);

  // Only shipped code matters: tests are not installed by consumers.
  const shipped = ['lib', 'bin']
    .map((sub) => join(toolDir, sub))
    .filter((dir) => { try { return statSync(dir).isDirectory(); } catch { return false; } })
    .flatMap((dir) => sourceFiles(dir));

  for (const file of shipped) {
    const src = readFileSync(file, 'utf8');
    // Capture the whole specifier, then reduce it to a package name. An
    // earlier version matched a prefix of the specifier and silently passed
    // deep imports like "@openmoca/moca-sign/lib/x.js" -- the exact shape
    // this check exists to catch.
    for (const match of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
      const spec = match[1];
      if (!spec.startsWith(SCOPE)) continue;
      const packageName = spec.split('/').slice(0, 2).join('/');
      if (!declared.has(packageName)) {
        console.error(
          `[FAIL] ${relative(root, file)} imports ${packageName}, which ${pkg.name} does not declare as a dependency`
        );
        failed = true;
      }
    }
  }

  // A dependency declared but never imported is dead weight in a consumer's
  // install; report it, but don't fail the build over it.
  const importedNames = new Set(
    shipped.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/from\s+['"](@openmoca\/[^'"/]+)/g)].map((m) => m[1])
    )
  );
  for (const dep of Object.keys(pkg.dependencies ?? {})) {
    if (dep.startsWith(SCOPE) && !importedNames.has(dep)) {
      console.warn(`[WARN] ${pkg.name} declares ${dep} but never imports it from lib/ or bin/`);
    }
  }
}

if (failed) {
  console.error('\nWorkspace dependency check failed: an undeclared import will break under a strict installer.');
  process.exit(1);
}
console.log('[OK]   every workspace-internal import is a declared dependency.');
