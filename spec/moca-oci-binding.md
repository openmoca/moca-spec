# MOCA OCI Binding

Specification version: `0.2.0-alpha.1`
Status: Alpha, draft binding. No reference tooling yet.
License: [Apache License 2.0](../LICENSE)

## 1. Scope

MOCA does not define a registry. This binding says how to store and
distribute packages in any OCI registry, so that hosts that want distribution
and version lookup get them from infrastructure they already run. A folder or a
`.moca` file remains a complete package; the registry is optional.

## 2. Artifact

A package version is one OCI image manifest:

| Part | Value |
| --- | --- |
| `artifactType` | `application/vnd.moca.package.v1` |
| `config` | The empty descriptor (`application/vnd.oci.empty.v1+json`). |
| `layers` | One layer: the `.moca` archive, media type `application/vnd.moca.package.layer.v1+zip`. |
| Annotations | `org.opencontainers.image.title` = `title`; `org.opencontainers.image.version` = `version`; `org.w3id.moca.id` = `id`; `org.w3id.moca.digest` = the package digest. |

The repository name is the publisher's choice. Tags SHOULD equal `version`.

## 3. Two digests

The OCI manifest digest identifies the registry object; the MOCA digest
identifies the package content. They are different, and MOCA only ever relies
on its own:

- Member pins, sidecar bindings and package attestations use the MOCA digest.
- After pulling, a Reader MUST compute the MOCA digest from the archive and
  compare it with what it expected (a member pin, a lockfile, the annotation
  it trusted). The annotation alone proves nothing.

Re-pushing the same package with a different archive (different compression or
entry order) changes the OCI digest but not the MOCA digest.

## 4. Attestations

Attestations stay inside the archive under `attestations/`, so a pulled package
carries them. A publisher MAY also attach the same envelopes as OCI referrers,
with artifact type `application/vnd.dev.sigstore.bundle.v0.3+json` for
Sigstore bundles or `application/vnd.moca.attestation.dsse.v1+json` for DSSE
envelopes, so that registry-side policy can see them. The statement's subject is
still the MOCA digest. A cosign signature over the OCI manifest is a separate,
registry-level statement; it is not a MOCA package attestation.

## 5. Resolving members

A host resolver MAY map a member `{ id, version, digest }` to a registry
reference (for example by a host-maintained table from `id` to repository and
the `version` tag), pull it, and hand the archive to the Reader. The Reader
checks the pinned digest ([package spec §7.1](moca-package-spec.md#71-members)),
so a compromised or mistaken registry cannot substitute content.

## 6. Example

With [ORAS](https://oras.land/):

```sh
node tools/moca-lint/bin/moca-lint.js pack examples/support-kb -o support-kb.moca
DIGEST=$(node tools/moca-lint/bin/moca-lint.js digest support-kb.moca)
oras push registry.example.com/acme/support-kb:4.2.0 \
  --artifact-type application/vnd.moca.package.v1 \
  --annotation "org.w3id.moca.id=https://example.com/moca/support-kb" \
  --annotation "org.w3id.moca.digest=$DIGEST" \
  support-kb.moca:application/vnd.moca.package.layer.v1+zip
```

## 7. Open questions

- The media types are not registered with IANA. Registration is only needed if
  they are used beyond OCI registries.
- Reference tooling (`moca-lint push`/`pull`) is on the roadmap.
