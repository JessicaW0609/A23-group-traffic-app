import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Minimal lookup so you see it working immediately. Add more as needed.
const COORDS = {
  "Collins Street":        [-37.8153, 144.9640],
  "Little Collins Street": [-37.8159, 144.9632],
  "Swanston Street":       [-37.8139, 144.9634],
  "Bourke Street":         [-37.8148, 144.9645],
  "Elizabeth Street":      [-37.8156, 144.9639],
  "Exhibition Street":     [-37.8136, 144.9716],
  "King Street":           [-37.8187, 144.9567],
  "Queen Street":          [-37.8158, 144.9601],
  "Harbour Esplanade":     [-37.8142, 144.9440],
  "Russell Street":        [-37.8136, 144.9685],
  "Merchant Street":       [-37.8202, 144.9489],
  "Adela Lane":            [-37.8197, 144.9499],
  "Aurora Lane":           [-37.8207, 144.9510],
  "Batmans Hill Drive":    [-37.8209, 144.9518],
  "Church Street":         [-37.8124, 144.9921],
  "Georgiana Street":      [-37.8148, 144.9404],
  "Karlsruhe Lane":        [-37.8174, 144.9602],
  "Import Lane":           [-37.8205, 144.9534],
};

function FitToMarkers({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const b = L.latLngBounds(points);
    if (b.isValid()) map.fitBounds(b.pad(0.2));
  }, [points, map]);
  return null;
}

// Colour by absolute available spots. Adjust thresholds to your data.
function colourForAvail(a) {
  if (a >= 15) return "#22c55e"; // green = lots available
  if (a >= 5) return "#eab308"; // amber = medium
  return "#ef4444";              // red = low
}

// A marker rendered as a coloured circle with a number inside.
function NumberBubbleMarker({ position, colour, number, size = 28, popup }) {
  const text = number > 99 ? "99+" : String(number);
  const font = Math.max(10, Math.min(16, size * 0.45));
  const icon = useMemo(() => L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${colour};opacity:0.9;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:700;font-size:${font}px;
        box-shadow:0 0 0 2px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.25);
      ">${text}</div>`,
    iconAnchor: [size / 2, size / 2],
  }), [colour, size, font, text]);

  return (
    <Marker position={position} icon={icon}>
      {popup}
    </Marker>
  );
}

export default function StreetAvailabilityMap({ results = [] }) {
  // results: [{ street, total_spots, available_spots }]
  const items = useMemo(() => (
    (results || [])
      .map(r => {
        const name = r.street;
        const latlng = COORDS[name];
        const total = Number(r.total_spots) || 0;
        const avail = Number(r.available_spots) || 0;
        const pct = total > 0 ? avail / total : 0;
        return latlng ? { name, latlng, total, avail, pct } : null;
      })
      .filter(Boolean)
  ), [results]);

  const points = items.map(i => i.latlng);
  const center = points[0] || [-37.8136, 144.9631]; // Melbourne CBD fallback

  return (
    <div style={{ height: 480, borderRadius: 16, overflow: "hidden" }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%" }}>
        {/* Light, faded basemap */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          opacity={0.75}
        />
        {items.map(it => {
          const size = Math.max(26, Math.min(40, 24 + (it.total / 12))); // scale by total
          const colour = colourForAvail(it.avail);
          return (
            <NumberBubbleMarker
              key={it.name}
              position={it.latlng}
              colour={colour}
              number={it.avail}
              size={size}
              popup={
                <Popup>
                  <strong>{it.name}</strong><br/>
                  Available: {it.avail} / {it.total} ({(it.pct * 100).toFixed(1)}%)
                </Popup>
              }
            />
          );
        })}
        <FitToMarkers points={points} />
      </MapContainer>
    </div>
  );
}