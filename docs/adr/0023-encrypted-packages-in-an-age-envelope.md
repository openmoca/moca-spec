# 0023 — Encrypt packages in an age envelope

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Some packages must be unreadable without a key: confidential policies and
regulated material, or a copy meant for one licensee. Without a standard,
each host encrypts packages its own way, and an encrypted package stops being
portable. A Zip password is not adequate: ZipCrypto is broken, Zip AES leaves
file names visible and allows offline guessing, and neither can encrypt to
named people or to an organisation's keys. Proposal:
[moca-spec#5](https://github.com/openmoca/moca-spec/issues/5).

## Options

1. **age v1** around the whole `.moca` archive, in a Zip envelope with a
   plain marker and an optional outline.
2. **JWE or COSE.** One authentication tag over the whole payload, so large
   archives need a chunking and truncation scheme of our own. COSE
   encryption also has thin library support in .NET and Python.
3. **OpenPGP** (RFC 9580, SEIPDv2). Chunked AEAD and mature libraries, but
   legacy modes, key-management baggage and many options a Reader would have
   to refuse.
4. **A whole-file `.moca.age`, with no envelope.** Simpler, but a catalogue
   or library cannot show what a file is without the key.
5. **Encryption as a profile.** Not possible: a profile lives inside the
   package, and encryption wraps it.

## Decision

Option 1 ([encrypted packages](../../spec/moca-encrypted-package.md)). age
has authenticated 64 KiB chunks with a final-chunk flag, several recipients,
a passphrase recipient, a small frozen specification and a public test kit.

- **Sign, then encrypt.** Attestations are made over the plain package and
  verified after decryption. There are no plain attestations in the
  envelope.
- **A minimal outline.** A Producer may leave chosen manifest properties
  readable (by default `id`, `version` and `title`), and opt in to a copy of
  `structure.ttl`. Nothing signs the outline. It is unverified until the
  envelope is opened, then checked against the decrypted manifest. A
  separate signature over the outline would only say who wrapped the file.
- **Readers decrypt only.** They unwrap X25519 and scrypt recipients, run no
  age plugins, and pass other stanzas to the host's key provider as data.
- **A new `E` family that counts for validity.** A package that is not
  opened, or fails to open, is not valid, and nothing inside it is exposed.
- **An optional Reader feature, `encryption`.** Every Reader recognises an
  envelope; only Readers with the feature open one.

## Consequences

- An encrypted package from one host opens anywhere, given the key.
- Each Reader owns a small amount of decryption code. It is decrypt-only,
  gated on the C2SP age test kit.
- The plain parts are public: the marker, the outline, the structure copy if
  included, and the approximate size. age hides who the recipients are, but
  not how many there are.
- Encryption cannot withdraw access to a file already delivered, and anyone
  who can decrypt a package can copy its content.
- 0.6 Readers report `T002` on an envelope, since it has no `moca.json` at
  its root.

## What would change this decision

A flaw in age v1, or an adopter need that age cannot meet, such as a
recipient type a Reader must unwrap itself and age cannot carry as a stanza.
