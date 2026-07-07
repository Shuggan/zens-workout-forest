"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import Overlay from "./Overlay";

interface Props {
  onClose: () => void;
}

export default function SecretLetter({ onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) return;
    fetch("/sekret-message.txt")
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("Failed to load the letter. Try again!"));
  }, [unlocked]);

  return (
    <Overlay title="Sekret letter 💌" onClose={onClose}>
      {!unlocked ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.trim().toLowerCase() === "charlie") setUnlocked(true);
            else {
              setError(true);
              setPassword("");
            }
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-sm opacity-70">This letter is only for bae. Enter the password.</p>
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7cbb62] ${
              error ? "border-red-400" : "border-white"
            }`}
          />
          {error && <p className="text-xs text-red-500">Nope, try again 😉</p>}
          <button type="submit" className="btn-primary">
            Open the letter
          </button>
        </form>
      ) : content === null ? (
        <p className="text-sm opacity-70 py-8 text-center">Opening…</p>
      ) : (
        <div className="letter text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => (
                <span className="flex justify-center my-4">
                  <Image
                    src={typeof src === "string" ? src : ""}
                    alt={alt || ""}
                    width={340}
                    height={340}
                    unoptimized
                    className="rounded-2xl h-auto max-w-[90%] w-auto"
                  />
                </span>
              ),
              hr: () => <span className="block mx-auto my-5 h-px w-1/2 bg-[#3d4a3a]/30" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </Overlay>
  );
}
