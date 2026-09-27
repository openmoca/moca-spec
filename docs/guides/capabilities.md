# Capabilities

MOCA has no conformance levels. A Reader reports the capabilities a package
actually has ([package spec §11](../../spec/moca-package-spec.md#11-capabilities)).
Pick the ones your use needs.

| Capability | What it gives you | What it costs to author |
| --- | --- | --- |
| `core` | Identity, version, digest, OKF content, citation records. | A manifest and a `type` on each node. |
| `located-evidence` | Answers that cite the exact sentence, page or timestamp of a source. | `sources` with ids, and `moca.evidence` selectors. |
| `self-contained-evidence` | The originals travel inside the package; each quote is checked against them, offline. | Put cited files under `sources/` or `media/`, and cite them by package path. |
| `localized` | One node in several languages. | `locales` and `<name>.<tag>.md` files. |
| `composed` | Reproducible assembly from other packages. | `members` pinned by digest. |
| `signed` | Readers can verify who published. | A package attestation, ideally from CI with Sigstore. |
| `reviewed` | Readers can verify who checked which node. | Review attestations from reviewers. |
| `skills` | Agent Skills shipped with the knowledge they use. | `skills/` plus a package attestation. |
| `ontology` | Nodes bound to a shared vocabulary; search by concept. Defined by the [ontology profile](../../profiles/ontology/moca-ontology-profile.md). | A Turtle concept scheme under `ontologies/`, and concept bindings on nodes. |

`signed`, `reviewed` and `skills` depend on the reader's trust root. The same
package can be `signed` for one host and not for another. `ontology` is
reported only by Readers that implement the ontology profile.

## Suggested starting points

| Situation | Capabilities |
| --- | --- |
| One team, internal assistant | `core` |
| Content shared with another team or organisation | `core`, `signed` |
| Regulated or high-stakes answers | `core`, `signed`, `reviewed`, `located-evidence`, `self-contained-evidence` |
| Knowledge migrated to another platform or read on a device with no network | add `self-contained-evidence` |
| A handbook or product line assembled from parts | add `composed` |
