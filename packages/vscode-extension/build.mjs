import * as esbuild from "esbuild";

const REQUIRE_SHIM_BANNER = `import { createRequire } from "module";
globalThis.require = createRequire(import.meta.url);
`;

await esbuild.build({
  entryPoints: ["out/extension.js"],
  bundle: true,
  outfile: "out/extension.bundle.js",
  platform: "node",
  format: "esm",
  external: ["vscode"],
  banner: { js: REQUIRE_SHIM_BANNER },
});
