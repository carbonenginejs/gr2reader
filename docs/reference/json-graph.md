# GR2 JSON graph and class hydration

Status: Evolving  
Scope: `@carbonenginejs/format-gr2`  
Audience: Users and integrators  
Summary: Documents the emitted GR2 JSON graph, curve records, vertex layouts, morph-target semantics, and the class-hydration contract.

## The GR2 JSON graph

`emit: "json"` is the default; `"gr2Json"` remains the explicit debug alias
for the same JSON-compatible graph. It returns a stable graph with
deinterleaved vertex channels, triangle-index groups, embedded model
skeletons, and compact animation curve records. Square-bracketed fields are
conditional:

```text
Root
|-- grannyFileFormatRevision, grannyFileSource
|-- meshes: Mesh[]
|   |-- name, minBounds, maxBounds
|   |-- boneBindings: BoneBinding[]
|   |   `-- name, minBounds, maxBounds
|   |-- morphTargets: MorphTarget[]
|   |   |-- name, dataIsDeltas, [vertexIndices]
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

## Class hydration contract

Class hydration is structural and intentionally thin. For each registered
key, the reader creates an instance and passes the same fields that would
have been written to the plain GR2 JSON object through the CarbonEngineJS
`SetValues` convention:

```js
new Class().SetValues(nodeFields);
```

Provided classes must be constructible with no required arguments and must
implement `SetValues(values)`. They do not need to predeclare fields, but if
they do, use the names below. If a class implements `toJSON`,
`ToJSON` / `toJSON` will use it during JSON-compatible conversion.

The class map accepted by `SetClasses(classes)` and `options.classes` can
contain only the keys in `CjsFormatGr2.CLASS_KEYS`. `SetClass(type, Class)`
accepts one of those same keys as its `type` argument.

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
| `MorphTarget` | `name`, `dataIsDeltas`, `vertex`, optional `vertexIndices` |
| `Model` | `name`, `skeleton`, `meshBindings`, optional `extendedData` |
| `Skeleton` | `name`, `bones`, optional `extendedData` |
| `Bone` | `name`, `parentIndex`, `flag`, optional `position`, `orientation`, `scaleShear`, `extendedData` |
| `Animation` | `name`, `duration`, `timeStep`, `oversampling`, `defaultLoopCount`, `flags`, `trackGroups`, optional `extendedData` |
| `TrackGroup` | `name`, `transformTracks` |
| `TransformTrack` | `name`, `flags`, `orientation`, `position`, `scaleShear` |
| `Curve` | `format`, `degree`, plus format-specific curve fields such as `dimension`, `knots`, `controls`, `oneOverKnotScaleTrunc`, `controlScaleOffsets`, `scaleOffsetTableEntries`, `oneOverKnotScale`, `controlScales`, `controlOffsets`, `knotsControls`, or `error` |

## Morph targets

`Mesh.vertex` and `MorphTarget.vertex` are plain channel containers with flat
numeric arrays. Missing channels are empty arrays. Native Granny morph
targets contain one row per mesh vertex. CCP character blend shapes stored as
Granny vertex annotation sets use the same `MorphTarget` shape with
`dataIsDeltas: true`; sparse targets additionally contain `vertexIndices`,
whose entries map each target row to its mesh vertex. Empty annotation sets
are omitted.

The CMF output expands sparse targets to the mesh vertex count and stores
every target as additive deltas. Native targets with `dataIsDeltas: false`
are converted from absolute attributes by subtracting the corresponding base
mesh attributes. Its morph declaration is the union of channels used by all
targets, and absent channels are zero-filled.

`MorphTarget.name` preserves the source Granny `ScalarName`. Carbon/Trinity
runtime resources strip a trailing exact `Shape` suffix when exposing morph
weight controls; this reader leaves that runtime-name normalization to
resource/adaptor code.

## Vertex layouts

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

## Related documentation

- [Reader API](api.md)
- [Architecture and boundaries](../architecture.md)
