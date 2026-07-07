import { LoggedWorkout } from "./types";

// Deterministic forest generation: the same workout log always produces the
// exact same forest, so the garden is stable across page loads.

export type PlantKind =
  | "pine"
  | "oak"
  | "birch"
  | "bush"
  | "flower"
  | "mushroom"
  | "rock";

export interface Plant {
  index: number; // global planting order (drives spiral position + animation)
  workoutId: string;
  kind: PlantKind;
  x: number;
  z: number;
  rotY: number;
  scale: number;
  seed: number; // 0..1, used for per-plant color/shape variation
}

const SPACING = 1.18;
const GOLDEN_ANGLE = 2.399963229728653;

// Small fast seeded PRNG
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Every ~5 minutes of workout plants one thing (min 1, capped at 40)
export function plantsForMinutes(minutes: number): number {
  return Math.min(40, Math.max(1, Math.round(minutes / 5)));
}

const WEIGHTED_KINDS: [PlantKind, number][] = [
  ["pine", 0.26],
  ["oak", 0.24],
  ["birch", 0.14],
  ["bush", 0.13],
  ["flower", 0.13],
  ["mushroom", 0.05],
  ["rock", 0.05],
];

function pickKind(r: number): PlantKind {
  let acc = 0;
  for (const [kind, w] of WEIGHTED_KINDS) {
    acc += w;
    if (r < acc) return kind;
  }
  return "bush";
}

const BASE_SCALE: Record<PlantKind, number> = {
  pine: 1.0,
  oak: 1.0,
  birch: 0.95,
  bush: 0.9,
  flower: 0.95,
  mushroom: 0.9,
  rock: 0.9,
};

export function forestFromLog(log: LoggedWorkout[]): Plant[] {
  const plants: Plant[] = [];
  let index = 0;

  for (const workout of log) {
    const rng = mulberry32(hashString(workout.id));
    const count = plantsForMinutes(workout.minutes);
    // Longer workouts grow slightly grander trees
    const grandeur = 0.85 + Math.min(workout.minutes, 90) / 90 * 0.45;

    for (let i = 0; i < count; i++) {
      // Sunflower spiral fills the island evenly as the forest grows
      const r = SPACING * Math.sqrt(index + 0.7) + (rng() - 0.5) * 0.8;
      const theta = index * GOLDEN_ANGLE + (rng() - 0.5) * 0.35;
      // The first plant of every workout is always a proper tree
      const kind: PlantKind =
        i === 0 ? (rng() < 0.5 ? "pine" : "oak") : pickKind(rng());
      const sizeJitter = 0.8 + rng() * 0.45;

      plants.push({
        index,
        workoutId: workout.id,
        kind,
        x: Math.cos(theta) * r,
        z: Math.sin(theta) * r,
        rotY: rng() * Math.PI * 2,
        scale: BASE_SCALE[kind] * sizeJitter * (i === 0 ? grandeur : 1),
        seed: rng(),
      });
      index++;
    }
  }

  return plants;
}

export function islandRadius(plantCount: number): number {
  return Math.max(9, SPACING * Math.sqrt(plantCount + 1) + 3.5);
}
