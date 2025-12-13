// Mock API Functions for Algeria Telecom AI Assistant
// These will be replaced with actual AI and backend calls

import { mockOffers, mockConventions, mockPartners, type Offer, type ChatMessage } from "./mock-data";

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AI responses
const aiResponses: Record<string, string> = {
  fibre: "Voici les meilleures offres Idoom Fibre Entreprise correspondant à vos critères de débit et de secteur d'activité :",
  convention: "Je peux vous aider à trouver les conventions partenaires adaptées à votre secteur. Voici les options disponibles :",
  default: "Je comprends votre demande. Permettez-moi de vous présenter les solutions les plus adaptées à vos besoins :",
};

// Send message to AI (placeholder)
export async function sendMessageToAI(message: string): Promise<{ response: string; offers?: Offer[] }> {
  await delay(1500); // Simulate network delay

  const lowerMessage = message.toLowerCase();
  
  let responseText = aiResponses.default;
  let offers: Offer[] = [];

  if (lowerMessage.includes("fibre") || lowerMessage.includes("internet") || lowerMessage.includes("offre")) {
    responseText = aiResponses.fibre;
    offers = mockOffers.filter(o => o.sector === "Entreprise" || o.sector === "Start-up").slice(0, 2);
  } else if (lowerMessage.includes("convention") || lowerMessage.includes("partenaire")) {
    responseText = aiResponses.convention;
  }

  return { response: responseText, offers };
}

// Search offers
export async function searchOffers(params: {
  query?: string;
  sector?: string;
  minBudget?: number;
  maxBudget?: number;
  serviceType?: string;
}): Promise<Offer[]> {
  await delay(800);

  let filtered = [...mockOffers];

  if (params.sector && params.sector !== "all") {
    filtered = filtered.filter(o => o.sector.toLowerCase() === params.sector?.toLowerCase());
  }

  if (params.minBudget) {
    filtered = filtered.filter(o => o.price >= params.minBudget!);
  }

  if (params.maxBudget) {
    filtered = filtered.filter(o => o.price <= params.maxBudget!);
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.description.toLowerCase().includes(q)
    );
  }

  return filtered;
}

// Get all offers
export async function getOffers(): Promise<Offer[]> {
  await delay(500);
  return mockOffers;
}

// Get single offer
export async function getOffer(id: string): Promise<Offer | undefined> {
  await delay(300);
  return mockOffers.find(o => o.id === id);
}

// Get all conventions
export async function getConventions() {
  await delay(500);
  return mockConventions;
}

// Get all partners
export async function getPartners() {
  await delay(500);
  return mockPartners;
}

// Mock download function
export async function downloadDocument(fileId: string, filename: string): Promise<void> {
  await delay(500);
  // In production, this would trigger actual file download from Appwrite storage
  console.log(`Downloading document: ${filename} (${fileId})`);
  alert(`Téléchargement simulé: ${filename}`);
}
