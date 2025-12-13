import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { 
  getChatSessions,
  getChatMessages,
  createChatSession,
  searchChatSessions,
  initializeMockData,
  addMessage,
  AI_CATEGORIES,
  getCategoryLabel,
  type ChatMessage as ChatMessageType,
  type ChatSession,
  type CategoryId,
} from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Package, FileText, Store, BookOpen, ArrowRight, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchEventSource } from "@microsoft/fetch-event-source";

// Pre-compute AI server URL once at module level
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'https://w40hsb4s-8000.euw.devtunnels.ms';

// Category icon map for O(1) lookup instead of switch statement
const CATEGORY_ICONS: Record<CategoryId, React.ReactNode> = {
  'Offres': <Package className="h-6 w-6" />,
  'Convention': <FileText className="h-6 w-6" />,
  'Depot_Vente': <Store className="h-6 w-6" />,
  'Guide_NGBSS': <BookOpen className="h-6 w-6" />,
};

export default function ChatPage() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  
  // Refs for performance - avoid state updates where possible
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef<boolean>(false);
  const streamingMsgIdRef = useRef<string | null>(null);

  // Memoized category icon getter - O(1) lookup
  const getCategoryIcon = useCallback((categoryId: CategoryId) => CATEGORY_ICONS[categoryId], []);

  // Memoized suggested questions - only recalculate when language changes
  const suggestedQuestions = useMemo(() => [
    t('question1'),
    t('question2'),
    t('question3'),
    t('question4'),
  ], [t]);

  // Memoized locale getter
  const locale = useMemo(() => {
    if (language === 'ar') return 'ar-DZ';
    if (language === 'en') return 'en-US';
    return 'fr-FR';
  }, [language]);

  // Optimized scroll - use requestAnimationFrame for smooth performance
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Initialize and load sessions on mount - optimized with parallel operations
  useEffect(() => {
    const loadSessions = async () => {
      setIsLoadingSessions(true);
      try {
        // Initialize mock data and get sessions in parallel
        const [, loadedSessions] = await Promise.all([
          initializeMockData(),
          getChatSessions()
        ]);
        setSessions(loadedSessions);
        
        // Check for session query param to resume conversation
        const sessionParam = searchParams.get('session');
        if (sessionParam) {
          setActiveSessionId(sessionParam);
        }
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessions();
  }, [searchParams]);

  // Load messages when session changes (but not while sending)
  useEffect(() => {
    // Skip loading if we're currently sending a message
    if (isSendingRef.current) return;
    
    if (activeSessionId) {
      getChatMessages(activeSessionId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedCategory) return;

    // Mark that we're sending
    isSendingRef.current = true;

    // Cancel any ongoing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Create session if none exists
    let sessionId = activeSessionId;
    if (!sessionId) {
      const newSession = await createChatSession(content.substring(0, 40));
      sessionId = newSession.id;
      setActiveSessionId(sessionId);
      setSessions(prev => [newSession, ...prev]);
    }

    const timestamp = new Date().toISOString();
    
    // Add user message to UI immediately
    const tempUserMessage: ChatMessageType = {
      id: `temp_${Date.now()}`,
      sessionId,
      role: "user",
      content,
      timestamp,
    };
    
    // Add a temporary streaming message placeholder
    const streamingMsgId = `streaming_${Date.now()}`;
    streamingMsgIdRef.current = streamingMsgId;
    
    const streamingMessage: ChatMessageType = {
      id: streamingMsgId,
      sessionId,
      role: "assistant",
      content: "",
      timestamp,
    };
    
    setMessages(prev => [...prev, tempUserMessage, streamingMessage]);
    setIsTyping(true);
    setStreamingContent("");

    let fullResponse = '';
    const currentSessionId = sessionId;

    try {
      await fetchEventSource(`${AI_SERVER_URL}/api/stream-chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          question: content,
          category_id: selectedCategory,
        }),
        signal: abortControllerRef.current.signal,
        openWhenHidden: true,
        onopen: async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        },
        onmessage: (event) => {
          // Skip empty data or [DONE] marker
          if (!event.data || event.data === '[DONE]') return;
          
          // Append the chunk to full response
          fullResponse += event.data;
          
          // Batch state updates - update both in one render cycle
          setStreamingContent(fullResponse);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMsgId 
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        onerror: (err) => {
          throw err;
        },
      });
      
      // Save messages to database sequentially to preserve order
      // User message must be saved first to get earlier timestamp
      await addMessage(currentSessionId, {
        sessionId: currentSessionId,
        role: "user",
        content,
      });
      
      await addMessage(currentSessionId, {
        sessionId: currentSessionId,
        role: "assistant",
        content: fullResponse,
      });
      
      // Refresh messages and sessions in parallel
      const [updatedMessages, updatedSessions] = await Promise.all([
        getChatMessages(currentSessionId),
        getChatSessions()
      ]);
      
      setMessages(updatedMessages);
      setSessions(updatedSessions);
    } catch (error) {
      // Add error message only if we don't have any response yet
      if (!fullResponse) {
        setMessages(prev => prev.filter(msg => msg.id !== streamingMsgId).concat({
          id: `error_${Date.now()}`,
          sessionId: currentSessionId,
          role: "assistant",
          content: t('errorOccurred'),
          timestamp: new Date().toISOString(),
        }));
      }
    } finally {
      setIsTyping(false);
      setStreamingContent("");
      abortControllerRef.current = null;
      streamingMsgIdRef.current = null;
      isSendingRef.current = false;
    }
  }, [selectedCategory, activeSessionId, t]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    handleSendMessage(question);
  }, [handleSendMessage]);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setSelectedCategory(null);
    setMessages([]);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    // Keep category when switching sessions, or set a default
    setSelectedCategory(prev => prev ?? 'Offres');
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    return searchChatSessions(query);
  }, []);

  // Memoized current time display
  const currentTime = useMemo(() => 
    new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    [locale]
  );

  // Memoize category description getter for cleaner JSX
  const getCategoryDescription = useCallback((categoryId: CategoryId) => {
    const descMap: Record<CategoryId, string> = {
      'Offres': t('categoryOffersDesc'),
      'Convention': t('categoryConventionDesc'),
      'Depot_Vente': t('categoryDepotVenteDesc'),
      'Guide_NGBSS': t('categoryGuideNGBSSDesc'),
    };
    return descMap[categoryId];
  }, [t]);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Chat History */}
        <aside className="hidden lg:block w-72 border-r border-border bg-sidebar">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onSearch={handleSearch}
            isLoading={isLoadingSessions}
          />
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Category Selection - Show when no category selected */}
          {!selectedCategory ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">{t('selectCategory')}</h2>
                  <p className="text-muted-foreground">{t('selectCategoryDesc')}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AI_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {getCategoryIcon(category.id)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {getCategoryLabel(category.id, language)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getCategoryDescription(category.id)}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Date Header with Category Selector */}
              <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(selectedCategory)}
                          <span className="font-medium">{getCategoryLabel(selectedCategory, language)}</span>
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {AI_CATEGORIES.map((category) => (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className="gap-3 cursor-pointer"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                            {getCategoryIcon(category.id)}
                          </span>
                          <span>{getCategoryLabel(category.id, language)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('today')}, {currentTime}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 space-y-6 py-4">
                {messages.map((message) => {
                  // Skip rendering empty streaming messages - show typing indicator instead
                  if (message.role === "assistant" && message.id.startsWith('streaming_') && !message.content) {
                    return null;
                  }
                  return <ChatMessage key={message.id} message={message} />;
                })}
                {isTyping && !streamingContent && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className="px-4 md:px-8 py-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 md:px-8 border-t border-border">
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
