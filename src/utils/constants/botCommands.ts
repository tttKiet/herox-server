// Define commands and button text for telegram bot

export const COMMANDS = {
  START: "/start",
  HELP: "/help",
  SETUP: "/setup",
  GET_POSTS: "/get",
  CHECK: "/check",
  POST: "/post",
  CANCEL: "/cancel",
  PROFILE: "/profile",
  DELETE: "/delete",
  CREDITS: "/credits", // Check credit balance
  ADMIN: "/admin", // Hidden admin command
  LINKS: "/links", // Show user's own links
};

export const BUTTONS = {
  SETUP_PROFILE: "👤 Setup Profile",
  GET_POSTS: "📋 Get Posts",
  CHECK_INTERACTIONS: "✅ Check",
  POST_LINKS: "🔗 Post Links",
  HELP: "❓ Help",
  MY_PROFILE: "👤 My Profile",
  DELETE_USERNAMES: "🗑️ Delete",
  MY_CREDITS: "💰 Credits",
  MY_LINKS: "🔄 Links",
  ALL_OPTIONS: "📜 Menu",
};

// Common messages
export const MESSAGES = {
  CANCEL_OPERATION: "❌ Operation cancelled.",
  BUSY_IN_SCENE:
    "⚠️ You are currently in a command process. Please complete or cancel (/cancel) before using another command.",
  LINK_DETECTED: "🔗 X links detected! Processing as post links submission...",
  WELCOME:
    "Welcome to X Interaction Bot! 🚀\n\n" +
    "This system helps you with cross-interactions on X (Twitter).\n\n" +
    "To get started:\n" +
    "• Click on 'Setup Profile' to register your X usernames\n" +
    "• Check your credits with 'Credits'\n" +
    "• View your registered accounts with 'Profile'\n\n" +
    "Use the Menu button to access all features, or use the options below:",
};

export const MENU = {
  remove_keyboard: true,
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
};

// Reusable reply markup keyboards
export const KEYBOARDS = {
  // Main menu when user presses start - with inline buttons
  MAIN: MENU,
  // Menu after setup profile
  AFTER_SETUP: MENU,
  // Menu at delete usernames page
  DELETE_USERNAMES_PAGE: MENU,
  // Menu at get posts page
  GET_POSTS_PAGE: MENU,
  // All options menu
  ALL_OPTIONS: {
    keyboard: [
      [{ text: BUTTONS.SETUP_PROFILE }, { text: BUTTONS.DELETE_USERNAMES }],
      [{ text: BUTTONS.GET_POSTS }, { text: BUTTONS.CHECK_INTERACTIONS }],
      [{ text: BUTTONS.POST_LINKS }, { text: BUTTONS.MY_CREDITS }],
      [{ text: BUTTONS.MY_LINKS }, { text: BUTTONS.MY_PROFILE }],
      [{ text: BUTTONS.HELP }],
    ],
    resize_keyboard: true,
  },
  // Menu after check interactions
  AFTER_CHECK: MENU,
};
