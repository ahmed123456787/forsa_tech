import { Client, Databases, Storage, Account, Query, ID } from 'appwrite';

// Appwrite Configuration
export const appwriteConfig = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "693acfc500198730032d",
  projectName: "algeria-telecom",
};

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Initialize Appwrite Services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database ID
export const DATABASE_ID = "at_database";

// Collection IDs
export const collections = {
  OFFERS: "offers",
  CONVENTIONS: "conventions",
  PARTNERS: "partners",
  CHAT_SESSIONS: "chat_sessions",
  CHAT_MESSAGES: "chat_messages",
};

// Storage Bucket IDs
export const buckets = {
  PDF_DOCUMENTS: "pdf_documents",
  LOGOS: "logos",
};

// Types
export interface Offer {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  name: string;
  description: string;
  sector: string;
  partnerId: string;
  validFrom: string;
  validTo: string;
  price: number;
  pdfFileId?: string;
  badge?: string;
  features?: string[];
}

export interface Convention {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  partnerId: string;
  title: string;
  description: string;
  pdfFileId?: string;
  signedDate: string;
  validUntil: string;
}

export interface Partner {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  name: string;
  sector: string;
  description: string;
  logoFileId?: string;
  conventionsCount: number;
}

export interface ChatSession {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  userId?: string;
  title: string;
  lastMessage: string;
}

export interface ChatMessage {
  $id?: string;
  $createdAt?: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  offerIds?: string[];
}

// ==================== OFFERS API ====================

export async function getOffers(): Promise<Offer[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.OFFERS,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );
    return response.documents as unknown as Offer[];
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
}

export async function getOffer(id: string): Promise<Offer> {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      collections.OFFERS,
      id
    );
    return response as unknown as Offer;
  } catch (error) {
    console.error('Error fetching offer:', error);
    throw error;
  }
}

export async function searchOffers(params: {
  query?: string;
  sector?: string;
  minBudget?: number;
  maxBudget?: number;
}): Promise<Offer[]> {
  try {
    const queries: string[] = [Query.limit(50)];

    if (params.sector && params.sector !== "all") {
      queries.push(Query.equal('sector', params.sector));
    }

    if (params.minBudget) {
      queries.push(Query.greaterThanEqual('price', params.minBudget));
    }

    if (params.maxBudget) {
      queries.push(Query.lessThanEqual('price', params.maxBudget));
    }

    if (params.query) {
      queries.push(Query.search('name', params.query));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.OFFERS,
      queries
    );
    return response.documents as unknown as Offer[];
  } catch (error) {
    console.error('Error searching offers:', error);
    throw error;
  }
}

export async function createOffer(offer: Omit<Offer, '$id' | '$createdAt' | '$updatedAt'>): Promise<Offer> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      collections.OFFERS,
      ID.unique(),
      offer
    );
    return response as unknown as Offer;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
}

export async function updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      collections.OFFERS,
      id,
      offer
    );
    return response as unknown as Offer;
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
}

export async function deleteOffer(id: string): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, collections.OFFERS, id);
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
}

// ==================== CONVENTIONS API ====================

export async function getConventions(): Promise<Convention[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.CONVENTIONS,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );
    return response.documents as unknown as Convention[];
  } catch (error) {
    console.error('Error fetching conventions:', error);
    throw error;
  }
}

export async function getConvention(id: string): Promise<Convention> {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      collections.CONVENTIONS,
      id
    );
    return response as unknown as Convention;
  } catch (error) {
    console.error('Error fetching convention:', error);
    throw error;
  }
}

export async function createConvention(convention: Omit<Convention, '$id' | '$createdAt' | '$updatedAt'>): Promise<Convention> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      collections.CONVENTIONS,
      ID.unique(),
      convention
    );
    return response as unknown as Convention;
  } catch (error) {
    console.error('Error creating convention:', error);
    throw error;
  }
}

export async function deleteConvention(id: string): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, collections.CONVENTIONS, id);
  } catch (error) {
    console.error('Error deleting convention:', error);
    throw error;
  }
}

// ==================== PARTNERS API ====================

export async function getPartners(): Promise<Partner[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.PARTNERS,
      [Query.orderAsc('name'), Query.limit(100)]
    );
    return response.documents as unknown as Partner[];
  } catch (error) {
    console.error('Error fetching partners:', error);
    throw error;
  }
}

export async function getPartner(id: string): Promise<Partner> {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      collections.PARTNERS,
      id
    );
    return response as unknown as Partner;
  } catch (error) {
    console.error('Error fetching partner:', error);
    throw error;
  }
}

export async function createPartner(partner: Omit<Partner, '$id' | '$createdAt' | '$updatedAt'>): Promise<Partner> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      collections.PARTNERS,
      ID.unique(),
      partner
    );
    return response as unknown as Partner;
  } catch (error) {
    console.error('Error creating partner:', error);
    throw error;
  }
}

// ==================== CHAT API ====================

export async function getChatSessions(userId?: string): Promise<ChatSession[]> {
  try {
    const queries: string[] = [Query.orderDesc('$updatedAt'), Query.limit(50)];
    
    if (userId) {
      queries.push(Query.equal('userId', userId));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      queries
    );
    return response.documents as unknown as ChatSession[];
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
}

export async function getChatSession(id: string): Promise<ChatSession> {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      id
    );
    return response as unknown as ChatSession;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    throw error;
  }
}

export async function createChatSession(session: Omit<ChatSession, '$id' | '$createdAt' | '$updatedAt'>): Promise<ChatSession> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      ID.unique(),
      session
    );
    return response as unknown as ChatSession;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

export async function updateChatSession(id: string, data: Partial<ChatSession>): Promise<ChatSession> {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      collections.CHAT_SESSIONS,
      id,
      data
    );
    return response as unknown as ChatSession;
  } catch (error) {
    console.error('Error updating chat session:', error);
    throw error;
  }
}

export async function deleteChatSession(id: string): Promise<void> {
  try {
    // First delete all messages in this session
    const messages = await getChatMessages(id);
    for (const message of messages) {
      if (message.$id) {
        await databases.deleteDocument(DATABASE_ID, collections.CHAT_MESSAGES, message.$id);
      }
    }
    // Then delete the session
    await databases.deleteDocument(DATABASE_ID, collections.CHAT_SESSIONS, id);
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collections.CHAT_MESSAGES,
      [
        Query.equal('sessionId', sessionId),
        Query.orderAsc('$createdAt'),
        Query.limit(200)
      ]
    );
    return response.documents as unknown as ChatMessage[];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
}

export async function createChatMessage(message: Omit<ChatMessage, '$id' | '$createdAt'>): Promise<ChatMessage> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      collections.CHAT_MESSAGES,
      ID.unique(),
      message
    );
    return response as unknown as ChatMessage;
  } catch (error) {
    console.error('Error creating chat message:', error);
    throw error;
  }
}

// ==================== STORAGE API ====================

export async function uploadFile(bucketId: string, file: File): Promise<string> {
  try {
    const response = await storage.createFile(bucketId, ID.unique(), file);
    return response.$id;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export function getFilePreview(bucketId: string, fileId: string): string {
  return storage.getFilePreview(bucketId, fileId).toString();
}

export function getFileDownload(bucketId: string, fileId: string): string {
  return storage.getFileDownload(bucketId, fileId).toString();
}

export async function deleteFile(bucketId: string, fileId: string): Promise<void> {
  try {
    await storage.deleteFile(bucketId, fileId);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export async function downloadDocument(fileId: string, filename: string): Promise<void> {
  try {
    const url = getFileDownload(buckets.PDF_DOCUMENTS, fileId);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}

// ==================== AI CHAT API ====================

export async function sendMessageToAI(
  sessionId: string,
  userMessage: string
): Promise<{ response: string; offers?: Offer[] }> {
  try {
    // Save user message
    await createChatMessage({
      sessionId,
      role: "user",
      content: userMessage,
    });

    // Simple AI response logic (in production, this would call an AI service)
    const lowerMessage = userMessage.toLowerCase();
    let responseText = "Je comprends votre demande. Permettez-moi de vous présenter les solutions les plus adaptées à vos besoins.";
    let offers: Offer[] = [];

    if (lowerMessage.includes("fibre") || lowerMessage.includes("internet") || lowerMessage.includes("offre")) {
      responseText = "Voici les meilleures offres Idoom Fibre Entreprise correspondant à vos critères :";
      try {
        offers = await searchOffers({ sector: "Entreprise" });
        offers = offers.slice(0, 3);
      } catch {
        offers = [];
      }
    } else if (lowerMessage.includes("convention") || lowerMessage.includes("partenaire")) {
      responseText = "Je peux vous aider à trouver les conventions partenaires adaptées à votre secteur. Consultez la section Conventions pour voir toutes les options disponibles.";
    } else if (lowerMessage.includes("prix") || lowerMessage.includes("tarif") || lowerMessage.includes("coût")) {
      responseText = "Nos tarifs varient selon le type d'offre et vos besoins. Utilisez la fonction Recherche pour filtrer par budget.";
    }

    // Save assistant message
    await createChatMessage({
      sessionId,
      role: "assistant",
      content: responseText,
      offerIds: offers.map(o => o.$id || ''),
    });

    // Update session with last message
    await updateChatSession(sessionId, {
      lastMessage: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''),
    });

    return { response: responseText, offers };
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
  }
}

// Export client for direct access if needed
export { client, ID, Query };
