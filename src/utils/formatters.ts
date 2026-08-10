/**
 * Formats a date string (YYYY-MM-DD) or Date object into European format (DD.MM.YYYY).
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return '-'
  }
}

/**
 * Formats a numeric amount to Euro currency format (e.g., 12,90 €).
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Formats storage size in bytes into human-readable format (MB, GB, TB).
 */
export function formatStorageSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '-'
  
  const units = ['Bytes', 'MB', 'GB', 'TB']
  // We skip KB for simplicity or convert directly to MB if it's large enough
  let size = bytes
  let unitIndex = 0

  // Standard bytes conversion
  // Special handling to jump to MB directly for values > 1MB
  if (size >= 1024) {
    size /= 1024 // Convert to KB
  }
  if (size >= 1024) {
    size /= 1024 // Convert to MB
    unitIndex = 1
  }
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  // If we ended up in Bytes (e.g. very small file, under 1KB), just show as KB
  if (unitIndex === 0 && bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  // For MB and above, show rounded numbers or 1 decimal if less than 10
  const decimals = size < 10 && unitIndex > 1 ? 1 : 0
  return `${size.toFixed(decimals)} ${units[unitIndex]}`
}
