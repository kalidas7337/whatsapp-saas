/**
 * Phone Number Utilities
 *
 * Utilities for normalizing and validating WhatsApp phone numbers
 */

/**
 * Normalize phone number to E.164 format
 * @param phone - Input phone number
 * @param defaultCountryCode - Default country code (without +)
 * @returns E.164 formatted phone number (e.g., +919876543210)
 */
export function normalizePhone(phone: string, defaultCountryCode = '91'): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Handle different input formats
  if (cleaned.startsWith('+')) {
    // Already has country code with +
    return cleaned
  }

  if (cleaned.startsWith('00')) {
    // International format with 00
    return '+' + cleaned.substring(2)
  }

  if (cleaned.length === 10 && defaultCountryCode === '91') {
    // Indian 10-digit number
    return `+91${cleaned}`
  }

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Indian number without +
    return `+${cleaned}`
  }

  if (cleaned.startsWith('0') && defaultCountryCode === '91') {
    // Indian number with leading 0
    return `+91${cleaned.substring(1)}`
  }

  // Default: prepend country code
  return `+${defaultCountryCode}${cleaned}`
}

/**
 * Convert E.164 to WhatsApp ID format (without +)
 */
export function phoneToWaId(phone: string): string {
  const normalized = normalizePhone(phone)
  return normalized.replace('+', '')
}

/**
 * Convert WhatsApp ID to E.164 format
 */
export function waIdToPhone(waId: string): string {
  if (waId.startsWith('+')) return waId
  return `+${waId}`
}

/**
 * Validate if a phone number is valid for WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  try {
    const normalized = normalizePhone(phone)
    // E.164 format: + followed by 7-15 digits
    return /^\+[1-9]\d{6,14}$/.test(normalized)
  } catch {
    return false
  }
}

/**
 * Extract country code from E.164 number
 */
export function getCountryCode(phone: string): string | null {
  try {
    const normalized = normalizePhone(phone)
    // Simple extraction (first 1-3 digits after +)
    // For accurate extraction, use libphonenumber
    const match = normalized.match(/^\+(\d{1,3})/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Get all search variants of a phone number for database lookup
 */
export function getPhoneSearchVariants(phone: string): string[] {
  try {
    const normalized = normalizePhone(phone)
    const waId = phoneToWaId(phone)
    const last10 = waId.slice(-10)

    return [
      normalized, // +919876543210
      waId, // 919876543210
      last10, // 9876543210
      `0${last10}`, // 09876543210
    ].filter((v, i, arr) => arr.indexOf(v) === i) // Unique values
  } catch {
    return [phone]
  }
}

/**
 * Check if two phone numbers match
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
  try {
    const waId1 = phoneToWaId(phone1)
    const waId2 = phoneToWaId(phone2)

    // Exact match
    if (waId1 === waId2) return true

    // Last 10 digits match (for India)
    if (waId1.slice(-10) === waId2.slice(-10)) return true

    return false
  } catch {
    return false
  }
}

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @returns Formatted phone number (e.g., +91 98765 43210)
 */
export function formatPhoneForDisplay(phone: string): string {
  try {
    const normalized = normalizePhone(phone)

    // Indian number formatting
    if (normalized.startsWith('+91') && normalized.length === 13) {
      return `+91 ${normalized.slice(3, 8)} ${normalized.slice(8)}`
    }

    // US number formatting
    if (normalized.startsWith('+1') && normalized.length === 12) {
      return `+1 (${normalized.slice(2, 5)}) ${normalized.slice(5, 8)}-${normalized.slice(8)}`
    }

    // Default: add spaces every 3-4 digits
    return normalized.replace(/(\+\d{1,3})(\d{3,4})(\d{3,4})(\d{0,4})/, '$1 $2 $3 $4').trim()
  } catch {
    return phone
  }
}

/**
 * Mask phone number for privacy
 * @param phone - Phone number to mask
 * @returns Masked phone number (e.g., +91****3210)
 */
export function maskPhone(phone: string): string {
  try {
    const normalized = normalizePhone(phone)
    if (normalized.length > 6) {
      return normalized.slice(0, 4) + '****' + normalized.slice(-4)
    }
    return '****'
  } catch {
    return '****'
  }
}
