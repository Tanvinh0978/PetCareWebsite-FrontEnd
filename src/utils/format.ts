const vnd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' })

export const formatVnd = (value: number) => vnd.format(value)

export const weightLabel = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'Any weight'
  if (max === null) return `From ${min} kg`
  if (min === null) return `Up to ${max} kg`
  return `${min} to ${max} kg`
}

export const parseUtcDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date()
  const str = String(dateStr).trim()
  const hasTimezone = str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)
  const normalized = hasTimezone ? str : `${str}Z`
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? new Date(str) : d
}

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  try {
    const d = parseUtcDate(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(dateStr)
  }
}

export const formatDateOnly = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  try {
    const d = parseUtcDate(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

export const isoToLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return ''
  try {
    const d = parseUtcDate(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

export const localInputToISO = (local: string | null | undefined): string => {
  if (!local) return ''
  const d = new Date(local)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}
