# Native renderer verification

From the repository root, run `node scripts/pack-ui-icons.mjs`. In this directory,
run `npm ci` and `npm start`, then open the project in Expo Go for SDK 58. The
screen reports successful native decoding for the entire catalog and lets you
check contrast after a theme change. `npm run export` bundles both iOS and Android.
After changing the archive, first refresh its locked checksum from this directory:
`npm install --package-lock-only --ignore-scripts @bloxwap/icons@file:../../artifacts/bloxwap-icons-0.1.0.tgz`.
Then run `npm ci` so the fixture tests the newly packed implementation.
Restart Metro with `npm start -- --clear` after changing a package archive or
when running with `CI=1`, which disables normal file watching.

`DecodeTests.swift` is an XCTest UI test for the running gallery at port 8094.
Run it in an iOS UI test target with Expo Go installed. It waits for every decode,
checks the error count, switches the theme, asserts the new theme label, and
attaches both screenshots. Start from a freshly loaded gallery in its dark theme. XCTest
is used because Swift Testing does not support UI automation.

The image host is mocked in unit tests; this fixture uses the real Expo image
module. Simulator timings are not a substitute for profiling a release app on
representative devices.
