# Workers

This folder contains Web Workers for offloading heavy computations from the UI thread.

- `tickGridWorker.js`: Runs buildTickGrid in a worker context.
- `tickGridWorkerClient.ts`: Async wrapper for calling buildTickGrid from the UI.

To use:

```ts
import { buildTickGridAsync } from '../workers/tickGridWorkerClient';

const grid = await buildTickGridAsync(trackEvents);
```
