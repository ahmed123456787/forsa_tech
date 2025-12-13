// Appwrite Permissions Update Script
// This script updates collection permissions to allow guest access

import { Client, Databases, Permission, Role } from "node-appwrite";

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

const collections = [
  "offers",
  "conventions",
  "partners",
  "chat_sessions",
  "chat_messages",
];

// Permissions that allow any user (including guests) to read and write
const permissions = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function updatePermissions() {
  console.log("🔐 Updating collection permissions...\n");

  for (const collectionId of collections) {
    try {
      await databases.updateCollection(
        config.databaseId,
        collectionId,
        collectionId, // name (keep same)
        permissions,
        true // documentSecurity = true to allow document-level permissions
      );
      console.log(`✅ Updated permissions for: ${collectionId}`);
    } catch (error) {
      console.error(`❌ Error updating ${collectionId}:`, error.message);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 PERMISSIONS UPDATE COMPLETE!");
  console.log("==================================================");
  console.log("\nAll collections now allow guest read/write access.");
  console.log(
    "For production, you should restrict this to authenticated users."
  );
}

updatePermissions();
