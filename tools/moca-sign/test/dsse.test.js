import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preAuthEncode, createEnvelope, verifyEnvelope } from '../lib/dsse.js';
import { generateKeyPair } from '../lib/keys.js';

test('preAuthEncode matches the DSSE PAE spec shape', () => {
  const pae = preAuthEncode('application/vnd.in-toto+json', Buffer.from('hello'));
  assert.equal(pae.toString('utf8'), 'DSSEv1 28 application/vnd.in-toto+json 5 hello');
});

test('createEnvelope/verifyEnvelope round-trip', () => {
  const { privateKeyPem, publicKeyPem } = generateKeyPair();
  const envelope = createEnvelope({
    payload: Buffer.from('{"hello":"world"}'),
    payloadType: 'application/vnd.in-toto+json',
    privateKeyPem,
    keyid: 'k1',
  });

  const result = verifyEnvelope({ envelope, resolvePublicKey: (keyid) => (keyid === 'k1' ? publicKeyPem : undefined) });
  assert.equal(result.ok, true);
  assert.equal(result.payload.toString('utf8'), '{"hello":"world"}');
});

test('verifyEnvelope rejects a tampered payload', () => {
  const { privateKeyPem, publicKeyPem } = generateKeyPair();
  const envelope = createEnvelope({
    payload: Buffer.from('original'),
    payloadType: 'application/vnd.in-toto+json',
    privateKeyPem,
    keyid: 'k1',
  });
  envelope.payload = Buffer.from('tampered').toString('base64');

  const result = verifyEnvelope({ envelope, resolvePublicKey: () => publicKeyPem });
  assert.equal(result.ok, false);
});

test('verifyEnvelope rejects an unknown keyid', () => {
  const { privateKeyPem } = generateKeyPair();
  const envelope = createEnvelope({
    payload: Buffer.from('data'),
    payloadType: 'application/vnd.in-toto+json',
    privateKeyPem,
    keyid: 'untrusted-key',
  });

  const result = verifyEnvelope({ envelope, resolvePublicKey: () => undefined });
  assert.equal(result.ok, false);
  assert.match(result.reason, /no signature verified/);
});

test('verifyEnvelope rejects a malformed envelope', () => {
  const result = verifyEnvelope({ envelope: { payload: 'x' }, resolvePublicKey: () => undefined });
  assert.equal(result.ok, false);
  assert.match(result.reason, /malformed/);
});
