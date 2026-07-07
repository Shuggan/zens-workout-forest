"use client";

import { useEffect, useState } from "react";
import { MAX_ATTEMPTS, attemptsLeft, cooldownUntil, tryUnlock } from "../../lib/auth";

interface Props {
  onUnlock: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LockScreen({ onUnlock }: Props) {
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);
  const [left, setLeft] = useState(MAX_ATTEMPTS);
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  // Restore attempt/cooldown state and tick the countdown
  useEffect(() => {
    setLeft(attemptsLeft());
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil() - Date.now()) / 1000));
      setCooldown(remaining);
      if (remaining === 0 && attemptsLeft() === 0) setLeft(MAX_ATTEMPTS);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const submit = (pin: string) => {
    const result = tryUnlock(pin);
    if (result.ok) {
      onUnlock();
      return;
    }
    setEntry("");
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setLeft(result.attemptsLeft);
    if (result.cooldownUntil > Date.now()) {
      setCooldown(Math.ceil((result.cooldownUntil - Date.now()) / 1000));
    }
  };

  const press = (key: string) => {
    if (cooldown > 0) return;
    if (key === "⌫") {
      setEntry((e) => e.slice(0, -1));
      return;
    }
    if (!key || entry.length >= 6) return;
    const next = entry + key;
    setEntry(next);
    if (next.length === 6) setTimeout(() => submit(next), 120);
  };

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, cooldown]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 animate-fade-in">
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-display text-4xl text-[#2f3d2a] drop-shadow-[0_1px_8px_rgba(255,255,255,0.9)]">
          Zen&apos;s Workout Forest
        </h1>
        <p className="text-sm font-medium text-[#2f3d2a]/70">enter your passcode</p>
      </div>

      <div className={`flex gap-3 ${shake ? "animate-shake" : ""}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`pin-dot ${i < entry.length ? "pin-dot-on" : ""}`} />
        ))}
      </div>

      <div className="h-5 text-center">
        {cooldown > 0 ? (
          <p className="text-sm font-semibold text-[#c14b3a]">
            Too many tries — wait {cooldown}s
          </p>
        ) : left < MAX_ATTEMPTS ? (
          <p className="text-sm font-semibold text-[#c14b3a]">
            Wrong passcode · {left} attempt{left === 1 ? "" : "s"} left
          </p>
        ) : null}
      </div>

      <div className={`grid grid-cols-3 gap-4 ${cooldown > 0 ? "opacity-40 pointer-events-none" : ""}`}>
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <button key={i} className="key" onClick={() => press(key)}>
              {key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
