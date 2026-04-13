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
}

interface MapboxMapProps {
  vehicles?: VehicleMarkerData[];
  center?: [number, number];
  zoom?: number;
  style?: string;
  onVehicleClick?: (vehicle: VehicleMarkerData) => void;
}

const STATUS_COLORS: Record<string, string> = {
  moving: "#3B82F6",
  online: "#22C55E",
  idle: "#EAB308",
  offline: "#6B7280",
  alert: "#EF4444",
};

const DEFAULT_VEHICLES: VehicleMarkerData[] = [
  { id: "1", plate: "AA-00-BB", alias: "Caminhão 01", latitude: 41.15, longitude: -8.61, speed: 67, heading: 45, status: "moving" },
  { id: "2", plate: "CC-11-DD", alias: "Van Frota 03", latitude: 38.72, longitude: -9.14, speed: 0, heading: 0, status: "idle" },
  { id: "3", plate: "EE-22-FF", alias: "Carro 07", latitude: 37.02, longitude: -8.92, speed: 92, heading: 180, status: "moving" },
  { id: "4", plate: "GG-33-HH", alias: "Moto 02", latitude: 40.21, longitude: -8.43, speed: 0, heading: 0, status: "alert" },
  { id: "5", plate: "KK-55-LL", alias: "Bus 11", latitude: 40.64, longitude: -8.65, speed: 48, heading: 270, status: "online" },
];

export function MapboxMap({
  vehicles = DEFAULT_VEHICLES,
  center = [-8.5, 39.5],
  zoom = 6.5,
  style = "mapbox://styles/mapbox/dark-v11",
  onVehicleClick,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMapType | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; popup: Popup }>>(new Map());

  const createMarkerElement = useCallback(
    (vehicle: VehicleMarkerData): HTMLElement => {
      const color = STATUS_COLORS[vehicle.status] ?? "#6B7280";

      const el = document.createElement("div");
      el.className = "scartrack-vehicle-marker";
      el.style.cssText = `
        position: relative;
        width: 36px;
        height: 36px;
        cursor: pointer;
        transition: transform 0.15s ease;
      `;

      el.innerHTML = `
        ${vehicle.status === "moving" || vehicle.status === "alert" ? `
          <span style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: ${color};
            opacity: 0.3;
            animation: scartrack-ping 1.5s ease-in-out infinite;
            transform: scale(1.6);
          "></span>
        ` : ""}
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${color}22;
          border: 2px solid ${color};
          box-shadow: 0 0 14px ${color}55;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${color};
          "></div>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.15)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      return el;
    },
    []
  );

  const buildPopupHTML = useCallback((vehicle: VehicleMarkerData): string => {
    const color = STATUS_COLORS[vehicle.status] ?? "#6B7280";
    const statusLabels: Record<string, string> = {
      moving: "Em Movimento",
      online: "Online",
      idle: "Parado",
      offline: "Offline",
      alert: "Alerta",
    };

    return `
      <div style="
        background: #0f1623;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 12px 14px;
        min-width: 160px;
        font-family: system-ui, sans-serif;
      ">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};flex-shrink:0;"></div>
          <span style="color:#f1f5f9;font-size:13px;font-weight:600;">${vehicle.alias}</span>
        </div>
        <div style="color:#94a3b8;font-size:11px;font-family:monospace;margin-bottom:6px;">${vehicle.plate}</div>
        <div style="display:flex;gap:10px;margin-top:6px;">
          <div>
            <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Status</div>
            <div style="color:${color};font-size:11px;font-weight:600;margin-top:1px;">${statusLabels[vehicle.status] ?? vehicle.status}</div>
          </div>
          ${vehicle.speed > 0 ? `
          <div>
            <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.05em;">Velocidade</div>
            <div style="color:#f1f5f9;font-size:11px;font-weight:600;margin-top:1px;">${vehicle.speed} km/h</div>
          </div>
          ` : ""}
        </div>
      </div>
    `;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let map: MapboxMapType;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      // Inject marker animation CSS
      if (!document.getElementById("scartrack-marker-css")) {
        const style = document.createElement("style");
        style.id = "scartrack-marker-css";
        style.textContent = `
          @keyframes scartrack-ping {
            0%, 100% { transform: scale(1.6); opacity: 0.3; }
            50% { transform: scale(2.2); opacity: 0; }
          }
          .mapboxgl-popup-content {
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .mapboxgl-popup-tip { display: none !important; }
          .mapboxgl-ctrl-logo { display: none !important; }
          .mapboxgl-ctrl-attrib { display: none !important; }
        `;
        document.head.appendChild(style);
      }

      mapboxgl.accessToken = token;

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style,
        center,
        zoom,
        attributionControl: false,
        logoPosition: "bottom-right",
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "bottom-right");
      map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "bottom-right"
      );

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

  // Add/update vehicle markers whenever vehicles change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      const currentIds = new Set(vehicles.map((v) => v.id));

      // Remove markers no longer in list
      markersRef.current.forEach(({ marker, popup }, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          popup.remove();
          markersRef.current.delete(id);
        }
      });

      // Add or update markers
      vehicles.forEach((vehicle) => {
        const existing = markersRef.current.get(vehicle.id);

        if (existing) {
          existing.marker.setLngLat([vehicle.longitude, vehicle.latitude]);
          existing.popup.setHTML(buildPopupHTML(vehicle));
        } else {
          const el = createMarkerElement(vehicle);

          const popup = new mapboxgl.Popup({
            offset: 22,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(buildPopupHTML(vehicle));

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([vehicle.longitude, vehicle.latitude])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener("mouseenter", () => popup.addTo(map));
          el.addEventListener("mouseleave", () => popup.remove());
          el.addEventListener("click", () => onVehicleClick?.(vehicle));

          markersRef.current.set(vehicle.id, { marker, popup });
        }
      });
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }
  }, [vehicles, buildPopupHTML, createMarkerElement, onVehicleClick]);

  return <div ref={containerRef} className="w-full h-full" />;
}
