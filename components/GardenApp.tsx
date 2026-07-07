"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoggedWorkout, VideoResult } from "../lib/types";
import { getWorkoutLog, logWorkout, removeWorkout, totalMinutes } from "../lib/log";
import { forestFromLog } from "../lib/forest";
import { GrowthAnim, animDuration, makeGrowthAnim, minutesAt } from "./garden/growth";
import ForestScene from "./garden/ForestScene";
import WorkoutOverlay from "./ui/WorkoutOverlay";
import JournalOverlay from "./ui/JournalOverlay";
import SecretLetter from "./ui/SecretLetter";
import MusicToggle from "./ui/MusicToggle";

type OverlayKind = "none" | "workout" | "journal" | "letter";

// Big animated minute counter shown while the forest grows
function GrowthCounter({ anim }: { anim: GrowthAnim }) {
  const [minutes, setMinutes] = useState(anim.minutesFrom);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setMinutes(minutesAt(anim, performance.now()));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim]);

  return (
    <div className="pointer-events-none fixed top-16 sm:top-20 inset-x-0 z-30 flex flex-col items-center animate-fade-in">
      <p className="font-display text-6xl sm:text-7xl text-[#2f3d2a] drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">
        {minutes}
      </p>
      <p className="text-sm font-semibold tracking-wide uppercase text-[#2f3d2a]/70">
        minutes of movement
      </p>
    </div>
  );
}

export default function GardenApp() {
  const [log, setLog] = useState<LoggedWorkout[] | null>(null);
  const [anim, setAnim] = useState<GrowthAnim | null>(null);
  const [overlay, setOverlay] = useState<OverlayKind>("none");
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forest = useMemo(() => forestFromLog(log ?? []), [log]);

  // Load the log, then play the whole forest growing in as an intro
  useEffect(() => {
    const stored = getWorkoutLog();
    setLog(stored);
    if (stored.length > 0) {
      const plants = forestFromLog(stored);
      startAnim(makeGrowthAnim(0, plants.length, 0, totalMinutes(stored)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAnim = (a: GrowthAnim) => {
    if (animTimer.current) clearTimeout(animTimer.current);
    setAnim(a);
    animTimer.current = setTimeout(() => setAnim(null), animDuration(a) * 1000 + 600);
  };

  const handleComplete = (video: VideoResult, minutes: number) => {
    const before = log ?? [];
    const prevPlantCount = forestFromLog(before).length;
    const next = logWorkout({
      title: video.title,
      minutes,
      url: video.url,
      thumbnail: video.thumbnail,
      channel: video.author.name,
    });
    setLog(next);
    setOverlay("none");
    startAnim(
      makeGrowthAnim(prevPlantCount, forestFromLog(next).length, totalMinutes(before), totalMinutes(next))
    );
  };

  const handleQuickLog = (title: string, minutes: number) => {
    const before = log ?? [];
    const prevPlantCount = forestFromLog(before).length;
    const next = logWorkout({ title, minutes });
    setLog(next);
    setOverlay("none");
    startAnim(
      makeGrowthAnim(prevPlantCount, forestFromLog(next).length, totalMinutes(before), totalMinutes(next))
    );
  };

  const handleDelete = (id: string) => {
    setLog(removeWorkout(id));
  };

  const handleReplay = () => {
    if (!log || forest.length === 0) return;
    setOverlay("none");
    startAnim(makeGrowthAnim(0, forest.length, 0, totalMinutes(log)));
  };

  if (log === null) return null;
  const minutesSum = totalMinutes(log);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <ForestScene plants={forest} anim={anim} />

      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-30 flex items-start justify-between p-4 sm:p-5 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="font-display text-3xl sm:text-4xl text-[#2f3d2a] drop-shadow-[0_1px_6px_rgba(255,255,255,0.7)]">
            Zen&apos;s Little Forest
          </h1>
          {!anim && (
            <p className="text-xs sm:text-sm text-[#2f3d2a]/70 font-medium mt-0.5">
              {forest.length === 0
                ? "a tiny world, waiting for its first seed"
                : `${minutesSum} minutes of movement · ${forest.length} plants`}
            </p>
          )}
        </div>
        <div className="pointer-events-auto flex gap-2">
          <MusicToggle />
        </div>
      </div>

      {anim && <GrowthCounter anim={anim} />}

      {/* Empty state hint */}
      {forest.length === 0 && !anim && overlay === "none" && (
        <div className="fixed inset-x-0 top-[38%] z-20 flex justify-center pointer-events-none px-6">
          <div className="glass-card rounded-3xl px-6 py-4 text-center max-w-sm animate-fade-in">
            <p className="text-3xl mb-1">🌱</p>
            <p className="text-sm font-medium">
              Your island is empty! Finish a workout and watch your forest come to life.
            </p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center gap-2 sm:gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button className="btn-primary shadow-xl" onClick={() => setOverlay("workout")}>
          🌱 Start a workout
        </button>
        <button className="glass-pill" onClick={() => setOverlay("journal")}>
          📖 Journal
        </button>
        {forest.length > 0 && (
          <button
            className="glass-pill w-12 !px-0 flex items-center justify-center"
            onClick={handleReplay}
            aria-label="Replay forest growth"
            title="Watch your forest grow"
          >
            ▶
          </button>
        )}
      </div>

      {/* Heart easter egg */}
      <button
        className="fixed bottom-5 right-4 z-30 text-lg opacity-40 hover:opacity-100 transition-opacity"
        onClick={() => setOverlay("letter")}
        aria-label="A little secret"
      >
        ❤️
      </button>

      {overlay === "workout" && (
        <WorkoutOverlay onClose={() => setOverlay("none")} onComplete={handleComplete} />
      )}
      {overlay === "journal" && (
        <JournalOverlay
          log={log}
          onClose={() => setOverlay("none")}
          onDelete={handleDelete}
          onQuickLog={handleQuickLog}
        />
      )}
      {overlay === "letter" && <SecretLetter onClose={() => setOverlay("none")} />}
    </div>
  );
}
