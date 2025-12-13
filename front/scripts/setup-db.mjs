// Appwrite Database Setup Script
// This script creates the database, collections, and sample data

import { Client, Databases, ID } from "node-appwrite";

// Configuration
const config = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "693acfc500198730032d",
  apiKey:
    "standard_fb9fc02abebadc1b2538a860abac90a1bd911aa5e6ba09baca49a85ebd1556a09bd8f220e03d744370fab577d8890fab64cfad2129e27291b232785fc3d84761168f122605c6ce5f729b931310f18e8ed93a495b45e589683b19198f9e27e11fb4210444867e7e23b6add5cfd0d16db9f2969f8244b2534570065d7f6b1b3d71",
  databaseId: "at_database",
};

// Initialize client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);

// Helper function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Collection definitions
const collections = [
  {
    id: "offers",
    name: "Offers",
    attributes: [
      { key: "name", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 2000, required: true },
      { key: "sector", type: "string", size: 100, required: true },
      { key: "partnerId", type: "string", size: 50, required: false },
      { key: "validFrom", type: "string", size: 50, required: false },
      { key: "validTo", type: "string", size: 50, required: false },
      { key: "price", type: "integer", required: true },
      { key: "pdfFileId", type: "string", size: 50, required: false },
      { key: "badge", type: "string", size: 50, required: false },
    ],
  },
  {
    id: "conventions",
    name: "Conventions",
    attributes: [
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 2000, required: true },
      { key: "partnerId", type: "string", size: 50, required: true },
      { key: "pdfFileId", type: "string", size: 50, required: false },
      { key: "signedDate", type: "string", size: 50, required: true },
      { key: "validUntil", type: "string", size: 50, required: true },
    ],
  },
  {
    id: "partners",
    name: "Partners",
    attributes: [
      { key: "name", type: "string", size: 255, required: true },
      { key: "sector", type: "string", size: 100, required: true },
      { key: "description", type: "string", size: 2000, required: true },
      { key: "logoFileId", type: "string", size: 50, required: false },
      { key: "conventionsCount", type: "integer", required: true },
    ],
  },
  {
    id: "chat_sessions",
    name: "Chat Sessions",
    attributes: [
      { key: "userId", type: "string", size: 50, required: false },
      { key: "title", type: "string", size: 255, required: true },
      { key: "lastMessage", type: "string", size: 500, required: false },
    ],
  },
  {
    id: "chat_messages",
    name: "Chat Messages",
    attributes: [
      { key: "sessionId", type: "string", size: 50, required: true },
      { key: "role", type: "string", size: 20, required: true },
      { key: "content", type: "string", size: 10000, required: true },
    ],
  },
];

// Sample data
const sampleOffers = [
  {
    name: "Idoom Fibre Pro 100M",
    description:
      "Connexion très haut débit jusqu'à 100 Mbps, idéale pour les PME. Inclut IP fixe et support prioritaire 24/7.",
    sector: "Entreprise",
    partnerId: "",
    validFrom: "2024-01-01",
    validTo: "2025-12-31",
    price: 3500,
    pdfFileId: "",
    badge: "POPULAIRE",
  },
  {
    name: "Idoom Fibre Pro 300M",
    description:
      "Solution premium avec 300 Mbps symétrique et IP fixe incluse. Parfait pour les grandes entreprises et data centers.",
    sector: "Entreprise",
    partnerId: "",
    validFrom: "2024-01-01",
    validTo: "2025-12-31",
    price: 5500,
    pdfFileId: "",
    badge: "RECOMMANDÉ",
  },
  {
    name: "Pack Start-up",
    description:
      "Offre spéciale pour les jeunes entreprises avec tarif préférentiel. Internet 50Mbps + téléphonie illimitée.",
    sector: "Start-up",
    partnerId: "",
    validFrom: "2024-01-01",
    validTo: "2025-12-31",
    price: 2500,
    pdfFileId: "",
    badge: "START-UP",
  },
  {
    name: "Idoom ADSL Business",
    description:
      "Connexion ADSL fiable jusqu'à 20 Mbps pour les zones non couvertes par la fibre optique.",
    sector: "Entreprise",
    partnerId: "",
    validFrom: "2024-01-01",
    validTo: "2025-12-31",
    price: 1800,
    pdfFileId: "",
    badge: "",
  },
  {
    name: "Pack Hébergement Web Pro",
    description:
      "Hébergement sécurisé avec nom de domaine .dz inclus. Espace disque 100GB, SSL gratuit, backup quotidien.",
    sector: "Hébergement",
    partnerId: "",
    validFrom: "2024-01-01",
    validTo: "2025-12-31",
    price: 4000,
    pdfFileId: "",
    badge: "",
  },
];

const samplePartners = [
  {
    name: "Banque Nationale d'Algérie",
    sector: "Banque",
    description:
      "Partenariat stratégique pour les solutions télécom dans le secteur bancaire. Connectivité sécurisée pour toutes les agences.",
    logoFileId: "",
    conventionsCount: 3,
  },
  {
    name: "Sonatrach",
    sector: "Énergie",
    description:
      "Solutions de connectivité haute disponibilité pour le secteur pétrolier et gazier. Réseau privé sécurisé.",
    logoFileId: "",
    conventionsCount: 5,
  },
  {
    name: "Air Algérie",
    sector: "Transport",
    description:
      "Infrastructure réseau pour le transport aérien national. Connexion fibre pour tous les aéroports.",
    logoFileId: "",
    conventionsCount: 2,
  },
  {
    name: "Université d'Alger",
    sector: "Éducation",
    description:
      "Partenariat pour la connectivité campus et e-learning. Fibre optique haute capacité.",
    logoFileId: "",
    conventionsCount: 4,
  },
];

const sampleConventions = [
  {
    title: "Convention BNA - Fibre Entreprise",
    description:
      "Accord cadre pour le déploiement de la fibre optique dans toutes les agences bancaires sur le territoire national.",
    partnerId: "bna",
    signedDate: "2024-03-15",
    validUntil: "2026-03-15",
    pdfFileId: "",
  },
  {
    title: "Convention Sonatrach - Télécoms Industriels",
    description:
      "Partenariat global pour les services de télécommunication des sites industriels et bases de vie.",
    partnerId: "sonatrach",
    signedDate: "2024-01-10",
    validUntil: "2027-01-10",
    pdfFileId: "",
  },
  {
    title: "Convention Air Algérie - Connectivité Aéroportuaire",
    description:
      "Déploiement de solutions de connectivité pour les comptoirs et bureaux dans tous les aéroports.",
    partnerId: "air-algerie",
    signedDate: "2024-06-01",
    validUntil: "2026-06-01",
    pdfFileId: "",
  },
];

async function main() {
  console.log("🚀 Starting Appwrite Database Setup...\n");

  try {
    // Step 1: Create Database
    console.log("📦 Creating database...");
    try {
      await databases.create(config.databaseId, "Algeria Telecom Database");
      console.log("✅ Database created: " + config.databaseId);
    } catch (error) {
      if (error.code === 409) {
        console.log("ℹ️  Database already exists, continuing...");
      } else {
        throw error;
      }
    }

    // Step 2: Create Collections
    for (const collection of collections) {
      console.log(`\n📁 Creating collection: ${collection.name}...`);

      try {
        await databases.createCollection(
          config.databaseId,
          collection.id,
          collection.name,
          [
            // Allow anyone to read/write for testing
            'read("any")',
            'create("any")',
            'update("any")',
            'delete("any")',
          ]
        );
        console.log(`✅ Collection created: ${collection.id}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(
            `ℹ️  Collection ${collection.id} already exists, skipping...`
          );
          continue;
        } else {
          throw error;
        }
      }

      // Create attributes
      for (const attr of collection.attributes) {
        process.stdout.write(`   Adding attribute: ${attr.key}... `);
        try {
          if (attr.type === "string") {
            await databases.createStringAttribute(
              config.databaseId,
              collection.id,
              attr.key,
              attr.size,
              attr.required,
              attr.required ? undefined : ""
            );
          } else if (attr.type === "integer") {
            await databases.createIntegerAttribute(
              config.databaseId,
              collection.id,
              attr.key,
              attr.required,
              0, // min
              9999999 // max
            );
          }
          console.log("✅");
        } catch (error) {
          if (error.code === 409) {
            console.log("exists");
          } else {
            console.log("❌ " + error.message);
          }
        }
        await sleep(500); // Wait between attribute creations
      }
    }

    // Step 3: Wait for attributes to be indexed
    console.log("\n⏳ Waiting for attributes to be indexed (15 seconds)...");
    await sleep(15000);

    // Step 4: Insert sample data
    console.log("\n📝 Inserting sample data...");

    // Insert offers
    console.log("\n   📦 Adding offers...");
    for (const offer of sampleOffers) {
      try {
        await databases.createDocument(
          config.databaseId,
          "offers",
          ID.unique(),
          offer
        );
        console.log(`   ✅ ${offer.name}`);
      } catch (error) {
        console.log(`   ❌ ${offer.name}: ${error.message}`);
      }
    }

    // Insert partners
    console.log("\n   🤝 Adding partners...");
    for (const partner of samplePartners) {
      try {
        await databases.createDocument(
          config.databaseId,
          "partners",
          ID.unique(),
          partner
        );
        console.log(`   ✅ ${partner.name}`);
      } catch (error) {
        console.log(`   ❌ ${partner.name}: ${error.message}`);
      }
    }

    // Insert conventions
    console.log("\n   📄 Adding conventions...");
    for (const convention of sampleConventions) {
      try {
        await databases.createDocument(
          config.databaseId,
          "conventions",
          ID.unique(),
          convention
        );
        console.log(`   ✅ ${convention.title}`);
      } catch (error) {
        console.log(`   ❌ ${convention.title}: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 SETUP COMPLETE!");
    console.log("=".repeat(50));
    console.log("\n📋 Created:");
    console.log("   • Database: at_database");
    console.log(
      "   • Collections: offers, conventions, partners, chat_sessions, chat_messages"
    );
    console.log("   • Sample Data: 5 offers, 4 partners, 3 conventions");
    console.log("\n🌐 View in Appwrite Console:");
    console.log(
      "   https://cloud.appwrite.io/console/project-693acfc500198730032d/databases"
    );
    console.log("");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
