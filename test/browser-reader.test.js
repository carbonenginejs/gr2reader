import assert from "node:assert/strict";
import test from "node:test";
import { CjsFormatGr2 } from "../src/index.js";


const MAGIC_32 = "29de6cc0baa4532b25f5b7a5f666e2ee";

function createMinimalGr2()
{
    const
        sectionDirectoryOffset = 68,
        sectionDataOffset = 112,
        sectionSize = 48,
        pointerFixupOffset = sectionDataOffset + sectionSize,
        bytes = new Uint8Array(pointerFixupOffset + 12),
        view = new DataView(bytes.buffer);

    for (let i = 0; i < 16; i++) bytes[i] = Number.parseInt(MAGIC_32.slice(i * 2, i * 2 + 2), 16);

    view.setUint32(32, 7, true);
    view.setUint32(44, sectionDirectoryOffset - 32, true);
    view.setUint32(48, 1, true);
    view.setUint32(52, 0, true);
    view.setUint32(56, 0, true);
    view.setUint32(60, 0, true);
    view.setUint32(64, 36, true);

    view.setUint32(sectionDirectoryOffset, 0, true);
    view.setUint32(sectionDirectoryOffset + 4, sectionDataOffset, true);
    view.setUint32(sectionDirectoryOffset + 8, sectionSize, true);
    view.setUint32(sectionDirectoryOffset + 12, sectionSize, true);
    view.setUint32(sectionDirectoryOffset + 28, pointerFixupOffset, true);
    view.setUint32(sectionDirectoryOffset + 32, 1, true);

    view.setUint32(sectionDataOffset, 20, true);
    view.setInt32(sectionDataOffset + 12, 1, true);
    view.setUint32(sectionDataOffset + 36, 42, true);
    bytes.set([ 0x63, 0x61, 0x66, 0xc3, 0xa9, 0 ], sectionDataOffset + 40);

    view.setUint32(pointerFixupOffset, 4, true);
    view.setUint32(pointerFixupOffset + 4, 0, true);
    view.setUint32(pointerFixupOffset + 8, 40, true);
    return bytes;
}

test("reads browser byte inputs without a Buffer global", () => {
    const
        bytes = createMinimalGr2(),
        padded = new Uint8Array(bytes.length + 11),
        previousBuffer = globalThis.Buffer;
    padded.set(bytes, 7);

    const inputs = [
        bytes,
        padded.subarray(7, 7 + bytes.length),
        bytes.buffer.slice(0),
        new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    ];

    try
    {
        globalThis.Buffer = undefined;
        for (const input of inputs)
        {
            const result = CjsFormatGr2.readRaw(input);
            assert.equal(result.fileInfo["caf\u00e9"], 42);
        }
    }
    finally
    {
        globalThis.Buffer = previousBuffer;
    }
});
