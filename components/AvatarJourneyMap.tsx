"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";

type LatLng = { lat: number; lng: number };

type Props = {
  points: LatLng[];
  center: LatLng;
  zoom?: number;
};

function FixLeafletIcons() {
  useEffect(() => {
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

function FitToJourneySafe({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], Math.min(map.getZoom(), 5), { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.55), { animate: true });

    // Privacy/safety: don't zoom in too far
    window.setTimeout(() => {
      const z = map.getZoom();
      if (z > 5) map.setZoom(5, { animate: true });
    }, 250);
  }, [map, points]);

  return null;
}

// Visual arc (quadratic bezier in lat/lng space; looks good, not a true great-circle)
function arcBetween(a: LatLng, b: LatLng, steps = 44, curvature = 0.18): LatLng[] {
  const lat1 = a.lat;
  const lng1 = a.lng;
  const lat2 = b.lat;
  const lng2 = b.lng;

  const mx = (lng1 + lng2) / 2;
  const my = (lat1 + lat2) / 2;

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;

  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = -dy / len;
  const py = dx / len;

  const mag = Math.min(6, len * 0.55) * curvature;

  const cx = mx + px * mag;
  const cy = my + py * mag;

  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * cx + t * t * lng2;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * cy + t * t * lat2;
    pts.push({ lat, lng });
  }
  return pts;
}

export default function AvatarJourneyMap({ points, center, zoom = 4 }: Props) {
  const arcPath = useMemo(() => {
    if (!points || points.length < 2) return [];
    const combined: LatLng[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const seg = arcBetween(points[i], points[i + 1], 44, 0.18);
      if (i > 0) seg.shift();
      combined.push(...seg);
    }
    return combined;
  }, [points]);

  // Animate the main arc
  useEffect(() => {
    const t = window.setTimeout(() => {
      const path = document.querySelector(
        ".wml-gold-arc.leaflet-interactive"
      ) as SVGPathElement | null;

      if (!path) return;

      try {
        const total = path.getTotalLength();
        path.style.strokeDasharray = `${total}`;
        path.style.strokeDashoffset = `${total}`;
        path.getBoundingClientRect();
        path.classList.add("wml-gold-arc-animate");
      } catch {
        // fail silently
      }
    }, 160);

    return () => window.clearTimeout(t);
  }, [arcPath.length, points.length]);

  const last = points.length > 0 ? points[points.length - 1] : center;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(220,170,60,0.08)]">
      <div className="h-[320px] w-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <FixLeafletIcons />
          <FitToJourneySafe points={points} />

          {/* Dark map tiles */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Previous owners / previous taps outline (subtle) */}
          {points.map((p, i) => (
            <CircleMarker
              key={`${p.lat}-${p.lng}-${i}`}
              center={[p.lat, p.lng]}
              radius={4}
              pathOptions={{
                weight: 1,
                opacity: 0.55,
                fillOpacity: 0.12,
              }}
            />
          ))}

          {/* Gold glow under arc */}
          {arcPath.length >= 2 && (
            <Polyline
              positions={arcPath.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                className: "wml-gold-arc-glow",
                weight: 12,
                opacity: 0.22,
              }}
            />
          )}

          {/* Main gold arc */}
          {arcPath.length >= 2 && (
            <Polyline
              positions={arcPath.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                className: "wml-gold-arc",
                weight: 4,
                opacity: 0.95,
              }}
            />
          )}

          {/* Current location highlight */}
          <CircleMarker
            center={[last.lat, last.lng]}
            radius={10}
            pathOptions={{
              weight: 2,
              opacity: 0.95,
              fillOpacity: 0.08,
            }}
          />
          <CircleMarker
            center={[last.lat, last.lng]}
            radius={5}
            pathOptions={{
              weight: 2,
              opacity: 0.95,
              fillOpacity: 0.35,
            }}
          />
        </MapContainer>
      </div>

      {/* Local CSS (no styled-jsx) */}
      <style>{`
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

        .wml-gold-arc {
          stroke: rgba(235, 197, 92, 0.95);
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 10px rgba(235, 197, 92, 0.18));
        }
        .wml-gold-arc-glow {
          stroke: rgba(235, 197, 92, 0.55);
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: blur(1.2px);
        }
        .wml-gold-arc-animate {
          transition: stroke-dashoffset 1600ms ease-in-out;
          stroke-dashoffset: 0 !important;
        }
      `}</style>
    </div>
  );
}
