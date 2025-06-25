# App Store MCP Server

[![npm version](https://badge.fury.io/js/app-store-mcp.svg)](https://www.npmjs.com/package/app-store-mcp)

⚠️ **IMPORTANT SECURITY NOTICE**: Never commit API keys to version control. This package requires an API key to be set via environment variable.

An MCP (Model Context Protocol) server that provides access to app store data from both Apple App Store and Google Play Store through the App Stores API.

## Features

- **Autocomplete**: Get app name suggestions based on search terms
- **Search**: Search for apps across app stores
- **Details**: Get detailed information about specific apps
- **Reviews**: Fetch user reviews for apps

## Installation

### Option 1: Using npx (Recommended)
```bash
# Set your API key first
export APP_STORE_API_KEY="your-api-key-here"

# Run directly with npx
npx app-store-mcp
```

### Option 2: Global Installation
```bash
npm install -g app-store-mcp
```

### Option 3: Local Development
```bash
git clone <repository-url>
cd app-store-mcp
npm install
npm run build
```

## Configuration

**Required**: You must set the `APP_STORE_API_KEY` environment variable before running the server.

1. Get an API key from [RapidAPI App Stores](https://rapidapi.com/marketplace/api/app-stores)
2. Set the environment variable:
   ```bash
   # Option 1: Export in your shell
   export APP_STORE_API_KEY="your-api-key-here"
   
   # Option 2: Create a .env file (for local development)
   echo "APP_STORE_API_KEY=your-api-key-here" > .env
   ```

⚠️ **Security**: Never commit your `.env` file or API key to version control!

## Usage

### Running the server

```bash
# If installed globally or using npx
app-store-mcp

# For local development
npm start

# For development with auto-reload
npm run dev
```

### Available Tools

#### 1. `app_store_autocomplete`
Get app name suggestions based on a search term.

**Parameters:**
- `store` (required): "apple" or "google"
- `term` (required): Search term for autocomplete
- `language` (optional): Language code (default: "en")

#### 2. `app_store_search`
Search for apps in the app store.

**Parameters:**
- `store` (required): "apple" or "google"
- `term` (required): Search term
- `language` (optional): Language code (default: "en")

#### 3. `app_store_details`
Get detailed information about a specific app.

**Parameters:**
- `store` (required): "apple" or "google"
- `id` (required): App ID (bundle ID for iOS, package name for Android)
- `language` (optional): Language code (default: "en")

#### 4. `app_store_reviews`
Get reviews for a specific app.

**Parameters:**
- `store` (required): "apple" or "google"
- `id` (required): App ID (bundle ID for iOS, package name for Android)
- `language` (optional): Language code (default: "en")

### Example Usage with MCP Client

```typescript
// Search for apps
const searchResult = await client.callTool('app_store_search', {
  store: 'google',
  term: 'meditation',
  language: 'en'
});

// Get app details
const appDetails = await client.callTool('app_store_details', {
  store: 'apple',
  id: 'com.spotify.client',
  language: 'en'
});

// Get app reviews
const reviews = await client.callTool('app_store_reviews', {
  store: 'google',
  id: 'com.snapchat.android',
  language: 'en'
});
```

## Configuration

The server can be configured using environment variables:

- `APP_STORE_API_KEY`: Your RapidAPI key for the App Stores API (required)

## Development

### Project Structure

```
app-store-mcp/
├── src/
│   ├── index.ts      # Main MCP server implementation
│   └── types.ts      # TypeScript type definitions
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Type Safety

This server is written in TypeScript and provides full type safety for:
- API parameters
- API responses
- Error handling
- Store validation (only accepts "apple" or "google")

## License

MIT