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
  // `extra` is what the JavaScript reads through expo-constants: server
  // addresses, public keys, and the release notes the update dialog shows.
  // None of it is compiled in, and an update brings its own copy, so it has no
  // say in which builds an update may reach. Left in, every new set of notes
  // would be a new runtime version. The second entry is the library's own
  // default, which naming any skip here would otherwise drop.
  sourceSkips: [
    "ExpoConfigExtraSection",
    "PackageJsonAndroidAndIosScriptsIfNotContainRun",
  ],
  extraSources: NATIVE_CONFIG_KEYS.map((key) => ({
    type: "contents",
    id: `packageJson:${key}`,
    contents: JSON.stringify(pkg[key] ?? null),
    reasons: ["nativeLibraryConfig"],
  })),
};
