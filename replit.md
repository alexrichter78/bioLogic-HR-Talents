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
-   **Strukturanalyse / Entscheidungsbericht (rollenprofil.tsx at /bericht)**: Redesigned with **dark anthrazit header** (#343A48/#2A2F3A gradient): logo, "STRUKTURANALYSE" label, "Rollen-DNA: {beruf}" heading, dominance/leadership/aufgabencharakter badges, PDF button, Profilüberblick panel (Strukturtyp/Dominanz/Sekundär/Tertiär), Kernaussage panel. Body uses 3 colored SectionHead bars (numbered 1-3): Rollen-DNA (dominant color), Verhalten (#6366F1), Teamwirkung (#0EA5E9). Page background: solid #F1F5F9. White card with rounded corners. All calculation logic untouched.
-   **Passungsbericht (soll-ist-bericht.tsx)**: JobCheck report with **Executive Decision Page** (dark header): Systemstatus (4 metrics: Grundpassung, Führungsaufwand, Profilabweichung, Entwicklungsaufwand), Systemüberblick (Rollenprofil, Personenprofil, Soll-Ist-Abweichung), Strukturkonstellation (Dominanz Rolle/Person + Strukturwirkung text), Managementkurzfazit (first paragraph of summaryText), Warum/Risiken (executiveBullets + constellationRisks). Then numbered sections 2-7/8: Vergleich der Profile, Wirkung, Druck, Risikoprognose, Gesamtbewertung, Integrationsplan (optional), Schlussbewertung. PDF builder (`pdf-direct-builder.ts`) mirrors the same Executive Decision Page layout in the dark header.
-   **Spannungsmatrix**: Includes 8 dedicated MIX-cells for balanced profiles.
-   **Führungskontext Card**: Provides contextual narrative (Führungskraft, Team, Passung, Kernrisiko, Kernchance, Handlungsfokus) with deterministic text based on profile data; colors match dominance.
-   **TestTeamReport (team-report.tsx)**: Structured report comparing Ist-Profil (candidate) and Teamprofil (team) only (no Sollprofil). Features: Impact Areas (severity-coded cards with teamExpectation/candidatePattern/risk), Risk Timeline (dot+line phases), Development Gauge (4-bar scale), Stress Behavior (controlledPressure/uncontrolledStress), structured Actions, and 8-Week Integration Plan (3 phases with numbered cards). DualTriangleChart shows Team + Kandidat. Uses `computeTeamReport(roleName, candidateName, istProfile, teamProfile)` from `team-report-engine.ts`.
-   **TeamCheck Report V2 (teamcheck-report-v2.tsx)**: Full team system report page at `/teamcheck-report-v2`, launched via "Testbericht 2" button from TestTeamReport. Uses `computeTeamCheckV2()` from `teamcheck-v2-engine.ts`. Data passed via sessionStorage (`teamcheckV2Input`). Sections: Hero (with Passung badge, meta boxes, role info tiles), Gesamtbewertung (4 summary boxes), Warum dieses Ergebnis (reason list), Team-Spannungsanalyse (bar charts per component), Systemwirkung (narrative + team/person text), Auswirkungen im Arbeitsalltag (5 impact mini-cards), Verhalten unter Druck und Stress (2 boxes), Chancen, Risiken, Handlungsempfehlung. Engine includes: getBioLogicType (13 variants), getPassung (score-based: Passend/Bedingt passend/Kritisch), getSystemwirkung (Verstärkung/Ergänzung/Spannung/Transformation), normalizeRoleLevel (auto-detects leadership vs member). Role context data (Führung, Aufgabenstruktur, Arbeitsweise, Erfolgsfokus) resolved from rollenDnaState in localStorage.
-   **TeamCheck Report V3 PDF Export**: `client/src/lib/teamcheck-pdf-builder.ts` generates a styled PDF matching the MatchCheck PDF design — dark anthrazit header with logo/badges, Executive Decision Page (Systemstatus/Systemüberblick/Strukturkonstellation/Managementkurzfazit/Integrationsfaktor), then 12 colored section bars with number chips (2-13), bar charts for profile comparison, risk timeline, and all TeamCheck sections. Triggered by PDF button on the report page.
-   **TeamCheck Report V3 (teamcheck-report-v3.tsx)**: Combined team system report at `/teamcheck-report-v3`, launched via "Testbericht 3" button from TestTeamReport. Uses `computeTeamCheckV3()` from `teamcheck-v3-engine.ts`. **Executive Decision Page** (dark header): Systemstatus (4 metrics: Gesamtpassung, Systemwirkung, Steuerungsaufwand, Integrationsrisiko), Systemüberblick (Team/Person profiles + Abweichung), Strukturkonstellation (Dominanz Team/Person + Strukturwirkung), Managementkurzfazit, Integrationsfaktor (Dauer/Aufwand/Erfolgsfaktor). Then 12 numbered sections: 2-Warum dieses Ergebnis, 3-Systemwirkung, 4-Strukturvergleich, 5-Team-Spannungsanalyse, 6-Auswirkungen im Arbeitsalltag, 7-Auswirkungen auf Leistung und Ergebnisse, 8-Verhalten unter Druck, 9-Risikoentwicklung, 10-Chancen, 11-Risiken, 12-Handlungsempfehlung, 13-Alternativwirkung.

### Shared Design Constants
-   **`client/src/lib/bio-design.ts`**: Single source of truth for all bioLogic brand colors (component colors, fit ratings, section header colors). Used by both the UI report (`soll-ist-bericht.tsx`) and the PDF builder (`pdf-direct-builder.ts`). Exports `BIO_COLORS`, `COMP_HEX`, `SECTION_COLORS`, `fitColor()`, `controlColor()`.

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
-   **OpenAI**: For AI-generated reports, the KI-Coach, and photo effect analysis (GPT-4 Vision).

### Photo Effect Engine
-   **Location**: `client/src/lib/photo-effect-engine.ts`
-   **Purpose**: Scores portrait photo visual impression on 3 bioLogic dimensions (Impulsiv/Intuitiv/Analytisch) using 20 criteria.
-   **API Endpoint**: `POST /api/photo-analyse` — sends image to GPT-4o Vision which rates the photo on three communication scales (dynamic/warm/composed). Returns normalized scores (0-10) mapped to Impulsiv/Intuitiv/Analytisch. Client uses `buildPhotoResultFromScores()` to generate ranking, strength labels, and effect text.
-   **Architecture**: Single API call approach — GPT rates the photo directly on abstract scales rather than extracting individual facial features (which OpenAI API safety filters block).
-   **Integration**: KI-Coach automatically triggers photo analysis when image is uploaded, shows visual score card (colored bars) in chat, and passes results as context to the coach for interpretation.