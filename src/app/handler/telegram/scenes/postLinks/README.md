# Post Links Scene

This directory contains the scene for posting links in the Telegram bot. The code is organized into the following files:

## Files Structure

- **index.ts**: The main scene file that defines the Telegraf scene object and the main handlers for text and message inputs.
- **scene.ts**: Entry point that exports the scene for use in the main application.
- **linkUtils.ts**: Utility functions for link validation, extraction, and username detection.
- **linkProcessor.ts**: Functions for processing and saving links, including credit verification.
- **creditHandler.ts**: Functions for handling user credits and displaying credit information.

## Flow

1. User enters the scene via a command
2. The scene checks if the user has a registered profile
3. If links are detected in the message or database, they are processed automatically
4. Otherwise, the user is prompted to paste their links
5. Links are validated, checked for proper usernames, and processed
6. Credits are checked and deducted accordingly
7. User is shown success/error messages and the scene exits

## Usage

Import the scene in your main bot file:

```typescript
import { postLinksScene } from "./scenes/postLinks/scene";
```

Register it with your Telegraf bot:

```typescript
const stage = new Scenes.Stage([postLinksScene /* other scenes */]);
bot.use(stage.middleware());
```
