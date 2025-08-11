import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, LineChart, Legend
} from "recharts";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Button from "./ui/Button";

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
    try { const j = await res.json(); msg = j.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}
const numberFmt = (n) => new Intl.NumberFormat().format(n);

function downloadCSV(filename, rows) {
  const csv = rows.map(r =>
    r.map(c => {
      const s = String(c ?? "");
      return (s.includes(",") || s.includes("\"") || s.includes("\n")) ? '"' + s.replaceAll('"','""') + '"' : s;
    }).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ----- App -----
export default function Dashboard() {
  const [tab, setTab] = useState("availability");
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Parking & Forecast Dashboard</h1>
            <p className="text-slate-300">Use live sensors to find available parking by street or coordinates, and forecast population/vehicle counts by year.</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="w-full">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 shadow-sm">
            <button
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "availability" ? "bg-slate-900 text-white shadow-sm" : "text-slate-200 hover:bg-white/5"}`}
              onClick={() => setTab("availability")}
            >Availability</button>
            <button
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "predict" ? "bg-slate-900 text-white shadow-sm" : "text-slate-200 hover:bg-white/5"}`}
              onClick={() => setTab("predict")}
            >Prediction</button>
          </div>
        </div>

        {tab === "availability" ? <AvailabilityPanel /> : <PredictionPanel />}
      </div>
    </div>
  );
}

// ----- Availability Panel -----
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
    setError(""); setLoading(true); setData(null);
    try {
      const body = mode === "suburb" ? { suburb: suburb.trim() } : { lat: parseFloat(lat), lng: parseFloat(lng) };
      const res = await postJSON("/available-parking", body);
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  function onReset() { setSuburb(""); setLat(""); setLng(""); setData(null); setError(""); }
  function useMyLocation() {
    if (!navigator.geolocation) return setError("Geolocation not supported by your browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMode("coords"); setLat(String(pos.coords.latitude.toFixed(6))); setLng(String(pos.coords.longitude.toFixed(6))); },
      (err) => setError(err.message || "Failed to get location")
    );
  }

  const availabilityRate = useMemo(() => {
    if (!data) return 0;
    const t = data.total_spots || 0, a = data.available_spots || 0;
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
          <p className="text-sm text-slate-300">Choose a method and search within ~2km (radius fixed on backend).</p>
        </div>

        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-sm font-medium">Mode</label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="amode" value="suburb" checked={mode === "suburb"} onChange={() => setMode("suburb")} />
                <span>Street keyword</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="amode" value="coords" checked={mode === "coords"} onChange={() => setMode("coords")} />
                <span>Coordinates</span>
              </label>
            </div>
          </div>

          {mode === "suburb" ? (
            <div className="md:col-span-6">
              <label className="mb-1 block text-sm font-medium" htmlFor="suburb">Street keyword</label>
              <Input id="suburb" placeholder="e.g., Collins, Swanston" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="lat">Latitude</label>
                <Input id="lat" placeholder="-37.8136" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="lng">Longitude</label>
                <Input id="lng" placeholder="144.9631" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
              <div className="md:col-span-4 flex items-end">
                <Button variant="ghost" onClick={useMyLocation} className="w-full md:w-auto">Use my location</Button>
              </div>
            </>
          )}

          <div className="md:col-span-12 flex items-end gap-3">
            <Button disabled={!canSearch || loading} onClick={onSearch}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="ghost" onClick={onReset}>Clear</Button>
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
            <div className="text-sm text-slate-300">Total Spots</div>
            <div className="mt-1 text-3xl font-semibold text-white">{numberFmt(data.total_spots ?? 0)}</div>
          </Card>
          <Card className="md:col-span-4">
            <div className="text-sm text-slate-300">Available Now</div>
            <div className="mt-1 text-3xl font-semibold text-white">{numberFmt(data.available_spots ?? 0)}</div>
          </Card>
          <Card className="md:col-span-4">
            <div className="text-sm text-slate-300">Availability Rate</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-white">{availabilityRate.toFixed(1)}%</span>
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
      <Button variant="ghost" onClick={exportDistributionCSV} className="px-3 py-1.5 text-xs">
        Export CSV
      </Button>
    )}
  </div>

  {/* Plot wrapper: keep rounded corners, no background fill here */}
  <div className="h-[360px] rounded-xl overflow-hidden">
    {hasRows ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.distribution || []}
          margin={{ top: 16, right: 24, left: 0, bottom: 32 }}
          barCategoryGap={18}
          barGap={6}
        >
          {/* Gradients for bars only (no plot-area background) */}
          <defs>
            {/* Available bars (green -> blue) */}
            <linearGradient id="barAvail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#34d399" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            {/* Total bars (light gray -> slate) */}
            <linearGradient id="barTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Transparent plot area: keep subtle grid lines only */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.15)"
            vertical={false}
            // no "fill" here → plot area stays transparent
          />

          <XAxis
            dataKey="street"
            angle={-20}
            textAnchor="end"
            height={60}
            interval={0}
            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={numberFmt}
            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => numberFmt(v)}
            contentStyle={{
              background: "rgba(15,23,42,.9)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 12,
              color: "#e5e7eb",
            }}
          />
          <Legend />

          {/* Rounded bars with gradients */}
          <Bar dataKey="available_spots" name="Available" fill="url(#barAvail)" radius={[6,6,0,0]} />
          <Bar dataKey="total_spots"      name="Total"     fill="url(#barTotal)" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-slate-300">
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
              <div className="text-sm text-slate-300">No data.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ----- Prediction Panel -----
console.log('Prediction mounted');
function PredictionPanel() {
  const [mode, setMode] = useState("single"); // single | list | range
  const [year, setYear] = useState("2028");
  const [yearsList, setYearsList] = useState("2025, 2028, 2030");
  const [start, setStart] = useState("2025");
  const [end, setEnd] = useState("2030");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const toInt = (s) => Number.parseInt(String(s).trim(), 10);
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

  async function onRun() {
    setError(""); setLoading(true); setResult(null);
    try {
      let body;
      if (mode === "single") body = { year: toInt(year) };
      else if (mode === "list") body = { years: yearsList.split(",").map((s) => toInt(s)).filter((n) => Number.isFinite(n)) };
      else body = { start: toInt(start), end: toInt(end) };
      const res = await postJSON("/predict", body);
      setResult(res);
    } catch (e) { setError(e.message || "Prediction failed"); }
    finally { setLoading(false); }
  }
  function onReset() { setYear("2028"); setYearsList("2025, 2028, 2030"); setStart("2025"); setEnd("2030"); setResult(null); setError(""); }

  const lines = useMemo(() => {
    return (result?.items || [])
      .map((d) => ({ Year: d.Year, PredictedPopulation: Number(d.PredictedPopulation) || 0, PredictedVehicles: Number(d.PredictedVehicles) || 0 }))
      .sort((a, b) => a.Year - b.Year);
  }, [result]);

  function exportItemsCSV() {
    const rows = [["Year", "PredictedPopulation", "PredictedVehicles"]];
    (result?.items || []).sort((a,b) => a.Year - b.Year).forEach((r) => rows.push([r.Year, r.PredictedPopulation, r.PredictedVehicles]));
    downloadCSV("prediction_items.csv", rows);
  }

  return (
    <div className="grid gap-6">
      {/* Controls */}
      <Card>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Predict Population & Vehicles</h2>
          <p className="text-sm text-slate-300">Choose an input mode below. Valid years: 2000–2100.</p>
        </div>

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

        <div className="mt-4 grid gap-3 md:grid-cols-12">
          {mode === "single" && (
            <div className="md:col-span-3">
              <label htmlFor="year" className="mb-1 block text-sm font-medium">Year</label>
              <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2028" />
            </div>
          )}
          {mode === "list" && (
            <div className="md:col-span-6">
              <label htmlFor="yearsList" className="mb-1 block text-sm font-medium">Years (comma separated)</label>
              <Input id="yearsList" value={yearsList} onChange={(e) => setYearsList(e.target.value)} placeholder="e.g., 2025, 2028, 2030" />
            </div>
          )}
          {mode === "range" && (
            <>
              <div className="md:col-span-3">
                <label htmlFor="start" className="mb-1 block text-sm font-medium">Start</label>
                <Input id="start" value={start} onChange={(e) => setStart(e.target.value)} placeholder="e.g., 2025" />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="end" className="mb-1 block text-sm font-medium">End</label>
                <Input id="end" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="e.g., 2030" />
              </div>
            </>
          )}

          <div className="md:col-span-12 flex items-center gap-3">
            <Button disabled={!canRun || loading}>{loading ? "Predicting..." : "Run prediction"}</Button>
            <Button variant="ghost" onClick={onReset}>Clear</Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            <div className="font-semibold">Prediction failed</div>
            <div>{error}</div>
          </div>
        )}
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* KPI */}
          <Card className="md:col-span-3">
            <div className="text-sm text-slate-300">Avg Vehicles / Person</div>
            <div className="mt-1 text-3xl font-semibold text-white">{(result.avgVehiclePerPerson ?? 0).toFixed(2)}</div>
          </Card>

          {/* Chart */}
          <Card className="md:col-span-9">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Forecast</div>
              {(result?.items || []).length > 0 && (
                <Button variant="ghost" onClick={exportItemsCSV} className="px-3 py-1.5 text-xs">Export CSV</Button>
              )}
            </div>
            <div className="h-[360px]">
              {(result?.items || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lines} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                    <XAxis dataKey="Year" tickMargin={8} />
                    <YAxis tickFormatter={numberFmt} allowDecimals={false} />
                    <Tooltip formatter={(val) => numberFmt(val)} labelFormatter={(l) => `Year: ${l}`} />
                    <Legend />
                    <Line type="monotone" dataKey="PredictedPopulation" name="Population" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="PredictedVehicles"   name="Vehicles"   dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-300">No forecast items.</div>
              )}
            </div>
          </Card>

          {/* Table */}
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
                    {(result.items || []).sort((a,b) => a.Year - b.Year).map((row, i) => (
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
              <div className="text-sm text-slate-300">No data.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
