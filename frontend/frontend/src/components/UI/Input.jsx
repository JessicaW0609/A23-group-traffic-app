import React from "react";

export default function Input({ className = "", ...props }) {
  const base = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/20";
  return <input className={`${base} ${className}`} {...props} />;
}
