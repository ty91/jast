# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo todo management application built with TypeScript. The app features hierarchical task support, date-based organization, and drag-and-drop reordering.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on specific platforms
pnpm android
pnpm ios
pnpm web

# Lint code
pnpm lint

# Reset project to blank template
pnpm reset-project
```

## Architecture

### Core Layers

1. **Database Layer** (`/libs/database.ts`): SQLite initialization and migrations
2. **Service Layer** (`/libs/todo.service.ts`): TodoService class handles all database operations
3. **State Layer** (`/stores/todo.store.ts`): Zustand store manages application state
4. **UI Layer** (`/components/*`): React Native components for presentation

### Data Flow

1. UI components interact with Zustand store
2. Store methods call TodoService for data operations
3. TodoService executes SQLite queries and returns results
4. Store updates state and triggers UI re-renders

### Database Schema

The app uses SQLite with a single `todos` table:
- `id`: Primary key
- `parent_id`: For hierarchical todos (nullable)
- `title`: Todo text
- `status`: 0 (PENDING) or 1 (COMPLETED)
- `position`: For ordering within same parent/date
- `target_date`: YYYYMMDD format integer
- `is_deleted`: Soft delete flag (0 or 1)
- `created_at`, `updated_at`: ISO timestamps

### Key Patterns

1. **Soft Delete**: Todos are marked `is_deleted=1` rather than removed
2. **Position Management**: Todos maintain order via `position` field
3. **Date Handling**: Dates stored as YYYYMMDD integers for efficient querying
4. **Hierarchical Structure**: Parent-child relationships via `parent_id`

## File Structure

```
/app/_layout.tsx     # Root layout with SQLite initialization
/app/index.tsx       # Main todo list screen
/components/         # UI components (todo-item, todo-list, date-picker)
/libs/              # Core libraries (database, todo.service)
/stores/            # Zustand state management
/types/             # TypeScript interfaces and enums
/utils/             # Helper functions (date conversions)
```

## Testing Approach

The project currently doesn't have a test framework set up. When implementing tests, consider:
- Unit tests for TodoService methods
- Integration tests for store actions
- Component tests for UI interactions

## Common Tasks

### Adding a New Todo Feature
1. Update `/types/todo.ts` if new fields needed
2. Modify database schema in `/libs/database.ts`
3. Update TodoService methods in `/libs/todo.service.ts`
4. Add store actions in `/stores/todo.store.ts`
5. Update UI components as needed

### Database Migrations
Migrations are handled in `/libs/database.ts`. To add a new migration:
1. Increment the version number
2. Add migration logic in the appropriate version check
3. Test migration with existing data

### Working with Dates
- Dates are stored as YYYYMMDD integers
- Use `/utils/date.ts` helpers for conversions
- Always use UTC for consistency

## Dependencies to Note

- **react-native-draggable-flatlist**: For drag-and-drop functionality
- **expo-sqlite**: Local database storage
- **zustand**: State management
- **react-native-reanimated**: Animation support for gestures

## Code Style

The codebase follows minimalist principles:
- Single responsibility per module
- Avoid over-engineering
- Prioritize readability
- Use TypeScript strict mode
- Follow existing patterns for consistency