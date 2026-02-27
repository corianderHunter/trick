import { API_BASE_URL } from './api'

export type DialogueStyle = {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  createdAt: string
}

export type CreateDialogueStyleInput = {
  name: string
  description?: string
  sortOrder?: number
}

export type UpdateDialogueStyleInput = Partial<CreateDialogueStyleInput>

export async function fetchDialogueStyles(): Promise<DialogueStyle[]> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue-styles`)
  if (!res.ok) throw new Error('获取台词风格列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createDialogueStyle(
  input: CreateDialogueStyleInput
): Promise<DialogueStyle> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue-styles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '创建失败')
  }
  return res.json()
}

export async function updateDialogueStyle(
  id: string,
  input: UpdateDialogueStyleInput
): Promise<DialogueStyle> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue-styles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '更新失败')
  }
  return res.json()
}

export async function deleteDialogueStyle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue-styles/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '删除失败')
  }
}
