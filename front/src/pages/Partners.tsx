import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PartnerCard } from "@/components/cards/PartnerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getPartners, type Partner } from "@/lib/appwrite";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, FileText, ExternalLink } from "lucide-react";

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const data = await getPartners();
        setPartners(data);
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nos Partenaires</h1>
          <p className="text-muted-foreground">
            Découvrez notre réseau de partenaires
          </p>
        </div>

        {/* Partners Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-14 w-14 rounded-xl mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <PartnerCard 
                key={partner.$id} 
                partner={partner}
                onView={setSelectedPartner}
              />
            ))}
          </div>
        )}

        {/* Partner Detail Modal */}
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedPartner?.name}</DialogTitle>
                  <p className="text-sm text-secondary">{selectedPartner?.sector}</p>
                </div>
              </div>
            </DialogHeader>
            
            {selectedPartner && (
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedPartner.description}</p>
                
                {/* Stats */}
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedPartner.conventionsCount}</span>
                    <span className="text-muted-foreground">conventions actives</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1">Voir les conventions</Button>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Site web
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
