const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, "..");
const pkg = require("../package.json");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The example app consumes the parent library via a `file:..` symlink. Metro
 * needs help to:
 *   1. Follow that symlink (`unstable_enableSymlinks`).
 *   2. Watch the parent package's `src/` for live reload (`watchFolders`).
 *   3. Avoid loading a *second* copy of React/React Native from the parent
 *      package's nested `node_modules` (`blockList`), and prefer the
 *      example's own copies (`nodeModulesPaths`).
 *   4. Resolve the library from its TypeScript `src/` instead of the compiled
 *      `lib/` output (the package `exports` map points at `lib/`), so changes
 *      under `src/` are picked up without re-running `yarn build`
 *      (`resolveRequest`).
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [packageRoot],
  resolver: {
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [path.join(projectRoot, "node_modules")],
    blockList: [
      // Anything resolved from the parent's nested node_modules would be a
      // duplicate of what the example already has — exclude it entirely.
      new RegExp(
        `^${path
          .join(packageRoot, "node_modules")
          .replace(/[/\\]/g, String.raw`[/\\]`)}/.*$`,
      ),
    ],
    resolveRequest: (context, moduleName, platform) => {
      // Map `@scope/pkg` and `@scope/pkg/sub` to the library's `src/`, so the
      // example runs the source directly (no `lib/` rebuild needed).
      if (moduleName === pkg.name || moduleName.startsWith(`${pkg.name}/`)) {
        const subpath = moduleName.slice(pkg.name.length);
        const target = path.join(packageRoot, "src", subpath || "index");
        return context.resolveRequest(context, target, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
