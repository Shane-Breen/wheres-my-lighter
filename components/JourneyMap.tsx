"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

type Point = { lat: number; lng: number };

const markerIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width:12px;height:12px;border-radius:999px;
    background: rgba(167,139,250,0.95);
    box-shadow: 0 0 18px rgba(167,139,250,0.75);
    border: 2px solid rgba(255,255,255,0.35);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function JourneyMap({ points }: { points: Point[] }) {
  if (!points || points.length === 0) {
    return (
      <div className="h-[320px] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-sm">
        No journey yet
      </div>
    );
  }

  const center = points[points.length - 1];
  const line = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
      <div className="h-[360px]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map((p, i) => (
            <Marker key={i} position={[p.lat, p.lng]} icon={markerIcon} />
          ))}
          {line.length > 1 && (
            <Polyline positions={line} pathOptions={{ weight: 3, opacity: 0.75 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
