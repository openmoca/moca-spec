# Choosing a conformance level

Most packages should be Level 1. This page exists so you can establish that
quickly instead of reading 900 lines of specification to find out.

## The short answer

```text
Do you need formal ontologies, SHACL validation, or claims as RDF triples?
│
├── No ──▶ Do you ship skills/, or need signed provenance
│         and precise multi-modal evidence locators?
│         │
│         ├── No ──▶ LEVEL 1        ← almost certainly you
│         └── Yes ─▶ LEVEL 3
│
└── Yes ─▶ LEVEL 2 (or 3 if you also need signatures)
```

Level is **derived, never declared**. There is no field for it; a consumer
works it out from what is present and what validates
([core §3](../../spec/moca-core-spec.md#3-conformance-levels)). You cannot
claim a level — you either meet its requirements or you don't.

## Level 1 — MOCA Core

**What it requires:** a valid `moca.json` with `id`, `version`, `title`, plus
either at least one CommonMark file under `content/` or a `composition` block
referencing another package.

**What you can still use:** everything optional in core — frontmatter, node
identity, concept bindings, epistemic status, evidence, lifecycle fields
(`validFrom`, `lastReviewed`, `supersedes`), integrity digests,
`canonicalDigest`, composition, profiles, vendor extensions. None of these
raise the level.

**Choose it when:** you want portable, grounded, versioned content that any
consumer can read with JSON and Markdown tooling. This covers support
knowledge bases, policy corpora, engineering documentation, and most course
material.

**Informal rungs within Level 1** — these are descriptive, not conformance
levels:

| Rung | Shape | Example |
|---|---|---|
| **bare** | Manifest + plain Markdown, no frontmatter | [level-1-bare](../../examples/level-1-bare) |
| **identified** | Adds frontmatter `id` and `title` | — |
| **grounded** | Adds `concepts`, `epistemicStatus`, `summary`, evidence | [level-1-minimal](../../examples/level-1-minimal) |

Converted output from [`moca-convert`](../../tools/moca-convert/README.md)
lands at bare or identified; enrich by hand afterwards if you want grounding.

## Level 2 — MOCA Semantic

**What it adds:** formal ontologies under `ontologies/` (RDF, SKOS, or OWL),
SHACL shape validation, `claims` interpretable as RDF triples, and
`claims[].provenance` resolving against concrete PROV-O predicates.

**Choose it when** at least one of these is true:

- You need to *reason* over the concept graph, not just retrieve text —
  inference, transitive relationships, SPARQL.
- You must validate content against a formal shape (a compliance obligation,
  or a large multi-author corpus where "valid" needs a machine definition).
- You are interoperating with an existing RDF/semantic-web estate.
- Claim-level provenance has to survive into a downstream provenance store.

**Don't choose it because** it sounds more rigorous. Level 2 commits you to
maintaining ontologies, and an ontology nobody maintains is worse than no
ontology — `moca-lint` will warn about concepts that resolve to nothing, and
the corpus quietly rots.

**Example:** [level-2-semantic](../../examples/level-2-semantic)

## Level 3 — MOCA Extended

**What it adds:** W3C Web Annotation selectors for precise multi-modal
locators (a page, a time range, a text quote), cryptographic digests, and
digital signatures.

**Choose it when:**

- **You ship `skills/`.** This is not optional. Any package containing
  `skills/` MUST meet Level 3 signature requirements regardless of what it
  otherwise satisfies ([core §3.1](../../spec/moca-core-spec.md#31-level-requirement-clarification)),
  because executable-adjacent content is the highest-risk artifact in a
  package. A harness must refuse unsigned skills.
- You need to prove the bytes a consumer holds are the bytes you published.
- You cite into video, audio, or precise regions of documents.
- You distribute across a trust boundary — between organisations, or into a
  regulated environment.

**Example:** [level-3-extended](../../examples/level-3-extended)

**Cost to be aware of:** signing binds to `canonicalDigest`, which covers the
manifest. Any manifest edit — even `license` — invalidates the signature and
requires re-signing. See
[trust model §2.1](../../spec/moca-trust-model.md#21-any-manifest-edit-is-a-re-signing-event)
and plan for automation.

## Common mistakes

**Adding ontologies "for later".** A declared but unmaintained ontology
produces warnings and misleads consumers into expecting a graph that isn't
real. Add it when you use it.

**Assuming higher is better.** A well-maintained Level 1 corpus with accurate
`lastReviewed` dates and honest `epistemicStatus` is more useful to a harness
than a Level 2 corpus with a stale ontology.

**Treating levels as a migration ladder.** They are capability sets, not
maturity stages. Plenty of packages should stay at Level 1 permanently.

**Putting `skills/` in an unsigned package.** `moca-lint` reports `E401`, and
a conformant harness will refuse the skills. Sign it or don't ship it.

## Upgrading later

Every level is additive, so upgrading is adding files, not restructuring:

- **1 → 2:** add `ontologies/`, add `@context`, make concept CURIEs resolve.
- **2 → 3:** add Web Annotation locators to evidence; run
  [`moca-sign`](../../tools/moca-sign/README.md).

Existing consumers keep working throughout, because they derive the level from
what they find.
