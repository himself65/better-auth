# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Auth is a comprehensive TypeScript authentication framework with a plugin-based architecture. It's framework-agnostic and supports multiple database adapters, social providers, and authentication methods.

## Repository Structure

This is a pnpm monorepo managed by Turborepo:

- `packages/better-auth` - Core authentication library (main package)
- `packages/core` - Shared core functionality (API, types, utils)
- `packages/cli` - CLI tool for database migrations and code generation
- `packages/expo` - Expo/React Native integration
- `packages/sso` - SSO plugin with SAML and OIDC support
- `packages/passkey` - Passkey/WebAuthn support
- `packages/oauth-provider` - OAuth provider functionality
- `packages/stripe` - Stripe payment integration
- `packages/scim` - SCIM protocol support
- `packages/telemetry` - Telemetry functionality
- `packages/mcp` - MCP (Model Context Protocol) server
- `test` - Shared test utilities and integration tests
- `e2e` - End-to-end tests
- `docs` - Documentation website
- `demo` - Demo applications

## Common Commands

### Building
```bash
# Build all packages
pnpm build

# Build with turbo (faster, uses cache)
turbo build --filter=./packages/*

# Build specific package
pnpm -F better-auth build
pnpm -F @better-auth/cli build
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm -F better-auth test
pnpm -F @better-auth/core test

# Run adapter tests (requires databases)
pnpm -F better-auth test:adapters

# Run tests with coverage
pnpm coverage

# View coverage report
pnpm coverage:open

# Run e2e tests
pnpm e2e:smoke
pnpm e2e:integration
```

### Database Setup for Testing
Database adapters need running database instances. Use Docker Compose:

```bash
# Start all databases
docker compose up -d

# Start specific database
docker compose up -d postgres
docker compose up -d mongodb
docker compose up -d mysql

# Stop all databases
docker compose down
```

Available database ports:
- PostgreSQL (Drizzle): 5432
- PostgreSQL (Kysely): 5433
- PostgreSQL (Prisma): 5434
- PostgreSQL (Kysely2): 5435
- MySQL (Drizzle): 3306
- MySQL (Kysely): 3307
- MySQL (Prisma): 3308
- MongoDB: 27017
- MSSQL: 1433

### Linting and Formatting
```bash
# Format code (BiomeJS)
pnpm format

# Check linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check types
pnpm lint:types

# Check spelling
pnpm lint:spell

# Check dependencies
pnpm lint:dependencies
```

### Development
```bash
# Run dev mode for all packages (except CLI)
pnpm dev

# Run docs locally
pnpm -F docs dev

# Run CLI in dev mode
pnpm -F @better-auth/cli dev
```

## Architecture

### Core Architecture Concepts

**Two-Mode System:**
- **Full Mode** (`better-auth`): Includes Kysely for database operations. Default import: `import { betterAuth } from "better-auth"`
- **Minimal Mode** (`better-auth/minimal`): Excludes Kysely, requires external adapters (Drizzle, Prisma, etc.). Import: `import { betterAuth } from "better-auth/minimal"`

**Plugin System:**
The library uses a plugin architecture with two sides:
- **Server Plugins**: Extend backend functionality (e.g., two-factor, organization, admin)
- **Client Plugins**: Extend client SDK functionality (e.g., React hooks, Vue composables)

Plugins are located in `packages/better-auth/src/plugins/` and can be imported from subpaths like `better-auth/plugins/two-factor`.

**Adapter Pattern:**
Database adapters abstract database operations. Located in `packages/better-auth/src/adapters/`:
- `kysely-adapter` - Kysely ORM (built-in, full mode)
- `drizzle-adapter` - Drizzle ORM
- `prisma-adapter` - Prisma ORM
- `mongodb-adapter` - MongoDB native driver
- `memory-adapter` - In-memory adapter (testing)

Each adapter implements a common interface defined in `@better-auth/core/db`.

**Framework Integrations:**
Framework-specific integrations are in `packages/better-auth/src/integrations/`:
- `next-js.ts` - Next.js middleware and utilities
- `svelte-kit.ts` - SvelteKit hooks and utilities
- `solid-start.ts` - Solid Start middleware
- `tanstack-start.ts` - TanStack Start integration
- `node.ts` - Node.js HTTP server integration

**Client Library:**
Located in `packages/better-auth/src/client/`, provides:
- `vanilla.ts` - Framework-agnostic client
- `react/` - React hooks and components
- `vue/` - Vue composables
- `svelte/` - Svelte stores
- `solid/` - Solid.js primitives
- `lynx/` - Lynx framework integration

Clients handle session management, API calls, and state synchronization using nanostores.

**Social Providers:**
OAuth providers are in `packages/core/src/social-providers/` and `packages/better-auth/src/social-providers/`. Each provider implements OAuth2 flow with provider-specific configuration.

**Plugin Architecture Details:**
- Server plugins can add database tables, API endpoints, hooks, and middleware
- Client plugins can add methods to the client SDK and integrate with framework-specific features
- Plugins communicate server-client types through TypeScript inference using the `InferPlugin` helper
- The `@better-auth/core` package provides base types and utilities shared across plugins

### Package Dependencies
- `@better-auth/core` - Shared core types and utilities (no runtime dependencies on DB libraries)
- `better-auth` - Main package, depends on `@better-auth/core` and includes Kysely
- `@better-auth/cli` - CLI depends on `better-auth` and `@better-auth/core`
- Other packages (`expo`, `sso`, etc.) - Extend functionality, depend on `better-auth`

### Build System
- Uses `tsdown` for package builds (TypeScript bundler)
- Uses Turbo for monorepo task orchestration
- Build outputs go to `dist/` directories
- TypeScript declarations generated with `tsc --emitDeclarationOnly`
- Uses "dev-source" export condition to enable jump-to-definition in IDEs

### Testing Architecture
- Uses Vitest with project-based configuration
- Root `vitest.config.ts` orchestrates all package tests
- Tests run from source files using "dev-source" condition
- Adapter tests are separate (`vitest.config.adapters.ts`) and require running databases
- Test utilities in `packages/better-auth/src/test-utils/` and `test/` directory

## Package Export Structure

The main `better-auth` package uses extensive export maps for tree-shaking:
- Main export: `better-auth` (full mode with Kysely)
- Minimal mode: `better-auth/minimal`
- Client: `better-auth/client`
- Framework clients: `better-auth/react`, `better-auth/vue`, `better-auth/svelte`, `better-auth/solid`, `better-auth/lynx`
- Integrations: `better-auth/next-js`, `better-auth/svelte-kit`, `better-auth/solid-start`, `better-auth/tanstack-start`, `better-auth/node`
- Adapters: `better-auth/adapters/prisma`, `better-auth/adapters/drizzle`, `better-auth/adapters/mongodb`, `better-auth/adapters/memory`
- Plugins: `better-auth/plugins/{plugin-name}` (30+ plugins available)
- Utilities: `better-auth/crypto`, `better-auth/cookies`, `better-auth/oauth2`, `better-auth/api`, `better-auth/db`, `better-auth/types`

## Development Guidelines

### Code Style
- Use BiomeJS for formatting and linting (not Prettier/ESLint)
- Avoid using classes - prefer functional programming patterns
- Follow existing patterns in the codebase
- Keep functions small and focused
- Use TypeScript types effectively

### Commit Conventions
- `feat(scope): description` - New features (goes in changelog)
- `fix(scope): description` - Bug fixes (goes in changelog)
- `docs: description` - Documentation changes
- `chore: description` - Non-functional changes
- `refactor: description` - Code refactoring
- Scope examples: `organization`, `two-factor`, `cli`, `adapters`

### Pull Request Process
- Target the `canary` branch (not `main`)
- Keep PRs focused on single features/fixes
- Include tests for new functionality
- Update documentation as needed

### Adding New Plugins
Plugins generally should be contributed by core members. Consider open-sourcing external plugins independently. When adding plugins:
- Server plugin: Extend `BetterAuthPlugin` interface
- Client plugin: Extend `BetterAuthClientPlugin` interface
- Add database schema if needed (migrations handled by CLI)
- Add tests in plugin directory
- Export from `packages/better-auth/src/plugins/index.ts`

### Working with Adapters
When modifying adapters:
- Implement the adapter interface from `@better-auth/core/db`
- Add tests in `src/adapters/tests/`
- Run adapter-specific tests with `pnpm -F better-auth test:adapters`
- Ensure database containers are running via `docker compose up -d`

### Framework Integration Development
When adding/modifying framework integrations:
- Keep integration thin - delegate to core library
- Follow framework conventions and best practices
- Test with demo apps in `demo/` directory
- Support both client and server patterns where applicable
