import type { MessageSenderRole } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateMessageInput {
  clientId: string;
  senderRole: MessageSenderRole;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}

export const messageRepository = {
  create(input: CreateMessageInput) {
    return prisma.message.create({ data: input });
  },

  listForClient(clientId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.message.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.message.count({ where: { clientId } }),
    ]);
  },

  /** Called as a side effect of GET — viewing the thread reads whatever the *other* role sent. */
  markReadForRecipient(clientId: string, recipientRole: MessageSenderRole) {
    return prisma.message.updateMany({
      where: { clientId, senderRole: { not: recipientRole }, readAt: null },
      data: { readAt: new Date() },
    });
  },

  /** One row per client: their most recent message + unread count, for the coach's cross-client inbox. */
  async listConversationsForCoach(coachId: string) {
    const coachClients = await prisma.coachClient.findMany({
      where: { coachId, archivedAt: null },
      select: { client: { select: { id: true, fullName: true } } },
    });

    return Promise.all(
      coachClients.map(async ({ client }) => {
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({ where: { clientId: client.id }, orderBy: { createdAt: 'desc' } }),
          prisma.message.count({ where: { clientId: client.id, senderRole: 'CLIENT', readAt: null } }),
        ]);
        return { client, lastMessage, unreadCount };
      }),
    );
  },
};
