# @carbonenginejs/format-gr2

Pure-JavaScript CarbonEngineJS-facing reader for RAD Granny 3D `.gr2` and
Granny State `.gsf` files. No
`granny2.dll`, no native addons, no build step; it runs in Node and the browser.

It decodes every section-compression codec used by current EVE Online assets
(None, Oodle1, BitKnit2), reconstructs the Granny object graph by walking the
file's embedded type tree, and emits GR2 JSON or caller-supplied classes.
Because GSF uses the same Granny container and reflected type tree, this package
also detects GState roots and exposes their state-machine data, animation slots,
animation sets, model/retarget hints, and relative `.gr2` references.

This format profile targets GR2 assets and packed tangent conventions used by
CarbonEngine and Fenris Creations (CCP Games). The tangent-frame math is a
JavaScript implementation derived from observed EVE/CarbonEngine shader
behavior; no Fenris Creations (CCP Games) shader source is copied here. See
`NOTICE` and `THIRD-PARTY-NOTICES.md`.

## Install

```sh
npm install @carbonenginejs/format-gr2
```

## Public API

The package root exports one public class: `CjsFormatGr2`. The `Cjs` prefix
marks this as a CarbonEngineJS format/construction boundary, not an engine
runtime class. The exposed class lives in `src/CjsFormatGr2.js`; internal read
pipeline helpers and codecs live under `src/core` so the public class surface
stays easy to review.

```js
import CjsFormatGr2 from "@carbonenginejs/format-gr2";

const reader = new CjsFormatGr2({
  emit: "json",             // "json"/"gr2Json" default | "gr2" | "cmf" | "raw"
  decompressCurves: false,  // opt-in: resolve compressed granny curves
  unpackTangents: false,    // opt-in: unpack packed CCP tangent frames
  rebuildMissingNormals: false,
  rebuildMissingTangents: false,
  rebuildMissingBiNormals: false,
  classes: {
    Root: CjsGr2Root,
    Mesh: CjsGr2Mesh,
    BoneBinding: CjsGr2BoneBinding,
    IndexGroup: CjsGr2IndexGroup,
    MorphTarget: CjsGr2MorphTarget,
    Model: CjsGr2Model,
    Skeleton: CjsGr2Skeleton,
    Bone: CjsGr2Bone,
    Animation: CjsGr2Animation,
    TrackGroup: CjsGr2TrackGroup,
    TransformTrack: CjsGr2TransformTrack,
    Curve: CjsGr2Curve,
  },
});

const json = reader.Read(buffer);
const summary = reader.Inspect(buffer);
const text = JSON.stringify(reader.ToJSON(json));

if (CjsFormatGr2.isGsf(buffer)) {
  const gstate = CjsFormatGr2.readGsf(buffer);
  const summary = CjsFormatGr2.inspectGsf(buffer);
}
```

The named export is the same class for callers that prefer named imports:

```js
import { CjsFormatGr2 } from "@carbonenginejs/format-gr2";
```

## Reader Rules

- Instance methods are PascalCase because reader instances can hydrate and
  extend CarbonClasses. This keeps reader commands such as `Read`, `SetValues`,
  and `SetClass` out of the camelCase/property namespace used by Carbon data,
  avoiding collisions such as an `emit` property versus an eventual
  `emit(event)` instance method.
- Static one-shot methods are camelCase because they live on `CjsFormatGr2`
  itself, not on hydrated CarbonClass instances.
- GSF is a semantic profile of the same Granny container, not a separate
  codec. Use `isGsf`, `readGsf`, `readGsfAsync`, and `inspectGsf`; instance
  equivalents are `IsGSF`, `ReadGSF`, and `InspectGSF`.
- The package determines the input family: GR2 binary or GR2-shaped data for
  load-style APIs. `emit` determines the output shape, and `classes` must match
  that emitted shape.
- JSON builds use `reader.Read(buffer)` or static `CjsFormatGr2.read(buffer)`.
  They return GR2 JSON by default.
- Class builds use the same read path with configured classes. Use
  `reader.SetClass(type, Class)`, `reader.SetClasses(classes)`, or pass
  `classes` in the options object.
- Instantiate `new CjsFormatGr2(options)` when the same build rules should be
  reused; static methods are allocation-free one-shot convenience wrappers.
- `ToJSON` / `toJSON` converts format output to a JSON-compatible value. It is
  not a binary `.gr2` writer and does not return JSON text.
- Conversion options preserve authored data while changing representation, such
  as `decompressCurves` and `unpackTangents`.
- Rebuild options generate missing data from available geometry. Repairing
  existing-but-bad data is a separate future concern.
- Shared schema, decorators, registries, and type utilities belong in the future
  `@carbonenginejs/core-types` package.
- Tangent helpers stay in this package for now because unpacked CCP tangent
  frames are part of GR2 post-processing. They are expected to move to a future
  shared `@carbonenginejs/core-math` package once that package exists.

## GR2 JSON Graph

`emit: "json"` is the default; `"gr2Json"` remains the explicit debug alias for
the same JSON-compatible graph. It returns a stable graph with
deinterleaved vertex channels, triangle-index groups, embedded model skeletons,
and compact animation curve records. Square-bracketed fields are conditional:

```text
Root
|-- grannyFileFormatRevision, grannyFileSource
|-- meshes: Mesh[]
|   |-- name, minBounds, maxBounds
|   |-- boneBindings: BoneBinding[]
|   |   `-- name, minBounds, maxBounds
|   |-- morphTargets: MorphTarget[]
|   |   |-- name, dataIsDeltas
|   |   `-- vertex: VertexChannels
|   |-- vertex: VertexChannels
|   |   |-- position, normal, tangent, binormal
|   |   |-- texcoord0, texcoord1
|   |   |-- blendIndice, blendWeight
|   |   `-- all channels are flat numeric arrays
|   `-- indices: IndexGroup[]
|       `-- name, bytesPerIndex, faces
|-- models: Model[]
|   |-- name, meshBindings, [extendedData]
|   `-- skeleton: Skeleton
|       |-- name, [extendedData]
|       `-- bones: Bone[]
|           `-- name, parentIndex, flag, [position], [orientation], [scaleShear], [extendedData]
`-- animations: Animation[]
    |-- name, duration, timeStep, oversampling, defaultLoopCount, flags, [extendedData]
    `-- trackGroups: TrackGroup[]
        `-- transformTracks: TransformTrack[]
            |-- name, flags
            |-- orientation: Curve
            |-- position: Curve
            `-- scaleShear: Curve

Curve
|-- format, degree
|-- [dimension], [knots], [controls]
|   `-- present for uncompressed curves and for supported curves after `decompressCurves`
|-- [oneOverKnotScaleTrunc], [controlScaleOffsets], [scaleOffsetTableEntries]
|-- [oneOverKnotScale], [controlScales], [controlOffsets], [knotsControls]
`-- [error]
```

`Curve` records always include `format` and `degree`, plus fields required by
that Granny curve format, such as `dimension`, `knots`, `controls`,
`controlScales`, `controlOffsets`, `knotsControls`, or an `error` message.
When `decompressCurves` is enabled, supported compressed curves also gain
decoded `knots`, `controls`, and `dimension` fields while keeping their raw
format-specific data.

## Options

- `emit`: `"json"`/`"gr2Json"` default. `"gr2"` and `"cmf"` hydrate
  caller-supplied compatibility classes for runtime-style consumers; their
  `classes` maps must contain the constructors required by that output shape.
  `"raw"` returns the reflected `granny_file_info` graph from the low-level
  reader.
- `decompressCurves`: default `false`. When `true`, every animation transform
  curve gains decoded `knots`, `controls`, and `dimension` fields while keeping
  the raw compressed fields.
- `unpackTangents`: default `false`. `true` decodes packed CCP tangent frames
  into separate `normal`, `tangent`, and `binormal` vertex channels. A function
  rule receives `{ reader, options, raw, json, mesh, meshIndex }` and must return
  `true` or `false` for that mesh.
- `rebuildMissingNormals`: default `false`. `true` generates missing `normal`
  channels from `vertex.position` and triangle indices. Missing required data
  throws.
- `rebuildMissingTangents`: default `false`. `true` generates missing `tangent`
  channels from `vertex.position`, `vertex.normal`, `vertex.texcoord0`, and
  triangle indices. Missing required data throws.
- `rebuildMissingBiNormals`: default `false`. `true` generates missing
  binormals into the current `binormal` channel from `vertex.normal` and
  `vertex.tangent`. Missing required data throws.
- Missing-channel rebuild options also accept rule functions. They receive
  `{ reader, options, raw, json, mesh, meshIndex, feature, channel }` and must
  return `true` or `false`.
- `classes`: optional for `new CjsFormatGr2(options)`, `Read`, and static
  `read`. Maps node keys to constructors that follow the class hydration
  contract below; omitted keys remain plain objects. Accepted keys are shown in
  the example above and exposed as `CjsFormatGr2.CLASS_KEYS`. With the default
  `emit: "json"`, classes describe the GR2 JSON graph.

## Class Hydration Contract

Class hydration is structural and intentionally thin. For each registered key,
the reader creates an instance and passes the same fields that would have been
written to the plain GR2 JSON object through the CarbonEngineJS `SetValues`
convention:

```js
new Class().SetValues(nodeFields);
```

Provided classes must be constructible with no required arguments and must
implement `SetValues(values)`. They do not need to predeclare fields, but if they
do, use the names below. If a class implements `toJSON`, `ToJSON` / `toJSON`
will use it during JSON-compatible conversion.

The class map accepted by `SetClasses(classes)` and `options.classes` can contain
only the keys in `CjsFormatGr2.CLASS_KEYS`. `SetClass(type, Class)` accepts one
of those same keys as its `type` argument.

```js
class MyMesh {
  name = "";
  vertex = null;
  indices = [];
}
```

| Class key | Assigned structure |
|---|---|
| `Root` | `grannyFileFormatRevision`, `grannyFileSource`, `meshes`, `models`, `animations` |
| `Mesh` | `name`, `morphTargets`, `minBounds`, `maxBounds`, `boneBindings`, `vertex`, `indices` |
| `BoneBinding` | `name`, `minBounds`, `maxBounds` |
| `IndexGroup` | `name`, `bytesPerIndex`, `faces` |
| `MorphTarget` | `name`, `dataIsDeltas`, `vertex` |
| `Model` | `name`, `skeleton`, `meshBindings`, optional `extendedData` |
| `Skeleton` | `name`, `bones`, optional `extendedData` |
| `Bone` | `name`, `parentIndex`, `flag`, optional `position`, `orientation`, `scaleShear`, `extendedData` |
| `Animation` | `name`, `duration`, `timeStep`, `oversampling`, `defaultLoopCount`, `flags`, `trackGroups`, optional `extendedData` |
| `TrackGroup` | `name`, `transformTracks` |
| `TransformTrack` | `name`, `flags`, `orientation`, `position`, `scaleShear` |
| `Curve` | `format`, `degree`, plus format-specific curve fields such as `dimension`, `knots`, `controls`, `oneOverKnotScaleTrunc`, `controlScaleOffsets`, `scaleOffsetTableEntries`, `oneOverKnotScale`, `controlScales`, `controlOffsets`, `knotsControls`, or `error` |

`Mesh.vertex` and `MorphTarget.vertex` are plain channel containers with flat
numeric arrays. Missing channels are empty arrays.

`MorphTarget.name` preserves the source Granny `ScalarName`. Carbon/Trinity
runtime resources strip a trailing exact `Shape` suffix when exposing morph
weight controls; this reader leaves that runtime-name normalization to
resource/adaptor code.

| Vertex field | Layout |
|---|---|
| `position` | xyz triples |
| `blendIndice` | xyzw bone-index groups |
| `tangent` | xyzw packed/authored tangents, or xyz after `unpackTangents` / rebuild |
| `normal` | xyz triples |
| `texcoord0`, `texcoord1` | uv pairs |
| `binormal` | xyzw authored binormals, or xyz after `unpackTangents` / rebuild |
| `blendWeight` | xyzw bone-weight groups |

`IndexGroup.faces` is a flat triangle-index array in groups of three.

## CLI

```sh
format-gr2 model.gr2            # writes model.json next to the input
gr2reader model.gr2             # legacy alias
```

## Helper Namespaces

Helper namespaces are static properties on `CjsFormatGr2`:

```js
const decoded = CjsFormatGr2.curves.decode(curveJson, 4);
const unpacked = CjsFormatGr2.tangents.unpack(mesh);
```

## License / Attribution

Current license: `EUPL-1.2`.

`@carbonenginejs/format-gr2` is currently EUPL-1.2 because `src/core/bitknit2.js` derives from
EUPL-1.2 prior work. The intended future target is MIT once that implementation
is replaced, removed, or re-derived from permissively licensed sources. See
`LICENSE`, `NOTICE`, and `THIRD-PARTY-NOTICES.md` for provenance and current
redistribution requirements.

Contains no RAD/Granny proprietary code and does not link `granny2.dll`.
CarbonEngine and Fenris Creations (CCP Games) source material, tools, assets,
formats, and shader behavior remain copyright their original holders. This
package is not affiliated with or endorsed by CCP Games.
