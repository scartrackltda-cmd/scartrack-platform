"use client";

import dynamic from "next/dynamic";
import { Layers, ZoomIn, ZoomOut, Navigation, Maximize2, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { VehicleMarkerData } from "./MapboxMap";

// Load Mapbox client-side only (no SSR)
const MapboxMap = dynamic(
  () => import("./MapboxMap").then((m) => m.MapboxMap),
  {
    ssr: false,
    loading: () => <MapLoadingState />,
  }
);

const MOCK_VEHICLES: VehicleMarkerData[] = [
  { id: "1", plate: "AA-00-BB", alias: "Caminhão 01",  latitude: 41.15, longitude: -8.61, speed: 67, heading: 45,  status: "moving"  },
  { id: "2", plate: "CC-11-DD", alias: "Van Frota 03", latitude: 38.72, longitude: -9.14, speed: 0,  heading: 0,   status: "idle"    },
  { id: "3", plate: "EE-22-FF", alias: "Carro 07",     latitude: 37.02, longitude: -8.92, speed: 92, heading: 180, status: "moving"  },
  { id: "4", plate: "GG-33-HH", alias: "Moto 02",      latitude: 40.21, longitude: -8.43, speed: 0,  heading: 0,   status: "alert"   },
  { id: "5", plate: "KK-55-LL", alias: "Bus 11",       latitude: 40.64, longitude: -8.65, speed: 48, heading: 270, status: "online"  },
];

const MAP_STYLES = [
  { id: "dark-v11",     label: "Dark",     style: "mapbox://styles/mapbox/dark-v11"     },
  { id: "satellite",    label: "Satélite", style: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "streets-v12",  label: "Streets",  style: "mapbox://styles/mapbox/streets-v12"  },
  { id: "navigation",   label: "Navegação",style: "mapbox://styles/mapbox/navigation-night-v1" },
];

export function MapPreview() {
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0]);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMarkerData | null>(null);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f1923]">

      {/* Real Mapbox map */}
      <MapboxMap
        vehicles={MOCK_VEHICLES}
        center={[-8.5, 39.5]}
        zoom={6.5}
        style={mapStyle.style}
        onVehicleClick={(v) => setSelectedVehicle(v)}
      />

      {/* Live badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-card/80 border border-border/50 rounded-full px-3 py-1 backdrop-blur-sm pointer-events-none">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[10px] font-medium text-foreground/80">AO VIVO</span>
      </div>

      {/* Map style switcher */}
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-card/90 border border-border/50 backdrop-blur-sm text-xs shadow-lg"
            onClick={() => setShowStyleMenu((v) => !v)}
          >
            <Satellite className="w-3.5 h-3.5" />
            {mapStyle.label}
          </Button>

          {showStyleMenu && (
            <div className="absolute top-full left-0 mt-1.5 bg-card border border-border rounded-lg shadow-xl overflow-hidden w-36">
              {MAP_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setMapStyle(s); setShowStyleMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-accent ${
                    mapStyle.id === s.id ? "text-primary bg-primary/10" : "text-foreground/70"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle info card when selected */}
      {selectedVehicle && (
        <div className="absolute bottom-8 left-4 z-20 bg-card border border-border rounded-xl p-3 shadow-xl w-56 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground">{selectedVehicle.alias}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{selectedVehicle.plate}</p>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-muted-foreground hover:text-foreground text-xs leading-none"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-muted/40 rounded-lg px-2.5 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Velocidade</p>
              <p className="text-xs font-bold text-foreground mt-0.5">
                {selectedVehicle.speed > 0 ? `${selectedVehicle.speed} km/h` : "Parado"}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg px-2.5 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Status</p>
              <p className="text-xs font-bold text-primary mt-0.5 capitalize">{selectedVehicle.status}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="w-full mt-2.5 text-[10px] h-7">
            Ver Detalhes
          </Button>
        </div>
      )}
    </div>
  );
}

function MapLoadingState() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0f1923]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-primary animate-spin border-t-transparent" />
        </div>
        <p className="text-xs text-muted-foreground">Carregando mapa...</p>
      </div>
    </div>
  );
}
