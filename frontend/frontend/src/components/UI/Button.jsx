import React from "react";

export default function Button({ variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[.99]";
  const styles = {
    primary: "text-white bg-gradient-to-r from-emerald-500 to-indigo-500 shadow hover:opacity-95 disabled:opacity-60",
    ghost:   "text-slate-200 border border-white/15 bg-white/5 hover:bg-white/10",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}