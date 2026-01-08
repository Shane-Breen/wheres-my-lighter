"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Polyline, ZoomControl } from "react-leaflet";
import { useMemo } from "react";

type Point = { lat: number; lng: number };

function glowIcon() {
  // We use CircleMarker glow instead of custom icons to keep it clean.
  return null;
}

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

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(140,90,255,0.10)]">
      <div className="h-[420px] w-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full"
          preferCanvas
        >
          <ZoomControl position="topleft" />

          {/* Dark tiles (Carto Dark Matter) */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Glow polyline (double-draw for glow) */}
          {poly.length >= 2 ? (
            <>
              <Polyline positions={poly} pathOptions={{ color: "#8b5cf6", weight: 8, opacity: 0.25 }} />
              <Polyline positions={poly} pathOptions={{ color: "#a78bfa", weight: 3, opacity: 0.9 }} />
            </>
          ) : null}

          {/* Latest point glow */}
          {points.length ? (
            <>
              <CircleMarker
                center={[points[points.length - 1].lat, points[points.length - 1].lng]}
                radius={18}
                pathOptions={{ color: "#a78bfa", opacity: 0.35, fillOpacity: 0.12 }}
              />
              <CircleMarker
                center={[points[points.length - 1].lat, points[points.length - 1].lng]}
                radius={7}
                pathOptions={{ color: "#c4b5fd", opacity: 0.95, fillOpacity: 0.85 }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
