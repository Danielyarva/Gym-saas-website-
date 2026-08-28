import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AIProvider, GenerateTextInput, GenerateStructuredOutputInput, AIUsage } from './provider';

function toUsage(usage: { input_tokens: number; output_tokens: number }): AIUsage {
  return { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens };
}

export class AnthropicProvider implements AIProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText({ system, messages, model, maxTokens }: GenerateTextInput): Promise<{ text: string; usage: AIUsage }> {
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return { text, usage: toUsage(response.usage) };
  }

  async generateStructuredOutput<T>({
    system,
    prompt,
    model,
    maxTokens,
    schema,
    toolName,
    toolDescription,
  }: GenerateStructuredOutputInput<T>): Promise<{ data: T; usage: AIUsage }> {
    // zod-to-json-schema's own generic inference recurses too deeply against
    // a passthrough-generic `z.ZodType<T>` here (a TS limitation, not a
    // runtime one — the schema is concrete at every real call site), so the
    // call itself is opted out of inference via `any`.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { $schema, ...inputSchema } = zodToJsonSchema(schema as any) as Record<string, unknown>;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ name: toolName, description: toolDescription, input_schema: inputSchema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: 'tool', name: toolName },
    });

    const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
    if (!toolUse) {
      throw new Error('AI response did not include the expected structured tool call');
    }

    // Never trust raw AI output (PRD §29) — re-validated with the same Zod
    // schema that defined the tool, even though the model was constrained
    // to that schema's shape.
    const data = schema.parse(toolUse.input);

    return { data, usage: toUsage(response.usage) };
  }
}
