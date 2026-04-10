// ES module worker for buildTickGrid
import { buildTickGrid } from '../components/SchematicPanel/schematicData';

self.onmessage = (e) => {
  const { trackEvents, id } = e.data;
  try {
    const result = buildTickGrid(trackEvents);
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err.message || String(err) });
  }
};
