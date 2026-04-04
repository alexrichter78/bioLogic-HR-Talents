# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis, focusing on "Präzision in Besetzung und Teamstruktur" (precision in staffing and team structure). It provides tools for defining role requirements, AI-powered analysis, and dynamic reporting to optimize staffing and team structures.

Key capabilities include:
-   **Rollen-DNA (Role DNA)**: A multi-step wizard for defining role requirements.
-   **AI-powered Analysis**: Generates role-specific structural analyses, charts, and recommendations.
-   **Entscheidungsbericht (Decision Report)**: Combines deterministic structural analysis with AI-generated insights.
-   **bioLogic JobCheck**: Assesses candidate-role fit, including dominance shift analysis and risk assessments.
-   **Teamdynamik (Team Dynamics)**: A dashboard offering 13 deterministic system variants for team-person constellations, with CEO/HR/Teamleitung views, steering levers, and stress simulation. Includes a "Führungskontext" card for leadership role analysis.
-   **KI-Coach (AI Coach)**: A conversational AI for leadership, HR, assessment, recruiting, and communication. Features SSE streaming with blinking cursor, enhanced markdown rendering (tables, ordered lists, horizontal rules, bold headings), context-aware quick reply suggestions (only on latest message), a "Profil aktiv" badge when user data is loaded, and structured interview guide generation ("Gesprächsleitfäden"). Sends extended context to the AI including Rollen-DNA, JobCheck results, and Teamdynamik data from localStorage. Quick-reply button logic: `lastTwo` (last 2 paragraphs) is normalized by stripping `**` bold markers before all regex checks. `isAskingUserProfile` requires explicit self-reference ("bist du eher", "dein Profil", "deine Prägung") — general mentions of "impulsiv/analytisch" no longer trigger profile buttons. `extractOptionsFromText` handles comma-separated 3-option lists ("Tempo, Harmonie oder Struktur?") and strips trailing commas from button labels.

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
-   **Deterministic text localization**: All engine/data files use "ss" as neutral base text. `ssToSz()` in `region.tsx` converts ss→ß for DE/AT via regex `SS_RULES`. `localizeDeep<T>(obj, region)` recursively walks objects to localize all strings. Applied in: soll-ist-bericht, team-report, teamdynamik, jobcheck, teamcheck (all versions V1–V4), rollen-dna, rollenprofil.

### UI/UX Decisions
-   **Responsive Design**: All pages are mobile-responsive. On mobile (<768px), the top navigation converts to a bottom tab bar, card paddings reduce, 2/3-column grids collapse to single-column, and message bubbles widen. Uses `useIsMobile()` hook from `@/hooks/use-mobile` for inline style conditionals and CSS media queries in `index.css` for utility classes (`.mobile-stack`, `.mobile-grid-1`, etc.).
-   **Global Navigation**: Unified navigation component with dynamic items. On mobile, renders as a bottom tab bar with icons and labels. "Kursbereich" nav item appears only when `user.courseAccess === true`.
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
-   **KI-Coach Conversation Modes**: Supports specialized modes (Interview-Vorbereitung, Konfliktlösung, Stellenanzeige erstellen, Gesprächsleitfaden) with tailored system prompts per mode. Mode is selected via UI buttons before conversation starts and sent as `mode` parameter to `/api/ki-coach`.
-   **Coach Feedback System**: Thumbs up/down feedback on coach responses is persisted to `coach_feedback` table. Admin can review all feedback under the "Coach-Feedback" tab in the admin panel. Thumbs-up feedback automatically creates a "golden answer" entry.
-   **Golden Answers**: When users give thumbs-up to a coach response, it's auto-saved to `golden_answers` table with category classification. These serve as few-shot quality examples injected into the coach's context (max 2 per request). Admin can view and delete golden answers via the "Goldene Antworten" tab. Content is sanitized against prompt-injection patterns before saving.
-   **Topic Tracking**: Each KI-Coach request is categorized by topic (führung, konflikt, recruiting, team, kommunikation, onboarding, verkauf, etc.) and stored in `coach_topics` table. Admin can view aggregated topic statistics via the "Themen" tab with visual bar charts.
-   **Self-Reflection**: The KI-Coach system prompt includes a quality assurance self-check: before responding, the AI verifies consistency with the bioLogic knowledge base, correct terminology (Prägung not Typ, correct color mappings), practical relevance, and faithful interpretation of source documents.
-   **Knowledge Base (RAG)**: Admin can create/edit/delete knowledge documents via "Wissensdatenbank" tab. Documents are stored in `knowledge_documents` table (18 docs covering methodik, recruiting, fuehrung, teamdynamik, kommunikation, allgemein). On each KI-Coach request, relevant documents are found via enhanced search (synonym expansion, category-aware scoring, stopword filtering, phrase matching, cross-category diversity) and injected into the system prompt. Search uses last 3 user messages for context. Returns up to 5 documents with category diversity when query spans multiple topics.
-   **Conversation Summary**: For conversations longer than 10 messages, older messages are compressed into a structured summary (user profile hints, topic progression, key decisions) while keeping the last 6 messages verbatim. Prevents repetition and maintains focus in long conversations.
-   **Anti-KI Formulierungen**: Extended list of forbidden phrases to prevent AI-typical patterns: banned numbered lists with bold headings, template phrases ("In der Tat", "Hier sind einige Tipps", etc.), and filler language. Temperature raised from 0.4 to 0.55 for more natural variation.
-   **Roleplay Mode Detection**: Automatic detection of roleplay/simulation conversations. When active: dedicated prompt section forces the AI to stay in character, higher temperature (0.65) for more authentic reactions, clear separation of role response and coach feedback, and instruction to make scenarios realistically challenging.
-   **Editable System Prompt**: The Louis system prompt is stored in `coach_system_prompt` DB table. Admin can view and edit the full prompt via the "Prompt" tab in the admin panel. Changes take effect immediately. A "Standard wiederherstellen" button resets to the hardcoded default. The editable part is the main body (tone, rules, behavior); the intro line and dynamic injections (region, mode, knowledge docs) are added automatically by the code.
-   **Topic Filter**: KI-Coach only answers questions related to HR, recruiting, leadership, teams, communication, marketing, and bioLogic methodology. Off-topic questions are politely declined.

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