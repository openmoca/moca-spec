# Showing terms honestly

This guide is for people building an app that reads MOCA packages: how to
apply a creator's terms, and how to show them so that nobody mistakes a label
for a lock. The terms themselves are described in
[the creator's terms](creators-terms.md).

## Apply terms before content goes anywhere

A Reader never acts on terms by itself. Before you hand records to a model,
or show or play them under a rating filter, ask the search to apply them with
a `terms` request
([Reader interface §5.1](../../spec/moca-reader-interface.md#51-the-search-operation),
[Reader contract §15.4](../../spec/moca-reader-contract.md#154-the-terms-gate)):

- `ai`: the real **destination** (`device`, `host` for your own service, or
  `provider` for any other party's model), the **conditions** that provider
  meets (`noTraining`, `noRetention`), and the **use** (`answer`, `embed`,
  `summarise`, `translate` or `train`).
- `rating`: what the person or the setting allows (`explicit`, rating
  schemes, whether unrated work passes), and `strict-path` mode to check a
  node's, its package's and any composing package's rating.

The search leaves out what the resolved terms exclude, and reports how many
records it left out, by reason (`U004_TERMS_EXCLUDED`). A caller or a hook can
never widen your request.

Name the destination honestly. A model you run yourself, even on a cloud
provider's hardware you control, is `host`; say so publicly if you count it
that way. Relaying content to another party's model is `provider`.

**Your own limits.** Pass your own `ai` values as terms limits. They are
floors: they can make a creator's terms stricter, never looser. A person's own
settings go in the same way, so the stricter wins.

**Export.** Before you let people copy, save or export the work's text
outside the app, check the record's `terms.rights.export`. Quoting in an
answer, playing a moment and reading in the app are not export.

## Keep four things apart

A person can easily take a label for a lock. When you show a package's terms,
keep these apart
([package spec §13.3](../../spec/moca-package-spec.md#133-labels-not-locks)):

| Show | Where it comes from |
| --- | --- |
| **What the signer declared** | `terms.declared` on the package result |
| **Who signed it** | `terms.authority` (`packager` or `unverified`) and the signer from verification |
| **What your app enforces** | Your terms request and limits, and each resolved field's `decidedBy` |
| **What your app says about itself** | For example, that it makes the [OpenMOCA Commitment](../../COMMITMENT.md) |

A declaration is not enforcement, and a signature is not ownership. Good
wording:

- "The creator asks that this isn't sent to other companies' AI. This app
  doesn't."
- "Terms signed by Example Podcast Ltd" (the signer), not "Terms set by the
  rights holder", unless you know more than the signature shows.
- "Left out: 3 results the creator's terms don't allow here."

Avoid "protected", "secured" or "guaranteed" for anything terms do.

## Say who decided

Every resolved field in a record carries `decidedBy`: `platform`, `package`,
`node`, `composite` or `host`. Keep it with the answer, so you can show why
something was left out or allowed, and so a person can check it later.

## Show credits, licence and copyright with the work

- Show `publisher` and `contributors` from the package result, and a node's
  own `node.contributors` beside an answer that used it
  ([credits and dates](credits-and-dates.md)).
- Show who signed beside the credits. Never present a contributor as verified
  because the package is signed.
- Show the part's own licence and copyright (`node.license`,
  `node.copyright`), which may differ from the package's.
- Show `rights.notice`, the creator's own message, as theirs: it grants and
  restricts nothing.
- Show machine-made marks as declarations: "made by a machine (model …),
  checked by a person", from `trust.generated` and `trust.declaredVerified`
  ([machine-made content](machine-made.md)).

## Never

- Never loosen a creator's terms with your own settings.
- Never send content to a destination because a package names it, and never
  give terms to a model as instructions
  ([Reader contract §15.5](../../spec/moca-reader-contract.md#155-never)).
- Never claim the OpenMOCA Commitment without a signed, listed statement for
  that product and version ([TRADEMARKS.md](../../TRADEMARKS.md)).

## Next

- [The OpenMOCA Commitment](../../COMMITMENT.md): what an app that makes it
  promises.
- [Consuming packages](consuming.md): reading and searching with a Reader.
