import QRCode from 'qrcode'

/**
 * QR Code Utilities
 * Handles QR code generation and pickup code management
 */

/**
 * Generate a QR code as a data URL
 * @param code - The pickup code to encode
 * @param size - QR code size in pixels (default: 300)
 * @returns Data URL of the QR code image
 */
export async function generatePickupQRCode(
  code: string,
  size: number = 300
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(code, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })

    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate a QR code to a canvas element
 * @param canvas - Canvas element to draw on
 * @param code - The pickup code to encode
 * @param size - QR code size in pixels (default: 300)
 */
export async function generatePickupQRCodeToCanvas(
  canvas: HTMLCanvasElement,
  code: string,
  size: number = 300
): Promise<void> {
  try {
    await QRCode.toCanvas(canvas, code, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
  } catch (error) {
    console.error('Error generating QR code to canvas:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate a random pickup code
 * Uses alphanumeric characters excluding confusing ones (0, O, I, 1, etc.)
 * @param length - Code length (default: 6)
 * @returns Random pickup code
 */
export function generatePickupCode(length: number = 6): string {
  // Exclude confusing characters: 0, O, I, 1, l
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Check if a pickup code has expired
 * @param expiresAt - Expiration date (Date object, ISO string, or timestamp)
 * @returns True if expired, false otherwise
 */
export function isPickupCodeExpired(expiresAt: Date | string | number): boolean {
  try {
    const expiryDate = new Date(expiresAt)
    const now = new Date()

    return now > expiryDate
  } catch (error) {
    console.error('Error checking expiration:', error)
    return true // Treat as expired if can't parse
  }
}

/**
 * Get remaining time until expiration
 * @param expiresAt - Expiration date (Date object, ISO string, or timestamp)
 * @returns Remaining time in milliseconds (negative if expired)
 */
export function getRemainingTime(expiresAt: Date | string | number): number {
  try {
    const expiryDate = new Date(expiresAt)
    const now = new Date()

    return expiryDate.getTime() - now.getTime()
  } catch (error) {
    console.error('Error calculating remaining time:', error)
    return 0
  }
}

/**
 * Get remaining time in a human-readable format
 * @param expiresAt - Expiration date (Date object, ISO string, or timestamp)
 * @returns Object with minutes and seconds remaining
 */
export function getRemainingTimeFormatted(expiresAt: Date | string | number): {
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const remainingMs = getRemainingTime(expiresAt)

  if (remainingMs <= 0) {
    return {
      minutes: 0,
      seconds: 0,
      isExpired: true,
    }
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return {
    minutes,
    seconds,
    isExpired: false,
  }
}

/**
 * Format remaining time as a string (MM:SS)
 * @param expiresAt - Expiration date (Date object, ISO string, or timestamp)
 * @returns Formatted time string (e.g., "09:45")
 */
export function formatRemainingTime(expiresAt: Date | string | number): string {
  const { minutes, seconds, isExpired } = getRemainingTimeFormatted(expiresAt)

  if (isExpired) {
    return 'Expired'
  }

  const minutesStr = minutes.toString().padStart(2, '0')
  const secondsStr = seconds.toString().padStart(2, '0')

  return `${minutesStr}:${secondsStr}`
}

/**
 * Validate a pickup code format
 * @param code - Code to validate
 * @param expectedLength - Expected code length (default: 6)
 * @returns True if valid format, false otherwise
 */
export function isValidPickupCode(code: string, expectedLength: number = 6): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }

  // Check length
  if (code.length !== expectedLength) {
    return false
  }

  // Check if alphanumeric
  const alphanumericRegex = /^[A-Z0-9]+$/
  return alphanumericRegex.test(code)
}

/**
 * Create a pickup code with expiration
 * @param expirationMinutes - Minutes until expiration (default: 10)
 * @returns Object with code and expiration date
 */
export function createPickupCodeWithExpiration(expirationMinutes: number = 10): {
  code: string
  expiresAt: Date
  expiresAtISO: string
} {
  const code = generatePickupCode()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)

  return {
    code,
    expiresAt,
    expiresAtISO: expiresAt.toISOString(),
  }
}

/**
 * Generate QR code and return as buffer
 * @param code - The pickup code to encode
 * @param size - QR code size in pixels (default: 300)
 * @returns Buffer containing PNG image data
 */
export async function generatePickupQRCodeBuffer(
  code: string,
  size: number = 300
): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(code, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
      type: 'png',
    })

    return buffer
  } catch (error) {
    console.error('Error generating QR code buffer:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}
