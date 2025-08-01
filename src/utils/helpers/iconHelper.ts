// iconHelper.ts
// Mapping từ react-icons sang unicode emoji hoặc văn bản đại diện
// Bạn có thể tham khảo các icon tại: https://react-icons.github.io/react-icons/

// Danh sách emoji Unicode để sử dụng trong Telegram
export const ICONS = {
  // User related icons
  USER: "👤",
  USER_ADD: "➕👤",
  USER_REMOVE: "➖👤",
  USER_CHECK: "✅👤",

  // Post related icons
  POST: "📝",
  POST_ADD: "➕📝",
  POST_LIST: "📋",

  // Link related icons
  LINK: "🔗",
  LINK_ADD: "➕🔗",
  LINK_REMOVE: "➖🔗",
  LINK_CHECK: "✅🔗",

  // Navigation icons
  BACK: "⬅️",
  NEXT: "➡️",
  HOME: "🏠",
  REFRESH: "🔄",
  CLOSE: "❌",

  // Status icons
  SUCCESS: "✅",
  ERROR: "❌",
  WARNING: "⚠️",
  INFO: "ℹ️",
  LOADING: "⏳",

  // Credit related icons
  CREDIT: "💰",
  CREDIT_ADD: "➕💰",
  CREDIT_REMOVE: "➖💰",

  // Other icons
  HELP: "❓",
  SETTINGS: "⚙️",
  MENU: "📜",
  DELETE: "🗑️",
  EDIT: "✏️",
  SEARCH: "🔍",
  SEND: "📤",
  RECEIVE: "📥",
  BOOKMARK: "🔖",
  STAR: "⭐",
  HEART: "❤️",
  NOTIFICATION: "🔔",
  NO_NOTIFICATION: "🔕",
};

// Cách sử dụng:
// import { ICONS } from '../utils/helpers/iconHelper';
// const menuText = `${ICONS.MENU} Menu Options`;
