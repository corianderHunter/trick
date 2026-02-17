/**
 * AI 客户端通用接口
 * 各模型提供商（DeepSeek、OpenAI、Claude 等）需实现此接口
 */
export interface GenerateOptions {
  /** 模型名称，如 deepseek-chat、gpt-4o */
  model?: string;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 温度，0-2 */
  temperature?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

export interface IAiClient {
  /**
   * 生成文本
   * @param prompt 用户输入
   * @param options 可选参数
   * @returns 生成的文本
   */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}

/** 支持的 AI 提供商，用于扩展 */
export type AiProvider = 'deepseek' | 'openai' | 'custom';
