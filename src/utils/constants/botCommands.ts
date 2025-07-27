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
};

export const BUTTONS = {
  SETUP_PROFILE: "👤 Setup Profile",
  GET_POSTS: "📋 Get Posts",
  CHECK_INTERACTIONS: "✅ Check",
  POST_LINKS: "🔗 Post Links",
  HELP: "❓ Help",
  MY_PROFILE: "👤 My Profile",
  DELETE_USERNAMES: "🗑️ Delete Usernames",
  MY_CREDITS: "💰 My Credits",
};

// Common messages
export const MESSAGES = {
  CANCEL_OPERATION: "❌ Operation cancelled.",
  BUSY_IN_SCENE:
    "⚠️ You are currently in a command process. Please complete or cancel (/cancel) before using another command.",
  LINK_DETECTED: "🔗 X links detected! Processing as post links submission...",
};

// Reusable reply markup keyboards
export const KEYBOARDS = {
  MAIN: {
    keyboard: [
      [{ text: BUTTONS.GET_POSTS }, { text: BUTTONS.CHECK_INTERACTIONS }],
      [{ text: BUTTONS.SETUP_PROFILE }, { text: BUTTONS.MY_CREDITS }],
      [{ text: BUTTONS.MY_PROFILE }, { text: BUTTONS.DELETE_USERNAMES }],
      [{ text: BUTTONS.HELP }],
    ],
    resize_keyboard: true,
  },
  AFTER_SETUP: {
    keyboard: [
      [{ text: BUTTONS.GET_POSTS }],
      [{ text: BUTTONS.SETUP_PROFILE }, { text: BUTTONS.HELP }],
    ],
    resize_keyboard: true,
  },
  AFTER_GET_POSTS: {
    keyboard: [
      [{ text: BUTTONS.CHECK_INTERACTIONS }, { text: BUTTONS.GET_POSTS }],
      [{ text: BUTTONS.SETUP_PROFILE }, { text: BUTTONS.HELP }],
    ],
    resize_keyboard: true,
  },
  AFTER_CHECK: {
    keyboard: [
      [{ text: BUTTONS.POST_LINKS }],
      [{ text: BUTTONS.GET_POSTS }, { text: BUTTONS.HELP }],
    ],
    resize_keyboard: true,
  },
};
