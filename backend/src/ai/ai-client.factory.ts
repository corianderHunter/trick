import { Injectable } from '@nestjs/common';
import type { IAiClient } from './interfaces/ai-client.interface';
import type { AiClientConfig } from './clients/client-config.interface';
import { DeepSeekClient } from './clients/deepseek';

@Injectable()
export class AiClientFactory {
  /**
   * 根据配置创建对应的 AI 客户端
   * @param config 包含 apiUrl、apiKey、provider
   * @returns 实现 IAiClient 的客户端实例
   */
  create(config: AiClientConfig): IAiClient {
    const provider = (config.provider ?? 'deepseek').toLowerCase();

    switch (provider) {
      case 'deepseek':
        return new DeepSeekClient(config);
      case 'openai':
        // OpenAI 与 DeepSeek 使用相同的 OpenAI 兼容 API
        return new DeepSeekClient(config);
      default:
        // 未知 provider 时尝试使用 DeepSeek 客户端（兼容 OpenAI 格式）
        return new DeepSeekClient(config);
    }
  }
}
