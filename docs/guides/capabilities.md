# Capabilities

MOCA has no conformance levels. A Reader reports the capabilities a package
actually has ([package spec §11](../../spec/moca-package-spec.md#11-capabilities)).
Pick the ones your use needs.

| Capability | What it gives you | What it costs to author |
| --- | --- | --- |
| `core` | Identity, version, digest, OKF content, citation records. | A manifest and a `type` on each node. |
| `located-evidence` | Answers that cite the exact sentence, page or timestamp of a source. | `sources` with ids, and `moca.evidence` selectors. |
| `localized` | One node in several languages. | `locales` and `<name>.<tag>.md` files. |
| `composed` | Reproducible assembly from other packages. | `members` pinned by digest. |
| `signed` | Readers can verify who published. | A package attestation, ideally from CI with Sigstore. |
| `reviewed` | Readers can verify who checked which node. | Review attestations from reviewers. |
| `skills` | Agent Skills shipped with the knowledge they use. | `skills/` plus a package attestation. |

`signed`, `reviewed` and `skills` depend on the reader's trust root. The same
package can be `signed` for one host and not for another.

## Suggested starting points

| Situation | Capabilities |
| --- | --- |
| One team, internal assistant | `core` |
| Content shared with another team or organisation | `core`, `signed` |
| Regulated or high-stakes answers | `core`, `signed`, `reviewed`, `located-evidence` |
| A handbook or product line assembled from parts | add `composed` |
