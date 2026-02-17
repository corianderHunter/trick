/**
 * 客户端配置，由 ModelConfig 提供
 */
export interface AiClientConfig {
  apiUrl: string;
  apiKey: string;
  /** 提供商类型，用于选择对应客户端实现 */
  provider?: string;
}
