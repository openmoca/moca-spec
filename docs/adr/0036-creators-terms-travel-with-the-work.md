# 0036 — The creator's terms travel with the work, and only the rights holder can loosen them

- **Status:** Accepted
- **Date:** 2026-11-16
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Packages now reach people through hosts that answer questions with AI models,
translate, summarise and filter for younger audiences. A creator has no way
to say, with the work, what may be done with it:

- which AI use is acceptable (on the person's device, in the host's own
  service, or with a third-party model provider; training; machine
  translation; whether answers may add the model's general knowledge);
- how suitable the work is (explicit or not, a rating in a named scheme, a
  typical age range);
- who holds the rights, on what basis the package was made, and whether
  others may repackage it.

Podcast feeds already carry some of this (`itunes:explicit`,
`podcast:locked`), and websites can state AI-use preferences (IETF aipref,
RSL, TDMRep), but none of it travels with the content once copied.

Three earlier proposals covered these as three separate blocks, each with
its own precedence rule. They disagreed: under "most specific wins", a
repackager could loosen the rights holder's rule.

The spec already has the parts this needs. Labels that are not locks
(`audience`, [ADR-0016](0016-audience-fails-closed.md); `distribution`,
[ADR-0024](0024-distribution-is-signed-intent.md); `apps`,
[ADR-0026](0026-apps-is-a-hint.md)). Consent that two keys must agree on
(issued copies, [ADR-0028](0028-issued-copies.md)). A gate that runs before
the limit ([Reader contract §9.2](../../spec/moca-reader-contract.md)). Layers
over a package that never change it
([ADR-0008](0008-package-application-organisation-layers.md)).

## Options

### Shape

1. Three blocks (AI use, ratings, rights), each with its own rules.
2. One `terms` block in `moca.json` with three parts, `ai`, `rating` and
   `rights`: one schema, one diagnostics family, one resolution rule, one
   gate step.

### Precedence

1. Most specific wins.
2. Strictest of every level, always.
3. The rights holder decides; every other level, and every more specific
   part of a package, may only make a permission stricter.

### Where per-node values live (inheritance)

1. In each node's frontmatter, inherited from a parent.
2. In `moca.json`, as entries keyed by node path or directory prefix.

## Decision

Shape option 2, precedence option 3, inheritance option 2.

**One block.** `terms` carries two kinds of value. *Permissions* (in
`ai.allowed`, and `rights.repackage.allowed`) are booleans: absent means not
set, otherwise `true` or `false`. *Labels*
(`rating`, and the rest of `rights`) describe. Readers expose the block
exactly as written, with its problems, the package's signed state and an
authority result. They never fill in defaults, and never act on it unless
the host asks for the gate.

**The rights holder decides; everyone else only tightens.**

- A package's permission counts as the rights holder's only when the Reader can tie
  its signature to the rights holder, through keys the host discovered from
  the rights holder's own channel. Otherwise it may only tighten the
  rights holder's published defaults. Authority is worked out from signatures and
  host-supplied keys, never from fields the signer writes.
- **In 0.7.0 no package has the rights holder's authority** (the `owner`
  authority level). Discovering a rights
  holder's keys from their channel, and the rights holder's published defaults, come
  in a later format version. Until then every package's permissions may only
  tighten the platform defaults, and the authority is `packager` or
  `unverified`, from signatures alone.
- Hosts, catalogues and people may tighten, never loosen. A limit set above
  the rights holder is a floor, never a value.
- "Not set" never overrides anything. "Stricter" is defined field by field;
  `false` beats `true`; an empty result means "not allowed".
- Ratings describe rather than permit. Each node keeps its own rating (an
  episode may be clean in an explicit show); the Reader also gives the
  strictest rating across the package, and the gate has a strict-path mode
  that checks a node's, its package's and any composing package's rating.

**Inheritance is by path entries in `moca.json`, not by parents.**

- Node values live in `terms.nodes`, keyed by node path or directory prefix,
  as `issuedCopies.paths` are. The longest matching prefix applies; a node
  with no entry has the package's values.
- There is no inheritance through `index.md`, through structure, or through
  any other file: a node's terms are found in one place, the manifest.
- Translations share their node's terms. A `moca.*` key in frontmatter that
  looks like a term has no effect.
- A node entry may only tighten a permission. A looser entry is reported,
  and the package's value stands.
- A composing package tightens a member's terms only when its signers speak
  for the member, as for `upTo` ([ADR-0030](0030-series-bind-members-by-composition.md));
  it never loosens them.

This differs from audience ([ADR-0016](0016-audience-fails-closed.md)), which
rejected a package-level default because a mistake in it leaks a whole
package. Terms have a package level because a permission set there can only
be tightened below it, never loosened. A mistake in the default does not
open what a node closed. Malformed values are warnings, not `M002`; under the
gate a malformed permission is the strictest value, so it fails closed, as
audience does.

Issued copies never change `moca.json`, so they cannot change terms
([ADR-0028](0028-issued-copies.md)). An issued copy is not a repackaging.

**Admission (ADR-0001).** The maintainer admits the `terms` block into 0.7.0
as a stated exception to the [ADR-0001](0001-three-pillars-and-admission-test.md)
admission test, which asks for two use cases, at least one real and named.
At the time of this decision one implementer needs it. The maintainer's
reasons:

- **The cases are real and recurring.** They come from creators: a podcaster
  who will let listeners ask questions with the AI on their own device but not
  send episodes to large cloud providers; a publisher who wants answers drawn
  from the work only; families and schools who need to filter before playing
  or answering; a show packaged by someone other than its creator, under
  the creator's open licence, where who owns it and who packaged it must be
  told apart; feeds that already ask not to be imported elsewhere
  (`podcast:locked`).
- **The signals already exist and are lost on copying.** `itunes:explicit`,
  `podcast:locked`, schema.org `contentRating` and `typicalAgeRange`, and the
  AI-preference vocabularies all exist. A package that drops them on the way
  to an AI host loses the creator's statement.
- **It cannot live in an application.** Terms must travel with copies of the
  work and be checked by any Reader, so they belong in the Package and the
  Reader. A profile cannot add top-level manifest keys
  ([package spec §9](../../spec/moca-package-spec.md)).
- **It reuses what the spec has.** The gate, the labels-not-locks rule, the
  two-key consent pattern and layers over packages.

The exception is bounded: if no second implementer or adopter uses a part of
`terms` by the 1.0 release, that part is reconsidered under the normal test.
ADR-0001 itself is not changed.

## Consequences

- One field table, one set of `U` diagnostics, one resolution rule and one
  gate step to implement and test, instead of three.
- A worked conflict table becomes the conformance cases: a repackager, a
  catalogue, a node or a composing package trying to loosen the rights holder's terms
  must fail.
- Readers gain host inputs (host limits and the gate request in 0.7.0;
  discovered keys and the publisher's signed defaults later) and result fields (resolved terms,
  the level that decided each, the authority).
- A package's terms are no stronger than the host that reads them. Labels are
  not locks: an open format cannot stop a host that has opened a package
  from ignoring them ([package spec §13](../../spec/moca-package-spec.md)).
  Encryption limits which hosts can open a package; it does not make a host
  that opened it keep the terms.
- 0.6 Readers report `terms` as an unknown key and never expose it.
- The admission exception is visible here, and has an end date.

## What would change this decision

- Evidence that creators need to loosen terms below their own defaults at a
  level other than the package (for example per catalogue).
- A second implementer who needs the parts drawn differently.
- No second adopter for a part of `terms` by 1.0 (see Admission).
