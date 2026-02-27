import { API_BASE_URL } from './api'

export type Ebook = {
  id: string
  filename: string
  title: string | null
  author: string | null
  createdAt: string
}

export type EbookChapter = {
  id: string
  ebookId: string
  chapterIndex: number
  title: string | null
}

export async function fetchEbooks(): Promise<Ebook[]> {
  const res = await fetch(`${API_BASE_URL}/api/ebooks`)
  if (!res.ok) throw new Error('获取电子书列表失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function uploadEbook(file: File): Promise<Ebook> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE_URL}/api/ebooks/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '上传失败')
  }
  return res.json()
}

export async function fetchEbookChapters(
  ebookId: string
): Promise<EbookChapter[]> {
  const res = await fetch(`${API_BASE_URL}/api/ebooks/${ebookId}/chapters`)
  if (!res.ok) throw new Error('获取目录失败')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchChapterContent(
  ebookId: string,
  chapterId: string
): Promise<string> {
  const res = await fetch(
    `${API_BASE_URL}/api/ebooks/${ebookId}/chapters/${chapterId}/content`
  )
  if (!res.ok) throw new Error('获取章节内容失败')
  const data = await res.json()
  return data?.content ?? ''
}

export async function deleteEbook(ebookId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/ebooks/${ebookId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '删除失败')
  }
}
