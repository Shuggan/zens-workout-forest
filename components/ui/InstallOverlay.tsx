"use client";

import { useState } from "react";
import Image from "next/image";
import Overlay from "./Overlay";
import {
  clearInstallPrompt,
  getInstallPrompt,
  isIos,
  isStandalone,
} from "../../lib/installPrompt";

interface Props {
  onClose: () => void;
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f7cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-1">
      <path d="M12 3v13" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

export default function InstallOverlay({ onClose }: Props) {
  const [installed, setInstalled] = useState(false);
  const nativePrompt = getInstallPrompt();

  const install = async () => {
    const prompt = getInstallPrompt();
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      clearInstallPrompt();
    }
  };

  return (
    <Overlay title="Get the app" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="Zen's Forest app icon"
            width={56}
            height={56}
            className="rounded-2xl shadow-md"
          />
          <div>
            <p className="text-sm font-bold">Zen&apos;s Workout Forest</p>
            <p className="text-xs opacity-60">
              Add it to your home screen — it opens full screen, just like a real app.
            </p>
          </div>
        </div>

        {isStandalone() || installed ? (
          <div className="rounded-2xl bg-[#eef6e7] p-4 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm font-semibold">
              You&apos;re already using the app — nothing to do!
            </p>
          </div>
        ) : isIos() ? (
          <ol className="flex flex-col gap-2.5">
            {[
              <>Tap the <b>Share</b> button <ShareIcon /> in your browser</>,
              <>Scroll down and tap <b>&ldquo;Add to Home Screen&rdquo;</b></>,
              <>Open <b>Zen&apos;s Forest</b> from your home screen 🌱</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/70 border border-white/80 px-4 py-3 shadow-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#7cbb62] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        ) : nativePrompt ? (
          <button className="btn-primary" onClick={install}>
            ⬇ Install now
          </button>
        ) : (
          <div className="rounded-2xl bg-white/70 border border-white/80 px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed">
              In your browser&apos;s menu, look for <b>&ldquo;Install app&rdquo;</b> or{" "}
              <b>&ldquo;Add to Home Screen&rdquo;</b> to keep the forest one tap away.
            </p>
          </div>
        )}
      </div>
    </Overlay>
  );
}
