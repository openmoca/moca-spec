# application/vnd.openmoca.envelope+zip

The registration template for the `.mocae` envelope that carries an
encrypted package
([package spec §12.1](../../spec/moca-package-spec.md#121-media-types),
[encrypted packages](../../spec/moca-encrypted-package.md)).

```text
Type name: application
Subtype name: vnd.openmoca.envelope+zip
Required parameters: N/A
Optional parameters: N/A
Encoding considerations: binary
Security considerations:
  An envelope is a Zip archive holding a package archive encrypted with
  age v1 to X25519 recipients or a passphrase, a plain format marker, and an
  optional plain outline. Encryption gives confidentiality only: it does not
  show who made the file, and provenance comes from attestations verified
  after decryption. The plain parts are public: the marker, the outline and
  the approximate size of the package; age hides who the recipients are but
  not how many there are. The envelope, its marker, the age header and the
  decrypted archive are untrusted input. The specification bounds the
  decrypted size before decrypting and the scrypt work factor before any is
  spent, and a reader never writes decrypted bytes to a file (encrypted
  packages §5 and §7, Reader contract §3).
Interoperability considerations:
  A Zip archive (PKWARE APPNOTE) with moca-enc.json at its root, and only the
  entries the specification lists. Once opened, the archive inside is an
  application/vnd.openmoca.package+zip archive with the same digest. Readers
  recognise an envelope from its content, not from this type or the file
  name; files named with the earlier double extension .moca.enc are read
  the same way.
Published specification:
  MOCA Encrypted Packages, version 0.7.0, section 2, and MOCA Package
  Specification, version 0.7.0, section 12.1,
  https://github.com/openmoca/moca-spec/blob/v0.7.0/spec/moca-encrypted-package.md
Applications that use this media type:
  Readers and signing tools that open or write encrypted packages of
  knowledge content.
Fragment identifier considerations: None defined.
Additional information:
  Deprecated alias names for this type: N/A
  Magic number(s): 50 4B 03 04 at offset 0 (Zip local file header); the
    archive has a moca-enc.json entry at its root
  File extension(s): .mocae
  Macintosh file type code(s): N/A
Person & email address to contact for further information:
  OpenMOCA maintainers <hello@openmoca.org>
Intended usage: COMMON
Restrictions on usage: None.
Author: OpenMOCA project
Change controller: OpenMOCA project
```
