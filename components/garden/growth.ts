// Shared timeline for the forest growth animation.
// Both the 3D scene and the DOM minute-counter read from the same clock
// (performance.now) so they stay perfectly in sync.

export interface GrowthAnim {
  fromIndex: number; // first plant that should animate in
  plantCount: number; // total plants in the forest
  t0: number; // performance.now() when the animation started
  stagger: number; // seconds between consecutive plants appearing
  minutesFrom: number;
  minutesTo: number;
}

export const POP_DURATION = 0.75; // seconds for one plant's pop-in

export function makeGrowthAnim(
  fromIndex: number,
  plantCount: number,
  minutesFrom: number,
  minutesTo: number
): GrowthAnim {
  const n = Math.max(1, plantCount - fromIndex);
  // Small batches pop in slowly and deliberately; a full-forest replay
  // compresses so it never takes much longer than ~8 seconds.
  const stagger = Math.min(0.5, Math.max(0.055, 7 / n));
  return { fromIndex, plantCount, t0: performance.now(), stagger, minutesFrom, minutesTo };
}

export function animDuration(anim: GrowthAnim): number {
  const n = Math.max(1, anim.plantCount - anim.fromIndex);
  return (n - 1) * anim.stagger + POP_DURATION;
}

// Springy overshoot, like things plopping out of the ground
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function growthOfPlant(
  plantIndex: number,
  anim: GrowthAnim | null,
  now: number
): number {
  if (!anim || plantIndex < anim.fromIndex) return 1;
  const elapsed = (now - anim.t0) / 1000 - (plantIndex - anim.fromIndex) * anim.stagger;
  if (elapsed <= 0) return 0;
  if (elapsed >= POP_DURATION) return 1;
  return easeOutBack(elapsed / POP_DURATION);
}

// Minutes shown on the HUD counter at a given moment of the animation
export function minutesAt(anim: GrowthAnim, now: number): number {
  const total = animDuration(anim);
  const t = Math.min(1, Math.max(0, (now - anim.t0) / 1000 / total));
  return Math.round(anim.minutesFrom + (anim.minutesTo - anim.minutesFrom) * t);
}
