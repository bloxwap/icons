# Bloxwap icons

## Repository layout

| Directory | Purpose |
| --- | --- |
| `assets/` | Brand, token, exchange, and platform images |
| `packages/icons/` | Shared UI icon package, catalog, and SVGs |
| `apps/docs/` | Fumadocs landing page and GitHub Pages documentation |
| `src/` | Existing Express asset server |

## Documentation website

```sh
pnpm install
pnpm docs:dev
# Build the GitHub Pages export:
NEXT_PUBLIC_BASE_PATH=/icons pnpm docs:build
```

The landing page shows icons audited from the Bloxwap monorepo and Pro chart
library, with collection and category filters, size/stroke/color controls, React and native examples, and SVG downloads.
See [the docs app guide](apps/docs/README.md) for verification, preview, and Pages
setup. The site uses the shared Bloxwap HIG styles and Bloxwap Sans/Mono fonts.

To refresh the reviewed consumer inventory from sibling checkouts:

```sh
node scripts/sync-consumer-icons.mjs ../monorepo ../chart-ts
pnpm --filter @bloxwap/icons build
```

Normal docs builds use the committed catalog and usage snapshot, so sibling
checkouts are not required. Development uses `http://127.0.0.1:3909`; the static
preview uses `http://127.0.0.1:3918/icons/`.

## UI library

The shared UI icon library lives in [`packages/icons`](packages/icons/README.md).
It supplies one curated catalog for React, React Native, and raw SVG consumers.

Install the [published package](https://www.npmjs.com/package/@bloxwap/icons/v/0.1.0):

```sh
npm install @bloxwap/icons@0.1.0
```

To build and verify the library from source:

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

All jobs use the Bloxwap Apple Silicon runners labeled
`[self-hosted, macOS, ARM64]`, including npm publishing and Pages deployment.
The organization runner group must allow this repository; public repositories
need a group that permits public repository workflows. Fork pull requests do
not execute on these persistent runners.

Before the first CI release, ensure the organization `NPM_TOKEN` secret has
package write access to `@bloxwap/icons` and permits direct automated publishing.
The workflow exposes it only to authentication and publication steps. It verifies
the token's identity before publishing; npm enforces its package permissions.
Dry runs do not need the token. Keep the token renewed before expiry.

[npm trusted publishing does not support self-hosted runners](https://docs.npmjs.com/trusted-publishers/),
so this workflow uses token authentication and disables automatic provenance.
[npm plans to remove direct publishing with granular tokens in January 2027](https://docs.npmjs.com/about-access-tokens/#direct-publishing-is-being-deprecated).
Before that cutoff, migrate this job to `npm stage publish` followed by maintainer
approval with 2FA, or revisit the runner policy for tokenless publishing.

The runners need Xcode Command Line Tools and GNU tar (`gtar`, provided by
Homebrew `gnu-tar`) for GitHub Pages artifacts. Node 24 and pnpm 11.1.0 are set up
by the workflows. Playwright installs Chromium without `--with-deps`; no workflow
installs operating-system packages or uses `sudo`.

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
