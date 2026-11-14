# MOCA Encrypted Packages

Specification version: `0.7.0` (draft)
Status: Before `1.0.0`. A minor version may still change the format; each change is in [MIGRATIONS.md](../MIGRATIONS.md).
License: [Apache License 2.0](../LICENSE)

## 1. Scope

An **encrypted package** is a `.moca` archive inside an **envelope**: a Zip
file that holds the archive encrypted with
[age v1](https://c2sp.org/age), a plain format marker and an optional
outline. Once opened, it is that `.moca` archive. Every rule of the
[package specification](moca-package-spec.md) and the
[Reader contract](moca-reader-contract.md) then applies to it unchanged, and
it gives the same digest.

**Sign, then encrypt.** Attestations are made over the plain package, travel
inside the encrypted archive, and are verified after it is opened
([attestations §7](moca-attestations.md#7-verifying-an-attestation)).

This document binds Producers of envelopes, and Readers that implement the
optional feature `encryption`
([Reader contract §14](moca-reader-contract.md#14-demonstrating-conformance)).
Every Reader recognises an envelope (§2); a Reader without the feature
reports `E001_ENCRYPTED_NO_KEY` and opens nothing.

The reasons for this design, and the options rejected, are in
[ADR-0023](../docs/adr/0023-encrypted-packages-in-an-age-envelope.md).

## 2. Layout

An envelope is a Zip archive, conventionally named `<name>.moca.enc`. Every
archive rule and limit in
[Reader contract §3](moca-reader-contract.md#3-opening-a-package) applies to
it, with the same codes. It contains only these entries:

| Entry | Plain or encrypted | Required | Contents |
| --- | --- | --- | --- |
| `moca-enc.json` | Plain | Yes | The format marker and the optional outline (§3), valid against [`moca-enc.schema.json`](../schemas/v1/moca-enc.schema.json). |
| `package.age` | Encrypted | Yes | The `.moca` archive, encrypted with age v1 (§4). Stored, not deflated. |
| `outline/structure.ttl` | Plain | No | A byte-for-byte copy of the inner `structure.ttl` (§3). |
| `outline/cover.png`, `outline/cover.jpg` or `outline/cover.webp` | Plain | No | A byte-for-byte copy of the inner package's cover image (§3). At most one. |
| `index.age` | Encrypted | No | A sidecar index in its Zip form, encrypted with age v1 to the same recipients (§6). Stored, not deflated. |

- Directory entries are ignored.
- Any other entry, including a hidden one, makes the envelope invalid.
- So does a missing or repeated required entry, a `package.age` or
  `index.age` that is not stored, more than one cover copy, a cover copy
  larger than `maxImageBytes`, and a `moca-enc.json` that is not UTF-8
  JSON, repeats a member name, or fails its schema.
- All of these are `E005_ENVELOPE_INVALID` (error).

**Recognition.** A Reader recognises an envelope by its content, never by its
name: a Zip archive, given as a path or as bytes, with `moca-enc.json` at its
root and no `moca.json`. A Zip with both at its root is `E005`. A directory or
a host source is never an envelope: one without `moca.json` is `T002`, as
today.

## 3. The marker and the outline

```json
{
  "format": "moca-enc-v1",
  "outline": {
    "id": "https://example.com/moca/handbook",
    "version": "3.0.0",
    "title": "Staff handbook"
  }
}
```

- `format` is REQUIRED and is `moca-enc-v1`. Another value is `E005`. It
  changes only when this format breaks (§8).
- `outline` is OPTIONAL. It may carry any of these inner manifest properties,
  copied as JSON values: `id`, `version`, `title`, `description`, `language`,
  `license`, `publisher`, `mocaVersion`, `distribution`, `translations`,
  `tags`, `apps`. Any other property is `E005`.
- A Producer includes only what the publisher chooses. The default, and the
  minimum that tools write, is `id`, `version` and `title`. A Producer MAY
  write no outline at all.
- `outline/structure.ttl` is opt-in. It reveals the package's concept graph.
- `translations` and `tags` are opt-in, so a catalogue can show translated
  titles, descriptions, tags and `alt` text without the key. Tools never write
  them by default.
- `apps` is opt-in, so a catalogue can offer "Open with" before the envelope
  is opened. Tools never write it by default.

**The cover copy.** A Producer MAY leave a copy of the package's cover readable,
so a catalogue can show a picture before the envelope is opened. It is
opt-in, and tools never write it by default.

- It is a byte-for-byte copy of the file of the inner manifest's first
  `images` entry with role `cover`
  ([package spec §4.6](moca-package-spec.md#46-images)).
- Its extension gives the type a host may assume before opening: `.png` is
  `image/png`, `.jpg` is `image/jpeg`, `.webp` is `image/webp`. Any other
  `outline/cover.*` entry is `E005` (§2).
- It is unverified until the envelope is opened, like the outline. A host
  that shows it before opening SHOULD mark it as unverified.

**The outline is unverified until the envelope is opened.** Nothing signs it.
Before opening, a host MAY show it, and if it does it SHOULD mark it as
unverified. A Reader MUST NOT report `signed`, `reviewed`, signers or review
status for an envelope it has not opened.

**The outline check.** After decryption, the Reader compares each outline
property with the same property of the inner `moca.json`, as JSON values: the
same type; strings equal code unit for code unit; objects with the same
members, in any order; arrays with equal items in the same order. A property
in the outline that is absent from the manifest, or has another value, is
`E004_OUTLINE_MISMATCH` (error). So is an `outline/structure.ttl` that is not
byte-for-byte equal to the inner `structure.ttl`, or one present when the
inner file is not. So is a cover copy when the inner manifest has no `images`
entry with role `cover`, when the first such entry fails its checks
([package spec §4.6](moca-package-spec.md#46-images)), when the copy is not
byte-for-byte equal to that entry's file, or when its extension does not
match that entry's `type`.

## 4. Encryption

- **Format.** `package.age` and `index.age` are age v1 files
  ([C2SP age](https://c2sp.org/age)).
- **Recipients a Reader unwraps itself.** These are `X25519` and `scrypt`. A
  Reader that implements `encryption` MUST unwrap both, given an identity or
  a passphrase from the key provider (§5.1).
- **Other stanzas.** Any other stanza type is data. The Reader passes it to
  the key provider unchanged.
- **No plugins.** A Reader MUST NOT run age plugins or any other program
  ([Reader contract §4](moca-reader-contract.md#4-what-a-reader-must-never-do)).
- **Passphrase files.** age allows an `scrypt` stanza only as the single
  stanza of a file, so a passphrase file has exactly one recipient. Its
  strength is the passphrase's: it can be guessed offline.
- **Work factor.** An `scrypt` stanza names its own work factor (log2 N). A
  Reader MUST refuse one above `maxScryptWorkFactor`
  ([Reader contract §3](moca-reader-contract.md#3-opening-a-package)) without
  running scrypt.

## 5. Opening an envelope

### 5.1 The key provider

The host supplies a key provider with the read options
([Reader interface §3](moca-reader-interface.md#3-what-the-host-supplies)).
A Reader opens an envelope only through it, and never finds or fetches keys
itself.

```text
keyProvider(request) → result, or nothing; MAY be asynchronous
  request: { stanzas: [{ type, args: [string], body: bytes }], outline: object | absent, file: "package" | "index" }
  result:  { identities: [string] }   age X25519 secret keys ("AGE-SECRET-KEY-1…")
         | { passphrase: string }
         | { fileKey: bytes(16) }     a file key the host unwrapped itself
```

- The provider may be called once per encrypted entry.
- `E001_ENCRYPTED_NO_KEY` (error): there is no key provider, it returns
  nothing or throws, or it returns a kind of key that no stanza in the file
  uses (identities for a file with no `X25519` stanza, a passphrase for a
  file with no `scrypt` stanza).
- `E002_DECRYPTION_FAILED` (error): a key of a kind the file uses was
  supplied, but it failed. That covers identities that unwrap no stanza, an
  identity string that is not a valid `AGE-SECRET-KEY-1…` key, a wrong
  passphrase, and a header MAC that does not verify, including against a
  returned `fileKey`.
- An exception from the provider is never thrown to the caller.
- The outline in the request is unverified. A key provider SHOULD choose a
  key by stanza type and host configuration, not by the outline alone.
- A key provider MUST NOT contact, or send credentials to, an address taken
  from a stanza or the outline. Key routes come only from host configuration
  ([package spec §13.2](moca-package-spec.md#132-a-package-is-never-configuration)).

### 5.2 The order

A Reader that implements `encryption` opens an envelope in this order. The
first failure ends the read with its code.

1. **Outer archive.** Apply Reader contract §3 to the outer Zip (`T003`,
   `P001`–`P003`).
2. **Entries.** Check the entry set and `moca-enc.json` (§2, §3) (`E005`).
3. **age header.** Parse the header of `package.age`. A malformed or
   unsupported header, an `scrypt` stanza that is not alone, a work factor
   over the limit, a header over 64 KiB, or a payload nonce that is missing or
   shorter than 16 bytes is `E006_AGE_HEADER_INVALID` (error). So is an
   `X25519` share that is a low-order point (the shared secret is all zero),
   although it is found while unwrapping in step 4. The C2SP age test kit
   classes both as header failures.
4. **Key.** Call the key provider and unwrap (`E001`, `E002`).
5. **Header MAC.** Verify it (`E002`).
6. **Decrypt.** Decrypt and authenticate the whole payload, including the
   final chunk, before using any of it.
   - A failed chunk, a truncated stream or a missing final chunk is
     `E003_PAYLOAD_CORRUPT` (error), and no plaintext is used.
   - Decrypted bytes count against `maxBytes` as they are produced (`T003`).
7. **Inner archive.** Read the decrypted bytes as a `.moca` archive under
   Reader contract §3 and §5, with the same limits.
8. **Outline check.** Compare the outline (§3) (`E004`).
9. **Attestations.** Verify the inner `attestations/` (attestations §7).
10. **Results.** Derive capabilities and build the result.

A Reader that does not implement `encryption` runs steps 1 and 2, then
reports `E001`.

### 5.3 The result

An envelope's package result has an `envelope` field
([Reader interface §4](moca-reader-interface.md#4-reading)):

- **Opened:** the inner package's normal result, with its digest, plus
  `envelope: { format, opened: true }`. Validity and capabilities are the
  inner package's.
- **Not opened** (any failure in steps 1–8): `valid: false`, and
  `envelope: { format, opened: false, outline }`. `format` and `outline` are
  those of a valid `moca-enc.json`, and absent otherwise. There is no
  manifest, digest, node, member, capability or attestation result. Nothing
  from the inner archive is exposed. Diagnostics from steps 7 and 8 are
  reported; the inner archive's content is not.

The `E` family makes a package invalid
([Reader contract §11](moca-reader-contract.md#11-diagnostics)). `encrypted`
is not a capability: capabilities describe what a package contains, and every
one needs `core`.

### 5.4 What stays in memory

- A Reader MUST NOT itself write decrypted bytes to any file, including
  temporary files. It holds them in memory.
- Each Reader's own tests check this by reading an envelope with a temporary
  directory it cannot write to. The corpus cannot observe it.
- Swap, crash dumps, caches and the stores a host feeds are outside the
  Reader's control (§7).

## 6. Derived data

Indexes and embeddings can reveal content, and embeddings can be partly
turned back into text.

- A Producer that builds a sidecar index for an encrypted package SHOULD put
  it in the envelope as `index.age`, encrypted to the same recipients. Only
  the Producer knows the recipients; a Reader holding one identity cannot
  learn the others.
- A Reader binds `index.age` only to the package result of the same envelope,
  once that envelope is opened, through the same key provider (with `file:
  "index"`) and steps 3–6 of §5.2. A failure is reported by the binding, with
  its `E` code, and makes the sidecar unusable. It does not change the
  package's validity. The decrypted index is then bound as any sidecar
  ([sidecar specification §5](moca-sidecar-index-spec.md#5-binding-and-staleness)).
- A host SHOULD keep indexes it builds itself, and chats, summaries, traces
  and store records made from an encrypted package, encrypted at rest.

## 7. Security considerations

**Encryption gives confidentiality only.** It does not show who made the
file. Anyone who holds a recipient's public key can make an envelope that
recipient will open. Any recipient of a file can make a new file that the
other recipients will open. Provenance comes only from attestations verified
after decryption. A host that opens envelopes from more than one source
SHOULD read with `requireSignature`.

**What encryption does not do:**

- Anyone who can decrypt a package can copy its content, re-encrypt it to
  anyone, or remove the envelope.
- Removing `distribution` from a decrypted copy changes the digest, so the
  publisher's signature no longer verifies. The copy is still readable
  unsigned.
- The plain part is public: `moca-enc.json`, the outline if any,
  `outline/structure.ttl` and the cover copy if included, and the
  approximate size of the package.
- age hides who the recipients are, but not how many there are.
- age cannot withdraw access to a file already delivered. Removing a
  recipient means a new file. Copies already held stay readable.
- Content shown on a screen or sent to a model is plain on that device
  ([Reader contract §12](moca-reader-contract.md#12-handing-content-to-a-model)).

**Parsing.** The envelope, its marker, the age header and the decrypted
archive are untrusted input. The limits in Reader contract §3 apply to each,
and the work-factor limit bounds the cost of a passphrase before any is
spent.

## 8. Versioning

| Marker | Where | Changes when |
| --- | --- | --- |
| `moca-enc-v1` | `format` in `moca-enc.json` | The envelope layout, the marker or the outline rules change incompatibly. |
| age `v1` | The header line of `package.age` and `index.age` | Set by age, not by this document. |

A Reader that meets another `format` reports `E005`.
