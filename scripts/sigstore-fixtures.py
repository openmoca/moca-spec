"""Builds the Sigstore conformance fixtures against a self-made test Sigstore (attestations §6).

Nothing here touches a public Sigstore instance or log. The script plays every part itself:

- a test certificate authority (the Fulcio role), which issues short-lived signing certificates;
- a test certificate-transparency log, which signs an SCT embedded in each certificate;
- a test transparency log (the Rekor role), which signs an entry timestamp and a checkpoint for each bundle.

Every key is derived from a published label, so all of them are INSECURE by construction: these fixtures prove
that Readers verify Sigstore bundles alike, never that anything is trustworthy. Signatures are deterministic
ECDSA (RFC 6979), so running the script again gives the same bytes.

Run from the repository root (it reads package digests with the reference Reader):

    uv run --with cryptography==50.0.2 python scripts/sigstore-fixtures.py
"""

from __future__ import annotations

import base64
import datetime as dt
import hashlib
import json
import shutil
import struct
import subprocess
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID, ObjectIdentifier

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "conformance" / "fixtures" / "sigstore"
UTC = dt.timezone.utc

ISSUER = "https://issuer.sigstore-test.openmoca.example"
PUBLISHER = "https://ci.sigstore-test.openmoca.example/publish@refs/heads/main"
REVIEWER = "reviewer@sigstore-test.openmoca.example"
REKOR_ORIGIN = "rekor.sigstore-test.openmoca.example"
PAYLOAD_TYPE = "application/vnd.in-toto+json"
SIGNED_AT = dt.datetime(2026, 9, 1, 12, 0, 0, tzinfo=UTC)

OID_ISSUER_V1 = ObjectIdentifier("1.3.6.1.4.1.57264.1.1")
OID_ISSUER_V2 = ObjectIdentifier("1.3.6.1.4.1.57264.1.8")
OID_SCT = ObjectIdentifier("1.3.6.1.4.1.11129.2.4.2")


def key(label: str) -> ec.EllipticCurvePrivateKey:
    """An INSECURE P-256 key derived from a published label."""
    n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
    seed = int.from_bytes(hashlib.sha256(f"moca sigstore-test INSECURE {label}".encode()).digest(), "big")
    return ec.derive_private_key(seed % (n - 1) + 1, ec.SECP256R1())


def spki(k: ec.EllipticCurvePrivateKey | ec.EllipticCurvePublicKey) -> bytes:
    public = k.public_key() if isinstance(k, ec.EllipticCurvePrivateKey) else k
    return public.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)


def sign(k: ec.EllipticCurvePrivateKey, data: bytes) -> bytes:
    return k.sign(data, ec.ECDSA(hashes.SHA256(), deterministic_signing=True))


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def der_octet_string(content: bytes) -> bytes:
    n = len(content)
    length = bytes([n]) if n < 0x80 else bytes([0x81, n]) if n < 0x100 else bytes([0x82]) + n.to_bytes(2, "big")
    return b"\x04" + length + content


def der_utf8(text: str) -> bytes:
    raw = text.encode()
    return b"\x0c" + bytes([len(raw)]) + raw


def name(common_name: str) -> x509.Name:
    return x509.Name(
        [
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "OpenMOCA conformance (INSECURE)"),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ]
    )


class TestSigstore:
    """One self-made Sigstore: a CA, a CT log and a transparency log."""

    def __init__(self, label: str) -> None:
        self.label = label
        self.ca_key = key(f"{label} ca")
        self.ct_key = key(f"{label} ctlog")
        self.rekor_key = key(f"{label} rekor")
        start = dt.datetime(2026, 1, 1, tzinfo=UTC)
        self.ca_cert = (
            x509.CertificateBuilder()
            .subject_name(name(f"MOCA {label} CA"))
            .issuer_name(name(f"MOCA {label} CA"))
            .public_key(self.ca_key.public_key())
            .serial_number(int.from_bytes(hashlib.sha256(f"{label} ca serial".encode()).digest()[:16], "big"))
            .not_valid_before(start)
            .not_valid_after(start + dt.timedelta(days=3650))
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .add_extension(
                x509.KeyUsage(False, False, False, False, False, True, True, False, False), critical=True
            )
            .add_extension(x509.SubjectKeyIdentifier.from_public_key(self.ca_key.public_key()), critical=False)
            .sign(self.ca_key, hashes.SHA256(), ecdsa_deterministic=True)
        )

    def trusted_root(self) -> dict[str, object]:
        """The trusted_root.json a host supplies (sigstore/protobuf-specs)."""

        def log(k: ec.EllipticCurvePrivateKey, url: str) -> dict[str, object]:
            return {
                "baseUrl": url,
                "hashAlgorithm": "SHA2_256",
                "publicKey": {
                    "rawBytes": b64(spki(k)),
                    "keyDetails": "PKIX_ECDSA_P256_SHA_256",
                    "validFor": {"start": "2026-01-01T00:00:00Z"},
                },
                "logId": {"keyId": b64(hashlib.sha256(spki(k)).digest())},
            }

        return {
            "mediaType": "application/vnd.dev.sigstore.trustedroot+json;version=0.1",
            "tlogs": [log(self.rekor_key, f"https://{REKOR_ORIGIN}")],
            "certificateAuthorities": [
                {
                    "subject": {"organization": "OpenMOCA conformance (INSECURE)", "commonName": f"MOCA {self.label} CA"},
                    "uri": "https://fulcio.sigstore-test.openmoca.example",
                    "certChain": {"certificates": [{"rawBytes": b64(self.ca_cert.public_bytes(serialization.Encoding.DER))}]},
                    "validFor": {"start": "2026-01-01T00:00:00Z"},
                }
            ],
            "ctlogs": [log(self.ct_key, "https://ctfe.sigstore-test.openmoca.example")],
            "timestampAuthorities": [],
        }

    def certificate(self, subject: str, signing_key: ec.EllipticCurvePrivateKey, serial_label: str) -> x509.Certificate:
        """A Fulcio-style certificate for `subject`, with an SCT from the test CT log."""
        san: x509.GeneralName = (
            x509.RFC822Name(subject) if "@" in subject and "://" not in subject else x509.UniformResourceIdentifier(subject)
        )

        def builder() -> x509.CertificateBuilder:
            return (
                x509.CertificateBuilder()
                .subject_name(x509.Name([]))
                .issuer_name(self.ca_cert.subject)
                .public_key(signing_key.public_key())
                .serial_number(int.from_bytes(hashlib.sha256(serial_label.encode()).digest()[:16], "big"))
                .not_valid_before(SIGNED_AT - dt.timedelta(minutes=1))
                .not_valid_after(SIGNED_AT + dt.timedelta(minutes=9))
                .add_extension(
                    x509.KeyUsage(True, False, False, False, False, False, False, False, False), critical=True
                )
                .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.CODE_SIGNING]), critical=False)
                .add_extension(x509.SubjectKeyIdentifier.from_public_key(signing_key.public_key()), critical=False)
                .add_extension(
                    x509.AuthorityKeyIdentifier.from_issuer_public_key(self.ca_key.public_key()), critical=False
                )
                .add_extension(x509.SubjectAlternativeName([san]), critical=True)
                .add_extension(x509.UnrecognizedExtension(OID_ISSUER_V1, ISSUER.encode()), critical=False)
                .add_extension(x509.UnrecognizedExtension(OID_ISSUER_V2, der_utf8(ISSUER)), critical=False)
            )

        # RFC 6962 §3.2: the SCT signs the certificate's TBS without the SCT extension.
        precert_tbs = builder().sign(self.ca_key, hashes.SHA256(), ecdsa_deterministic=True).tbs_certificate_bytes
        timestamp = struct.pack(">Q", int(SIGNED_AT.timestamp() * 1000))
        signed = (
            b"\x00\x00"
            + timestamp
            + b"\x00\x01"
            + hashlib.sha256(spki(self.ca_key)).digest()
            + len(precert_tbs).to_bytes(3, "big")
            + precert_tbs
            + b"\x00\x00"
        )
        signature = sign(self.ct_key, signed)
        sct = (
            b"\x00"
            + hashlib.sha256(spki(self.ct_key)).digest()
            + timestamp
            + b"\x00\x00"
            + b"\x04\x03"
            + len(signature).to_bytes(2, "big")
            + signature
        )
        sct_list = len(sct).to_bytes(2, "big") + sct
        sct_list = len(sct_list).to_bytes(2, "big") + sct_list
        return (
            builder()
            .add_extension(x509.UnrecognizedExtension(OID_SCT, der_octet_string(sct_list)), critical=False)
            .sign(self.ca_key, hashes.SHA256(), ecdsa_deterministic=True)
        )

    def bundle(self, statement: bytes, subject: str, label: str, tlog_signature: bytes | None = None) -> dict[str, object]:
        """A v0.3 bundle: certificate, DSSE envelope, and a log entry with promise and proof."""
        signing_key = key(f"{self.label} signer {label}")
        cert = self.certificate(subject, signing_key, f"{self.label} {label} serial")
        pae = b"DSSEv1 %d %s %d %s" % (len(PAYLOAD_TYPE), PAYLOAD_TYPE.encode(), len(statement), statement)
        signature = sign(signing_key, pae)
        cert_pem = cert.public_bytes(serialization.Encoding.PEM)
        envelope = {"payload": b64(statement), "payloadType": PAYLOAD_TYPE, "signatures": [{"sig": b64(signature)}]}
        body = {
            "apiVersion": "0.0.1",
            "kind": "dsse",
            "spec": {
                "envelopeHash": {
                    "algorithm": "sha256",
                    "value": hashlib.sha256(json.dumps(envelope, separators=(",", ":"), sort_keys=True).encode()).hexdigest(),
                },
                "payloadHash": {"algorithm": "sha256", "value": hashlib.sha256(statement).hexdigest()},
                "signatures": [{"signature": b64(tlog_signature or signature), "verifier": b64(cert_pem)}],
            },
        }
        canonical_body = json.dumps(body, separators=(",", ":"), sort_keys=True).encode()
        log_id = hashlib.sha256(spki(self.rekor_key)).digest()
        integrated_time = int(SIGNED_AT.timestamp())
        promise = json.dumps(
            {"body": b64(canonical_body), "integratedTime": integrated_time, "logID": log_id.hex(), "logIndex": 0},
            separators=(",", ":"),
            sort_keys=True,
        ).encode()
        # A log of one entry: the root is the leaf hash, and the proof has no hashes.
        root = hashlib.sha256(b"\x00" + canonical_body).digest()
        note = f"{REKOR_ORIGIN} - 1\n1\n{b64(root)}\n"
        checkpoint = f"{note}\n— {REKOR_ORIGIN} {b64(log_id[:4] + sign(self.rekor_key, note.encode()))}\n"
        return {
            "mediaType": "application/vnd.dev.sigstore.bundle.v0.3+json",
            "verificationMaterial": {
                "certificate": {"rawBytes": b64(cert.public_bytes(serialization.Encoding.DER))},
                "tlogEntries": [
                    {
                        "logIndex": "0",
                        "logId": {"keyId": b64(log_id)},
                        "kindVersion": {"kind": "dsse", "version": "0.0.1"},
                        "integratedTime": str(integrated_time),
                        "inclusionPromise": {"signedEntryTimestamp": b64(sign(self.rekor_key, promise))},
                        "inclusionProof": {
                            "logIndex": "0",
                            "rootHash": b64(root),
                            "treeSize": "1",
                            "hashes": [],
                            "checkpoint": {"envelope": checkpoint},
                        },
                        "canonicalizedBody": b64(canonical_body),
                    }
                ],
            },
            "dsseEnvelope": envelope,
        }


def package_digest(path: Path) -> str:
    script = f"import('@openmoca/moca-core').then(async m => console.log((await m.readPackage({json.dumps(str(path))})).digest))"
    return subprocess.run(["node", "-e", script], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


def statement(subjects: list[dict[str, object]], predicate_type: str, predicate: dict[str, object]) -> bytes:
    return json.dumps(
        {"_type": "https://in-toto.io/Statement/v1", "subject": subjects, "predicateType": predicate_type, "predicate": predicate},
        separators=(",", ":"),
    ).encode()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def make_package(name: str, policy_text: str) -> Path:
    path = FIXTURES / name
    (path / "content").mkdir(parents=True)
    write_json(path / "moca.json", {"id": f"https://example.com/conformance/{name}", "version": "1.0.0", "title": "Fixture"})
    (path / "content" / "policy.md").write_text(policy_text)
    return path


def package_statement(path: Path, package_id: str) -> bytes:
    digest = package_digest(path)
    return statement(
        [{"name": f"{package_id}@1.0.0", "digest": {"sha256": digest.split(":", 1)[1]}}],
        "https://w3id.org/moca/attestation/package/v1",
        {},
    )


POLICY = "---\ntype: Policy\ntitle: Refunds\n---\n\n# Refunds\n\nRefunds are paid within 14 days.\n"


def main() -> None:
    shutil.rmtree(FIXTURES, ignore_errors=True)
    test = TestSigstore("sigstore-test")
    other = TestSigstore("sigstore-other")

    identity = lambda subject, roles: {"issuer": ISSUER, "subject": subject, "roles": roles}  # noqa: E731
    root = test.trusted_root()
    write_json(
        FIXTURES / "trust-root.json",
        {"keys": [], "sigstore": {"identities": [identity(PUBLISHER, ["package"]), identity(REVIEWER, ["review"])], "trustedRoot": root}},
    )
    write_json(
        FIXTURES / "trust-root-other-identity.json",
        {"keys": [], "sigstore": {"identities": [identity(PUBLISHER.replace("main", "release"), ["package"])], "trustedRoot": root}},
    )
    write_json(
        FIXTURES / "trust-root-review-only.json",
        {"keys": [], "sigstore": {"identities": [identity(PUBLISHER, ["review"])], "trustedRoot": root}},
    )

    def signed(name: str, *, sigstore: TestSigstore = test, tlog_mismatch: bool = False) -> Path:
        path = make_package(name, POLICY)
        package_id = f"https://example.com/conformance/{name}"
        stmt = package_statement(path, package_id)
        bundle = test.bundle(stmt, PUBLISHER, f"{name} package", tlog_signature=b"\x30" * 70 if tlog_mismatch else None) if sigstore is test else sigstore.bundle(stmt, PUBLISHER, f"{name} package")
        write_json(path / "attestations" / "package.sigstore.json", bundle)
        return path

    signed("sigstore-signed")
    signed("sigstore-untrusted-ca", sigstore=other)
    signed("sigstore-tlog-mismatch", tlog_mismatch=True)
    tampered = signed("sigstore-tampered")
    (tampered / "content" / "policy.md").write_text(POLICY.replace("14 days", "90 days"))

    reviewed = signed("sigstore-reviewed")
    policy = (reviewed / "content" / "policy.md").read_bytes()
    review = statement(
        [{"name": "content/policy.md", "digest": {"sha256": hashlib.sha256(policy).hexdigest()}}],
        "https://w3id.org/moca/attestation/review/v1",
        {
            "package": "https://example.com/conformance/sigstore-reviewed",
            "reviewer": f"human:{REVIEWER}",
            "reviewedAt": "2026-09-01T00:00:00Z",
            "outcome": "accurate",
        },
    )
    write_json(reviewed / "attestations" / "reviews" / "reviewer-2026-09-01.sigstore.json", test.bundle(review, REVIEWER, "review"))


if __name__ == "__main__":
    main()
