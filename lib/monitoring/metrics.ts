// lib/monitoring/metrics.ts

export function recordMetric(metricName: string, value: number, tags?: Record<string, string>) {
  if (process.env.NODE_ENV === 'production') {
    // In a real application, you would send this to a dedicated metrics service
    // like Prometheus, Datadog, or a structured logger that forwards to such services.
    // For now, we'll log it to the console.
    console.log(`METRIC: ${metricName}, Value: ${value}, Tags: ${JSON.stringify(tags)}`);
  } else {
    console.log(`METRIC (DEV): ${metricName}, Value: ${value}, Tags: ${JSON.stringify(tags)}`);
  }
}

// You could also add functions for specific metric types, e.g.:
// export function incrementCounter(counterName: string, tags?: Record<string, string>) {
//   recordMetric(counterName, 1, tags);
// }

// export function measureDuration(eventName: string, durationMs: number, tags?: Record<string, string>) {
//   recordMetric(`${eventName}_duration_ms`, durationMs, tags);
// }
