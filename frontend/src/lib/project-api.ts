import { API_BASE_URL } from './api'

export type Project = {
  id: string
  name: string
  ebookId: string | null
  originalWork: string | null
  progress: number
  storyOverview: string | null
  fixedMaterials: string[] | null
  dialogueQuantify: Record<string, unknown> | null
  visualQuantify: Record<string, unknown> | null
  defaultScriptModelId: string | null
  prePrompt: string | null
  createdAt: string
  lastWorkedAt: string | null
}

export type CreateProjectPayload = {
  name: string
  ebookId?: string | null
  originalWork?: string | null
  progress?: number
  storyOverview?: string | null
  fixedMaterials?: string[]
  dialogueQuantify?: Record<string, unknown> | null
  visualQuantify?: Record<string, unknown> | null
  defaultScriptModelId?: string | null
  prePrompt?: string | null
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects`)
  if (!res.ok) throw new Error('获取项目列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('项目不存在')
    throw new Error('获取项目失败')
  }
  return res.json()
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '创建项目失败')
  }
  return res.json()
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('项目不存在')
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '更新项目失败')
  }
  return res.json()
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('项目不存在')
    throw new Error('删除项目失败')
  }
}
