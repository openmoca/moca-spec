# 0026 — `apps` is a hint, never configuration

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Some packages are made for a particular kind of application. A catalogue
cannot tell a reader where such a package opens best, and the publisher has no
way to say so
([issue #8](https://github.com/openmoca/moca-spec/issues/8)).

## Options

1. A single `app` URI.
2. App types only, from a closed list in the specification.
3. Put the hint in a profile.
4. An `apps` list: specific apps as `https:` URIs and open app types as
   tokens, the first preferred.

## Decision

Option 4 ([package spec §4.9](../../spec/moca-package-spec.md#49-apps)).

- The list is a fallback stack. A host uses the first entry it can.
- A URI names an app; it is not an address. A Reader never fetches, resolves or
  opens it ([Reader contract §4](../../spec/moca-reader-contract.md#4-what-a-reader-must-never-do)).
- Types are open. A public, informative list of well-known types is kept on
  openmoca.org, outside the specification.
- Conversation is never listed: every package has it.
- `apps` and profiles stay separate. `apps` says where to open a package; a
  profile says how its content is shaped.
- `apps` is advice ([ADR-0022](0022-applications-get-advice.md)). It names
  applications only, never agents, prompts, models or tools.

## Consequences

- A catalogue can offer "Open with", even before an envelope is opened.
- Listing an app does not make a package suitable for it. The app still checks
  for itself.
- No new diagnostic code: a bad entry fails the schema (`M002`).

## What would change this decision

Hosts that need to launch apps from the hint with no user choice, which would
make it configuration.
