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

/**
 * Privacy: snap coordinates to ~1km grid.
 * 0.01° latitude ≈ 1.11km.
 * 0.01° longitude varies by latitude (≈ 0.7km around Cork), still safely coarse.
 */
function snapTo1km(p: LatLng): LatLng {
  const stepLat = 0.01;
  const stepLng = 0.01;

  const lat = Math.round(p.lat / stepLat) * stepLat;
  const lng = Math.round(p.lng / stepLng) * stepLng;

  // Keep reasonable decimals for clean output
  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
  };
}

function FitToJourney({
  points,
  fallbackCenter,
}: {
  points: LatLng[];
  fallbackCenter: LatLng;
}) {
  const map = useMap();

  useEffect(() => {
    // Privacy: NEVER zoom in too close
    const MAX_ZOOM_PRIVACY = 11; // lower = more zoomed out; 11 keeps it town-scale, not street-scale
    const MIN_ZOOM_PRIVACY = 4;  // avoid weird world view if points are close

    if (!points || points.length === 0) {
      map.setView([fallbackCenter.lat, fallbackCenter.lng], 6, { animate: true });
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 10, { animate: true });
      if (map.getZoom() > MAX_ZOOM_PRIVACY) map.setZoom(MAX_ZOOM_PRIVACY);
      if (map.getZoom() < MIN_ZOOM_PRIVACY) map.setZoom(MIN_ZOOM_PRIVACY);
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));

    // Big padding = zoomed out = privacy-friendly
    map.fitBounds(bounds.pad(0.65), { animate: true });

    // Cap zoom so it never gets too close
    if (map.getZoom() > MAX_ZOOM_PRIVACY) map.setZoom(MAX_ZOOM_PRIVACY);
    if (map.getZoom() < MIN_ZOOM_PRIVACY) map.setZoom(MIN_ZOOM_PRIVACY);
  }, [map, points, fallbackCenter]);

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

export default function JourneyMap({ points, center, zoom = 5 }: JourneyMapProps) {
  const mapKeyRef = useRef(0);

  // Privacy: snap ALL displayed points to ~1km grid
  const safePoints = useMemo(() => {
    if (!points || points.length === 0) return [];
    return points.map(snapTo1km);
  }, [points]);

  const safeCenter = useMemo(() => snapTo1km(center), [center]);

  const arcPath = useMemo(() => {
    if (!safePoints || safePoints.length < 2) return [];
    const combined: LatLng[] = [];

    for (let i = 0; i < safePoints.length - 1; i++) {
      const a = safePoints[i];
      const b = safePoints[i + 1];
      const seg = arcBetween(a, b, 44, 0.18);

      if (i > 0) seg.shift();
      combined.push(...seg);
    }
    return combined;
  }, [safePoints]);

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
        path.getBoundingClientRect();
        path.classList.add("journey-arc-animate");
      } catch {
        // fail silently
      }
    }, 150);

    return () => window.clearTimeout(t);
  }, [arcPath.length, safePoints?.length]);

  const last = safePoints && safePoints.length > 0 ? safePoints[safePoints.length - 1] : safeCenter;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_50px_rgba(140,90,255,0.06)]">
      <div className="h-[320px] w-full">
        <MapContainer
          key={mapKeyRef.current}
          center={[safeCenter.lat, safeCenter.lng]}
          zoom={zoom}
          scrollWheelZoom={false}
          className="h-full w-full"
          preferCanvas={false}
        >
          <FixLeafletIcons />
          <FitToJourney points={safePoints} fallbackCenter={safeCenter} />

          {/* Dark map tiles (CartoDB Dark Matter) */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

          {/* Soft glow under arc */}
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

          {/* Last seen marker (also snapped) */}
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

        /* Keep controls readable on dark tiles */
        .leaflet-container {
          background: #070716;
        }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.45) !important;
          color: rgba(255,255,255,0.9) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
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
