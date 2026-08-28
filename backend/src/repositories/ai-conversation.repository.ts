import type { AiMessageRole } from '@prisma/client';
import { prisma } from '../config/prisma';

export const aiConversationRepository = {
  /** Read-only lookup — a coach previewing an empty Chat tab must not create a row. */
  findForClient(clientId: string) {
    return prisma.aiConversation.findUnique({ where: { clientId } });
  },

  async findOrCreateForClient(clientId: string) {
    const existing = await prisma.aiConversation.findUnique({ where: { clientId } });
    if (existing) return existing;
    return prisma.aiConversation.create({ data: { clientId } });
  },

  appendMessage(conversationId: string, role: AiMessageRole, content: string) {
    return prisma.aiMessage.create({ data: { conversationId, role, content } });
  },

  listMessages(conversationId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.aiMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiMessage.count({ where: { conversationId } }),
    ]);
  },

  /** Newest-first, for building the model's chat history window — callers reverse for chronological order. */
  recentMessages(conversationId: string, take: number) {
    return prisma.aiMessage.findMany({ where: { conversationId }, orderBy: { createdAt: 'desc' }, take });
  },
};
