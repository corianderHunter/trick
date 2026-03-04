import { API_BASE_URL } from './api'

export type MaterialListItem = {
  id: string
  title: string
  description: string | null
  thumbnails: string[]
  createdAt: string
  updatedAt: string
}

export type CreateMaterialImageItem = {
  url: string
  description?: string
}

export type CreateMaterialInput = {
  title?: string
  description?: string
  images?: CreateMaterialImageItem[]
}

/** 列表接口返回的 thumbnails 为相对路径，转为可访问的完整 URL */
export function materialThumbnailUrl(path: string): string {
  if (path.startsWith('http')) return path
  const base = API_BASE_URL.replace(/\/$/, '')
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

export async function fetchMaterials(): Promise<MaterialListItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/materials`)
  if (!res.ok) throw new Error('获取物料列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function uploadMaterialImage(
  file: File
): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE_URL}/api/materials/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '图片上传失败')
  }
  return res.json()
}

export type MaterialDetail = {
  id: string
  title: string
  description: string | null
  images: Array<{ url: string; description: string | null }>
  createdAt: string
  updatedAt: string
}

export type UpdateMaterialInput = {
  title?: string
  description?: string
  images?: CreateMaterialImageItem[]
}

export async function fetchMaterial(id: string): Promise<MaterialDetail> {
  const res = await fetch(`${API_BASE_URL}/api/materials/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('物料不存在')
    throw new Error('获取物料失败')
  }
  return res.json()
}

export async function createMaterial(
  input: CreateMaterialInput
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title?.trim() || '未命名物料',
      description: input.description?.trim() || '',
      images: input.images ?? [],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '创建物料失败')
  }
  return res.json()
}

export async function updateMaterial(
  id: string,
  input: UpdateMaterialInput
): Promise<MaterialDetail> {
  const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title?.trim(),
      description: input.description?.trim() ?? '',
      images: input.images ?? [],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '保存失败')
  }
  return res.json()
}

export async function deleteMaterial(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '删除失败')
  }
}
