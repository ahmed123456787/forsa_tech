// Mock Data for Algeria Telecom AI Assistant

export interface Offer {
  id: string;
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
  id: string;
  partnerId: string;
  title: string;
  description: string;
  pdfFileId?: string;
  signedDate: string;
  validUntil: string;
}

export interface Partner {
  id: string;
  name: string;
  sector: string;
  description: string;
  logo?: string;
  conventionsCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  offers?: Offer[];
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: ChatMessage[];
}

// Mock Offers
export const mockOffers: Offer[] = [
  {
    id: "1",
    name: "Idoom Fibre Pro",
    description: "Très haut débit jusqu'à 300 Méga, IP Fixe incluse, idéal pour les PME.",
    sector: "Entreprise",
    partnerId: "1",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    price: 4500,
    badge: "RECOMMANDÉ",
    features: ["300 Mbps", "IP Fixe", "Support 24/7", "Installation gratuite"],
  },
  {
    id: "2",
    name: "Moohtarif Pack",
    description: "Solution intégrée voix + data, réduction sur l'installation.",
    sector: "Start-up",
    partnerId: "2",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    price: 3200,
    badge: "PACK STARTUP",
    features: ["100 Mbps", "Voix illimitée", "Cloud 50GB", "Support prioritaire"],
  },
  {
    id: "3",
    name: "Idoom ADSL Business",
    description: "Connexion fiable pour les petites entreprises avec support technique dédié.",
    sector: "Entreprise",
    partnerId: "1",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    price: 2500,
    features: ["20 Mbps", "Email Pro", "Support technique"],
  },
  {
    id: "4",
    name: "Pack Étudiant",
    description: "Offre spéciale pour les étudiants avec tarif préférentiel.",
    sector: "Étudiant",
    partnerId: "3",
    validFrom: "2024-09-01",
    validTo: "2025-06-30",
    price: 1500,
    badge: "ÉTUDIANT",
    features: ["50 Mbps", "Streaming inclus", "Flexibilité"],
  },
  {
    id: "5",
    name: "Fibre Particulier Premium",
    description: "La meilleure connexion pour votre foyer avec TV et téléphonie incluses.",
    sector: "Particulier",
    partnerId: "1",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    price: 3800,
    features: ["200 Mbps", "TV 150 chaînes", "Appels illimités"],
  },
];

// Mock Conventions
export const mockConventions: Convention[] = [
  {
    id: "1",
    partnerId: "1",
    title: "Convention Cadre PME 2024",
    description: "Convention pour les petites et moyennes entreprises du secteur technologique.",
    signedDate: "2024-01-15",
    validUntil: "2025-01-15",
  },
  {
    id: "2",
    partnerId: "2",
    title: "Accord Start-up Nation",
    description: "Programme d'accompagnement des startups algériennes.",
    signedDate: "2024-02-01",
    validUntil: "2026-02-01",
  },
  {
    id: "3",
    partnerId: "3",
    title: "Convention Universitaire",
    description: "Partenariat avec les établissements d'enseignement supérieur.",
    signedDate: "2024-03-10",
    validUntil: "2025-09-01",
  },
];

// Mock Partners
export const mockPartners: Partner[] = [
  {
    id: "1",
    name: "Algérie Télécom Corporate",
    sector: "Télécommunications",
    description: "Division entreprise d'Algérie Télécom.",
    conventionsCount: 15,
  },
  {
    id: "2",
    name: "AT Ventures",
    sector: "Innovation",
    description: "Programme d'accélération de startups.",
    conventionsCount: 8,
  },
  {
    id: "3",
    name: "AT Education",
    sector: "Éducation",
    description: "Solutions pour le secteur éducatif.",
    conventionsCount: 12,
  },
];

// Mock Chat Sessions
export const mockChatSessions: ChatSession[] = [
  {
    id: "1",
    title: "Recherche offre fibre PME",
    lastMessage: "Voici les meilleures offres...",
    timestamp: "2024-01-15T10:42:00",
    messages: [],
  },
  {
    id: "2",
    title: "Convention partenariat",
    lastMessage: "Je peux vous aider à trouver...",
    timestamp: "2024-01-14T15:30:00",
    messages: [],
  },
  {
    id: "3",
    title: "Comparaison offres",
    lastMessage: "Comparons ces deux offres...",
    timestamp: "2024-01-13T09:15:00",
    messages: [],
  },
];

// Initial chat messages
export const initialChatMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bonjour ! Je suis votre assistant virtuel Algérie Télécom. Je peux vous aider à naviguer dans nos offres B2B, vérifier l'éligibilité fibre, ou trouver des conventions partenaires. Comment puis-je vous assister aujourd'hui ?",
    timestamp: new Date().toISOString(),
  },
];

// Suggested questions
export const suggestedQuestions = [
  "Quelles sont vos offres fibre pour les entreprises ?",
  "Comment souscrire à une convention partenaire ?",
  "Comparer les offres Idoom Fibre",
  "Vérifier l'éligibilité à la fibre",
];
