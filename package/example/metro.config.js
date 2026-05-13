const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, '..');

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
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [packageRoot],
  resolver: {
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [path.join(projectRoot, 'node_modules')],
    blockList: [
      // Anything resolved from the parent's nested node_modules would be a
      // duplicate of what the example already has — exclude it entirely.
      new RegExp(
        `^${path.join(packageRoot, 'node_modules').replace(/[/\\]/g, '[/\\\\]')}/.*$`
      ),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
