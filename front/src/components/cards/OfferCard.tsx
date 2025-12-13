import { cn } from "@/lib/utils";
import { type Offer } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Wifi } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface OfferCardProps {
  offer: Offer;
  variant?: "default" | "compact";
  onViewDetails?: (offer: Offer) => void;
}

export function OfferCard({ offer, variant = "default", onViewDetails }: OfferCardProps) {
  const { t } = useLanguage();
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isCompact && "p-3"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#2c5eaa]/20 to-[#2c5eaa]/10 transition-transform duration-300 group-hover:scale-110">
          <Wifi className="h-5 w-5 text-[#2c5eaa]" />
        </div>
        {offer.badge && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium",
              offer.badge === "RECOMMANDÉ" && "border-[#00a959] text-[#00a959] bg-[#00a959]/10",
              offer.badge === "PACK STARTUP" && "border-purple-500 text-purple-500 bg-purple-500/10",
              offer.badge === "ÉTUDIANT" && "border-orange-500 text-orange-500 bg-orange-500/10"
            )}
          >
            {offer.badge}
          </Badge>
        )}
      </div>

      {/* Content */}
      <h3 className={cn("font-semibold text-foreground mb-1", isCompact ? "text-sm" : "text-base")}>
        {offer.name}
      </h3>
      <p className={cn("text-muted-foreground line-clamp-2 mb-3", isCompact ? "text-xs" : "text-sm")}>
        {offer.description}
      </p>

      {/* Price & Action */}
      <div className="flex items-center justify-between">
        <div>
          <span className={cn("font-bold text-[#00a959]", isCompact ? "text-lg" : "text-xl")}>
            {offer.price.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground"> DA</span>
          <span className="text-xs text-muted-foreground">/{t('month')}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#2c5eaa] hover:text-[#2c5eaa] hover:bg-[#2c5eaa]/10 gap-1"
          onClick={() => onViewDetails?.(offer)}
        >
          {t('viewDetails')}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
