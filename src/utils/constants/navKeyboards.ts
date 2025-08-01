// Additional navigation keyboards for specific contexts
import { COMMANDS } from "./botCommands";
import { ICONS } from "../helpers/iconHelper";

export const NAV_KEYBOARDS = {
  // Main start menu with all options as inline buttons
  START_MENU: {
    inline_keyboard: [
      [
        { text: `${ICONS.USER} Setup Profile`, callback_data: "nav_setup" },
        { text: `${ICONS.USER} Profile`, callback_data: "nav_profile" },
      ],
      [
        {
          text: `${ICONS.POST_LIST} Get User Posts`,
          callback_data: "nav_get_posts_single",
        },
        {
          text: `${ICONS.POST_LIST} Get All Posts`,
          callback_data: "nav_get_posts_all",
        },
      ],
      [
        { text: `${ICONS.LINK} Post Links`, callback_data: "nav_post" },
        { text: `${ICONS.LINK} My Links`, callback_data: "nav_my_links" },
      ],
      [
        {
          text: `${ICONS.SUCCESS} Check User`,
          callback_data: "nav_check_interactions_single",
        },
        {
          text: `${ICONS.SUCCESS} Check All`,
          callback_data: "nav_check_interactions_all",
        },
      ],
      [{ text: `${ICONS.CREDIT} Credits`, callback_data: "nav_credits" }],
      [
        { text: `${ICONS.HELP} Help`, callback_data: "nav_help" },
        { text: `${ICONS.CLOSE} Close`, callback_data: "nav_close" },
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
