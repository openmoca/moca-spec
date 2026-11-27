# Content in more than one language

A work can reach people in more than one language in two ways.

- **The same content, translated.** When the French is the English, said in
  French, put it beside the English: `lesson.fr.md` is the French
  **representation** of `lesson.md`. It is the same node, and a Reader picks it
  for a French reader
  ([package spec §5.4](../../spec/moca-package-spec.md#54-locales)).
- **A work made for one language.** When the French has its own presenter,
  slides or order, it is its own work. Make it its own package, a **language
  edition**, and put the editions in one composite package for the course or
  the series ([package spec §7.3](../../spec/moca-package-spec.md#73-composite-packages)).

Files both editions use, such as a recipe card or a PDF, go in a package of
their own. Each edition lists it as a member, pinned by its digest
([package spec §7.1](../../spec/moca-package-spec.md#71-members)), so both
point at exactly the same bytes.

This guide describes OpenMOCA 0.7.0 as it is. It gives a recipe for each way
of using more than one language, says what a Reader does with it today, and
says plainly where the format stops and what to do instead. The
[worked example](#worked-example-a-course-in-two-editions) at the end builds
a course in two editions, signs it, and asks a Reader for it in English and in
French.

"Language edition" is plain English here, not a term the specification
defines: to a Reader, an edition is a package like any other.

## Contents

| If you have | Read |
| --- | --- |
| A page and its translation | [Translated text](#translated-text) |
| Some pages translated, others not | [Partly translated](#partly-translated) |
| A video or podcast voiced again in another language | [Dubbed media](#dubbed-media) |
| Slides in one language and speech in another | [Slides in one language, speech in another](#slides-in-one-language-speech-in-another) |
| A page in two languages at once: a phrasebook, a parallel text | [A bilingual page](#a-bilingual-page) |
| A course that teaches a language | [Teaching a language](#teaching-a-language) |
| Terms and their names in each language | [A glossary in each language](#a-glossary-in-each-language) |
| A course or series re-made for another language | [A language edition](#a-language-edition) |
| Editions with different lessons or a different order | [Editions that differ in shape](#editions-that-differ-in-shape) |
| One item, such as a playlist, in two editions | [One item in several editions](#one-item-in-several-editions) |
| An edition that comes out later | [An edition published later](#an-edition-published-later) |
| A part only one edition has | [A part in one edition only](#a-part-in-one-edition-only) |
| Every language in one signed file | [One package holding every language](#one-package-holding-every-language) |
| An easy-read or plain-language version | [Easy-read versions](#easy-read-versions) |
| Sign language | [Sign language](#sign-language) |
| Captions in several languages | [Translated captions](#translated-captions) |
| A transcript in the spoken language and translated captions | [Transcript and translated captions](#transcript-and-translated-captions) |
| Audio description | [Audio description](#audio-description) |
| Arabic, Hebrew, Persian, Urdu | [Right-to-left scripts](#right-to-left-scripts) |
| `pt-BR` and `pt-PT`, `en-US` and `en-GB` | [Regional variants](#regional-variants) |
| `sr-Latn` and `sr-Cyrl`, `zh-Hans` and `zh-Hant` | [Script variants](#script-variants) |
| A translation someone else made | [A translation by someone else](#a-translation-by-someone-else) |
| A translation under a different licence | [A translation with different rights](#a-translation-with-different-rights) |
| An app that translates as it answers | [Translating on the fly](#translating-on-the-fly) |
| Questions in one language, content in another | [Questions across languages](#questions-across-languages) |

Before you start, read [today's limits](#todays-limits): five rules that
catch people out.

## How a Reader picks a language

A package's manifest says which language its content is in, and which other
languages its pages come in:

```json
"language": "en",
"locales": ["fr", "de"]
```

`language` is the language of each page's default file, `lesson.md`. Each tag
in `locales` may have a file of its own beside it, `lesson.fr.md` or
`lesson.de.md`. Tags are BCP 47 language tags: `en`, `fr`, `pt-BR`,
`zh-Hant`. Private-use tags (`x-…`) are refused.

When a host asks for a page in a language, the Reader compares the tags
case-insensitively and takes the first of these
([package spec §5.4](../../spec/moca-package-spec.md#54-locales)):

1. the file whose tag equals the request;
2. the request made shorter, one part at a time: `fr-CA` finds `fr`;
3. the file whose tag starts with the request and `-`, the lowest in
   code-point order: `pt` finds `pt-BR`;
4. the default file.

So a node always has exactly one answer for a language, and a person never
gets nothing because their language is missing: they get the default.

The same rule applies in search. When the caller names a `locale`, the search
keeps, for each node, only the file this rule picks
([Reader contract §9.2](../../spec/moca-reader-contract.md#92-the-pipeline-and-the-gate),
step 4). Each citation record says which language it is in, as `node.locale`
([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)).

## Today's limits

These hold in OpenMOCA 0.7.0. Each recipe below works within them.

1. **A translation inherits only its audience.** A translation with no
   `moca.audience` of its own has its default file's. Every other field is its
   own: `moca.concepts`, `status`, `moca.valid_from` and `moca.valid_until`,
   `sources`, `moca.media`, `generated` and `verified`. So **copy
   `moca.concepts`, `status` and the validity window into each translation.**
   A translation without them:
   - is not bound to the topics, so a search with `scope` or `concepts` leaves
     it out;
   - has no place on the reading order, so a search with `upTo` never limits
     it: a learner at lesson 2 searching in French can be shown lesson 9;
   - is not retired with the original: when the English page is marked
     `status: deprecated` or its window ends, the French one stays live.

   A composite that binds a node by its identifier binds every file of that
   node, translations included
   ([package spec §5.6](../../spec/moca-package-spec.md#56-structure)). The
   node's own `moca.concepts` bind only the file that carries them.
2. **`locale` chooses; it never leaves anything out.** It picks one file per
   node. A node that has no French file passes a French search in its default
   language. So with an English edition and a French edition loaded, a French
   search returns both, interleaved by score. To keep to one edition, search
   with `scope` set to that edition's package `id`, or load only that edition.
3. **Two lookup cases surprise people.**
   - `pt-AO` gets the default, although `pt-BR` and `pt-PT` exist. Step 2
     makes it `pt`, and no file is tagged `pt`; step 3 looks for tags that
     start with `pt-AO-`. The same happens to `es-419` against `es-ES`, and
     `fr-BE` against `fr-CA`. To catch them, add a plain `pt` file (see
     [regional variants](#regional-variants)).
   - A request for `en` can get `en-GB` rather than the default. With
     `"language": "en"` and `"locales": ["en-GB"]`, the default file is not
     tagged, so step 3 finds `en-GB` first. Ask with the full tag the person
     uses: `en-US` falls through to the default.
4. **A translation cannot carry its own licence.** Every file of a node has
   the node's terms, licence and copyright
   ([package spec §4.14](../../spec/moca-package-spec.md#414-terms)). A
   translation under a different licence goes in a package of its own (see
   [a translation with different rights](#a-translation-with-different-rights)).
5. **Retire a translation by removing it, not by marking it.** The default
   retrieval policy runs before the language is chosen. A French file marked
   `status: deprecated` is left out, and the node's English file is not the
   one a French search keeps, so a French reader gets nothing for that node.
   Delete the French file instead, in the next version, and French readers
   fall back to the English.

The specification says nothing on several points this guide meets: which
edition to show a person, the direction of text, and how to label a media
file as a dub, a description or a signer. Where it is silent, the recipes say
so, and what your app can do.

## Translated text and media

### Translated text

**When:** the French says what the English says, page for page.

**Build it:**

1. Add the language to the manifest's `locales`, and translate the manifest's
   own title, description, tags and image text in `translations`
   ([package spec §4.7](../../spec/moca-package-spec.md#47-translations)):

   ```json
   "language": "en",
   "locales": ["fr"],
   "translations": {
     "fr": { "title": "Le pain maison", "description": "Un premier pain, pas à pas." }
   }
   ```

2. Write `lesson.fr.md` beside `lesson.md`, and copy the frontmatter that
   matters: `status`, `moca.concepts`, the validity window, and `moca.audience`
   if you want it said on the page. Give it its own `sources` and evidence when
   it quotes a source in French.
3. If a machine translated it, mark it with `generated`, and add `verified`
   when a person has checked it ([machine-made content](machine-made.md)).

```yaml
---
type: Lesson
title: "Leçon 1 : farine, eau, sel et levure"
status: stable
generated:
  by: example-translator/1.0
  at: 2026-11-27T09:00:00Z
moca:
  concepts:
    - iri: https://example.com/moca/bread-course/en#lesson-1
      role: primary
---
```

**What a Reader does:** it reads the French file as the `fr` representation of
the same node. Both share `node.id` and `node.ref`; `node.locale` says which
one a record cites, and `span` counts bytes in that file. The package gains
the `localized` capability ([capabilities](capabilities.md)).

**Limits:** [today's limits](#todays-limits) 1, 4 and 5.
[Authoring step 5](authoring.md#5-a-translation) walks through a first
translation.

### Partly translated

**When:** some pages are translated and the rest are not yet.

**Build it:** add a translation where you have one. Nothing else.

**What a Reader does:** for each node, the file the lookup picks; with no
French file, the default. A host can count how much of a package is in a
language: `Library.citations({ locale: "fr" })` gives one record per node, and
each record's `node.locale` says whether the French was found
([Reader interface](../../spec/moca-reader-interface.md)). Show the count, or
mark each answer that is in another language than the one asked for.

**Limits:** the count is the host's to make; the package does not carry one.

### Dubbed media

**When:** the same video or audio, voiced again in another language.

**Build it:** in the French file, name the dubbed media as its own source,
with its own description and its own French WebVTT transcript
([package spec §5.7](../../spec/moca-package-spec.md#57-media)):

```yaml
sources:
  - id: video
    resource: https://media.example.com/lesson-1.fr.mp4
  - id: captions
    resource: ../media/lesson-1.fr.vtt
moca:
  media:
    - source: video
      type: video/mp4
      duration: 612
      transcript: captions
```

**What a Reader does:** a French record carries the dubbed media in
`node.media`. Time ranges cited from the French file are checked against the
French transcript, so a moment always points at the media the person hears.

**Limits:** a media description has no field for its language or its role.
You can also describe a dub inside one file as an **alternate** of the
original, with `sync` for timings that differ, but then nothing tells a Reader
that it is a dub rather than another cut. Use a translation file when the dub
is in another language.

### Slides in one language, speech in another

**When:** a talk with English slides and a French voice, or the other way
round.

**Build it:** set the node's language by the text people read in the node:
usually what is said, so the transcript in the body. Name the slides as a
source. Say in the title or description which language each part is in.

**What a Reader does:** it reports the node's language as the file's
language. It knows nothing of the media's spoken language.

**Limits:** a media description has no `language`. The specification is
silent on a node whose parts are in different languages; say it in the text.

### A bilingual page

**When:** a phrasebook page, a parallel text, a contract in two languages
side by side.

**Build it:** one node, in the default file. Its text is in both languages.

**What a Reader does:** `node.locale` is the package's `language`. Lexical
search finds words from either language, since it matches words, not
languages.

**Limits:** no field says a node is in more than one language. If the two
languages can be separated, a translation is better: each person gets their
own.

### Teaching a language

**When:** French taught in English, or Spanish taught in French.

**Build it:** set `language` to the language of instruction, the one the
learner reads. Exercises and examples in the language taught stay in the
same node. A course taught in English and one taught in Spanish are two
editions, `language` `en` and `es`. Say which language is taught in the
title, description and `tags`, and, if you use structure, in a concept.

**What a Reader does:** it treats each edition's text as being in its
`language`. An app that chooses an edition by language, as in
[a language edition](#a-language-edition), picks the one taught in the
learner's language.

**Limits:** no field says which language a package teaches. The language
chosen by the lookup is always the language of instruction.

### A glossary in each language

**When:** you name the same terms in several languages.

**Build it:** in `structure.ttl`, give each concept one `skos:prefLabel` per
language and any number of `skos:altLabel`s, each with its language tag
([structure](structure.md)):

```turtle
<https://example.com/moca/bread-course#dough> a skos:Concept ;
  skos:prefLabel "Making the dough"@en , "La pâte"@fr ;
  skos:altLabel "dough"@en , "pâton"@fr .
```

For definitions people search, make a glossary node and translate it.

**What a Reader does:** `concept(iri)` returns `labels` and `altLabels` keyed
by language tag ([Reader contract §10](../../spec/moca-reader-contract.md#10-structure)),
so an app shows the label in the person's language.

**Limits:** none for labels. Labels are not searched as text; put the words in
a node if people should find them by search.

## Language editions

### A language edition

**When:** the French course is its own work: another presenter, other slides,
another order.

**Build it:**

1. One package per edition, each with its own `id`, `language`, `title`,
   `contributors` and reading order.
2. Files both use in a package of their own. Each edition lists it in
   `members`, pinned by digest.
3. A composite package above the editions, the entry point for the course. It
   lists the editions as members, and its `structure.ttl` holds the topics
   both editions are filed under.
4. Optionally, each edition names the composite with an `isPartOf` relation,
   with no `version`.
5. Sign every package. Sign the composite with a key whose `ids` cover the
   editions' ids.

The [worked example](#worked-example-a-course-in-two-editions) builds exactly
this.

**What a Reader does:** it reads the composite and resolves each edition and
the shared package once
([package spec §7.1.1](../../spec/moca-package-spec.md#711-resolving-a-composition)).
Each record names its own edition's `package.id`. Each edition keeps its own
trust, dates and terms.

**Limits:** nothing tells a Reader that two members are editions of each
other. A French search returns both ([limit 2](#todays-limits)). Which edition
to show a person is your app's choice; the specification does not make it.
A simple rule that agrees with the lookup: compare the person's language with
each edition's `language`, by the steps in
[how a Reader picks a language](#how-a-reader-picks-a-language), then search
with `scope` set to the chosen edition's `id`.

### Editions that differ in shape

**When:** the French course has two lessons where the English has three, or
another order.

**Build it:** each edition keeps its own ordered collection and
`readingOrder`. In the composite's `structure.ttl`, file each lesson of both
editions under shared topics, by node identifier (`<id>#<path>`), so a topic
says "these English lessons and this French lesson cover the same thing":

```turtle
<https://example.com/moca/bread-course#dough> a skos:Concept ;
  dcterms:hasPart <https://example.com/moca/bread-course/en#lessons/1-flour-water-salt.md> ,
                  <https://example.com/moca/bread-course/en#lessons/2-kneading-and-rising.md> ,
                  <https://example.com/moca/bread-course/fr#lecons/1-la-pate.md> .
```

Declare each node identifier used this way as a `skos:Concept`.

**What a Reader does:** `scope` on the topic finds the lessons of both
editions, translations included. `upTo` uses each edition's own reading order:
a point on the English order limits only the English edition and its members.

**Limits:** no relation says "this French lesson covers those two English
lessons" one to one. The shared topic says it.

### One item in several editions

**When:** a collection holds one item, "the Python playlist", made twice, in
English and in French, as two packages. A person should see one.

**Build it:** in the composite's `structure.ttl`, one concept for the item
with both editions as parts:

```turtle
<https://example.com/moca/bread-course#course> a skos:Concept ;
  skos:prefLabel "Bread at home"@en , "Le pain maison"@fr ;
  dcterms:hasPart <https://example.com/moca/bread-course/en> ,
                  <https://example.com/moca/bread-course/fr> .
```

**What a Reader does:** `scope` on the item finds both editions. If the
composite's reading order lists the item, `upTo` places both at its position.

**Limits:** to a Reader the two are parts, both read, not alternatives. It
lists both and a search returns near-duplicates from both. Show one in your
app by choosing the edition as in [a language edition](#a-language-edition),
and offer the other as a switch.

### An edition published later

**When:** the French edition comes out three months after the English.

**Build it:** publish the French edition as its own package, with its own
`datePublished`. Add it to the composite's `members` and structure, and
publish the composite as its next minor version
([package spec §7.3](../../spec/moca-package-spec.md#73-composite-packages)).
Earlier versions of the composite stay valid.

**What a Reader does:** a host with the new composite reads both editions; one
with the old composite reads the English only.

**Limits:** none.

### A part in one edition only

**When:** a French-only bonus lesson.

**Build it:** put it in the French edition. File it under the composite's
topics if it covers one.

**What a Reader does:** an English search can return it, in French, because
`locale` never leaves anything out ([limit 2](#todays-limits)). Its record
says `node.locale: "fr"`, so an app can mark it "in French". With `scope` set
to the English edition, it is not returned.

**Limits:** limit 2.

### One package holding every language

**When:** a small work, few languages, and an author who wants one signed
file.

**Build it:** use translations, but only where each one really is the same
page. A page made for one language alone is a separate node in the same
package.

**What a Reader does:** a separate node is in the package's `language` as far
as the Reader knows: a French page in an English package has
`node.locale: "en"`, and a French search does not prefer it.

**Limits:** no field gives one node its own language. When the languages are
really separate works, use editions.

### Easy-read versions

**When:** an easy-read or plain-language version beside the full text.

**Build it:** easy-read is not a language. BCP 47 has no tag for it, and
private-use tags are refused. Make the easy-read version its own package, an
edition of the work, and file both under one concept in the composite.

**What a Reader does:** what it does for any edition. The language lookup
never chooses it; choose it in your app, by `scope`.

**Limits:** nothing marks a package as easy-read. Say it in the title,
description and `tags`.

## Accessibility

### Sign language

**When:** a signed version of a page or a video.

**Build it:** a sign language is a language. Add a representation tagged with
the sign language's own code, such as `bfi` for British Sign Language or `ase`
for American Sign Language, not the older form `sgn-GB`. Its body describes
the signed video, which its `moca.media` names, with a written transcript as
its WebVTT `transcript`:

```json
"locales": ["bfi"]
```

`lesson.bfi.md` is then the British Sign Language representation of
`lesson.md`. A signer shown in the main video, on the same timeline, can
instead be an alternate of the main video in the same file.

**What a Reader does:** a request for `bfi` gets the signed version. A
request for `en` never does, since the tags differ.

**Limits:** no field marks a media file as signed. An alternate with a signer
looks like any other alternate; say it in the text.

### Translated captions

**When:** one video, with captions in several languages.

**Build it:** in each translation file, describe the same media and name that
language's WebVTT file as its `transcript`, under `media/` or `sources/`.
Mark a machine-made WebVTT with `generated` on its `sources` entry.

**What a Reader does:** a French record's `node.media` names the French
captions. Time ranges cited from the French file are checked against them.

**Limits:** one media description names one `transcript`. A player that wants
a caption menu reads every translation of the node; one record never lists
all the tracks.

### Transcript and translated captions

**When:** the transcript in the language spoken, and captions in other
languages.

**Build it:** the default file's `transcript` is the WebVTT in the spoken
language: it is the evidence for what was said. Each translation's own
`transcript` is its translated captions. Mark machine-made captions with
`generated`.

**What a Reader does:** evidence quoted from a translated caption is checked
against that caption file. It is evidence of the translation, not of the
words spoken.

**Limits:** as for [translated captions](#translated-captions).

### Audio description

**When:** a version of the media with spoken descriptions of what is on
screen.

**Build it:** describe the described audio or video as an alternate of the
main media in the same file
([package spec §5.7](../../spec/moca-package-spec.md#57-media)). Use `sync`
when the descriptions pause the original (extended description). For text
descriptions, add a WebVTT file as a source of the node.

**What a Reader does:** it carries the alternate in `node.media`, and
`mapTime` moves a moment between the original and the described version.

**Limits:** no field marks an alternate as described, or a WebVTT file as
descriptions rather than captions. Say it in the text and the source's
`title`.

## Scripts and regions

### Right-to-left scripts

**When:** Arabic, Hebrew, Persian, Urdu.

**Build it:** nothing to add. Tag the file with its language, and the script
if it matters (`ar`, `fa`, `ur`, `he`).

**What a Reader does:** what it does for any language. Spans are byte offsets,
so citations are unaffected by direction.

**Limits:** the specification does not say how text is displayed. Hosts set
direction from the script or with `dir="auto"` around quoted passages, and
never mirror media.

### Regional variants

**When:** `pt-BR` and `pt-PT`, `en-US` and `en-GB`, `es-ES` and `es-419`.

**Build it:** when the pages say the same, use translations with regional
tags. When they differ, such as two countries' law, use editions. For
translations, add a plain base-language file too (`lesson.pt.md`, a copy of the
variant you prefer), so requests for other regions find it:

```json
"locales": ["pt", "pt-BR", "pt-PT"]
```

**What a Reader does:** `pt-BR` and `pt-PT` get their own files; `pt-AO` is
made `pt` and gets the plain file. Without it, `pt-AO` gets the default. A
plain `pt` request gets `pt` when it exists, else `pt-BR`, the lowest in
code-point order.

**Limits:** [limit 3](#todays-limits). A package cannot say which variant it
prefers for a base language, except by providing the plain file.

### Script variants

**When:** Serbian in Latin and Cyrillic (`sr-Latn`, `sr-Cyrl`), Chinese in
simplified and traditional characters (`zh-Hans`, `zh-Hant`).

**Build it:** translations, each tagged with its script. Mark a machine
transliteration with `generated`. Serbian has no default script, so always
write the script subtag.

**What a Reader does:** `sr-Latn` gets the Latin file. A plain `sr` gets the
lowest in code-point order, `sr-Cyrl`. Add a plain `sr` file to choose
otherwise.

**Limits:** none beyond limit 3.

## Other people's translations

### A translation by someone else

**When:** someone other than the publisher translates the work.

**Build it:** the translator publishes their own package, signed with their
own key, with a `crossReferences` relation to the original
([package spec §7.2](../../spec/moca-package-spec.md#72-relations)):

```json
"relations": [
  { "type": "crossReferences", "target": "https://example.com/moca/bread-course/en",
    "note": "French translation of lessons 1 to 3." }
]
```

The original's terms still bind what others may do with it: a machine
translation needs its `ai.allowed.machineTranslation` not to be `false`.

**What a Reader does:** it reports the relation, and nothing more. The
translation is a package of its own, with its own trust. If the original's
publisher agrees, their composite can list it as a member.

**Limits:** nothing says "translation of". A `crossReferences` relation is an
informative link that anyone can make, so it confirms nothing about the
original publisher's agreement. Show it as the translator's claim.

### A translation with different rights

**When:** a translation under another licence or copyright than the original.

**Build it:** its own package, as in
[a translation by someone else](#a-translation-by-someone-else), with its own
`license` and `terms`.

**What a Reader does:** each record carries its own package's licence and
copyright (`node.license`, `node.copyright`).

**Limits:** [limit 4](#todays-limits): inside one package, every file of a
node has the node's licence.

### Translating on the fly

**When:** your app translates an answer into the person's language as it
answers, from a page that has no translation.

**Build it:** nothing in the package. Before translating, make the search with
a terms request whose `use` is `translate`
([Reader contract §15.4](../../spec/moca-reader-contract.md#154-the-terms-gate)).

**What a Reader does:** it removes records whose `ai.allowed.machineTranslation`
is not `true`. Not set means `true`
([Reader contract §15.3](../../spec/moca-reader-contract.md#153-resolving-terms)).
A package's own translations are never machine translation.

**Limits:** the citation stays on the file the app translated from, with its
`node.locale`. Show "machine translated" beside the answer, and never store
the result as if it were the package's own translation.

## Search across languages

### Questions across languages

**When:** a person asks in English, and the best passage is in French.

**Build it:** nothing in the package. Use a dense backend with a multilingual
model ([search and sidecar indexes](search-and-indexes.md)). The built-in
lexical backend matches words, so it finds a French passage only for French
words.

**What a Reader does:** with no `locale`, every file of every node can be
returned. With a `locale`, the gate keeps the file the lookup picks for each
node, whatever the backend matched. Two things follow:

- an English question with `locale: "fr"` can lose a page whose French file
  does not match the words, even though its English file did;
- a French-only node still passes an English search ([limit 2](#todays-limits)).

To keep to one language's edition, use `scope`, as in
[the worked example](#4-ask-in-english-and-in-french).

**Limits:** no option keeps "only this language". Filtering the results
yourself after the search breaks "filters come before the limit"
([Reader contract §9.2](../../spec/moca-reader-contract.md#92-the-pipeline-and-the-gate)):
you get fewer results than `limit` while good ones exist. Use `scope`.

## Worked example: a course in two editions

[`examples/course-editions`](../../examples/course-editions/README.md) is a
short, original course, "Bread at home", from a made-up school:

| Package | `id` | What it is |
| --- | --- | --- |
| `course/` | `https://example.com/moca/bread-course` | The composite: the entry point, with the topics both editions share |
| `english/` | `…/bread-course/en` | The English edition: three lessons, presented by Alex Example. Lesson 1 is also translated into French |
| `french/` | `…/bread-course/fr` | The French edition, made for French: two lessons, presented by Camille Exemple. Its lesson 1 covers what English lessons 1 and 2 cover |
| `handout/` | `…/bread-course/handout` | The recipe card, a member of both editions |

The French edition is not a translation of the English: it has its own
presenter, its own words and its own order. The French translation of English
lesson 1 sits beside it, so both ways are in one course.

### 1. Build

Each edition is a package with its own reading order. The English one:

```json
{
  "mocaVersion": "0.7",
  "id": "https://example.com/moca/bread-course/en",
  "version": "1.0.0",
  "title": "Bread at home",
  "language": "en",
  "locales": ["fr"],
  "readingOrder": "https://example.com/moca/bread-course/en#lessons",
  "members": [
    { "id": "https://example.com/moca/bread-course/handout", "version": "1.0.0",
      "digest": "sha256:2089e8eb…" }
  ],
  "relations": [
    { "type": "isPartOf", "target": "https://example.com/moca/bread-course" }
  ]
}
```

`content/lessons/1-flour-water-salt.fr.md` is the French translation of
lesson 1. It repeats the English file's `status` and `moca.concepts`, so it
keeps lesson 1's place on the reading order. The French edition has
`"language": "fr"`, no `locales`, and its own two lessons.

The composite lists the two editions as members. Its `structure.ttl` holds
the course as a concept with both editions as parts, and two topics, "Making
the dough" and "Shaping and baking", each with lessons of both editions as
parts ([editions that differ in shape](#editions-that-differ-in-shape)). It
lists no reading order of its own: each edition has one.

### 2. Pin and sign

Pin from the bottom up: the recipe card's digest into each edition, then the
editions' digests into the composite. Then sign each package:

```sh
npx @openmoca/moca-lint digest handout      # into english/ and french/ members
npx @openmoca/moca-lint digest english      # into course/ members
npx @openmoca/moca-lint digest french
npx @openmoca/moca-sign sign course --key publisher.pem --keyid example-publisher-2026
```

Sign `handout`, `english` and `french` the same way. In this repository,
`npm run refresh:derived` does all of it with the published, insecure example
key, which may sign only ids under `https://example.com/`.

### 3. Check

```sh
npx @openmoca/moca-lint lint examples/course-editions/course \
  --members examples/course-editions \
  --trust-root fixtures/signing-keys/trust-root.json
```

```text
No findings.

sha256:e3bb80f73a8a2108858ce7c86a61b7a7601acac2736fa8d233e010173357c44f
capabilities: composed, core, signed, structured
```

The English edition reads as `composed, core, localized, signed, structured`;
the French as `composed, core, signed, structured`.

### 4. Ask in English and in French

Read the composite with a resolver for the folder, add it to a library, and
search:

```js
import { readPackage, directoryResolver, Library, Search, LexicalBackend } from '@openmoca/moca-core';

const course = await readPackage('examples/course-editions/course', {
  trustRoot: 'fixtures/signing-keys/trust-root.json',
  resolveMember: directoryResolver(['examples/course-editions']),
});
const library = new Library().add(course);
const search = new Search(library, { backend: new LexicalBackend(library) });

await search.search('How long should the dough rise?', { locale: 'en' });
await search.search('Combien de temps la pâte doit-elle lever ?', { locale: 'fr' });
await search.search('Combien de temps la pâte doit-elle lever ?', {
  locale: 'fr', scope: 'https://example.com/moca/bread-course/fr',
});
```

The library holds four packages: the composite, then the English edition, the
recipe card and the French edition. The recipe card is added once, although
both editions list it.

**In English** (`locale: "en"`):

| Package | Node | `node.locale` | Title |
| --- | --- | --- | --- |
| `…/en` | `lessons/2-kneading-and-rising.md` | `en` | Lesson 2: kneading and rising |
| `…/en` | `lessons/3-shaping-and-baking.md` | `en` | Lesson 3: shaping and baking |
| `…/en` | `lessons/1-flour-water-salt.md` | `en` | Lesson 1: flour, water, salt and yeast |
| `…/handout` | `recipe-card.md` | `en` | The recipe card |
| `…/fr` | `lecons/1-la-pate.md` | `fr` | Leçon 1 : la pâte |

The last result is French: the word "long" is in it, and `locale: "en"` does
not leave out a node that has no English file ([limit 2](#todays-limits)).

**In French** (`locale: "fr"`):

| Package | Node | `node.locale` | Title |
| --- | --- | --- | --- |
| `…/fr` | `lecons/1-la-pate.md` | `fr` | Leçon 1 : la pâte |
| `…/en` | `lessons/1-flour-water-salt.md` | `fr` | Leçon 1 : farine, eau, sel et levure |
| `…/fr` | `lecons/2-faconner-et-cuire.md` | `fr` | Leçon 2 : façonner et cuire |

All three are in French, but from two editions: the French edition's own
lessons, and the French translation of the English lesson 1. The records say
which is which: `package.id` names the edition, and both share the same
`node.locale`.

**In French, in the French edition** (`locale: "fr"`, `scope` the French
edition's `id`):

| Package | Node | `node.locale` | Title |
| --- | --- | --- | --- |
| `…/fr` | `lecons/1-la-pate.md` | `fr` | Leçon 1 : la pâte |
| `…/fr` | `lecons/2-faconner-et-cuire.md` | `fr` | Leçon 2 : façonner et cuire |

Only the French edition. Its members are in scope too, so the recipe card can
come back as well, in English, its only language, when the words match.

**By topic** (`locale: "fr"`, `scope` "Making the dough"): lesson 1 and lesson 2 of the English
edition and lesson 1 of the French edition, each in the language asked for
where it has one. The topic binds the nodes by identifier, so it finds the
French translation of English lesson 1 too.

**Every record is signed.** `package.signed` is `true` on each, and its
signer is the example publisher. The composite's signature also covers which
bytes of each edition it lists.

## Next

- [Authoring packages](authoring.md): a first translation, step by step.
- [Structure](structure.md): topics, parts, order, and `scope`.
- [Machine-made content](machine-made.md): mark a machine translation.
- [Package specification §5.4](../../spec/moca-package-spec.md#54-locales):
  the lookup rule.
