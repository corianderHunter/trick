import { API_BASE_URL } from './api'

export type PromptKey = 'script' | 'visual'

export type PromptItem = {
  key: PromptKey
  content: string
}

export async function fetchPrompts(): Promise<PromptItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/prompts`)
  if (!res.ok) throw new Error('获取 Prompt 列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchPrompt(key: PromptKey): Promise<PromptItem> {
  const res = await fetch(`${API_BASE_URL}/api/prompts/${key}`)
  if (!res.ok) throw new Error('获取 Prompt 失败')
  return res.json()
}

export async function updatePrompt(
  key: PromptKey,
  content: string
): Promise<PromptItem> {
  const res = await fetch(`${API_BASE_URL}/api/prompts/${key}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '更新失败')
  }
  return res.json()
}
