# Protected sources: package them sealed, or as references

Some sources shouldn't sit in a package as plain text: a password-protected
PDF, a members' newsletter, a paid course. Others you may only point to,
because you have no right to copy them. MOCA handles both without new
machinery. This guide shows the two routes and when to use each.

**Don't put content only in a sidecar index.** A sidecar's chunk text must
match the signed node files byte for byte
([sidecar specification §4](../../spec/moca-sidecar-index-spec.md#4-the-moca-jsonl-v1-payload)),
and the sidecar sits outside the package's digest. Content that lived only in
an index would carry no signature, so nobody could check a quote against
what the publisher signed.

## Route 1: sealed

Use this when you may copy the content, but only for the people you choose.

1. **Turn the source into nodes.** Extract the text of the PDF (or the
   newsletter, or the course pages) into concept documents under `content/`,
   one per section, as you would for any package
   ([authoring](authoring.md)).
2. **Point each node back to the original.** Give each node a `sources`
   entry for the original file or page, with evidence that names the page
   (a PDF page selector), so a citation can say "page 12 of the original".

   ```yaml
   ---
   type: Section
   title: Refund eligibility
   sources:
     - id: handbook
       resource: https://example.org/members/handbook-2026.pdf
   moca:
     evidence:
       - source: handbook
         selector:
           type: FragmentSelector
           value: page=12
           conformsTo: http://tools.ietf.org/rfc/rfc3778
   ---
   ```

   The original stays outside the package, so the page is a pointer, not a
   checked quote ([package spec §5.3](../../spec/moca-package-spec.md#53-the-moca-mapping)).

3. **Say how it should travel.** Set `distribution: encrypted-only` in
   `moca.json`, and the creator's terms (`terms`), for example
   `rights.export.allowed: false` if the text shouldn't be copied out of an
   app.
4. **Sign, then encrypt.** Sign the package, then seal it in an envelope to
   the readers' keys or a passphrase ([encryption](encryption.md)). Build the
   sidecar index before sealing, and encrypt it into the envelope as
   `index.age` for the same recipients
   ([encrypted packages §6](../../spec/moca-encrypted-package.md#6-derived-data)).
5. **Choose what stays plain.** The envelope may carry an outline: the title,
   the structure and a cover. That lets a catalogue list the package without
   opening it. Leave out anything you'd rather not show.

What you get: search and quotes checked against the signed text, for exactly
the people who hold a key. What you don't get: protection from a reader who
copies what they opened ([encrypted packages §7](../../spec/moca-encrypted-package.md#7-security-considerations)).

## Route 2: as references

Use this when you may only point to the source.

A **reference node** is an ordinary concept document whose body holds no
copied text. It gives the link, the structure and, if you like, a summary in
your own words:

```yaml
---
type: Reference
title: Annual report 2026
description: The company's annual report, with its accounts and the chair's letter.
resource: https://example.org/reports/annual-2026.pdf
---
```

- The only required frontmatter is a non-empty `type`
  ([package spec §5.1](../../spec/moca-package-spec.md#51-an-okf-bundle));
  the body may be empty, or hold your own summary.
- OKF `resource` is the original. An app shows "Open the original" and opens
  it in the person's browser or app, never fetching it for them.
- Search finds the title, description and summary. An answer can say what the
  source is and where to find it, but it can't quote it, and it should say so.
- Mark a summary you had a machine write with OKF `generated`.

## Which route?

| You may... | Use |
| --- | --- |
| Copy the content, for chosen people | Sealed |
| Copy it for everyone | An open package |
| Only link to it | References |
| Copy some parts, link to others | Both, in one package: sealed if any part is sealed |

## Next

- [Encrypt a package](encryption.md)
- [Search and sidecar indexes](search-and-indexes.md)
- [Encrypted packages](../../spec/moca-encrypted-package.md): delivery routes
  and what each protects (§7).
