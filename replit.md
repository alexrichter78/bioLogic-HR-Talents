# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis, focusing on "Präzision in Besetzung und Teamstruktur" (precision in staffing and team structure). It provides tools for defining role requirements, AI-powered analysis, and dynamic reporting to optimize staffing and team structures.

Key capabilities include:
-   **Rollen-DNA (Role DNA)**: A multi-step wizard for defining role requirements.
-   **AI-powered Analysis**: Generates role-specific structural analyses, charts, and recommendations.
-   **Entscheidungsbericht (Decision Report)**: Combines deterministic structural analysis with AI-generated insights.
-   **bioLogic JobCheck**: Assesses candidate-role fit, including dominance shift analysis and risk assessments.
-   **Teamdynamik (Team Dynamics)**: A dashboard offering 13 deterministic system variants for team-person constellations, with CEO/HR/Teamleitung views, steering levers, and stress simulation. Includes a "Führungskontext" card for leadership role analysis.
-   **KI-Coach (AI Coach)**: A conversational AI for leadership, HR, assessment, recruiting, and communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
-   **Framework**: React 18 with TypeScript and Vite.
-   **Routing**: Wouter.
-   **State/Data Fetching**: TanStack React Query.
-   **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives.
-   **Styling**: Tailwind CSS with CSS custom properties (light/dark mode).
-   **Forms**: React Hook Form with Zod resolvers.

### Backend
-   **Framework**: Express 5 on Node.js with TypeScript.
-   **API Pattern**: All routes prefixed with `/api`.
-   **Storage Layer**: Abstracted via `IStorage` interface for database swapping.
-   **Dev Server**: Vite dev server integrated as Express middleware.

### Shared Code
-   **Location**: `shared/schema.ts` for Drizzle ORM table definitions and Zod validation schemas, enabling type and schema sharing.

### Database
-   **ORM**: Drizzle ORM with PostgreSQL dialect.

### Key Design Decisions
1.  **Storage interface abstraction**: Decouples business logic from data persistence.
2.  **Monorepo-style shared code**: Facilitates type and schema sharing between client and server.
3.  **Express 5**: Utilizes latest Express features including native async error handling.
4.  **Vite as dev middleware**: Single port for both API and frontend during development.

### Region Switcher
-   **Context**: `client/src/lib/region.tsx` provides `RegionProvider` and `useRegion()` hook. Supports DE (Germany), CH (Switzerland), AT (Austria). Persisted in localStorage.
-   **Frontend**: Flag emoji dropdown (🇩🇪/🇨🇭/🇦🇹) in `global-nav.tsx`. All pages with AI calls pass `region` in their API request body.
-   **Backend**: `getRegionInstruction(region, options?)` in `server/routes.ts` generates prompt instructions per region. CH: replaces ß→ss, uses Swiss terms. AT: uses Austrian terms. Both default to formal "Sie" except KI-Coach which uses `skipAddress: true` to preserve its informal "Du" tone.
-   **Endpoints with region support**: generate-kompetenzen, reclassify-kompetenzen, generate-bericht, generate-analyse, generate-team-report, ki-coach, generate-kandidatenprofil.

### UI/UX Decisions
-   **Global Navigation**: Unified navigation component with 6 main items.
-   **Rollen-DNA Completion**: Toggles visibility of "Rollenkontext" and "Erfolgsfokus" sections.
-   **Teamdynamik Page**: Features 4 dashboard modules, CEO/HR/Teamleitung view modes, 6 steering levers, and stress simulation.
-   **Strukturanalyse / Entscheidungsbericht**: Features a dark anthrazit header, specific badge displays, and a structured body with colored section bars.
-   **Passungsbericht (JobCheck)**: Includes an Executive Decision Page with system status metrics, overview, structural constellation, and a management summary, followed by detailed sections. PDF export mirrors this layout.
-   **Spannungsmatrix**: Includes dedicated MIX-cells for balanced profiles.
-   **Führungskontext Card**: Provides contextual narrative based on profile data.
-   **TeamCheck Reports (V2, V3, V4)**: Various iterations providing comprehensive team system reports. V3 features 3-dimensional text logic evaluating Person↔Team, Person↔Funktionsziel, Team↔Funktionsziel. V4 uses an 8-section structure (9 for Führungskraft): (1) Gesamtbewertung with Hauptstärke/Hauptabweichung badges, (2) Warum dieses Ergebnis entsteht, (3) Wirkung im Arbeitsalltag, (4) Chancen und Risiken, (5) Verhalten unter Druck, (6) Was als Führungskraft für dieses Team wichtig ist (leadership only — white cards with left accent stripe), (6/7) Risikoprognose (3-phase timeline: Kurzfristig/Mittelfristig/Langfristig with green/orange/red dots), (7/8) 30-Tage-Integrationsplan (3 colored phases with Ziel, bullet items, "Worauf es ankommt" focus box), (8/9) Was jetzt wichtig ist (Empfehlungen as 2-column card grid). All sections individualized for Führungskraft/Teammitglied, Teampassung, and Aufgabenbeitrag.
-   **Shared Design Constants**: `client/src/lib/bio-design.ts` serves as a single source of truth for all bioLogic brand colors, used across UI reports and PDF builders.

### Technical Implementations
-   **Leader-Team Match Engine**: Provides evaluations for leadership roles, generating ratings and scores.
-   **Teamdynamik Engine**: Calculates metrics like Distribution Gap, Dominance Clash, Role Gap, Transformation Score, and Conflict Index, including stress simulation.
-   **Rollen-DNA to Dominance Mapping**: Maps role attributes to dominance types for fit analysis.
-   **AI Integration**: Utilizes OpenAI for AI-generated reports and the KI-Coach, including function calling for web search and image generation.

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
-   **html2canvas** / **jsPDF**: For HTML-to-PDF conversion and PDF generation.

### AI Services
-   **OpenAI**: For AI-generated reports and the KI-Coach, including image generation via `/api/generate-image`.