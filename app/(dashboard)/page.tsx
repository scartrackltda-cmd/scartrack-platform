import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { VehicleList } from "@/components/dashboard/VehicleList";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { MapPreview } from "@/components/map/MapPreview";

export default function DashboardPage() {
  return (
    <div className="flex h-full">
      {/* Mapa principal - ocupa ~75% */}
      <div className="flex-1 relative">
        <MapPreview />

        {/* Stats overlay no topo do mapa */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <DashboardStats />
        </div>
      </div>

      {/* Painel lateral direito - lista de veículos */}
      <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Veículos Ativos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monitoramento em tempo real</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <VehicleList />
        </div>

        <div className="border-t border-border">
          <RecentAlerts />
        </div>
      </div>
    </div>
  );
}
