const WC_PREFIX = 'wc:'
const FB_PREFIX = 'fb:'

/**
 * Crypto utilities with HTTP fallback support
 *
 * SECURITY LEVELS:
 * 1. HTTPS + Web Crypto API: AES-GCM encryption (SECURE)
 * 2. HTTP fallback: XOR with key derivation (BASIC PROTECTION)
 * 3. Last resort: Base64 encoding (NO PROTECTION)
 *
 * Usage:
 * - On HTTPS: Uses secure AES-GCM encryption
 * - On HTTP: Falls back to XOR encryption (better than nothing)
 * - Automatically detects environment and chooses best available method
 */

// Simple fallback for HTTP environments where crypto.subtle is not available
function simpleFallbackEncrypt(data: string, keyString?: string): string {
  try {
    // Simple XOR encryption with derived key for better security than just Base64
    if (keyString) {
      const derivedKey = deriveSimpleKey(keyString, data.length)
      let encrypted = ''
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ derivedKey.charCodeAt(i))
      }
      return btoa(encrypted)
    }
    // Fallback to just Base64 if no key
    return btoa(data)
  } catch (error) {
    console.warn('Fallback encryption failed:', error)
    return btoa(data) // Last resort: just Base64
  }
}

function simpleFallbackDecrypt(data: string, keyString?: string): string {
  try {
    const decoded = atob(data)
    // Simple XOR decryption with derived key
    if (keyString) {
      const derivedKey = deriveSimpleKey(keyString, decoded.length)
      let decrypted = ''
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ derivedKey.charCodeAt(i))
      }
      return decrypted
    }
    return decoded
  } catch (error) {
    console.warn('Fallback decryption failed:', error)
    return data // Return as-is if decode fails
  }
}

export async function encrypt(dataToEncrypt: string, keyString: string, bufferString: string) {
  // Check if crypto.subtle is available (HTTPS required)
  if (!isCryptoAvailable()) {
    console.warn('Web Crypto API not available (likely HTTP environment). Using fallback XOR encryption.')
    return FB_PREFIX + simpleFallbackEncrypt(dataToEncrypt, keyString)
  }

  try {
    const ivBuffer = base64ToBytes(bufferString)
    const key = await getKey(keyString)
    const dataBuffer = new TextEncoder().encode(dataToEncrypt)
    const encryptedData = await encryptData(dataBuffer, key, ivBuffer)
    return WC_PREFIX + bytesToBase64(encryptedData)
  } catch (error) {
    console.warn('Web Crypto encryption failed, using fallback XOR:', error)
    return FB_PREFIX + simpleFallbackEncrypt(dataToEncrypt, keyString)
  }
}

export async function decrypt(encryptedDataString: string, keyString: string, bufferString: string) {
  // Route by prefix if present so we avoid OperationError on wrong-method data
  if (encryptedDataString.startsWith(FB_PREFIX)) {
    return simpleFallbackDecrypt(encryptedDataString.slice(FB_PREFIX.length), keyString)
  }

  const payload = encryptedDataString.startsWith(WC_PREFIX)
    ? encryptedDataString.slice(WC_PREFIX.length)
    : encryptedDataString

  if (!isCryptoAvailable()) {
    console.warn('Web Crypto API not available (likely HTTP environment). Using fallback XOR decryption.')
    return simpleFallbackDecrypt(payload, keyString)
  }

  try {
    const key = await getKey(keyString)
    const encryptedBuffer = base64ToBytes(payload)
    const ivBuffer = base64ToBytes(bufferString)
    const decryptedBuffer = await decryptData(encryptedBuffer, key, ivBuffer)
    return new TextDecoder().decode(decryptedBuffer)
  } catch (error) {
    // Only warn for genuinely unexpected failures (legacy data fallback is normal)
    if (encryptedDataString.startsWith(WC_PREFIX)) {
      console.warn('Web Crypto decryption failed for wc-prefixed data, using fallback XOR:', error)
    }
    return simpleFallbackDecrypt(payload, keyString)
  }
}

// ======================================= HELPER FUNCTIONS ================================

// Check if we're in a secure context (HTTPS)
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true // Server-side
  return window.isSecureContext || window.location.protocol === 'https:'
}

// Check if Web Crypto API is available
export function isCryptoAvailable(): boolean {
  return !!(globalThis.crypto?.subtle && isSecureContext())
}

/** Converts a Base64 string to browser-native bytes without Node's Buffer. */
function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** Converts Web Crypto output to Base64 without Node's Buffer polyfill. */
function bytesToBase64(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Simple key derivation for fallback (not cryptographically secure)
function deriveSimpleKey(keyString: string, length = 32): string {
  if (keyString.length >= length) {
    return keyString.slice(0, length)
  }

  // Repeat and hash-like transformation for better key distribution
  let derived = keyString
  while (derived.length < length) {
    derived += keyString
  }

  // Simple character transformation to make key less predictable
  let transformed = ''
  for (let i = 0; i < length; i++) {
    const char = derived.charCodeAt(i % derived.length)
    transformed += String.fromCharCode((char * 7 + i) % 256)
  }

  return transformed.slice(0, length)
}

const getKey = async (encryptionKey: string) => {
  // Check if crypto.subtle is available
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment')
  }

  return await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey),
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  )
}

const encryptData = async (dataBuffer: BufferSource, key: CryptoKey, ivBuffer: BufferSource) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment')
  }

  return await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    dataBuffer
  )
}

const decryptData = async (encryptedDataBuffer: BufferSource, key: CryptoKey, ivBuffer: BufferSource) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment')
  }

  return await globalThis.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    encryptedDataBuffer
  )
}
