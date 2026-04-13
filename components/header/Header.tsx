"use client";

import { Bell, Search, ChevronDown, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockUser = {
  name: "Gabriel Silva",
  role: "Administrador",
  avatar: "GS",
};

const mockNotifications = 4;

export function Header() {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 w-72 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground hover:border-border transition-colors">
        <Search className="w-3.5 h-3.5 shrink-0" />
        <input
          type="text"
          placeholder="Buscar veículo, placa..."
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 text-foreground"
        />
        <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] text-muted-foreground/50 border border-border/50 rounded px-1 py-0.5">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle (placeholder) */}
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
          <Moon className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
          {mockNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded-full bg-destructive text-destructive-foreground">
              {mockNotifications}
            </span>
          )}
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User */}
        <button className="flex items-center gap-2.5 hover:bg-accent rounded-lg px-2 py-1.5 transition-colors group">
          {/* Avatar */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full gradient-primary text-xs font-bold text-white shrink-0">
            {mockUser.avatar}
          </div>

          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-foreground leading-tight">
              {mockUser.name}
            </p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-muted-foreground leading-tight">
                {mockUser.role}
              </p>
              <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-primary/30 text-primary/80">
                Admin
              </Badge>
            </div>
          </div>

          <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </header>
  );
}
