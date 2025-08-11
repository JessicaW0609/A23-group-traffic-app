import React from "react";

const card = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-slate-200";

export default function MarketingSections({ onCTA }) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "Predictive Intelligence", d: "Block-by-block availability forecasts powered by ML.", i: "📈" },
            { t: "Real-Time Signals", d: "Ingest live sensors & mobility events for up-to-date guidance.", i: "⏱️" },
            { t: "API-First Platform", d: "Integrate with ops tools, mobile apps, and dashboards.", i: "🔗" },
          ].map((x, idx) => (
            <div key={idx} className={card}>
              <div className="text-2xl">{x.i}</div>
              <div className="mt-2 text-base font-semibold text-white">{x.t}</div>
              <div className="mt-1 text-sm text-slate-300">{x.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { n: "50M+", l: "events processed daily" },
            { n: "200+", l: "cities & operators" },
            { n: "95%", l: "accuracy in live tests" },
            { n: "99.9%", l: "API uptime" },
          ].map((k, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-center">
              <div className="text-3xl font-semibold text-white">{k.n}</div>
              <div className="text-xs text-slate-300 mt-1">{k.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center">
          <button onClick={onCTA} className="rounded-xl px-5 py-2.5 font-medium text-white bg-gradient-to-r from-emerald-500 to-indigo-500 shadow hover:opacity-95">
            Try the Dashboard →
          </button>
        </div>
      </div>
    </section>
  );
}
