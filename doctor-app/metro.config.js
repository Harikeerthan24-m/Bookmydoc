// Learn more https://docs.expo.io/guides/customizing-metro
/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix: Firebase JS SDK is incompatible with Metro's package.json `exports`
// field resolution introduced in React Native 0.79 (Expo SDK 53).
// Without this, Firebase Auth throws "Component auth has not been registered yet".
// See: https://github.com/expo/expo/issues/36496
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

// Fix: Inject DOMException polyfill at the Metro serializer level.
//
// WHY THIS IS NEEDED:
// livekit-client's UMD bundle references `DOMException` (via `new DOMException()`
// or `globalThis.DOMException`) inside module factories. In Hermes, accessing an
// undefined global as an identifier in a module's scope throws:
//   "ReferenceError: Property 'DOMException' doesn't exist, js engine: hermes"
//
// JavaScript shims in index.js run TOO LATE — Metro evaluates module factories
// in the order they are required, and livekit-client can be required before
// our index.js shim code executes.
//
// `serializer.getPolyfills` runs BEFORE the entire module graph, so this
// is the only approach that is guaranteed to work.
const domExceptionPolyfill = path.join(__dirname, 'polyfills', 'dom-exception.js');

const originalGetPolyfills = config.serializer?.getPolyfills;
config.serializer = config.serializer || {};
config.serializer.getPolyfills = function (ctx) {
  const existingPolyfills = originalGetPolyfills ? originalGetPolyfills(ctx) : [];
  return [domExceptionPolyfill, ...existingPolyfills];
};

module.exports = config;
