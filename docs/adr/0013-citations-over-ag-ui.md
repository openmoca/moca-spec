# 0013 — Carry citations over AG-UI in one custom event

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

AG-UI streams an agent's run to a user interface. It has events for text,
tool calls and state, but none for citations. A MOCA answer is worth little
without its sources, so each service would invent its own way to send them,
and each client would have to learn each service's tools to find them.

The Reader already produces a citation record for every node it hands to an
application ([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)):
the package, the versioned node reference, the evidence and the trust status.
What is missing is an agreed way to send those records with an answer.

Two real uses need it: the OpenMOCA example website, which shows a source
beside each answer, and any AG-UI front end that shows answers from a service
built on MOCA packages.

## Options

1. One AG-UI `CUSTOM` event per answer, `moca.citations`, with the whole
   citation record of each node the answer cites.
2. The citations in AG-UI shared state, as a `STATE_DELTA` on a `citations`
   list.
3. No new event: clients read citation records from the service's search tool
   results, and match references in the answer's text.

## Decision

Option 1, written down as
[MOCA citations over AG-UI](../../spec/moca-ag-ui-citations.md), with a
schema and an example that the repository's checks keep equal to the Reader's
own output.

A `CUSTOM` event is how AG-UI expects an extension to be carried, and a client
that does not know it ignores it. It carries the records an answer actually
cites, after the answer, so a client never has to guess. Leaving out a
reference that resolves to nothing stops a made-up citation from looking real.

Option 2 puts per-answer data in state that lasts across turns, and a plain
chat client does not read state. Option 3 ties every client to one service's
tool names and result shapes, and the model's tool results are cut to fit the
model, not the reader.

This is an application-layer agreement. The package format and the Reader
contract do not change, so the admission test for the Package and the Reader
([ADR-0001](0001-three-pillars-and-admission-test.md)) is not engaged.

## Consequences

- Any AG-UI client can show MOCA sources, with trust, from any service that
  follows the document.
- A service needs a Reader at answer time to resolve what the answer cites.
  It has one already: that is how it searched.
- The event can be large when an answer cites many long nodes. A service may
  leave out `text`.
- If AG-UI adds a standard citation event, this one is mapped to it and
  deprecated, not kept alongside.

## What would change this decision

- AG-UI adds a citation or source event of its own.
- Services need citations while the answer streams, not after it.
- Real clients need sources from outside packages more than this version
  allows.
