import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, RotateCcw, Wifi, Phone, Server } from "lucide-react";

interface ChatFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

export interface FilterState {
  serviceTypes: string[];
  budget: [number, number];
  sector: string | null;
}

const serviceTypes = [
  { id: "internet", label: "Internet / Fibre", icon: Wifi },
  { id: "voix", label: "Voix Fixe", icon: Phone },
  { id: "hebergement", label: "Hébergement", icon: Server },
];

const sectors = ["Entreprise", "Particulier", "Start-up", "Étudiant"];

export function ChatFilters({ onFiltersChange }: ChatFiltersProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(["internet"]);
  const [budget, setBudget] = useState<[number, number]>([1000, 5000]);
  const [selectedSector, setSelectedSector] = useState<string | null>("Entreprise");

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      const next = prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId];
      onFiltersChange?.({ serviceTypes: next, budget, sector: selectedSector });
      return next;
    });
  };

  const handleBudgetChange = (value: number[]) => {
    const newBudget: [number, number] = [value[0], value[1]];
    setBudget(newBudget);
    onFiltersChange?.({ serviceTypes: selectedServices, budget: newBudget, sector: selectedSector });
  };

  const handleSectorChange = (sector: string) => {
    const newSector = selectedSector === sector ? null : sector;
    setSelectedSector(newSector);
    onFiltersChange?.({ serviceTypes: selectedServices, budget, sector: newSector });
  };

  const handleReset = () => {
    setSelectedServices(["internet"]);
    setBudget([1000, 5000]);
    setSelectedSector("Entreprise");
    onFiltersChange?.({ serviceTypes: ["internet"], budget: [1000, 5000], sector: "Entreprise" });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          FILTRES & OPTIONS
        </div>
        <Button variant="ghost" size="sm" className="text-secondary text-xs" onClick={handleReset}>
          <RotateCcw className="h-3 w-3 mr-1" />
          Réinitialiser
        </Button>
      </div>

      {/* Service Types */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Type de service
        </h4>
        <div className="space-y-2">
          {serviceTypes.map((service) => (
            <label
              key={service.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                selectedServices.includes(service.id)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <Checkbox
                checked={selectedServices.includes(service.id)}
                onCheckedChange={() => handleServiceToggle(service.id)}
              />
              <service.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{service.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Budget mensuel (DA)
        </h4>
        <Slider
          value={budget}
          onValueChange={handleBudgetChange}
          min={1000}
          max={20000}
          step={500}
          className="w-full"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>1000</span>
          <span className="font-medium text-primary">{budget[1].toLocaleString()}+</span>
          <span>20k</span>
        </div>
      </div>

      {/* Sector */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Secteur
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {sectors.map((sector) => (
            <Button
              key={sector}
              variant={selectedSector === sector ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleSectorChange(sector)}
            >
              {sector}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
