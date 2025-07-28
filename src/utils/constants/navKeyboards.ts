// Additional navigation keyboards for specific contexts
import { COMMANDS } from "./botCommands";

export const NAV_KEYBOARDS = {
  // Main start menu with all options as inline buttons
  START_MENU: {
    inline_keyboard: [
      [
        { text: "👤 Setup Profile", callback_data: "nav_setup" },
        { text: "📋 Get Posts", callback_data: "nav_get_posts" },
      ],
      [
        { text: "💰 Credits", callback_data: "nav_credits" },
        { text: "👤 Profile", callback_data: "nav_profile" },
      ],
      [
        { text: "🔗 Post Links", callback_data: "nav_post" },
        { text: "🔄 My Links", callback_data: "nav_my_links" },
      ],
      [
        { text: "❓ Help", callback_data: "nav_help" },
        { text: "❌ Close", callback_data: "nav_close" },
      ],
    ],
  },

  LINKS_RESULT: {
    inline_keyboard: [
      [
        { text: "💰 Credits", callback_data: "nav_credits" },
        { text: "👤 Profile", callback_data: "nav_profile" },
      ],
      [{ text: "❌ Cancel", callback_data: "nav_cancel" }],
    ],
  },

  // Keyboard for showing credits and profile options
  CREDITS_PROFILE: {
    inline_keyboard: [
      [
        { text: "💰 Credits", callback_data: "nav_credits" },
        { text: "👤 Profile", callback_data: "nav_profile" },
      ],
      [{ text: "❌ Close", callback_data: "nav_close" }],
    ],
  },

  // Keyboard for my links page
  MY_LINKS: {
    inline_keyboard: [
      [
        { text: "💰 Credits", callback_data: "nav_credits" },
        { text: "👤 Profile", callback_data: "nav_profile" },
      ],
      [
        { text: "🔗 Post Links", callback_data: "nav_post" },
        { text: "❌ Close", callback_data: "nav_close" },
      ],
    ],
  },
};
