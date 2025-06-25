# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode with auto-reload
npm run dev

# Run the compiled server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:watch        # Watch mode

# Run tests with coverage
npm test -- --coverage

# Run a single test file
npm test -- tests/integration/search.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should search for"

# Run tests with single worker (useful for debugging)
npm test -- --maxWorkers=1
```

## Architecture

### MCP Server Structure
The server is built using the Model Context Protocol SDK and follows this pattern:

1. **Main Server Class** (`src/index.ts`): `AppStoreMcpServer` encapsulates all functionality
   - Uses `StdioServerTransport` for communication
   - Registers handlers for `ListToolsRequestSchema` and `CallToolRequestSchema`
   - Each tool handler validates parameters, makes API calls, and returns formatted responses

2. **API Integration Pattern**:
   - `makeApiRequest()`: Centralized method for all API calls with consistent headers
   - `validateStore()`: Ensures only "apple" or "google" stores are accepted
   - Each handler (autocomplete, search, details, reviews) follows the same pattern:
     - Validate store parameter
     - Make API request
     - Normalize response to match TypeScript types
     - Return formatted MCP response

3. **Type System** (`src/types.ts`):
   - Separate interfaces for parameters (`AutocompleteParams`, etc.)
   - Response types that handle API variations (e.g., `developer` can be string or object)
   - Flexible types to accommodate differences between Apple and Google responses

### Testing Architecture
Tests use a parallel structure that mirrors the production code:

1. **Test Client** (`tests/helpers/test-server.ts`): 
   - `AppStoreTestClient` class duplicates the API logic without MCP protocol
   - Allows direct testing of API integration
   - Shares the same validation and request logic as the main server

2. **Integration Tests**: Each endpoint has comprehensive tests covering:
   - Happy path with known apps (Spotify, Instagram, WhatsApp)
   - Different response formats between stores
   - Error cases (invalid IDs, API failures)
   - Language parameter handling

### Key Architectural Decisions

1. **Response Normalization**: The API returns different formats for Apple vs Google. The server handles these variations:
   - `icon` vs `icons` object
   - `developer` as string vs object with name/id
   - `rating` vs `ratings` object
   - Review `text` vs `content.body` structure

2. **Error Handling**: Two-layer approach:
   - API errors are caught and returned as formatted error responses
   - MCP protocol errors are handled by the SDK

3. **Environment Configuration**: 
   - API key via `APP_STORE_API_KEY` env variable
   - Falls back to hardcoded key from examples (should be removed in production)

## API Response Variations

When working with this codebase, be aware of these API differences:

- **Autocomplete**: May return array of strings or objects with id/name
- **Search Results**: Icon field varies between string URL and object with size variants
- **Developer Info**: Can be string or object `{id, name, url}`
- **Reviews**: Apple uses `content: {body, title}`, structure varies by store
- **App Details**: Field names differ (e.g., `version` vs `currentVersion`, `lastUpdated` vs `updatedAt`)

## Running the MCP Server

To test the server with MCP protocol:
```bash
# Build first
npm run build

# Run the test script
node test-server.js

# Or connect with an MCP client
node dist/index.js
```

The server communicates via stdio and implements the standard MCP protocol for tool discovery and execution.