"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker } from "react-leaflet";

type Point = { lat: number; lng: number };

const pinIcon = new L.DivIcon({
  className: "",
  html: `
  <div style="
    width: 18px; height: 18px; border-radius: 999px;
    background: rgba(167,139,250,0.95);
    box-shadow: 0 0 22px rgba(167,139,250,0.9), 0 0 60px rgba(99,102,241,0.55);
    border: 2px solid rgba(255,255,255,0.35);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function JourneyMap({ points }: { points: Point[] }) {
  if (!points || points.length === 0) {
    return (
      <div className="h-[420px] rounded-[28px] border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-sm">
        No journey yet
      </div>
    );
  }

  const center = points[points.length - 1];
  const line = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="relative rounded-[28px] overflow-hidden border border-white/10 bg-[#0b0820] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)]">
      {/* Glow overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      </div>

      <div className="h-[520px]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-full w-full"
          zoomControl={true}
        >
          {/* OSM tiles */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Soft route line */}
          {line.length > 1 && (
            <Polyline
              positions={line}
              pathOptions={{
                weight: 4,
                opacity: 0.55,
              }}
            />
          )}

          {/* Route dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <CircleMarker
                key={i}
                center={[p.lat, p.lng]}
                radius={isLast ? 8 : 5}
                pathOptions={{
                  opacity: 0.9,
                  fillOpacity: isLast ? 0.95 : 0.8,
                  weight: 2,
                }}
              />
            );
          })}

          {/* Current location pin */}
          <Marker position={[center.lat, center.lng]} icon={pinIcon} />
        </MapContainer>
      </div>

      {/* Bottom fade for “cinematic” map */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
    </div>
  );
}
