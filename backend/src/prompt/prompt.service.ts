import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt, PromptKey } from '../entities/prompt.entity';
import {
  DEFAULT_SCRIPT_PROMPT_PREFIX,
  DEFAULT_VISUAL_PROMPT_PREFIX,
} from '../ai/ai-director-prompt-generator';

/** 未在库中配置时使用的默认内容（与设置页「剧本 Prompt / 画面 Prompt」对应） */
const DEFAULT_CONTENT: Record<PromptKey, string> = {
  script: DEFAULT_SCRIPT_PROMPT_PREFIX,
  visual: DEFAULT_VISUAL_PROMPT_PREFIX,
};

export type PromptItem = { key: PromptKey; content: string };

@Injectable()
export class PromptService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
  ) {}

  /** 获取所有 prompt（剧本、画面），若未配置则返回默认 */
  async findAll(): Promise<PromptItem[]> {
    const rows = await this.promptRepository.find({
      where: [{ key: 'script' }, { key: 'visual' }],
    });
    const map = new Map(rows.map((r) => [r.key, r.content]));
    return [
      { key: 'script', content: map.get('script') ?? DEFAULT_CONTENT.script },
      { key: 'visual', content: map.get('visual') ?? DEFAULT_CONTENT.visual },
    ];
  }

  /** 按 key 获取一条，未配置则返回默认 */
  async findByKey(key: PromptKey): Promise<PromptItem> {
    const row = await this.promptRepository.findOne({ where: { key } });
    const content = row?.content?.trim() ?? DEFAULT_CONTENT[key];
    return { key, content };
  }

  /**
   * 获取模板内容，供剧本/画面 prompt 生成器使用。
   * 即：设置页「剧本 Prompt」保存的内容会通过此处注入到 buildPromptForScript。
   */
  async getTemplateContent(key: PromptKey): Promise<string> {
    const row = await this.promptRepository.findOne({ where: { key } });
    const content = row?.content?.trim();
    return content || DEFAULT_CONTENT[key];
  }

  /** 更新指定 key 的 content（设置页保存时调用） */
  async update(key: PromptKey, content: string): Promise<PromptItem> {
    let row = await this.promptRepository.findOne({ where: { key } });
    if (!row) {
      row = this.promptRepository.create({ key, content });
    } else {
      row.content = content;
    }
    await this.promptRepository.save(row);
    return { key, content: row.content };
  }
}
