import { useState, useCallback, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, FileText, X, Sparkles, Clock, ExternalLink, Package, FileCheck, Store, BookOpen, Filter } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { AI_CATEGORIES, type CategoryId } from "@/lib/ai-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AI_SERVER_URL =
  import.meta.env.VITE_AI_SERVER_URL ||
  "https://w40hsb4s-8001.euw.devtunnels.ms";

// Types for the search API
interface FileReference {
  file_name: string;
  file_path: string | null;
  file_type: string;
  page_number: number | null;
  chunk_index: number | null;
  source: string | null;
  category: string;
  document_id: string | null;
  formatted: string;
}

interface SearchResult {
  id: number;
  content: string;
  snippet: string;
  relevance_score: number;
  file_reference: FileReference;
  file_name: string;
  page_number: number | null;
  category: string;
  source: string | null;
}

interface SearchResponse {
  success: boolean;
  search_type: string;
  query: string;
  keywords: string[];
  category: string;
  total_found: number;
  results: SearchResult[];
  files_referenced: Array<FileReference & { result_count: number }>;
  processing_time: number;
  timestamp: string;
}

// Extract keywords from query
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 5);
}

// Category icons map
const CATEGORY_ICONS: Record<CategoryId | string, React.ReactNode> = {
  'Offres': <Package className="h-5 w-5" />,
  'Convention': <FileCheck className="h-5 w-5" />,
  'Depot_Vente': <Store className="h-5 w-5" />,
  'Guide_NGBSS': <BookOpen className="h-5 w-5" />,
};

export default function SearchPage() {
  const { t, language } = useLanguage();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [resultCount, setResultCount] = useState<number>(10);
  const [searchMeta, setSearchMeta] = useState<{
    total: number;
    time: number;
    keywords: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get category label based on language
  const getCategoryLabel = useCallback((category: typeof AI_CATEGORIES[number]) => {
    if (language === 'ar') return category.labelAr;
    if (language === 'en') return category.labelEn;
    return category.label;
  }, [language]);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const keywords = extractKeywords(query);
      
      const requestBody: {
        query: string;
        keywords: string[];
        top_k: number;
        category?: CategoryId;
      } = {
        query: query.trim(),
        keywords,
        top_k: resultCount,
      };

      if (selectedCategory) {
        requestBody.category = selectedCategory;
      }

      const response = await fetch(`${AI_SERVER_URL}/api/search/hybrid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.results);
        setSearchMeta({
          total: data.total_found,
          time: data.processing_time,
          keywords: data.keywords,
        });
      } else {
        throw new Error('Search returned unsuccessful response');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(t('errorOccurred') || 'An error occurred during search');
      setResults([]);
      setSearchMeta(null);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, resultCount, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleClearSearch = () => {
    setQuery("");
    setSelectedCategory(null);
    setResultCount(10);
    setResults([]);
    setSearchMeta(null);
    setError(null);
  };

  // Format relevance score as percentage
  const formatRelevance = (score: number) => Math.round(score * 100);

  // Memoized category cards
  const categoryCards = useMemo(() => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {AI_CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(prev => prev === category.id ? null : category.id)}
          className={cn(
            "p-4 rounded-xl border transition-all duration-200 text-left",
            "hover:shadow-md hover:scale-[1.02]",
            selectedCategory === category.id
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
            selectedCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {CATEGORY_ICONS[category.id]}
          </div>
          <p className="font-medium text-sm">{getCategoryLabel(category)}</p>
        </button>
      ))}
    </div>
  ), [selectedCategory, getCategoryLabel]);

  return (
    <MainLayout>
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">{t('aiPowered') || 'Recherche IA'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {t('search')} <span className="text-gradient-at">{t('advancedSearch').split(' ').pop()}</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('advancedSearchDesc') || 'Recherchez dans notre base de connaissances avec l\'IA'}
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('filterByCategory') || 'Filtrer par catégorie'}
              </span>
              {selectedCategory && (
                <Badge variant="secondary" className="ml-2">
                  {AI_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory(null)} className="ml-1 hover:text-destructive" aria-label={t('clearSearch')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            
            {/* Result Count Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('numberOfResults') || 'Nombre de résultats'}:
              </span>
              <Select value={String(resultCount)} onValueChange={(val) => setResultCount(Number(val))}>
                <SelectTrigger className="w-24 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {categoryCards}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder') || 'Rechercher des offres, conventions...'}
                className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t('clearSearch')}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90"
              disabled={loading || !query.trim()}
            >
              <SearchIcon className="h-5 w-5 mr-2" />
              {t('search')}
            </Button>
          </div>
        </form>

        {/* Search Meta Info */}
        {searchMeta && !loading && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{searchMeta.total}</span>
              <span className="text-muted-foreground">{t('resultsFor') || 'résultats trouvés'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{searchMeta.time.toFixed(2)}s</span>
            </div>
            {searchMeta.keywords.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{t('keywords') || 'Mots-clés'}:</span>
                {searchMeta.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            // Loading Skeletons
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-2xl border border-border bg-card">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            // Results Cards
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={cn(
                    "group p-6 rounded-2xl border transition-all duration-300",
                    "bg-card hover:shadow-lg hover:shadow-primary/5",
                    "hover:border-primary/30 hover:-translate-y-0.5",
                    index === 0 && "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Relevance Indicator */}
                    <div className={cn(
                      "shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center",
                      result.relevance_score >= 0.8 ? "bg-green-500/10 text-green-600" :
                      result.relevance_score >= 0.6 ? "bg-amber-500/10 text-amber-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      <span className="text-lg font-bold">{formatRelevance(result.relevance_score)}</span>
                      <span className="text-[10px] uppercase tracking-wider">%</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* File Name & Category */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-semibold text-foreground truncate max-w-md">
                            {result.file_name}
                          </h3>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "shrink-0",
                            result.category === 'Convention' && "bg-blue-500/10 text-blue-600 border-blue-200",
                            result.category === 'Offres' && "bg-green-500/10 text-green-600 border-green-200",
                            result.category === 'Depot_Vente' && "bg-purple-500/10 text-purple-600 border-purple-200",
                            result.category === 'Guide_NGBSS' && "bg-orange-500/10 text-orange-600 border-orange-200",
                          )}
                        >
                          {CATEGORY_ICONS[result.category]}
                          <span className="ml-1">{result.category}</span>
                        </Badge>
                      </div>

                      {/* Snippet */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                        {result.snippet}
                      </p>

                      {/* Content Preview (expandable) */}
                      <details className="group/details">
                        <summary className="cursor-pointer text-sm text-primary hover:text-primary/80 flex items-center gap-2 mb-2">
                          <ExternalLink className="h-4 w-4" />
                          <span>{t('viewMore') || 'Voir plus de détails'}</span>
                        </summary>
                        <div className="mt-3 p-4 rounded-xl bg-muted/50 text-sm text-foreground/80 max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans">{result.content}</pre>
                        </div>
                      </details>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {result.file_reference.file_type}
                        </span>
                        {result.page_number && (
                          <span className="text-xs text-muted-foreground">
                            Page {result.page_number}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchMeta ? (
            // No Results
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <SearchIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('noResults')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('tryOtherTerms')}
              </p>
            </div>
          ) : (
            // Initial State
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('startSearching') || 'Commencez votre recherche'}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('searchHint') || 'Tapez votre question et sélectionnez une catégorie pour obtenir les meilleurs résultats'}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
