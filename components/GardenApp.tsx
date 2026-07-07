"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoggedWorkout, VideoResult } from "../lib/types";
import { clearWorkoutLog, getWorkoutLog, logWorkout, removeWorkout, totalMinutes } from "../lib/log";
import { forestFromLog } from "../lib/forest";
import { isUnlocked, lockNow } from "../lib/auth";
import { GrowthAnim, animDuration, makeGrowthAnim, minutesAt } from "./garden/growth";
import ForestScene from "./garden/ForestScene";
import WorkoutOverlay from "./ui/WorkoutOverlay";
import JournalOverlay from "./ui/JournalOverlay";
import SettingsOverlay from "./ui/SettingsOverlay";
import LockScreen from "./ui/LockScreen";
import InstallOverlay from "./ui/InstallOverlay";
import { initInstallPrompt } from "../lib/installPrompt";

type OverlayKind = "none" | "workout" | "journal" | "settings" | "install";

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
    <div className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+4rem)] sm:top-20 inset-x-0 z-30 flex flex-col items-center animate-fade-in">
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
  const [locked, setLocked] = useState(true);
  const [anim, setAnim] = useState<GrowthAnim | null>(null);
  const [overlay, setOverlay] = useState<OverlayKind>("none");
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forest = useMemo(() => forestFromLog(log ?? []), [log]);

  useEffect(() => {
    initInstallPrompt();
    const stored = getWorkoutLog();
    setLog(stored);
    const unlocked = isUnlocked();
    setLocked(!unlocked);
    // When already unlocked, greet her by replaying the whole forest growing in.
    // When the lock screen shows first, the forest stays fully grown behind it.
    if (unlocked && stored.length > 0) {
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

  const growNewPlants = (before: LoggedWorkout[], after: LoggedWorkout[]) => {
    startAnim(
      makeGrowthAnim(
        forestFromLog(before).length,
        forestFromLog(after).length,
        totalMinutes(before),
        totalMinutes(after)
      )
    );
  };

  const handleComplete = (video: VideoResult, minutes: number) => {
    const before = log ?? [];
    const next = logWorkout({
      title: video.title,
      minutes,
      url: video.url,
      thumbnail: video.thumbnail,
      channel: video.author.name,
    });
    setLog(next);
    setOverlay("none");
    growNewPlants(before, next);
  };

  const handleQuickLog = (title: string, minutes: number) => {
    const before = log ?? [];
    const next = logWorkout({ title, minutes });
    setLog(next);
    setOverlay("none");
    growNewPlants(before, next);
  };

  const handleDelete = (id: string) => {
    setLog(removeWorkout(id));
  };

  const handleReplay = () => {
    if (!log || forest.length === 0) return;
    setOverlay("none");
    startAnim(makeGrowthAnim(0, forest.length, 0, totalMinutes(log)));
  };

  const handleLockNow = () => {
    lockNow();
    setOverlay("none");
    setAnim(null);
    setLocked(true);
  };

  const handleResetForest = () => {
    clearWorkoutLog();
    setLog([]);
    setOverlay("none");
    setAnim(null);
  };

  if (log === null) return null;
  const minutesSum = totalMinutes(log);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <ForestScene plants={forest} anim={anim} />

      {/* Content melts into the safe-area color at the screen edges */}
      <div className="edge-fade-top" />
      <div className="edge-fade-bottom" />

      {locked ? (
        <LockScreen onUnlock={() => setLocked(false)} />
      ) : (
        <>
          {/* Top bar */}
          <div className="fixed top-0 inset-x-0 z-30 flex items-start justify-between pt-[max(1rem,env(safe-area-inset-top))] pb-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pt-5 sm:pl-5 sm:pr-5 pointer-events-none">
            <div className="pointer-events-auto">
              <h1 className="font-display text-3xl sm:text-4xl text-[#2f3d2a] drop-shadow-[0_1px_6px_rgba(255,255,255,0.7)]">
                Zen&apos;s Workout Forest
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
              <button
                className="glass-pill w-11 h-11 !p-0 flex items-center justify-center"
                onClick={() => setOverlay("install")}
                aria-label="Get the app"
                title="Get the app"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f3d2a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </button>
              <button
                className="glass-pill w-11 h-11 !p-0 flex items-center justify-center text-lg"
                onClick={() => setOverlay("settings")}
                aria-label="Settings"
                title="Settings"
              >
                ⚙️
              </button>
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
          <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center gap-2 sm:gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))]">
            <button className="btn-primary shadow-xl" onClick={() => setOverlay("workout")}>
              💪 Start a workout
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
          {overlay === "settings" && (
            <SettingsOverlay
              onClose={() => setOverlay("none")}
              onLockNow={handleLockNow}
              onResetForest={handleResetForest}
            />
          )}
          {overlay === "install" && <InstallOverlay onClose={() => setOverlay("none")} />}
        </>
      )}
    </div>
  );
}
