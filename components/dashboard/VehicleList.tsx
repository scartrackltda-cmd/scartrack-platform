"use client";

import { cn } from "@/lib/utils";
import { Car, Navigation, Wifi, WifiOff, AlertCircle, Clock } from "lucide-react";

type VehicleStatus = "moving" | "idle" | "offline" | "alert" | "online";

interface Vehicle {
  id: string;
  plate: string;
  alias: string;
  driver: string;
  status: VehicleStatus;
  speed: number;
  lastUpdate: string;
  location: string;
}

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "1",
    plate: "AA-00-BB",
    alias: "Caminhão 01",
    driver: "João Silva",
    status: "moving",
    speed: 67,
    lastUpdate: "agora",
    location: "Porto, PT",
  },
  {
    id: "2",
    plate: "CC-11-DD",
    alias: "Van Frota 03",
    driver: "Maria Costa",
    status: "idle",
    speed: 0,
    lastUpdate: "2 min",
    location: "Lisboa, PT",
  },
  {
    id: "3",
    plate: "EE-22-FF",
    alias: "Carro 07",
    driver: "Pedro Mota",
    status: "online",
    speed: 92,
    lastUpdate: "agora",
    location: "Faro, PT",
  },
  {
    id: "4",
    plate: "GG-33-HH",
    alias: "Moto 02",
    driver: "Ana Lima",
    status: "alert",
    speed: 0,
    lastUpdate: "5 min",
    location: "Coimbra, PT",
  },
  {
    id: "5",
    plate: "II-44-JJ",
    alias: "Truck 05",
    driver: "—",
    status: "offline",
    speed: 0,
    lastUpdate: "1h",
    location: "Braga, PT",
  },
  {
    id: "6",
    plate: "KK-55-LL",
    alias: "Bus 11",
    driver: "Carlos Nunes",
    status: "moving",
    speed: 48,
    lastUpdate: "agora",
    location: "Aveiro, PT",
  },
];

const statusConfig: Record<VehicleStatus, { label: string; dot: string; icon: typeof Car }> = {
  moving: { label: "Em Movimento", dot: "bg-blue-500", icon: Navigation },
  online: { label: "Online", dot: "bg-green-500", icon: Wifi },
  idle: { label: "Parado", dot: "bg-yellow-500", icon: Clock },
  offline: { label: "Offline", dot: "bg-gray-500", icon: WifiOff },
  alert: { label: "Alerta", dot: "bg-red-500", icon: AlertCircle },
};

export function VehicleList() {
  return (
    <div className="divide-y divide-border/50">
      {MOCK_VEHICLES.map((vehicle) => {
        const config = statusConfig[vehicle.status];
        return (
          <button
            key={vehicle.id}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left group"
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60 shrink-0 mt-0.5">
              <Car className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground truncate">{vehicle.alias}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{vehicle.lastUpdate}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{vehicle.plate}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{vehicle.location}</p>

              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      vehicle.status === "moving" && "text-blue-400",
                      vehicle.status === "online" && "text-green-400",
                      vehicle.status === "idle" && "text-yellow-400",
                      vehicle.status === "offline" && "text-gray-400",
                      vehicle.status === "alert" && "text-red-400"
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                {vehicle.speed > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    · {vehicle.speed} km/h
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
