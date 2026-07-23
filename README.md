# @carbonenginejs/format-gr2

Pure-JavaScript CarbonEngineJS-facing reader for RAD Granny 3D `.gr2` and
Granny State `.gsf` files.

Use this package when you need decoded Granny geometry, skeletons,
animations, morph targets, or GState data in Node or the browser — no
`granny2.dll`, no native addons, no build step. It decodes every
section-compression codec used by current EVE Online assets (None, Oodle1,
BitKnit2) and emits GR2 JSON or caller-supplied classes. It does not own
resource lifecycle or GPU work.

## Install

```sh
npm install @carbonenginejs/format-gr2
```

## Quick start

```js
import CjsFormatGr2 from "@carbonenginejs/format-gr2";

const json = CjsFormatGr2.read(buffer);          // GR2 JSON graph
const summary = new CjsFormatGr2().Inspect(buffer);

if (CjsFormatGr2.isGsf(buffer)) {
  const gstate = CjsFormatGr2.readGsf(buffer);   // GState profile
}
```

A CLI is included: `format-gr2 model.gr2` writes `model.json` next to the
input.

## Documentation

- [Package documentation](docs/README.md)
- [Architecture and boundaries](docs/architecture.md)
- [Reader API, options, and CLI](docs/reference/api.md)
- [GR2 JSON graph and class hydration](docs/reference/json-graph.md)

## License / Attribution

MIT. See `LICENSE`, `NOTICE`, and `THIRD-PARTY-NOTICES.md` for provenance
and redistribution requirements. The BitKnit2 decoder is an original
clean-room implementation written from this package's published
[format specification](docs/formats/bitknit2.md) (it replaced a prior
EUPL-derived port on 2026-07-24); the Oodle1 decoder derives from
permissively licensed open reverse-engineering work.

Contains no RAD/Granny proprietary code and does not link `granny2.dll`.
This format profile targets GR2 assets and packed tangent conventions used by
CarbonEngine and Fenris Creations (CCP Games); the tangent-frame math is a
JavaScript implementation derived from observed EVE/CarbonEngine shader
behavior, and no Fenris Creations (CCP Games) shader source is copied here.
CarbonEngine and Fenris Creations (CCP Games) source material, tools, assets,
formats, and shader behavior remain copyright their original holders. This
package is not affiliated with or endorsed by CCP Games.
