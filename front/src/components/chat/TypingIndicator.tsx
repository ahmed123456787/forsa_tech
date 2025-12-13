import { memo } from "react";

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
        <div className="h-4 w-4 rounded-full bg-primary-foreground/80" />
      </div>

      {/* Typing Bubble */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground">AT Assistant</span>
          <span className="text-muted-foreground">écrit...</span>
        </div>
        <div className="chat-bubble-assistant px-4 py-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing" style={{ animationDelay: "200ms" }} />
            <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
});
