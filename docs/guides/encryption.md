# Encrypt a package

Some knowledge must not be readable by everyone who holds the file: internal
policies, regulated procedures, a course for one customer. An **encrypted
package** is a signed package inside an envelope that only the people or
systems you choose can open
([encrypted packages](../../spec/moca-encrypted-package.md)).

| Step | Who | Command |
| --- | --- | --- |
| Make a key pair | Each reader (a person, or a host such as a server) | `age-keygen` |
| Sign, then encrypt to the readers' public keys | The publisher | `moca-sign sign`, then `moca-sign encrypt` |
| Open it | The reader's Reader, with a key provider | `moca-lint --identity`, or `readPackage` in code |

The envelope uses [age](https://age-encryption.org) v1, a small, widely
reviewed file-encryption format. Any age tool can make the keys. This guide
encrypts the signed `support-kb` example from moca-spec. Every command and
output below was run with the 0.7.0 tools.

## 1. Make a key pair for each reader

The reader makes the key pair and sends you only the public key. The private
key never leaves the reader.

```sh
age-keygen -o reader.key
```

```text
Public key: age1…
```

`reader.key` holds the private key (`AGE-SECRET-KEY-1…`). Keep it as you would
any secret: in a secret store, never in a package or a repository.

## 2. Sign, then encrypt

Sign first, so the signature travels inside the envelope and a reader can
check who published the package after opening it
([signing and review](signing-and-review.md)). Then encrypt to one or more
public keys:

```sh
npx @openmoca/moca-sign encrypt support-kb -o support-kb.mocae -r age1…
```

```text
Wrote support-kb.mocae
sha256:4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da
outline: {"id":"https://example.com/moca/support-kb","version":"4.2.0","title":"Acme Support Knowledge Base"}
```

- Repeat `-r` for each reader, or list them in a file with `-R`. Each one can
  open the envelope on their own.
- The **outline** is the part anyone can read: by default the package's `id`,
  `version` and `title`, so a catalogue can list the file without a key.
  Choose other fields with `--outline`, or none with `--no-outline`.
  `--structure` and `--cover` leave the structure and the cover image
  readable too; both are public once you send the file.
- To state that the package is meant to travel only encrypted, set
  `"distribution": "encrypted-only"` in `moca.json` before you sign. It is a
  signed label, not a lock (package spec §4.1).

### A passphrase instead of keys

For a one-off exchange, encrypt to a passphrase. `moca-sign` reads it only
from an environment variable, never from the command line:

```sh
export MOCA_PASSPHRASE='…'
npx @openmoca/moca-sign encrypt support-kb -o shared.mocae --passphrase-env MOCA_PASSPHRASE
```

Keys are better for anything long-lived: a passphrase has to be shared, and
anyone who has it can open every file encrypted to it.

## 3. What a reader without the key sees

```sh
npx @openmoca/moca-lint info support-kb.mocae
```

```json
{
  "digest": null,
  "valid": false,
  "capabilities": [],
  "envelope": {
    "format": "moca-enc-v1",
    "opened": false,
    "outline": {
      "id": "https://example.com/moca/support-kb",
      "version": "4.2.0",
      "title": "Acme Support Knowledge Base"
    }
  },
  "nodes": [],
  "members": [],
  "attestations": [],
  "profiles": []
}
```

The outline, and nothing else. It is **unverified**: anyone could have written
it. A Reader checks it against the real manifest once the envelope is opened,
and refuses the package if they differ (`E004`).

## 4. Open it

With the tools, pass the identity file:

```sh
npx @openmoca/moca-lint lint support-kb.mocae --identity reader.key \
  --trust-root trust-root.json
```

```text
moca.json
  INFO LINT_TRANSLATION_MISSING  locale fr has no translation of the manifest's title and description

0 error(s), 0 warning(s), 1 info

sha256:4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da
capabilities: core, localized, located-evidence, reviewed, self-contained-evidence, signed
```

The digest and the capabilities are those of the signed package inside. With
no identity, `lint` reports `E001_ENCRYPTED_NO_KEY` and stops.

In code, the host gives the Reader two things: the age decryptor, and a
**key provider**, a function that returns the host's own key. Keys always come
from the host, never from the envelope or its outline. Decrypted bytes stay in
memory: the Reader never writes them to a file.

**TypeScript** (`@openmoca/moca-core`):

```js
import { readFileSync } from 'node:fs';
import { readPackage } from '@openmoca/moca-core';
import { ageDecryptor } from '@openmoca/moca-core/age';

// The host's own key: here an age identity file; in production, a secret store.
const identities = readFileSync('reader.key', 'utf8').split('\n').filter((l) => l.startsWith('AGE-SECRET-KEY-1'));

const pkg = await readPackage('support-kb.mocae', {
  decryptor: ageDecryptor,
  keyProvider: () => ({ identities }),
});
pkg.envelope; // { format: 'moca-enc-v1', opened: true }
```

**.NET** (`OpenMoca.Reader` with `OpenMoca.Reader.Age`):

```csharp
using OpenMoca.Reader;
using OpenMoca.Reader.Age;
using OpenMoca.Reader.Encryption;

// The host's own key: here an age identity file; in production, a secret store.
var identities = File.ReadAllLines("reader.key").Where(l => l.StartsWith("AGE-SECRET-KEY-1")).ToList();

var options = new ReadOptions
{
    EnvelopeDecryptor = AgeEnvelopeDecryptor.Instance,
    KeyProvider = (request, ct) => ValueTask.FromResult<EnvelopeKey?>(new EnvelopeKey(Identities: identities)),
};
var pkg = await MocaReader.ReadPackageAsync(PackageTarget.FromPath("support-kb.mocae"), options);
```

**Python** (`moca-reader`):

```python
from pathlib import Path

from moca_reader import read_package
from moca_reader.age import AGE_DECRYPTOR

# The host's own key: here an age identity file; in production, a secret store.
identities = [l for l in Path("reader.key").read_text().splitlines() if l.startswith("AGE-SECRET-KEY-1")]

pkg = read_package(
    "support-kb.mocae",
    decryptor=AGE_DECRYPTOR,
    key_provider=lambda request: {"identities": identities},
)
```

A key provider can also return a passphrase, and it is told which file is
being opened, so it can choose a key per package
([encrypted packages §5.1](../../spec/moca-encrypted-package.md#51-the-key-provider)).
Once opened, the package is searched and cited like any other.

A Producer that needs the plain archive back, for example to re-encrypt to a
new reader, uses `moca-sign decrypt`. It writes the decrypted `.moca` to disk,
which a Reader never does:

```sh
npx @openmoca/moca-sign decrypt support-kb.mocae -o support-kb.moca -i reader.key
```

## What encryption does not do

Encryption gives confidentiality only. It does not show who made the file:
anyone who holds a recipient's public key can make an envelope that recipient
will open. Who published a package comes only from its attestations, checked
after decryption. A host that opens envelopes from more than one source
should read with `requireSignature`.

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
  ([Reader contract §12](../../spec/moca-reader-contract.md#12-handing-content-to-a-model)).

## Copies for one licensee

A publisher can let an issuer mark each licensee's copy, so that a copy that
leaks can be recognised, while the copy still verifies as the publisher's
([attestations §3a](../../spec/moca-attestations.md#3a-issued-copy-attestations)).

1. The publisher allows it in `moca.json`, then signs:

   ```json
   "issuedCopies": {
     "issuers": [{ "publicKey": "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n" }],
     "paths": ["content/lessons/"]
   }
   ```

2. The issuer copies the package, changes the body text of files under those
   paths, and binds the copy to the original:

   ```sh
   npx @openmoca/moca-sign issue copy --original course --key issuer.pem --keyid issuer-2026
   ```

3. The issuer encrypts the copy to the licensee, as in step 2.

A reader's trust root must trust the issuer for the role `issued-copy`, with
`ids` that cover the package. Records from a changed file carry
`issuedChange`, so an application can tell the publisher's bytes from the
issuer's changes.

What this proves, and what it does not:

- The Reader proves that the copy differs from the publisher's package only in
  the listed files, all under `content/` or `media/`, and that the publisher
  allowed the issuer and the paths.
- It cannot prove that those files changed only by marks, or that the marked
  text means the same as the original. That is the issuer's assertion alone.
- Marks may let an issuer recognise a copy that leaks unaltered. They do not
  survive deliberate removal, especially by someone who compares two copies,
  and they are lost in paraphrase or extracted text. They identify a copy, not
  a person.
- The issuer keeps its own record of which copy went to whom. The copy names
  no one.

## Next

- [Encrypted packages](../../spec/moca-encrypted-package.md): the envelope,
  the outline check, the limits and the order of checks.
- [Signing and review](signing-and-review.md): sign before you encrypt.
- [Search and sidecar indexes](search-and-indexes.md): `moca-index build
  --envelope` writes an encrypted index into the envelope.
