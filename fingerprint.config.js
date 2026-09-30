/** @type {import('@expo/fingerprint').Config} */
const pkg = require("./package.json");

// Blocks in package.json that native libraries read at install or build time to
// decide what gets compiled in. package.json itself is not a fingerprint input,
// so without these, adding "phonemis" to the ExecuTorch libs would leave the
// runtime version unchanged and an update needing it could reach a build that
// has none. .fingerprintignore drops the files these blocks produce inside
// node_modules, because a checkout's copies drift from a fresh install.
const NATIVE_CONFIG_KEYS = ["react-native-executorch", "enriched-markdown"];

module.exports = {
  extraSources: NATIVE_CONFIG_KEYS.map((key) => ({
    type: "contents",
    id: `packageJson:${key}`,
    contents: JSON.stringify(pkg[key] ?? null),
    reasons: ["nativeLibraryConfig"],
  })),
};
