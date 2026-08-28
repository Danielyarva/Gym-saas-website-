import type { Request } from 'express';
import type { Message, MessageSenderRole } from '@prisma/client';
import { messageRepository } from '../repositories/message.repository';
import { coachClientRepository } from '../repositories/client.repository';
import { storageService } from './storage.service';
import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';

const TYPING_TTL_MS = 6000;

function toPublicMessage(message: Message) {
  return {
    id: message.id,
    senderRole: message.senderRole,
    content: message.content,
    attachmentUrl: message.attachmentUrl,
    attachmentType: message.attachmentType,
    attachmentName: message.attachmentName,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

async function send(clientId: string, senderRole: MessageSenderRole, content: string | undefined, file: Express.Multer.File | undefined, req: Request) {
  const trimmedContent = content?.trim() || undefined;
  if (!trimmedContent && !file) {
    throw new AppError('VALIDATION_ERROR', 'Message must include text or an attachment');
  }

  const attachment = file
    ? await storageService
        .uploadImage({ buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype }, `messages/${clientId}`)
        .then(({ url }) => ({ attachmentUrl: url, attachmentType: file.mimetype, attachmentName: file.originalname }))
    : {};

  const message = await messageRepository.create({ clientId, senderRole, content: trimmedContent, ...attachment });

  await auditService.log({ req, actorUserId: req.user?.id, action: 'MESSAGE_SENT', entityType: 'CLIENT', entityId: clientId });
  await notificationService.notifyNewMessage(clientId, senderRole);

  return toPublicMessage(message);
}

/** Marks the other role's unread messages read as a side effect of viewing the thread, and reports whether the other party is currently typing. */
async function list(clientId: string, viewerRole: MessageSenderRole, page: number, pageSize: number) {
  await messageRepository.markReadForRecipient(clientId, viewerRole);

  const [[messages, total], coachClient] = await Promise.all([
    messageRepository.listForClient(clientId, page, pageSize),
    coachClientRepository.findByClientId(clientId),
  ]);

  const now = Date.now();
  const otherPartyTypingUntil = viewerRole === 'COACH' ? coachClient?.clientTypingUntil : coachClient?.coachTypingUntil;
  const otherPartyTyping = Boolean(otherPartyTypingUntil && otherPartyTypingUntil.getTime() > now);

  return { messages: messages.map(toPublicMessage), total, page, pageSize, otherPartyTyping };
}

async function setTyping(clientId: string, senderRole: MessageSenderRole): Promise<void> {
  await coachClientRepository.setTyping(clientId, senderRole, new Date(Date.now() + TYPING_TTL_MS));
}

/** The coach's cross-client inbox (PRD §20) — mirrors Phase 4's /api/reports pattern: one row per client on the roster. */
async function listConversationsForCoach(coachId: string) {
  const conversations = await messageRepository.listConversationsForCoach(coachId);
  return {
    conversations: conversations.map(({ client, lastMessage, unreadCount }) => ({
      client,
      lastMessage: lastMessage ? toPublicMessage(lastMessage) : null,
      unreadCount,
    })),
  };
}

export const messageService = {
  send,
  list,
  setTyping,
  listConversationsForCoach,
};
