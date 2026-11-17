# Bloxwap icons

The shared UI icon library lives in [`packages/icons`](packages/icons/README.md).
It supplies one curated catalog for React, React Native, and raw SVG consumers.

```sh
pnpm install
pnpm --filter @bloxwap/icons build
pnpm --filter @bloxwap/icons check
pnpm --filter @bloxwap/icons test
node scripts/pack-ui-icons.mjs
```

The installable archive is written to `artifacts/bloxwap-icons-0.1.0.tgz`.
See the [native verification fixture](fixtures/native/README.md) for device checks.
The [migration guide](MIGRATION.md) explains consumer changes and release order;
the [verification report](evidence/verification.md) records results and limits.

## npm releases through CI

`.github/workflows/publish_npm.yml` publishes when an `icons-v*` tag is pushed.
The tag must match the version in `packages/icons/package.json`. The workflow
checks generated files and types, runs package and release tests, builds and
archives the package, then publishes that exact archive. Stable versions use
`latest`; prereleases use `next`. The pack script uses the current package version.

Before the first CI release, add an npm trusted publisher for `@bloxwap/icons`:

| Setting | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization | `bloxwap` |
| Repository | `icons` |
| Workflow filename | `publish_npm.yml` |
| Environment | Leave empty |
| Allowed action | Direct publishing with `npm publish` |

The workflow must be in the repository before tagging a release. Configure the
publisher immediately before the first CI publication: npm expires an unvalidated
connection after two days. CI uses OIDC, with no npm token secret. Provenance is
enabled when the source repository is public; it is disabled for this repository
while private. See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).

For the next stable release, bump and commit the package version with the reviewed
changes, then tag that commit (for example, `icons-v0.1.1`) and push the tag.
The workflow can also be run manually against a release tag; its `dry_run` input
defaults to true. A manual run on a branch is rejected.

## Asset server

A simple icon server based on express and sharp. It uses ioredis to cache the icon binaries. An S3 compatible service is used to store the icons which are fetched on-demand from external sources.

Exchange icons live in `assets/exchanges` and are addressed by canonical exchange slug:

```text
/icons/exchanges/binance?w=48&h=48
```

Crypto card icons live in `assets/crypto-cards` and are addressed by card id:

```text
/icons/crypto-cards/coinbase-one?w=48&h=48
```

## Token catalog

Token icons read `tokenlist/coingecko-catalog-v2.json` through SDK cache. The
schema 2 catalog provides names, logo URLs, and contract/platform mappings keyed
by CoinGecko ID. Without R2 credentials the SDK reads the public dataset URL;
configure R2 credentials before startup for direct reads. No `logos.json` or
`all.json` fallback is used.
Local icons and existing image caches retain their current precedence.

Verify catalog mappings with `node --test tests/token-catalog.test.cjs`.
