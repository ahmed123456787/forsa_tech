import { type Convention, downloadDocument } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ConventionCardProps {
  convention: Convention;
  onView?: (convention: Convention) => void;
}

export function ConventionCard({ convention, onView }: ConventionCardProps) {
  const { t, language } = useLanguage();
  
  const handleDownload = () => {
    downloadDocument(convention.pdfFileId || "mock-id", `${convention.title}.pdf`);
  };

  const getLocale = () => {
    if (language === 'ar') return 'ar-DZ';
    if (language === 'en') return 'en-US';
    return 'fr-FR';
  };

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a959]/20 to-[#20b471]/20 mb-4 transition-transform duration-300 group-hover:scale-110">
        <FileText className="h-6 w-6 text-[#00a959]" />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-foreground mb-2">{convention.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {convention.description}
      </p>

      {/* Date Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Calendar className="h-3 w-3" />
        <span>{t('validUntil')} {new Date(convention.validUntil).toLocaleDateString(getLocale())}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-[#2c5eaa]/30 text-[#2c5eaa] hover:bg-[#2c5eaa]/10 hover:border-[#2c5eaa]/50"
          onClick={() => onView?.(convention)}
        >
          {t('viewDetails')}
        </Button>
        <Button
          size="sm"
          className="gap-1 bg-[#00a959] hover:bg-[#00a959]/90 text-white"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
          PDF
        </Button>
      </div>
    </div>
  );
}
