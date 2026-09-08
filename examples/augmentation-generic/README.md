# Generic Archive Augmentation Example

This package demonstrates the sidecar augmentation pattern from
[core §9](../../spec/moca-core-spec.md#9-sidecar-augmentation-pattern-augmentation)
on its own — no profile declared, no education-specific concepts. Core
frames augmentation as domain-agnostic: a document repository, video
archive, wiki export, or support-ticket corpus are all equally valid
targets.

This is a first-class MOCA usage pattern in its own right, not a lesser or
secondary case relative to [../augmentation-scorm2004](../augmentation-scorm2004),
which layers the education profile's courseware-specific `targetType`
conventions on top of the same core mechanism.

No `raw/external-content.zip` is included in this fixture — the manifest
demonstrates the `augmentation` block shape, not a runnable archive.
