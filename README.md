# gr2reader

Pure-JavaScript reader for RAD Granny 3D **`.gr2`** files. No `granny2.dll`, no native
addons, no build step — runs in Node and the browser.

It decodes every section-compression codec used by current EVE Online assets
(**None**, **Oodle1**, **BitKnit2**), reconstructs the Granny object graph by walking the
file's embedded type tree (the same reflection `granny2.dll` does), and emits the
`gr2_json` shape produced by the legacy C++ `evegr2tojson` tool — so it's a drop-in
replacement for that native pipeline.

## Status

| Layer | State |
|---|---|
| Container: header, section directory, pointer-fixup relocation | ✅ |
| Codec: None (raw) | ✅ |
| Codec: Oodle1 | ✅ validated 25/25 vs granny2.dll oracle |
| Codec: BitKnit2 | ✅ validated 40/40 vs granny2.dll oracle |
| Generic type-tree reflection → object graph | ✅ |
| `gr2_json` emitter (vertices, indices, curves) | ⏳ assembling |
| Optional curve decompression (`decompressCurves`) | ✅ all 19 granny formats; validated vs ccpwgl reference decoders (max diff 0) |
| Optional tangent unpacking (`unpackTangents`) | done: packed CCP tangent frames |

> BitKnit2 files store their pointer-fixup tables **BitKnit2-compressed** (not raw like
> None/Oodle1 files); the relocation layer handles both framings.

## Usage

```js
import { readFileSync } from "node:fs";
import { readGr2, curves, tangents } from "gr2reader";

const result = readGr2(readFileSync("model.gr2"), {
  emit: "gr2_json",         // "gr2_json" (default) | "raw" (the granny_file_info graph)
  decompressCurves: false,  // opt-in: resolve compressed granny curves → knots/controls
  unpackTangents: false,   // opt-in: unpack packed tangent frames
});
```

### CLI

```sh
gr2reader model.gr2            # writes model.gr2_json next to the input
```

## Options

- **`emit`** — `"gr2_json"` (default): the exe-compatible JSON object. `"raw"`: the raw
  reflected `granny_file_info` graph.
- **`decompressCurves`** — default `false`. When `false`, animation curves are passed
  through in their on-disk compressed form (matches `evegr2tojson`, byte-identical).
  When `true`, every `orientation` / `position` / `scaleShear` curve of every
  transform track gains three decoded fields **in addition to** its raw fields
  (`knotsControls`, `controlScales`, `oneOverKnotScaleTrunc`, ... are kept as-is):

  - `knots: number[]` — knot times, non-decreasing
  - `controls: number[]` — `knots.length × dimension` floats
  - `dimension: number` — 4 (orientation, quaternion), 3 (position), 9 (scaleShear, mat3)

  All 19 granny curve formats (0–18: `DaKeyframes32f`, `DaK32fC32f`, `DaIdentity`,
  `DaConstant32f`, `D3Constant32f`, `D4Constant32f`, `DaK16uC16u`, `DaK8uC8u`,
  `D4nK16uC15u`, `D4nK8uC7u`, `D3K16uC16u`, `D3K8uC8u`, `D9I1K16uC16u`,
  `D9I3K16uC16u`, `D9I1K8uC8u`, `D9I3K8uC8u`, `D3I1K32fC32f`, `D3I1K16uC16u`,
  `D3I1K8uC8u`) are implemented in `src/curves.js`. Named functions are exported directly; lowercase
  namespace objects group the same helpers:

  ```js
  import { curves, decodeCurve } from "gr2reader";
  const { knots, controls, degree, dimension } = curves.decode(curveJson, 4);
  const same = decodeCurve(curveJson, 4);
  ```
- **`unpackTangents`** - default `false`. Optional unpacking of packed tangent
  frames into normal, tangent, and binormal channels. Tangent helpers are available as
  named exports and through `tangents.unpack`, `tangents.pack`, and `tangents.decode`.

## Roadmap

- Integrate more directly with CCPWGL / CarbonEngine classes so consumers can opt into
  engine-native objects instead of always using `gr2_json` as an intermediate representation.

## License / attribution

Original code plus ported decompressors from open reverse-engineering projects — see
[`NOTICE`](./NOTICE) for full provenance (opengr2 MPL-2.0, pybg3 MIT, Knit EUPL-1.2).
Contains no RAD/Granny proprietary code.
