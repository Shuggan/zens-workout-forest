import { LoggedWorkout } from "./types";

export function buildWorkoutEntry(
  workout: Omit<LoggedWorkout, "id" | "completedAt">
): LoggedWorkout {
  return {
    ...workout,
    minutes: Math.max(1, Math.round(workout.minutes)),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    completedAt: Date.now(),
  };
}

export async function getWorkoutLog(): Promise<LoggedWorkout[]> {
  try {
    const res = await fetch("/api/workouts");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveWorkout(entry: LoggedWorkout): Promise<LoggedWorkout[]> {
  const res = await fetch("/api/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function removeWorkout(id: string): Promise<LoggedWorkout[]> {
  const res = await fetch(`/api/workouts?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function clearWorkoutLog(): Promise<void> {
  await fetch("/api/workouts", { method: "DELETE" });
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
