# 0012 — Protect the OpenMOCA name with a published trade mark policy

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

MOCA is useful only if every conforming Reader reads a package the same way.
The Apache License 2.0 lets anyone use, change and share the specification and
code, but its section 6 grants no rights in trade marks. The licence alone
cannot stop a changed fork, or a Reader that fails the conformance corpus,
from calling itself OpenMOCA.

Most open standards and projects protect their name and publish a policy for
it: Kubernetes, OpenID, OpenAPI, Python and Rust among them. Markdown did not,
and is now many incompatible dialects. Policies that felt restrictive have
drawn strong objections from their communities, so the tone matters as much
as the rules.

"MOCA" on its own is the name of the format and is already used as a mark by
unrelated businesses. The distinctive name is OpenMOCA.

## Options

1. No trade mark; rely on the licence and goodwill.
2. Register OpenMOCA and publish a short, permissive policy, with one firm
   rule for conformance claims.
3. Register and require permission for most uses, or charge for conformance.

## Decision

Option 2. OpenMOCA is filed as a UK word mark (UK00004468246), held by
PI & Mash Solutions Ltd for the project. [TRADEMARKS.md](../../TRADEMARKS.md)
is the policy:

- Describing, discussing and building on OpenMOCA needs no permission. "MOCA",
  used to describe the format, is not restricted.
- "OpenMOCA conformant" may be claimed only by software that passes the full
  conformance corpus for a named specification version. It is self-checked
  and free.
- Using the name in a product, company or domain name, implying endorsement,
  or calling a changed version OpenMOCA needs permission, or is not allowed.

Option 1 leaves conformance claims unprotected. Option 3 would slow adoption
and make the standard look like a route into one vendor's products.

## Consequences

- "OpenMOCA" and "OpenMOCA conformant" mean something that can be checked.
- Each repository's README carries a one-line notice and links to the policy.
- The marks are held by the maintainer's company, which sits uneasily with a
  vendor-independent specification. GOVERNANCE.md says the policy applies to
  everyone alike, and that a move to a neutral foundation will be considered
  as adoption grows.
- A formal certification programme, if one is ever needed, will use a separate
  name and will not take away the self-checked claim.

## What would change this decision

- The application is refused or successfully opposed.
- Adopters or contributors find the policy too restrictive.
- A neutral foundation is ready to hold the marks.
- Conformance claims are misused often enough that self-checking is not
  enough.
