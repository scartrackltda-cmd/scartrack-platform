/**
 * Socket.io client for Scartrack real-time tracking
 *
 * Usage:
 *   import { getSocket } from '@/lib/socket';
 *   const socket = getSocket();
 *   socket.on('location:update', (data) => { ... });
 */

import { io, type Socket } from "socket.io-client";

// ─── Event Types ─────────────────────────────────────────────────────────────

export interface LocationUpdateEvent {
  deviceId: string;
  vehicleId: string;
  plate: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition: boolean;
  timestamp: string;
}

export interface AlertEvent {
  id: string;
  type: string;
  message: string;
  vehicleId: string;
  plate: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

export interface DeviceStatusEvent {
  deviceId: string;
  status: "ONLINE" | "OFFLINE" | "IDLE" | "MOVING" | "ALERT";
  timestamp: string;
}

// ─── Socket singleton ─────────────────────────────────────────────────────────

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

    socketInstance = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });
  }

  return socketInstance;
}

export function connectSocket(): Socket {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

export function onLocationUpdate(
  callback: (data: LocationUpdateEvent) => void
): () => void {
  const socket = getSocket();
  socket.on("location:update", callback);
  return () => socket.off("location:update", callback);
}

export function onAlert(callback: (data: AlertEvent) => void): () => void {
  const socket = getSocket();
  socket.on("alert:new", callback);
  return () => socket.off("alert:new", callback);
}

export function onDeviceStatus(
  callback: (data: DeviceStatusEvent) => void
): () => void {
  const socket = getSocket();
  socket.on("device:status", callback);
  return () => socket.off("device:status", callback);
}
