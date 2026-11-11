#!/usr/bin/env node
// An open MOCA repository must build from public sources only. This fails on
// any dependency that comes from a private organisation, a private registry or
// package feed, a git URL outside openmoca, or a path that leaves the
// repository for anything other than another open MOCA repository checked out
// beside it. Python dependency files (pyproject.toml, uv.lock, requirements,
// pip and uv configuration) are held to the same rule, with PyPI as the index.
// It also fails when a published npm package imports a package it
// does not declare, so it installs and runs on its own once published, not
// only beside its siblings.
//
// Usage: node scripts/check-deps.mjs [repo-dir]   (default: this repository)
//
// Every open repository runs it in CI against itself. It uses Node built-ins
// only, so it runs before `npm ci` and needs no sibling checkouts.
import { builtinModules } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(process.argv[2] ?? here);
const siblings = dirname(repo);

// The open MOCA repositories. While they are private they live beside each
// other, so CI checks them out side by side and links them by path.
const OPEN_REPOS = new Set([
  'moca-spec',
  'moca-reader-typescript',
  'moca-reader-dotnet',
  'moca-reader-python',
  'moca-mcp-dotnet',
  'moca-convert',
  'moca-tools',
  'moca-examples',
  'openmoca.org',
]);
const OPEN_ORG = 'openmoca';
const PRIVATE_ORGS = new Set(['piandmash']);
const NPM_REGISTRY = 'https://registry.npmjs.org/';
const NUGET_FEED = 'https://api.nuget.org/v3/index.json';
// A github.com host, not a host that merely ends in it (npm.pkg.github.com).
const GITHUB = /(^|[/@:])github\.com[/:]/i;

const SKIP = new Set(['node_modules', '.git', 'bin', 'obj', 'TestResults', '.claude', '.venv', '__pycache__', '.mypy_cache', '.pytest_cache', '.ruff_cache']);
// Conformance fixtures are package content, not build inputs.
const SKIP_DIRS = [join(repo, 'conformance', 'fixtures')];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (SKIP.has(name) || SKIP_DIRS.includes(p)) return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const failures = [];
const fail = (file, message) => failures.push(`${relative(repo, file).split(sep).join('/')}: ${message}`);

// A path is allowed if it stays inside this repository or lands inside an
// open repository checked out beside it.
function pathAllowed(from, target) {
  const dest = resolve(from, target.replace(/\\/g, '/'));
  if (dest === repo || dest.startsWith(repo + sep)) return true;
  const rel = relative(siblings, dest);
  if (rel.startsWith('..')) return false;
  return OPEN_REPOS.has(rel.split(sep)[0]);
}

// owner/repo from a GitHub reference, or null.
function githubRepo(spec) {
  const m = spec.match(/^(?:git\+)?(?:https?|ssh|git):\/\/(?:git@)?github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?(?:[#/].*)?$/i)
    ?? spec.match(/^(?:github:)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:#.*)?$/);
  return m ? { owner: m[1], name: m[2] } : null;
}

const openGithub = (r) => r && r.owner.toLowerCase() === OPEN_ORG && OPEN_REPOS.has(r.name);

// npm --------------------------------------------------------------------

function checkNpmSpec(file, name, spec) {
  if (typeof spec === 'object' && spec !== null) {
    // overrides may nest
    for (const [k, v] of Object.entries(spec)) checkNpmSpec(file, k === '.' ? name : k, v);
    return;
  }
  if (typeof spec !== 'string') return;
  if (spec.startsWith('npm:')) return checkNpmSpec(file, name, spec.slice(spec.lastIndexOf('@') + 1));
  if (spec.startsWith('workspace:')) return;
  if (/^(file|link):/.test(spec)) {
    if (!pathAllowed(dirname(file), spec.replace(/^(file|link):/, ''))) fail(file, `"${name}" uses ${spec}, a path outside this repository and the open MOCA repositories`);
    return;
  }
  if (/^https?:\/\//.test(spec) && !GITHUB.test(spec)) {
    if (!spec.startsWith(NPM_REGISTRY)) fail(file, `"${name}" is fetched from ${spec}, not the public npm registry`);
    return;
  }
  if (/^(git\+|git:|github:|gitlab:|bitbucket:|gist:|ssh:)/.test(spec) || GITHUB.test(spec) || (spec.includes('/') && !spec.includes(':'))) {
    if (!openGithub(githubRepo(spec))) fail(file, `"${name}" comes from git (${spec}); only open MOCA repositories in ${OPEN_ORG} are allowed`);
    return;
  }
  // Anything else is a version range or dist-tag, resolved from the registry.
}

function checkPackageJson(file) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides', 'resolutions']) {
    for (const [name, spec] of Object.entries(pkg[field] ?? {})) checkNpmSpec(file, name, spec);
  }
  const registry = pkg.publishConfig?.registry;
  if (registry && registry.replace(/\/?$/, '/') !== NPM_REGISTRY) fail(file, `publishConfig.registry is ${registry}, not the public npm registry`);
  checkDeclaredImports(file, pkg);
}

// What a published package ships (its "files") must import only built-ins,
// its own files, itself, and packages it declares as runtime dependencies.
const BUILTINS = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));
// Static import and export-from clauses hold only names, braces, commas and *.
const IMPORT = /(?:\b(?:import|export)\s+(?:type\s+)?[\w$*{},\s]*?\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

function checkDeclaredImports(file, pkg) {
  if (pkg.private || !Array.isArray(pkg.files)) return;
  const dir = dirname(file);
  const declared = new Set([pkg.name, ...['dependencies', 'peerDependencies', 'optionalDependencies'].flatMap((f) => Object.keys(pkg[f] ?? {}))]);
  const shipped = pkg.files.map((f) => join(dir, f)).filter((p) => existsSync(p))
    .flatMap((p) => (statSync(p).isDirectory() ? walk(p) : [p]))
    .filter((p) => /\.(c|m)?js$/.test(p));
  for (const source of shipped) {
    for (const [, spec] of readFileSync(source, 'utf8').matchAll(IMPORT)) {
      if (spec.startsWith('.') || spec.startsWith('/') || BUILTINS.has(spec)) continue;
      const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      if (!declared.has(name)) fail(source, `imports "${name}", which ${relative(repo, file).split(sep).join('/')} does not declare as a dependency`);
    }
  }
}

function checkPackageLock(file) {
  const lock = JSON.parse(readFileSync(file, 'utf8'));
  for (const [key, entry] of Object.entries(lock.packages ?? {})) {
    if (key && !key.includes('node_modules/') && !pathAllowed(dirname(file), key)) {
      fail(file, `links ${key}, a path outside this repository and the open MOCA repositories`);
    }
    const resolved = entry.resolved;
    if (!resolved) continue;
    if (entry.link) {
      if (!pathAllowed(dirname(file), resolved)) fail(file, `${key} links ${resolved}, a path outside this repository and the open MOCA repositories`);
    } else if (/^(git\+|git:|ssh:)/.test(resolved) || GITHUB.test(resolved)) {
      if (!openGithub(githubRepo(resolved))) fail(file, `${key} resolves to ${resolved}; only open MOCA repositories in ${OPEN_ORG} are allowed`);
    } else if (/^file:/.test(resolved)) {
      if (!pathAllowed(dirname(file), resolved.slice(5))) fail(file, `${key} resolves to ${resolved}, a path outside this repository and the open MOCA repositories`);
    } else if (!resolved.startsWith(NPM_REGISTRY)) {
      fail(file, `${key} resolves to ${resolved}, not the public npm registry`);
    }
  }
}

function checkNpmrc(file) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(?:@[\w.-]+:)?registry\s*=\s*(\S+)/);
    if (m && m[1].replace(/\/?$/, '/') !== NPM_REGISTRY) fail(file, `line ${i + 1} sets the registry to ${m[1]}, not the public npm registry`);
  });
}

// Python -----------------------------------------------------------------
// pyproject.toml, uv.lock, requirements files and pip/uv configuration. Packages come from PyPI;
// a direct reference (path, git or URL) must be another open MOCA repository. Only the parts of
// TOML that say where packages come from are read, with Node built-ins (no TOML parser).

const PYPI = /^https:\/\/(pypi\.org\/simple|files\.pythonhosted\.org)\/?/;

function checkPythonRequirement(file, spec) {
  // PEP 508: "name[extras] @ <url>" is a direct reference; anything else comes from the index.
  const at = spec.match(/^\s*([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*@\s*(\S+)/);
  if (!at) return;
  const [, name, url] = at;
  if (url.startsWith('file:')) {
    if (!pathAllowed(dirname(file), decodeURIComponent(url.replace(/^file:(\/\/)?/, '')))) fail(file, `"${name}" uses ${url}, a path outside this repository and the open MOCA repositories`);
  } else if (/^git\+|github\.com/.test(url)) {
    if (!openGithub(githubRepo(url.replace(/^git\+/, '').replace(/@[^@/]*$/, '')))) fail(file, `"${name}" comes from git (${url}); only open MOCA repositories in ${OPEN_ORG} are allowed`);
  } else if (!PYPI.test(url)) {
    fail(file, `"${name}" is fetched from ${url}, not PyPI`);
  }
}

function checkPythonSource(file, where, table) {
  const value = (key) => table.match(new RegExp(`\\b${key}\\s*=\\s*"([^"]*)"`))?.[1];
  const path = value('path') ?? value('directory') ?? value('editable') ?? value('virtual');
  const git = value('git');
  const url = value('url') ?? value('registry');
  if (path !== undefined) {
    if (!pathAllowed(dirname(file), path)) fail(file, `${where} uses the path ${path}, outside this repository and the open MOCA repositories`);
  } else if (git !== undefined) {
    if (!openGithub(githubRepo(git.replace(/^git\+/, '').replace(/\?.*$/, '')))) fail(file, `${where} comes from git (${git}); only open MOCA repositories in ${OPEN_ORG} are allowed`);
  } else if (url !== undefined && !PYPI.test(url)) {
    fail(file, `${where} comes from ${url}, not PyPI`);
  }
}

function checkPyproject(file) {
  let section = '';
  let inArray = false;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const header = line.match(/^\s*\[\[?([^\]]+)\]\]?\s*(#.*)?$/);
    if (header) {
      section = header[1].trim();
      inArray = false;
      continue;
    }
    const dependencyTable = section === 'project' || section === 'project.optional-dependencies' || section === 'dependency-groups'
      || section === 'build-system';
    if (dependencyTable) {
      // Strings in dependency arrays: dependencies, requires, extras, groups.
      if (/^\s*[\w.-]+\s*=\s*\[/.test(line)) inArray = section !== 'project' || /^\s*(dependencies|requires)\s*=/.test(line) || section === 'project.optional-dependencies';
      if (inArray) for (const [, s] of line.matchAll(/"([^"]*)"/g)) checkPythonRequirement(file, s);
      if (/\]\s*(#.*)?$/.test(line)) inArray = false;
    } else if (section === 'tool.uv.sources') {
      const entry = line.match(/^\s*([\w.-]+)\s*=\s*(\{.*\}|\[.*\])/);
      if (entry) checkPythonSource(file, `[tool.uv.sources] ${entry[1]}`, entry[2]);
    } else if (section === 'tool.uv.index' || section === 'tool.uv' || section === 'tool.pip') {
      const url = line.match(/^\s*(url|index-url|extra-index-url)\s*=\s*"([^"]*)"/);
      if (url && !PYPI.test(url[2])) fail(file, `${section} adds the index ${url[2]}; only PyPI is allowed`);
    }
  }
}

function checkUvLock(file) {
  let name = '';
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const n = line.match(/^name\s*=\s*"([^"]+)"/);
    if (n) name = n[1];
    const source = line.match(/^source\s*=\s*(\{.*\})/);
    if (source) checkPythonSource(file, `${name}'s source`, source[1]);
  }
}

function checkRequirements(file) {
  readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    const line = raw.replace(/\s+#.*$/, '').trim();
    const index = line.match(/^(?:-i|--index-url|--extra-index-url|-f|--find-links)[ =](\S+)/);
    if (index && !PYPI.test(index[1])) fail(file, `line ${i + 1} adds ${index[1]}; only PyPI is allowed`);
    const editable = line.match(/^(?:-e|--editable)[ =](\S+)/);
    if (editable) checkPythonRequirement(file, `editable @ ${/^[a-z+]+:/.test(editable[1]) ? editable[1] : `file:${editable[1]}`}`);
    else if (/^(git\+|https?:)/.test(line)) checkPythonRequirement(file, `requirement @ ${line}`);
    else if (line && !line.startsWith('-')) checkPythonRequirement(file, line);
  });
}

function checkPipConfig(file) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(index-url|extra-index-url|index_url|extra_index_url|url)\s*[=:]\s*"?([^"\s]+)/);
    if (m && /^https?:/.test(m[2]) && !PYPI.test(m[2])) fail(file, `line ${i + 1} adds the index ${m[2]}; only PyPI is allowed`);
  });
}

// NuGet / MSBuild --------------------------------------------------------

function checkNugetConfig(file) {
  const text = readFileSync(file, 'utf8');
  const sources = text.match(/<packageSources>[\s\S]*?<\/packageSources>/i)?.[0] ?? '';
  for (const [, url] of sources.matchAll(/<add\b[^>]*\bvalue\s*=\s*"([^"]+)"/gi)) {
    if (url !== NUGET_FEED) fail(file, `adds the package source ${url}; only ${NUGET_FEED} is allowed`);
  }
}

function checkMsbuild(file) {
  const text = readFileSync(file, 'utf8');
  for (const [, tag, value] of text.matchAll(/<(RestoreSources|RestoreAdditionalProjectSources)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    for (const source of value.split(';').map((s) => s.trim()).filter(Boolean)) {
      if (source !== NUGET_FEED && !source.startsWith('$(')) fail(file, `${tag} adds ${source}; only ${NUGET_FEED} is allowed`);
    }
  }
  for (const [, tag, path] of text.matchAll(/<(ProjectReference|Import)\b[^>]*\b(?:Include|Project)\s*=\s*"([^"]+)"/gi)) {
    if (path.includes('$(')) continue; // SDK and MSBuild properties
    if (!pathAllowed(dirname(file), path)) fail(file, `${tag} ${path} is outside this repository and the open MOCA repositories`);
  }
}

// GitHub Actions and Dependabot -----------------------------------------

// A sibling repository is checked out at a fixed ref: a release tag, or a
// commit while a Spec Change Proposal is in flight (CONTRIBUTING.md). Never a
// branch, so no repository's CI follows another's main.
const BRANCH_REFS = /^(main|master|develop|HEAD|refs\/heads\/.*)$/;

function checkPinned(file, lines, i, repoRef) {
  // The checkout's other inputs sit at the same indentation, up to the first line indented less.
  const indent = lines[i].search(/\S/);
  const sameBlock = (j) => lines[j].trim() === '' || lines[j].search(/\S/) >= indent;
  let from = i;
  while (from > 0 && sameBlock(from - 1)) from--;
  let to = i;
  while (to < lines.length - 1 && sameBlock(to + 1)) to++;
  const ref = lines.slice(from, to + 1)
    .filter((l) => l.search(/\S/) === indent)
    .map((l) => l.match(/^\s*ref:\s*['"]?([^'"#\s]+)/))
    .find(Boolean)?.[1];
  if (!ref) fail(file, `line ${i + 1} checks out ${repoRef} without a ref; pin a release tag or a commit`);
  else if (BRANCH_REFS.test(ref)) fail(file, `line ${i + 1} checks out ${repoRef} at the branch ${ref}; pin a release tag or a commit`);
}

function checkWorkflow(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // The owner is this repository's own (piandmash now, openmoca after the
    // move) or openmoca; the repository must be an open one.
    const repoRef = line.match(/^\s*(?:-\s*)?repository:\s*['"]?(.+?)['"]?\s*(?:#.*)?$/);
    if (repoRef) {
      const [owner, name] = repoRef[1].replace(/\$\{\{\s*github\.repository_owner\s*\}\}/, '<own>').split('/');
      if (!(owner === '<own>' || owner === OPEN_ORG) || !OPEN_REPOS.has(name)) fail(file, `line ${i + 1} checks out ${repoRef[1]}; only open MOCA repositories are allowed`);
      else checkPinned(file, lines, i, repoRef[1]);
    }
    // Pins kept in the workflow's env (MOCA_SPEC_REF and the like) are held to the same rule.
    const pin = line.match(/^\s*(MOCA_\w+_REF):\s*['"]?([^'"#\s]+)/);
    if (pin && BRANCH_REFS.test(pin[2])) fail(file, `line ${i + 1} sets ${pin[1]} to the branch ${pin[2]}; pin a release tag or a commit`);
    const uses = line.match(/^\s*(?:-\s*)?uses:\s*['"]?([^'"\s#@]+)/);
    if (uses && !uses[1].startsWith('./') && !uses[1].startsWith('docker://')) {
      const [owner, name] = uses[1].split('/');
      if (PRIVATE_ORGS.has(owner.toLowerCase()) || (owner.toLowerCase() === OPEN_ORG && !OPEN_REPOS.has(name))) {
        fail(file, `line ${i + 1} uses ${uses[1]}, which is not public`);
      }
    }
  });
}

function checkDependabot(file) {
  if (/^registries\s*:/m.test(readFileSync(file, 'utf8'))) fail(file, 'declares private registries');
}

// Anything that names a private organisation's repository or package.
function checkPrivateOrgs(file) {
  const text = readFileSync(file, 'utf8');
  for (const org of PRIVATE_ORGS) {
    const m = text.match(new RegExp(`(?:github\\.com[/:]|@|\\b)${org}/[\\w.-]+`, 'i'));
    if (m) fail(file, `refers to ${m[0]}, in the private ${org} organisation`);
  }
}

// ------------------------------------------------------------------------

if (!existsSync(repo)) {
  console.error(`No such directory: ${repo}`);
  process.exit(2);
}

let checked = 0;
for (const file of walk(repo)) {
  const name = basename(file);
  const lower = name.toLowerCase();
  const inWorkflows = file.includes(`${sep}.github${sep}workflows${sep}`);
  const check =
    name === 'package.json' ? checkPackageJson
      : name === 'package-lock.json' || name === 'npm-shrinkwrap.json' ? checkPackageLock
        : name === '.npmrc' ? checkNpmrc
          : lower === 'nuget.config' ? checkNugetConfig
            : /\.(csproj|fsproj|vbproj|props|targets)$/i.test(name) ? checkMsbuild
              : inWorkflows && /\.ya?ml$/.test(name) ? checkWorkflow
                : /^dependabot\.ya?ml$/.test(name) ? checkDependabot
                  : name === 'pyproject.toml' ? checkPyproject
                    : name === 'uv.lock' ? checkUvLock
                      : /^requirements.*\.txt$/.test(name) ? checkRequirements
                        : name === 'uv.toml' || name === 'pip.conf' || name === 'pip.ini' ? checkPipConfig
                          : null;
  if (!check) continue;
  checked++;
  check(file);
  checkPrivateOrgs(file);
}

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`\n${failures.length} dependency problem(s) in ${basename(repo)}.`);
  process.exitCode = 1;
} else {
  console.log(`${basename(repo)}: ${checked} dependency files checked; every dependency is public or another open MOCA repository.`);
}
