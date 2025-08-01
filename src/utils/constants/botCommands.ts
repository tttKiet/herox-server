// Define commands and button text for telegram bot
import { ICONS } from "../helpers/iconHelper";

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
  SETUP_PROFILE: `${ICONS.USER} Setup Profile`,
  GET_POSTS: `${ICONS.POST_LIST} Get Posts`,
  GET_POSTS_ALL: `${ICONS.POST_LIST} Get All Posts`,
  GET_POSTS_SINGLE: `${ICONS.SEARCH} Get Posts for Username`,
  CHECK_INTERACTIONS: `${ICONS.SUCCESS} Check`,
  CHECK_INTERACTIONS_ALL: `${ICONS.SUCCESS} Check All Interactions`,
  CHECK_INTERACTIONS_SINGLE: `${ICONS.SEARCH} Check Username Interactions`,
  POST_LINKS: `${ICONS.LINK} Post Links`,
  HELP: `${ICONS.HELP} Help`,
  MY_PROFILE: `${ICONS.USER} My Profile`,
  DELETE_USERNAMES: `${ICONS.DELETE} Delete`,
  MY_CREDITS: `${ICONS.CREDIT} Credits`,
  MY_LINKS: `${ICONS.REFRESH} Links`,
  ALL_OPTIONS: `${ICONS.MENU} Menu`,
};

// Common messages
export const MESSAGES = {
  CANCEL_OPERATION: `${ICONS.CLOSE} Operation cancelled.`,
  BUSY_IN_SCENE: `${ICONS.WARNING} You are currently in a command process. Please complete or cancel (/cancel) before using another command.`,
  LINK_DETECTED: `${ICONS.LINK} X links detected! Processing as post links submission...`,
  WELCOME:
    "Welcome to X Interaction Bot! 🚀\n\n" +
    "This system helps you with cross-interactions on X (Twitter).\n\n" +
    "To get started:\n" +
    `• Click on '${ICONS.USER} Setup Profile' to register your X usernames\n` +
    `• Check your credits with '${ICONS.CREDIT} Credits'\n` +
    `• View your registered accounts with '${ICONS.USER} Profile'\n\n` +
    "Use the Menu button to access all features, or use the options below:",
};

export const MENU = {
  remove_keyboard: true,
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
};

// Reusable reply markup keyboards
export const KEYBOARDS = {
  // Main menu when user presses start - with inline buttons
  MAIN: MENU,
  // Menu after setup profile
  AFTER_SETUP: MENU,
  // Menu at delete usernames page
  DELETE_USERNAMES_PAGE: MENU,
  // Menu for Get Posts options (used for both GET_POSTS_PAGE and GET_POSTS_OPTIONS_PAGE)
  GET_POSTS_OPTIONS_PAGE: {
    remove_keyboard: true,
    inline_keyboard: [
      [
        { text: BUTTONS.GET_POSTS_ALL, callback_data: "nav_get_posts_all" },
        {
          text: BUTTONS.GET_POSTS_SINGLE,
          callback_data: "nav_get_posts_single",
        },
      ],
      [{ text: `${ICONS.BACK} Back to Menu`, callback_data: "nav_close" }],
    ],
  },
  // Menu for Check Interactions options
  CHECK_INTERACTIONS_OPTIONS_PAGE: {
    remove_keyboard: true,
    inline_keyboard: [
      [
        {
          text: BUTTONS.CHECK_INTERACTIONS_ALL,
          callback_data: "nav_check_interactions_all",
        },
        {
          text: BUTTONS.CHECK_INTERACTIONS_SINGLE,
          callback_data: "nav_check_interactions_single",
        },
      ],
      [{ text: `${ICONS.BACK} Back to Menu`, callback_data: "nav_close" }],
    ],
  },
  // For backward compatibility
  GET_POSTS_PAGE: {
    remove_keyboard: true,
    inline_keyboard: [
      [
        { text: BUTTONS.GET_POSTS_ALL, callback_data: "nav_get_posts_all" },
        {
          text: BUTTONS.GET_POSTS_SINGLE,
          callback_data: "nav_get_posts_single",
        },
      ],
      [{ text: `${ICONS.BACK} Back to Menu`, callback_data: "nav_close" }],
    ],
  },
  // All options menu
  ALL_OPTIONS: {
    keyboard: [
      [{ text: BUTTONS.SETUP_PROFILE }, { text: BUTTONS.DELETE_USERNAMES }],
      [{ text: BUTTONS.GET_POSTS_ALL }, { text: BUTTONS.GET_POSTS_SINGLE }],
      [{ text: BUTTONS.CHECK_INTERACTIONS }, { text: BUTTONS.POST_LINKS }],
      [{ text: BUTTONS.MY_CREDITS }, { text: BUTTONS.MY_LINKS }],
      [{ text: BUTTONS.MY_PROFILE }, { text: BUTTONS.HELP }],
    ],
    resize_keyboard: true,
  },
  // Menu after check interactions
  AFTER_CHECK: MENU,
};
