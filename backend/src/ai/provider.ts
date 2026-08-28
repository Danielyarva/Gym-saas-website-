import type { z } from 'zod';

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateTextInput {
  system: string;
  messages: ChatMessage[];
  model: string;
  maxTokens: number;
}

export interface GenerateStructuredOutputInput<T> {
  system: string;
  prompt: string;
  model: string;
  maxTokens: number;
  schema: z.ZodType<T>;
  toolName: string;
  toolDescription: string;
}

/**
 * Provider-agnostic AI abstraction (PRD §29) — nothing outside ai/ ever
 * imports the Anthropic SDK directly. Deliberately has no generateEmbedding:
 * nothing in this phase does semantic search/RAG, so it isn't part of the
 * interface until a real caller needs it.
 */
export interface AIProvider {
  generateText(input: GenerateTextInput): Promise<{ text: string; usage: AIUsage }>;
  generateStructuredOutput<T>(input: GenerateStructuredOutputInput<T>): Promise<{ data: T; usage: AIUsage }>;
}
