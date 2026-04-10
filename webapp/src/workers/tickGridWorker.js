// Web Worker for buildTickGrid
importScripts('../components/SchematicPanel/schematicData.js');

// Minimal dependency extraction: only expose buildTickGrid

self.onmessage = function (e) {
  const { trackEvents, id } = e.data;
  try {
    // buildTickGrid is expected to be available in global scope
    const result = self.buildTickGrid(trackEvents);
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err.message || String(err) });
  }
};
