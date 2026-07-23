# Architecture and boundaries

Status: Evolving  
Scope: `@carbonenginejs/format-gr2`  
Audience: Users, integrators, and maintainers  
Summary: Defines the reader's boundary, codec ownership, and the licensing constraint that keeps it a separate package.

## Boundary

The package root exports one public class: `CjsFormatGr2`. The `Cjs` prefix
marks a CarbonEngineJS format/construction boundary, not an engine runtime
class. The exposed class lives in `src/CjsFormatGr2.js`; internal read
pipeline helpers and codecs live under `src/core` so the public class surface
stays easy to review.

The reader owns: container parsing, section decompression (None, Oodle1,
BitKnit2), reflected type-tree walking, GR2 JSON emission, GSF (GState)
profile detection and reading, optional curve decompression, CCP packed
tangent-frame unpacking, and missing-channel rebuilds. It emits data and
hydrates caller-supplied classes; it does not own resource lifecycle, caches,
or GPU realization.

GSF is a semantic profile of the same Granny container, not a separate codec:
`isGsf`, `readGsf`, `readGsfAsync`, and `inspectGsf` (instance `IsGSF`,
`ReadGSF`, `InspectGSF`) expose GState roots, state-machine data, animation
slots and sets, model/retarget hints, and relative `.gr2` references.

## Licensing

This package is MIT. The historical EUPL-1.2 constraint (an EUPL-derived
BitKnit port) was resolved on 2026-07-24 by replacing that file with an
original clean-room implementation written from the published
[BitKnit2 format specification](formats/bitknit2.md) and validated
byte-exact against the EVE `.gr2` corpus.

`@carbonenginejs/runtime-resource` (MIT) is the intended future owner of GR2
reading; that migration was previously gated on this licensing disposition
and is now an open organizational decision. Until it happens this package
remains separate and active.

See `LICENSE`, `NOTICE`, and `THIRD-PARTY-NOTICES.md` for provenance and
redistribution requirements. The package contains no RAD/Granny proprietary
code and does not link `granny2.dll`.

## Relationships

- `@carbonenginejs/core-math` owns the extracted tangent/mesh math; this
  package keeps compatibility glue in `src/core/tangents.js` that delegates
  to it.
- `@carbonenginejs/runtime-resource/formats/cmf` consumes decoded GR2-shaped
  data (`{knots, controls}` curves, shared geometry) for CMF conversion
  without importing this package.
- Transient Carbon-shaped helpers live under `src/carbon` until a shared
  library owns them; they are not public API.

## Related documentation

- [Reader API](reference/api.md)
- [GR2 JSON graph and hydration](reference/json-graph.md)
