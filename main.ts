import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// "An Invitation" — a letter asking the AI judge to visit my house.
// The program copies the pre-drawn invitation (entry.png, 1024x1024)
// to the grader's output path. No network, no randomness: two runs
// write byte-identical output.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "entry.png");

// Validate the source before copying, so a missing or corrupt image
// fails loudly here instead of silently producing a bad entry.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const size = statSync(src, { throwIfNoEntry: false });
if (size === undefined) {
  throw new Error(`entry.png not found at ${src}`);
}
if (size.size === 0 || size.size > 1048576) {
  throw new Error(`entry.png has unexpected size ${size.size} bytes (must be 1..1048576)`);
}
const header = readFileSync(src);
if (!header.subarray(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error("entry.png is not a valid PNG (bad 8-byte signature)");
}
// Gate also caps dimensions at 1024x1024: check the IHDR width/height.
const width = header.readUInt32BE(16);
const height = header.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height} (must be at most 1024x1024)`);
}

copyFileSync(src, join(outDir, "entry.png"));
