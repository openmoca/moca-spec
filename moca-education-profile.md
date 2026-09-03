# MOCA Education Profile

Profile URI: `https://openmoca.org/profiles/education/v1`
Extends: MOCA Core Specification
Status: Draft — pre-adoption, no version pinning yet

---

## 1. Purpose

This profile adapts MOCA Core for AI tutoring, courseware, and structured
learning content: self-contained courses or modules, semantic sidecars over
SCORM/cmi5/xAPI packages, and grounding for video-lecture playlists.

It is purely additive over MOCA Core. A package declaring this profile MUST
still be fully valid and usable to a MOCA-Core-only consumer, per Core §10.2
— an education-unaware harness can ground against it with degraded (but
functional) fidelity, simply ignoring the pedagogical layer.

Declare the profile in the manifest:

```json
{
  "profile": ["https://openmoca.org/profiles/education/v1"]
}
```

---

## 2. Additional Ontology Role: `competencies`

This profile adds one ontology role to Core §6.2:

- `education:competencies` — a taxonomy of competencies, capabilities, or
  knowledge areas a learner is expected to acquire, typically expressed as
  SKOS concept schemes and optionally aligned to external competency
  standards (e.g. IEEE RCD / CASE, national curriculum frameworks).

```json
{
  "ontologies": {
    "education:competencies": {
      "iri": "https://example.org/curriculum/competencies",
      "role": "education:competencies",
      "format": "skos",
      "uri": "./ontologies/competencies.jsonld"
    }
  }
}
```

Competency entries SHOULD link to the concepts they represent mastery of via
`skos:related` or a profile-defined `education:assessesConcept` predicate,
so a harness can trace "this competency is demonstrated by understanding
concept X."

---

## 3. Extended Epistemic Status Vocabulary

This profile additively extends Core §7.2's epistemic-status vocabulary with
academic/instructional values. Core values (`sourced`, `verified`,
`inferred`, `generated`, `disputed`, `deprecated`) retain their exact Core
meaning and MUST NOT be redefined.

Additional values:

- `authoritative`: Formally approved primary documentation or normative
  curriculum specification (e.g. an official syllabus, an accreditation
  standard).
- `peer-reviewed`: Reviewed and approved by subject-matter-expert educators
  or instructional designers, distinct from Core's general-purpose
  `verified` in that it implies a formal academic review process.

A node using either value is also implicitly `verified`-compatible for any
Core-only harness that doesn't recognize the extended terms — profile
implementers SHOULD ensure such harnesses have a sane fallback interpretation
(treat unrecognized values as `sourced` at minimum).

---

## 4. Learning-Specific Manifest Data (`profileData.education`)

All education-specific manifest data lives under `profileData.education`,
per Core §10.3:

```json
{
  "profileData": {
    "education": {
      "level": "undergraduate",
      "subject": "Computer Science",
      "estimatedDuration": "PT4H30M",
      "prerequisites": ["urn:moca:course:cs101-intro"],
      "learningObjectives": [
        {
          "id": "urn:lo:001",
          "statement": "Explain the tradeoffs between horizontal and vertical scaling.",
          "competencies": ["ex-comp:SystemDesignFundamentals"],
          "concepts": ["ex:Microservices"]
        }
      ],
      "assessment": {
        "type": "formative",
        "linkedNodes": ["urn:node:service-boundaries"]
      }
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `level` | String | Learner level (e.g. `"beginner"`, `"undergraduate"`, `"professional-certification"`). Open vocabulary — no enforced enum, as levels vary wildly by institution/domain. |
| `subject` | String | Subject area, freeform or taxonomy-aligned. |
| `estimatedDuration` | String (ISO-8601 duration) | Expected time to complete. |
| `prerequisites` | Array of Strings (URN) | Other MOCA education packages expected as prior knowledge. |
| `learningObjectives` | Array of Objects | Learning objectives, each linkable to `competencies` and/or core `concepts`. |
| `assessment` | Object | Assessment metadata — type and which content nodes it evaluates. This profile does not define a full assessment/QTI model; it only marks the linkage. Packages needing rich assessment authoring should sidecar-augment a dedicated QTI/xAPI package (§5) rather than modeling assessment natively in MOCA. |

---

## 5. Sidecar Augmentation for Courseware

This profile defines expected `targetType` values for Core §9's
`augmentation.targetType` when sidecar-augmenting existing courseware
packages:

- `scorm-1.2`
- `scorm-2004`
- `cmi5`
- `xapi`
- `qti`

```json
{
  "id": "urn:moca:aug:cs101-scorm-sidecar",
  "version": "1.0.0",
  "title": "CS101 SCORM Semantic Augmentation",
  "profile": ["https://openmoca.org/profiles/education/v1"],
  "augmentation": {
    "target": "./raw/cs101-course.zip",
    "targetType": "scorm-2004",
    "relationship": "augments"
  }
}
```

The AI Harness uses the sidecar to ground conversational tutoring and
GraphRAG-based Q&A against the legacy course content without modifying the
original SCORM/cmi5/xAPI package.

**Note on `augmentation.target` cardinality**: Core restricts a package to
one target. A course composed of many SCORM modules should either target a
single archive containing all modules, or ship one MOCA sidecar package per
module — do not attempt to reference multiple independent SCORM packages
from a single `augmentation` block.

---

## 6. Skill Convention: Tutoring Skills

Education packages commonly ship `skills/` implementing tutoring behaviors
(Socratic questioning, hint-graduated problem walkthroughs, misconception
diagnosis). These follow Core §8 exactly — no profile-specific skill schema
— but this profile recommends a `metadata.competencies` field alongside
Core's `metadata.concepts` in `SKILL.md` frontmatter, so a tutoring skill can
declare which competencies it's designed to build, not just which concepts
it touches:

```markdown
---
name: socratic-debugging
description: Guides a learner through debugging via Socratic questioning rather than direct answers.
metadata:
  concepts: [ex:Microservices]
  education:competencies: [ex-comp:SystemDesignFundamentals]
allowed-tools: [read_file]
---
```

Per Core §8.2, this skill is still subject to mandatory signing if shipped
in `skills/`, regardless of its educational intent — tutoring skills are not
exempt from the sandboxing and signature requirements.

---

## 7. Conformance

An education-profile package:

1. MUST be a valid MOCA Core package at whatever conformance level it
   otherwise declares (Core §3).
2. MUST declare `"https://openmoca.org/profiles/education/v1"` in its
   manifest `profile` array.
3. MAY use any or all of §2–§6 above.
4. MUST NOT rely on education-profile semantics for content a Core-only
   harness needs to correctly ground against the package — per Core §10.2,
   the profile is enrichment, not a requirement for basic function.
