# Trust and provenance

When an AI answers from your knowledge, four questions decide whether you can
rely on the answer: **which content was it, exactly? Who published it? Did
anyone check it? Is it still in force?** In most AI systems nobody can answer
them, because the knowledge was copied into an index and its history stayed
behind.

**A MOCA package answers all four, and lets you prove it later.** Trust is
built into the format: it is the "Attestation" in Modular Ontology, Content &
Attestation.

## What a package proves

| Question | How MOCA answers it | Who can check |
| --- | --- | --- |
| **Is this exactly the content that was published?** | One SHA-256 digest covers every file in the package. Change one character and the digest changes | Anyone, with any Reader |
| **Who published it?** | The publisher signs the digest, with an Ed25519 key or Sigstore | Any reader who trusts the publisher's key or identity |
| **Did anyone check this page?** | A reviewer signs a review of the exact bytes of the pages they checked, with a verdict: accurate, needs change, or inaccurate. Change the page and the review stops counting | Any reader who trusts the reviewer |
| **Where did this statement come from?** | Pages point at the exact sentence, PDF page or moment in a video they rely on, and the originals travel inside the package. Every Reader checks each quoted sentence against the original | Anyone, offline |
| **Is it still in force?** | Pages and packages carry validity dates and review-by dates, and a newer package, signed by a publisher the reader trusts for the older one, can declare that it supersedes it. Search leaves out what is not in force or superseded | Applied by every Reader, at every search |
| **Is it meant for this audience?** | Each page has an audience, such as `public` or `internal`. The host's filter runs on every search, and a caller cannot widen it | Enforced by the host |
| **What did the answer use?** | Every result names the package digest and a versioned reference to the page. Log them with the answer | An auditor, at any time later |

All of this is in the citation record each search result comes back as
([consuming packages](guides/consuming.md#3-use-the-citation-record)), so an
application can show it: "Published by Acme. Reviewed by Sam Ortiz.
Quoted from the customer terms, section 7."

## Trust is the reader's decision

A signature only counts if the reader trusts the key or identity behind it. A
reader lists whom they trust, and for what, in a **trust root**; without one,
nothing is `signed` or `reviewed`. A package can never vouch for its own
signer ([your trust root](guides/consuming.md#your-trust-root)).

## Tampering is visible

Change one word in a signed package and the publisher's signature no longer
verifies, and the reviews of the changed page no longer count. Every Reader
reports it. The [walkthrough](walkthrough.md#9-see-what-tampering-looks-like)
shows it happen.

## For audit and regulated AI

To show which knowledge an assistant used, store the package digest and the
versioned page reference with every answer. Together they name the exact
text, independent of any index or service that may have changed since. Keep
the package file, and the answer can be checked against its source years
later ([use cases: audit and regulated AI](use-cases.md#audit-and-regulated-ai)).

## What it does not prove

A signature proves who published content, not that it is right, and a review
proves who checked it, not that they were correct. Package text is still
untrusted input to a model, whoever signed it: hand it to the model as quoted
reference material, never as instructions.

## Next

- [Signing and review](guides/signing-and-review.md): sign, review, verify,
  and change keys.
- [Authoring packages](guides/authoring.md#2-evidence-from-the-source-document):
  quote the sources a page relies on.
- [Attestations specification](../spec/moca-attestations.md): the formats and
  rules.
