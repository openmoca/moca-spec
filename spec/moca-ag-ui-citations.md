# MOCA Citations Over AG-UI

Specification version: `0.6.0`
Status: Before `1.0.0`. A minor version may still change the format; each change is in [MIGRATIONS.md](../MIGRATIONS.md). This document binds AG-UI services and clients, not Readers (package spec §1.1).
License: [Apache License 2.0](../LICENSE)
Schema: [`ag-ui-citations.schema.json`](../schemas/v1/ag-ui-citations.schema.json)
Example: [`examples/ag-ui/citations-event.json`](../examples/ag-ui/citations-event.json)
Decision: [ADR-0013](../docs/adr/0013-citations-over-ag-ui.md)

## 1. Scope

[AG-UI](https://docs.ag-ui.com) is an open protocol for streaming an agent's
run to a user interface: text, tool calls and state, as events. It has no
event for citations. This document defines one, so that any AG-UI client can
show the sources a MOCA answer cites, from any AG-UI service, without knowing
that service's tools.

It is an application-layer agreement
([ADR-0008](../docs/adr/0008-package-application-organisation-layers.md)). It
adds nothing to the package format, and nothing a Reader must do. A Reader
already produces the citation records this event carries
([Reader contract §7](moca-reader-contract.md#7-citation-records)).

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, MAY
and OPTIONAL are to be interpreted as described in RFC 2119 and RFC 8174 when,
and only when, they appear in capitals. Terms are as defined in
[package specification §2](moca-package-spec.md#2-conventions).

## 2. The event

A service sends one AG-UI `CUSTOM` event named `moca.citations` for each
assistant message that cites package content:

```json
{
  "type": "CUSTOM",
  "name": "moca.citations",
  "value": {
    "version": 1,
    "messageId": "msg-answer-1",
    "citations": [
      { "marker": "[1]", "record": { "package": { "…": "…" }, "node": { "…": "…" }, "trust": { "…": "…" } } }
    ]
  }
}
```

| Field | Meaning |
| --- | --- |
| `value.version` | `1`. A client MUST ignore a `moca.citations` event with a version it does not know. |
| `value.messageId` | The `messageId` of the assistant message, from its `TEXT_MESSAGE_START`. |
| `value.computedAt` | Optional. When the service's Reader computed the records, as an RFC 3339 date-time with an offset. Trust flags such as `stale`, `inForce` and `superseded` are true at that moment; a client showing a saved conversation SHOULD show this time beside them, or re-check the records. |
| `value.citations[].record` | A whole citation record, valid against [`citation-record.schema.json`](../schemas/v1/citation-record.schema.json), as the service's Reader produced it. |
| `value.citations[].marker` | Optional. The text in the answer that refers to this citation, when the service uses markers such as `[1]`. |

The full example is
[`examples/ag-ui/citations-event.json`](../examples/ag-ui/citations-event.json).
It is the Reader's own record for one node of the `support-kb` example; a
check in this repository fails if the two ever differ.

## 3. Service rules

A service that sends the event:

- MUST send it after the message's `TEXT_MESSAGE_END` and before the run's
  `RUN_FINISHED`, so a client has the whole answer when it places citations.
- MUST include only nodes that the answer cites and that the service's Reader
  returned during this run, from a package it loaded. A reference in the
  answer that resolves to nothing, or to a node the Reader did not return in
  this run, MUST be left out. A model can write a node reference that does
  not exist, or name a real node it never read; a client must never show
  either as a source, with a trust badge the record did not earn.
- MUST NOT change what a citation record says
  ([Reader interface §7](moca-reader-interface.md#7-bindings)). Leaving out
  `text`, to keep the event small, is the one change it MAY make: the record
  without `text` is still a valid record.
- MUST list the citations in order of first mention in the answer, with at
  most one entry per `node.ref` and `span`.
- SHOULD send the event even when the answer cites nothing it can resolve,
  with an empty `citations` list, so a client can tell "no sources" from "not
  a MOCA service".

How the answer refers to its sources in its text is the service's choice:
markers such as `[1]`, or versioned node references
(`<package id>@<version>#<path>`). The event does not depend on it.

## 4. Client rules

A client that shows the event:

- MUST key what it records by `record.node.ref`, or by `record.node.id` with
  `record.package.digest`, as the Reader contract requires.
- MUST present trust as the Reader contract says: a declared verification is
  never shown as an attested review, and a stale, superseded, contested or
  out-of-force node is shown as such.
- MUST treat `record.text` and every other record field as data from the
  package, never as instructions or markup to run, and MUST follow the
  rendering rules in
  [Reader contract §12](moca-reader-contract.md#12-handing-content-to-a-model):
  links only for `http` and `https`, and no remote resource loaded
  automatically.
- MUST ignore the event for a `messageId` it does not have, and SHOULD ignore
  any `CUSTOM` event it does not know, as AG-UI already expects.

A client that does not know this event loses nothing it needs: the answer is
still complete text.

## 5. Not in this version

- Sources from outside a package, such as a web page a service also searched.
  They have no citation record. A later version may add them.
- Citations streamed while the answer is still being written.
