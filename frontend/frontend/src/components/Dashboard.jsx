// src/components/Dashboard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, Legend, Brush } from "recharts";


// your UI atoms
import { useNavigate } from "react-router-dom"; 
import Card from "./UI/Card";
import Button from "./UI/Button";
import Input from "./UI/Input";

// ----- Config -----
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// ----- Utils -----
async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

const numberFmt = (n) => new Intl.NumberFormat().format(n);

// CSV helper
function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return '"' + s.replaceAll('"', '""') + '"';
          }
          return s;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ====== App root ======
export default function Dashboard() {

  const goBack = () => {
    const before = window.location.href;
    // 1) try native back
    window.history.back();
    // 2) fallback: still same URL? go home
    setTimeout(() => {
      if (window.location.href === before) {
        window.location.assign("/"); 
      }
    }, 150);
  };

  const [tab, setTab] = useState("availability"); // "availability" | "predict"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parking & Forecast Dashboard</h1>
            <p className="text-slate-400">
              Use live sensors to find available parking by street or coordinates, and forecast population/vehicle counts by year.
            </p>
          </div>

          {/* Back button: native back + hard redirect fallback */}
          <div className="mt-2 md:mt-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm"
            >
              ← Back to Home
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="w-full">
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 shadow-sm">
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === "availability" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
              onClick={() => setTab("availability")}
            >
              Availability
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === "predict" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
              onClick={() => setTab("predict")}
            >
              Prediction
            </button>
          </div>
        </div>

        {tab === "availability" ? <AvailabilityPanel /> : <PredictionPanel />}
      </div>
    </div>
  );
}




// ====== Availability Panel (unchanged logic; polished UI) ======
// shorten long street names for ticks
const shortStreet = (s) => {
  if (!s) return "";
  // remove common suffixes to save space
  const trimmed = s.replace(/\b(Street|St|Road|Rd|Lane|Ln|Drive|Dr|Avenue|Ave)\b\.?/gi, "").trim();
  const label = trimmed || s;
  return label.length > 12 ? label.slice(0, 12) + "…" : label;
};

function AvailabilityPanel() {
  const [mode, setMode] = useState("suburb"); // suburb | coords
  const [suburb, setSuburb] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const canSearch = useMemo(() => {
    if (mode === "suburb") return suburb.trim().length > 0;
    const latOk = /^-?\d+(\.\d+)?$/.test(lat);
    const lngOk = /^-?\d+(\.\d+)?$/.test(lng);
    return latOk && lngOk;
  }, [mode, suburb, lat, lng]);

  async function onSearch() {
    setError("");
    setLoading(true);
    setData(null);
    try {
      const body = mode === "suburb" ? { suburb: suburb.trim() } : { lat: parseFloat(lat), lng: parseFloat(lng) };
      const res = await postJSON("/available-parking", body);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setSuburb("");
    setLat("");
    setLng("");
    setData(null);
    setError("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMode("coords");
        setLat(String(pos.coords.latitude.toFixed(6)));
        setLng(String(pos.coords.longitude.toFixed(6)));
      },
      (err) => setError(err.message || "Failed to get location")
    );
  }

  const availabilityRate = useMemo(() => {
    if (!data) return 0;
    const t = data.total_spots || 0;
    const a = data.available_spots || 0;
    return t > 0 ? (a / t) * 100 : 0;
  }, [data]);

  const hasRows = (data?.distribution || []).length > 0;

  function exportDistributionCSV() {
    const rows = [["street", "total_spots", "available_spots"]];
    (data?.distribution || []).forEach((r) => rows.push([r.street, r.total_spots, r.available_spots]));
    downloadCSV("parking_distribution.csv", rows);
  }

  return (
    <div className="grid gap-6">
      {/* Search Card */}
      <Card>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Search Availability</h2>
          <p className="text-sm text-slate-400">Choose a method and search within ~2km (radius fixed on backend).</p>
        </div>

        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-sm font-medium">Mode</label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="amode" value="suburb" checked={mode === "suburb"} onChange={() => setMode("suburb")} />
                <span>Street keyword</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="amode" value="coords" checked={mode === "coords"} onChange={() => setMode("coords")} />
                <span>Coordinates</span>
              </label>
            </div>
          </div>

          {mode === "suburb" ? (
            <div className="md:col-span-6">
              <label className="mb-1 block text-sm font-medium" htmlFor="suburb">
                Street keyword
              </label>
              <Input
                id="suburb"
                placeholder="e.g., Collins, Swanston"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="lat">
                  Latitude
                </label>
                <Input id="lat" placeholder="-37.8136" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="lng">
                  Longitude
                </label>
                <Input id="lng" placeholder="144.9631" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
              <div className="md:col-span-4 flex items-end">
                <Button onClick={useMyLocation} className="w-full md:w-auto">
                  Use my location
                </Button>
              </div>
            </>
          )}

          <div className="md:col-span-12 flex items-end gap-3">
            <Button disabled={!canSearch || loading} onClick={onSearch}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Clear
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            <div className="font-semibold">Request failed</div>
            <div>{error}</div>
          </div>
        )}
      </Card>

      {data && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* KPIs */}
          <Card className="md:col-span-4">
            <div className="text-sm text-slate-400">Total Spots</div>
            <div className="mt-1 text-3xl font-semibold">{numberFmt(data.total_spots ?? 0)}</div>
          </Card>
          <Card className="md:col-span-4">
            <div className="text-sm text-slate-400">Available Now</div>
            <div className="mt-1 text-3xl font-semibold">{numberFmt(data.available_spots ?? 0)}</div>
          </Card>
          <Card className="md:col-span-4">
            <div className="text-sm text-slate-400">Availability Rate</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{availabilityRate.toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, availabilityRate))}%` }} />
            </div>
          </Card>

          {/* Chart */}
<Card className="md:col-span-12">
  <div className="mb-2 flex items-center justify-between">
    <div className="text-lg font-semibold">By Street</div>
    {hasRows && (
      <Button
        variant="ghost"
        onClick={exportDistributionCSV}
        className="px-3 py-1.5 text-xs"
      >
        Export CSV
      </Button>
    )}
  </div>

  <div className="h-[360px]">
    {hasRows ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.distribution || []}
          margin={{ top: 10, right: 20, left: 0, bottom: 80 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />

          {/* smart skipping + shorter labels */}
          <XAxis
            dataKey="street"
            height={80}
            angle={-35}
            textAnchor="end"
            interval="preserveStartEnd"
            tickFormatter={shortStreet}
            tick={{ fontSize: 11 }}
          />

          <YAxis tickFormatter={numberFmt} />

          <Tooltip
            formatter={(v) => numberFmt(v)}
            labelFormatter={(l) => l}
            contentStyle={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend wrapperStyle={{ color: "#cbd5e1" }} />

          {/* gradients for bar colors */}
          <defs>
            {/* Available: green */}
            <linearGradient id="gradAvailable" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="rgba(16,185,129,0.95)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.55)" />
            </linearGradient>
            {/* Total: slate/gray */}
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="rgba(203,213,225,0.85)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.55)" />
            </linearGradient>
          </defs>

          {/* draw Total first, then Available to keep green in front */}
          <Bar
            dataKey="total_spots"
            name="Total"
            fill="url(#gradTotal)"
            radius={[4, 4, 0, 0]}
            barSize={12}
          />
          <Bar
            dataKey="available_spots"
            name="Available"
            fill="url(#gradAvailable)"
            radius={[4, 4, 0, 0]}
            barSize={12}
          />

          {/* allow horizontal pan/zoom when many streets */}
          <Brush
            dataKey="street"
            height={24}
            stroke="rgba(255,255,255,0.25)"
            fill="rgba(255,255,255,0.05)"
            travellerWidth={10}
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No streets returned for this query.
      </div>
    )}
  </div>
</Card>


          {/* Table */}
          <Card className="md:col-span-12">
            <div className="mb-2 text-lg font-semibold">Table</div>
            {hasRows ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-left">
                      <th className="p-2">Street</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Available</th>
                      <th className="p-2">Availability %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.distribution || []).map((row, idx) => {
                      const pct = row.total_spots > 0 ? (row.available_spots / row.total_spots) * 100 : 0;
                      return (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="p-2">{row.street}</td>
                          <td className="p-2">{numberFmt(row.total_spots)}</td>
                          <td className="p-2">{numberFmt(row.available_spots)}</td>
                          <td className="p-2">{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-400">No data.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ====== Prediction Panel (single Y axis + view modes) ======
function PredictionPanel() {
  const [mode, setMode] = useState("single"); // single | list | range
  const [year, setYear] = useState("2028");
  const [yearsList, setYearsList] = useState("2025, 2028, 2030");
  const [start, setStart] = useState("2025");
  const [end, setEnd] = useState("2030");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // view mode for better contrast
  const [viewMode, setViewMode] = useState("abs"); // 'abs' | 'index' | 'yoy'

  useEffect(() => {
    console.log("[Prediction] mounted");
    const apiBase = import.meta.env.VITE_API_BASE || "/api";
    console.log("[Prediction] effective API base =", apiBase);
  }, []);

  const toInt = (s) => Number.parseInt(String(s).trim(), 10);

  // enable Run only when inputs are valid
  const canRun = useMemo(() => {
    if (mode === "single") {
      const y = toInt(year);
      return Number.isFinite(y) && y >= 2000 && y <= 2100;
    }
    if (mode === "list") {
      const list = yearsList.split(",").map((s) => toInt(s));
      return list.length > 0 && list.every((y) => Number.isFinite(y) && y >= 2000 && y <= 2100);
    }
    const s = toInt(start), e = toInt(end);
    return Number.isFinite(s) && Number.isFinite(e) && s >= 2000 && e <= 2100 && s <= e;
  }, [mode, year, yearsList, start, end]);

  // call backend
  async function onRun() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      let body;
      if (mode === "single") {
        body = { year: Number.parseInt(year, 10) };
      } else if (mode === "list") {
        body = {
          years: yearsList
            .split(",")
            .map((s) => Number.parseInt(s.trim(), 10))
            .filter(Number.isFinite),
        };
      } else {
        body = { start: Number.parseInt(start, 10), end: Number.parseInt(end, 10) };
      }

      console.log("[Prediction] POST /predict body =", body);
      const res = await postJSON("/predict", body);
      console.log("[Prediction] result =", res);
      setResult(res);
    } catch (e) {
      console.error("[Prediction] error:", e);
      setError(e?.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setYear("2028");
    setYearsList("2025, 2028, 2030");
    setStart("2025");
    setEnd("2030");
    setResult(null);
    setError("");
  }

  // normalize to numeric + sort
  const lines = useMemo(
    () =>
      (result?.items || [])
        .map((d) => ({
          Year: d.Year,
          PredictedPopulation: Number(d.PredictedPopulation) || 0,
          PredictedVehicles: Number(d.PredictedVehicles) || 0,
        }))
        .sort((a, b) => a.Year - b.Year),
    [result]
  );

  // transform for view modes
  const chartData = useMemo(() => {
    if (!lines.length) return [];

    if (viewMode === "abs") return lines;

    if (viewMode === "index") {
      const basePop = lines[0].PredictedPopulation || 1;
      const baseVeh = lines[0].PredictedVehicles || 1;
      return lines.map((d) => ({
        ...d,
        PredictedPopulation: (d.PredictedPopulation / basePop) * 100,
        PredictedVehicles: (d.PredictedVehicles / baseVeh) * 100,
      }));
    }

    if (viewMode === "yoy") {
      return lines.map((d, i) => {
        if (i === 0) return { ...d, PredictedPopulation: 0, PredictedVehicles: 0 };
        const prev = lines[i - 1];
        return {
          ...d,
          PredictedPopulation:
            ((d.PredictedPopulation / (prev.PredictedPopulation || 1)) - 1) * 100,
          PredictedVehicles:
            ((d.PredictedVehicles / (prev.PredictedVehicles || 1)) - 1) * 100,
        };
      });
    }

    return lines;
  }, [lines, viewMode]);

  // formatters switch with view mode
  const yTickFmt = useMemo(
    () =>
      viewMode === "abs"
        ? (v) =>
            new Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(v)
        : (v) => `${v.toFixed(1)}%`,
    [viewMode]
  );

  const tooltipFmt = useMemo(
    () => (viewMode === "abs" ? (val) => numberFmt(val) : (val) => `${Number(val).toFixed(2)}%`),
    [viewMode]
  );

  function exportItemsCSV() {
    const rows = [["Year", "PredictedPopulation", "PredictedVehicles"]];
    (result?.items || [])
      .sort((a, b) => a.Year - b.Year)
      .forEach((r) => rows.push([r.Year, r.PredictedPopulation, r.PredictedVehicles]));
    downloadCSV("prediction_items.csv", rows);
  }

  return (
    <div className="grid gap-6">
      {/* Controls */}
      <Card>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Predict Population & Vehicles</h2>
          <p className="text-sm text-slate-400">Choose an input mode below. Valid years: 2000–2100.</p>
        </div>

        {/* mode selector */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="pmode" value="single" checked={mode === "single"} onChange={() => setMode("single")} />
            <span>Single year</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pmode" value="list" checked={mode === "list"} onChange={() => setMode("list")} />
            <span>List of years</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pmode" value="range" checked={mode === "range"} onChange={() => setMode("range")} />
            <span>Range (start-end)</span>
          </label>
        </div>

        {/* inputs */}
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          {mode === "single" && (
            <div className="md:col-span-3">
              <label htmlFor="year" className="mb-1 block text-sm font-medium">
                Year
              </label>
              <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2028" />
            </div>
          )}
          {mode === "list" && (
            <div className="md:col-span-6">
              <label htmlFor="yearsList" className="mb-1 block text-sm font-medium">
                Years (comma separated)
              </label>
              <Input
                id="yearsList"
                value={yearsList}
                onChange={(e) => setYearsList(e.target.value)}
                placeholder="e.g., 2025, 2028, 2030"
              />
            </div>
          )}
          {mode === "range" && (
            <>
              <div className="md:col-span-3">
                <label htmlFor="start" className="mb-1 block text-sm font-medium">
                  Start
                </label>
                <Input id="start" value={start} onChange={(e) => setStart(e.target.value)} placeholder="e.g., 2025" />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="end" className="mb-1 block text-sm font-medium">
                  End
                </label>
                <Input id="end" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="e.g., 2030" />
              </div>
            </>
          )}

          {/* actions */}
          <div className="md:col-span-12 flex items-center gap-3">
            <Button disabled={!canRun || loading} onClick={onRun}>
              {loading ? "Predicting..." : "Run prediction"}
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Clear
            </Button>
          </div>
        </div>

        {/* error banner */}
        {error && (
          <div className="mt-4 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            <div className="font-semibold">Prediction failed</div>
            <div>{error}</div>
          </div>
        )}
      </Card>

      {/* results */}
      {result && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* KPI */}
          <Card className="md:col-span-3">
            <div className="text-sm text-slate-400">Avg Vehicles / Person</div>
            <div className="mt-1 text-3xl font-semibold">
              {(result.avgVehiclePerPerson ?? 0).toFixed(2)}
            </div>
          </Card>

          {/* Forecast chart: one shared Y axis + view mode */}
          <Card className="md:col-span-9">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Forecast</div>
              <div className="flex items-center gap-2">
                {/* view mode toggle */}
                <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
                  <button
                    className={`px-3 py-1.5 text-xs rounded-md ${viewMode === "abs" ? "bg-white/10" : ""}`}
                    onClick={() => setViewMode("abs")}
                  >
                    Absolute
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs rounded-md ${viewMode === "index" ? "bg-white/10" : ""}`}
                    onClick={() => setViewMode("index")}
                  >
                    Indexed (=100)
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs rounded-md ${viewMode === "yoy" ? "bg-white/10" : ""}`}
                    onClick={() => setViewMode("yoy")}
                  >
                    YoY %
                  </button>
                </div>

                {(result?.items || []).length > 0 && (
                  <Button variant="ghost" onClick={exportItemsCSV} className="px-3 py-1.5 text-xs">
                    Export CSV
                  </Button>
                )}
              </div>
            </div>

            <div className="h-[360px] overflow-visible">
              {(result?.items || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 48, left: 88, bottom: 20 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
                    <XAxis dataKey="Year" tickMargin={10} />
                    <YAxis yAxisId="left" width={84} tickFormatter={yTickFmt} domain={["auto", "auto"]} />
                    <Tooltip
                      formatter={tooltipFmt}
                      labelFormatter={(l) => `Year: ${l}`}
                      contentStyle={{
                        background: "rgba(15,23,42,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend wrapperStyle={{ color: "#cbd5e1" }} />

                    {/* both series share the same Y axis */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="PredictedPopulation"
                      name="Population"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 2, strokeWidth: 0 }}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="PredictedVehicles"
                      name="Vehicles"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 2, strokeWidth: 0 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No forecast items.
                </div>
              )}
            </div>
          </Card>

          {/* Raw table */}
          <Card className="md:col-span-12">
            <div className="mb-2 text-lg font-semibold">Raw Items</div>
            {(result?.items || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-left">
                      <th className="p-2">Year</th>
                      <th className="p-2">PredictedPopulation</th>
                      <th className="p-2">PredictedVehicles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.items || [])
                      .sort((a, b) => a.Year - b.Year)
                      .map((row, i) => (
                        <tr key={i} className="border-b border-white/10">
                          <td className="p-2">{row.Year}</td>
                          <td className="p-2">{numberFmt(row.PredictedPopulation)}</td>
                          <td className="p-2">{numberFmt(row.PredictedVehicles)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-400">No data.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

