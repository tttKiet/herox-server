# Database Schema

## Collections

### interactXTgUsers

This collection stores information about Telegram users who use the X/Twitter interaction bot.

```typescript
interface ITelegramUser {
  _id?: ObjectId;
  userId: string; // Telegram user ID
  username: string; // Telegram username
  chatId: string; // Telegram chat ID
  registeredUsernames: string[]; // List of X usernames registered by this user
  detectedLinks?: string[]; // Detected X/Twitter links
  detectedAt?: Date; // When links were detected
  createdAt: Date;
  updatedAt: Date;
}
```

#### Fields Description:

- **userId**: The Telegram user's unique identifier
- **username**: The Telegram username of the user
- **chatId**: The Telegram chat ID for direct messaging
- **registeredUsernames**: Array of X/Twitter usernames that the user has registered with the bot
- **detectedLinks**: Array of X/Twitter links detected from the user's messages
- **detectedAt**: Timestamp indicating when the links were detected
- **createdAt**: When the user was first created
- **updatedAt**: When the user's record was last updated

## Database Operations

### Link Detection Flow

1. When a user sends messages containing X/Twitter links, they are extracted and stored in the `detectedLinks` field
2. The bot enters the "post-links" scene and retrieves these links from the database
3. After processing the links, the `detectedLinks` field is cleared from the database
4. This approach ensures persistence of detected links even if the session is lost

### Credit System

Credits are tracked separately for each X/Twitter username registered by a user. The credit system allows users to:

1. Earn credits by engaging with other users' content
2. Spend credits to have their own content shared with others
