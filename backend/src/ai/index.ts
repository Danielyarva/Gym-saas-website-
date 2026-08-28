import type { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';
import { AnthropicProvider } from './anthropic-provider';
import { estimateCostUsd } from './models';
import { aiUsageLogRepository } from '../repositories/ai-usage-log.repository';
import type { AIProvider, ChatMessage } from './provider';

let provider: AIProvider | null = null;

function getProvider(): AIProvider {
  provider ??= new AnthropicProvider(env.ANTHROPIC_API_KEY);
  return provider;
}

function isConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

interface UsageLogParams {
  clientId?: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}

async function logUsage(params: UsageLogParams): Promise<void> {
  try {
    await aiUsageLogRepository.create({
      ...params,
      estimatedCostUsd: estimateCostUsd(params.model, params.inputTokens, params.outputTokens),
    });
  } catch (err) {
    logger.error({ err }, 'Failed to write AI usage log');
  }
}

function notConfiguredError(): AppError {
  return new AppError('AI_NOT_CONFIGURED', "AI features aren't configured yet");
}

interface GenerateTextParams {
  clientId?: string;
  feature: string;
  system: string;
  messages: ChatMessage[];
  model: string;
  maxTokens: number;
}

/**
 * Every AI call in the app goes through generateText/generateStructuredOutput
 * below, never the provider directly — this is the one place the
 * "not configured" check and the AiUsageLog write happen, so neither can be
 * forgotten by a new feature. A usage row is written on every path
 * (success, provider error, and not-configured) so §30's tracking stays a
 * complete picture, including failures.
 */
async function generateText(params: GenerateTextParams): Promise<string> {
  const { clientId, feature, model } = params;

  if (!isConfigured()) {
    await logUsage({ clientId, feature, model, inputTokens: 0, outputTokens: 0, latencyMs: 0, success: false, errorMessage: 'AI_NOT_CONFIGURED' });
    throw notConfiguredError();
  }

  const startedAt = Date.now();
  try {
    const { text, usage } = await getProvider().generateText({
      system: params.system,
      messages: params.messages,
      model: params.model,
      maxTokens: params.maxTokens,
    });
    await logUsage({ clientId, feature, model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: Date.now() - startedAt, success: true });
    return text;
  } catch (err) {
    await logUsage({
      clientId,
      feature,
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Unknown AI provider error',
    });
    throw err;
  }
}

interface GenerateStructuredOutputParams<T> {
  clientId?: string;
  feature: string;
  system: string;
  prompt: string;
  model: string;
  maxTokens: number;
  schema: z.ZodType<T>;
  toolName: string;
  toolDescription: string;
}

async function generateStructuredOutput<T>(params: GenerateStructuredOutputParams<T>): Promise<T> {
  const { clientId, feature, model } = params;

  if (!isConfigured()) {
    await logUsage({ clientId, feature, model, inputTokens: 0, outputTokens: 0, latencyMs: 0, success: false, errorMessage: 'AI_NOT_CONFIGURED' });
    throw notConfiguredError();
  }

  const startedAt = Date.now();
  try {
    const { data, usage } = await getProvider().generateStructuredOutput({
      system: params.system,
      prompt: params.prompt,
      model: params.model,
      maxTokens: params.maxTokens,
      schema: params.schema,
      toolName: params.toolName,
      toolDescription: params.toolDescription,
    });
    await logUsage({ clientId, feature, model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, latencyMs: Date.now() - startedAt, success: true });
    return data;
  } catch (err) {
    await logUsage({
      clientId,
      feature,
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Unknown AI provider error',
    });
    throw err;
  }
}

export const aiService = {
  isConfigured,
  generateText,
  generateStructuredOutput,
};
