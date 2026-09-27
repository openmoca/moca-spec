## Summary

<!-- What does this change, and why? -->

## Related issue

<!-- The spec-change, profile or bug issue this resolves. -->

## Checklist

- [ ] `npm test` passes.
- [ ] A normative change updates prose, schema, the reference Reader and
      conformance cases together.
- [ ] New or changed diagnostic codes are in `tools/moca-core/lib/codes.js` and
      the Reader contract §10 table, with a conformance case.
- [ ] Derived artifacts were regenerated with `npm run refresh:derived`, not
      edited by hand.
- [ ] CHANGELOG.md is updated; MIGRATIONS.md too if anything breaks.
