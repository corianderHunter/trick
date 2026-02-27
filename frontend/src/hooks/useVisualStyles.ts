import useSWR from 'swr'
import {
  fetchVisualStyles,
  createVisualStyle,
  updateVisualStyle,
  deleteVisualStyle,
  type CreateVisualStyleInput,
  type UpdateVisualStyleInput,
} from '@/lib/visual-style-api'

const KEY = '/api/visual-styles'

export function useVisualStyles() {
  const { data, error, isLoading, mutate } = useSWR(KEY, fetchVisualStyles)
  const styles = data ?? []

  const create = async (input: CreateVisualStyleInput) => {
    const created = await createVisualStyle(input)
    await mutate([...styles, created], false)
    return created
  }

  const update = async (id: string, input: UpdateVisualStyleInput) => {
    const updated = await updateVisualStyle(id, input)
    await mutate(
      styles.map((s) => (s.id === id ? updated : s)),
      false
    )
    return updated
  }

  const remove = async (id: string) => {
    await deleteVisualStyle(id)
    await mutate(
      styles.filter((s) => s.id !== id),
      false
    )
  }

  return { styles, isLoading, error, mutate, create, update, remove }
}
