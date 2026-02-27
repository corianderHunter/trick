import useSWR from 'swr'
import {
  fetchModelConfigs,
  createModelConfig,
  updateModelConfig,
  deleteModelConfig,
  type CreateModelConfigInput,
  type UpdateModelConfigInput,
} from '@/lib/model-config-api'

const MODEL_CONFIGS_KEY = '/api/model-configs'

export function useModelConfigs() {
  const { data, error, isLoading, mutate } = useSWR(
    MODEL_CONFIGS_KEY,
    fetchModelConfigs
  )

  const models = data ?? []

  const create = async (input: CreateModelConfigInput) => {
    const created = await createModelConfig(input)
    await mutate([...models, created], false)
    return created
  }

  const update = async (id: string, input: UpdateModelConfigInput) => {
    const updated = await updateModelConfig(id, input)
    await mutate(
      models.map((m) => (m.id === id ? updated : m)),
      false
    )
    return updated
  }

  const remove = async (id: string) => {
    await deleteModelConfig(id)
    await mutate(
      models.filter((m) => m.id !== id),
      false
    )
  }

  return {
    models,
    isLoading,
    error,
    mutate,
    create,
    update,
    remove,
  }
}
