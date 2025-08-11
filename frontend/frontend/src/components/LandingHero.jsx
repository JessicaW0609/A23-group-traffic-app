import React from "react";
import MapCard from "./MapCard";

const badgeCls = "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 shadow-sm";

export default function LandingHero({ onPrimary }) {
  return (
    <section className="relative overflow-hidden">
      {/* 背景：深色渐变 + 网格 */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_-20%,rgba(16,185,129,.15),transparent),radial-gradient(800px_500px_at_80%_10%,rgba(99,102,241,.12),transparent)] bg-slate-950" />
      <div className="absolute inset-0 -z-10 opacity-[0.25]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "48px 48px, 48px 48px" }}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 lg:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          {/* 左侧文案 */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] text-white tracking-tight">
              Smarter Cities<br/>Start with{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Smarter Parking</span>
            </h1>
            <p className="max-w-xl text-slate-300">AI-powered predictions for seamless urban mobility. Turn parking from frustration into fluid city flow.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={onPrimary} className="rounded-xl px-5 py-2.5 font-medium text-white bg-gradient-to-r from-emerald-500 to-indigo-500 shadow hover:opacity-95">Get Started →</button>
              <button className="rounded-xl px-5 py-2.5 font-medium text-slate-200 border border-white/10 bg-white/5 hover:bg-white/10">Try it out</button>
            </div>
          </div>

          {/* 右侧：热力地图卡片 */}
          <MapCard
            center={[-37.8136, 144.9631]}
            points={[
              [-37.813, 144.963, 0.8],
              [-37.81, 144.97, 0.6],
              [-37.82, 144.95, 0.4],
            ]}
          />
        </div>
      </div>
    </section>
  );
}
