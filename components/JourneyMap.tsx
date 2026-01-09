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
  (L.Icon.Default as any).mergeOptions({
    iconRetinaUrl: undefined,
    iconUrl: undefined,
    shadowUrl: undefined,
  });

  const poly = useMemo(
    () => points.map((p) => [p.lat, p.lng] as [number, number]),
    [points]
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(140,90,255,0.12)]">
      <div className="h-[420px] w-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full"
          preferCanvas
        >
          <ZoomControl position="topleft" />

          <TileLayer
            attribution="&copy; OpenStreetMap &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {poly.length >= 2 && (
            <>
              {/* Soft glow */}
              <Polyline
                positions={poly}
                pathOptions={{ color: "#8b5cf6", weight: 9, opacity: 0.2 }}
              />

              {/* Main route */}
              <Polyline
                positions={poly}
                pathOptions={{ color: "#a78bfa", weight: 3, opacity: 0.9 }}
              />

              {/* Animated distance arc */}
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#c4b5fd",
                  weight: 4,
                  opacity: 1,
                  className: "route-comet",
                }}
              />
            </>
          )}

          {points.length > 0 && (
            <>
              <CircleMarker
                center={[points.at(-1)!.lat, points.at(-1)!.lng]}
                radius={18}
                pathOptions={{ color: "#a78bfa", opacity: 0.35, fillOpacity: 0.12 }}
              />
              <CircleMarker
                center={[points.at(-1)!.lat, points.at(-1)!.lng]}
                radius={7}
                pathOptions={{ color: "#c4b5fd", opacity: 0.95, fillOpacity: 0.9 }}
              />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
