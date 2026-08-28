/** Per PRD §30: cheaper/faster models for simple classification and chat, a stronger model for the more synthesis-heavy weekly report narrative. */
export const AI_MODELS = {
  CHAT: 'claude-haiku-4-5-20251001',
  CHECK_IN_ANALYSIS: 'claude-haiku-4-5-20251001',
  WEEKLY_REPORT: 'claude-sonnet-5',
} as const;

// Rough, non-billing-accurate per-million-token pricing (USD) — good enough
// for PRD §30's "track estimated cost" ask; not a substitute for the
// provider's actual invoice.
export const PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'claude-sonnet-5': { input: 3, output: 15 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING_PER_MILLION_TOKENS[model] ?? DEFAULT_PRICING;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}
