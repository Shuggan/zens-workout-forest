"use client";

import { ReactNode, useEffect } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Overlay({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#2f3d2a]/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-white text-lg leading-none shadow-sm"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
