import { LoggedWorkout } from "./types";

const STORAGE_KEY = "zlf-workout-log-v1";

export function getWorkoutLog(): LoggedWorkout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w) => w && typeof w.id === "string" && typeof w.minutes === "number"
    );
  } catch {
    return [];
  }
}

function persist(log: LoggedWorkout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

export function logWorkout(
  workout: Omit<LoggedWorkout, "id" | "completedAt">
): LoggedWorkout[] {
  const log = getWorkoutLog();
  const entry: LoggedWorkout = {
    ...workout,
    minutes: Math.max(1, Math.round(workout.minutes)),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    completedAt: Date.now(),
  };
  const next = [...log, entry];
  persist(next);
  return next;
}

export function removeWorkout(id: string): LoggedWorkout[] {
  const next = getWorkoutLog().filter((w) => w.id !== id);
  persist(next);
  return next;
}

export function totalMinutes(log: LoggedWorkout[]): number {
  return log.reduce((sum, w) => sum + w.minutes, 0);
}

// Parse a YouTube-style timestamp ("32:10" or "1:05:30") into whole minutes.
export function timestampToMinutes(timestamp: string): number {
  const parts = timestamp.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN) || parts.length < 2) return 20;
  let minutes = 0;
  if (parts.length === 3) minutes = parts[0] * 60 + parts[1] + (parts[2] >= 30 ? 1 : 0);
  else minutes = parts[0] + (parts[1] >= 30 ? 1 : 0);
  return Math.max(1, minutes);
}
