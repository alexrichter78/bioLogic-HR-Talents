# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis focused on "Präzision in Besetzung und Teamstruktur" (precision in staffing and team structure). The app follows a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data storage via Drizzle ORM.

The app features a multi-step wizard (Rollen-DNA) for capturing role requirements, an AI-powered analysis page, a dynamic "Entscheidungsbericht" (decision report), a "bioLogic JobCheck" page for candidate-role fit assessment, a "Teamdynamik" dashboard, and a "KI-Coach" chat page. The KI-Coach (`/ki-coach`) is a ChatGPT-style conversational interface where users can ask questions about leadership, HR decisions, assessment, recruiting, and communication. The AI acts as an experienced bioLogic coach, HR consultant, and communication coach. Off-topic questions are filtered server-side without making an API call. The endpoint is `/api/ki-coach` using GPT-4.1 with a topic keyword filter. The Teamdynamik page includes 13 deterministic system variants (Systemmuster) that describe team-person constellations based on dominance patterns, and differentiates detail texts between Führung and Teammitglied modes. The Führung/Teammitglied toggle auto-sets from the Rollen-DNA's Führungsverantwortung field (any leadership type → Führung, "Keine" → Teammitglied). In Führung mode, the detail block uses the Leader-Team Match Engine (`client/src/lib/leader-team-match-engine.ts`) which provides three evaluations: Normal state, Controlled Stress (top1 component gets stronger), and Uncontrolled Stress (top2 component becomes more visible). Each evaluation produces a rating (Passend/Bedingt passend/Nicht passend), component-by-component breakdown, Team-Fit-Score (TFS), and flags (dominanceRisk, intuitiveBreakRisk, dualLeader, leaderFullSymmetry, teamFullSymmetry). Leadership rules F1-F7 are applied: F1 (Steuerungsminimum), F2 (Kältebruch), F3 (Overdrive), F4 (Strukturlücke), F5 (Leitklarheit), F6 (Sekundär-Konkurrenz), F7 (Vollsymmetrie – fehlende Leitstruktur, penalty 0.02 normal / 0.05 uncontrolled stress, triggers when all leader components within 5 points). The Stressvergleich section and Stressverhalten der Konstellation card are hidden (engine data retained but not displayed). A new "Führungskontext" card (`LeadershipContext` type in `teamdynamik-engine.ts`) appears only in Führung mode and provides a contextual narrative connecting leader profile, team profile, and role purpose. It shows: Führungskraft card (dominant profile label + strengths + secondary component), Team card (team character description), Passung (fit summary based on dominance combination), Kernrisiko, Kernchance, and Handlungsfokus. All text is deterministic, no AI call needed. Left bar colors match the respective dominance colors. In Führung mode, the detail block uses the Leader-Team Match Engine (`client/src/lib/leader-team-match-engine.ts`) which provides three evaluations: Normal state, Controlled Stress (top1 component gets stronger), and Uncontrolled Stress (top2 component becomes more visible). Each evaluation produces a rating (Passend/Bedingt passend/Nicht passend), component-by-component breakdown, Team-Fit-Score (TFS), and flags (dominanceRisk, intuitiveBreakRisk, dualLeader, leaderFullSymmetry, teamFullSymmetry). Leadership rules F1-F7 are applied: F1 (Steuerungsminimum), F2 (Kältebruch), F3 (Overdrive), F4 (Strukturlücke), F5 (Leitklarheit), F6 (Sekundär-Konkurrenz), F7 (Vollsymmetrie – fehlende Leitstruktur, penalty 0.02 normal / 0.05 uncontrolled stress, triggers when all leader components within 5 points). When a Rollen-DNA is completed (localStorage `rollenDnaCompleted === "true"`), the Führungskontext card shows an additional **Rollenkontext** section with: Rollenpassung (how the leader's profile matches the role's arbeitslogik), Rollenspezifisches Risiko (risk if role demands don't align with leader or team dominance), Kerntätigkeiten (up to 5 task tags from Rollen-DNA). The role's arbeitslogik is mapped to dominance types (Ergebnis & Umsetzung → IMPULSIV, Beziehung & Zusammenarbeit → INTUITIV, Struktur & Analyse → ANALYTISCH) and compared against person and team dominance for fit analysis. The `RollenDnaContext` type in `teamdynamik-engine.ts` holds beruf, bereich, fuehrungstyp, aufgabencharakter, arbeitslogik, taetigkeiten, and erfolgsfokus (string[]). The erfolgsfokus from Rollen-DNA (stored as erfolgsfokusIndices in localStorage) is mapped to labels and used in the Führungskontext to generate an **Erfolgsfokus** subsection. Each Erfolgsfokus label maps to a dominance type: "Ergebnis-/ Umsatzwirkung" → IMPULSIV, "Beziehungs- und Netzwerkstabilität" → INTUITIV, "Innovations- & Transformationsleistung" → IMPULSIV, "Prozess- und Effizienzqualität" → ANALYTISCH, "Fachliche Exzellenz / Expertise" → ANALYTISCH, "Strategische Wirkung / Positionierung" → INTUITIV. The engine compares these against person and team dominance to generate: Führungskraft & Erfolgsfokus (can the leader deliver on the success focus?), Team & Erfolgsfokus (is the team aligned to the required success direction?), and Steuerungshinweis (how much steering is needed). In Teammitglied mode, the detail block uses the old static texts with system variant descriptions. The Entscheidungsbericht includes a deterministic Strukturanalyse section that shows profile structure type (Doppeldominanz / Sekundär-Konkurrenz / Ausgeglichen / X-dominiert), gap bars (Δ 1–2, Δ 2–3), warning callouts for dual dominance and secondary competition, and stress behavior analysis (controlled + uncontrolled). The rest of the Entscheidungsbericht is fully AI-generated using OpenAI, creating role-specific structural analyses with charts, bullet-point lists, tension fields, risk assessments, and hiring recommendations. The JobCheck page (`/jobcheck`) provides a Level 2 recruiting decision foundation comparing Soll (role DNA) vs. Ist (candidate profile) with dominance shift analysis, structural suitability matrix, risk assessments, development prognosis, and a 90-day integration plan. The Teamdynamik page (`/teamdynamik`) uses a new deterministic calculation system: DG (Distribution Gap, 0-100), DC (Dominance Clash, 0/50/100), RG (Role Gap, optional), TS (Transformation Score, weighted composite 0-100), CI (Conflict Index). The engine (`client/src/lib/teamdynamik-engine.ts`) imports and reuses calculation functions from `jobcheck-engine.ts` (normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel) without modifying that file. Features: 4 dashboard modules (Executive Header with traffic light + score bars, Team/Person profiles with sliders, 9-field Spannungsmatrix, Actions & Führungshebel), CEO/HR/Teamleitung view modes, 6 levers with level-based steering reduction (2+ enabled = -1 level, 4+ = -2 levels), optional Rollen-DNA (Soll) toggle, task/KPI tag inputs for AI context, and AI-generated Team-Systemreport via `/api/generate-team-report` endpoint. The TS formula uses a `sizeAmplifier` based on TeamSize (KLEIN=1.20, MITTEL=1.00, GROSS=0.85) — small teams amplify individual impact, large teams dampen it. A dedicated stress simulation (`StressShift`) recomputes TS under controlled and uncontrolled stress using `applyControlledStressLocal`/`applyUncontrolledStressLocal`, producing `stabilityRating` (STABIL/LABIL/KRITISCH) and delta values. The Spannungsmatrix includes 8 dedicated MIX-cells (MIX-IMP, MIX-INT, MIX-ANA, IMP-MIX, INT-MIX, ANA-MIX, MIX-MIX) for balanced profiles instead of falling back to INT. The Teamdynamik page also includes an Abteilung / Funktionsbereich (department) selector with 9 department types (Vertrieb, Entwicklung, HR, Finanzen, Marketing, Operations, Kundenservice, Strategie, Allgemein). Each department has weighted component expectations (impulsiv/intuitiv/analytisch weights), a critical component, and contextual descriptions. When a department other than "Allgemein" is selected, a Department Fit section appears showing team-fit and person-fit scores (0-100), gap warnings when critical components are too low, and department-specific context notes. The department info is also included in the AI report payload. The `DEPARTMENT_CATALOG` and `computeDepartmentFit()` function live in `teamdynamik-engine.ts`.

## User Preferences

Preferred communication style: Simple, everyday language.

## Navigation

All pages share a unified GlobalNav component (`client/src/components/global-nav.tsx`) with 6 items:
- **Neue Rollen-DNA**: Clears all stored state and navigates to `/rollen-dna` for a fresh wizard
- **Rollen-DNA Bearbeiten**: Navigates to `/rollen-dna` keeping existing state
- **Rollenprofil**: Navigates to `/bericht` (AI-generated decision report)
- **Soll-Ist-Vergleich**: Navigates to `/jobcheck` (candidate-role fit comparison)
- **Teamdynamik**: Navigates to `/teamdynamik` (team dynamics dashboard)
- **KI-Coach**: Navigates to `/ki-coach` (AI coaching chat with bioLogic expertise)

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