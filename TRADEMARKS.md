# OpenMOCA trade mark policy

OpenMOCA is an open standard. Anyone may use, change and share its spec and code under the Apache License 2.0. That licence covers the code and text, not the name: section 6 of the licence grants no rights to use trade marks.

This policy covers the name. It exists for one reason: so that when something says "OpenMOCA", people can trust that it means the real standard, read the same way. We want the name used widely, and most uses need no permission at all.

## The marks

- The word **OpenMOCA**.
- The OpenMOCA logo (the outline mark used on openmoca.org).

These are held by PI & Mash Solutions Ltd (PI & Mash), which maintains the project. The word mark is the subject of UK trade mark application UK00004468246, filed on 31 October 2026. The logo is not registered. Until the word mark is registered, write OpenMOCA™, not ®.

**MOCA** on its own is the name of the format (Modular Ontology, Content & Attestation). Use it freely to describe the format: "a MOCA package", "a `.moca` file", "MOCA support". This policy does not restrict that use.

PI & Mash's product names, such as MOCA Hub, are not part of the open project and are not covered by this policy.

## Uses that need no permission

You may, without asking:

- **Refer to the project.** In articles, talks, books, courses, videos, social media and academic work.
- **Say what your software does.** "Reads OpenMOCA packages", "works with OpenMOCA", "supports OpenMOCA 0.4", "an OpenMOCA Reader for Rust".
- **Name a library or tool descriptively**, as long as your own name comes first or the name makes it clear it is not ours: "acme-moca-reader", "OpenMOCA plugin for Obsidian by Acme". Don't use a name that looks official, such as "OpenMOCA Reader" alone.
- **Share the project unchanged.** Copies of the spec, code or packages, unchanged, under the OpenMOCA name.
- **Run community groups and events** about OpenMOCA, such as meetups or online groups, as long as you make it clear they are not run by the project.
- **Use the logo** to link to openmoca.org or to show that your software works with OpenMOCA, unchanged, and no larger or more prominent than your own name. The Commitment mark is only for listed products (below).

## OpenMOCA Conformant and the OpenMOCA Commitment

There are two public listings on openmoca.org, one for software and one for apps people use
([ADR-0039](docs/adr/0039-a-conformance-programme-and-an-implementations-registry.md)). Neither is a registered trade
mark; this policy covers how the OpenMOCA name is used with them.

### OpenMOCA Conformant: for software

The standard is only useful if every Reader reads a package the same way. You may say your software is **"OpenMOCA
Conformant"** only if:

1. It passes the OpenMOCA test suite for what it is (a Reader, a Producer, a linter, or another kind with its own
   suite), for the spec version you name, and
2. Your claim names the kind and the version, for example "OpenMOCA 0.7 Conformant Reader", and
3. You keep the claim true: if a later release of your software fails that suite, update or remove the claim.

You run the suite yourself. There is no fee and no application. Publish the signed result and ask us to list it, and
your software is listed as **Self-tested**. The project's own software is listed as **Official**, and software whose
result we have re-run ourselves as **Verified**. We may ask you to show a passing run, and we remove a listing or ask
you to remove a claim that is not true.

### The OpenMOCA Commitment: for apps

A company may say a product makes **"the OpenMOCA Commitment"**, and show the Commitment mark in it, only if:

1. It has published a signed statement that the named product and version honours creators' and people's rules, as
   [COMMITMENT.md](COMMITMENT.md) sets out, and
2. That statement is listed on openmoca.org, and
3. The statement covers the version people are using; a new version needs a new statement.

We do not test the Commitment. It is the company's own signed promise, and people and creators can hold the company to
it. We remove a listing that is withdrawn or shown to be untrue, and the mark may then no longer be shown.

## Uses that need permission

Ask us first if you want to:

- Use OpenMOCA in the name of a company, product, service or domain name (for example "OpenMOCA Cloud" or "openmoca-hosting.com").
- Suggest that we endorse, certify or partner with you, beyond the two listings above. Neither listing is an
  endorsement or a certification.
- Change the logo, or combine it with your own logo.
- Sell goods carrying the name or logo, such as merchandise.

Ask at [hello@openmoca.org](mailto:hello@openmoca.org). We aim to reply within two weeks, and to say yes where the use is honest and won't confuse people.

## Uses that are not allowed

- **Changed versions under our name.** If you fork or change the spec or code, you may do so under the licence, but give it a different name. You may say it is "based on OpenMOCA".
- **Conformance claims or Commitments that are not true**, that leave out the spec version or the kind of software,
  or that are shown without a listing.
- **Confusing or misleading use**, including any use that suggests your software, service or content comes from the OpenMOCA project when it does not.
- **Use with unlawful or harmful content.**

## Package names and scopes

The `@openmoca` scope on npm, the `OpenMoca.Reader` packages on NuGet, the `moca-reader` packages on PyPI and the `openmoca` GitHub organisation belong to the project. Please don't publish under names that could be confused with them.

## Who holds the marks

PI & Mash Solutions Ltd holds the marks on behalf of the project and applies this policy fairly to everyone, including its own products. The spec is governed independently of any one company (see [GOVERNANCE.md](GOVERNANCE.md)). If adoption grows, we will consider moving the marks to a neutral foundation, as other open standards have done.

## Changes

We may update this policy. Changes are made in the open, in the moca-spec repository, with notice in the changelog. A change does not take away a use that was allowed when you started it, unless that use has become confusing or misleading.

This policy draws on the approach of the Linux Foundation, the Python Software Foundation and the Cloud Native Computing Foundation. It is not legal advice.
