import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days}d`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ONLINE: "#22C55E",
    OFFLINE: "#6B7280",
    IDLE: "#EAB308",
    MOVING: "#3B82F6",
    ALERT: "#EF4444",
  };
  return colors[status.toUpperCase()] ?? "#6B7280";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
