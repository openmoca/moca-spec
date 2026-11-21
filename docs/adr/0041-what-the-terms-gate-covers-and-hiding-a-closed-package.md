# 0041 — What the terms gate covers, and hiding a closed package

- **Status:** Accepted (owner, 2026-11-21)
- **Date:** 2026-11-21
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

[ADR-0036](0036-creators-terms-travel-with-the-work.md) put the creator's
terms in the manifest, and the Reader contract defined a terms gate
([§15.4](../../spec/moca-reader-contract.md#154-the-terms-gate)). The gate
was defined only for the records a search returns. Other text reaches a
model too:

- **Structure.** Contract §12 counts structure labels and definitions as
  package-supplied text, and says a hand-off to a model applies the terms
  gate to "what it hands on". But the structure operations (§10) are the
  same for everyone, and nothing said how to gate a label.
- **Embedding.** §15.4 names embedding and indexing as uses that send
  content to a model. A store backend embeds every unit at ingest (§9.3), and
  ingest had no way to carry a terms request. Text a creator closed to a
  provider could reach a provider's embedder, and sit in the host's store,
  before any search ran its gate.
- **The catalogue.** A server that lists packages to a model hands on titles,
  descriptions and the manifest. Nothing said what a model may be told about
  a package it may not read.

The OpenMOCA Commitment already promises the wider reading: "If a creator
says their work may not be used by a certain kind of AI, the app does not
send it there" ([COMMITMENT.md](../../COMMITMENT.md)).

There is a second need. Telling a model "this work exists, but you may not
read it" is useful: the model can tell the person why it cannot answer. For
some work, though, the title itself is the sensitive part (a course called
"Redundancy consultation 2027"). A creator had no way to say "a model that
may not read this should not be told it exists".

Format changes after 0.7.0 are frozen for six months, so a new term goes in
now or not for some time.

## Options

1. **Gate everything a Reader hands to a model, and add one term,
   `ai.allowed.mention`, at package level.** Define when a package is closed
   for a request; build structure only from packages that are not; gate
   ingest; and set a catalogue rule for what may be said about a closed
   package.
2. **Gate everything, with no new term.** A closed package is always named
   to the model. Simple, but a creator with a sensitive title can only leave
   the platform.
3. **Gate everything, and never name a closed package.** Simple, but the
   person is never told why the assistant cannot answer from work they can
   see in the app, and the Commitment's "when something is left out, the app
   tells you why" weakens for every creator, not only those who ask.
4. **Gate records only, and leave the rest to each host.** Each host would
   find the other channels one at a time, and the Readers would disagree.

## Decision

Option 1. The rules, each written into the specification:

1. **Coverage.** Everything a Reader hands to a model goes through the terms
   gate: records; structure labels and definitions; text sent for embedding
   or indexing; and catalogue information under the catalogue rule (point
   4). Contract §15.4, with capitals where §12 already has them.
2. **Closed for a request.** A package is closed for a request when its
   package-level resolved terms (platform, package, composite and host; not
   node) fail the `ai` gate for the request's destination and conditions,
   including `providerRequires`. A use (`train`, `translate`) closes the
   action, not the package: a package that may not be translated is still
   open for answering.
3. **A new term, `ai.allowed.mention`** (boolean, platform default `true`):
   "Whether a model that may not receive this work may be told the work
   exists." A package that is closed for a request and whose resolved
   `mention` is `false` is **hidden** for it.
   - It is set at package level only in 0.7.0. In a `nodes` entry it is
     `U003_TERMS_UNKNOWN_VALUE` and has no effect. Labels and definitions
     belong to the package's concepts, not to nodes, so there was nothing a
     node-level value could hide. Adding it later is not a breaking change.
   - It resolves exactly as contract §15.3 says for every `allowed.*`
     field: the stricter value (`false`) applies whatever its authority. So
     an unsigned package's `mention: false` hides it. Authority only matters
     for loosening, which nothing can do in this version. A composing
     package can hide a member only when its signers speak for it, as for
     every other term ([ADR-0040](0040-ids-bind-a-signer-to-package-ids.md)).
     A host limit of `false` hides every closed package.
   - Malformed values fail closed: `"mention": "no"` hides the package, and
     a malformed container (`"allowed": false`, `"ai": "none"`) closes it
     for every destination **and** hides it.
   - It concerns models only. It never changes what a host shows people.
   - It changes nothing while the destination is allowed.
4. **The catalogue rule.** For a package closed for the request and not
   hidden, a Reader hands on exactly: `id`, `version`, `title`, the
   publisher's name, `signed` and `closedBy` (the gate's reason field
   names, never free text). Nothing else: not the description, tags,
   contributors or the rest of the manifest. Title and publisher are
   package-supplied text, under §12's envelope rules. `signed` goes with the
   publisher because an unsigned package can claim any publisher. The rule
   applies only after the audience set, the default retrieval policy and the
   rating gate: a package outside the audience, or whose own rating the
   request's rating gate removes, gets no entry at all. No placeholder such
   as "title unavailable": an entry would itself say the package exists. A
   hidden package gets no entry.
5. **Structure is gated by the merge.** For a request with terms, the merged
   structure is built only from the packages not closed for it, plus the
   host's overlays. Contract §10's "answered identically" stays true: the
   same operations over a smaller library.
6. **Ingest takes a terms request** (`{ destination, conditions }`, with the
   use `embed`) in the Reader interface. Units the gate removes are not sent
   to the embedder or written to the store, and are counted in `U004` on the
   ingest. With no request, ingest is as before, as search is. A
   model-facing binding always passes one, defaulting to `provider`. The
   host names the embedder's destination; the store is the host's own
   storage, as its other storage is. `moca-embed` builds sidecars on the
   user's machine (`device`), so the question does not arise there.
7. **The Commitment.** An app's own interface still tells a person why
   something was left out; `mention` never touches it. A host whose only
   voice is a model may say that something was left out, with no name, no
   count and no reason; nothing more.
8. **Nothing names a hidden package**, as one list in contract §15.4:
   - for a hidden package, the answer is exactly the not-found answer;
   - counts and notes handed to a model exclude hidden packages. `U004`
     stays complete for the host, and gains a `hidden` count;
   - lists leave hidden packages out before paging, with no total that
     counts them;
   - `supersededBy` and `contestedBy` omit ids of hidden packages
     (`superseded: true` stays);
   - an open composite's entry omits hidden members;
   - findings about a closed or hidden package are not handed to a model.

   Accepted, and said: concept IRIs that other packages use (an IRI is an
   identifier another package chose to use; labels are gated); lexical
   scores (computed over every loaded package, with no identity in them);
   and earlier versions that were open (terms belong to a version).
9. **Content embedded before 0.7.0** may include closed text. MIGRATIONS
   tells hosts to re-ingest with a terms request, or to remove the closed
   packages' records.

**The default is `true`, and that is a choice.** By default the platform
sends the title of a closed work to the model the creator closed it to. It
does so because of the Commitment's "when something is left out, the app
tells you why": for most creators (a podcast network, a publisher) the
title is public already, and "this show does not allow this assistant" is
better than silence. A creator whose title is itself sensitive sets
`mention: false`, and the audience gate protects work meant for one
organisation before `mention` is reached.

**How we will know it works.** The conformance corpus has a case for each
rule a Reader implements: the field and its resolution (`terms-mention-*`,
`search-terms-mention-*`), the hidden count and relation ids
(`search-terms-hidden-count`, `search-terms-superseded-by-hidden`), ingest
(`search-store-ingest-*`), structure (`structure-terms-*`) and the catalogue
(`catalogue-terms-*`, a new case kind). Every case passes in the reference
Reader before release. A model-facing server shows in its own tests that a
hidden package's id and title appear in no tool answer, resource, note or
error, and that an ingest for `provider` sends a recording embedder no text
from a closed package.

## Consequences

- A host that hands content to a model has one rule for everything it hands
  on, not a rule for records and silence for the rest.
- Readers gain a catalogue operation, a structure built for a terms request,
  ingest with a terms request, and a `hidden` count in `U004`. The runner
  gains `options.ingestTerms`, `options.terms` on structure cases, and the
  `catalogue` case kind.
- A creator can keep a sensitive title away from a model it closed. It
  cannot stop a model that already knows the work, and it does nothing while
  the destination is allowed. The guide says so.
- A package with a malformed `ai.allowed` now disappears from a model's view
  with no notice to the person through that model. That is consistent with
  failing closed; `moca-lint` reports `U001` for it.
- A host that ingested before 0.7.0 has to re-ingest or remove closed
  records to keep the promise.

## What would change this decision

- Creators ask to hide parts of a package (a chapter, an episode). That
  needs node-level `mention`, with a defined meaning for concepts, in a
  later minor version.
- Owner authority arrives (ADR-0036). A rights holder might then loosen
  `mention` for a destination, which would need its own rule.
- Evidence that hosts misread "say something was left out" as a licence to
  name works. The rule would then move from the Commitment into a tested
  requirement on bindings.
