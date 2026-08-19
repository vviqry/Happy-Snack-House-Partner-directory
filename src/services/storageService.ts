// Single place that touches window.localStorage. Everything else in the
// app goes through partnerService / productService, never localStorage
// directly — that keeps a future swap to Firebase/Supabase/an API to
// one file.

const PREFIX = 'hsh_'

function isStorageAvailable(): boolean {
  try {
    const testKey = `${PREFIX}__test__`
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export const storageAvailable = isStorageAvailable()

export function readJSON<T>(key: string, fallback: T): T {
  if (!storageAvailable) return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    // Corrupt data shouldn't crash the app — fall back silently.
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  if (!storageAvailable) return false
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeSession<T>(key: string, value: T): boolean {
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function clearSession(key: string): void {
  try {
    window.sessionStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}
