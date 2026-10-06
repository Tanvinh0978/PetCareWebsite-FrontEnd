const vnd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' })

export const formatVnd = (value: number) => vnd.format(value)

export const weightLabel = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'Any weight'
  if (max === null) return `From ${min} kg`
  if (min === null) return `Up to ${max} kg`
  return `${min} to ${max} kg`
}
