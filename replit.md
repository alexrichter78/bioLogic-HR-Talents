# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis, focusing on "Präzision in Besetzung und Teamstruktur" (precision in staffing and team structure). It offers tools for role requirement capture, AI-powered analysis, and dynamic reporting.

Key capabilities include:
-   **Rollen-DNA (Role DNA)**: A multi-step wizard for defining role requirements.
-   **AI-powered Analysis**: Generates role-specific structural analyses, charts, and recommendations.
-   **Entscheidungsbericht (Decision Report)**: Combines deterministic structural analysis with AI-generated insights.
-   **bioLogic JobCheck**: Assesses candidate-role fit, providing dominance shift analysis, risk assessments, and integration plans.
-   **Teamdynamik (Team Dynamics)**: A dashboard with 13 deterministic system variants for team-person constellations, offering CEO/HR/Teamleitung views, steering levers, and stress simulation. Includes a "Führungskontext" card for leadership roles, analyzing leader-team-role fit.
-   **KI-Coach (AI Coach)**: A conversational AI interface for questions on leadership, HR, assessment, recruiting, and communication, acting as an experienced bioLogic coach.

The project aims to provide comprehensive tools for optimizing staffing and team structures through a blend of deterministic models and AI-driven insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
-   **Framework**: React 18 with TypeScript, bundled by Vite.
-   **Routing**: Wouter.
-   **State/Data Fetching**: TanStack React Query.
-   **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives.
-   **Styling**: Tailwind CSS with CSS custom properties (light/dark mode).
-   **Forms**: React Hook Form with Zod resolvers.
-   **Path aliases**: `@/*` for `client/src/*`, `@shared/*` for `shared/*`.

### Backend
-   **Framework**: Express 5 on Node.js with TypeScript.
-   **HTTP Server**: Node `http.createServer` wrapping Express.
-   **API Pattern**: All routes prefixed with `/api`, registered in `server/routes.ts`.
-   **Storage Layer**: Abstracted via `IStorage` interface, currently `MemStorage`, designed for database swapping.
-   **Dev Server**: Vite dev server runs as Express middleware.
-   **Production**: Serves static files from `dist/public`.

### Shared Code
-   **Location**: `shared/schema.ts` for Drizzle ORM table definitions and Zod validation schemas.
-   **Schema**: Defines `users` table with `id`, `username`, `password`.
-   **Validation**: Uses `drizzle-zod` for auto-generating insert schemas.

### Database
-   **ORM**: Drizzle ORM with PostgreSQL dialect.
-   **Connection**: `DATABASE_URL` environment variable.
-   **Migrations**: Output to `./migrations`.

### Build Process
-   **Client**: Vite builds to `dist/public`.
-   **Server**: esbuild bundles server code to `dist/index.cjs`.

### Key Design Decisions
1.  **Storage interface abstraction**: Decouples business logic from data persistence.
2.  **Monorepo-style shared code**: Enables type and schema sharing between client and server.
3.  **Express 5**: Utilizes latest Express with native async error handling.
4.  **Vite as dev middleware**: Single port for both API and frontend during development.

### UI/UX Decisions
-   **GlobalNav**: Unified navigation component (`client/src/components/global-nav.tsx`) with 6 main items and subtitles: Home, JobCheck, MatchCheck, TeamCheck, KI-Coach, TestTeamReport.
-   **Rollen-DNA Completion**: Toggles visibility of additional "Rollenkontext" and "Erfolgsfokus" sections in the Führungskontext card.
-   **Teamdynamik Page**: Features 4 dashboard modules (Executive Header, Team/Person profiles, 9-field Spannungsmatrix, Actions & Führungshebel), CEO/HR/Teamleitung view modes, 6 steering levers. Includes a stress simulation (`StressShift`) and a department selector influencing fit scores and AI reports.
-   **Entscheidungsbericht**: Displays structural type, gap bars, warning callouts, and stress behavior analysis.
-   **Spannungsmatrix**: Includes 8 dedicated MIX-cells for balanced profiles.
-   **Führungskontext Card**: Provides contextual narrative (Führungskraft, Team, Passung, Kernrisiko, Kernchance, Handlungsfokus) with deterministic text based on profile data; colors match dominance.
-   **TestTeamReport (team-report.tsx)**: Structured report with Impact Areas (severity-coded cards with roleNeed/candidatePattern/risk), Risk Timeline (dot+line phases), Development Gauge (4-bar scale), Stress Behavior (controlledPressure/uncontrolledStress), structured Actions, and 8-Week Integration Plan (3 phases with numbered cards). Uses `computeTeamReport()` from `team-report-engine.ts`.

### Technical Implementations
-   **Leader-Team Match Engine (`client/src/lib/leader-team-match-engine.ts`)**: Provides three evaluations (Normal, Controlled Stress, Uncontrolled Stress) for leadership roles, generating ratings, component breakdowns, Team-Fit-Score (TFS), and flags. Applies leadership rules F1-F7.
-   **Teamdynamik Engine (`client/src/lib/teamdynamik-engine.ts`)**: Calculates DG (Distribution Gap), DC (Dominance Clash), RG (Role Gap), TS (Transformation Score), CI (Conflict Index). Reuses functions from `jobcheck-engine.ts`. Implements `StressShift` for stability rating.
-   **Rollen-DNA to Dominance Mapping**: Role's arbeitslogik (e.g., Ergebnis & Umsetzung → IMPULSIV) and erfolgsfokus (e.g., "Ergebnis-/ Umsatzwirkung" → IMPULSIV) are mapped to dominance types for fit analysis.
-   **AI Integration**: OpenAI for AI-generated reports and KI-Coach, with server-side topic filtering for the KI-Coach.

## External Dependencies

### Database
-   **PostgreSQL**: Used with Drizzle ORM.

### Key NPM Packages
-   **drizzle-orm** / **drizzle-kit**: ORM and migration tooling.
-   **express**: Web server framework.
-   **@tanstack/react-query**: Client-side data fetching.
-   **zod**: Runtime schema validation.
-   **wouter**: Client-side routing.
-   **shadcn/ui + Radix UI**: Component library.
-   **recharts**: Charting.
-   **react-day-picker**: Date picker.
-   **embla-carousel-react**: Carousel.
-   **vaul**: Drawer component.
-   **react-resizable-panels**: Resizable panel layouts.
-   **input-otp**: OTP input component.
-   **connect-pg-simple**: Session storage.

### AI Services
-   **OpenAI**: For AI-generated reports and the KI-Coach.