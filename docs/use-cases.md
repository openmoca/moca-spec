# Use cases

MOCA pays off when knowledge has to keep its **structure and its sources**
wherever it is read, or when it **crosses a boundary**: between organisations,
between teams, or between the people who own it and the systems that serve
it. Inside one team, with one pipeline and no one asking where an answer came
from, plain OKF is usually enough.

The use cases below are listed at the same depth on purpose. MOCA is neutral
between domains, and none of them is special to the standard.

## Manuals and standard operating procedures

A technician needs the current procedure, in the right order, often with no
connection.

- **Structure** holds the assembly tree (`dcterms:hasPart`), the steps in
  order (`skos:OrderedCollection`), and the checks that must come first
  (`dcterms:requires`). The Reader answers "what must happen before step 5?"
- **Search limited to a scope** keeps answers to the system being repaired.
- A `.moca` file with a **sidecar index** runs on a laptop or tablet with no
  model server and no network, and `supersedes` stops a withdrawn procedure
  being used. See [`examples/handbook`](../examples/handbook).

## Legal and regulatory corpora

"Which clause applies, and what does it depend on?" has one right answer.

- **Structure** holds the article and clause tree, cross-references
  (`dcterms:requires`), and amendments (`dcterms:replaces`).
- Each version is a package with a **validity window**; the default retrieval
  policy leaves out versions that are not in force, and `supersedes` retires
  them without deleting them. See [`examples/policy-corpus`](../examples/policy-corpus).
- **Evidence** points at the exact clause in the original text, and is
  `matched` against it.

## Clinical guidelines

A guideline is a pathway: tests before treatments, conditions and subtypes.

- **Structure** holds the conditions (`skos:broader`), the pathway stages in
  order, and what each stage requires.
- **Originals** travel inside the package, so every citation can be checked
  against the source guideline.
- MOCA grounds an assistant over the guideline. It does not replace clinical
  decision-support standards, and structure narrows what is retrieved, not
  what a model says.

## Onboarding

A new starter should meet foundations before advanced material.

- **Structure** holds skill areas, the learning path, and foundations as
  `requires`.
- An application's overlay can add the organisation's own rules, for example
  a compliance module required before system access, without changing the
  package ([ADR-0013](adr/0013-package-application-organisation-layers.md)).
- **Review attestations** show which pages a named owner has checked.

## Courses and training

A course has modules, a sequence and prerequisites.

- **Structure** holds modules as parts, lessons in order, and prerequisites
  as `requires`.
- **Evidence** can point at a time range in a lecture (Media Fragments), with
  the WebVTT captions carried in the package so the citation can be checked.
- An application's vocabulary, such as learning objectives, travels as an
  overlay or extra vocabulary, never as part of the standard.

## Recorded talks and video series

A talk or a series of videos is knowledge locked in speech.

- Each video is a node holding its description and a transcript from its
  captions; the video itself stays where it is published, as the node's
  `resource`.
- **Evidence** cites chapters as time ranges, and the WebVTT captions travel
  under `media/`, so every range is checked without a network.
- **Structure** keeps a series in order (`skos:OrderedCollection`).
- See [`examples/youtube`](../examples/youtube), built with `moca-youtube`.

## Vendor documentation shipped to customers

A software vendor publishes product knowledge that customers load into their
own assistants.

- The customer verifies the **publisher attestation** before loading.
- Each release is a new **version**; the new package `supersedes` the old, so
  customers' assistants stop quoting last year's behaviour.
- **Evidence** points at the exact paragraph of the release notes.

## Customer support knowledge

Support answers drift, and get rewritten by AI drafting tools.

- OKF `generated` marks drafted content; a support lead's **review
  attestation** marks what a person actually checked.
- `stale_after` forces re-review; `audience: internal` keeps agent-only
  procedures out of the public assistant.
- See [`examples/support-kb`](../examples/support-kb).

## Regulated systems

An organisation must show which knowledge its assistant used and where it
came from.

- Record the **versioned node reference** and the **package digest** with
  every answer: they name the exact content.
- Keep the originals under `sources/`, so each citation can be matched
  against its source. For dataset-level governance records, link an SPDX 3.0
  Dataset or Croissant document; risk classification stays with the AI
  system, not the package.

## Small grounded projects

A package can be just a manifest and a folder of Markdown, with no structure
and no signatures. That is enough to move a grounded chat project from one
assistant app to another.

## Where MOCA is a poor fit

- **Live operational data** such as tickets, stock levels or metrics. Query the
  system of record.
- **One team, one pipeline, no one asking where an answer came from.** Use OKF
  on its own.
- **Anything that needs configuration to travel with content.** Packages never
  configure their readers.
