// Citation records and the default retrieval policy.
// See spec/moca-reader-contract.md §7 and §8.

/** The default retrieval policy, spec/moca-reader-contract.md §8. */
export function passesDefaultPolicy(record) {
  return record.trust.inForce && !record.trust.superseded && record.trust.status !== 'deprecated';
}

export function pickRepresentation(node, locale) {
  if (!locale) return node.representations[0];
  const want = locale.toLowerCase();
  return node.representations.find((r) => r.locale?.toLowerCase() === want)
    ?? node.representations.find((r) => r.locale && want.startsWith(`${r.locale.toLowerCase()}-`))
    ?? node.representations.find((r) => r.locale && r.locale.toLowerCase().startsWith(`${want}-`))
    ?? node.representations[0];
}

/**
 * Builds one citation record (schemas/v1/citation-record.schema.json).
 */
export function citationFor(result, node, rep, { now = new Date(), index, text } = {}) {
  const { manifest } = result;
  const fm = rep.frontmatter;
  const moca = fm.moca && typeof fm.moca === 'object' ? fm.moca : {};
  const key = `${manifest.id}@${manifest.version}`;
  const validFrom = moca.valid_from ?? manifest.validFrom;
  const validUntil = moca.valid_until ?? manifest.validUntil;
  const t = now.getTime();
  const supersededBy = index?.superseded.get(key) ?? [];
  const contestedBy = [...(Array.isArray(moca.contested_by) ? moca.contested_by : []), ...(index?.contested.get(key) ?? [])];
  const sources = new Map((Array.isArray(fm.sources) ? fm.sources : []).filter((s) => s?.id).map((s) => [s.id, s]));

  const record = {
    package: {
      id: manifest.id,
      version: manifest.version,
      digest: result.digest,
      signed: result.signers.length > 0,
      ...(result.signers.length > 0 ? { signers: [...result.signers] } : {}),
    },
    node: {
      id: `${manifest.id}#${node.path}`,
      ref: `${manifest.id}@${manifest.version}#${node.path}`,
      path: node.path,
      ...(rep.locale ? { locale: rep.locale } : manifest.language ? { locale: manifest.language } : {}),
      type: fm.type,
      ...(typeof fm.title === 'string' ? { title: fm.title } : {}),
      ...(typeof fm.description === 'string' ? { description: fm.description } : {}),
      ...(Array.isArray(fm.tags) ? { tags: fm.tags.filter((x) => typeof x === 'string') } : {}),
      ...(rep.sha256 ? { digest: `sha256:${rep.sha256}` } : {}),
    },
    span: { start: rep.bodyOffset, end: rep.bodyOffset + Buffer.byteLength(rep.body) },
    trust: {
      status: ['draft', 'stable', 'deprecated'].includes(fm.status) ? fm.status : 'stable',
      generated: fm.generated && typeof fm.generated === 'object' ? { by: String(fm.generated.by), ...(fm.generated.at ? { at: String(fm.generated.at) } : {}) } : null,
      declaredVerified: (Array.isArray(fm.verified) ? fm.verified : fm.verified ? [fm.verified] : [])
        .filter((v) => v && typeof v === 'object')
        .map((v) => ({ by: String(v.by), ...(v.at ? { at: String(v.at) } : {}) })),
      attestedReviews: result.reviewsByFile.get(rep.file) ?? [],
      ...(fm.stale_after ? { staleAfter: String(fm.stale_after) } : {}),
      ...(validFrom ? { validFrom: String(validFrom) } : {}),
      ...(validUntil ? { validUntil: String(validUntil) } : {}),
      stale: fm.stale_after ? t >= Date.parse(fm.stale_after) : false,
      inForce: (!validFrom || t >= Date.parse(validFrom)) && (!validUntil || t < Date.parse(validUntil)),
      superseded: supersededBy.length > 0,
      ...(supersededBy.length > 0 ? { supersededBy } : {}),
      contested: contestedBy.length > 0,
      ...(contestedBy.length > 0 ? { contestedBy } : {}),
    },
    evidence: (Array.isArray(moca.evidence) ? moca.evidence : [])
      .map((e, i) => ({ e, matched: rep.evidenceChecks?.[i]?.matched }))
      .filter(({ e }) => e && typeof e === 'object')
      .map(({ e, matched }) => ({
        source: sources.get(e.source) ?? { id: e.source },
        ...(e.selector ? { selector: e.selector } : {}),
        ...(e.note ? { note: e.note } : {}),
        ...(matched !== undefined ? { matched } : {}),
      })),
    ...(rep.concepts ? { concepts: [...rep.concepts] } : {}),
    ...(typeof moca.audience === 'string' ? { audience: moca.audience } : {}),
    ...(result.profiles.length > 0 ? { profiles: [...result.profiles] } : {}),
  };
  if (text !== undefined) record.text = text;
  return record;
}
