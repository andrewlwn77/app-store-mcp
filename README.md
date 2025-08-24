# App Store MCP Server

[![npm version](https://badge.fury.io/js/%40andrewlwn77%2Fapp-store-mcp.svg)](https://www.npmjs.com/package/@andrewlwn77/app-store-mcp)

⚠️ **IMPORTANT SECURITY NOTICE**: Never commit API keys to version control. This package requires an API key to be set via environment variable.

An MCP (Model Context Protocol) server that provides access to app store data from both Apple App Store and Google Play Store through the App Stores API.

## Features

- **Autocomplete**: Get app name suggestions based on search terms
- **Search**: Search for apps across app stores
- **Details**: Get detailed information about specific apps
- **Reviews**: Fetch user reviews for apps

## Installation

This MCP server is designed to be used with MCP-compatible applications like Claude Desktop, VS Code with Copilot, or other MCP clients.

### MCP Client Configuration

Add this server to your MCP client configuration:

#### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "app-store": {
      "command": "npx",
      "args": ["-y", "@andrewlwn77/app-store-mcp"],
      "env": {
        "APP_STORE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### VS Code with GitHub Copilot
Add to your MCP configuration (User Settings JSON or `.vscode/mcp.json`):
```json
{
  "servers": {
    "app-store": {
      "type": "stdio",
      "command": "npx", 
      "args": ["-y", "@andrewlwn77/app-store-mcp"],
      "env": {
        "APP_STORE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Direct Installation (for development)
```bash
npm install -g @andrewlwn77/app-store-mcp
```

### Local Development
```bash
git clone <repository-url>
cd app-store-mcp
npm install
npm run build
```

## Configuration

**Required**: You must set the `APP_STORE_API_KEY` environment variable before running the server.

1. Get an API key from [RapidAPI App Stores](https://rapidapi.com/danielamitay/api/app-stores)
2. Set the environment variable:
   ```bash
   # Option 1: Export in your shell
   export APP_STORE_API_KEY="your-api-key-here"
   
   # Option 2: Create a .env file (for local development)
   echo "APP_STORE_API_KEY=your-api-key-here" > .env
   ```

⚠️ **Security**: Never commit your `.env` file or API key to version control!

## Usage

### Testing the Server

```bash
# For local development and testing
npm start

# For development with auto-reload
npm run dev

# Test the server directly (requires MCP client)
npx -y @andrewlwn77/app-store-mcp
```

**Note**: This server is designed to be used through MCP clients. Direct execution will wait for MCP protocol messages via stdin.

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

### Example Usage

Once configured with an MCP client, you can use natural language to interact with the tools:

- "Search for meditation apps on Google Play Store"
- "Get details for Spotify on the Apple App Store" 
- "Show me recent reviews for Snapchat on Android"
- "Find app suggestions for 'photo editing' on iOS"

The server will automatically handle the API calls and return formatted results.

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