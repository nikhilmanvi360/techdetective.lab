import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

if (typeof window !== 'undefined') {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn();
  }
  // @ts-ignore
  global.IntersectionObserver = MockIntersectionObserver;
  // @ts-ignore
  window.IntersectionObserver = MockIntersectionObserver;

  // Mock ResizeObserver
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  // @ts-ignore
  global.ResizeObserver = MockResizeObserver;
  // @ts-ignore
  window.ResizeObserver = MockResizeObserver;

  // Mock window.scrollTo
  window.scrollTo = vi.fn();
}

// Cleanup after each React test
afterEach(() => {
  cleanup();
});
