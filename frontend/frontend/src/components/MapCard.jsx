// src/components/MapCard.jsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

/** （可选）仅当接口只给 name 时，用这个表映射经纬度 */
const COORDS = {
  "Collins Street": [-37.8153, 144.964],
  "Little Collins Street": [-37.8159, 144.9632],
  "Swanston Street": [-37.8139, 144.9634],
  "Bourke Street": [-37.8148, 144.9645],
  "Elizabeth Street": [-37.8156, 144.9639],
  "Exhibition Street": [-37.8136, 144.9716],
  "King Street": [-37.8187, 144.9567],
  "Queen Street": [-37.8158, 144.9601],
  "Harbour Esplanade": [-37.8142, 144.944],
  "Russell Street": [-37.8136, 144.9685],
  "Merchant Street": [-37.8202, 144.9489],
  "Adela Lane": [-37.8197, 144.9499],
  "Aurora Lane": [-37.8207, 144.951],
  "Batmans Hill Drive": [-37.8209, 144.9518],
  "Church Street": [-37.8124, 144.9921],
  "Georgiana Street": [-37.8148, 144.9404],
  "Karlsruhe Lane": [-37.8174, 144.9602],
  "Import Lane": [-37.8205, 144.9534],
};

/** 可用越少越热（更红） */
function toWeight(available, cap = 20) {
  const w = 1 - Math.min(Math.max(available ?? 0, 0), cap) / cap;
  return Math.min(Math.max(w, 0), 1);
}

/** 兼容多种后端字段（包含 OpenDataSoft v2.1 结构）→ [lat,lng,weight] */
function itemsToPoints(data, cap = 20) {
  // Opendatasoft v2.1 常见外层：{ results: [...] }
  const list = Array.isArray(data)
    ? data
    : data?.results || data?.records || data?.data || data?.rows || [];

  const out = [];

  for (const r of list) {
    // ODS 里字段通常在 r.fields，几何在 r.geometry
    const fields = r?.fields ?? r ?? {};
    let lat, lng;

    // 1) ODS: geometry.coordinates = [lon, lat]
    if (r?.geometry?.coordinates?.length >= 2) {
      const [lon, la] = r.geometry.coordinates;
      lng = lon;
      lat = la;
    }

    // 2) ODS: geo_point_2d: { lat, lon }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      if (
        fields?.geo_point_2d &&
        Number.isFinite(fields.geo_point_2d.lat) &&
        Number.isFinite(fields.geo_point_2d.lon)
      ) {
        lat = fields.geo_point_2d.lat;
        lng = fields.geo_point_2d.lon;
      }
    }

    // 3) 其他常见别名
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      lat =
        fields.lat ??
        fields.latitude ??
        fields.y ??
        fields.Lat ??
        fields?.latLng?.lat;
      lng =
        fields.lng ??
        fields.lon ??
        fields.longitude ??
        fields.x ??
        fields.Long ??
        fields?.latLng?.lng;
    }

    // 4) 兜底：如果仅有 name，用内置表
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      if (fields.name && COORDS[fields.name]) {
        [lat, lng] = COORDS[fields.name];
      }
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    // 5) 热度：优先使用权重，其次根据占用/可用推导
    let w;
    if (Number.isFinite(fields.weight)) {
      w = fields.weight;
    } else {
      // ODS 停车常见：status / parking_status / occupancy / device_status
      const rawStatus = String(
        fields.status ??
          fields.parking_status ??
          fields.occupancy ??
          fields.occupancy_status ??
          fields.device_status ??
          ""
      ).toLowerCase();

      // 规则：occupied/present 更热；unoccupied/free 更冷；未知中等
      if (
        rawStatus.includes("present") ||
        rawStatus.includes("occupied") ||
        rawStatus.includes("busy")
      )
        w = 0.95;
      else if (
        rawStatus.includes("unoccupied") ||
        rawStatus.includes("vacant") ||
        rawStatus.includes("free")
      )
        w = 0.25;
      else w = 0.6;

      // 若有可用数量字段，则用数量细化（越少越热）
      const avail =
        fields.available ??
        fields.availability ??
        fields.free ??
        fields.free_spots ??
        fields.vacancies ??
        fields.spots ??
        fields.count ??
        fields.freeSpaces;

      if (Number.isFinite(avail)) w = toWeight(avail, cap);
    }

    out.push([lat, lng, Math.max(0, Math.min(1, Number(w) || 0))]);
  }

  return out;
}

/** 初次挂载/切页/窗口变化时强制刷新地图尺寸 */
function MapReadyFix() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    requestAnimationFrame(fix);
    const t = setTimeout(fix, 200);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

/** 根据点集自动缩放 */
function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const ll = points.map((p) => L.latLng(p[0], p[1]));
    const b = L.latLngBounds(ll);
    if (b.isValid()) map.fitBounds(b.pad(0.2));
  }, [map, points]);
  return null;
}

/** 高对比热力层（缩放自适应半径） */
function HeatLayer({ points = [], options = {} }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    // 独立 pane，叠在瓦片之上
    if (!map.getPane("heatmap")) {
      const pane = map.createPane("heatmap");
      pane.style.zIndex = 450; // tile≈200, overlay≈400, marker≈600
      pane.style.mixBlendMode = "screen";
    }

    // 归一化 + 提升对比
    const vals = points.map((p) => p?.[2]).filter((v) => Number.isFinite(v));
    const min = Math.min(...vals, 0),
      max = Math.max(...vals, 1);
    const gamma = 1.15,
      gain = 1.0,
      bias = 0.02;

    const normalized = points.map(([lat, lng, w = 0.3]) => {
      const m = max > min ? (w - min) / (max - min) : w; // [0,1]
      const boosted = Math.min(1, Math.max(0, Math.pow(m, gamma) * gain + bias));
      return [lat, lng, boosted];
    });

    // 随缩放变化半径
    const baseZoom = 13,
      base = 20;
    const radiusForZoom = (z) =>
      Math.max(12, Math.round(base * Math.pow(1.2, z - baseZoom)));

    const makeLayer = () =>
      L.heatLayer(normalized, {
        pane: "heatmap",
        radius: radiusForZoom(map.getZoom()),
        blur: 18,
        minOpacity: 0.6,
        maxZoom: 18,
        gradient: {
          0.0: "#1e3a8a",
          0.3: "#22d3ee",
          0.55: "#10b981",
          0.7: "#f59e0b",
          0.88: "#ef4444",
          1.0: "#991b1b",
        },
        ...options,
      }).addTo(map);

    let layer = makeLayer();
    const onZoomEnd = () => {
      layer.remove();
      layer = makeLayer();
    };
    map.on("zoomend", onZoomEnd);

    return () => {
      map.off("zoomend", onZoomEnd);
      layer.remove();
    };
  }, [map, points, options]);

  return null;
}

/** 地图卡片（支持：直接传 points 或从 apiUrl 轮询） */
export default function MapCard({
  center = [-37.8136, 144.9631],
  zoom = 13,
  // 若传入 points: [[lat,lng,weight], ...]，则不会请求 apiUrl
  points,
  legend = true,
  darkBasemap = true,
  // —— API 设置 —— //
  apiUrl, // 例如：ODS 完整 URL
  pollMs = 10000,
  token,
  cap = 20,
}) {
  const [livePoints, setLivePoints] = useState([]);
  const [debug, setDebug] = useState({ url: "", status: "", count: 0, err: "" });
  const timerRef = useRef(null);

  useEffect(() => {
    if (!apiUrl) return; // 未配置 API 时不拉取
    const controller = new AbortController();

    async function tick() {
      try {
        setDebug((d) => ({ ...d, url: apiUrl, err: "" }));
        const res = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
          cache: "no-store",
        });
        setDebug((d) => ({ ...d, status: String(res.status) }));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        // 既兼容 ODS，也兼容普通数组
        const arr = Array.isArray(json)
          ? json
          : json?.results || json?.records || json?.data || json?.rows;
        const pts = itemsToPoints(arr, cap);

        setLivePoints(pts);
        setDebug((d) => ({ ...d, count: pts.length, err: "" }));
      } catch (e) {
        setDebug((d) => ({ ...d, err: String(e?.message || e) }));
      } finally {
        timerRef.current = setTimeout(tick, pollMs);
      }
    }

    tick();
    return () => {
      controller.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [apiUrl, pollMs, token, cap]);

  const effectivePoints = points?.length ? points : livePoints;

  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-4 md:p-5">
      <div className="relative z-0 rounded-2xl overflow-hidden border border-white/10">
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
            <FitToPoints points={effectivePoints} />
            <HeatLayer points={effectivePoints} />
          </MapContainer>
        </div>

        {/* 右上角状态泡泡 */}
        <div className="pointer-events-none absolute right-4 top-4 z-[2000] rounded-xl bg-black/70 text-slate-100 text-xs px-3 py-2 border border-white/10 shadow">
          <div>🕙 Live</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Availability Heat</span>
          </div>
        </div>

        {/* 左下角图例 */}
        {/* 左下角图例 */}
{legend && (
  <div className="pointer-events-none absolute left-4 bottom-6 z-[2000] rounded-xl bg-black/70 text-slate-100 text-xs px-3 py-2 border border-white/10 shadow">
    <div className="font-medium mb-1">Parking Pressure (hotter = busier)</div>
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-rose-500" /> High (low availability)
    </div>
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-amber-400" /> Medium
    </div>
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Low (more spaces)
    </div>
  </div>
)}



     
      </div>
    </div>
  );
}
