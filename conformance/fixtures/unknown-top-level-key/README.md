# Unknown top-level key

Exercises core §5.6: a consumer encountering unknown top-level manifest fields
MUST ignore them rather than reject the package, provided the required fields
for its conformance level are present and valid.

The manifest carries two keys the core schema does not define:

- `futureField` — stands for a field added by a later specification revision.
- `x-acme-tenant-id` — a vendor extension, covered separately by §12's
  `x-<vendor>-<key>` convention and by the schema's `patternProperties`.

The package must validate cleanly. A consumer that rejects it is not
forward-compatible, which is the property that lets a package outlive the
tooling that produced it.
