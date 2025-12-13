import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConventionCard } from "@/components/cards/ConventionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getConventions, downloadDocument, type Convention } from "@/lib/appwrite";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function ConventionsPage() {
  const { t, language } = useLanguage();
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);

  useEffect(() => {
    const fetchConventions = async () => {
      setLoading(true);
      try {
        const data = await getConventions();
        setConventions(data);
      } catch (error) {
        console.error("Error fetching conventions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConventions();
  }, []);

  const handleDownload = (convention: Convention) => {
    downloadDocument(convention.pdfFileId || "mock-id", `${convention.title}.pdf`);
  };

  const getLocale = () => {
    if (language === 'ar') return 'ar-DZ';
    if (language === 'en') return 'en-US';
    return 'fr-FR';
  };

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2"><span className="text-gradient-at">{t('conventions')}</span> {t('partners')}</h1>
          <p className="text-muted-foreground">
            {t('consultDownload')}
          </p>
        </div>

        {/* Conventions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conventions.map((convention) => (
              <ConventionCard 
                key={convention.$id} 
                convention={convention}
                onView={setSelectedConvention}
              />
            ))}
          </div>
        )}

        {/* Convention Detail Modal */}
        <Dialog open={!!selectedConvention} onOpenChange={() => setSelectedConvention(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedConvention?.title}</DialogTitle>
            </DialogHeader>
            
            {selectedConvention && (
              <div className="space-y-6">
                <p className="text-muted-foreground">{selectedConvention.description}</p>
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('signatureDate')}</p>
                    <p className="font-medium">
                      {new Date(selectedConvention.signedDate).toLocaleDateString(getLocale())}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t('validUntil')}</p>
                    <p className="font-medium">
                      {new Date(selectedConvention.validUntil).toLocaleDateString(getLocale())}
                    </p>
                  </div>
                </div>

                {/* PDF Preview Placeholder */}
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('pdfPreviewNotAvailable')}
                  </p>
                  <Button 
                    variant="secondary" 
                    className="gap-2"
                    onClick={() => handleDownload(selectedConvention)}
                  >
                    <Download className="h-4 w-4" />
                    {t('downloadPdf')}
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
