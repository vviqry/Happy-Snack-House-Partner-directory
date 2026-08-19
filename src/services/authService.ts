import { readSession, writeSession, clearSession } from './storageService'

// Dev-only PIN. This is client-side gating, not real security — see
// README. Swap for real backend auth before this ever holds anything
// sensitive.
const DEV_ADMIN_PIN = '081390403669'
const SESSION_KEY = 'admin_session'

export function verifyPin(pin: string): boolean {
  return pin === DEV_ADMIN_PIN
}

export function startAdminSession(): void {
  writeSession(SESSION_KEY, true)
}

export function isAdminSession(): boolean {
  return readSession<boolean>(SESSION_KEY, false)
}

export function endAdminSession(): void {
  clearSession(SESSION_KEY)
}
