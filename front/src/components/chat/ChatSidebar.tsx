import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { type ChatSession } from "@/lib/chat-service";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onSearch: (query: string) => Promise<ChatSession[]>;
  isLoading?: boolean;
}

// Memoized session item to prevent re-renders
const SessionItem = memo(function SessionItem({ 
  session, 
  isActive, 
  onSelect,
  newConversationText 
}: { 
  session: ChatSession; 
  isActive: boolean; 
  onSelect: () => void;
  newConversationText: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-[#00a959]/10 to-[#2c5eaa]/10 border border-primary/30"
          : "hover:bg-muted"
      )}
    >
      <MessageSquare className={cn(
        "h-4 w-4 mt-0.5 shrink-0",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground truncate">{session.lastMessage || newConversationText}</p>
      </div>
    </button>
  );
});

export const ChatSidebar = memo(function ChatSidebar({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession, 
  onSearch, 
  isLoading = false 
}: ChatSidebarProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSession[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Memoized translations
  const newConversationText = useMemo(() => t('newConversation'), [t]);
  
  // Debounced search - optimized with useCallback
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);
  
  // Use search results when searching, otherwise show all sessions
  const displayedSessions = useMemo(() => 
    searchQuery.trim() ? (searchResults || []) : sessions,
    [searchQuery, searchResults, sessions]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b border-border">
        <Button 
          onClick={onNewSession} 
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4" />
          {newConversationText}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchInMessages')}
            className="h-8 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {searchQuery && searchResults && (
          <p className="text-xs text-muted-foreground mt-1">
            {searchResults.length} {t('resultsFor').replace(' pour', '').replace(' for', '').replace(' لـ', '')}
          </p>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
            <p>{t('loadingConversations')}</p>
          </div>
        ) : isSearching ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
            <p>{t('searching')}</p>
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{searchQuery ? t('noResults') : t('noConversations')}</p>
          </div>
        ) : (
          displayedSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={activeSessionId === session.id}
              onSelect={() => onSelectSession(session.id)}
              newConversationText={newConversationText}
            />
          ))
        )}
      </div>

    </div>
  );
});
