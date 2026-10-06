interface BackendErrorShape {
  code?: string
  config?: { method?: string; url?: string }
  response?: { status?: number; data?: { message?: string } }
}

export const getApiErrorStatus = (error: unknown): number | undefined =>
  (error as BackendErrorShape).response?.status

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  const e = error as BackendErrorShape
  if (e.response?.data?.message) return e.response.data.message
  if (e.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.'
  if (e.response?.status) {
    return `Request failed (${e.response.status}): ${(e.config?.method ?? '').toUpperCase()} ${e.config?.url ?? ''}`
  }
  return fallback
}
