import { API_BASE_URL } from './api'

/** 剧本创作 / 视频创作 阶段状态 */
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed'

/** 台词量化指标（与 DialogueQuantifyValue 一致） */
export type ScriptDialogueQuantify = {
  rhetoricalDensity: number
  emotionalExplicitness: number
  dramaticTension: number
  rhythmStructure: string
  registerLevel: string[]
  narrativeExplicitness: number
}

/** 剧本创作模型调用状态 */
export type ScriptModelCallStatus =
  | 'not_called'
  | 'calling'
  | 'completed'
  | 'failed'

export type ProjectTask = {
  id: string
  projectId: string
  name: string
  scriptStatus: PhaseStatus
  videoStatus: PhaseStatus
  scriptBody?: string | null
  scriptModelId?: string | null
  scriptDialogueQuantify?: ScriptDialogueQuantify | null
  scriptModelCallStatus?: ScriptModelCallStatus | null
  scriptModelResult?: string | null
  scriptModelError?: string | null
  createdAt: string
}

export type CreateProjectTaskPayload = {
  name: string
  scriptStatus?: PhaseStatus
  videoStatus?: PhaseStatus
  scriptBody?: string | null
  scriptModelId?: string | null
  scriptDialogueQuantify?: ScriptDialogueQuantify | null
  /** 剧本模型返回结果（JSON 或纯文本），保存时回写可编辑内容 */
  scriptModelResult?: string | null
}

export type UpdateProjectTaskPayload = Partial<CreateProjectTaskPayload> & {
  /** 为 true 时保存后触发剧本创作模型调用；为 false 或未传时仅保存 */
  triggerScriptModel?: boolean
}

const LABELS: Record<PhaseStatus, string> = {
  not_started: '未开始',
  in_progress: '未完成',
  completed: '已完成',
}

/** 剧本创作阶段状态展示（任务列表用，描述更详细） */
export const SCRIPT_STATUS_LABELS: Record<PhaseStatus, string> = {
  not_started: '剧本未开始',
  in_progress: '剧本创作中',
  completed: '剧本创作已完成',
}

export function getPhaseStatusLabel(status: PhaseStatus): string {
  return LABELS[status] ?? status
}

export function getScriptStatusLabel(status: PhaseStatus): string {
  return SCRIPT_STATUS_LABELS[status] ?? status
}

/** 剧本创作模型调用状态展示（任务列表用，描述更详细） */
export const SCRIPT_MODEL_CALL_STATUS_LABELS: Record<
  ScriptModelCallStatus,
  string
> = {
  not_called: '模型未调用',
  calling: '模型调用中',
  completed: '模型已生成',
  failed: '模型调用失败',
}

export function getScriptModelCallStatusLabel(
  status: ScriptModelCallStatus | null | undefined
): string {
  if (status == null) return '模型未调用'
  return SCRIPT_MODEL_CALL_STATUS_LABELS[status] ?? status
}

export async function fetchProjectTasks(
  projectId: string
): Promise<ProjectTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('项目不存在')
    throw new Error('获取任务列表失败')
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchProjectTask(
  projectId: string,
  taskId: string
): Promise<ProjectTask> {
  const res = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}`
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error('任务不存在')
    throw new Error('获取任务失败')
  }
  return res.json()
}

/** 仅返回模型调用状态（轮询用） */
export type ScriptCallStatusResponse = {
  scriptModelCallStatus: ScriptModelCallStatus | null
  scriptModelResult: string | null
  scriptModelError: string | null
}

export async function fetchScriptCallStatus(
  projectId: string,
  taskId: string
): Promise<ScriptCallStatusResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}/script-call-status`
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error('任务不存在')
    throw new Error('获取调用状态失败')
  }
  return res.json()
}

export async function createProjectTask(
  projectId: string,
  payload: CreateProjectTaskPayload
): Promise<ProjectTask> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('项目不存在')
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '创建任务失败')
  }
  return res.json()
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  payload: UpdateProjectTaskPayload
): Promise<ProjectTask> {
  const res = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error('任务不存在')
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '更新任务失败')
  }
  return res.json()
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/tasks/${taskId}`,
    { method: 'DELETE' }
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error('任务不存在')
    throw new Error('删除任务失败')
  }
}
