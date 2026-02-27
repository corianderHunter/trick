import useSWR from 'swr'
import {
  fetchDialogueStyles,
  createDialogueStyle,
  updateDialogueStyle,
  deleteDialogueStyle,
  type CreateDialogueStyleInput,
  type UpdateDialogueStyleInput,
} from '@/lib/dialogue-style-api'

const KEY = '/api/dialogue-styles'

export function useDialogueStyles() {
  const { data, error, isLoading, mutate } = useSWR(KEY, fetchDialogueStyles)
  const styles = data ?? []

  const create = async (input: CreateDialogueStyleInput) => {
    const created = await createDialogueStyle(input)
    await mutate([...styles, created], false)
    return created
  }

  const update = async (id: string, input: UpdateDialogueStyleInput) => {
    const updated = await updateDialogueStyle(id, input)
    await mutate(
      styles.map((s) => (s.id === id ? updated : s)),
      false
    )
    return updated
  }

  const remove = async (id: string) => {
    await deleteDialogueStyle(id)
    await mutate(
      styles.filter((s) => s.id !== id),
      false
    )
  }

  return { styles, isLoading, error, mutate, create, update, remove }
}
