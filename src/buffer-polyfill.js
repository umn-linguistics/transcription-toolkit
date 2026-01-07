/**
 * Minimal Buffer polyfill for Google Apps Script
 * Only implements the methods actually used by bundled dependencies
 */

class BufferPolyfill {
  constructor(data) {
    if (Array.isArray(data)) {
      // Convert byte array to string
      this.data = String.fromCharCode(...data);
    } else if (typeof data === 'string') {
      this.data = data;
    } else {
      this.data = '';
    }
  }

  static from(data, encoding) {
    if (Array.isArray(data)) {
      return new BufferPolyfill(data);
    } else if (typeof data === 'string') {
      return new BufferPolyfill(data);
    }
    return new BufferPolyfill('');
  }

  static isBuffer(obj) {
    return obj instanceof BufferPolyfill;
  }

  toString(encoding) {
    return this.data;
  }
}

// Export for rollup to inject
export const Buffer = BufferPolyfill;
