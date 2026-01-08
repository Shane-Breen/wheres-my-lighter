"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

type Point = { lat: number; lng: number };

function dotIcon(kind: "normal" | "current") {
  return new L.DivIcon({
    className: "",
    html: `<div class="wml-dot ${kind === "current" ? "wml-dot--current" : ""}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function JourneyMap({ points }: { points: Point[] }) {
  if (!points || points.length === 0) {
    return (
      <div className="h-[520px] rounded-[28px] border border-white/10 bg-white/5 flex items-center justify-center text-white/40 text-sm">
        No journey yet
      </div>
    );
  }

  const last = points[points.length - 1];
  const line = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="relative rounded-[28px] overflow-hidden border border-white/10 bg-[#070614] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)]">
      {/* Global styling for Leaflet + neon dots */}
      <style jsx global>{`
        /* Make the map feel “night mode” even if tiles vary */
        .leaflet-container {
          background: #070614;
          outline: none;
        }

        /* Round + soften zoom controls like the mock */
        .leaflet-control-zoom {
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 14px !important;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }
        .leaflet-control-zoom a {
          background: rgba(10, 8, 26, 0.65) !important;
          color: rgba(255, 255, 255, 0.9) !important;
          border: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(20, 16, 44, 0.8) !important;
        }

        /* Hide attribution to keep it clean (optional). If you prefer, remove these two lines. */
        .leaflet-control-attribution {
          display: none !important;
        }

        /* Neon route dots */
        .wml-dot {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: rgba(168, 85, 247, 0.85);
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 18px rgba(168, 85, 247, 0.8),
            0 0 50px rgba(99, 102, 241, 0.35);
          position: relative;
        }

        /* Current dot pulse halo */
        .wml-dot--current::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 46px;
          height: 46px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 2px solid rgba(167, 139, 250, 0.35);
          box-shadow: 0 0 35px rgba(167, 139, 250, 0.6);
          animation: wmlPulse 1.9s ease-in-out infinite;
        }

        @keyframes wmlPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.85);
            opacity: 0.85;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.18);
            opacity: 0.12;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.18);
            opacity: 0;
          }
        }
      `}</style>

      {/* Glow overlays like the mock */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      </div>

      <div className="h-[520px]">
        <MapContainer
          center={[last.lat, last.lng]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* Dark “night” basemap (Carto Dark Matter) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />

          {/* Route glow (two polylines: thick glow + thin bright line) */}
          {line.length > 1 && (
            <>
              <Polyline
                positions={line}
                pathOptions={{
                  weight: 10,
                  opacity: 0.18,
                }}
              />
              <Polyline
                positions={line}
                pathOptions={{
                  weight: 4,
                  opacity: 0.55,
                }}
              />
            </>
          )}

          {/* Dots for all points */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <Marker
                key={`${p.lat}-${p.lng}-${i}`}
                position={[p.lat, p.lng]}
                icon={dotIcon(isLast ? "current" : "normal")}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom cinematic fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
    </div>
  );
}
