import type { Request } from 'express';
import type { AiMessage } from '@prisma/client';
import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { buildClientContext } from '../ai/context.service';
import { aiService } from '../ai';
import { AI_MODELS } from '../ai/models';
import { auditService } from './audit.service';

const MAX_HISTORY_MESSAGES = 20;
const MAX_OUTPUT_TOKENS = 1024;

function toPublicMessage(message: AiMessage) {
  return { id: message.id, role: message.role, content: message.content, createdAt: message.createdAt };
}

// PRD §37: the coach stays in control — this assistant never suggests,
// implies, or agrees to a plan/goal change, and never gives medical advice.
function systemPrompt(context: string): string {
  return `You are an AI assistant helping a fitness coaching client between check-ins with their human coach.

Rules you must always follow:
- You are not a substitute for the coach. Never suggest, imply, or agree to any change to the client's workout plan, nutrition plan, or goals — those decisions belong to the coach alone. If the client asks for a plan change, tell them to bring it up with their coach.
- Never diagnose a medical condition, prescribe treatment, or give medical advice. If the client describes a symptom or concern that sounds medical (pain, injury, illness, disordered eating, mental health), tell them clearly to speak with a qualified healthcare professional and their coach.
- Use the client context below to answer questions about their own plan, progress, and history. Do not invent data that isn't in the context.
- Keep answers concise, encouraging, and specific to this client.

Client context:
${context}`;
}

async function sendMessage(clientId: string, content: string, req: Request) {
  const conversation = await aiConversationRepository.findOrCreateForClient(clientId);
  await aiConversationRepository.appendMessage(conversation.id, 'USER', content);

  const [context, recentHistory] = await Promise.all([
    buildClientContext(clientId),
    aiConversationRepository.recentMessages(conversation.id, MAX_HISTORY_MESSAGES),
  ]);

  const messages = recentHistory
    .slice()
    .reverse()
    .map((message) => ({ role: (message.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant', content: message.content }));

  const reply = await aiService.generateText({
    clientId,
    feature: 'chat',
    system: systemPrompt(context),
    messages,
    model: AI_MODELS.CHAT,
    maxTokens: MAX_OUTPUT_TOKENS,
  });

  const assistantMessage = await aiConversationRepository.appendMessage(conversation.id, 'ASSISTANT', reply);

  await auditService.log({ req, actorUserId: req.user?.id, action: 'AI_CHAT_MESSAGE_SENT', entityType: 'CLIENT', entityId: clientId });

  return toPublicMessage(assistantMessage);
}

async function listMessages(clientId: string, page: number, pageSize: number) {
  const conversation = await aiConversationRepository.findForClient(clientId);
  if (!conversation) {
    return { messages: [], total: 0, page, pageSize };
  }

  const [messages, total] = await aiConversationRepository.listMessages(conversation.id, page, pageSize);
  return { messages: messages.map(toPublicMessage), total, page, pageSize };
}

export const aiChatService = {
  sendMessage,
  listMessages,
};
