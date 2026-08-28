import type { Queue } from 'bullmq';

/**
 * Polls until the given queue has no waiting/active/delayed jobs left —
 * a deterministic replacement for the `wait(200)`-style arbitrary sleeps
 * used before Phase 7's job queues existed, for tests that need to know a
 * job has actually finished before asserting its side effect.
 */
export async function waitForQueueIdle(queue: Queue, timeoutMs = 5000): Promise<void> {
  const startedAt = Date.now();
  for (;;) {
    const counts = await queue.getJobCounts('waiting', 'active', 'delayed');
    if (counts.waiting === 0 && counts.active === 0 && counts.delayed === 0) return;
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for queue "${queue.name}" to idle`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
