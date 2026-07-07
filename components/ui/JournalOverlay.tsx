"use client";

import { useState } from "react";
import { LoggedWorkout } from "../../lib/types";
import { plantsForMinutes } from "../../lib/forest";
import { totalMinutes } from "../../lib/log";
import Overlay from "./Overlay";

interface Props {
  log: LoggedWorkout[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onQuickLog: (title: string, minutes: number) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function JournalOverlay({ log, onClose, onDelete, onQuickLog }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(30);

  const minutesSum = totalMinutes(log);
  const plantsSum = log.reduce((s, w) => s + plantsForMinutes(w.minutes), 0);
  const sorted = [...log].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <Overlay title="Your journal" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          [log.length, "workouts"],
          [minutesSum, "minutes"],
          [plantsSum, "plants"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-white/70 border border-white/80 py-3 text-center shadow-sm">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs opacity-60">{label}</p>
          </div>
        ))}
      </div>

      {quickLogOpen ? (
        <div className="rounded-2xl bg-[#eef6e7] p-4 mb-5">
          <p className="text-sm font-semibold mb-2">Log a workout you did on your own</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning run, pilates class…"
            className="w-full rounded-xl border border-white bg-white/80 px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#7cbb62]"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button className="stepper" onClick={() => setMinutes((m) => Math.max(1, m - 5))}>−</button>
              <span className="text-sm font-bold w-16 text-center">{minutes} min</span>
              <button className="stepper" onClick={() => setMinutes((m) => Math.min(240, m + 5))}>+</button>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost !py-2 !px-3 text-sm" onClick={() => setQuickLogOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary !py-2 !px-4 text-sm"
                onClick={() => {
                  onQuickLog(title.trim() || "My own workout", minutes);
                  setQuickLogOpen(false);
                  setTitle("");
                }}
              >
                Plant it 🌱
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="btn-ghost w-full mb-5" onClick={() => setQuickLogOpen(true)}>
          + Log a workout without a video
        </button>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm opacity-70 text-center py-6">
          Nothing here yet — your first workout plants your first tree 🌱
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-2xl bg-white/70 border border-white/80 px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                {w.url ? (
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold leading-snug line-clamp-1 hover:underline"
                  >
                    {w.title}
                  </a>
                ) : (
                  <p className="text-sm font-semibold leading-snug line-clamp-1">{w.title}</p>
                )}
                <p className="text-xs opacity-60 mt-0.5">
                  {formatDate(w.completedAt)} · {w.minutes} min · {plantsForMinutes(w.minutes)} plant
                  {plantsForMinutes(w.minutes) === 1 ? "" : "s"}
                </p>
              </div>
              {deleting === w.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="text-xs font-semibold rounded-full bg-[#e26d5c] text-white px-3 py-1.5"
                    onClick={() => {
                      onDelete(w.id);
                      setDeleting(null);
                    }}
                  >
                    Uproot
                  </button>
                  <button
                    className="text-xs rounded-full bg-white px-3 py-1.5"
                    onClick={() => setDeleting(null)}
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  aria-label="Delete workout"
                  className="shrink-0 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-sm opacity-50 hover:opacity-100"
                  onClick={() => setDeleting(w.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Overlay>
  );
}
