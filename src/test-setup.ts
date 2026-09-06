import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom polyfills
if (!('randomUUID' in crypto)) {
  // @ts-expect-error polyfill for test env
  crypto.randomUUID = () =>
    '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padStart(12, '0');
}

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }) as MediaQueryList;
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error polyfill for test env
  globalThis.IntersectionObserver = IntersectionObserverStub;
}
