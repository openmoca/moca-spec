# MOCA Agent Skills profile

Profile URI: `https://w3id.org/moca/profiles/agent-skills/v1`
Status: Draft, `0.3.0-alpha.1`

## 1. Purpose

Lets a package carry [Agent Skills](https://agentskills.io/specification)
next to the knowledge they use, for example a skill that applies a checklist
the package contains.

Core already reserves `skills/` and requires a valid publisher attestation
before a Reader exposes anything in it
([package spec §8](../../spec/moca-package-spec.md#8-skills)). That rule stays
in core so that it cannot be escaped by not declaring this profile. This
profile only says what a skill looks like.

## 2. Layout

```text
skills/
└── <skill-name>/
    ├── SKILL.md        required
    ├── scripts/        optional
    ├── references/     optional
    └── assets/         optional
```

## 3. Rules

Each `skills/<skill-name>/SKILL.md` MUST conform to the Agent Skills
specification exactly. In particular:

- `name` is 1-64 lowercase letters, digits and single hyphens, and matches the
  directory name;
- `description` is 1-1024 characters;
- `metadata`, when present, maps string keys to **string** values;
- `allowed-tools`, when present, is a **space-separated string** (the field is
  experimental upstream).

To bind a skill to content in the same package, use the metadata key
`moca-nodes`, whose value is a space-separated list of node paths relative to
`content/`:

```yaml
metadata:
  moca-nodes: refund-checklist.md shipping-estimates.md
```

A Reader that recognises this profile reports a nonconforming skill as
`K001_SKILL_INVALID` (warning).

## 4. Execution

Loading a package never runs a skill. An application that chooses to run an
exposed skill MUST treat it as untrusted: run it in a sandbox, and grant only
tools that both `allowed-tools` requests and host policy permits. Signing
tells the host who published a skill, not that the skill is safe.

## 5. Package-level data

None. Declare the profile with an empty object:

```json
{ "profiles": { "https://w3id.org/moca/profiles/agent-skills/v1": {} } }
```

See [`examples/skills`](../../examples/skills).
