"use client";

import dynamic from "next/dynamic";
import { Satellite, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { VehicleMarkerData } from "./MapboxMap";
import { DEFAULT_VEHICLES } from "./MapboxMap";

// Load Mapbox client-side only (no SSR — window/document required)
const MapboxMap = dynamic(
  () => import("./MapboxMap").then((m) => m.MapboxMap),
  { ssr: false, loading: () => <MapLoadingState /> }
);

const MAP_STYLES = [
  { id: "dark",      label: "Dark",      icon: "🌑", style: "mapbox://styles/mapbox/dark-v11"                     },
  { id: "satellite", label: "Satélite",  icon: "🛰️", style: "mapbox://styles/mapbox/satellite-streets-v12"        },
  { id: "streets",   label: "Streets",   icon: "🗺️", style: "mapbox://styles/mapbox/streets-v12"                  },
  { id: "night",     label: "Navegação", icon: "🚗", style: "mapbox://styles/mapbox/navigation-night-v1"          },
];

const STATUS_LABELS: Record<string, string> = {
  moving: "Em Movimento", online: "Online",
  idle: "Parado", offline: "Offline", alert: "Alerta",
};
const STATUS_COLORS: Record<string, string> = {
  moving: "text-blue-400", online: "text-green-400",
  idle: "text-yellow-400", offline: "text-gray-400", alert: "text-red-400",
};

export function MapPreview() {
  const [mapStyle, setMapStyle]           = useState(MAP_STYLES[0]);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [selected, setSelected]           = useState<VehicleMarkerData | null>(null);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d1521]">

      {/* ── Real Mapbox map (Brazil-centered) ──────────────────── */}
      <MapboxMap
        vehicles={DEFAULT_VEHICLES}
        center={[-50.0, -14.0]}
        zoom={4.0}
        style={mapStyle.style}
        onVehicleClick={setSelected}
      />

      {/* ── LIVE badge ─────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm pointer-events-none">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[10px] font-semibold text-white/80 tracking-wide">AO VIVO</span>
      </div>

      {/* ── Map style switcher ──────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowStyleMenu((v) => !v)}
            className="gap-2 bg-black/60 border border-white/10 backdrop-blur-sm text-xs text-white/80 hover:bg-black/70 shadow-lg"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>{mapStyle.icon} {mapStyle.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showStyleMenu ? "rotate-180" : ""}`} />
          </Button>

          {showStyleMenu && (
            <div className="absolute top-full left-0 mt-1.5 bg-[#0d1521] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden w-40 py-1">
              {MAP_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setMapStyle(s); setShowStyleMenu(false); }}
                  className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 transition-colors hover:bg-white/5 ${
                    mapStyle.id === s.id
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-white/60"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                  {mapStyle.id === s.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Vehicles counter badge ──────────────────────────────── */}
      <div className="absolute top-14 left-4 z-20 flex flex-col gap-1.5">
        {[
          { status: "moving",  count: DEFAULT_VEHICLES.filter(v => v.status === "moving").length,  color: "bg-blue-500/20 border-blue-500/30 text-blue-400" },
          { status: "idle",    count: DEFAULT_VEHICLES.filter(v => v.status === "idle").length,    color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" },
          { status: "alert",   count: DEFAULT_VEHICLES.filter(v => v.status === "alert").length,   color: "bg-red-500/20 border-red-500/30 text-red-400" },
          { status: "offline", count: DEFAULT_VEHICLES.filter(v => v.status === "offline").length, color: "bg-gray-500/20 border-gray-500/30 text-gray-400" },
        ].filter(b => b.count > 0).map(b => (
          <div key={b.status} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-sm text-[10px] font-semibold ${b.color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {b.count} {STATUS_LABELS[b.status]}
          </div>
        ))}
      </div>

      {/* ── Selected vehicle card ───────────────────────────────── */}
      {selected && (
        <div className="absolute bottom-10 left-4 z-20 w-60 bg-[#0d1521]/95 border border-[#1e293b] rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-sm font-bold text-white leading-tight">{selected.alias}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 bg-slate-800 px-1.5 py-0.5 rounded inline-block">{selected.plate}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-white transition-colors text-sm leading-none mt-0.5"
            >
              ✕
            </button>
          </div>

          {/* City */}
          {selected.city && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-3">
              <MapPin className="w-3 h-3 shrink-0" />
              {selected.city}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-800/60 rounded-xl px-3 py-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">Velocidade</p>
              <p className="text-sm font-bold text-white mt-1">
                {selected.speed > 0 ? `${selected.speed} km/h` : "Parado"}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-xl px-3 py-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">Status</p>
              <p className={`text-sm font-bold mt-1 ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </p>
            </div>
          </div>

          <Button size="sm" variant="outline" className="w-full text-[11px] h-8 border-slate-700 hover:bg-slate-800 text-slate-300">
            Ver Detalhes Completos
          </Button>
        </div>
      )}
    </div>
  );
}

function MapLoadingState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1521] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-ping [animation-delay:-.5s]" />
        <div className="absolute inset-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white/70">Carregando mapa...</p>
        <p className="text-[10px] text-white/30 mt-1">Inicializando Mapbox GL</p>
      </div>
    </div>
  );
}
