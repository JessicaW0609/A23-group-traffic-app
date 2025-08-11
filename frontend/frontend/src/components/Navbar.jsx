import React from "react";

export default function Navbar({ onGetStarted }) {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur bg-slate-900/70 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
            <span className="text-emerald-300 font-bold">P</span>
          </div>
          <span className="text-slate-100 font-semibold tracking-wide">SmartParking</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-slate-300">
          {["Home","API","Platform","About","Contact"].map(x => (
            <button key={x} className="px-3 py-1.5 rounded-xl hover:bg-white/5">{x}</button>
          ))}
        </div>
        <button
          onClick={onGetStarted}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-indigo-500 shadow hover:opacity-95">
          Get Started
        </button>
      </div>
    </nav>
  );
}
