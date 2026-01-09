"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Polyline, Circle, ZoomControl } from "react-leaflet";
import { useMemo } from "react";

type Point = { lat: number; lng: number };

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
  const poly = useMemo(
    () => points.map((p) => [p.lat, p.lng] as [number, number]),
    [points]
  );

  const latest = points.length ? points[points.length - 1] : center;

  // Distance arc radius in meters (clamped so it looks nice)
  const radiusMeters = Math.max(800, Math.min(250000, distanceKm * 1000));

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(140,90,255,0.10)]">
      <div className="h-[420px] w-full">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full"
          preferCanvas={false}
        >
          <ZoomControl position="topleft" />

          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Distance "arc" (animated dashed circle) */}
          {latest ? (
            <Circle
              center={[latest.lat, latest.lng]}
              radius={radiusMeters}
              pathOptions={{
                color: "#a78bfa",
                weight: 2,
                opacity: 0.55,
                fillOpacity: 0,
                className: "wml-distance-arc",
              }}
            />
          ) : null}

          {/* Journey line (glow + animated draw) */}
          {poly.length >= 2 ? (
            <>
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#8b5cf6",
                  weight: 8,
                  opacity: 0.22,
                }}
              />
              <Polyline
                positions={poly}
                pathOptions={{
                  color: "#c4b5fd",
                  weight: 3,
                  opacity: 0.95,
                  className: "wml-journey-line",
                }}
              />
            </>
          ) : null}

          {/* Latest point glow */}
          {latest ? (
            <>
              <CircleMarker
                center={[latest.lat, latest.lng]}
                radius={18}
                pathOptions={{ color: "#a78bfa", opacity: 0.35, fillOpacity: 0.12 }}
              />
              <CircleMarker
                center={[latest.lat, latest.lng]}
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
