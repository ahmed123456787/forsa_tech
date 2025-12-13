// AI Service - Real AI API integration with streaming support

const AI_SERVER_URL =
  import.meta.env.VITE_AI_SERVER_URL ||
  "https://w40hsb4s-8000.euw.devtunnels.ms";

export type CategoryId =
  | "Offres"
  | "Convention"
  | "Depot_Vente"
  | "Guide_NGBSS";

export interface AICategory {
  id: CategoryId;
  label: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  description: string;
}

// Frozen constant array - prevents accidental mutation
export const AI_CATEGORIES: readonly AICategory[] = Object.freeze([
  {
    id: "Offres",
    label: "Offres",
    labelAr: "العروض",
    labelEn: "Offers",
    icon: "📦",
    description: "Questions sur les offres et tarifs",
  },
  {
    id: "Convention",
    label: "Convention",
    labelAr: "الاتفاقية",
    labelEn: "Convention",
    icon: "📜",
    description: "Questions sur les conventions",
  },
  {
    id: "Depot_Vente",
    label: "Dépôt Vente",
    labelAr: "مستودع البيع",
    labelEn: "Depot Sales",
    icon: "🏪",
    description: "Questions sur les dépôts de vente",
  },
  {
    id: "Guide_NGBSS",
    label: "Guide NGBSS",
    labelAr: "دليل NGBSS",
    labelEn: "NGBSS Guide",
    icon: "📖",
    description: "Questions sur le guide NGBSS",
  },
]);

export interface StreamChatRequest {
  question: string;
  category_id: CategoryId;
}

export interface StreamChatCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

/**
 * Send a message to the AI and stream the response
 * Uses Server-Sent Events (SSE) format: data: {text_chunk}
 */
export async function streamChat(
  request: StreamChatRequest,
  callbacks: StreamChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const { onChunk, onComplete, onError } = callbacks;
  let fullResponse = "";

  try {
    const response = await fetch(`${AI_SERVER_URL}/api/stream-chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const lines = buffer.split("\n");
            for (const line of lines) {
              const chunk = parseSSEChunk(line.trim());
              if (chunk) {
                fullResponse += chunk;
                onChunk(chunk);
              }
            }
          }
          break;
        }

        // Decode the chunk and add to buffer
        const text = decoder.decode(value, { stream: true });
        buffer += text;

        // Process complete SSE messages (lines ending with \n\n or \n)
        const lines = buffer.split("\n");

        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          const chunk = parseSSEChunk(trimmedLine);
          if (chunk) {
            fullResponse += chunk;
            onChunk(chunk);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onComplete(fullResponse);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // Request was cancelled, not an error
        onComplete(fullResponse);
        return;
      }
      onError(error);
    } else {
      onError(new Error("Unknown error occurred"));
    }
  }
}

/**
 * Parse SSE data line format: data: {text_chunk}
 */
function parseSSEChunk(line: string): string | null {
  // Handle SSE format: "data: {text_chunk}"
  if (line.startsWith("data:")) {
    const data = line.slice(5).trim();
    // Check for end of stream markers
    if (data === "[DONE]" || data === "") {
      return null;
    }
    return data;
  }

  // Handle plain text chunks (in case server sends raw text)
  if (line && !line.startsWith(":")) {
    return line;
  }

  return null;
}

/**
 * Non-streaming version for fallback
 */
export async function sendChatMessage(
  request: StreamChatRequest
): Promise<string> {
  const response = await fetch(`${AI_SERVER_URL}/api/stream-chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Read the entire response as text
  const text = await response.text();

  // Parse SSE format and combine chunks
  const lines = text.split("\n");
  let result = "";

  for (const line of lines) {
    const chunk = parseSSEChunk(line.trim());
    if (chunk) {
      result += chunk;
    }
  }

  return result || text;
}

// Pre-computed lookup map for O(1) category label access
const CATEGORY_LABEL_MAP: Record<CategoryId, Record<string, string>> = {
  Offres: { ar: "العروض", en: "Offers", default: "Offres" },
  Convention: { ar: "الاتفاقية", en: "Convention", default: "Convention" },
  Depot_Vente: {
    ar: "مستودع البيع",
    en: "Depot Sales",
    default: "Dépôt Vente",
  },
  Guide_NGBSS: { ar: "دليل NGBSS", en: "NGBSS Guide", default: "Guide NGBSS" },
};

export function getCategoryLabel(
  categoryId: CategoryId,
  language: string
): string {
  const labels = CATEGORY_LABEL_MAP[categoryId];
  if (!labels) return categoryId;
  return labels[language] ?? labels.default;
}
