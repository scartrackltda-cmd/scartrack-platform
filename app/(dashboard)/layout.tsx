import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header superior */}
        <Header />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
