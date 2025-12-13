import { type Partner } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Building2, FileText } from "lucide-react";

interface PartnerCardProps {
  partner: Partner;
  onView?: (partner: Partner) => void;
}

export function PartnerCard({ partner, onView }: PartnerCardProps) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-at-card-hover">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
        <Building2 className="h-7 w-7 text-primary" />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-foreground mb-1">{partner.name}</h3>
      <p className="text-sm text-secondary mb-2">{partner.sector}</p>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {partner.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <FileText className="h-4 w-4" />
        <span>{partner.conventionsCount} conventions actives</span>
      </div>

      {/* Action */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onView?.(partner)}
      >
        Voir les détails
      </Button>
    </div>
  );
}
