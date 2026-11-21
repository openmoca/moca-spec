# The OpenMOCA Commitment

An app that makes the OpenMOCA Commitment promises to honour what creators
ask and what people ask, as the OpenMOCA specification sets out. The company
behind the app signs that promise, for a named product and version, and it is
listed on openmoca.org. OpenMOCA does not test it. The signed promise is the
company's own, and anyone can hold the company to it.

## For people: what the Commitment means for you

When an app shows the OpenMOCA Commitment mark, its makers have promised that:

### The creator's wishes are respected

- If a creator says their work may not be used by a certain kind of AI, the
  app does not send it there.
- If a creator's work is never to be used for training AI, it is not.
- If work is rated for older audiences, it is not shown to younger profiles.
- If a creator says their work may not be exported, the app does not let you
  export it.
- The creator's name, licence and copyright stay with their work, and every
  answer shows where it came from.
- The app never makes a creator's wishes looser than the creator set them.

### Your choices are respected

- Your own settings, such as where your reading may be sent or what you want
  to see, are always applied. The app never overrides them with a looser
  setting of its own.
- What you bring into the app or keep private is not shown to other people,
  not sent anywhere you have not allowed, and not published.
- When something is left out, the app tells you why. One exception: if the
  app speaks to you only through an AI, and a creator has asked that AI not
  even be told their work exists, it says only that something was left out.

**You can check and challenge it.** The promise is signed by the company and
listed publicly with the product and version it covers. If you think an app
breaks it, the signed promise is a public record you can refer to when
challenging the company.

### How challenges work

1. Report it to the company, at the contact in its listing, and to OpenMOCA,
   at [hello@openmoca.org](mailto:hello@openmoca.org).
2. The company can respond.
3. A listing shown to be untrue is removed, and the app may no longer show the
   Commitment mark.

## For companies: what you commit to

By publishing a signed Commitment for a product and version, the company
states that the product, as an app that reads OpenMOCA packages:

### Creators' terms
([package spec §4.14](spec/moca-package-spec.md),
[Reader contract §15](spec/moca-reader-contract.md))

1. Before content is sent to an AI model, played, or shown under a rating
   filter, checks the creator's terms with a Reader, naming where the content
   really goes (the person's device, the app's own service, or another
   company's AI provider) and what it is used for.
2. Never loosens a creator's terms with its own settings; applies the
   standard defaults where the creator has set nothing; treats AI training
   as not allowed unless it is allowed.
3. Honours the creator's export setting.
4. Keeps credits, licence and copyright
   ([package spec §4.13](spec/moca-package-spec.md)) with what it shows, and
   records for each answer where each part came from and which level decided
   each term.
5. Shows terms honestly, telling apart the creator's declaration, who signed
   it, what the app enforces, and what the app says about itself
   ([package spec §13.3](spec/moca-package-spec.md)).
6. Handles encrypted packages as the
   [encrypted-package guidance](spec/moca-encrypted-package.md) sets out:
   decrypted in memory only, with no readable copy kept in logs, caches or
   anything derived from it beyond the key's life.

### People's rules

1. Applies each person's own settings as the app's own limits: stricter wins,
   and the app never overrides a person's setting with a looser one of its
   own.
2. Keeps what a person brings or keeps private to that person: not shown to
   others using the same app, not sent where they have not allowed, not
   published.
3. Shows a person why something was left out. Where the product speaks to
   the person only through an AI model, and the creator has asked that the
   model not be told the work exists, the product says only that something
   was left out, with no name, count or reason
   ([Reader contract §15.4](spec/moca-reader-contract.md)).

**The signed statement** names the company, the product, the versions
covered, the date, the models and destinations the product uses, the set-ups
the Commitment covers (for example, "our own AI service; not when a person
connects their own provider"), and a contact for challenges. It is signed
in the [same signed format](spec/moca-attestations.md) packages use, and is
listed on openmoca.org. A new version of the product needs a new statement.

**What OpenMOCA does and does not do.** OpenMOCA publishes the rules, lists
signed statements, offers the Commitment mark for listed products, and
removes a listing that is withdrawn or shown to be untrue. It does not test,
audit or guarantee any product.
