# application/vnd.openmoca.package+zip

The registration template for the `.moca` package archive
([package spec §12.1](../../spec/moca-package-spec.md#121-media-types)).

```text
Type name: application
Subtype name: vnd.openmoca.package+zip
Required parameters: N/A
Optional parameters: N/A
Encoding considerations: binary
Security considerations:
  A package is untrusted input. Its content is data: a reader never executes
  anything it contains. Archive entry names can be hostile (absolute paths,
  "..", names that collide after Unicode normalisation or case folding), and
  sizes can be hostile (decompression bombs). The specification requires a
  reader to reject such entries and to bound entries, uncompressed bytes,
  members and other work (Reader contract §3, package spec §6.3 and §13).
  Integrity and origin are given by a SHA-256 package digest and optional
  DSSE or Sigstore attestations, verified against a trust root the reader
  chooses. The type gives no confidentiality; a confidential package is
  carried in an envelope (application/vnd.openmoca.envelope+zip).
Interoperability considerations:
  A Zip archive (PKWARE APPNOTE) with moca.json at its root. The same package
  can be stored as a directory; both forms give the same digest. Readers
  recognise the archive from its content, not from this type or the file
  name.
Published specification:
  MOCA Package Specification, version 0.7.0, sections 12 and 12.1,
  https://github.com/openmoca/moca-spec/blob/v0.7.0/spec/moca-package-spec.md
Applications that use this media type:
  Readers, converters, signing and indexing tools, and applications that
  search and cite packaged knowledge content.
Fragment identifier considerations: None defined. A node in a package is
  cited by its node identifier, not by a fragment of the file's URL.
Additional information:
  Deprecated alias names for this type: N/A
  Magic number(s): 50 4B 03 04 at offset 0 (Zip local file header); the
    archive has a moca.json entry at its root
  File extension(s): .moca
  Macintosh file type code(s): N/A
Person & email address to contact for further information:
  OpenMOCA maintainers <hello@openmoca.org>
Intended usage: COMMON
Restrictions on usage: None.
Author: OpenMOCA project
Change controller: OpenMOCA project
```
