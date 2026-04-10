// Client wrapper for tickGridWorker
let worker: Worker | null = null;
let msgId = 0;
const pending = new Map<number, (res: any) => void>();

export function buildTickGridAsync(trackEvents: any): Promise<any> {
  if (!worker) {
    worker = new Worker(new URL('./tickGridWorkerModule.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const { id, result, error } = e.data;
      const cb = pending.get(id);
      if (cb) {
        pending.delete(id);
        if (error) cb(Promise.reject(new Error(error)));
        else cb(result);
      }
    };
  }
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    worker!.postMessage({ id, trackEvents });
    // Timeout fallback
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('buildTickGrid worker timeout'));
      }
    }, 10000);
  });
}
