# Bloxwap Icons documentation

A Fumadocs + Next.js static website using Bloxwap Sans/Mono and the same shared
HIG styles as the SFX, Font, and Chart documentation sites.

From the repository root (Node 24+, pnpm 11.1.0):

```sh
pnpm install
pnpm docs:dev
```

The local development server runs at http://127.0.0.1:3909, in the sibling
open-source projects' 3900-series. Ports 3900–3908 are already assigned to
their sites and previews, including SFX browser tests on 3908. Icons binds
explicitly to IPv4 on 3909 so HTTP and hot-reload WebSocket requests use
the same server.
Use `pnpm docs:test:dev` to check that the dev page stays stable while idle.
The docs scripts build the UI package automatically. No sibling checkout,
asset-server credentials, Redis, or S3 service is needed.

## Verify the GitHub Pages build

```sh
NEXT_PUBLIC_BASE_PATH=/icons pnpm docs:build
NEXT_PUBLIC_BASE_PATH=/icons pnpm docs:check
pnpm --filter @bloxwap/icons-docs exec playwright install chromium
pnpm docs:test
NEXT_PUBLIC_BASE_PATH=/icons pnpm docs:preview
```

Preview: http://127.0.0.1:3918/icons/. The static output lives in `out/`.
The build checks every internal HTML link/asset, all SVG downloads, the search
index, and documentation routes. Browser tests cover search/filtering, previews,
code copying (including denied clipboard access), downloads, documentation
search, mobile layout, and keyboard interactions.

Omit `NEXT_PUBLIC_BASE_PATH` to build for a domain root. For browser tests against
that build, set `NEXT_PUBLIC_BASE_PATH='' pnpm docs:test`.

## Structure

- `app/`: landing page, Fumadocs shell, static routes.
- `content/docs/`: MDX guides and navigation order.
- `components/`: searchable icon browser and shared UI.
- `scripts/prepare-assets.mjs`: verifies shared HIG packages, copies package SVGs
  and licenses from the reviewed consumer catalog.
- `public/generated/`: ignored build output; never edit or commit.

UI geometry and the usage allowlist come from `../../packages/icons`.
The gallery includes only the audited Bloxwap monorepo icons and Pro chart
SVGs. Each icon links to its recorded source revision. Three earlier exports
(`CircleX`, `ScanLine`, `SlidersHorizontal`) remain in the package for
compatibility but do not appear in the gallery. The image collections stay in
`../../assets`. The docs do not include the full
580 MB image library in a Pages artifact.

## Deployment

`.github/workflows/icons.yml` replaces the legacy protocol-image publisher.
It validates pull requests and uploads/deploys `apps/docs/out` from the default
branch, `main`. It uses `/icons` as
the base path and `https://bloxwap.github.io` as the site origin.

In GitHub Settings → Pages, select **GitHub Actions** as the source and clear
the legacy `icons.llama.fi` custom domain before the first documentation release.
This change prepares deployment; it does not modify repository settings or
publish the current working tree. Consumers of the old protocol-only Pages
endpoint need a separate asset hosting destination before that endpoint is retired.
