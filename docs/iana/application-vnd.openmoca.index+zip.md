# application/vnd.openmoca.index+zip

The registration template for the `.moca.idx.zip` sidecar index, served beside
the package it indexes
([package spec §12.1](../../spec/moca-package-spec.md#121-media-types),
[sidecar index](../../spec/moca-sidecar-index-spec.md)).

```text
Type name: application
Subtype name: vnd.openmoca.index+zip
Required parameters: N/A
Optional parameters: N/A
Encoding considerations: binary
Security considerations:
  A sidecar index holds search chunks and, optionally, vectors derived from
  one package, and is bound to it by the package's SHA-256 digest. It is not
  authenticated: binding shows it was built for the package, not that it was
  built honestly, so its spans and vectors can steer ranking; its chunk text
  must equal the package's own bytes. It is untrusted input under the same
  archive rules and limits as a package (Reader contract §3). It reveals
  content derived from the package, so the index of an encrypted package is
  carried inside the envelope instead (sidecar index §5.2).
Interoperability considerations:
  A Zip archive (PKWARE APPNOTE) with index.json at its root. The same index
  can be stored as a directory. Readers recognise it from its content, not
  from this type or the file name.
Published specification:
  MOCA Sidecar Index Specification, version 0.7.0, section 2, and MOCA
  Package Specification, version 0.7.0, section 12.1,
  https://github.com/openmoca/moca-spec/blob/v0.7.0/spec/moca-sidecar-index-spec.md
Applications that use this media type:
  Readers and indexing tools that search packaged knowledge content.
Fragment identifier considerations: None defined.
Additional information:
  Deprecated alias names for this type: N/A
  Magic number(s): 50 4B 03 04 at offset 0 (Zip local file header); the
    archive has an index.json entry at its root
  File extension(s): .moca.idx.zip
  Macintosh file type code(s): N/A
Person & email address to contact for further information:
  OpenMOCA maintainers <hello@openmoca.org>
Intended usage: COMMON
Restrictions on usage: None.
Author: OpenMOCA project
Change controller: OpenMOCA project
```
