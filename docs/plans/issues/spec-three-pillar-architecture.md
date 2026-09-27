# Draft: `[Spec] Three-pillar architecture and Reader/Producer SDK classes`

**Template:** Spec change proposal · **Labels:** `spec-change`
**Decisions:** [ADR-0002](../../adr/0002-three-pillar-architecture.md),
[ADR-0003](../../adr/0003-knowledge-harness-implementations.md)
**Paste everything below the rule.**

---

## Affected section(s)

- `spec/moca-core-spec.md` §1.1 — architecture model, rewritten from three
  layers to three pillars plus the host
- `spec/moca-core-spec.md` §4.2, §5.2, §6.3, §6.4, §7.1, §7.2, §7.5, §8.2, §9,
  §10.2, §10.4, §11.2 — "a harness" attributed to the Knowledge Harness, the
  AI Harness, or any consumer
- `spec/moca-sdk-contract.md` §1.1, new §1.2, §2, new §2.2, §4.3, new §7.4,
  new §10.1, §11, §13, §14 — Reader and Producer conformance classes
- `spec/moca-trust-model.md` §1, §4, §7 and `spec/moca-sidecar-index-spec.md`
  §6 — the same layer attribution

## Problem

Core §1.1 described a single "AI Harness" layer that owned both retrieval and
use-case behaviour. Normative rules said "a harness MUST …" without saying
which job they bind. Resolving locales and refusing unsigned skills are the
same for every consumer. Arbitrating `conflictsWith` or filtering
`allowed-tools` belongs to one product. Implementers could not tell which
rules a shared library must enforce and which are left to the application.

The SDK contract also required every SDK to create manifests (§4.3), so a
library that only reads and searches packages still had to implement
authoring.

## Proposed change

1. Replace §1.1 with the three-pillar model: MOCA Package, Knowledge Harness
   and AI Harness, with the host application above them. State that the
   specification defines no retrieval engine.
2. Attribute each "harness" requirement to a layer. Package-reading rules
   (locale fallback, concept disambiguation at load, the `skills/` refusal in
   §8.2, composition resolution) bind the **Knowledge Harness**. Policy rules
   (epistemic-status precedence, lifecycle-based down-ranking, `conflictsWith`
   arbitration, `allowed-tools` filtering) bind the **AI Harness**. Rules any
   reader must follow (node identity from path, localized display values,
   graceful degradation of unknown profiles) bind **a consumer**.
3. Add to §8.2: an AI Harness MUST NOT execute skills a Knowledge Harness has
   withheld.
4. Split the SDK contract into a **Reader** class (the existing eight
   capabilities, without manifest creation) and a **Producer** class (Reader,
   plus manifest creation, integrity production and archive writing, with
   optional signing and sidecar building). A conformance claim MUST name its
   class.

No RFC 2119 requirement is removed. Manifest creation moves from "every SDK"
to "every Producer", which relaxes the contract for Readers.

## Impact on existing conformance levels / profiles

None. No package that is valid today becomes invalid, and no schema changes.
All existing conformance cases are Reader-class, so every current case still
applies unchanged. Recorded in `MIGRATIONS.md` because contract §13 treats any
change to required SDK behaviour as breaking for implementers.

## Alternatives considered

Keeping the three-layer model, or specifying retrieval in core. Both were
rejected in ADR-0002.
