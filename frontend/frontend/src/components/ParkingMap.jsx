// src/components/ParkingMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet + Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const ParkingMap = ({ coordinates }) => {
  const defaultCenter = coordinates.length > 0
    ? [coordinates[0].lat, coordinates[0].lng]
    : [-37.8136, 144.9631]; // Melbourne CBD

  return (
    <MapContainer center={defaultCenter} zoom={14} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {coordinates.map((point, idx) => (
        <Marker key={idx} position={[point.lat, point.lng]}>
          <Popup>
            {point.name}<br />
            Available: {point.available}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ParkingMap;
