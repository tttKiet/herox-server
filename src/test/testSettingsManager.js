// Test script for SettingsManager
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { SettingsManager } = require("../class");
const { setupDB } = require("../utils/mongoDb");

/**
 * Test the SettingsManager functionality
 */
async function testSettingsManager() {
  console.log("Starting SettingsManager test...");

  // Setup database connection
  const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017";
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "x-n8n-kaito";

  try {
    // Initialize DB connection
    await setupDB(MONGODB_URL, MONGODB_DB_NAME);
    console.log("Connected to MongoDB successfully");

    // Create a new settings manager
    const settingsManager = new SettingsManager();

    // Test 1: Initialize default settings
    console.log("\nTest 1: Initialize default settings");
    const defaultSettings = await settingsManager.initDefaultSettings();
    console.log("Default settings initialized:", defaultSettings);

    // Test 2: Get settings
    console.log("\nTest 2: Get settings");
    const currentSettings = await settingsManager.getSettings();
    console.log("Current settings:", currentSettings);

    // Test 3: Update settings
    console.log("\nTest 3: Update settings");
    const updateData = {
      minimumLinksForTask: 25,
      additionalLinks: 8,
      selectionMethod: "random",
    };
    const updatedSettings = await settingsManager.updateSettings(
      updateData,
      "test-user"
    );
    console.log("Settings updated:", updatedSettings);

    // Test 4: Get updated settings
    console.log("\nTest 4: Get updated settings");
    const afterUpdateSettings = await settingsManager.getSettings();
    console.log("Settings after update:", afterUpdateSettings);

    // Test 5: Calculate link distribution
    console.log("\nTest 5: Calculate link distribution");
    const distribution = await settingsManager.calculateLinkDistribution();
    console.log("Link distribution:", distribution);

    console.log("\nAll tests completed successfully");
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Run the tests
testSettingsManager()
  .catch(console.error)
  .finally(() => {
    console.log("Test script finished");
    process.exit(0);
  });
