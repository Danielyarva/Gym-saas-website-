import { z } from 'zod';
import type { AiInsight } from '@prisma/client';
import { aiInsightRepository } from '../repositories/ai-insight.repository';
import { buildClientContext } from '../ai/context.service';
import { aiService } from '../ai';
import { AI_MODELS } from '../ai/models';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import { logger } from '../config/logger';

const MAX_OUTPUT_TOKENS = 1024;

// PRD §17/§18 merged: risk detection is the `riskLevel` classification
// inside one progress-analysis output, not a separate AI pipeline.
const insightOutputSchema = z.object({
  riskLevel: z.enum(['GREEN', 'YELLOW', 'RED']),
  confidence: z.number().min(0).max(1),
  insights: z.array(z.string().min(1).max(300)).min(1).max(5),
  recommendedActions: z.array(z.string().min(1).max(300)).min(1).max(5),
  reasoning: z.string().min(1).max(1000),
});

const SYSTEM_PROMPT = `You are analyzing a fitness coaching client's recent check-in history for their human coach, not for the client directly.

Classify the client's risk level:
- GREEN: on track, adhering well, no concerns.
- YELLOW: some slipping (missed workouts, inconsistent check-ins, stalled progress) worth a coach's attention.
- RED: signs the client may be disengaging, struggling, or at risk of dropping off — needs prompt coach outreach.

Base your analysis only on the client context provided. Do not invent data. This analysis informs the coach's next conversation with the client — it is never shown to the client directly and never changes their plan on its own.`;

function toPublicInsight(insight: AiInsight) {
  return {
    id: insight.id,
    checkInId: insight.checkInId,
    riskLevel: insight.riskLevel,
    confidence: Number(insight.confidence),
    insights: insight.insights,
    recommendedActions: insight.recommendedActions,
    reasoning: insight.reasoning,
    createdAt: insight.createdAt,
  };
}

/**
 * Called from ai-analysis.processor.ts (queued from checkin.service.ts#submit
 * via aiAnalysisQueue, Phase 7) rather than fire-and-forget directly — a slow
 * or failing AI call must never block or fail the check-in response. Catches
 * its own errors rather than throwing: a persistent AI failure (bad config,
 * a malformed response) wouldn't be fixed by BullMQ's retry, so this stays a
 * clean no-op on error/not-configured instead of consuming retry attempts.
 */
async function analyzeCheckIn(clientId: string, checkInId: string): Promise<void> {
  if (!aiService.isConfigured()) return;

  try {
    const context = await buildClientContext(clientId);
    const output = await aiService.generateStructuredOutput({
      clientId,
      feature: 'analyze_checkin',
      system: SYSTEM_PROMPT,
      prompt: context,
      model: AI_MODELS.CHECK_IN_ANALYSIS,
      maxTokens: MAX_OUTPUT_TOKENS,
      schema: insightOutputSchema,
      toolName: 'submit_analysis',
      toolDescription: 'Submit the structured risk analysis for this check-in',
    });

    await aiInsightRepository.create({ clientId, checkInId, ...output });
    await auditService.log({ action: 'AI_INSIGHT_GENERATED', entityType: 'CLIENT', entityId: clientId, metadata: { checkInId, riskLevel: output.riskLevel } });

    if (output.riskLevel === 'RED') {
      await notificationService.notifyAtRisk(clientId);
    }
  } catch (err) {
    logger.error({ err, clientId, checkInId }, 'AI check-in analysis failed');
  }
}

async function list(clientId: string, page: number, pageSize: number) {
  const [insights, total] = await aiInsightRepository.listForClient(clientId, page, pageSize);
  return { insights: insights.map(toPublicInsight), total, page, pageSize };
}

export const aiInsightService = {
  analyzeCheckIn,
  list,
};
