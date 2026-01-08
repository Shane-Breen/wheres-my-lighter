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

  const poly = useMemo(
    () => points.map((p) => [p.lat, p.lng] as [number, number]),
    [points]
  );

  const latest = points.length ? points[points.length - 1] : null;

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

          {/* Dark tiles */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Distance arc (animated dash) */}
          {poly.length >= 2 ? (
            <>
              {/* soft glow underlay */}
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#8b5cf6",
                  weight: 10,
                  opacity: 0.20,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              {/* animated dashed arc */}
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#c4b5fd",
                  weight: 3,
                  opacity: 0.9,
                  dashArray: "10 14",
                  className: "journeyArc",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          ) : null}

          {/* Latest point glow */}
          {latest ? (
            <>
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={22}
                pathOptions={{ color: "#a78bfa", opacity: 0.30, fillOpacity: 0.10 }}
              />
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={8}
                pathOptions={{ color: "#ddd6fe", opacity: 0.95, fillOpacity: 0.85 }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
