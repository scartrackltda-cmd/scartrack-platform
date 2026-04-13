import { Settings, Bell, Shield, Database, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SETTINGS_SECTIONS = [
  {
    icon: Globe,
    title: "Geral",
    description: "Nome da empresa, fuso horário e idioma",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Configure alertas e notificações por e-mail/push",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Autenticação de dois fatores, sessões e senhas",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Database,
    title: "Integrações",
    description: "API, webhooks e conexões com sistemas externos",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Palette,
    title: "Aparência",
    description: "Tema, cores e personalização da interface",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Personalize a plataforma Scartrack
        </p>
      </div>

      {/* Profile card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Perfil da Conta</CardTitle>
          <CardDescription className="text-xs">
            Informações do usuário administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full gradient-primary text-lg font-bold text-white">
              GS
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Gabriel Silva</p>
              <p className="text-xs text-muted-foreground">gabriel@scartrack.com</p>
              <p className="text-xs text-primary mt-0.5">Administrador</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings sections */}
      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => (
          <Card
            key={section.title}
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${section.bg} shrink-0`}>
                  <section.icon className={`w-4 h-4 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {section.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {section.description}
                  </p>
                </div>
                <Settings className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Danger zone */}
      <Card className="bg-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-destructive">Zona de Perigo</CardTitle>
          <CardDescription className="text-xs">
            Ações irreversíveis — proceda com cuidado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" className="text-xs">
            Excluir Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
