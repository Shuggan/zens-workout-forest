"use client";

import { useState } from "react";
import { changePin } from "../../lib/auth";
import Overlay from "./Overlay";

interface Props {
  onClose: () => void;
  onLockNow: () => void;
  onResetForest: () => void;
}

export default function SettingsOverlay({ onClose, onLockNow, onResetForest }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setMessage({ ok: false, text: "New passcodes don't match" });
      return;
    }
    const error = changePin(current.trim(), next.trim());
    if (error) {
      setMessage({ ok: false, text: error });
    } else {
      setMessage({ ok: true, text: "Passcode updated 🎉" });
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white bg-white/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7cbb62] tracking-widest";

  return (
    <Overlay title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <form onSubmit={handleChangePin} className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold">Change passcode</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={current}
            onChange={(e) => { setCurrent(e.target.value.replace(/\D/g, "")); setMessage(null); }}
            placeholder="Current passcode"
            className={inputClass}
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={next}
            onChange={(e) => { setNext(e.target.value.replace(/\D/g, "")); setMessage(null); }}
            placeholder="New 6-digit passcode"
            className={inputClass}
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, "")); setMessage(null); }}
            placeholder="Repeat new passcode"
            className={inputClass}
          />
          {message && (
            <p className={`text-xs font-semibold ${message.ok ? "text-[#4a8a58]" : "text-[#c14b3a]"}`}>
              {message.text}
            </p>
          )}
          <button type="submit" className="btn-primary mt-1">
            Update passcode
          </button>
        </form>

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold">Privacy</p>
          <button className="btn-ghost" onClick={onLockNow}>
            🔒 Lock the app now
          </button>
          <p className="text-xs opacity-60">
            Unlocking lasts 3 days, then the passcode is needed again.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold">Danger zone</p>
          {confirmingReset ? (
            <div className="rounded-2xl bg-[#fbe9e5] p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#c14b3a]">
                This uproots your whole forest and clears your workout history. Really?
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-full bg-[#e26d5c] text-white text-sm font-bold py-2"
                  onClick={() => { onResetForest(); setConfirmingReset(false); }}
                >
                  Yes, start over
                </button>
                <button className="btn-ghost flex-1" onClick={() => setConfirmingReset(false)}>
                  Keep my forest
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost !text-[#c14b3a]" onClick={() => setConfirmingReset(true)}>
              🪓 Start my forest over
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}
