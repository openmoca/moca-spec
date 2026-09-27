# Composed handbook

`handbook/` has no content of its own. It lists two chapter packages as
`members`, each pinned by its canonical digest, so the handbook's own digest
fixes exactly which chapter bytes it contains.

A Reader resolves members through a host-supplied resolver and refuses a
member whose digest does not match its pin:

```sh
node tools/moca-lint/bin/moca-lint.js lint examples/handbook/handbook --members examples/handbook
```

The pins are kept current by `npm run refresh:derived`.
