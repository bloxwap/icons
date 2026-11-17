# Shared UI icons

`@bloxwap/icons@0.1.0` owns the reviewed interface and Pro chart icon catalogs.
The catalog uses a 24-unit grid. Interface icons default to a stroke width of two;
Pro chart icons retain a 1.5-unit stroke. `packages/icons/usage.json` records the
consumer inventory used by the documentation gallery. Geometry is
curated from the audited Lucide artwork, with its ISC/MIT attribution retained;
Lucide is not a runtime dependency of the new package.

```tsx
// Web: a native SVG element, with ordinary SVG props and a React 19 ref.
import {Search} from '@bloxwap/icons/react/search';
<Search size={20} aria-label="Search" />

// React Native: one expo-image view, with numeric size and native image props.
import {Search as NativeSearch} from '@bloxwap/icons/native/search';
<NativeSearch size={20} color="#00c853" accessibilityLabel="Search" />
```

Both renderers are decorative by default. Usually put the accessible name on
the containing button. Use individual native imports so Metro never loads the
whole catalog. Web barrel imports also tree-shake. Framework-independent SVG
definitions and raw SVG files are exported for other renderers.

## Prepared consumers

The library is on `feat/shared-ui-icons` in this repository. Matching branches
are prepared in `../worktrees/icons-monorepo` and `../worktrees/icons-hig`.
The original monorepo and HIG working directories were left untouched.

The monorepo migration covers owned web and mobile imports, documentation icon
metadata, shared UI packages, and the 28-icon plain DOM adapter. Its
`check:icons` command rejects new Lucide source imports and native barrel imports.
HIG's web SVGs and native view-drawn symbols now use the same library, including
selection, navigation, status, trade, swap, wallet, and table-sort glyphs.
Token logos, brand art, charts, and functional QR codes retain their own renderers.

Each consumer includes the same archive at `vendor/bloxwap-icons-0.1.0.tgz` and
uses relative `file:` dependencies. This makes the changes installable before
publication, without a symlink to this checkout. Use Bun 1.4.4 for the monorepo
lockfiles; HIG also checks its npm lockfile with its pinned npm 11.6.1.

## Release order

1. Published the reviewed `packages/icons` package as `@bloxwap/icons@0.1.0` on 2026-11-17.
2. Replace the consumers' archive dependencies with `0.1.0` and regenerate their
   lockfiles. HIG and ui-native already declare the `^0.1.0` icon peer.
3. Release the HIG migration through HIG's normal coordinated-version workflow.
4. Upgrade the monorepo's HIG dependency to that release. Its existing HIG 0.5.2
   pin is deliberately still present in this migration; app-owned icons already
   use the new package, while HIG internals require the new HIG release.
5. Rebuild the mobile development client and production binary with the
   SDK-compatible `expo-image` module. JavaScript-only updates cannot add a
   missing native module. The current mobile SDK 58 consumer uses `~58.0.18`.

The icon package is published; the consumer migrations and documentation deployment
remain separate steps. The consumer Next.js build gate described in
[verification](evidence/verification.md) must be resolved before releasing those migrations.

## Native rendering tradeoffs

Native icons encode the shared SVG geometry in an inline image source. A
weak cache preserves each imported icon's default source; a separate 256-entry
LRU cache bounds customized paint. Monochrome icons use native tint to respect
React Native's host color space, including Display P3 on iOS. Expo rasterizes
tinted SVGs at the view size on iOS; changing `size` requests a new rendered size,
while transform scaling may scale the cached bitmap. Explicit two-color fills
use SVG paint in sRGB. Animate the host view for opacity, rotation, and movement.

The one-view structure removes per-path React Native views. The measured bundle
cost excludes peer libraries, and no device frame-time or memory improvement is
claimed. Profile release builds on representative iOS and Android hardware
before choosing a native renderer based on timing alone.
