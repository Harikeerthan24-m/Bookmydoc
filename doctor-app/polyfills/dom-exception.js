/**
 * Hermes-compatible DOMException polyfill.
 *
 * This file is injected by metro.config.js as a serializer polyfill,
 * meaning it runs BEFORE any module in the bundle — before require(),
 * before livekit-client, before everything.
 *
 * Hermes throws "Property 'DOMException' doesn't exist" when code does
 * `new DOMException()` or accesses `globalThis.DOMException` if it's
 * not defined. We must set it on BOTH `global` and `globalThis`.
 *
 * We use the old-fashioned prototype chain because Hermes cannot handle
 * `class X extends Error {}` for built-in types.
 */
(function () {
  if (typeof global.DOMException === 'undefined') {
    function DOMException(message, name) {
      this.message = message || '';
      this.name = name || 'Error';
      var e = new Error(this.message);
      this.stack = e.stack || '';
    }
    DOMException.prototype = Object.create(Error.prototype);
    DOMException.prototype.constructor = DOMException;
    global.DOMException = DOMException;
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.DOMException === 'undefined') {
    globalThis.DOMException = global.DOMException;
  }
})();
