import React from "react";

export default function Card({ className = "", children }) {
  const base = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm hover:shadow-md transition";
  return <div className={`${base} ${className}`}>{children}</div>;
}
