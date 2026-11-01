# Security & signing

clockwork-tz can download timezone data at runtime. Bad timezone data can silently shift every time an app shows, so updates are signed, hashed and version-checked before they're used. This page describes exactly what's verified.

## Reporting a vulnerability

Please email [hello@adamrichardturner.dev](mailto:hello@adamrichardturner.dev) rather than opening a public issue. You'll get a reply within a few days.

## What gets published

Each release of the [`clockwork-tz-data`](https://www.npmjs.com/package/clockwork-tz-data) package contains:

- `tzdb.json`: the compiled data
- `manifest.json`: `{ version, releaseDate, dataUrl, sha256, signature, keyId }`

```json
{
  "version": "2026f",
  "releaseDate": "2026-11-01T06:57:21.666Z",
  "dataUrl": "https://cdn.jsdelivr.net/npm/clockwork-tz-data@1.2026.6/tzdb.json",
  "sha256": "4ce4303530d44f85a22fc801f9289d91a358005523e678cf3bc6e7ffa5e7c29c",
  "signature": "Txd4kbmGHdec9E/cCAIADYc7j48YYmO7X1VpVZk+VePCWfPCdvyIIyXzV/tjQ9K/I2oEohfIstN+8Uwk3fJ9Dg==",
  "keyId": "63afe89a3ee676d5"
}
```

Package versions are `1.<year>.<release>`, so tzdb `2026f` is `1.2026.6`. The library fetches `https://cdn.jsdelivr.net/npm/clockwork-tz-data@1/manifest.json` (exported as `DEFAULT_MANIFEST_URL`).

## What's signed

`signature` is an Ed25519 signature over the UTF-8 bytes of:

```text
${version}\n${sha256}
```

where `sha256` is the lowercase hex SHA-256 of `tzdb.json`. The library verifies it with WebCrypto against `DEFAULT_PUBLIC_KEY` (a raw key, base64):

```text
DLvL/miUAfXKI8Sae27IuV/o5l3vbg5OIp5QMkeXLkU=
```

## When data is rejected

Data is rejected, and the current data kept, when:

- the signature doesn't verify, or WebCrypto or Ed25519 is unavailable
- the downloaded bytes don't match `sha256`
- the data's own `version` doesn't match the manifest
- the version isn't newer than the loaded data (no downgrades)

Version order follows tzdb naming (`2026a` < `2026f` < `2027a`) and is exposed as `compareTzdbVersions(a, b)`.

## Where the data comes from

The data package is generated in the [clockwork-tz repository](https://github.com/adamrichardturner/clockwork-tz) by a scheduled workflow:

1. It downloads the IANA release and **verifies IANA's own signatures** on the downloads.
2. It builds `zic` and compiles the data.
3. CI checks that the committed data rebuilds **byte for byte**.
4. It signs the manifest with the project key and opens a pull request.

## Key handling

- The private key is stored only as the `TZDB_SIGNING_KEY` GitHub Actions secret and is used by the TZDB Update workflow.
- To rotate it: generate a new key, update `DEFAULT_PUBLIC_KEY` in the library, release the library, then replace the secret. Clients on older versions keep verifying against the old key until they upgrade.

## Self-hosting

To serve data from your own infrastructure, publish your own `manifest.json` and `tzdb.json`, sign the manifest with your own Ed25519 key in the format above, and pass the public key:

```ts
await initClockworkTZ({
  engine: 'embedded-tzdb',
  data: tzdb,
  manifestURL: 'https://cdn.example.com/tzdb/manifest.json',
  publicKey: 'BASE64_RAW_ED25519_PUBLIC_KEY',
})
```

`dataUrl` may be absolute or relative to the manifest URL. Caches are keyed by manifest URL and public key, so data verified with one key is never served for another.

## Verifying a manifest yourself

`verifyManifestSignature(manifest, publicKey?)` checks a manifest's signature and resolves `true` or `false`. `ensureFreshTzdb(manifestURL?, options?)` runs the whole fetch-verify-cache flow and resolves `{ version, data }`, or `null`, without changing the active engine. See the [API reference](./api.md#data-updates).

## Without the network

If you never pass `manifestURL`, clockwork-tz makes no network requests at all. The `system-intl` engine never does.
