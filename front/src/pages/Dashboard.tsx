import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Search, 
  FileText, 
  Package, 
  ArrowRight, 
  MessageSquare,
  Download,
  TrendingUp,
  Clock
} from "lucide-react";
import { getOffers, getConventions, type Offer, type Convention } from "@/lib/appwrite";
import { useLanguage } from "@/hooks/useLanguage";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { label: t('chatbotAI'), href: "/chat", icon: Bot, description: t('askQuestions'), color: "primary" },
    { label: t('search'), href: "/search", icon: Search, description: t('findOffer'), color: "secondary" },
    { label: t('conventions'), href: "/conventions", icon: FileText, description: t('download'), color: "primary" },
    { label: t('offers'), href: "/offers", icon: Package, description: t('fullCatalog'), color: "secondary" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [offersData, conventionsData] = await Promise.all([
          getOffers(),
          getConventions()
        ]);
        setOffers(offersData.slice(0, 3));
        setConventions(conventionsData.slice(0, 2));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="container py-8 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t('welcomeOn')} <span className="text-gradient-at">AT Assistant</span>
          </h1>
          <p className="text-muted-foreground">
            {t('yourAssistant')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${
                    action.color === "primary" 
                      ? "bg-gradient-to-br from-[#00a959]/20 to-[#20b471]/20" 
                      : "bg-gradient-to-br from-[#2c5eaa]/20 to-[#2c5eaa]/10"
                  }`}>
                    <action.icon className={`h-6 w-6 ${
                      action.color === "primary" ? "text-[#00a959]" : "text-[#2c5eaa]"
                    }`} />
                  </div>
                  <h3 className="font-medium mb-1">{action.label}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Offers */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('recentOffers')}</CardTitle>
                  <CardDescription>{t('lastViewedOffers')}</CardDescription>
                </div>
                <Link to="/offers">
                  <Button variant="ghost" size="sm" className="gap-1">
                    {t('viewAll')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))
                  ) : offers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t('noOffersAvailable')}</p>
                  ) : (
                    offers.map((offer) => (
                      <div 
                        key={offer.$id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <Package className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{offer.name}</p>
                            <p className="text-xs text-muted-foreground">{offer.sector}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{offer.price.toLocaleString()} DA</p>
                          <p className="text-xs text-muted-foreground">/{t('month')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Conventions */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('conventions')}</CardTitle>
                  <CardDescription>{t('recentlyDownloaded')}</CardDescription>
                </div>
                <Link to="/conventions">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    [...Array(2)].map((_, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : conventions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t('noConventions')}</p>
                  ) : (
                    conventions.map((convention) => (
                      <div 
                        key={convention.$id} 
                        className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{convention.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(convention.validUntil).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR')}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-muted-foreground">{t('searchesThisMonth')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Banner */}
        <Card className="mt-8 overflow-hidden border-0">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#00a959]/10 via-[#20b471]/10 to-[#2c5eaa]/10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00a959] to-[#2c5eaa] flex items-center justify-center shadow-lg">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t('needHelp')}</h3>
                <p className="text-muted-foreground">{t('aiAssistantAvailable')}</p>
              </div>
            </div>
            <Link to="/chat">
              <Button className="gap-2 bg-primary hover:bg-primary/90 glow-green">
                <Bot className="h-4 w-4" />
                {t('startConversation')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
