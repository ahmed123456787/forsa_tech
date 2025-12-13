import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { type ChatMessage as ChatMessageType, type MockOffer } from "@/lib/chat-service";
import { Bot, User, Wifi, FileText, Download, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Pre-compiled Arabic regex - moved outside component to avoid recreation
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Detect if text contains Arabic characters for RTL support - memoizable
const containsArabic = (text: string): boolean => ARABIC_REGEX.test(text);

// Static markdown components - defined once outside to prevent recreation on each render
const createMarkdownComponents = (isArabic: boolean) => ({
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className={cn("list-disc mb-2 space-y-1", isArabic ? "pr-4" : "pl-4")}>{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className={cn("list-decimal mb-2 space-y-1", isArabic ? "pr-4" : "pl-4")}>{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
    ) : (
      <code className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">{children}</code>
    );
  },
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className={cn("border-primary/50 bg-muted/50 px-3 py-2 rounded-r-lg my-2", isArabic ? "border-r-2" : "border-l-2")}>
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border-collapse border border-border text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => <th className="border border-border bg-muted px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-border px-2 py-1">{children}</td>,
});

// Cache for markdown components to avoid recreation
const componentsCache = new Map<boolean, ReturnType<typeof createMarkdownComponents>>();
const getMarkdownComponents = (isArabic: boolean) => {
  if (!componentsCache.has(isArabic)) {
    componentsCache.set(isArabic, createMarkdownComponents(isArabic));
  }
  return componentsCache.get(isArabic)!;
};

// Memoized Markdown content renderer
const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  const isArabic = useMemo(() => containsArabic(content), [content]);
  const components = useMemo(() => getMarkdownComponents(isArabic), [isArabic]);
  
  return (
    <div 
      className={cn("prose prose-sm dark:prose-invert max-w-none", isArabic && "text-right")}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

// Memoized inline offer card for chat
const ChatOfferCard = memo(function ChatOfferCard({ offer }: { offer: MockOffer }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/50 p-2 shadow-sm hover:shadow-md transition-all">
      <div className="card-glow-overlay" />
      <div className="relative flex items-start gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-[#2c5eaa]/15 flex items-center justify-center shrink-0">
          <Wifi className="h-3 w-3 text-[#2c5eaa]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-[13px] truncate leading-tight">{offer.name}</h4>
            {offer.badge && (
              <Badge variant="outline" className="text-[9px] border-primary/50 text-primary bg-primary/5 px-1.5 py-0.5">
                {offer.badge}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{offer.description}</p>
        </div>
      </div>

      <div className="text-[13px] font-bold text-[#00a959]">
        {offer.price.toLocaleString()} DA<span className="text-[10px] font-normal text-muted-foreground">/mois</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {offer.features?.map((feat) => (
          <Badge key={feat} variant="secondary" className="text-[9px] bg-muted text-foreground border-border/60 px-2 py-0.5">
            {feat}
          </Badge>
        ))}
      </div>

      <p className="mt-1.5 text-[10px] text-muted-foreground line-clamp-2">
        {offer.historySummary}
      </p>

      {offer.answers && (
        <div className="mt-2 rounded-md border border-dashed border-border/60 bg-muted/50 p-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground mb-1.5">
            <List className="h-3 w-3" />
            Réponses IA
          </div>
          <ul className="space-y-0.5 text-[10px] text-muted-foreground">
            {Object.entries(offer.answers).map(([qid, answer]) => (
              <li key={qid} className="leading-snug">{qid}. {answer}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button asChild variant="outline" size="sm" className="gap-1 text-[10px] h-7 px-2.5">
          <a href={offer.pdfUrl} target="_blank" rel="noreferrer">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-[10px] h-7 px-2.5">
          <a href={offer.pdfUrl} target="_blank" rel="noreferrer" aria-label={`Télécharger ${offer.name}`} title={`Télécharger ${offer.name}`}>
            <Download className="h-3.5 w-3.5" />
            Télécharger
          </a>
        </Button>
      </div>
    </div>
  );
});

// Memoized ChatMessage component with optimized rendering
export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  // Memoize formatted timestamp
  const formattedTime = useMemo(() => {
    if (!message.timestamp) return '';
    return new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.timestamp]);

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
          isUser 
            ? "bg-gradient-to-br from-[#2c5eaa] to-[#2c5eaa]/80" 
            : "bg-gradient-to-br from-[#00a959] to-[#20b471]"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}>
        {/* Header */}
        <div className={cn("flex items-center gap-2 text-xs", isUser && "flex-row-reverse")}>
          <span className="font-medium text-foreground">
            {isUser ? "Vous" : "AT Assistant"}
          </span>
          {!isUser && (
            <span className="text-muted-foreground">IA Générative</span>
          )}
          <span className="text-muted-foreground">{formattedTime}</span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 text-sm",
            isUser ? "chat-bubble-user" : "chat-bubble-assistant"
          )}
        >
          {message.offers && message.offers.length > 0 ? (
            `${message.offers.length} offres recommandées. Détails et PDF ci-dessous.`
          ) : isUser ? (
            message.content
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Offer Cards (if any) */}
        {message.offers && message.offers.length > 0 && (
          <div className="mt-2 w-full space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommandations IA</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {message.offers.map((offer) => (
              <ChatOfferCard key={offer.id} offer={offer} />
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
