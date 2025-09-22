// lib/optimization/batchProcessor.ts
type BatchTask = () => Promise<any>;

class BatchProcessor {
  private queue: BatchTask[] = [];
  private isProcessing: boolean = false;
  private readonly batchSize: number;
  private readonly batchInterval: number; // in milliseconds

  constructor(batchSize: number = 5, batchInterval: number = 1000) {
    this.batchSize = batchSize;
    this.batchInterval = batchInterval;
  }

  addTask(task: BatchTask): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map(task => task()));
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchInterval));
      }
    }
    this.isProcessing = false;
  }
}

export const aiBatchProcessor = new BatchProcessor();
