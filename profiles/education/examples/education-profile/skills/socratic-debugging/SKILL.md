---
name: socratic-debugging
description: Guides a learner through debugging via Socratic questioning rather than direct answers.
metadata:
  concepts: [ex:Microservices]
  education:competencies: [ex-comp:SystemDesignFundamentals]
allowed-tools: [read_file]
---
# Socratic Debugging

This tutoring skill follows Core §8 exactly (no profile-specific skill
schema), but adds the education profile's recommended
`metadata.competencies`-equivalent field
(`metadata."education:competencies"`) alongside Core's `metadata.concepts`,
per
[education §6](../../../../moca-education-profile.md#6-skill-convention-tutoring-skills).

It does not implement real tutoring logic — it exists so this example
package has something for the mandatory `signature` in `moca.json` (required
because `skills/` is present, per
[core §8.2](../../../../../../spec/moca-core-spec.md#82-security--trust-boundary-rule))
to cover. See the placeholder-signature note in
[../../../../../../examples/level-3-extended/README.md](../../../../../../examples/level-3-extended/README.md) — the
same caveat applies here.
