"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_KEY = "zlf-music";

export default function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const audio = new Audio("/1-03-Title-Screen.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    const wantsMusic = localStorage.getItem(MUSIC_KEY) !== "off";
    if (wantsMusic) {
      audio
        .play()
        .then(() => setOn(true))
        .catch(() => {
          // Autoplay blocked: start on the first interaction instead
          const onFirstTap = () => {
            if (localStorage.getItem(MUSIC_KEY) !== "off") {
              audio.play().then(() => setOn(true)).catch(() => {});
            }
            window.removeEventListener("pointerdown", onFirstTap);
          };
          window.addEventListener("pointerdown", onFirstTap);
        });
    }

    const onVisibility = () => {
      if (document.hidden) audio.pause();
      else if (localStorage.getItem(MUSIC_KEY) !== "off") audio.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      audio.pause();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (on) {
      audio.pause();
      localStorage.setItem(MUSIC_KEY, "off");
      setOn(false);
    } else {
      localStorage.setItem(MUSIC_KEY, "on");
      audio.play().then(() => setOn(true)).catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={on ? "Mute music" : "Play music"}
      className="glass-pill w-11 h-11 !p-0 flex items-center justify-center text-lg"
      title={on ? "Music on" : "Music off"}
    >
      {on ? "🎵" : "🔇"}
    </button>
  );
}
