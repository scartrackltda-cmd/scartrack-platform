"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Map as MapboxMapType, Marker, Popup } from "mapbox-gl";

export interface VehicleMarkerData {
  id: string;
  plate: string;
  alias: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: "moving" | "idle" | "online" | "offline" | "alert";
  city?: string;
}

interface MapboxMapProps {
  vehicles?: VehicleMarkerData[];
  center?: [number, number];
  zoom?: number;
  style?: string;
  onVehicleClick?: (vehicle: VehicleMarkerData) => void;
}

const STATUS_COLORS: Record<string, string> = {
  moving:  "#3B82F6",
  online:  "#22C55E",
  idle:    "#EAB308",
  offline: "#6B7280",
  alert:   "#EF4444",
};

// Veículos de demonstração — cidades brasileiras
export const DEFAULT_VEHICLES: VehicleMarkerData[] = [
  { id: "1", plate: "ABC-1D23", alias: "Caminhão 01", city: "São Paulo, SP",     latitude: -23.5505, longitude: -46.6333, speed: 72,  heading: 45,  status: "moving"  },
  { id: "2", plate: "DEF-4E56", alias: "Van Frota 03",city: "Rio de Janeiro, RJ", latitude: -22.9068, longitude: -43.1729, speed: 0,   heading: 0,   status: "idle"    },
  { id: "3", plate: "GHI-7F89", alias: "Carro 07",    city: "Belo Horizonte, MG",latitude: -19.9167, longitude: -43.9345, speed: 98,  heading: 220, status: "moving"  },
  { id: "4", plate: "JKL-2G34", alias: "Moto 02",     city: "Brasília, DF",      latitude: -15.7939, longitude: -47.8828, speed: 0,   heading: 0,   status: "alert"   },
  { id: "5", plate: "MNO-5H67", alias: "Bus 11",      city: "Curitiba, PR",      latitude: -25.4284, longitude: -49.2733, speed: 55,  heading: 90,  status: "online"  },
  { id: "6", plate: "PQR-8I90", alias: "Truck 05",    city: "Salvador, BA",      latitude: -12.9714, longitude: -38.5014, speed: 0,   heading: 0,   status: "offline" },
  { id: "7", plate: "STU-1J12", alias: "Van 09",      city: "Fortaleza, CE",     latitude: -3.7172,  longitude: -38.5433, speed: 43,  heading: 180, status: "moving"  },
  { id: "8", plate: "VWX-4K34", alias: "Carro 12",    city: "Manaus, AM",        latitude: -3.1190,  longitude: -60.0217, speed: 0,   heading: 0,   status: "idle"    },
];

export function MapboxMap({
  vehicles = DEFAULT_VEHICLES,
  center = [-47.9, -15.8],
  zoom = 4.2,
  style = "mapbox://styles/mapbox/dark-v11",
  onVehicleClick,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<MapboxMapType | null>(null);
  const markersRef   = useRef<Map<string, { marker: Marker; popup: Popup }>>(new Map());
  const styleRef     = useRef(style);

  // When style changes, update the existing map
  useEffect(() => {
    if (mapRef.current && styleRef.current !== style) {
      styleRef.current = style;
      mapRef.current.setStyle(style);
    }
  }, [style]);

  const createMarkerElement = useCallback(
    (vehicle: VehicleMarkerData): HTMLElement => {
      const color = STATUS_COLORS[vehicle.status] ?? "#6B7280";
      const animated = vehicle.status === "moving" || vehicle.status === "alert";

      const el = document.createElement("div");
      el.className = "scartrack-vehicle-marker";
      el.style.cssText = `
        position: relative;
        width: 38px;
        height: 38px;
        cursor: pointer;
        transition: transform 0.15s ease;
      `;

      el.innerHTML = `
        ${animated ? `
          <span style="
            position: absolute; inset: -4px;
            border-radius: 50%;
            background: ${color};
            opacity: 0;
            animation: scartrack-ping 1.8s ease-out infinite;
          "></span>
        ` : ""}
        <div style="
          position: relative;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: ${color}18;
          border: 2.5px solid ${color};
          box-shadow: 0 0 16px ${color}66, inset 0 0 8px ${color}22;
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="
            width: 13px; height: 13px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 6px ${color};
          "></div>
        </div>
      `;

      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.18)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      return el;
    },
    []
  );

  const buildPopupHTML = useCallback((v: VehicleMarkerData): string => {
    const color = STATUS_COLORS[v.status] ?? "#6B7280";
    const labels: Record<string, string> = {
      moving: "Em Movimento", online: "Online",
      idle: "Parado", offline: "Offline", alert: "Alerta",
    };
    return `
      <div style="
        background:#0d1521;border:1px solid #1e293b;border-radius:12px;
        padding:13px 15px;min-width:170px;font-family:system-ui,sans-serif;
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:9px;height:9px;border-radius:50%;background:${color};
            box-shadow:0 0 7px ${color};flex-shrink:0;"></div>
          <span style="color:#f1f5f9;font-size:13px;font-weight:700;">${v.alias}</span>
        </div>
        <div style="color:#94a3b8;font-size:11px;font-family:monospace;
          background:#1e293b;border-radius:5px;padding:3px 7px;display:inline-block;margin-bottom:8px;">
          ${v.plate}
        </div>
        ${v.city ? `<div style="color:#64748b;font-size:10px;margin-bottom:8px;">📍 ${v.city}</div>` : ""}
        <div style="display:flex;gap:10px;">
          <div>
            <div style="color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:.06em;">Status</div>
            <div style="color:${color};font-size:11px;font-weight:700;margin-top:2px;">${labels[v.status] ?? v.status}</div>
          </div>
          ${v.speed > 0 ? `
          <div>
            <div style="color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:.06em;">Velocidade</div>
            <div style="color:#f1f5f9;font-size:11px;font-weight:700;margin-top:2px;">${v.speed} km/h</div>
          </div>` : ""}
        </div>
      </div>
    `;
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token === "YOUR_MAPBOX_TOKEN_HERE") {
      console.warn("[Scartrack] NEXT_PUBLIC_MAPBOX_TOKEN not set.");
      return;
    }

    let map: MapboxMapType;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      // Inject custom CSS once
      if (!document.getElementById("scartrack-map-css")) {
        const s = document.createElement("style");
        s.id = "scartrack-map-css";
        s.textContent = `
          @keyframes scartrack-ping {
            0%   { transform: scale(1);   opacity: .5; }
            70%  { transform: scale(2.4); opacity: 0;  }
            100% { transform: scale(2.4); opacity: 0;  }
          }
          .mapboxgl-popup-content {
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .mapboxgl-popup-tip      { display: none !important; }
          .mapboxgl-ctrl-logo      { display: none !important; }
          .mapboxgl-ctrl-attrib    { display: none !important; }
          .mapboxgl-ctrl-group     {
            background: #0d1521 !important;
            border: 1px solid #1e293b !important;
          }
          .mapboxgl-ctrl-group button {
            background: #0d1521 !important;
            color: #94a3b8 !important;
          }
          .mapboxgl-ctrl-group button:hover { background: #1e293b !important; }
          .mapboxgl-ctrl-scale {
            background: rgba(13,21,33,.7) !important;
            border-color: #1e293b !important;
            color: #94a3b8 !important;
            font-size: 10px !important;
          }
        `;
        document.head.appendChild(s);
      }

      mapboxgl.accessToken = token;
      styleRef.current = style;

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style,
        center,
        zoom,
        attributionControl: false,
        logoPosition: "bottom-right",
        antialias: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "bottom-right");
      map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");

      mapRef.current = map;
    };

    initMap().catch(console.error);

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add / update markers when vehicles change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      const currentIds = new Set(vehicles.map((v) => v.id));

      // Remove stale markers
      markersRef.current.forEach(({ marker, popup }, id) => {
        if (!currentIds.has(id)) {
          marker.remove(); popup.remove();
          markersRef.current.delete(id);
        }
      });

      // Add or refresh
      vehicles.forEach((vehicle) => {
        const existing = markersRef.current.get(vehicle.id);
        if (existing) {
          existing.marker.setLngLat([vehicle.longitude, vehicle.latitude]);
          existing.popup.setHTML(buildPopupHTML(vehicle));
        } else {
          const el = createMarkerElement(vehicle);

          const popup = new mapboxgl.Popup({
            offset: 24,
            closeButton: false,
            closeOnClick: false,
            maxWidth: "none",
          }).setHTML(buildPopupHTML(vehicle));

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([vehicle.longitude, vehicle.latitude])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener("mouseenter", () => popup.addTo(map));
          el.addEventListener("mouseleave", () => popup.remove());
          el.addEventListener("click",      () => onVehicleClick?.(vehicle));

          markersRef.current.set(vehicle.id, { marker, popup });
        }
      });
    };

    if (map.loaded()) {
      renderMarkers();
    } else {
      map.once("load", renderMarkers);
    }
  }, [vehicles, buildPopupHTML, createMarkerElement, onVehicleClick]);

  return <div ref={containerRef} className="w-full h-full" />;
}
