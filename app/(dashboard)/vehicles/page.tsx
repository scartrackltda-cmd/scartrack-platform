import { Car, Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VEHICLES = [
  { id: "1", plate: "AA-00-BB", alias: "Caminhão 01", type: "TRUCK", brand: "Volvo", model: "FH 500", year: 2022, status: "moving", driver: "João Silva", speed: 67 },
  { id: "2", plate: "CC-11-DD", alias: "Van Frota 03", type: "VAN", brand: "Mercedes", model: "Sprinter", year: 2021, status: "idle", driver: "Maria Costa", speed: 0 },
  { id: "3", plate: "EE-22-FF", alias: "Carro 07", type: "CAR", brand: "Toyota", model: "Corolla", year: 2023, status: "online", driver: "Pedro Mota", speed: 92 },
  { id: "4", plate: "GG-33-HH", alias: "Moto 02", type: "MOTORCYCLE", brand: "Honda", model: "CB 500", year: 2020, status: "alert", driver: "Ana Lima", speed: 0 },
  { id: "5", plate: "II-44-JJ", alias: "Truck 05", type: "TRUCK", brand: "Scania", model: "R 450", year: 2019, status: "offline", driver: "—", speed: 0 },
];

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  moving: { label: "Em Movimento", variant: "default" },
  online: { label: "Online", variant: "default" },
  idle: { label: "Parado", variant: "secondary" },
  offline: { label: "Offline", variant: "outline" },
  alert: { label: "Alerta", variant: "destructive" },
};

export default function VehiclesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Veículos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie toda a frota de veículos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            Novo Veículo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total", value: "124", color: "text-foreground" },
          { label: "Em Movimento", value: "87", color: "text-blue-400" },
          { label: "Parados", value: "25", color: "text-yellow-400" },
          { label: "Offline", value: "12", color: "text-gray-400" },
          { label: "Alertas", value: "4", color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Lista de Veículos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar placa, alias..."
                  className="bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 w-40"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Filter className="w-3 h-3" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Veículo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Placa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Condutor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Velocidade</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {VEHICLES.map((v) => {
                const status = STATUS_LABELS[v.status] ?? STATUS_LABELS.offline;
                return (
                  <tr key={v.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60">
                          <Car className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{v.alias}</p>
                          <p className="text-[10px] text-muted-foreground">{v.brand} {v.model} {v.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-foreground">{v.plate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{v.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-foreground">{v.driver}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-foreground">
                        {v.speed > 0 ? `${v.speed} km/h` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant} className="text-[10px]">
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Ver
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
