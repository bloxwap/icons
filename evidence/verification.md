# Icon verification — 2026-11-16

The original migration results below describe the 123-icon candidate. The
[264-icon follow-up](#react-and-react-native-follow-up--2026-11-17) records the
current catalog and optimization checks.

The release candidate is `@bloxwap/icons@0.1.0`. The identical archive is used in
the monorepo and HIG migrations. Its SHA-256 is
`45a7c508ab4f7c4595e2046f785a8c5fb64daed4136fc80d76942b7ee671c6d7`.

## Catalog and package

| Check | Result |
| --- | --- |
| Canonical icons / compatibility aliases | 123 / 9 |
| Catalog usage audit | Every canonical icon has a consumer |
| Original / optimized geometry nodes | 374 / 212 |
| Combined raw SVG size | 38,860 bytes |
| Installable archive | 63,199 bytes |
| React Check, minified + gzip | 522 bytes from barrel; 523 bytes from direct entry |
| React Check + Search + ChevronRight, gzip | 624 bytes |
| Native Check, minified + gzip | 1,057 bytes from direct entry |
| Largest mean alpha difference after optimization | 0.0280% |

Bundle measurements exclude peer dependencies such as React and Expo Image;
they are not the total app download or memory cost. Native source caching is
bounded to 256 entries; Expo manages its own image cache separately.

`pnpm --filter @bloxwap/icons build`, `check`, and `test` pass. Eight tests cover
all aliases, accessibility, paint serialization, cache eviction, native host
props, every icon's web/native SVG pixel parity at multiple sizes and paints,
optimized/source pixel equivalence, tree-shaking, and platform isolation.
The existing asset server builds, and both token-catalog tests pass.

Chromium rendered all 123 icons and verified `absoluteStrokeWidth` computes to
`non-scaling-stroke`; ordinary icons compute to `none`. Safari also verified
these CSS properties during development. See [web gallery](screenshots/web.png).

The real Expo Image fixture exports both iOS and Android Metro bundles. An
iPhone 18 Pro simulator on iOS 27.2, Expo Go 58.0.7, and React Native 0.88.1
decoded all 123 icons with zero errors. The XCTest fixture checks the reported
decode count and the actual theme state before attaching screenshots.
The final strengthened test passed: [dark theme](screenshots/ios-dark.png) and
[light theme](screenshots/ios-light.png).
Android runtime screenshots and physical-device timing are not part of this run.

## Consumers

| Consumer check | Result |
| --- | --- |
| Monorepo import guard | Pass; no owned Lucide source imports |
| App, pro, mobile, docs, blog, deck, analytics, plain-ui type checks | Pass |
| App and pro lint | Pass |
| Docs icon tests | 47 pass |
| Plain DOM adapter tests | 3 pass |
| Mobile affected tests | 405 pass across six suites |
| HIG library build, lint, type check | Pass |
| HIG native suite | 565 pass across 51 suites |
| HIG web suite | 691 pass; 3 docs-artifact failures described below |
| HIG packed web and dependency boundaries | Pass |
| HIG packed native RN 0.88 consumer | Pass: types, refs, fonts, gallery, gestures, adoption; iOS and Android exports |
| Frozen installs and HIG npm/Bun lock agreement | Pass |

The initial complete mobile run covered 4,539 tests. Twenty icon-specific
assertions were updated for the new image host and all affected suites reran
successfully. One unchanged test in `src/hig/numbers.test.tsx` still fails its
`intlConforms` full-ICU expectation on local Node 24.6.0 / ICU 77.1; its isolated
run has 19 passing tests and one failure. The full mobile suite was not rerun
after those targeted fixes. No previously locked package resolution changed in
the monorepo root lockfile; Bun also removed redundant lock entries.

## Build limits

The pro app and HIG docs reach Next.js compilation but their production builds
stop at the existing Next 16.4.2 `SecurityFatalError` gate. It reports a known
vulnerability in that installed Next.js version. The gate was not disabled and
Next.js was not upgraded as part of this icon migration. HIG consequently lacks
the static docs artifacts needed by three web tests. This is not a fully green
release build; resolve the existing Next.js upgrade before shipping.

The native structure uses one image view instead of per-path SVG views. No
on-device frame-time, scrolling, or memory improvement is claimed. iOS tinted
SVG rasterization and transform-scaling behavior are documented in
[the migration guide](../MIGRATION.md).

Reproduce the library checks from the repository README and the real native
check from [fixtures/native](../fixtures/native/README.md). The archive is a
local release candidate; no registry publication or deployment was performed.

## React and React Native follow-up — 2026-11-17

The expanded package contains 264 entries; the consumer gallery includes 261.
Default native source identity was retained for only 2 of 264 definitions on a
second sequential pass through the previous 256-entry cache. Default sources
now use a weak cache per imported definition: all 264 survive a second pass and
custom-paint churn. Customized paint retains a separate 256-entry LRU limit.
Cache hits no longer stringify SVG geometry. Chart defaults (1.5) no longer
collide with explicit 2-unit stroke overrides.

Unchanged builds preserve all 1,597 generated module, declaration, and manifest
timestamps. Outputs are compiled in a temporary directory before changed files
replace their previous versions, avoiding missing-module windows during dev.

| Check | Result |
| --- | --- |
| Package build, generated outputs, types, and tests | Pass; 11 tests |
| Web/native SVG pixel parity | All 264 entries, three sizes/paints |
| Largest optimized/source mean alpha difference | 0.0280% |
| React SSR and Chromium hydration | All 264 entries, zero errors |
| React browser behavior | React 19 ref, inherited fill, chart defaults, non-scaling stroke pass |
| Direct React Check / ProFib, minified + gzip | 528 / 567 bytes |
| Direct native Check / ProFib, minified + gzip | 1,157 / 1,189 bytes |
| Real Metro graph, direct ProFib import | iOS and Android include only ProFib geometry and shared native helpers |
| Packed Expo SDK 58 fixture | iOS and Android exports pass |
| iOS 27.2, Expo Go 58.0.7 | 264/264 decoded, zero errors; theme-switch XCTest passes |
| Documentation types and dev stability | Pass; one document request and one search-index request |

Bundle numbers exclude React and Expo Image. iOS screenshots were visually
checked in [dark](screenshots/ios-264-dark.png) and
[light](screenshots/ios-264-light.png) themes. The native test reads the catalog
count instead of hard-coding 123. Android native decoding and physical-device
frame-time/memory benchmarks were not run in this pass. Verification used an
isolated simulator and temporary servers, which were stopped afterward.

## npm publication — 2026-11-17

Published `@bloxwap/icons@0.1.0` publicly with the `latest` tag. Verified the npm
package page through browser automation and downloaded the registry archive
without authentication. Its bytes match the tested local archive exactly:

```text
sha512-BFBu9JA7GRakCXKG7/rq8ZNYEfcd77Zf/m7H57s07jePFGrahY6PLJLGC/FpVgRKh+ozD92w/R93ZaZyr6BwRg==
```

A clean temporary project installed the registry package with React and React DOM
19.3.1. All 264 React components rendered to SVG, all native/definition/SVG
subpaths resolved, chart defaults retained their 1.5 stroke, and the lockfile
integrity matched. Optional native peers were not installed for the web consumer.
Native runtime verification remains the fixture results above.

The future tag-triggered CI release workflow is prepared locally and its release
guard tests and actionlint checks pass. It still needs to be committed to GitHub
and connected to an npm trusted publisher before the first CI release.
