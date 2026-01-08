"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Polyline, ZoomControl } from "react-leaflet";
import { useMemo } from "react";

type Point = { lat: number; lng: number };

export default function JourneyMap({
  points,
  center,
  zoom = 5,
}: {
  points: Point[];
  center: Point;
  zoom?: number;
}) {
  // Prevent Leaflet default icon issues (only needed if you ever use Marker)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (L.Icon.Default as any).mergeOptions({
    iconRetinaUrl: undefined,
    iconUrl: undefined,
    shadowUrl: undefined,
  });

  const poly = useMemo(() => points.map((p) => [p.lat, p.lng] as [number, number]), [points]);

  const latest = points.length ? points[points.length - 1] : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(140,90,255,0.14)]">
      {/* Global CSS for leaflet + our glow/pulse */}
      <style jsx global>{`
        .journey-map .leaflet-container {
          background: #06050b;
          filter: saturate(1.15) contrast(1.05) brightness(0.92);
        }

        /* Hide default attribution for cleaner look (optional) */
        .journey-map .leaflet-control-attribution {
          display: none !important;
        }

        /* Make zoom control match the theme */
        .journey-map .leaflet-control-zoom {
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          background: rgba(10, 8, 18, 0.55) !important;
          backdrop-filter: blur(10px);
        }
        .journey-map .leaflet-control-zoom a {
          background: transparent !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border: none !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          font-size: 20px !important;
        }
        .journey-map .leaflet-control-zoom a:hover {
          background: rgba(255, 255, 255, 0.06) !important;
        }

        /* Glow line */
        .journey-glow {
          filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.55))
            drop-shadow(0 0 30px rgba(124, 58, 237, 0.25));
        }

        /* Pulsing ring */
        .pulse-ring {
          transform-origin: center;
          animation: pulse 2.2s ease-out infinite;
        }
        @keyframes pulse {
          0% {
            opacity: 0.45;
            stroke-width: 2;
          }
          70% {
            opacity: 0;
            stroke-width: 2;
          }
          100% {
            opacity: 0;
            stroke-width: 2;
          }
        }
      `}</style>

      <div className="journey-map relative h-[420px] w-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full"
          preferCanvas
        >
          <ZoomControl position="topleft" />

          {/* Dark tiles (CARTO Dark Matter) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Journey line — layered for glow + dotted “starlight” vibe */}
          {poly.length >= 2 ? (
            <>
              {/* Wide soft glow */}
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#8b5cf6",
                  weight: 10,
                  opacity: 0.18,
                  lineCap: "round",
                  className: "journey-glow",
                }}
              />

              {/* Dotted trail */}
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#a78bfa",
                  weight: 4,
                  opacity: 0.85,
                  lineCap: "round",
                  dashArray: "1 14",
                  className: "journey-glow",
                }}
              />

              {/* Thin core line */}
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#c4b5fd",
                  weight: 2,
                  opacity: 0.9,
                  lineCap: "round",
                }}
              />
            </>
          ) : null}

          {/* Latest point — pulsing ring + bright core */}
          {latest ? (
            <>
              {/* Animated ring */}
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={22}
                pathOptions={{
                  color: "#a78bfa",
                  opacity: 0.55,
                  fillOpacity: 0,
                  className: "pulse-ring journey-glow",
                }}
              />

              {/* Soft halo */}
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={16}
                pathOptions={{
                  color: "#8b5cf6",
                  opacity: 0.25,
                  fillOpacity: 0.08,
                  className: "journey-glow",
                }}
              />

              {/* Bright core */}
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={6}
                pathOptions={{
                  color: "#ede9fe",
                  opacity: 0.95,
                  fillOpacity: 0.9,
                }}
              />
            </>
          ) : null}
        </MapContainer>

        {/* Purple haze overlay (soft) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,rgba(168,85,247,0.18),rgba(0,0,0,0)_70%)]" />

        {/* Vignette + depth */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_35%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.55)_100%)]" />

        {/* Top glass sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
      </div>
    </div>
  );
}
