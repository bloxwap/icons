# Shared Bloxwap HIG styles

These three MIT-licensed packages are the same reviewed candidate artifacts used
by `bloxwap/chart`, from HIG commit `872906a9071469af8714b3b6fb5cc7bd64d2d6f3`.
They supply the shared palette, spacing, typography roles, and control styles.
The HIG packages are not public on npm, so the docs consume the tarballs through
`file:` dependencies and pnpm workspace overrides. No sibling checkout is
needed to install or build this repository.

`provenance.json` records the source and SHA-256 checksums. The documentation's
asset preparation step verifies every tarball. Update all three artifacts and
their lockfile entries together, then rebuild and test the docs. Licenses are
included inside the packages. Bloxwap Sans and Mono come from `@bloxwap/font`.
