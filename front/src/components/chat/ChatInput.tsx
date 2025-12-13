import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Mic, Send } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: Array<{ 0: { transcript: string } }>;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const speechLocale = useMemo(() => {
    const mapping: Record<string, string> = {
      fr: "fr-FR",
      en: "en-US",
      ar: "ar-DZ",
    };
    return mapping[language] || "en-US";
  }, [language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Set up speech recognition when available
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionConstructor =
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSpeechSupported(false);
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = speechLocale;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();

      if (transcript) {
        setMessage((prev) => {
          const base = prev.trim();
          return base ? `${base} ${transcript}` : transcript;
        });
      }
    };

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.warn("Speech recognition stop error:", error);
      }
      recognitionRef.current = null;
    };
  }, [speechLocale]);

  const handleVoiceToggle = () => {
    if (disabled) return;
    if (!isSpeechSupported) {
      toast({ description: t('voiceNotSupported') });
      return;
    }
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.lang = speechLocale;
        recognition.start();
      }
    } catch (error) {
      console.error("Speech recognition start/stop error:", error);
      toast({ description: t('errorOccurred') });
      setIsListening(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <Button type="button" variant="ghost" size="icon" className="shrink-0 hover:bg-primary/10 hover:text-primary">
          <Plus className="h-5 w-5" />
        </Button>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleVoiceToggle}
          disabled={disabled}
          aria-pressed={isListening}
          title={isSpeechSupported ? (isListening ? t('listening') : t('voiceInput')) : t('voiceNotSupported')}
          className={cn(
            "shrink-0 hover:bg-primary/10 hover:text-primary",
            isListening && "bg-primary/10 text-primary animate-pulse"
          )}
        >
          <Mic className="h-5 w-5" />
        </Button>
        
        <Button 
          type="submit" 
          disabled={!message.trim() || disabled}
          className="shrink-0 gap-2 rounded-lg bg-primary hover:bg-primary/90 glow-green"
        >
          {t('send')}
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
