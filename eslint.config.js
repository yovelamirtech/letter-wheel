const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["scripts/**/*.js", "jest.setup.js", "jest.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    rules: {
      // These React Compiler rules flag idiomatic React Native patterns
      // already used throughout this codebase (Animated.Value refs,
      // Math.random for shuffling, ref-based memoization for
      // PanResponder closures) that aren't actual bugs.
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];
