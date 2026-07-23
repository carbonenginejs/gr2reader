# Package documentation

Status: Evolving  
Scope: `@carbonenginejs/format-gr2`  
Audience: Users and integrators  
Summary: Documentation home for the pure-JavaScript Granny GR2/GSF reader.

## Purpose

`@carbonenginejs/format-gr2` reads RAD Granny 3D `.gr2` and Granny State
`.gsf` files in Node and the browser with no `granny2.dll`, native addons, or
build step. It decodes every section-compression codec used by current EVE
Online assets (None, Oodle1, BitKnit2), reconstructs the Granny object graph
from the file's embedded type tree, and emits GR2 JSON or caller-supplied
classes.

## Use this package when

- you need GR2 geometry, skeletons, animations, or morph targets as plain
  JSON or hydrated classes without native tooling;
- you need GState (`.gsf`) state-machine data, animation slots and sets, and
  relative `.gr2` references;
- you are building a conversion pipeline (for example GR2 → CMF via
  `@carbonenginejs/runtime-resource/formats/cmf`).

## Where it fits

- Consumers are tools, pipelines, and runtime adapters that want decoded
  Granny data; the package emits data and hydrates caller classes, it does
  not own resource lifecycle or GPU work.
- `@carbonenginejs/runtime-resource` is the intended future owner; the
  historical EUPL licensing gate was resolved on 2026-07-24 and the
  migration is now an open organizational decision; see
  [architecture.md](architecture.md).
- Tangent helpers were extracted to `@carbonenginejs/core-math`; this package
  keeps compatibility glue that delegates to it.

## Start here

- [README](../README.md): install, quick start, and licensing.
- [Architecture and boundaries](architecture.md)
- [Reader API](reference/api.md)

## Documentation map

- [architecture.md](architecture.md): package boundary, codec ownership, and
  the licensing-gated migration.
- [reference/api.md](reference/api.md): public class, reader rules, options,
  helper namespaces, and the CLI.
- [reference/json-graph.md](reference/json-graph.md): the GR2 JSON graph,
  curve records, vertex layouts, and the class-hydration contract.
- [formats/bitknit2.md](formats/bitknit2.md): the normative BitKnit2
  (section format 4) decoding specification.
