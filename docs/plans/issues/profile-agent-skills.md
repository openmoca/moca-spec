# Draft: `[Profile] Agent Skills`

**Template:** Profile proposal · **Labels:** `profile-proposal`
**Plan:** `docs/plans/02-skills-to-agent-skills-profile.md`
**Companion:** the `[Spec]` issue splitting §8. **File that one first** — this
profile has nothing to hold until Core gives it up.
**Paste everything below the rule.**

---

## Domain

Executable agent capabilities packaged alongside knowledge: the Agent Skills
Specification (`agentskills.io/specification`) as MOCA Core currently
integrates it in §8.1.

This is unusual among profile proposals in that it does not add a new domain.
It **receives** vocabulary that Core should not have been carrying, so that
Core keeps only the package-container rule (a `skills/` directory obliges a
signature) and stops describing what a skill is.

## Why existing profiles don't cover this

Nothing covers it today — it is in Core, which is the problem. §1 states that
"MOCA Core is domain-agnostic" and that domain-specific vocabulary belongs in
profiles. `SKILL.md`'s frontmatter shape, `allowed-tools`, and
`metadata.concepts` are one external ecosystem's vocabulary and fail that test
for the same reason `education:competencies` does.

The education profile has an adjacent §6 tutoring-skill convention, but it is
domain-specific (tutoring) and layered on Core's general skills mechanism. It
cannot absorb the general mechanism without making every skills-using package
an education package.

## Proposed additions

- **New ontology roles** (namespaced, e.g. `mydomain:taxonomy`): none. This
  profile defines file and directory conventions, not ontology structure.
- **Extended epistemic-status values**: none. Skills are executable proposals,
  not knowledge claims, and have no epistemic status.
- **New `profileData.<profile-name>` fields**: expected to be none, or close to
  it. The profile's substance is `skills/*/SKILL.md` conventions rather than
  manifest data. If review concludes no manifest fields are needed, the
  `profile.schema.json` should say so explicitly rather than inventing fields
  to look complete.
- **Expected `augmentation.targetType` values** (if any): none.

Profile content, moved from Core §8.1 substantially unchanged:

- `SKILL.md` structure and required frontmatter: `name`, `description`
- `metadata.concepts` binding skills to package concepts declared in the
  manifest
- `allowed-tools` as an array, and the host-policy filtering obligation
- Skill discovery and invocation conventions
- A restatement — **not a redefinition** — of Core's signing requirement, so
  that a reader of the profile alone understands the obligation

## Conformance to core §11.4

Purely additive, and specifically:

- **Does not redefine any core field or vocabulary term.** The signing rule
  stays normative in Core and is only restated here, with Core cited as
  authoritative.
- **Introduces no top-level manifest properties outside `profileData`.**
  `skills/` remains a directory convention reserved by Core §4, not a manifest
  property.
- **Does not change any core-required or core-optional field.** `signature`
  remains core-optional in general and core-required for packages containing
  `skills/` — that conditional requirement stays in Core precisely so this
  profile does not have to create it.

**On the §11.2 interaction, stated explicitly because it drove the design.**
An earlier version of this proposal moved Core's §8.2 security boundary into
the profile. That fails §11.2: a core-only harness must process an unrecognised
profile's package as valid Core, so with the rule inside the profile it would
have no basis for refusing unsigned `skills/`. Keeping the rule in Core, bound
to the directory's existence rather than to a profile declaration, is what
makes this profile §11.2-safe. This profile adds no requirement whose absence
would make a package unusable to a core-only consumer.

## Example manifest snippet

```json
{
  "profile": ["https://openmoca.org/profiles/agent-skills/v1"]
}
```

A package may declare it alongside others — `profiles/education/examples/education-profile`
will declare both this and the education profile, becoming the repository's
first multi-profile example:

```json
{
  "profile": [
    "https://openmoca.org/profiles/education/v1",
    "https://openmoca.org/profiles/agent-skills/v1"
  ]
}
```

## Notes for review

- Add an `agent-skills` row to Core §11.5's candidate table, per
  `CONTRIBUTING.md`'s namespace-collision rule.
- `moca-lint`'s `E206_SKILL_FRONTMATTER_INVALID` validates what becomes
  profile-owned content, which `profiles/README.md` says is the profile owner's
  responsibility. Recommendation is to keep the check as a documented
  exception, on the grounds that it is security-adjacent — but it is a real
  inconsistency and should be decided rather than inherited.
- Education profile §6's tutoring-skill convention now sits atop this profile.
  §11.5 discourages profile-of-profile inheritance, so packages should declare
  both independently rather than education depending on this one.
