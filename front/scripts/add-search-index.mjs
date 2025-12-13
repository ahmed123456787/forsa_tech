// Add fulltext search index to chat_messages collection
import { Client, Databases } from "node-appwrite";

const config = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "693acfc500198730032d",
  apiKey:
    "standard_fb9fc02abebadc1b2538a860abac90a1bd911aa5e6ba09baca49a85ebd1556a09bd8f220e03d744370fab577d8890fab64cfad2129e27291b232785fc3d84761168f122605c6ce5f729b931310f18e8ed93a495b45e589683b19198f9e27e11fb4210444867e7e23b6add5cfd0d16db9f2969f8244b2534570065d7f6b1b3d71",
  databaseId: "at_database",
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);

async function addSearchIndexes() {
  console.log("🔍 Adding fulltext search indexes...\n");

  try {
    // Add fulltext index on content field for chat_messages
    console.log("   Adding fulltext index on chat_messages.content...");
    await databases.createIndex(
      config.databaseId,
      "chat_messages",
      "content_search",
      "fulltext",
      ["content"]
    );
    console.log("   ✅ Fulltext index created on chat_messages.content");
  } catch (error) {
    if (error.code === 409) {
      console.log("   ⚠️ Index already exists");
    } else {
      console.error("   ❌ Error creating index:", error.message);
    }
  }

  try {
    // Add index on sessionId for faster lookups
    console.log("   Adding index on chat_messages.sessionId...");
    await databases.createIndex(
      config.databaseId,
      "chat_messages",
      "sessionId_idx",
      "key",
      ["sessionId"]
    );
    console.log("   ✅ Index created on chat_messages.sessionId");
  } catch (error) {
    if (error.code === 409) {
      console.log("   ⚠️ Index already exists");
    } else {
      console.error("   ❌ Error creating index:", error.message);
    }
  }

  try {
    // Add fulltext index on chat_sessions title
    console.log("   Adding fulltext index on chat_sessions.title...");
    await databases.createIndex(
      config.databaseId,
      "chat_sessions",
      "title_search",
      "fulltext",
      ["title"]
    );
    console.log("   ✅ Fulltext index created on chat_sessions.title");
  } catch (error) {
    if (error.code === 409) {
      console.log("   ⚠️ Index already exists");
    } else {
      console.error("   ❌ Error creating index:", error.message);
    }
  }

  try {
    // Add fulltext index on chat_sessions lastMessage
    console.log("   Adding fulltext index on chat_sessions.lastMessage...");
    await databases.createIndex(
      config.databaseId,
      "chat_sessions",
      "lastMessage_search",
      "fulltext",
      ["lastMessage"]
    );
    console.log("   ✅ Fulltext index created on chat_sessions.lastMessage");
  } catch (error) {
    if (error.code === 409) {
      console.log("   ⚠️ Index already exists");
    } else {
      console.error("   ❌ Error creating index:", error.message);
    }
  }

  console.log("\n✅ Done! Indexes are being built (may take a few seconds).");
}

addSearchIndexes();
