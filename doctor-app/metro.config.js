// Learn more https://docs.expo.io/guides/customizing-metro
/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix: Firebase JS SDK is incompatible with Metro's package.json `exports`
// field resolution introduced in React Native 0.79 (Expo SDK 53).
// Without this, Firebase Auth throws "Component auth has not been registered yet".
// See: https://github.com/expo/expo/issues/36496
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config;
