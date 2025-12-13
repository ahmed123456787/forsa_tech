import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { getChatSessions, deleteChatSession, initializeMockData, searchChatSessions, type ChatSession } from "@/lib/chat-service";
import { MessageSquare, Clock, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

export default function HistoryPage() {
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      await initializeMockData();
      const loadedSessions = await getChatSessions();
      setSessions(loadedSessions);
      setLoading(false);
    };
    loadSessions();
  }, []);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchChatSessions(searchQuery);
        setSessions(results);
      } else {
        const allSessions = await getChatSessions();
        setSessions(allSessions);
      }
    };
    performSearch();
  }, [searchQuery]);

  const handleDelete = async (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    await deleteChatSession(sessionId);
  };

  const handleResume = (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) {
      if (language === 'ar') return `منذ ${diffMins} دقيقة`;
      if (language === 'en') return `${diffMins} min ago`;
      return `Il y a ${diffMins} min`;
    }
    if (diffHours < 24) {
      if (language === 'ar') return `منذ ${diffHours} ساعة`;
      if (language === 'en') return `${diffHours}h ago`;
      return `Il y a ${diffHours}h`;
    }
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) {
      if (language === 'ar') return `منذ ${diffDays} أيام`;
      if (language === 'en') return `${diffDays} days ago`;
      return `Il y a ${diffDays} jours`;
    }
    const locale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';
    return date.toLocaleDateString(locale);
  };

  return (
    <MainLayout>
      <div className="container py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('conversationHistory')}</h1>
          <p className="text-muted-foreground">
            {t('findPreviousExchanges')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchHistory')}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4 text-sm text-muted-foreground">
            {sessions.length} {t('resultsFor')} "{searchQuery}"
          </div>
        )}

        {/* History List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-at-card-hover transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{session.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{session.lastMessage || t('newConversation')}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(session.timestamp)}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleResume(session.id)}
                  >
                    {t('resume')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              {searchQuery ? (
                <Search className="h-8 w-8 text-muted-foreground" />
              ) : (
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? t('noResults') : t('noHistory')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `${t('noConversationMatches')} "${searchQuery}"`
                : t('startConversationWithAI')
              }
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={clearSearch}>
                {t('clearSearch')}
              </Button>
            ) : (
              <Link to="/chat">
                <Button>{t('startConversation')}</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
