# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis focused on "Präzision in Besetzung und Teamstruktur" (precision in staffing and team structure). The app follows a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data storage via Drizzle ORM.

The app features a multi-step wizard (Rollen-DNA) for capturing role requirements, an AI-powered analysis page, a dynamic "Entscheidungsbericht" (decision report), and a "bioLogic JobCheck" page for candidate-role fit assessment. The Entscheidungsbericht is fully AI-generated using OpenAI, creating role-specific structural analyses with charts, bullet-point lists, tension fields, risk assessments, and hiring recommendations. The JobCheck page (`/jobcheck`) provides a Level 2 recruiting decision foundation comparing Soll (role DNA) vs. Ist (candidate profile) with dominance shift analysis, structural suitability matrix, risk assessments, development prognosis, and a 90-day integration plan.

## User Preferences

Preferred communication style: Simple, everyday language.

## Navigation

All pages share a unified GlobalNav component (`client/src/components/global-nav.tsx`) with 4 items:
- **Neue Rollen-DNA**: Clears all stored state and navigates to `/rollen-dna` for a fresh wizard
- **Rollen-DNA Bearbeiten**: Navigates to `/rollen-dna` keeping existing state
- **Rollenprofil**: Navigates to `/bericht` (AI-generated decision report)
- **Soll-Ist-Vergleich**: Navigates to `/jobcheck` (candidate-role fit comparison)

- **Teamdynamik**: Navigates to `/teamdynamik` (team dynamics - placeholder)

The nav supports a `rightSlot` prop for page-specific actions (e.g., Save/Load on rollen-dna, Regenerate on bericht).

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod resolvers via `@hookform/resolvers`
- **Path aliases**: `@/*` maps to `client/src/*`, `@shared/*` maps to `shared/*`
- **Entry point**: `client/src/main.tsx` → `client/src/App.tsx`

### Backend
- **Framework**: Express 5 running on Node.js with TypeScript (executed via `tsx`)
- **HTTP Server**: Node `http.createServer` wrapping Express (allows WebSocket upgrades)
- **API Pattern**: All API routes should be prefixed with `/api` and registered in `server/routes.ts`
- **Storage Layer**: Abstracted behind `IStorage` interface in `server/storage.ts`. Currently uses in-memory `MemStorage` implementation, designed to be swapped for a database-backed implementation.
- **Dev Server**: Vite dev server runs as middleware in development (`server/vite.ts`), with HMR over a custom path `/vite-hmr`
- **Production**: Static files served from `dist/public` via `server/static.ts`

### Shared Code
- **Location**: `shared/schema.ts` contains Drizzle ORM table definitions and Zod validation schemas
- **Schema**: Currently defines a `users` table with `id` (UUID), `username`, and `password` fields
- **Validation**: Uses `drizzle-zod` to auto-generate insert schemas from table definitions

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Requires `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory
- **Schema Push**: Available via `npm run db:push` (uses `drizzle-kit push`)

### Build Process
- **Client**: Vite builds to `dist/public`
- **Server**: esbuild bundles server code to `dist/index.cjs`, with key dependencies bundled (not externalized) to reduce cold start times
- **Build script**: `script/build.ts` orchestrates both builds

### Key Design Decisions
1. **Storage interface abstraction**: The `IStorage` interface decouples business logic from data persistence, making it easy to swap MemStorage for DatabaseStorage (Drizzle + PostgreSQL)
2. **Monorepo-style shared code**: The `shared/` directory allows types and schemas to be used by both client and server without duplication
3. **Express 5**: Uses the latest Express version with native async error handling support
4. **Vite as dev middleware**: In development, Vite runs as Express middleware rather than a separate process, allowing a single port for both API and frontend

## External Dependencies

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable. Used with Drizzle ORM for schema management and queries. Session storage uses `connect-pg-simple`.

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: ORM and migration tooling for PostgreSQL
- **express**: Web server framework (v5)
- **@tanstack/react-query**: Client-side data fetching and caching
- **zod**: Runtime schema validation (shared between client and server)
- **wouter**: Lightweight client-side routing
- **shadcn/ui + Radix UI**: Component library foundation
- **recharts**: Charting library (available via chart component)
- **react-day-picker**: Date picker component
- **embla-carousel-react**: Carousel functionality
- **vaul**: Drawer component
- **react-resizable-panels**: Resizable panel layouts
- **input-otp**: OTP input component

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner