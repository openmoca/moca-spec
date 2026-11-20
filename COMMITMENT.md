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
- What you bring into the app or keep private stays yours. It is not shown to
  other people, sent anywhere you have not allowed, or published.
- When something is left out, the app tells you why.

**You can check and challenge it.** The promise is signed by the company and
listed publicly with the product and version it covers. If you think an app
breaks it, you can report it to the company and to OpenMOCA, and the signed
promise is your evidence.

## For companies: what you commit to

By publishing a signed Commitment for a product and version, the company
states that the product, as a host of OpenMOCA packages:

### Creators' terms
([package spec §4.14](spec/moca-package-spec.md),
[Reader contract §15](spec/moca-reader-contract.md))

1. Before content is sent to an AI model, played, or shown under a rating
   filter, resolves the creator's terms through a Reader and applies the
   terms gate, naming the real destination (device, the host's own service,
   or a third-party provider) and use.
2. Never loosens a creator's terms with its own settings; applies the
   specification's platform defaults where terms are absent; treats training
   as not allowed unless allowed.
3. Honours `rights.export`.
4. Keeps credits, licence and copyright
   ([package spec §4.13](spec/moca-package-spec.md)) with what it shows, and
   records for each answer where each part came from and which level decided
   each term.
5. Shows terms honestly, telling apart the creator's declaration, who signed
   it, what the host enforces, and what the host says about itself
   ([package spec §13.3](spec/moca-package-spec.md)).
6. Handles encrypted packages as the
   [encrypted-package guidance](spec/moca-encrypted-package.md) sets out:
   decrypted in memory only, with no plaintext kept in logs, caches or derived
   data beyond the key's life.

### People's rules

1. Applies each person's own settings as host limits: stricter wins, and the
   host never overrides a person's setting with a looser one of its own.
2. Keeps what a person brings or keeps private to that person: not shown to
   others on the same host, not sent where they have not allowed, not
   published.
3. Shows a person why something was left out.

**The signed statement** names the company, the product, the versions
covered, the date, the models and destinations the product uses, the set-ups
the Commitment covers (for example, "our own AI service; not when a person
connects their own provider"), and a contact for challenges. It is signed
with the [attestation format](spec/moca-attestations.md) packages use, and is
listed on openmoca.org. A new version of the product needs a new statement.

**What OpenMOCA does and does not do.** OpenMOCA publishes the rules, lists
signed statements, offers the Commitment mark for listed products, and
removes a listing that is withdrawn or shown to be untrue. It does not test,
audit or guarantee any product.
