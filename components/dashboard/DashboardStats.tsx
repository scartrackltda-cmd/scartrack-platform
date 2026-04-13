"use client";

import { Car, Activity, AlertTriangle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Total Veículos",
    value: "124",
    change: "+3 este mês",
    icon: Car,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    label: "Em Movimento",
    value: "87",
    change: "70% da frota",
    icon: Activity,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    label: "Alertas Ativos",
    value: "4",
    change: "2 críticos",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    label: "Offline",
    value: "12",
    change: "Última hora",
    icon: MapPin,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md",
            "bg-card/80",
            stat.border
          )}
        >
          <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", stat.bg)}>
            <stat.icon className={cn("w-4 h-4", stat.color)} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            <p className={cn("text-[10px] mt-0.5", stat.color)}>{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
