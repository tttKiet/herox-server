# Telegram Bot Refactoring Plan

## Directory Structure

```
src/
├── app/
│   ├── telegram/
│   │   ├── bot/
│   │   │   ├── index.ts                   # Main bot entry point
│   │   │   ├── config/                    # Configuration files
│   │   │   │   ├── botConfig.ts           # Bot configuration
│   │   │   │   └── serviceConfig.ts       # Service configuration
│   │   │   ├── constants/                 # All constants
│   │   │   │   ├── messages.ts            # All message texts
│   │   │   │   ├── commands.ts            # Command definitions
│   │   │   │   ├── keyboards.ts           # Keyboard layouts
│   │   │   │   └── buttons.ts             # Button definitions
│   │   │   ├── scenes/                    # All scene definitions
│   │   │   │   ├── index.ts               # Export all scenes
│   │   │   │   ├── setupUserScene.ts      # User setup scene
│   │   │   │   ├── getPostsScene.ts       # Get posts scene
│   │   │   │   └── ...                    # Other scenes
│   │   │   ├── handlers/                  # Command and action handlers
│   │   │   │   ├── index.ts               # Export all handlers
│   │   │   │   ├── commandHandlers.ts     # Command handlers
│   │   │   │   ├── actionHandlers.ts      # Callback query handlers
│   │   │   │   └── messageHandlers.ts     # Message handlers
│   │   │   ├── services/                  # Business logic services
│   │   │   │   ├── index.ts               # Export all services
│   │   │   │   ├── userService.ts         # User-related operations
│   │   │   │   ├── taskService.ts         # Task-related operations
│   │   │   │   └── creditService.ts       # Credit-related operations
│   │   │   ├── middlewares/               # Bot middlewares
│   │   │   │   ├── index.ts               # Export all middlewares
│   │   │   │   ├── authMiddleware.ts      # Authentication middleware
│   │   │   │   └── logMiddleware.ts       # Logging middleware
│   │   │   └── utils/                     # Bot-specific utilities
│   │   │       ├── messageFormatters.ts   # Format messages consistently
│   │   │       └── keyboardBuilders.ts    # Build keyboards dynamically
│   │   └── BotManager.ts                  # Bot startup/shutdown management
```

## Key Components and Features

### 1. Constants Management

- `constants/messages.ts`: All message templates with proper documentation
- `constants/commands.ts`: Command definitions and handlers
- `constants/keyboards.ts`: Keyboard layouts for consistent UI
- `constants/buttons.ts`: Button text and callback data

### 2. Scene Organization

- Each scene in its own file with clear documentation
- Scene-specific handlers organized with comments
- Scene business logic delegated to service classes

### 3. Service-Based Architecture

- `services/userService.ts`: User management, profiles, authentication
- `services/taskService.ts`: Task creation, management, and tracking
- `services/creditService.ts`: Credit system management

### 4. Handler Documentation

- Every handler includes:
  - Purpose documentation
  - Parameter descriptions
  - Return value explanations
  - Error handling strategies

### 5. BotManager

- Centralized bot lifecycle management
- Simple API for starting/stopping the bot
- Configuration management

## Implementation Guidelines

### Constants Structure

```typescript
/**
 * All message templates used by the bot
 * This makes it easy to change message text and formatting in one place
 */
export const MESSAGES = {
  /**
   * Welcome message shown when user starts the bot or returns to main menu
   */
  WELCOME: `Welcome to X Interaction Bot! 🚀\n\n...`,

  /**
   * Shown when user cancels an operation
   */
  CANCEL_OPERATION: `❌ Operation cancelled.`,

  // Group messages by functionality
  PROFILE: {
    SETUP_SUCCESS: `✅ Profile setup successful!`,
    SETUP_INSTRUCTIONS: `Please enter your X usernames, one per line...`,
    // More profile-related messages
  },

  TASKS: {
    NO_TASKS: `❌ No tasks available`,
    TASK_INSTRUCTIONS: `📌 Instructions for completing tasks...`,
    // More task-related messages
  },

  // Add more message categories
};
```

### Handler Documentation

```typescript
/**
 * Handler for /start command
 * Shows welcome message and main menu to the user
 *
 * @param ctx - Telegraf context object
 */
export async function handleStartCommand(ctx: Context): Promise<void> {
  try {
    logger.info(`User ${ctx.from?.id} started the bot`);
    await ctx.reply(MESSAGES.WELCOME, {
      parse_mode: "HTML",
      ...KEYBOARDS.MAIN_MENU,
    });
  } catch (error) {
    logger.error(`Error handling start command: ${error}`);
    await ctx.reply(MESSAGES.ERROR.GENERAL);
  }
}
```

### Service Class Example

```typescript
/**
 * Service for handling user-related operations
 */
export class UserService {
  /**
   * Register or update a user in the database
   *
   * @param userId - Telegram user ID
   * @param username - Telegram username
   * @param chatId - Chat ID where the user is interacting with the bot
   * @param xUsernames - Array of X usernames to register for this user
   * @returns The registered user object
   */
  async registerUser({
    userId,
    username,
    chatId,
    xUsernames,
  }: {
    userId: string;
    username: string;
    chatId: string;
    xUsernames: string[];
  }): Promise<ITelegramUser> {
    logger.info(
      `Registering user ${username} (${userId}) with ${xUsernames.length} X usernames`
    );

    // Implementation details...

    return registeredUser;
  }
}
```

## Migration Strategy

1. Create the new directory structure
2. Extract constants from current implementation
3. Create service classes for business logic
4. Refactor scenes to use new services and constants
5. Implement BotManager
6. Remove API-related code
7. Update main entry point

## Benefits

- **Clear Separation of Concerns**: Each component has a specific responsibility
- **Easy Customization**: All messages and keyboards are defined as constants
- **Better Maintainability**: Well-documented code with consistent structure
- **Improved Reusability**: Services can be used across different scenes
- **Simplified Testing**: Components can be tested in isolation
- **Future-Proofing**: Easy to add new features without modifying existing code
