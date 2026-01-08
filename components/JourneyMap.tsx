"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  ZoomControl,
} from "react-leaflet";
import { useMemo } from "react";

type Point = { lat: number; lng: number };

function arcify(points: Point[]) {
  // If only 2 points, add a simple mid control to create a slight arc.
  if (points.length < 2) return points;

  const a = points[0];
  const b = points[points.length - 1];

  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };

  // Push mid point “up” a bit (perpendicular-ish) for a gentle arc.
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;

  const bend = 0.18; // arc strength
  const ctrl = {
    lat: mid.lat + dx * bend,
    lng: mid.lng - dy * bend,
  };

  // If we have a multi-point journey, keep it (it’s already a path).
  // If only 2 points, create a 3-point arc path.
  return points.length === 2 ? [a, ctrl, b] : points;
}

export default function JourneyMap({
  points,
  center,
  zoom = 5,
  distanceKm = 0,
}: {
  points: Point[];
  center: Point;
  zoom?: number;
  distanceKm?: number;
}) {
  // Prevent Leaflet default icon issues (only needed if you ever use Marker)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (L.Icon.Default as any).mergeOptions({
    iconRetinaUrl: undefined,
    iconUrl: undefined,
    shadowUrl: undefined,
  });

  const arced = useMemo(() => arcify(points), [points]);
  const poly = useMemo(
    () => arced.map((p) => [p.lat, p.lng] as [number, number]),
    [arced]
  );

  const latest = points.length ? points[points.length - 1] : null;

  // Use distance to slightly scale the glow size (subtle)
  const glow = Math.min(26, 14 + Math.log10(Math.max(1, distanceKm + 1)) * 10);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(140,90,255,0.10)]">
      <div className="h-[420px] w-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full journeyMap"
          preferCanvas
        >
          <ZoomControl position="topleft" />

          {/* Dark tiles */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Animated “distance arc” (double draw for glow) */}
          {poly.length >= 2 ? (
            <>
              <Polyline
                positions={poly}
                // Leaflet supports className on path options
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pathOptions={{ color: "#8b5cf6", weight: 10, opacity: 0.20, className: "journeyArcGlow" as any }}
              />
              <Polyline
                positions={poly}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pathOptions={{ color: "#c4b5fd", weight: 3.5, opacity: 0.95, className: "journeyArc" as any }}
              />
            </>
          ) : null}

          {/* Latest point glow */}
          {latest ? (
            <>
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={glow}
                pathOptions={{
                  color: "#a78bfa",
                  opacity: 0.35,
                  fillOpacity: 0.12,
                }}
              />
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={7}
                pathOptions={{
                  color: "#ddd6fe",
                  opacity: 0.95,
                  fillOpacity: 0.85,
                }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
