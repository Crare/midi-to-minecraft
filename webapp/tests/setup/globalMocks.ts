// Mock for Web Worker in Vitest (jsdom)
class MockWorker {
  constructor() {}
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  onmessage = null;
}
// @ts-ignore
if (typeof global !== 'undefined' && !global.Worker) {
  // @ts-ignore
  global.Worker = MockWorker;
}
// @ts-ignore
if (typeof window !== 'undefined' && !window.Worker) {
  // @ts-ignore
  window.Worker = MockWorker;
}
