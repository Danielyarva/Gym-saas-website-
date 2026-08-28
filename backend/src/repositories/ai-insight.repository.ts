import type { AiRiskLevel } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateAiInsightInput {
  clientId: string;
  checkInId?: string;
  riskLevel: AiRiskLevel;
  confidence: number;
  insights: string[];
  recommendedActions: string[];
  reasoning: string;
}

export const aiInsightRepository = {
  create(input: CreateAiInsightInput) {
    return prisma.aiInsight.create({ data: input });
  },

  listForClient(clientId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.aiInsight.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiInsight.count({ where: { clientId } }),
    ]);
  },

  findLatestForClient(clientId: string) {
    return prisma.aiInsight.findFirst({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  },
};
