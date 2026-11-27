# A course in two language editions

**Download** all four, since the course needs its editions and they need the
recipe card:
[`course-editions.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/course-editions.moca),
[`course-editions-english.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/course-editions-english.moca),
[`course-editions-french.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/course-editions-french.moca) and
[`course-editions-handout.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/course-editions-handout.moca),
from the [latest release](https://github.com/openmoca/moca-spec/releases/latest).

"Bread at home" is a short, original course written for this repository. The
school and both presenters are made up. It shows both ways to reach people in
more than one language, side by side. The guide
[Content in more than one language](../../docs/guides/languages.md) walks
through it and shows what a Reader returns.

| Folder | Package `id` | What it is |
| --- | --- | --- |
| `course/` | `https://example.com/moca/bread-course` | The composite: the course's entry point. Its `structure.ttl` holds the course, its two editions, and two topics both editions are filed under |
| `english/` | `https://example.com/moca/bread-course/en` | The English edition: three lessons and a reading order. Lesson 1 also has a French **translation**, `1-flour-water-salt.fr.md` |
| `french/` | `https://example.com/moca/bread-course/fr` | The French **edition**, made for French: two lessons, a different shape. Its lesson 1 covers what English lessons 1 and 2 cover |
| `handout/` | `https://example.com/moca/bread-course/handout` | The recipe card. Both editions list it as a member, pinned by its digest |

| What it shows | Where |
| --- | --- |
| A translation that repeats its original's `status` and `moca.concepts`, so it keeps its place on the reading order ([package spec §5.4](../../spec/moca-package-spec.md#54-locales)) | `english/content/lessons/1-flour-water-salt.fr.md` |
| The manifest's own text in French (§4.7) | `translations` in `english/moca.json` and `course/moca.json` |
| Two editions of different shape, filed under shared topics by node identifier (§5.6, §7.3) | `course/structure.ttl` |
| Files both editions use, in a package of their own (§7.1) | `handout/`, and `members` in each edition |
| A back-link from each edition to the course (§7.2) | `isPartOf` in `english/moca.json` and `french/moca.json` |
| A publisher signature on every package | each `attestations/` folder |

The signatures are made with the published, insecure example key in
`fixtures/signing-keys/`, which may sign only ids under `https://example.com/`.
Never trust that key for real content. Check the course with:

```sh
npx @openmoca/moca-lint lint examples/course-editions/course \
  --members examples/course-editions \
  --trust-root fixtures/signing-keys/trust-root.json
```

The pins and signatures are kept current by `npm run refresh:derived`.

## Licence

The course is under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
like the other examples.
