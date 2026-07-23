# Reader API

Status: Evolving  
Scope: `@carbonenginejs/format-gr2`  
Audience: Users and integrators  
Summary: Documents the public class, reader rules, options, helper namespaces, and the CLI.

## Public API

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

## Reader rules

- Instance methods are PascalCase because reader instances can hydrate and
  extend CarbonClasses. This keeps reader commands such as `Read`,
  `SetValues`, and `SetClass` out of the camelCase/property namespace used by
  Carbon data, avoiding collisions such as an `emit` property versus an
  eventual `emit(event)` instance method.
- Static one-shot methods are camelCase because they live on `CjsFormatGr2`
  itself, not on hydrated CarbonClass instances.
- The package determines the input family: GR2 binary or GR2-shaped data for
  load-style APIs. `emit` determines the output shape, and `classes` must
  match that emitted shape.
- JSON builds use `reader.Read(buffer)` or static `CjsFormatGr2.read(buffer)`.
  They return GR2 JSON by default.
- Class builds use the same read path with configured classes. Use
  `reader.SetClass(type, Class)`, `reader.SetClasses(classes)`, or pass
  `classes` in the options object.
- Instantiate `new CjsFormatGr2(options)` when the same build rules should be
  reused; static methods are allocation-free one-shot convenience wrappers.
- `ToJSON` / `toJSON` converts format output to a JSON-compatible value. It
  is not a binary `.gr2` writer and does not return JSON text.
- Conversion options preserve authored data while changing representation,
  such as `decompressCurves` and `unpackTangents`.
- Rebuild options generate missing data from available geometry. Repairing
  existing-but-bad data is a separate future concern.

## Options

- `emit`: `"json"`/`"gr2Json"` default. `"gr2"` and `"cmf"` hydrate
  caller-supplied compatibility classes for runtime-style consumers; their
  `classes` maps must contain the constructors required by that output shape.
  `"raw"` returns the reflected `granny_file_info` graph from the low-level
  reader.
- `decompressCurves`: default `false`. When `true`, every animation transform
  curve gains decoded `knots`, `controls`, and `dimension` fields while
  keeping the raw compressed fields.
- `unpackTangents`: default `false`. `true` decodes packed CCP tangent frames
  into separate `normal`, `tangent`, and `binormal` vertex channels. A
  function rule receives `{ reader, options, raw, json, mesh, meshIndex }`
  and must return `true` or `false` for that mesh.
- `rebuildMissingNormals`: default `false`. `true` generates missing `normal`
  channels from `vertex.position` and triangle indices. Missing required data
  throws.
- `rebuildMissingTangents`: default `false`. `true` generates missing
  `tangent` channels from `vertex.position`, `vertex.normal`,
  `vertex.texcoord0`, and triangle indices. Missing required data throws.
- `rebuildMissingBiNormals`: default `false`. `true` generates missing
  binormals into the current `binormal` channel from `vertex.normal` and
  `vertex.tangent`. Missing required data throws.
- Missing-channel rebuild options also accept rule functions. They receive
  `{ reader, options, raw, json, mesh, meshIndex, feature, channel }` and
  must return `true` or `false`.
- `classes`: optional for `new CjsFormatGr2(options)`, `Read`, and static
  `read`. Maps node keys to constructors that follow the
  [class hydration contract](json-graph.md#class-hydration-contract); omitted
  keys remain plain objects. Accepted keys are exposed as
  `CjsFormatGr2.CLASS_KEYS`. With the default `emit: "json"`, classes
  describe the GR2 JSON graph.

## Helper namespaces

Helper namespaces are static properties on `CjsFormatGr2`:

```js
const decoded = CjsFormatGr2.curves.decode(curveJson, 4);
const unpacked = CjsFormatGr2.tangents.unpack(mesh);
```

## CLI

```sh
format-gr2 model.gr2            # writes model.json next to the input
gr2reader model.gr2             # legacy alias
```

## Related documentation

- [GR2 JSON graph and hydration](json-graph.md)
- [Architecture and boundaries](../architecture.md)
