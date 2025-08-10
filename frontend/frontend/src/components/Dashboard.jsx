import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from "recharts";

// ----- Config -----
// 
const API_BASE = "/api"; // same-origin by default

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

function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
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

// ----- App -----
export default function Dashboard() {
  const [tab, setTab] = useState("availability");

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parking & Forecast Dashboard</h1>
            <p className="text-slate-600">
              Use live sensors to find available parking by street or coordinates, and forecast population/vehicle counts by year.
            </p>
          </div>
        </header>

        {/* Tabs */}
        <div className="w-full">
          <div className="inline-flex rounded-lg border bg-white p-1 shadow-sm">
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "availability" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setTab("availability")}
            >
              Availability
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "predict" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
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

// ----- Availability Panel (POST /available-parking) -----
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
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Search Availability</h2>
          <p className="text-sm text-slate-600">Choose a method and search within ~2km (radius fixed on backend).</p>
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
              <label className="mb-1 block text-sm font-medium" htmlFor="suburb">
                Street keyword
              </label>
              <input
                id="suburb"
                className="w-full rounded-md border px-3 py-2"
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
                <input id="lat" className="w-full rounded-md border px-3 py-2" placeholder="-37.8136" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium" htmlFor="lng">
                  Longitude
                </label>
                <input id="lng" className="w-full rounded-md border px-3 py-2" placeholder="144.9631" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
              <div className="md:col-span-4 flex items-end">
                <button onClick={useMyLocation} className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 w-full md:w-auto">
                  Use my location
                </button>
              </div>
            </>
          )}

          <div className="md:col-span-12 flex items-end gap-3">
            <button
              disabled={!canSearch || loading}
              onClick={onSearch}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${!canSearch || loading ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"}`}
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <button onClick={onReset} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-slate-700 border hover:bg-slate-100">
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-semibold">Request failed</div>
            <div>{error}</div>
          </div>
        )}
      </div>

      {data && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* KPIs */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-4">
            <div className="text-sm text-slate-600">Total Spots</div>
            <div className="mt-1 text-3xl font-semibold">{numberFmt(data.total_spots ?? 0)}</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-4">
            <div className="text-sm text-slate-600">Available Now</div>
            <div className="mt-1 text-3xl font-semibold">{numberFmt(data.available_spots ?? 0)}</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-4">
            <div className="text-sm text-slate-600">Availability Rate</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{availabilityRate.toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, availabilityRate))}%` }} />
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-12">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">By Street</div>
              {hasRows && (
                <button onClick={exportDistributionCSV} className="rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  Export CSV
                </button>
              )}
            </div>
            <div className="h-[360px]">
              {hasRows ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distribution || []} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="street" angle={-20} textAnchor="end" height={60} interval={0} />
                    <YAxis />
                    <Tooltip formatter={(v) => numberFmt(v)} />
                    <Legend />
                    <Bar dataKey="total_spots" name="Total" />
                    <Bar dataKey="available_spots" name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">No streets returned for this query.</div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-12">
            <div className="mb-2 text-lg font-semibold">Table</div>
            {hasRows ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
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
                        <tr key={idx} className="border-b">
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
              <div className="text-sm text-slate-500">No data.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Prediction Panel (POST /predict) -----
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
    setError("");
    setLoading(true);
    setResult(null);
    try {
      let body;
      if (mode === "single") body = { year: toInt(year) };
      else if (mode === "list") {
        const arr = yearsList
          .split(",")
          .map((s) => toInt(s))
          .filter((n) => Number.isFinite(n));
        body = { years: arr };
      } else {
        body = { start: toInt(start), end: toInt(end) };
      }
      const res = await postJSON("/predict", body);
      setResult(res);
    } catch (e) {
      setError(e.message);
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

  const lines = useMemo(
    () => (result?.items || [])
      .map((d) => ({ Year: d.Year, PredictedPopulation: d.PredictedPopulation, PredictedVehicles: d.PredictedVehicles }))
      .sort((a, b) => a.Year - b.Year),
    [result]
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
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Predict Population & Vehicles</h2>
          <p className="text-sm text-slate-600">Choose an input mode below. Valid years: 2000-2100.</p>
        </div>

        {/* Mode selector: radio group */}
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

        {/* Inputs */}
        <div className="mt-4 grid gap-3 md:grid-cols-12">
          {mode === "single" && (
            <div className="md:col-span-3">
              <label htmlFor="year" className="mb-1 block text-sm font-medium">
                Year
              </label>
              <input id="year" className="w-full rounded-md border px-3 py-2" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2028" />
            </div>
          )}

          {mode === "list" && (
            <div className="md:col-span-6">
              <label htmlFor="yearsList" className="mb-1 block text-sm font-medium">
                Years (comma separated)
              </label>
              <input id="yearsList" className="w-full rounded-md border px-3 py-2" value={yearsList} onChange={(e) => setYearsList(e.target.value)} placeholder="e.g., 2025, 2028, 2030" />
            </div>
          )}

          {mode === "range" && (
            <>
              <div className="md:col-span-3">
                <label htmlFor="start" className="mb-1 block text-sm font-medium">
                  Start
                </label>
                <input id="start" className="w-full rounded-md border px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} placeholder="e.g., 2025" />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="end" className="mb-1 block text-sm font-medium">
                  End
                </label>
                <input id="end" className="w-full rounded-md border px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="e.g., 2030" />
              </div>
            </>
          )}

          <div className="md:col-span-12 flex items-center gap-3">
            <button
              disabled={!canRun || loading}
              onClick={onRun}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${!canRun || loading ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"}`}
            >
              {loading ? "Predicting..." : "Run prediction"}
            </button>
            <button onClick={onReset} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-slate-700 border hover:bg-slate-100">
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-semibold">Prediction failed</div>
            <div>{error}</div>
          </div>
        )}
      </div>

      {result && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* KPI */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-3">
            <div className="text-sm text-slate-600">Avg Vehicles / Person</div>
            <div className="mt-1 text-3xl font-semibold">{(result.avgVehiclePerPerson ?? 0).toFixed(2)}</div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-9">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Forecast</div>
              {(result?.items || []).length > 0 && (
                <button onClick={exportItemsCSV} className="rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  Export CSV
                </button>
              )}
            </div>
            <div className="h-[360px]">
              {(result?.items || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lines} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Year" />
                    <YAxis />
                    <Tooltip formatter={(v) => numberFmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="PredictedPopulation" name="Population" dot={false} />
                    <Line type="monotone" dataKey="PredictedVehicles" name="Vehicles" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">No forecast items.</div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-12">
            <div className="mb-2 text-lg font-semibold">Raw Items</div>
            {(result?.items || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="p-2">Year</th>
                      <th className="p-2">PredictedPopulation</th>
                      <th className="p-2">PredictedVehicles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.items || []).sort((a, b) => a.Year - b.Year).map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{row.Year}</td>
                        <td className="p-2">{numberFmt(row.PredictedPopulation)}</td>
                        <td className="p-2">{numberFmt(row.PredictedVehicles)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No data.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
