# @bloxwap/icons

A curated icon dependency for Bloxwap's web apps, native app, and HIG. One
versioned catalog owns the geometry. Lucide is an attributed source for the
interface artwork; the Pro chart collection retains the chart library’s
custom SVG geometry. Neither source is a runtime dependency. Token images, exchange logos, and
brand artwork still belong to their existing asset catalogs.

```tsx
import {Check} from '@bloxwap/icons/react';
// Explicit per-icon entries also work with bundlers that do not tree-shake.
import {Check as NativeCheck} from '@bloxwap/icons/native/check';

<Check size={20} color="currentColor" />
<NativeCheck size={20} color="#00c853" />
```

Install React for the web entry. Native consumers also install the version of
`expo-image` supported by their Expo SDK (`npx expo install expo-image`). Native
icons use one image view with an inline SVG source; they do not create a
`react-native-svg` tree, fetch artwork, or require an icon font. Geometry and stroke width are encoded in the SVG. Monochrome icons use native
tint so colors match the host's React Native color space, including Display P3
on iOS. Expo rasterizes tinted SVGs at the view size on iOS; the catalog and
sources remain vector. Each imported definition keeps one default source in a
weak cache; customized paint shares a bounded 256-entry LRU cache. Theme and ordinary
size changes reuse the default SVG source; `absoluteStrokeWidth` adjusts the
source stroke for the requested dimensions. Explicit
two-color fills use SVG paint in sRGB instead. Animation and layout belong on
the host view. Changing `size` requests a new rendered size; transform scaling
may scale a cached bitmap. One image view is a structural simplification, not
a guarantee of faster rendering on every device.

Icons are decorative by default. Name the containing button. For an independent
meaningful icon, use `aria-label` on web or `accessibilityLabel` on native.

The root entry contains framework-independent types and SVG serialization. Raw
SVGs are available from `@bloxwap/icons/svg/<name>.svg`; definitions from
`@bloxwap/icons/definitions/<name>` support other renderers. Import individual
icons; there is deliberately no global runtime icon-name registry.
Prefer per-icon native imports so Metro does not load the whole catalog. Web
barrel imports are supported by bundlers with tree shaking.

## Maintaining the catalog

`catalog.json` is the reviewed source of truth. Add only icons used by a consumer.
`pnpm generate` optimizes it and emits identical geometry for every platform.
`pnpm build`, `pnpm check`, and `pnpm test` verify generated output, types,
accessibility, rendering parity, package boundaries, and bundle cost. The
original licenses in LICENSE and NOTICE must accompany redistributed artwork.

## Consumer collections

`usage.json` records the Bloxwap monorepo imports/content metadata and all 137
SVGs in the Pro chart library, with source paths, revisions, and chart SVG
checksums. The docs gallery uses that allowlist; older package exports are
retained for consumer compatibility.

Chart components use a `Pro` prefix and `pro-` filenames to preserve the chart
artwork separately from similarly named Lucide icons:

```tsx
import {ProFib} from '@bloxwap/icons/react/pro-fib';
import {ProTrendline} from '@bloxwap/icons/native/pro-trendline';

<ProFib size={24} />
<ProTrendline size={24} color="#00ff3f" />
```

Their default stroke width is 1.5; ordinary interface icons default to 2.
Explicit `strokeWidth` overrides work on both platforms and in `toSvg`.
`ProStar` and `ProIcon` share the chart library's identical geometry and component.
Chart attribution is included in LICENSE and NOTICE.

To refresh the snapshot, run from the repository root:

```sh
node scripts/sync-consumer-icons.mjs ../monorepo ../chart-ts
pnpm --filter @bloxwap/icons build
pnpm --filter @bloxwap/icons check
pnpm --filter @bloxwap/icons test
```

The scanner includes value imports, MDX metadata/imports, and the shared plain
DOM icon adapter. It excludes tests, generated documentation, dependencies,
and build output. Review the resulting catalog and usage diff before release.
