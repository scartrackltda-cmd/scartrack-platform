import { MapPreview } from "@/components/map/MapPreview";
import { Layers, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  return (
    <div className="flex h-full">
      {/* Full map */}
      <div className="flex-1 relative">
        <MapPreview />

        {/* Map toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2 bg-card/90 border border-border/50 backdrop-blur-sm text-xs">
            <Layers className="w-3.5 h-3.5" />
            Camadas
          </Button>
          <Button variant="secondary" size="sm" className="gap-2 bg-card/90 border border-border/50 backdrop-blur-sm text-xs">
            <Filter className="w-3.5 h-3.5" />
            Filtrar Veículos
          </Button>
        </div>
      </div>
    </div>
  );
}
