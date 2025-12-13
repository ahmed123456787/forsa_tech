// AI mock generator for structured Q/A payloads and recommended offers
// Generates >100 mock offers and returns random answers in the expected schema

export interface AIQuestionPayload {
  equipe: string;
  question: Record<string, Record<string, string>>;
}

export interface AIResponsePayload {
  equipe: string;
  reponses: Record<string, Record<string, string>>;
}

export interface AIRecommendedOffer {
  id: string;
  name: string;
  description: string;
  sector: string;
  price: number;
  pdfUrl: string;
  pdfFileId: string;
  badge?: string;
  features: string[];
  historySummary: string;
  answers?: Record<string, string>;
}

const baseFeatureSets: { sector: string; features: string[]; description: string }[] = [
  { sector: "Entreprise", features: ["300 Mbps", "IP Fixe", "Support 24/7", "SLA 99.9%"], description: "Connectivité fibre pro pour sites critiques." },
  { sector: "Start-up", features: ["100 Mbps", "Cloud 50GB", "Voix illimitée", "Firewall géré"], description: "Pack agile pour équipes produit en croissance." },
  { sector: "Education", features: ["200 Mbps", "Wi-Fi campus", "Filtrage contenu", "Support prioritaire"], description: "Connectivité sécurisée pour établissements éducatifs." },
  { sector: "Particulier", features: ["150 Mbps", "TV 150 chaînes", "Appels illimités", "Installation offerte"], description: "Triple play premium pour la maison." },
  { sector: "Administration", features: ["Lien MPLS", "Redondance 4G", "Audit sécu", "Supervision"], description: "Lien sécurisé et résilient pour sites publics." },
  { sector: "PME", features: ["120 Mbps", "Backup 4G", "IP Fixe", "Routeur managé"], description: "Connexion fiable et managée pour PME." },
];

const badges = ["RECOMMANDEE", "PREMIUM", "PACK START", "PDF DISPONIBLE", "NOUVEAU", "-20% LANCEMENT"];

// Build 120+ mock offers programmatically
export const mockRecommendedOffers: AIRecommendedOffer[] = Array.from({ length: 120 }, (_, i) => {
  const base = baseFeatureSets[i % baseFeatureSets.length];
  const badge = badges[i % badges.length];
  const id = `rec-${i + 1}`;
  return {
    id,
    name: `Offre_${String(i + 1).padStart(3, "0")}`,
    description: `${base.description} Variation ${i + 1}.`,
    sector: base.sector,
    price: 1800 + (i % 12) * 250 + (i % 5) * 75,
    pdfUrl: `https://example.com/pdfs/${id}.pdf`,
    pdfFileId: `pdf_${id}`,
    badge,
    features: base.features,
    historySummary: `Recommandée suite à recherche #${(i % 15) + 1} et consultations similaires.`,
  };
});

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const clone = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && clone.length > 0; i++) {
    const idx = Math.floor(Math.random() * clone.length);
    result.push(clone.splice(idx, 1)[0]);
  }
  return result;
}

const genericAnswers = [
  "Le projet vise à développer une solution innovante avec un focus sur la fiabilité et la scalabilité.",
  "Les technologies utilisées incluent Python, FastAPI, React, et un modèle IA optimisé.",
  "Nous prévoyons un déploiement cloud avec supervision et observabilité intégrées.",
  "Les objectifs clés sont la réduction du coût de connectivité et l'amélioration de la QoS.",
  "La feuille de route inclut une phase pilote puis un passage en production en moins de 90 jours.",
  "Nous exploitons une architecture modulaire permettant d'activer ou non des modules métier par client.",
  "Le socle sécurité couvre l'authentification, le chiffrement en transit et au repos, et la journalisation.",
];

export function generateAIResponse(payload: AIQuestionPayload): { responsePayload: AIResponsePayload; offers: AIRecommendedOffer[] } {
  const categories = Object.keys(payload.question);
  const answersByOffer: Record<string, Record<string, string>> = {};

  // Select 3-4 random offers to answer
  const offers = pickMany(mockRecommendedOffers, 3 + Math.floor(Math.random() * 2));

  offers.forEach((offer, offerIndex) => {
    const offerKey = `Offre_${String(offerIndex + 1).padStart(2, "0")}`;
    answersByOffer[offerKey] = {};

    categories.forEach((catKey) => {
      const questions = payload.question[catKey];
      Object.entries(questions).forEach(([qId, qText]) => {
        const answer = `${pickRandom(genericAnswers)} (ref: ${offer.name})`;
        answersByOffer[offerKey][qId] = answer;
      });
    });

    // Attach answers to the offer for UI cards
    offer.answers = answersByOffer[offerKey];
  });

  return {
    responsePayload: {
      equipe: payload.equipe,
      reponses: answersByOffer,
    },
    offers,
  };
}
