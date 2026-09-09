# Draft: `[Spec] Move the Agent Skills vocabulary out of Core, keep the security boundary`

**Template:** Spec change proposal · **Labels:** `spec-change`
**Plan:** `docs/plans/02-skills-to-agent-skills-profile.md`
**Companion:** the Agent Skills profile proposal issue.
**Paste everything below the rule.**

---

## Affected section(s)

- `spec/moca-core-spec.md` §8.1 Agent Skills Integration — moves out of Core
- `spec/moca-core-spec.md` §8.2 Security & Trust Boundary Rule — stays,
  generalised
- `spec/moca-core-spec.md` §3.1 Level Requirement Clarification — stays,
  reworded
- `spec/moca-core-spec.md` §4 Logical Package Structure — annotation only
- `spec/moca-core-spec.md` §5.1 Manifest Properties — `signature` row wording
- `spec/moca-core-spec.md` §11.5 — new row in the candidate profile table

## Problem

§8 is the main reason MOCA Core carries executable-content semantics at all. It
binds Core to the Agent Skills Specification — one external ecosystem's
vocabulary — inside a specification that says in §1 that "MOCA Core is
domain-agnostic" and that "domain-specific vocabulary and behavior belong in
profiles layered on top of core (see §11), not in core itself."

By that test, `SKILL.md`'s frontmatter shape, `allowed-tools`, and
`metadata.concepts` do not belong in Core, for the same reason
`education:competencies` does not. Core currently describes *what a skill is*,
which is a domain modelling decision, not a package-container one.

To be precise about which rule is in play: this argument comes from §1, not
from §5.3. §5.3's exclusion list (`endpoints`, `settings`, `credentials`,
`apiKeys`) is about runtime independence — keeping execution configuration out
of an inert artifact — not about domain scope. `skills/` does not violate §5.3.

## Proposed change

**Split §8. Move the vocabulary; keep the security boundary in Core.**

Moves to `profiles/agent-skills/`:

- §8.1's Agent Skills Specification integration
- `SKILL.md` frontmatter shape — `name`, `description`
- `allowed-tools` semantics and host-policy filtering
- `metadata.concepts` binding to package concepts
- Skill discovery and invocation conventions

Stays in Core, restated without reference to Agent Skills:

> Any package containing a `skills/` directory MUST include a valid `signature`
> object in `moca.json`, regardless of the package's declared conformance
> level. A harness MUST refuse to load `skills/` content from an unsigned or
> signature-invalid package, even if it is willing to load the rest of the
> package's content. Core does not define the format or semantics of skill
> content; see the Agent Skills profile.

Also staying: §3.1's Level 3 clarification, §5.1's `signature` row, §4's layout
entry for `skills/` (annotated as profile-defined contents), and the inertness
rules in §1.1 and §8.2's opening bullets.

Core keeps a directory-name reservation and a signing obligation. Both are
domain-independent and both are package-container concerns.

**RFC 2119 implications.** No keyword changes. Every MUST in the retained rule
is a MUST today, with identical scope: a package that was required to be signed
before is required to be signed after.

### Why this is a split rather than the full move

Moving §8.2 into the profile as well was considered first and does not survive
§11.2.

§11.2 requires that a harness not recognising a profile URI "MUST still process
the package as valid MOCA Core," and that profiles "MUST NOT require behavior
that would make a package invalid or unusable to a core-only consumer." So a
core-only harness encountering a package that declares
`profiles/agent-skills/v1` and ships unsigned `skills/` would be *required by
§11.2* to process it as valid — and, with the boundary rule gone from Core,
would have no rule telling it to refuse the skills. Graceful degradation would
degrade the security boundary.

This cannot be fixed inside the profile, because the whole point of §11.2 is
that a consumer may legitimately ignore it.

It is worse still because profile declaration is self-asserted: a package could
ship `skills/` and simply not declare the profile, and under a full move no
rule anywhere would apply. Attaching the Core rule to the *directory's
existence* rather than to a manifest claim is the only formulation that is not
trivially bypassed.

**Note on §11.4.** §11.4 is *not* the obstacle here, contrary to the obvious
reading. It forbids a profile making "any core-optional field core-required,"
but the same bullet permits a profile to "add its own additional requirements,
scoped to packages declaring that profile." A profile requiring `signature` of
its own declarants is squarely inside that allowance. §11.2 is the binding
constraint, not §11.4.

## Impact on existing conformance levels / profiles

**No conformance-ladder change.** Level 3 still requires signatures. The Core
signing obligation is preserved in effect and scope. Existing signed packages
remain valid.

**Two packages ship `skills/` and must declare the new profile:**

- `examples/level-3-extended`
- `profiles/education/examples/education-profile`

Editing either manifest invalidates `canonicalDigest` and therefore the
signature; `npm run refresh:derived` is required and cascades transitively. The
education example then declares two profiles, which §11.1 explicitly supports
and which is worth keeping as the repository's first multi-profile example.

**Six conformance fixtures** carry `skills/`
(`signature-{valid,missing,tampered,placeholder,wrong-signer}` and
`skill-frontmatter-invalid`), plus their `tools/moca-lint/test/fixtures/`
twins, since fixtures are copies rather than symlinks.

**Education profile §6** defines a tutoring-skill convention that now sits atop
the Agent Skills profile. §11.5 discourages profile-of-profile inheritance, so
this should be resolved by having packages declare both profiles independently
rather than by making education depend on agent-skills. Worth confirming during
review.

**A latent `moca-lint` bug this change trips.**
`tools/moca-lint/lib/vocab.js`'s `allowedEpistemicStatusValues()` sets
`hasUnrecognizedProfile = true` if *any* profile URI is declared, without
checking whether it is recognised. `passes/content.js` then downgrades
`E204_INVALID_EPISTEMIC_STATUS` from error to
`E210_UNVERIFIABLE_EPISTEMIC_STATUS` warning whenever that flag is set.

Adding a profile declaration to `examples/level-3-extended` — currently
profile-free, where `E204` is a hard error — would silently weaken
epistemic-status enforcement, and the conformance corpus would record the
downgrade as expected behaviour because expectations are observed from the
linter rather than authored. **This must be fixed before the profile
declarations are added**, in the same PR.

**Open tooling question:** `E206_SKILL_FRONTMATTER_INVALID` validates
`SKILL.md` frontmatter, which after this change is profile-owned — and
`profiles/README.md` states that profile-specific linting is the profile
owner's responsibility, not this repository's. Keeping the check contradicts
that boundary; removing it loses a real check with no replacement, since no
profile tooling exists. Recommendation is to keep it as a deliberate,
documented exception on the grounds that it is security-adjacent.

## Alternatives considered

**1. Move all of §8 into the profile.** The obvious reading of the proposal.
Rejected: §11.2 makes the security boundary unenforceable by core-only
consumers, as set out above. This is a security regression, not a drafting
detail.

**2. Leave §8 entirely in Core.** Status quo. Rejected: it leaves Core
describing one vendor ecosystem's file format, which is the clearest violation
of §1's domain-agnosticism currently in the specification, and it sets a
precedent for the next ecosystem that wants a directory.

**3. Move §8.1 and generalise §8.2 to any executable content, not just
`skills/`.** Tempting — a rule about "executable-adjacent directories" is more
future-proof than one naming `skills/`. Rejected as premature: there is exactly
one such directory today, and a generalised rule needs a definition of
"executable-adjacent" that nobody has written. Worth revisiting if a second
such directory is ever proposed.
