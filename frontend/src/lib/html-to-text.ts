/**
 * 将章节 HTML 转为适合提交给 AI 的纯文本：块级元素换行、去标签、合并空白。
 */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return ''
  let text = html
    .replace(/<br\s*\/?>\s*/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n')
    .replace(/<\/div>\s*/gi, '\n')
    .replace(/<\/h[1-6]>\s*/gi, '\n')
    .replace(/<\/li>\s*/gi, '\n')
    .replace(/<\/tr>\s*/gi, '\n')
    .replace(/<hr\s*\/?>\s*/gi, '\n')
    .replace(/<\/blockquote>\s*/gi, '\n')
    .replace(/<\/pre>\s*/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .trim()
  return text
}

/**
 * 将纯文本（段落用双换行分隔）转为富文本编辑器可用的简单 HTML。
 */
export function plainTextToHtml(plainText: string): string {
  if (!plainText.trim()) return ''
  const paragraphs = plainText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return ''
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
