import { API_BASE_URL } from './api'

export type DialogueQuantifyInput = {
  rhetoricalDensity: number
  emotionalExplicitness: number
  dramaticTension: number
  rhythmStructure: string
  registerLevel: string[]
  narrativeExplicitness: number
}

export type VisualQuantifyInput = {
  colorSaturation: number
  compositionSymmetry: number
  cameraMovement: string
  lightShadowIntensity: number
  depthOfField: number
  sceneType: string[]
}

export type CreateGenerationInput = {
  content: string
  modelId: string
  dialogueQuantify: DialogueQuantifyInput
  visualQuantify: VisualQuantifyInput
}

export type GenerationTask = {
  id: string
  content: string
  modelConfigId: string
  status: string
  result?: string | null
  errorMessage?: string | null
  createdAt: string
  modelConfig?: { id: string; name: string }
  dialogueQuantify?: Record<string, unknown> | null
  visualQuantify?: Record<string, unknown> | null
}

export async function fetchGenerationList(): Promise<GenerationTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/generation`)
  if (!res.ok) throw new Error('获取生成记录失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchGeneration(id: string): Promise<GenerationTask> {
  const res = await fetch(`${API_BASE_URL}/api/generation/${id}`)
  if (!res.ok) throw new Error('获取生成记录失败')
  return res.json()
}

export async function deleteGeneration(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/generation/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(err?.message || '删除失败')
  }
}

export async function createGeneration(
  input: CreateGenerationInput
): Promise<GenerationTask> {
  const res = await fetch(`${API_BASE_URL}/api/generation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string | string[]
    }
    const msg = Array.isArray(err?.message) ? err.message[0] : err?.message
    throw new Error(msg || '提交失败')
  }
  return res.json()
}
