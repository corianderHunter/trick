// =======================================================
// AI Director Prompt Generator (Complete Aggregated File)
// Based on DialogueQuantifyValue & VisualQuantifyValue
// =======================================================

/**
 * =======================
 * Type Definitions
 * =======================
 */

export type DialogueQuantifyValue = {
  rhetoricalDensity: 1 | 2 | 3 | 4 | 5;
  emotionalExplicitness: 1 | 2 | 3 | 4 | 5;
  dramaticTension: 1 | 2 | 3 | 4 | 5;
  rhythmStructure: 'fragment' | 'flat' | 'fast';
  registerLevel: string[];
  narrativeExplicitness: 1 | 2 | 3 | 4 | 5;
};

export type VisualQuantifyValue = {
  colorSaturation: number; // 0–100
  compositionSymmetry: number; // 0–100
  cameraMovement: 'static' | 'dolly' | 'follow';
  lightShadowIntensity: number; // 0–100
  depthOfField: number; // 0–100
  sceneType: string[];
};

/**
 * =======================
 * Dialogue Mapping Rules
 * =======================
 */

function mapRhetoricalDensity(v: number): string {
  const map: Record<number, string> = {
    1: '使用日常口语，避免修辞和象征表达。',
    2: '偶尔使用轻微比喻，但整体保持清晰直接。',
    3: '适度使用隐喻和意象增强表达层次。',
    4: '频繁使用象征与修辞，语言具有文学感。',
    5: '高度诗性表达，允许含混与象征主导语言。',
  };
  return map[v] ?? '';
}

function mapEmotional(v: number): string {
  const map: Record<number, string> = {
    1: '情绪通过动作与停顿体现，不直接说明感受。',
    2: '少量点明情绪，但以行为表达为主。',
    3: '人物会明确表达情绪，但保持克制。',
    4: '情绪明显外露，语言具有冲击力。',
    5: '强烈情绪宣泄，允许情绪主导台词。',
  };
  return map[v] ?? '';
}

function mapTension(v: number): string {
  const map: Record<number, string> = {
    1: '无明显冲突，对话偏交流性。',
    2: '存在轻微分歧但不形成对抗。',
    3: '对话中存在明确冲突。',
    4: '语言具有明显对抗性。',
    5: '强烈冲突，台词具有攻击性。',
  };
  return map[v] ?? '';
}

function mapRhythm(v: 'fragment' | 'flat' | 'fast'): string {
  const map = {
    fragment: '使用短句、停顿、断裂式表达。',
    flat: '句式平稳均匀，节奏自然。',
    fast: '快节奏对话，来回交锋密集。',
  };
  return map[v];
}

const registerDictionary: Record<string, string> = {
  colloquial: '口语化表达',
  literary: '文学书面语',
  philosophical: '哲学思辨风格',
  sarcastic: '带讽刺意味',
  bureaucratic: '官方语言风格',
  youth: '年轻人口吻',
};

function mapRegister(arr: string[]): string {
  if (!arr?.length) return '语言风格保持自然。';
  return (
    '语言语域包含：' +
    arr.map((v) => registerDictionary[v] ?? v).join('、') +
    '。'
  );
}

function mapNarrativeExplicit(v: number): string {
  const map: Record<number, string> = {
    1: '对话主要表达情绪，不承担剧情推进功能。',
    2: '少量推进剧情。',
    3: '情绪与剧情平衡。',
    4: '明显承担剧情推进功能。',
    5: '对话高度信息化，直接推动情节发展。',
  };
  return map[v] ?? '';
}

/**
 * =======================
 * Visual Mapping Rules
 * =======================
 */

function mapSaturation(v: number): string {
  if (v <= 25) return '低饱和灰冷色调。';
  if (v <= 50) return '自然写实色彩。';
  if (v <= 75) return '偏风格化色彩表达。';
  return '高饱和度鲜明视觉风格。';
}

function mapComposition(v: number): string {
  if (v <= 30) return '不对称构图，强调张力。';
  if (v <= 70) return '自然构图。';
  return '高度对称构图，强调形式感。';
}

function mapCamera(v: 'static' | 'dolly' | 'follow'): string {
  const map = {
    static: '主要使用固定机位。',
    dolly: '适度推拉镜头。',
    follow: '大量跟拍和移动镜头。',
  };
  return map[v];
}

function mapLight(v: number): string {
  if (v <= 30) return '平光处理。';
  if (v <= 70) return '适度光影对比。';
  return '强烈明暗对比，强调戏剧性。';
}

function mapDepth(v: number): string {
  if (v <= 30) return '景深自然，前后景均清晰。';
  if (v <= 70) return '轻度景深分离。';
  return '明显前景背景分离。';
}

function mapSceneType(arr: string[]): string {
  if (!arr?.length) return '';
  return '场景类型包含：' + arr.join('、') + '。';
}

/**
 * =======================
 * Prompt Builders
 * =======================
 * 剧本创作：仅包装台词风格控制。
 * 影视创作：仅包装画面风格控制。
 */

/**
 * 剧本创作用 prompt：只包含台词风格控制。
 * @param content 正文/小说原文
 * @param dialogue 台词量化指标
 */
export function buildPromptForScript(
  content: string,
  dialogue: DialogueQuantifyValue,
): string {
  return `
你是一名专业电影编剧。

任务：
将以下内容整理或改编为电影剧本格式，重点打磨台词与对白。

【台词风格控制】
${mapRhetoricalDensity(dialogue.rhetoricalDensity)}
${mapEmotional(dialogue.emotionalExplicitness)}
${mapTension(dialogue.dramaticTension)}
${mapRhythm(dialogue.rhythmStructure)}
${mapRegister(dialogue.registerLevel)}
${mapNarrativeExplicit(dialogue.narrativeExplicitness)}

输出要求：
1. 使用标准电影剧本格式（场景头、动作描述、台词分行）
2. 台词独立成行，符合上述风格控制
3. 风格优先级高于润色

正文：
"""
${content}
"""
`;
}

/**
 * 影视创作用 prompt：只包含画面/画风风格控制。
 * @param content 剧本或原文
 * @param visual 画面量化指标
 */
export function buildPromptForVideo(
  content: string,
  visual: VisualQuantifyValue,
): string {
  return `
你是一名专业影视分镜/视觉设计助手。

任务：
根据以下剧本或文本，生成或优化画面描述与分镜指示，突出视觉风格。

【画面风格控制】
${mapSaturation(visual.colorSaturation)}
${mapComposition(visual.compositionSymmetry)}
${mapCamera(visual.cameraMovement)}
${mapLight(visual.lightShadowIntensity)}
${mapDepth(visual.depthOfField)}
${mapSceneType(visual.sceneType)}

输出要求：
1. 画面描述与分镜指示符合上述风格控制
2. 保持与原文/剧本情节一致
3. 风格优先级高于润色

内容：
"""
${content}
"""
`;
}
