# Credits and dates

Credits say who made the work and who publishes it, in one fixed shape, so a
catalogue, an app or an assistant can show them and say where an answer came
from ([package spec §4.13](../../spec/moca-package-spec.md#413-credits)).
Dates say when the work was first published and when this version of the
package was made ([package spec §4.12](../../spec/moca-package-spec.md#412-publication-and-packaging-dates)).

## The publisher and the work's page

`publisher` is always an object. Only `name` is required:

```json
"publisher": {
  "name": "Example Podcast Ltd",
  "url": "https://podcast.example.org",
  "description": "An independent studio making shows about the sea.",
  "image": { "src": "media/publisher.png", "type": "image/png", "alt": "The studio's logo" },
  "sameAs": ["https://www.wikidata.org/entity/Q4115189"]
},
"url": "https://podcast.example.org/harbour-lights"
```

- `url` at the top level is the work's own page.
- `image` is a file in the package under `media/` (PNG, JPEG or WebP), with
  `alt` text.
- `sameAs` names the same party elsewhere: ISNI, ORCID or Wikidata.

In 0.6, `publisher` could be a string. In 0.7.0 the string form fails the
schema ([migrations](../../MIGRATIONS.md)).

## Contributors

`contributors` lists the people and organisations who made the work, each
with roles:

```json
"contributors": [
  { "name": "Ada Example", "roles": ["hst", "aut"], "sameAs": ["https://orcid.org/0000-0002-1825-0097"] },
  { "name": "LibriVox volunteers", "roles": ["nrt"], "url": "https://librivox.org" }
]
```

Roles are MARC relator codes from the Library of Congress: `aut` (author),
`nrt` (narrator), `hst` (host), `spk` (speaker), `edt` (editor), `trl`
(translator), `pro` (producer), `ctb` (contributor) and others. An app that
does not know a code shows it as written, or as `ctb`.

**Credits for one part.** A node may credit its own contributors in its
frontmatter, in the same shape: the guest of one episode, the translator of
one chapter.

```yaml
---
type: PodcastEpisode
title: "Episode 12: The lighthouse keepers"
moca:
  contributors:
    - name: Sam Guest
      roles: [spk]
---
```

A node's contributors do not inherit the package's, and neither replaces the
other. Citation records carry the node's own contributors, so an answer can
name the guest whose words it used.

**From the formats you have.** Credits map onto schema.org, Dublin Core, ONIX
and Podcasting 2.0 `podcast:person` roles; the tables are in
[package spec §4.13](../../spec/moca-package-spec.md#413-credits).

## Licence and copyright

- The package's licence is `license` in `moca.json`, an SPDX expression.
- Its copyright is `terms.rights.copyright`: a `year` or range, a `holder`,
  and the exact `notice` to show.
- A part under a different licence or copyright, such as a licensed photo or a
  guest's segment, gets its own in `terms.nodes`
  ([the creator's terms](creators-terms.md#parts-of-the-work-nodes)). Citation
  records carry `node.license` and `node.copyright`, so an app shows the
  right line beside each part.

## Dates

| Field | Says | Form |
| --- | --- | --- |
| `datePublished` | When the work was first published. A new version keeps it | A date (`2019-08-01`) or a date-time with an offset |
| `moca.date_published` (node) | When one part was first published: an episode, an article | The same |
| `datePackaged` | When this version of the package was made: when its producer built these bytes | A date-time with an offset (`2026-11-19T18:30:00Z`) |

- Both are informative. A Reader never compares them with its clock, and they
  never change what a search returns.
- `datePackaged` is the producer's statement, not a trusted time. When the
  time of signing matters, it comes from the signature's transparency log or
  another timestamp authority.
- For reproducible builds, take `datePackaged` from the sources (for example
  `SOURCE_DATE_EPOCH`) rather than the clock, so the same sources give the
  same digest.
- MOCA has no `dateModified`: what changed is shown by `version` and the
  digest.

## Labels, not proof

A credit is what the signer wrote. A signature shows who signed the package,
not that the people listed made it or agreed to be named, nor that the
publisher named in it signed. An app that shows credits should show who
signed beside them, and must not present a contributor as verified because
the package is signed.

**No contact details.** Credits have no e-mail field. Don't put anyone's
e-mail address or telephone number in a credit, and credit people by the
name they publish under
([package spec §13.6](../../spec/moca-package-spec.md#136-personal-data)).

## Next

- [The creator's terms](creators-terms.md)
- [Machine-made content](machine-made.md)
- [Authoring packages](authoring.md)
