/**
 * Post-build step: remove the per-op `<id>Doc` documentation constants from the
 * published output so the docs metadata (only used by the build-time docs
 * generator) is not shipped to consumers. Runs over lib/ after `bob build`.
 *
 *   - lib/module/**\/ops/*.js   -> drop `export const <id>Doc = {...}` via Babel
 *   - lib/typescript/**\/ops/*.d.ts -> drop `export declare const <id>Doc: ...`
 */
import babel from "@babel/core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const libDir = path.join(root, "lib");

/** Babel plugin: remove top-level `export const <name>Doc = ...` declarations. */
function stripDocPlugin() {
  return {
    visitor: {
      ExportNamedDeclaration(p) {
        const decl = p.node.declaration;
        if (!decl || decl.type !== "VariableDeclaration") return;
        const isDoc =
          decl.declarations.length > 0 &&
          decl.declarations.every(
            (d) => d.id.type === "Identifier" && /Doc$/.test(d.id.name),
          );
        if (isDoc) p.remove();
      },
    },
  };
}

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

let jsStripped = 0;
const jsFiles = walk(
  path.join(libDir, "module"),
  (f) => f.endsWith(".js") && f.includes(`${path.sep}ops${path.sep}`),
);
for (const file of jsFiles) {
  const code = fs.readFileSync(file, "utf8");
  if (!/Doc\b/.test(code)) continue;

  const mapFile = `${file}.map`;
  const inputSourceMap = fs.existsSync(mapFile)
    ? JSON.parse(fs.readFileSync(mapFile, "utf8"))
    : undefined;

  const result = babel.transformSync(code, {
    filename: file,
    babelrc: false,
    configFile: false,
    plugins: [stripDocPlugin],
    sourceMaps: Boolean(inputSourceMap),
    inputSourceMap,
  });

  if (result?.code != null) {
    // Drop any sourceMappingURL comment Babel preserved/added, then re-add
    // exactly one pointing at the regenerated map.
    const bare = result.code
      .replace(/\n*\/\/# sourceMappingURL=.*$/gm, "")
      .replace(/\s*$/, "");
    const tail = inputSourceMap
      ? `\n//# sourceMappingURL=${path.basename(mapFile)}\n`
      : "\n";
    fs.writeFileSync(file, bare + tail);
    if (result.map) fs.writeFileSync(mapFile, JSON.stringify(result.map));
    jsStripped++;
  }
}

let dtsStripped = 0;
const dtsFiles = walk(
  path.join(libDir, "typescript"),
  (f) => f.endsWith(".d.ts") && f.includes(`${path.sep}ops${path.sep}`),
);
for (const file of dtsFiles) {
  const src = fs.readFileSync(file, "utf8");
  const next = src
    .replace(/^export declare const \w+Doc:[^;]*;\s*?$/gm, "")
    .replace(/^import type \{ OpDoc \}.*$/gm, "");
  if (next !== src) {
    fs.writeFileSync(file, next);
    dtsStripped++;
  }
}

console.log(`stripped doc exports: ${jsStripped} js, ${dtsStripped} d.ts`);
