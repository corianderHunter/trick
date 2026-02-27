import { API_BASE_URL } from './api'

export type ModelConfig = {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  description?: string | null
  provider?: string
  createdAt: string
}

export type CreateModelConfigInput = {
  name: string
  apiUrl: string
  apiKey: string
  description?: string
  provider?: string
}

export type UpdateModelConfigInput = Partial<CreateModelConfigInput>

export async function fetchModelConfigs(): Promise<ModelConfig[]> {
  const res = await fetch(`${API_BASE_URL}/api/model-configs`)
  if (!res.ok) throw new Error('获取模型列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createModelConfig(
  input: CreateModelConfigInput
): Promise<ModelConfig> {
  const res = await fetch(`${API_BASE_URL}/api/model-configs`, {
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

export async function updateModelConfig(
  id: string,
  input: UpdateModelConfigInput
): Promise<ModelConfig> {
  const res = await fetch(`${API_BASE_URL}/api/model-configs/${id}`, {
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

export async function deleteModelConfig(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/model-configs/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '删除失败')
  }
}
