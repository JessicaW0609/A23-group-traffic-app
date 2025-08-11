import React, { useState } from "react";
import Navbar from "./components/Navbar";
import LandingHero from "./components/LandingHero";
import MarketingSections from "./components/MarketingSections";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="min-h-screen relative text-slate-100">
      {!showDashboard ? (
        <>
          <Navbar onGetStarted={() => setShowDashboard(true)} />
          <LandingHero onPrimary={() => setShowDashboard(true)} />
          <MarketingSections onCTA={() => setShowDashboard(true)} />
        </>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

