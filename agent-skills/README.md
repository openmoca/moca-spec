# Agent skills

[Agent skills](https://agentskills.io) that teach an AI agent to work with OpenMOCA.

| Skill | What it teaches |
| --- | --- |
| [`openmoca`](openmoca/SKILL.md) | Make, check, sign, index, read and serve MOCA packages with the open tools and Readers |

openmoca.org publishes each skill, with its SHA-256 digest, at
<https://openmoca.org/.well-known/agent-skills/index.json>, so agents can discover it.

These skills are for agents using OpenMOCA's tools. They are not part of any package: a package carries knowledge,
never instructions for an agent ([ADR-0011](../docs/adr/0011-park-unconsumed-features.md)).
