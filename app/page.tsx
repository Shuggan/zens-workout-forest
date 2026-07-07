"use client";

import dynamic from "next/dynamic";

const GardenApp = dynamic(() => import("../components/GardenApp"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-[#fdf6ec]">
      <div className="text-5xl animate-bounce">🌱</div>
      <p className="text-sm text-[#2f3d2a]/70 font-medium">growing your forest…</p>
    </div>
  ),
});

export default function Home() {
  return <GardenApp />;
}
