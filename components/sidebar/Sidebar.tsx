"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Map,
  BarChart3,
  Settings,
  Radio,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Veículos",
    href: "/vehicles",
    icon: Car,
  },
  {
    label: "Mapa",
    href: "/map",
    icon: Map,
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-primary shadow-lg shadow-primary/25">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Scar<span className="text-primary">track</span>
          </span>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
            Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Menu Principal
        </p>

        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status bar */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-sidebar-accent">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Sistema Online</p>
            <p className="text-[10px] text-muted-foreground truncate">
              Todos os serviços ativos
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
