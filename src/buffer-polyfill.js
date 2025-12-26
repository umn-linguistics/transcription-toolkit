// Minimal Buffer polyfill for Google Apps Script
// Only implements the methods used by csv-stringify

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

  static isBuffer(obj) {
    return obj instanceof BufferPolyfill;
  }

  static from(data, encoding) {
    return new BufferPolyfill(data);
  }

  toString(encoding) {
    return this.data;
  }
}

export const Buffer = BufferPolyfill;
