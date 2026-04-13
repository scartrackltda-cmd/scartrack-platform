"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Layers, ZoomIn, ZoomOut, Navigation, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Simulated vehicle positions for the placeholder
const MOCK_VEHICLES = [
  { id: "1", lat: 41.5, lng: -8.4, plate: "AA-00-BB", status: "moving", speed: 67 },
  { id: "2", lat: 38.7, lng: -9.1, plate: "CC-11-DD", status: "idle", speed: 0 },
  { id: "3", lat: 37.0, lng: -8.9, plate: "EE-22-FF", status: "online", speed: 92 },
  { id: "4", lat: 40.6, lng: -8.6, plate: "GG-33-HH", status: "alert", speed: 0 },
];

const STATUS_COLORS: Record<string, string> = {
  moving: "#3B82F6",
  online: "#22C55E",
  idle: "#EAB308",
  offline: "#6B7280",
  alert: "#EF4444",
};

export function MapPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(6);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    setHasToken(!!token && token !== "YOUR_MAPBOX_TOKEN_HERE");
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#0f1923]">

      {/* ─── MAPBOX INTEGRATION POINT ────────────────────────────────────────────
       *
       * TODO: Substituir este placeholder pelo mapa real do Mapbox GL JS.
       *
       * Passos para integrar:
       * 1. Instale: npm install mapbox-gl @types/mapbox-gl
       * 2. Adicione seu token em .env: NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiXXXX
       * 3. Inicialize o mapa com:
       *
       *    import mapboxgl from 'mapbox-gl';
       *    import 'mapbox-gl/dist/mapbox-gl.css';
       *
       *    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
       *    const map = new mapboxgl.Map({
       *      container: containerRef.current!,
       *      style: 'mapbox://styles/mapbox/dark-v11',
       *      center: [-8.5, 39.5],
       *      zoom: 6,
       *    });
       *
       * ─────────────────────────────────────────────────────────────────────── */}

      {/* Placeholder background - SVG grid simulating map */}
      <MapPlaceholderBackground />

      {/* Simulated vehicle markers */}
      {MOCK_VEHICLES.map((v, i) => (
        <VehicleMarker key={v.id} vehicle={v} index={i} />
      ))}

      {/* Map controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        <Button
          variant="secondary"
          size="icon"
          className="w-8 h-8 bg-card/90 border border-border/50 hover:bg-accent shadow-lg"
          onClick={() => setZoom((z) => Math.min(z + 1, 20))}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="w-8 h-8 bg-card/90 border border-border/50 hover:bg-accent shadow-lg"
          onClick={() => setZoom((z) => Math.max(z - 1, 1))}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <div className="w-8 h-px bg-border my-0.5" />
        <Button
          variant="secondary"
          size="icon"
          className="w-8 h-8 bg-card/90 border border-border/50 hover:bg-accent shadow-lg"
        >
          <Navigation className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="w-8 h-8 bg-card/90 border border-border/50 hover:bg-accent shadow-lg"
        >
          <Layers className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="w-8 h-8 bg-card/90 border border-border/50 hover:bg-accent shadow-lg"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/60 bg-card/70 px-2 py-1 rounded border border-border/30">
        Zoom: {zoom}
      </div>

      {/* Mapbox token notice */}
      {!hasToken && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 bg-card/95 border border-primary/30 rounded-lg px-4 py-2 shadow-xl backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Configure{" "}
              <code className="text-primary font-mono text-[10px] bg-primary/10 px-1 rounded">
                NEXT_PUBLIC_MAPBOX_TOKEN
              </code>{" "}
              no <code className="text-xs font-mono">.env</code> para ativar o mapa
            </p>
          </div>
        </div>
      )}

      {/* Live badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-card/80 border border-border/50 rounded-full px-3 py-1 backdrop-blur-sm">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[10px] font-medium text-foreground/80">AO VIVO</span>
      </div>
    </div>
  );
}

function MapPlaceholderBackground() {
  return (
    <div className="absolute inset-0">
      {/* Dark map background */}
      <div className="absolute inset-0 bg-[#0f1923]" />

      {/* Grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Simulated roads/terrain */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        {/* Horizontal roads */}
        <line x1="0" y1="30%" x2="100%" y2="32%" stroke="#4B5563" strokeWidth="2" />
        <line x1="0" y1="55%" x2="100%" y2="53%" stroke="#4B5563" strokeWidth="3" />
        <line x1="0" y1="75%" x2="100%" y2="77%" stroke="#4B5563" strokeWidth="1.5" />
        {/* Vertical roads */}
        <line x1="20%" y1="0" x2="22%" y2="100%" stroke="#4B5563" strokeWidth="2" />
        <line x1="50%" y1="0" x2="48%" y2="100%" stroke="#4B5563" strokeWidth="3" />
        <line x1="80%" y1="0" x2="79%" y2="100%" stroke="#4B5563" strokeWidth="1.5" />
        {/* Diagonal road */}
        <line x1="0" y1="100%" x2="60%" y2="0" stroke="#374151" strokeWidth="1.5" />
        {/* Water/region */}
        <ellipse cx="70%" cy="40%" rx="15%" ry="10%" fill="#1E3A5F" opacity="0.5" />
        <ellipse cx="15%" cy="70%" rx="8%" ry="5%" fill="#1E3A5F" opacity="0.3" />
      </svg>

      {/* Radial glow in center */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

function VehicleMarker({
  vehicle,
  index,
}: {
  vehicle: (typeof MOCK_VEHICLES)[0];
  index: number;
}) {
  const positions = [
    { top: "28%", left: "22%" },
    { top: "62%", left: "48%" },
    { top: "45%", left: "68%" },
    { top: "72%", left: "30%" },
  ];

  const pos = positions[index] ?? { top: "50%", left: "50%" };
  const color = STATUS_COLORS[vehicle.status] ?? "#6B7280";

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Ping animation for moving vehicles */}
      {vehicle.status === "moving" && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-50"
          style={{ backgroundColor: color, transform: "scale(2)" }}
        />
      )}

      {/* Marker */}
      <div
        className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg transition-transform group-hover:scale-110"
        style={{
          backgroundColor: `${color}20`,
          borderColor: color,
          boxShadow: `0 0 12px ${color}40`,
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl">
          <p className="font-semibold text-foreground">{vehicle.plate}</p>
          <p className="text-muted-foreground">
            {vehicle.speed > 0 ? `${vehicle.speed} km/h` : "Parado"}
          </p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
      </div>
    </div>
  );
}
