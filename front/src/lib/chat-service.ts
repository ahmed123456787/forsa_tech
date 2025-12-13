// Chat Service using Appwrite Database
// Connected to real AI model with streaming support

import {
  databases,
  DATABASE_ID,
  collections,
  type ChatSession as AppwriteChatSession,
  type ChatMessage as AppwriteChatMessage,
} from "./appwrite";
import { ID, Query } from "appwrite";
import { streamChat, type CategoryId, type StreamChatCallbacks } from "./ai-service";
import { type AIRecommendedOffer } from "./ai-mock";

// Export types for components
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  offers?: MockOffer[];
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

export type MockOffer = AIRecommendedOffer;

// Re-export CategoryId for components
export type { CategoryId } from "./ai-service";
export { AI_CATEGORIES, getCategoryLabel } from "./ai-service";

// Convert Appwrite session to our ChatSession type
function toSession(doc: AppwriteChatSession & { messageCount?: number }): ChatSession {
  return {
    id: doc.$id || "",
    title: doc.title || "Nouvelle conversation",
    lastMessage: doc.lastMessage || "",
    timestamp: doc.$updatedAt || doc.$createdAt || new Date().toISOString(),
    messageCount: doc.messageCount || 0,
  };
}

// Convert Appwrite message to our ChatMessage type
function toMessage(doc: AppwriteChatMessage): ChatMessage {
  return {
    id: doc.$id || "",
    sessionId: doc.sessionId,
    role: doc.role,
    content: doc.content,
    timestamp: doc.$createdAt || new Date().toISOString(),
  };
}

// ==================== Public API ====================

export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      [Query.orderDesc("$updatedAt"), Query.limit(50)]
    );
    
    // Get message counts for each session
    const sessions = await Promise.all(
      response.documents.map(async (doc) => {
        try {
          const messagesResponse = await databases.listDocuments(
            DATABASE_ID,
            collections.CHAT_MESSAGES,
            [Query.equal("sessionId", doc.$id), Query.limit(1)]
          );
          return toSession({
            ...(doc as unknown as AppwriteChatSession),
            messageCount: messagesResponse.total,
          });
        } catch {
          return toSession(doc as unknown as AppwriteChatSession);
        }
      })
    );
    
    return sessions;
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      sessionId
    );
    return toSession(doc as unknown as AppwriteChatSession);
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return null;
  }
}

// Search sessions by query - searches through ALL messages (questions and answers)
export async function searchChatSessions(query: string): Promise<ChatSession[]> {
  if (!query.trim()) {
    return getChatSessions();
  }
  
  // Use substring search for accurate results (works with partial matches)
  return substringSearchChatSessions(query);
}

// Substring search that searches through all message content
async function substringSearchChatSessions(query: string): Promise<ChatSession[]> {
  try {
    const lowerQuery = query.toLowerCase().trim();
    
    // Get all sessions
    const sessionsResponse = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      [Query.orderDesc("$updatedAt"), Query.limit(100)]
    );
    
    // Get all messages to search through
    const messagesResponse = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_MESSAGES,
      [Query.limit(2000)]
    );
    
    // Find sessions with matching messages
    const matchingSessionIds = new Set<string>();
    
    // Search through ALL messages (both user and assistant)
    for (const doc of messagesResponse.documents) {
      const message = doc as unknown as AppwriteChatMessage;
      if (message.content?.toLowerCase().includes(lowerQuery)) {
        matchingSessionIds.add(message.sessionId);
      }
    }
    
    // Also search in session title and lastMessage
    for (const doc of sessionsResponse.documents) {
      const session = doc as unknown as AppwriteChatSession;
      if (
        session.title?.toLowerCase().includes(lowerQuery) ||
        session.lastMessage?.toLowerCase().includes(lowerQuery)
      ) {
        matchingSessionIds.add(session.$id || "");
      }
    }
    
    if (matchingSessionIds.size === 0) {
      return [];
    }
    
    // Filter and return matching sessions
    const matchingSessions = sessionsResponse.documents.filter((doc) => 
      matchingSessionIds.has(doc.$id || "")
    );
    
    // Get message counts
    const sessions = await Promise.all(
      matchingSessions.map(async (doc) => {
        const messagesCount = messagesResponse.documents.filter(
          (m) => (m as unknown as AppwriteChatMessage).sessionId === doc.$id
        ).length;
        return toSession({
          ...(doc as unknown as AppwriteChatSession),
          messageCount: messagesCount,
        });
      })
    );
    
    return sessions;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      ID.unique(),
      {
        title: title || "Nouvelle conversation",
        lastMessage: "",
        userId: "anonymous", // Will be replaced with real user ID when auth is implemented
      }
    );
    
    return toSession(doc as unknown as AppwriteChatSession);
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
}

export async function updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      sessionId,
      {
        ...(updates.title && { title: updates.title }),
        ...(updates.lastMessage && { lastMessage: updates.lastMessage }),
      }
    );
  } catch (error) {
    console.error("Error updating chat session:", error);
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    // First delete all messages in this session
    const messagesResponse = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_MESSAGES,
      [Query.equal("sessionId", sessionId), Query.limit(500)]
    );
    
    await Promise.all(
      messagesResponse.documents.map((msg) =>
        databases.deleteDocument(DATABASE_ID, collections.CHAT_MESSAGES, msg.$id)
      )
    );
    
    // Then delete the session
    await databases.deleteDocument(DATABASE_ID, collections.CHAT_SESSIONS, sessionId);
  } catch (error) {
    console.error("Error deleting chat session:", error);
    throw error;
  }
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_MESSAGES,
      [
        Query.equal("sessionId", sessionId),
        Query.orderAsc("$createdAt"),
        Query.limit(200),
      ]
    );
    
    return response.documents.map((doc) => toMessage(doc as unknown as AppwriteChatMessage));
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
}

export async function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "timestamp">
): Promise<ChatMessage> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      collections.CHAT_MESSAGES,
      ID.unique(),
      {
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
      }
    );
    
    // Update session with last message
    const truncatedMessage = message.content.substring(0, 50) + (message.content.length > 50 ? "..." : "");
    await updateChatSession(sessionId, { lastMessage: truncatedMessage });
    
    // Update title if it's the first user message
    if (message.role === "user") {
      const allMessages = await getChatMessages(sessionId);
      const userMessages = allMessages.filter((m) => m.role === "user");
      if (userMessages.length === 0) {
        // This is the first user message, update title
        const title = message.content.substring(0, 40) + (message.content.length > 40 ? "..." : "");
        await updateChatSession(sessionId, { title });
      }
    }
    
    return toMessage(doc as unknown as AppwriteChatMessage);
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
}

export async function sendMessage(
  sessionId: string,
  userContent: string,
  categoryId: CategoryId = 'Offres'
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; offers?: MockOffer[] }> {
  // Add user message
  const userMessage = await addMessage(sessionId, {
    sessionId,
    role: "user",
    content: userContent,
  });
  
  // Get AI response (non-streaming for database storage)
  let responseText = '';
  
  try {
    await new Promise<void>((resolve, reject) => {
      streamChat(
        { question: userContent, category_id: categoryId },
        {
          onChunk: (chunk) => {
            responseText += chunk;
          },
          onComplete: () => {
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        }
      ).catch(reject);
    });
  } catch (error) {
    console.error('AI API error:', error);
    responseText = "Désolé, une erreur s'est produite lors de la communication avec l'IA. Veuillez réessayer.";
  }

  // Add assistant message
  const assistantMessage = await addMessage(sessionId, {
    sessionId,
    role: "assistant",
    content: responseText,
  });

  return { userMessage, assistantMessage };
}

/**
 * Send message with streaming callback for real-time updates
 */
export async function sendMessageStreaming(
  sessionId: string,
  userContent: string,
  categoryId: CategoryId,
  onChunk: (chunk: string, fullContent: string) => void,
  signal?: AbortSignal
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  // Add user message
  const userMessage = await addMessage(sessionId, {
    sessionId,
    role: "user",
    content: userContent,
  });
  
  let fullResponse = '';
  
  try {
    await new Promise<void>((resolve, reject) => {
      const callbacks: StreamChatCallbacks = {
        onChunk: (chunk) => {
          fullResponse += chunk;
          onChunk(chunk, fullResponse);
        },
        onComplete: () => {
          resolve();
        },
        onError: (error) => {
          reject(error);
        },
      };
      
      // Call streamChat and handle its promise
      streamChat(
        { question: userContent, category_id: categoryId },
        callbacks,
        signal
      ).catch(reject);
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was cancelled
      if (!fullResponse) {
        fullResponse = '[Message annulé]';
      }
    } else {
      console.error('AI API error:', error);
      fullResponse = fullResponse || "Désolé, une erreur s'est produite lors de la communication avec l'IA. Veuillez réessayer.";
    }
  }

  // Save the complete assistant message to database
  const assistantMessage = await addMessage(sessionId, {
    sessionId,
    role: "assistant",
    content: fullResponse,
  });

  return { userMessage, assistantMessage };
}

export async function clearAllHistory(): Promise<void> {
  try {
    const sessions = await getChatSessions();
    await Promise.all(sessions.map((session) => deleteChatSession(session.id)));
  } catch (error) {
    console.error("Error clearing history:", error);
  }
}

// Initialize with some mock sessions if empty (for first-time setup)
export async function initializeMockData(): Promise<void> {
  // This function now does nothing as data is in Appwrite
  // Keeping it for backwards compatibility with existing code
}
