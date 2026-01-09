"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";

type LatLng = { lat: number; lng: number };

type JourneyMapProps = {
  points: LatLng[];
  center: LatLng;
  zoom?: number;
};

function FixLeafletIcons() {
  useEffect(() => {
    // Fix default marker icon paths in Next/Vercel builds
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const iconRetinaUrl = require("leaflet/dist/images/marker-icon-2x.png");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const iconUrl = require("leaflet/dist/images/marker-icon.png");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const shadowUrl = require("leaflet/dist/images/marker-shadow.png");

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl?.default ?? iconRetinaUrl,
      iconUrl: iconUrl?.default ?? iconUrl,
      shadowUrl: shadowUrl?.default ?? shadowUrl,
    });
  }, []);

  return null;
}

function FitToJourney({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 6), { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.18), { animate: true });
  }, [map, points]);

  return null;
}

// Create a simple curved arc between two points (visual, not true great-circle)
function arcBetween(a: LatLng, b: LatLng, steps = 40, curvature = 0.18): LatLng[] {
  const lat1 = a.lat;
  const lng1 = a.lng;
  const lat2 = b.lat;
  const lng2 = b.lng;

  const mx = (lng1 + lng2) / 2;
  const my = (lat1 + lat2) / 2;

  // perpendicular offset in "lat/lng space" (approx)
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;

  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // perpendicular unit vector
  const px = -dy / len;
  const py = dx / len;

  // offset magnitude scales with distance
  const mag = Math.min(6, len * 0.55) * curvature;

  const cx = mx + px * mag;
  const cy = my + py * mag;

  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier interpolation
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * cx + t * t * lng2;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * cy + t * t * lat2;
    pts.push({ lat, lng });
  }
  return pts;
}

export default function JourneyMap({ points, center, zoom = 5 }: JourneyMapProps) {
  const mapKeyRef = useRef(0);

  const arcPath = useMemo(() => {
    if (!points || points.length < 2) return [];
    const combined: LatLng[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const seg = arcBetween(a, b, 44, 0.18);

      if (i > 0) seg.shift(); // avoid duplicating the join point
      combined.push(...seg);
    }
    return combined;
  }, [points]);

  // Animate the SVG stroke dash on the Leaflet polyline path
  useEffect(() => {
    const t = window.setTimeout(() => {
      const path = document.querySelector(
        ".journey-arc.leaflet-interactive"
      ) as SVGPathElement | null;

      if (!path) return;

      try {
        const total = path.getTotalLength();
        path.style.strokeDasharray = `${total}`;
        path.style.strokeDashoffset = `${total}`;
        // trigger layout
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        path.getBoundingClientRect();

        path.classList.add("journey-arc-animate");
      } catch {
        // fail silently
      }
    }, 150);

    return () => window.clearTimeout(t);
  }, [arcPath.length, points?.length]);

  const last = points && points.length > 0 ? points[points.length - 1] : center;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_50px_rgba(140,90,255,0.06)]">
      <div className="h-[320px] w-full">
        <MapContainer
          key={mapKeyRef.current}
          center={[center.lat, center.lng]}
          zoom={zoom}
          scrollWheelZoom={false}
          className="h-full w-full"
          preferCanvas={false}
        >
          <FixLeafletIcons />
          <FitToJourney points={points} />

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Arc path */}
          {arcPath.length >= 2 && (
            <Polyline
              positions={arcPath.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                className: "journey-arc",
                weight: 4,
                opacity: 0.85,
              }}
            />
          )}

          {/* Soft “glow” under arc for depth */}
          {arcPath.length >= 2 && (
            <Polyline
              positions={arcPath.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                className: "journey-arc-glow",
                weight: 10,
                opacity: 0.18,
              }}
            />
          )}

          {/* Last seen marker */}
          <CircleMarker
            center={[last.lat, last.lng]}
            radius={7}
            pathOptions={{
              weight: 2,
              opacity: 0.9,
              fillOpacity: 0.35,
            }}
          />
        </MapContainer>
      </div>

      {/* Plain <style> tag (NOT styled-jsx) */}
      <style>{`
        .journey-arc {
          stroke: rgba(200, 160, 255, 0.95);
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .journey-arc-glow {
          stroke: rgba(160, 90, 255, 0.55);
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: blur(1.2px);
        }

        .journey-arc-animate {
          transition: stroke-dashoffset 1600ms ease-in-out;
          stroke-dashoffset: 0 !important;
        }

        .leaflet-container {
          background: #070716;
        }
        .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.35) !important;
          color: rgba(255, 255, 255, 0.55) !important;
          border-radius: 10px;
          padding: 4px 8px;
          margin: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.75) !important;
        }
      `}</style>
    </div>
  );
}
