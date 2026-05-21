import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));

// Bundle everything except things that must remain external (native deps).
const external = ["pg-native"];

await build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  outfile: resolve(__dirname, "dist/index.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  sourcemap: true,
  minify: false,
  external,
  banner: {
    js: "/* @devlearn/api v" + pkg.version + " */",
  },
  conditions: ["workspace", "node"],
  logLevel: "info",
});
