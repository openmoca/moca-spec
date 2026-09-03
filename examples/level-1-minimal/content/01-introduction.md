---
id: urn:node:introduction
title: Introduction
concepts:
  - id: ex:Introduction
    role: primary
epistemicStatus: sourced
summary: "Introductory node demonstrating Level 1 grounded content."
---
# Introduction

This is a minimal grounded knowledge node. It is bound to the `ex:Introduction`
concept via the `concepts` frontmatter field, and is parseable with standard
JSON + Markdown tooling only — no JSON-LD or ontology processing is required
at Level 1 (see [core §3](../../../moca-core-spec.md#3-conformance-levels)).

A harness ingesting this package can ground a conversation in this content
purely from the frontmatter and Markdown body, without resolving `ex:` to
any external ontology.
