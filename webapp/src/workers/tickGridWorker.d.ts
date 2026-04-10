// TypeScript declaration for the tickGridWorker
export interface TickGridWorkerRequest {
  id: number;
  trackEvents: any;
}

export interface TickGridWorkerResponse {
  id: number;
  result?: any;
  error?: string;
}
