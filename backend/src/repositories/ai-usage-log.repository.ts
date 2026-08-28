import { prisma } from '../config/prisma';

export interface CreateAiUsageLogInput {
  clientId?: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}

export const aiUsageLogRepository = {
  create(input: CreateAiUsageLogInput) {
    return prisma.aiUsageLog.create({ data: input });
  },
};
