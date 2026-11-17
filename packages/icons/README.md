# @bloxwap/icons

A curated icon dependency for Bloxwap's web apps, native app, and HIG. One
versioned catalog owns the geometry. Lucide is an attributed source for the
initial artwork, not a runtime dependency. Token images, exchange logos, and
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
sources remain vector, and sources share a bounded 256-entry cache. Explicit
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

## Maintaining the catalog

`catalog.json` is the reviewed source of truth. Add only icons used by a consumer.
`pnpm generate` optimizes it and emits identical geometry for every platform.
`pnpm build`, `pnpm check`, and `pnpm test` verify generated output, types,
accessibility, rendering parity, package boundaries, and bundle cost. The
original licenses in LICENSE and NOTICE must accompany redistributed artwork.
