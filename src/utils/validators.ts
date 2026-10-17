/**
 * Validates whether the given string is a valid email address.
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * Validates a telephone number.
 * Must be between 5 and 30 characters, and contain only digits, spaces, hyphens, and optional leading '+'.
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false
  
  // Length check (5 to 30 characters)
  const trimmed = phone.trim()
  if (trimmed.length < 5 || trimmed.length > 30) return false

  // Character check: optional + followed by digits, spaces, or hyphens
  const phoneRegex = /^\+?[0-9\s\-]+$/
  return phoneRegex.test(trimmed)
}

/**
 * Validates a birth date string (YYYY-MM-DD).
 * Must be a valid date and must be in the past.
 */
export function isValidBirthDate(birthDate: string | null | undefined): boolean {
  if (!birthDate) return false
  
  // Format check YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(birthDate)) return false

  const parsedDate = new Date(birthDate)
  // Check if calendar date is valid (e.g. not 2026-02-30)
  if (isNaN(parsedDate.getTime())) return false

  // Double check that parsing didn't adjust date parts (e.g. "2026-04-31" becomes "2026-05-01")
  const [year, month, day] = birthDate.split('-').map(Number)
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return false
  }

  // Must be in the past
  const now = new Date()
  return parsedDate < now
}
