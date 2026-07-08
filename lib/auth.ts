// Simple localStorage PIN lock. Single-user app, so this is a friendly
// gate rather than real security.

const PIN_KEY = "zlf-pin";
const UNLOCK_UNTIL_KEY = "zlf-unlock-until";
const ATTEMPTS_KEY = "zlf-pin-attempts";
const COOLDOWN_KEY = "zlf-pin-cooldown-until";

const DEFAULT_PIN = process.env.NEXT_PUBLIC_APP_PIN ?? "";
const ACCESS_MS = 3 * 24 * 60 * 60 * 1000; // unlocked for 3 days
export const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // pause after too many wrong tries

export function getPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const until = parseInt(localStorage.getItem(UNLOCK_UNTIL_KEY) || "0", 10);
  return Date.now() < until;
}

export function cooldownUntil(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(COOLDOWN_KEY) || "0", 10);
}

export function attemptsLeft(): number {
  if (typeof window === "undefined") return MAX_ATTEMPTS;
  const used = parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0", 10);
  return Math.max(0, MAX_ATTEMPTS - used);
}

export interface UnlockResult {
  ok: boolean;
  attemptsLeft: number;
  cooldownUntil: number;
}

export function tryUnlock(pin: string): UnlockResult {
  const cd = cooldownUntil();
  if (Date.now() < cd) {
    return { ok: false, attemptsLeft: 0, cooldownUntil: cd };
  }

  if (pin === getPin()) {
    localStorage.setItem(UNLOCK_UNTIL_KEY, String(Date.now() + ACCESS_MS));
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(COOLDOWN_KEY);
    return { ok: true, attemptsLeft: MAX_ATTEMPTS, cooldownUntil: 0 };
  }

  const used = parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0", 10) + 1;
  if (used >= MAX_ATTEMPTS) {
    const until = Date.now() + COOLDOWN_MS;
    localStorage.setItem(COOLDOWN_KEY, String(until));
    localStorage.removeItem(ATTEMPTS_KEY);
    return { ok: false, attemptsLeft: 0, cooldownUntil: until };
  }
  localStorage.setItem(ATTEMPTS_KEY, String(used));
  return { ok: false, attemptsLeft: MAX_ATTEMPTS - used, cooldownUntil: 0 };
}

export function changePin(current: string, next: string): string | null {
  if (current !== getPin()) return "Current passcode is wrong";
  if (!/^\d{6}$/.test(next)) return "New passcode must be 6 digits";
  localStorage.setItem(PIN_KEY, next);
  return null;
}

export function lockNow() {
  localStorage.removeItem(UNLOCK_UNTIL_KEY);
}
