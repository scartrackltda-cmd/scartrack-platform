import { BarChart3, Download, Calendar, TrendingUp, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REPORT_TYPES = [
  {
    icon: Route,
    title: "Histórico de Rotas",
    description: "Visualize trajetos percorridos por veículo e período",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: TrendingUp,
    title: "Relatório de Velocidade",
    description: "Análise de excesso de velocidade e comportamento do condutor",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Clock,
    title: "Horas Trabalhadas",
    description: "Tempo de operação, paradas e quilometragem por veículo",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: BarChart3,
    title: "Consumo de Combustível",
    description: "Estimativa de consumo baseada em rotas e distância",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análises e exportações da frota
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Período
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="w-3.5 h-3.5" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-2 gap-4">
        {REPORT_TYPES.map((report) => (
          <Card key={report.title} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${report.bg}`}>
                  <report.icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {report.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="text-xs">
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder chart area */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Distância por Veículo (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center border border-dashed border-border/50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Gráficos disponíveis após integração com dados reais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
