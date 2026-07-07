"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { QuizResult, VideoResult } from "../../lib/types";
import { searchWorkoutVideos } from "../../services/youtubeService";
import { timestampToMinutes } from "../../lib/log";
import Overlay from "./Overlay";

const FILTER_GROUPS: {
  key: keyof QuizResult;
  label: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "duration",
    label: "How much time do you have?",
    options: [
      { value: "short", label: "10–15 min" },
      { value: "medium", label: "20–30 min" },
      { value: "long", label: "30–45 min" },
      { value: "very-long", label: "A full hour" },
    ],
  },
  {
    key: "mood",
    label: "What kind of workout?",
    options: [
      { value: "hiit", label: "HIIT / cardio" },
      { value: "strength", label: "Strength" },
      { value: "flexibility", label: "Flexibility" },
      { value: "yoga", label: "Yoga" },
    ],
  },
  {
    key: "focusArea",
    label: "Focus on…",
    options: [
      { value: "full-body", label: "Full body" },
      { value: "upper", label: "Upper body" },
      { value: "lower", label: "Lower body" },
      { value: "core", label: "Core & abs" },
    ],
  },
  {
    key: "equipment",
    label: "Equipment",
    options: [
      { value: "none", label: "Just me" },
      { value: "light", label: "Dumbbells / bands" },
      { value: "gym", label: "Gym" },
      { value: "mat", label: "Yoga mat" },
    ],
  },
];

const DEFAULT_FILTERS: QuizResult = {
  intensity: "medium",
  duration: "medium",
  equipment: "none",
  focusArea: "full-body",
  mood: "strength",
};

const FILTERS_KEY = "zlf-filters-v1";

interface Props {
  onClose: () => void;
  onComplete: (video: VideoResult, minutes: number) => void;
}

type Stage = "filters" | "loading" | "results";

export default function WorkoutOverlay({ onClose, onComplete }: Props) {
  const [filters, setFilters] = useState<QuizResult>(DEFAULT_FILTERS);
  const [stage, setStage] = useState<Stage>("filters");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(20);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTERS_KEY);
      if (saved) setFilters({ ...DEFAULT_FILTERS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const pick = (key: keyof QuizResult, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
  };

  const search = async () => {
    setStage("loading");
    setConfirming(null);
    const results = await searchWorkoutVideos(filters);
    setVideos(results);
    setStage("results");
  };

  const startConfirm = (video: VideoResult) => {
    setConfirming(video.url);
    setMinutes(timestampToMinutes(video.duration.timestamp));
  };

  return (
    <Overlay title={stage === "results" ? "Pick your workout" : "Today's workout"} onClose={onClose}>
      {stage === "filters" && (
        <div className="flex flex-col gap-5">
          <p className="text-sm opacity-70 -mt-2">
            Every workout you finish plants new life in your forest 🌱
          </p>
          {FILTER_GROUPS.map((group) => (
            <div key={group.key}>
              <p className="text-sm font-semibold mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => pick(group.key, opt.value)}
                    className={`chip ${filters[group.key] === opt.value ? "chip-on" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={search} className="btn-primary mt-1">
            Find my workout ✨
          </button>
        </div>
      )}

      {stage === "loading" && (
        <div className="flex flex-col items-center gap-4 py-14">
          <div className="text-5xl animate-bounce">🌿</div>
          <p className="text-sm opacity-70">Finding the perfect workouts for you…</p>
        </div>
      )}

      {stage === "results" && (
        <div className="flex flex-col gap-3">
          {videos.length === 0 && (
            <p className="text-sm opacity-70 py-8 text-center">
              Nothing found — try different options!
            </p>
          )}
          {videos.map((video) => (
            <div key={video.url} className="rounded-2xl bg-white/70 border border-white/80 p-3 shadow-sm">
              <div className="flex gap-3">
                {video.thumbnail && (
                  <a href={video.url} target="_blank" rel="noreferrer" className="shrink-0">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      width={112}
                      height={72}
                      unoptimized
                      className="rounded-xl object-cover w-28 h-[72px]"
                    />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug line-clamp-2">{video.title}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {video.author.name} · {video.duration.timestamp}
                  </p>
                </div>
              </div>

              {confirming === video.url ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#eef6e7] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="stepper" onClick={() => setMinutes((m) => Math.max(1, m - 1))}>−</button>
                    <span className="text-sm font-bold w-16 text-center">{minutes} min</span>
                    <button className="stepper" onClick={() => setMinutes((m) => Math.min(240, m + 1))}>+</button>
                  </div>
                  <button className="btn-primary !py-2 !px-4 text-sm" onClick={() => onComplete(video, minutes)}>
                    Plant it 🌱
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <a href={video.url} target="_blank" rel="noreferrer" className="btn-ghost flex-1 text-center">
                    ▶ Watch
                  </a>
                  <button className="btn-ghost flex-1" onClick={() => startConfirm(video)}>
                    I did this! 🌱
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setStage("filters")} className="btn-ghost mt-1">
            ← Change filters
          </button>
        </div>
      )}
    </Overlay>
  );
}
