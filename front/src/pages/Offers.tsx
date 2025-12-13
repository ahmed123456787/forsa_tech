import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { OfferCard } from "@/components/cards/OfferCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getOffers, type Offer } from "@/lib/appwrite";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function OffersPage() {
  const { t, language } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const data = await getOffers();
        setOffers(data);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('ourOffers').split(' ')[0]} <span className="text-gradient-at">{t('ourOffers').split(' ').slice(1).join(' ') || t('offers')}</span></h1>
          <p className="text-muted-foreground">
            {t('discoverOffers')}
          </p>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offers.map((offer) => (
              <OfferCard 
                key={offer.$id} 
                offer={offer} 
                onViewDetails={setSelectedOffer}
              />
            ))}
          </div>
        )}

        {/* Offer Detail Modal */}
        <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <DialogTitle className="text-xl">{selectedOffer?.name}</DialogTitle>
                {selectedOffer?.badge && (
                  <Badge variant="outline" className="border-primary text-primary">
                    {selectedOffer.badge}
                  </Badge>
                )}
              </div>
            </DialogHeader>
            
            {selectedOffer && (
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedOffer.description}</p>
                
                {/* Features */}
                {selectedOffer.features && (
                  <div className="space-y-2">
                    <h4 className="font-medium">{t('characteristics')}</h4>
                    <ul className="space-y-1">
                      {selectedOffer.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price */}
                <div className="rounded-lg bg-muted p-4">
                  <div className="text-3xl font-bold">
                    {selectedOffer.price.toLocaleString()} <span className="text-base font-normal">DA/{t('month')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1">{t('subscribe')}</Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
