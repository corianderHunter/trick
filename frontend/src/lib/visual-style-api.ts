import { API_BASE_URL } from './api'

export type VisualStyle = {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  createdAt: string
}

export type CreateVisualStyleInput = {
  name: string
  description?: string
  sortOrder?: number
}

export type UpdateVisualStyleInput = Partial<CreateVisualStyleInput>

export async function fetchVisualStyles(): Promise<VisualStyle[]> {
  const res = await fetch(`${API_BASE_URL}/api/visual-styles`)
  if (!res.ok) throw new Error('获取画面风格列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createVisualStyle(
  input: CreateVisualStyleInput
): Promise<VisualStyle> {
  const res = await fetch(`${API_BASE_URL}/api/visual-styles`, {
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

export async function updateVisualStyle(
  id: string,
  input: UpdateVisualStyleInput
): Promise<VisualStyle> {
  const res = await fetch(`${API_BASE_URL}/api/visual-styles/${id}`, {
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

export async function deleteVisualStyle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/visual-styles/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '删除失败')
  }
}
