"use client";

import { AlertTriangle, Zap, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const alerts = [
  {
    id: "1",
    type: "SPEEDING",
    message: "Excesso de velocidade",
    vehicle: "EE-22-FF",
    time: "há 2 min",
    severity: "high",
    icon: Zap,
  },
  {
    id: "2",
    type: "GEOFENCE_EXIT",
    message: "Saiu da geocerca",
    vehicle: "GG-33-HH",
    time: "há 5 min",
    severity: "medium",
    icon: MapPin,
  },
  {
    id: "3",
    type: "BATTERY_LOW",
    message: "Bateria fraca",
    vehicle: "II-44-JJ",
    time: "há 1h",
    severity: "low",
    icon: AlertTriangle,
  },
];

const severityConfig = {
  high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export function RecentAlerts() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground">Alertas Recentes</h3>
        <span className="text-[10px] text-primary cursor-pointer hover:underline">Ver todos</span>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig];
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg border",
                config.bg,
                config.border
              )}
            >
              <alert.icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground leading-tight">
                  {alert.message}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{alert.vehicle}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
