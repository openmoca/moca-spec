## Summary

<!-- What does this PR change and why? -->

## Related issue

<!-- Link the spec-change/profile-proposal/bug issue this PR resolves, if any -->

## Checklist

- [ ] If this changes `moca-core-spec.md` or `moca-education-profile.md`,
      the corresponding `schemas/` were updated to match.
- [ ] If this changes `schemas/`, all packages under `examples/` still
      validate (`npx ajv-cli validate -s schemas/core/moca.schema.json -d
      "examples/*/moca.json"`).
- [ ] If this adds/changes an example package containing `skills/`, it
      includes a structurally valid `signature` object (cryptographic
      verification is not implemented in the beta, see core §8.2).
- [ ] No new example introduces the properties excluded by core §5.3
      (`endpoints`, `settings`, `credentials`, `apiKeys`).
- [ ] Markdown links resolve.
