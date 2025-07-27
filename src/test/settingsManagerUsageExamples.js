// Examples of how to use SettingsManager in various application parts

/**
 * Example 1: Using SettingsManager in task distribution
 */
async function distributeTasksExample() {
  const { SettingsManager } = require("../class");
  const settingsManager = new SettingsManager();

  try {
    // Get link distribution settings
    const linkSettings = await settingsManager.calculateLinkDistribution();

    // Using the settings to determine how many links to assign
    const { requiredLinks, totalLinks, sourceForAdditionalLinks } =
      linkSettings;

    console.log(`Task will require ${requiredLinks} links from the user`);
    console.log(`Total links to interact with: ${totalLinks}`);
    console.log(`Additional links will come from: ${sourceForAdditionalLinks}`);

    // Example logic for task distribution using settings
    if (sourceForAdditionalLinks === "admin") {
      // Get additional links from admin-provided sources
      console.log("Getting additional links from admin sources");
    } else {
      // Get additional links from member-provided sources
      console.log("Getting additional links from member sources");
    }
  } catch (error) {
    console.error("Error in task distribution:", error);
  }
}

/**
 * Example 2: Admin settings panel handler
 */
async function adminSettingsPanelExample(req, res) {
  const { SettingsManager } = require("../class");
  const settingsManager = new SettingsManager();

  try {
    // Handle GET request to retrieve current settings
    if (req.method === "GET") {
      const settings = await settingsManager.getSettings();
      return { settings };
    }

    // Handle POST request to update settings
    if (req.method === "POST") {
      const {
        minimumLinksForTask,
        additionalLinks,
        selectionMethod,
        additionalLinkSource,
      } = req.body;
      const adminId = req.user.id; // Assuming authentication middleware sets this

      // Validate inputs
      if (minimumLinksForTask < 1 || additionalLinks < 0) {
        return {
          error: "Invalid values for minimumLinksForTask or additionalLinks",
        };
      }

      // Update settings
      const updatedSettings = await settingsManager.updateSettings(
        {
          minimumLinksForTask,
          additionalLinks,
          selectionMethod,
          additionalLinkSource,
        },
        adminId
      );

      return { success: true, settings: updatedSettings };
    }
  } catch (error) {
    console.error("Error in admin settings panel:", error);
    return { error: "Failed to process settings request" };
  }
}

// Export the examples
module.exports = {
  distributeTasksExample,
  adminSettingsPanelExample,
};
