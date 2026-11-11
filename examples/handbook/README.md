# Composed handbook

**Download** all three, since the handbook needs its chapters:
[`handbook.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/handbook.moca), [`handbook-incident-response.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/handbook-incident-response.moca) and
[`handbook-service-ownership.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/handbook-service-ownership.moca), from the [latest release](https://github.com/openmoca/moca-spec/releases/latest).

`handbook/` has no content of its own. It lists two chapter packages as
`members`, each pinned by its canonical digest, so the handbook's own digest
fixes exactly which chapter bytes it contains.

A Reader resolves members through a host-supplied resolver and refuses a
member whose digest does not match its pin:

```sh
npx @openmoca/moca-lint lint examples/handbook/handbook --members examples/handbook
```

The pins are kept current by `npm run refresh:derived`.
