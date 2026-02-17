import OpenAI from 'openai';
import type {
  IAiClient,
  GenerateOptions,
} from '../../interfaces/ai-client.interface';
import type { AiClientConfig } from '../client-config.interface';

export const DEEPSEEK_DEFAULT_MODEL = 'deepseek-reasoner';

export class DeepSeekClient implements IAiClient {
  private readonly client: OpenAI;

  constructor(config: AiClientConfig) {
    const baseUrl = config.apiUrl.replace(/\/$/, '');
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`,
    });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const model = options?.model ?? DEEPSEEK_DEFAULT_MODEL;
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    return content ?? '';
  }
}
