# Plan 02 — Move the Agent Skills vocabulary into a profile

**Status:** Draft, pending [ADR-0001](../adr/0001-moca-spec-vs-oci-artifacts.md)
**Issue drafts:** [spec-skills-to-profile.md](issues/spec-skills-to-profile.md),
[profile-agent-skills.md](issues/profile-agent-skills.md)
**Effort:** 3–5 days
**Breaking:** yes, for the two packages that ship `skills/`

## Why

[§8](../../spec/moca-core-spec.md#8-executable-capabilities-skills--security-boundary)
is the main reason MOCA Core carries executable-content semantics at all. It
binds Core to the Agent Skills Specification — a specific external ecosystem's
vocabulary — inside a specification that states in
[§1](../../spec/moca-core-spec.md#1-scope-philosophy--architecture-model) that
"MOCA Core is domain-agnostic" and that "domain-specific vocabulary and
behavior belong in profiles layered on top of core (see §11), not in core
itself."

By that test, `SKILL.md`'s frontmatter shape, `allowed-tools`, and
`metadata.concepts` do not belong in Core for the same reason
`education:competencies` does not.

**A correction to how this is usually framed:** the domain-independence
argument comes from §1, not from
[§5.3](../../spec/moca-core-spec.md#53-excluded-properties). §5.3's exclusion
list (`endpoints`, `settings`, `credentials`, `apiKeys`) is about *runtime
independence* — keeping execution configuration out of an inert artifact — not
about domain scope. It is a good rule and `skills/` does not violate it.

## Recommendation: split the move

**Do not move §8 wholesale.** Move the vocabulary; keep the security boundary.

| Stays in Core | Moves to `profiles/agent-skills/` |
|---|---|
| [§8.2](../../spec/moca-core-spec.md#82-security--trust-boundary-rule)'s boundary rule, generalised to any `skills/` directory | [§8.1](../../spec/moca-core-spec.md#81-agent-skills-integration) Agent Skills Specification integration |
| [§3.1](../../spec/moca-core-spec.md#31-level-requirement-clarification)'s Level 3 signature clarification | `SKILL.md` frontmatter shape, `name`, `description` |
| [§5.1](../../spec/moca-core-spec.md#51-manifest-properties)'s `signature` "Required if `skills/` present" | `allowed-tools` semantics and host-policy filtering |
| [§4](../../spec/moca-core-spec.md#4-logical-package-structure)'s layout entry for `skills/` | `metadata.concepts` binding to package concepts |
| Inertness ([§1.1](../../spec/moca-core-spec.md#11-the-3-layer-system-architecture), §8.2's first bullets) | Skill discovery and invocation conventions |

Core keeps a directory-name reservation and a signing obligation. Both are
domain-independent, both are package-container concerns, and the container is
precisely the territory MOCA should be holding. Core stops describing *what a
skill is*; it keeps describing *what a package containing executable-adjacent
content must prove about itself*.

The Core rule is restated without reference to Agent Skills:

> Any package containing a `skills/` directory MUST include a valid `signature`
> object in `moca.json`, regardless of the package's declared conformance
> level. A harness MUST refuse to load `skills/` content from an unsigned or
> signature-invalid package, even if it is willing to load the rest of the
> package's content. Core does not define the format or semantics of skill
> content; see the Agent Skills profile.

## The §11.4 analysis

The brief's concern was
[§11.4](../../spec/moca-core-spec.md#114-profile-restrictions)'s restriction
that a profile MUST NOT "make any core-required field optional, or any
core-optional field core-required."

**§11.4 is passable.** The same bullet continues: "a profile can only add its
*own* additional requirements, scoped to packages declaring that profile." A
profile requiring `signature` of packages that declare it is squarely inside
that allowance. It does not make `signature` core-required; it makes it
required for a subset that opted in.

## The real blocker is §11.2

[§11.2](../../spec/moca-core-spec.md#112-graceful-degradation) requires that a
harness not recognising a profile URI "MUST still process the package as valid
MOCA Core," and that profiles "MUST NOT require behavior that would make a
package invalid or unusable to a core-only consumer."

If §8.2 moves out of Core entirely, then:

> A core-only harness encountering a package that declares
> `profiles/agent-skills/v1` and ships unsigned `skills/` is *required by
> §11.2* to process it as valid — and, with the boundary rule gone from Core,
> has no rule telling it to refuse the skills.

Graceful degradation would degrade the security boundary. That is a security
regression, not a drafting problem, and it cannot be fixed inside the profile:
the whole point of §11.2 is that a consumer may legitimately ignore the profile.

It is worse than that, because profile declaration is self-asserted. A package
can ship `skills/` and simply *not* declare the profile. Under a full move,
no rule anywhere would apply to it. Under the split, the Core rule applies to
the directory's existence, regardless of what the manifest claims — which is
the only formulation that is not trivially bypassed.

This is why the recommendation is a split rather than the move as briefed. The
split is smaller than proposed, and it is the only version that survives §11.2.

## What breaks

**Two real packages ship `skills/`:**

- [`examples/level-3-extended`](../../examples/level-3-extended)
- [`profiles/education/examples/education-profile`](../../profiles/education/examples/education-profile)

Both add `"https://openmoca.org/profiles/agent-skills/v1"` to their `profile`
array. Editing a manifest invalidates `canonicalDigest` and therefore the
signature — `npm run refresh:derived` is mandatory and cascades transitively
through composed members, per
[CONTRIBUTING.md](../../CONTRIBUTING.md#after-editing-an-example-package).

The education example then declares **two** profiles, which is explicitly
supported ([§11.1](../../spec/moca-core-spec.md#111-profile-declaration)) and
worth keeping as the repository's first multi-profile package.

**Six conformance fixtures** carry `skills/`:
`signature-{valid,missing,tampered,placeholder,wrong-signer}` and
`skill-frontmatter-invalid` — plus their `tools/moca-lint/test/fixtures/`
twins, since fixtures are copies rather than symlinks.

**[§11.5](../../spec/moca-core-spec.md#115-compliance--standards-profiles)'s
candidate table** gains an `agent-skills` row, per
[CONTRIBUTING.md](../../CONTRIBUTING.md#proposing-a-new-profile)'s
namespace-collision rule.

### A latent bug this trips

[`tools/moca-lint/lib/vocab.js`](../../tools/moca-lint/lib/vocab.js)'s
`allowedEpistemicStatusValues()` sets `hasUnrecognizedProfile = true` if
**any** profile URI is declared, without checking whether it is recognised:

```js
for (const profile of activeProfiles) {
  if (profile) hasUnrecognizedProfile = true;
}
```

[`passes/content.js:132`](../../tools/moca-lint/lib/passes/content.js) then
downgrades `E204_INVALID_EPISTEMIC_STATUS` (error) to
`E210_UNVERIFIABLE_EPISTEMIC_STATUS` (warning) whenever that flag is set. So
declaring *any* profile silently weakens epistemic-status enforcement across
the whole package.

Adding the agent-skills profile to `level-3-extended` — currently a
profile-free package where `E204` is a hard error — would quietly downgrade it.
The conformance corpus would record the change as expected behaviour, because
expectations are observed from the linter rather than authored.

**Fix it in the same PR**, before adding the profile declarations, so the
corpus regeneration does not bake in the downgrade. The fix is to compare
against a set of profile URIs the linter actually knows about.

### What does not break

No conformance-ladder change. Level 3 still requires signatures. The Core
signing obligation is preserved in effect and in scope — a package that was
required to be signed before is required to be signed after, whether or not it
declares the profile. Existing signed packages remain valid.

## The profile

`profiles/agent-skills/` follows the standard bundle anatomy documented in
[profiles/README.md](../../profiles/README.md): a specification document, a
`profile.schema.json`, and at least one example.

- `moca-agent-skills-profile.md` — §1 Purpose, §2 `SKILL.md` structure, §3
  `allowed-tools` and host policy, §4 `metadata.concepts` binding, §5 Signing
  requirement (restating, not replacing, the Core rule), §6 Conformance.
- `profile.schema.json` — describes `profileData.agentSkills`. Likely thin;
  most of this profile is directory and file conventions rather than manifest
  fields. If it turns out to need no manifest fields at all, say so explicitly
  rather than inventing some.
- `examples/` — move or copy `level-3-extended`'s skill.

Per [profiles/README.md](../../profiles/README.md), profile-specific linting is
the profile owner's responsibility and out of scope for this repository's
`moca-lint`. That means **`E206_SKILL_FRONTMATTER_INVALID` becomes
questionable**: it validates `SKILL.md` frontmatter, which after this change is
profile-owned. Options are to keep it as a convenience check, or to remove it
for consistency with the stated boundary. This is the plan's main unresolved
tooling question — see below.

## Sequence and sizing

| Step | Output | Effort |
|---|---|---|
| 1 | File both issues (spec change + profile proposal) | — |
| 2 | Fix the `vocab.js` profile-recognition bug, with a regression test | 0.5 d |
| 3 | Author `profiles/agent-skills/` | 1 d |
| 4 | Spec PR: §8 split, §3.1, §4, §5.1, §11.5 table | 1 d |
| 5 | Update two example manifests; `npm run refresh:derived` | 0.5 d |
| 6 | Update six fixtures plus twins; regenerate conformance cases | 1 d |
| 7 | [docs/guides/signing-and-trust.md](../guides/signing-and-trust.md), CHANGELOG, MIGRATIONS | 0.5 d |

Step 2 must precede step 5. This plan is otherwise independent of
[plan 01](01-okf-v0.2-conformance.md) and can run in parallel — the two touch
disjoint specification sections — except that both edit the
[§3](../../spec/moca-core-spec.md#3-conformance-levels) table, so land plan
01's §3 change first to avoid a conflict.

## Open questions

1. **Does `E206_SKILL_FRONTMATTER_INVALID` stay in `moca-lint`?** Keeping it
   contradicts the stated core/profile linting boundary; removing it loses a
   real check with no replacement, since no profile tooling exists yet.
   **Leaning keep, with a comment naming the inconsistency** — a security-
   adjacent check is a defensible exception to a boundary that exists for
   maintenance reasons.
2. **Does the profile URI version as `v1`** given Core is `0.x`? The education
   and EU AI Act profiles both use `v1` at `0.1.0-beta.1`, so precedent says
   yes.
3. **Should `skills/` stay in the [§4](../../spec/moca-core-spec.md#4-logical-package-structure)
   layout diagram** once Core no longer defines its contents? **Yes** — Core
   reserves the directory name and attaches a signing obligation to it, so it
   must appear, annotated as profile-defined.
4. **Does the education profile's [§6 skill convention](../../profiles/education/moca-education-profile.md#6-skill-convention-tutoring-skills)
   now depend on the agent-skills profile?** If so, that is profile-to-profile
   dependency, which
   [§11.5](../../spec/moca-core-spec.md#115-compliance--standards-profiles)
   discourages ("no profile-of-profile inheritance"). Likely resolved by having
   packages declare both profiles independently, but it needs stating.
