// Additional navigation keyboards for specific contexts
import { COMMANDS } from "./botCommands";

export const NAV_KEYBOARDS = {
  LINKS_RESULT: {
    inline_keyboard: [
      [
        { text: "💰 Credits", callback_data: "nav_credits" },
        { text: "👤 Profile", callback_data: "nav_profile" },
      ],
      [{ text: "❌ Cancel", callback_data: "nav_cancel" }],
    ],
  },
};
