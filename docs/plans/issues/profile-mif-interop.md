# Draft: `[Profile] MIF (Modeled Information Format) interoperability`

**Template:** Profile proposal · **Labels:** `profile-proposal`
**Plan:** `docs/plans/03-mif-interoperability.md`
**Depends on:** the OKF conformance `[Spec]` issue — the mapping's spine is
`conceptType` → node `type`, which does not exist until then.
**Paste everything below the rule.**

---

## Domain

Interoperability with MIF (Modeled Information Format,
`modeled-information-format/MIF`), currently v1.3.0. MIF describes itself as
"the opinionated, OKF-compliant content model that fills OKF's deliberately
empty envelope": entity types, typed relationships, bi-temporal validity, and
trust/provenance fields.

The goal is a working two-way mapping plus a converter, so a MIF bundle can be
carried in a MOCA package without loss of the fields MOCA can represent, and
returned to MIF afterwards. This is an interoperability profile, not an
endorsement of MIF's content model and not a step toward adopting it.

**Nomenclature warning for reviewers:** MIF defines its own Levels 1/2/3
(Core / Standard / Full). These are **not** MOCA's conformance levels. The
collision is purely nominal and the profile document must say so in its opening
paragraph.

## Why existing profiles don't cover this

Neither shipped profile is about format interoperability — education is a
learning-content domain profile, EU AI Act is a compliance classification
profile. Nothing in the repository addresses carrying another format's model.

MOCA Core cannot express three of MIF's constructs on its own:

1. **Bi-temporal validity.** MIF's `temporal` records both when a fact was
   recorded and when it was true. Core's §7.5 `validFrom` and `lastReviewed`
   are single-axis. There is no lossless core mapping — this is a genuine
   expressiveness gap, not a mapping preference.
2. **`sourceType` and `trustLevel`.** MIF's provenance classification has no
   core equivalent; the closest are OKF's `sources[]` and `verified`, which
   carry different information.
3. **Entity-type classification** — `aliases`, exemplars, negative examples —
   which Core deliberately does not model.

These belong in `profileData.mif` rather than in Core, and the profile is the
mechanism for exactly that.

## Proposed additions

- **New ontology roles** (namespaced, e.g. `mydomain:taxonomy`): none
  initially. MIF's `ontology` field may warrant a `mif:ontology` role later;
  deferring until the converter shows whether it is used in practice.
- **Extended epistemic-status values**: none. MIF's `trustLevel` is a distinct
  axis and maps to `profileData.mif`, not to `epistemicStatus` — conflating
  them would misrepresent both.
- **New `profileData.mif` fields:**
  - `mifVersion` — the MIF specification version this package was converted
    from or targets. Follows §11.5's `regulationVersion` recommendation.
  - `temporal` — bi-temporal validity: recorded-at and valid-from/valid-to.
  - `provenance` — `sourceType`, `trustLevel`.
  - `conceptType` — retained verbatim alongside the OKF `type` it maps to, so
    export can reproduce MIF's spelling exactly.
  - `entityClassification` — `aliases` and related fields, if the converter
    finds them used.
- **Expected `augmentation.targetType` values**: `mif-bundle`, and
  `mif-corpus-json` for MIF 1.3.0's Container Profile envelope. These let a
  MOCA package sidecar-augment a MIF bundle it does not contain.

**Mapping summary** (full table in the plan document):

| MIF | MOCA |
|---|---|
| `conceptType`: `semantic` / `episodic` / `procedural` | node `type` |
| `@id` | frontmatter `id` |
| `title`, `description`, `tags` | OKF equivalents — handled by OKF conformance, not this profile |
| `entity`, `entities` | `claims[]` (§7.4) |
| `relationships`, node-scoped | `claims[]` |
| `relationships`, cross-bundle | `composition.relates` |
| `Supersedes`, `ConflictsWith` | `supersedes`, `conflictsWith` — already suggested values in §10.2 |
| `provenance.sourceType`, `.trustLevel` | `profileData.mif.provenance` |
| `temporal` | `profileData.mif.temporal` |

The `Supersedes` / `ConflictsWith` match is an unplanned exact alignment with
§10.2's existing suggested vocabulary, which is a good sign for the mapping.

## Conformance to core §11.4

Purely additive:

- **Does not redefine any core field or vocabulary term.** `conceptType` is
  retained under `profileData.mif` *in addition to* the OKF `type` it maps to,
  rather than redefining `type`.
- **Introduces no top-level manifest properties outside `profileData`.** All
  MIF-specific data is nested under `profileData.mif`.
- **Does not change any core-required or core-optional field.** No field
  becomes required or optional as a result of declaring this profile.
- A package declaring this profile remains fully valid and useful to a
  core-only consumer, which is §11.2's requirement: the content nodes are
  ordinary OKF-conformant MOCA nodes, and a consumer ignoring
  `profileData.mif` loses MIF-specific metadata but no content.

## Example manifest snippet

```json
{
  "profile": ["https://openmoca.org/profiles/mif/v1"],
  "profileData": {
    "mif": {
      "mifVersion": "1.3.0",
      "temporal": {
        "recordedAt": "2026-07-11T00:00:00Z",
        "validFrom": "2026-01-01T00:00:00Z",
        "validTo": "2026-12-31T00:00:00Z"
      },
      "provenance": { "sourceType": "curated", "trustLevel": "high" }
    }
  }
}
```

## Notes for review

**The OKF version fork is the main technical risk.** MIF pins **OKF v0.1**;
after the OKF conformance change, MOCA pins **v0.2**. That transition was
breaking in exactly the fields a converter touches — `timestamp` became
`generated: {by, at}`, and a `# Citations` body list became a `sources`
frontmatter block. The converter must upgrade on import and downgrade on
export, and **round-tripping is therefore lossy by construction**:
`sources[].author`, `usage_count` and `last_modified` have no v0.1
representation.

The profile document must carry an explicit round-trip fidelity contract
naming which fields survive MIF → MOCA → MIF and which do not, backed by a
fixture test. Without it, "bidirectional converter" claims more than the format
boundary can deliver.

**On MIF's Container Profile.** MIF 1.3.0 added `*.corpus.json`, a single-file
transport envelope for a bundle or a subset of one. It overlaps MOCA's
transport and composition territory, but it defines no canonical digest, no
signature format, and no typed composition — so the comparison is worth
documenting in the profile as an honest scope boundary rather than treated as
competitive pressure. Supporting `*.corpus.json` as a converter *input* is the
appropriate response.

**Tooling:** implemented as a fifth adapter in the existing `moca-convert`, not
a new `tools/mif-convert/`. The existing auto-detection, path-safety, and
fail-closed lint gate are all reusable. Export needs a new command path, since
`moca-convert` is import-only today.

**Versioning:** proposal is to pin the profile to MIF 1.3.0 via `mifVersion`
rather than claiming 1.x compatibility. MIF shipped six releases in seven
months; claiming compatibility the converter cannot verify would be dishonest.
