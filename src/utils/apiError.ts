interface BackendErrorShape {
  code?: string
  config?: { method?: string; url?: string }
  response?: { 
    status?: number; 
    data?: { 
      message?: string;
      Message?: string;
      title?: string;
      errors?: Record<string, string[]>
    } 
  }
}

export const getApiErrorStatus = (error: unknown): number | undefined =>
  (error as BackendErrorShape).response?.status

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  const e = error as BackendErrorShape
  
  if (e.response?.data) {
    const data = e.response.data
    if (data.message) return data.message
    if (data.Message) return data.Message

    if (data.errors && typeof data.errors === 'object') {
      const errorMessages = Object.values(data.errors).flat()
      if (errorMessages.length > 0) {
        return errorMessages.join(' | ')
      }
    }
    if (data.title) return data.title
  }

  if (e.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.'
  
  if (e.response?.status) {
    return `Request failed (${e.response.status}): ${(e.config?.method ?? '').toUpperCase()} ${e.config?.url ?? ''}`
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallback
}
