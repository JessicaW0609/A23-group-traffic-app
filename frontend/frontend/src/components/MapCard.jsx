// src/components/MapCard.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

/** Recalculate map size after mount / tab switch / resize */
function MapReadyFix() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    requestAnimationFrame(fix);
    const t = setTimeout(fix, 200);
    window.addEventListener('resize', fix);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', fix);
    };
  }, [map]);
  return null;
}

/** High-contrast heat overlay with zoom-adaptive radius */
function HeatLayer({ points = [], options = {} }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Put heat on a dedicated pane so it draws above tiles
    if (!map.getPane('heatmap')) {
      const pane = map.createPane('heatmap');
      pane.style.zIndex = 450;          // tilePane≈200, overlayPane≈400, markerPane≈600
      pane.style.mixBlendMode = 'screen';
    }

    // Normalize & boost intensities (push center toward red)
    const vals = points.map(p => p?.[2]).filter(v => Number.isFinite(v));
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 1);

    const gamma = 0.5;   // lower → higher contrast
    const gain  = 1.8;   // multiplicative boost
    const bias  = 0.12;  // additive offset

    const normalized = points.map(([lat, lng, w = 0.3]) => {
      const m = max > min ? (w - min) / (max - min) : w; // [0,1]
      const boosted = Math.min(1, Math.max(0, Math.pow(m, gamma) * gain + bias));
      return [lat, lng, boosted];
    });

    // Zoom-adaptive radius (in px)
    const baseZoom = 13;
    const base = 28;
    const radiusForZoom = (z) => Math.max(12, Math.round(base * Math.pow(1.2, z - baseZoom)));

    // Create layer
    const makeLayer = () =>
      // @ts-ignore leaflet.heat attaches to window.L
      window.L
        .heatLayer(normalized, {
          pane: 'heatmap',
          radius: radiusForZoom(map.getZoom()),
          blur: 18,
          minOpacity: 0.6,
          maxZoom: 18,
          // Earlier red threshold for stronger center
          gradient: {
            0.0: '#1e3a8a', // deep blue
            0.3: '#22d3ee', // cyan
            0.55: '#10b981', // green
            0.7: '#f59e0b',  // amber
            0.82: '#ef4444', // red
            1.0: '#991b1b',  // deep red
          },
          ...options,
        })
        .addTo(map);

    let layer = makeLayer();

    // Recreate on zoom to refresh radius
    const onZoomEnd = () => {
      layer.remove();
      layer = makeLayer();
    };
    map.on('zoomend', onZoomEnd);

    return () => {
      map.off('zoomend', onZoomEnd);
      layer.remove();
    };
  }, [map, points, options]);

  return null;
}

/** Map card + overlays */
export default function MapCard({
  center = [-37.8136, 144.9631],
  zoom = 13,
  points = [],
  legend = true,
  darkBasemap = true,
}) {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-4 md:p-5">
      {/* IMPORTANT: create a stacking context with z-0 so our overlays can out-rank Leaflet panes */}
      <div className="relative z-0 rounded-2xl overflow-hidden border border-white/10">
        {/* Fixed height so Leaflet can size its canvas */}
        <div className="h-[300px] md:h-[360px] w-full">
          <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
            {darkBasemap ? (
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              />
            ) : (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
            )}
            <MapReadyFix />
            <HeatLayer points={points} />
          </MapContainer>
        </div>

        {/* Top-right status bubble — z-index raised above Leaflet panes */}
        <div className="pointer-events-none absolute right-4 top-4 z-[2000] rounded-xl bg-black/70 text-slate-100 text-xs px-3 py-2 border border-white/10 shadow">
          <div>🕙 Live</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Availability Heat</span>
          </div>
        </div>

        {/* Bottom-left legend — z-index raised; add spacing to avoid attribution overlap */}
        {legend && (
          <div className="pointer-events-none absolute left-4 bottom-6 z-[2000] rounded-xl bg-black/70 text-slate-100 text-xs px-3 py-2 border border-white/10 shadow">
            <div className="font-medium mb-1">Parking Availability</div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> High
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Medium
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Low
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

