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
      <style jsx global>{`
        /* Base */
        .leaflet-container {
          background: #070614;
          outline: none;
        }

        /* Make tiles darker + higher contrast, reduce “grid seams” look */
        .leaflet-tile {
          filter: brightness(0.72) contrast(1.25) saturate(0.85);
        }

        /* Slightly reduce tile layer opacity so our overlays dominate */
        .wml-tiles {
          opacity: 0.85;
        }

        /* Zoom controls -> rounded + subtle */
        .leaflet-control-zoom {
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          border-radius: 14px !important;
          overflow: hidden;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);
        }
        .leaflet-control-zoom a {
          background: rgba(10, 8, 26, 0.55) !important;
          color: rgba(255, 255, 255, 0.92) !important;
          border: none !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-zoom a:hover {
          background: rgba(20, 16, 44, 0.75) !important;
        }

        /* Keep it clean */
        .leaflet-control-attribution {
          display: none !important;
        }

        /* Neon dot */
        .wml-dot {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: rgba(168, 85, 247, 0.92);
          border: 2px solid rgba(255, 255, 255, 0.28);
          box-shadow: 0 0 18px rgba(168, 85, 247, 0.9),
            0 0 60px rgba(99, 102, 241, 0.45);
          position: relative;
        }

        /* Current dot pulse halo + big aura */
        .wml-dot--current {
          box-shadow: 0 0 22px rgba(168, 85, 247, 0.95),
            0 0 90px rgba(99, 102, 241, 0.55);
        }
        .wml-dot--current::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 78px;
          height: 78px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(167, 139, 250, 0.22) 0%,
            rgba(99, 102, 241, 0.10) 35%,
            rgba(0, 0, 0, 0) 70%
          );
          filter: blur(0.2px);
        }
        .wml-dot--current::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 52px;
          height: 52px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 2px solid rgba(167, 139, 250, 0.32);
          box-shadow: 0 0 40px rgba(167, 139, 250, 0.65);
          animation: wmlPulse 1.85s ease-in-out infinite;
        }
        @keyframes wmlPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.85);
            opacity: 0.85;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.22);
            opacity: 0.14;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.22);
            opacity: 0;
          }
        }
      `}</style>

      {/* Overlays to mimic “purple haze / vignette” */}
      <div className="pointer-events-none absolute inset-0">
        {/* soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.62)_100%)]" />
        {/* purple haze */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-500/22 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-indigo-500/22 blur-3xl" />
        {/* darker bottom fade like mock */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="h-[520px]">
        <MapContainer
          center={[last.lat, last.lng]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* Dark basemap */}
          <TileLayer
            className="wml-tiles"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />

          {/* Route glow (if > 1 point). Use dashed “dotted line” vibe */}
          {line.length > 1 && (
            <>
              {/* Big glow */}
              <Polyline
                positions={line}
                pathOptions={{
                  weight: 12,
                  opacity: 0.18,
                  dashArray: "1 14",
                  lineCap: "round",
                }}
              />
              {/* Thin bright dotted */}
              <Polyline
                positions={line}
                pathOptions={{
                  weight: 4,
                  opacity: 0.65,
                  dashArray: "1 14",
                  lineCap: "round",
                }}
              />
            </>
          )}

          {/* Dots for each point */}
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
    </div>
  );
}
