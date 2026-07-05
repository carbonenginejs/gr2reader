#!/usr/bin/env node
/**
 * Command-line converter for .gr2 files.
 *
 * Usage: format-gr2 <input.gr2> [-o out.json] [--unpack-tangents] [--raw] [--stdout].
 * The default output path strips the input's final extension and appends .json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import CjsFormatGr2 from "../src/index.js";

const
    argv = process.argv.slice(2),
    opts = { unpackTangents: false, emit: CjsFormatGr2.OUTPUT_JSON };

let input = null, out = null, toStdout = false;

for (let i = 0; i < argv.length; i++)
{
    const a = argv[i];
    if (a === "--unpack-tangents") opts.unpackTangents = true;
    else if (a === "--raw") opts.emit = CjsFormatGr2.OUTPUT_RAW;
    else if (a === "--stdout") toStdout = true;
    else if (a === "-o" || a === "--out") out = argv[++i];
    else if (a === "-h" || a === "--help") { usage(); process.exit(0); }
    else if (!input) input = a;
    else { console.error(`format-gr2: unexpected argument "${a}"`); process.exit(2); }
}

if (!input) { usage(); process.exit(2); }

/**
 * Print CLI usage text to stderr.
 *
 * @returns {void}
 */
function usage()
{
    console.error("usage: format-gr2 <input.gr2> [-o out.json] [--unpack-tangents] [--raw] [--stdout]");
    console.error("       alias: gr2reader");
}

/**
 * Build the default .json output path for an input filename.
 *
 * @param {string} p Input path.
 * @returns {string} Output path beside the input.
 */
function defaultOut(p)
{
    const dot = p.lastIndexOf(".");
    return (dot > p.lastIndexOf("/") && dot > p.lastIndexOf("\\") ? p.slice(0, dot) : p) + ".json";
}

try
{
    const
        buf = readFileSync(input),
        result = CjsFormatGr2.read(buf, opts),
        text = JSON.stringify(CjsFormatGr2.toJSON(result), null, opts.emit === CjsFormatGr2.OUTPUT_RAW ? 2 : 0);

    if (toStdout) { process.stdout.write(text); }
    else
    {
        const dest = out || defaultOut(input);
        writeFileSync(dest, text);
        console.error(`format-gr2: wrote ${dest} (${text.length} bytes)`);
    }
}
catch (e)
{
    console.error(`format-gr2: ${e.message}`);
    process.exit(1);
}
