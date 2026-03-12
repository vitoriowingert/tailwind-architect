/**
 * Keeps only the .vsix for the current package version; removes any other .vsix in the extension directory.
 * Run after `vsce package` so only the latest build remains.
 */
import { readFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const pkgPath = join(pkgRoot, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const keepName = `${pkg.name}-${pkg.version}.vsix`;

const files = readdirSync(pkgRoot);
for (const f of files) {
  if (f.endsWith(".vsix") && f !== keepName) {
    unlinkSync(join(pkgRoot, f));
  }
}
