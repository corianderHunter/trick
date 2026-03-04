/**
 * 剧本模型返回结果结构（与 AI 返回的 units 一致）
 * 剧本创作页右侧、视频创作页左侧共用解析逻辑
 */

export type ScriptModelUnit = {
  unit_index: number
  start_time: string
  end_time: string
  duration: number
  content: string
}

export type ScriptModelResult = {
  title?: string
  total_duration?: number
  units: ScriptModelUnit[]
}

export function parseScriptModelResult(
  raw: string | null | undefined
): ScriptModelResult | null {
  if (raw == null || raw.trim() === '') return null
  try {
    const o = JSON.parse(raw) as unknown
    if (
      o == null ||
      typeof o !== 'object' ||
      !Array.isArray((o as ScriptModelResult).units)
    )
      return null
    const r = o as {
      units: unknown[]
      title?: string
      total_duration?: number
    }
    const units: ScriptModelUnit[] = r.units.map((u: unknown, i: number) => {
      const x = u && typeof u === 'object' ? (u as Record<string, unknown>) : {}
      const content = (x.content ?? x.conetent ?? '') as string
      return {
        unit_index: Number(x.unit_index) || i + 1,
        start_time: String(x.start_time ?? '00:00'),
        end_time: String(x.end_time ?? '00:00'),
        duration: Number(x.duration) ?? 0,
        content: typeof content === 'string' ? content : '',
      }
    })
    return {
      title: r.title as string | undefined,
      total_duration: r.total_duration,
      units,
    }
  } catch {
    return null
  }
}
