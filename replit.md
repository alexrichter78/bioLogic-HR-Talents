# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis, focusing on "Präzision in Besetzung und Teamstruktur" (precision in staffing and team structure). It provides tools for defining role requirements, AI-powered analysis, and dynamic reporting to optimize staffing and team structures.

Key capabilities include:
-   **Rollen-DNA (Role DNA)**: A multi-step wizard for defining role requirements.
-   **AI-powered Analysis**: Generates role-specific structural analyses, charts, and recommendations.
-   **Entscheidungsbericht (Decision Report)**: Combines deterministic structural analysis with AI-generated insights.
-   **bioLogic JobCheck (MatchCheck)**: Assesses candidate-role fit, including dominance shift analysis and risk assessments. Uses a unified engine: `computeCoreFit()` in `jobcheck-engine.ts` is the single source of truth for fit rating (SUITABLE/CONDITIONAL/NOT_SUITABLE) and base control intensity. Accepts optional `externalKo` parameter so callers can pass KO from `koRuleTriggered`. Returns `CoreFitResult` with `overallFit`, `controlIntensity`, `mismatchScore`, `koTriggered`, `reasons: FitReason[]` (tracking which rules fired and their effect: KO/OVERRIDE/CAP/BASE), and `flags` (structural analysis: `sameDom`, `effectiveSameDom`, `roleIsBalFull`, `candIsBalFull`, `equalDistConflict`, `dualConflict`, `roleKeyInDual`, `secondaryFlipped`, `maxGapVal`, `candSpread`). `runEngine` delegates fit calculation to `computeCoreFit(role_profile, cand_profile, koRuleTriggered(...))` — no duplicated logic. `computeSollIst` likewise passes `koRuleTriggered` result as `externalKo` to `computeCoreFit`. `buildRoleAnalysisFromState()` is the shared builder function that constructs `RoleAnalysis` from stored RollenDNA state, used by both pages to ensure parity.
    -   **Part A/B Alignment**: Severity thresholds in Part B (Soll-Ist-Bericht) are aligned with Part A (Fit-Engine): 0–5 = ok, 6–10 = warning, >10 = critical. Impact Area labels: "Weitgehend passend" / "Mit Abweichung" / "Kritisch". Master rule enforces that no Impact Area sounds more positive than the overall fit verdict. `fitGap` (not `devGap`) maps Fit-Label to development potential. **FitSubtype system**: `FitSubtype` (PERFECT | STRUCTURE_MATCH_INTENSITY_OFF | PARTIAL_MATCH | MISMATCH) derived from `StructureRelation` (EXACT | SOFT_CONFLICT | HARD_CONFLICT) drives differentiated text in all text builders (summary, dominance shift, executive bullets, constellation risks, impact areas, final text). When rk===ck, impact area texts distinguish maxGap<8 (perfect match) from maxGap≥8 (intensity off).
-   **Teamdynamik (Team Dynamics)**: A dashboard offering 13 deterministic system variants for team-person constellations, with CEO/HR/Teamleitung views, steering levers, and stress simulation. Includes a "Führungskontext" card for leadership role analysis.
-   **KI-Coach (AI Coach)**: A conversational AI for leadership, HR, assessment, recruiting, and communication. Features SSE streaming with blinking cursor, enhanced markdown rendering (tables, ordered lists, horizontal rules, bold headings), context-aware quick reply buttons (AI-generated), a "Profil aktiv" badge when user data is loaded, and structured interview guide generation ("Gesprächsleitfäden"). Sends extended context to the AI including Rollen-DNA, JobCheck results, and Teamdynamik data from localStorage. Quick-reply button system: Louis generates button suggestions via `<<BUTTONS: "Option 1" | "Option 2">>` format at end of responses (governed by ANTWORT-OPTIONEN prompt rule). Frontend `parseButtonsFromContent()` parses this, strips it from display/copy/export/history. Buttons only shown after stream completes (`loading` gate). `stripButtonMarker()` used for all history sanitization. No regex-based heuristic button extraction – the AI decides what buttons to show based on full conversation context.

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
-   **TeamCheck (unified V4)**: The overview page (`teamcheck.tsx`) and all report views (detail + executive) are powered exclusively by `computeTeamCheckV4` from `teamcheck-v4-engine.ts`. V4 calls V3 which calls V2 internally (these remain as engine dependencies). The old V1 engine (`teamcheck-engine.ts`) is no longer used by any active page. Overview tabs: Bewertung, Alltag & Druck, Chancen/Risiken, Führungshebel (from teamdynamik-engine), Prognose, Empfehlungen. Report views: Detail (11 V4 sections including Intro, Gesamtbewertung, Warum, Wirkung im Alltag, Chancen & Risiken, Druck, Führungshinweis, Risikoprognose, Integrationsplan with Warnsignale/Leitfragen, Empfehlungen, Team ohne Person, Fazit) and Executive (condensed with KPI indicators, Chancen/Risiken titles, timeline Prognose, Empfehlungen, Fazit). `teamGoal` selector (Keins/Umsetzung/Analyse/Zusammenarbeit) integrated in Diagnose section. Traffic light from teamdynamik-engine remains for the executive header.
-   **Shared Design Constants**: `client/src/lib/bio-design.ts` serves as a single source of truth for all bioLogic brand colors, used across UI reports and PDF builders.

### Technical Implementations
-   **Integrationsanalyse-Bericht (team-report-engine.ts)**: `computeTeamReport()` now accepts optional `TeamReportOptions` (teamGoal, roleType, roleLevel, taskStructure, workStyle, successFocus). When options are provided, it internally runs V4 engine for `gesamtpassung`/`begleitungsbedarf` and for FK roles uses `calculateLeadershipAssessment` for systemwirkung (3 types: Verstärkung/Spannung/Transformation). Without options (legacy/V3 internal calls), falls back to old totalGap-based logic to avoid recursion. This ensures Preview Cards and Bericht show consistent assessments.
-   **Leader-Team Match Engine**: Provides evaluations for leadership roles, generating ratings and scores.
-   **Teamdynamik Engine**: Calculates metrics like Distribution Gap, Dominance Clash, Role Gap, Transformation Score, and Conflict Index, including stress simulation.
-   **Rollen-DNA to Dominance Mapping**: Maps role attributes to dominance types for fit analysis.
-   **AI Integration**: Utilizes OpenAI for AI-generated reports and the KI-Coach, including function calling for web search and image generation.
-   **KI-Coach Conversation Modes**: Supports specialized modes (Interview-Vorbereitung, Konfliktlösung, Stellenanzeige erstellen, Gesprächsleitfaden) with tailored system prompts per mode. Mode is selected via UI buttons before conversation starts and sent as `mode` parameter to `/api/ki-coach`.
-   **Coach Feedback System**: Thumbs up/down feedback on coach responses is persisted to `coach_feedback` table. Admin can review all feedback under the "Coach-Feedback" tab in the admin panel. Thumbs-up feedback automatically creates a "golden answer" entry.
-   **Golden Answers**: When users give thumbs-up to a coach response, it's auto-saved to `golden_answers` table with category classification. These serve as few-shot quality examples injected into the coach's context (max 2 per request). Admin can view and delete golden answers via the "Goldene Antworten" tab. Content is sanitized against prompt-injection patterns before saving.
-   **Topic Tracking**: Each KI-Coach request is categorized by topic (führung, konflikt, recruiting, team, kommunikation, onboarding, verkauf, etc.) and stored in `coach_topics` table. Admin can view aggregated topic statistics via the "Themen" tab with visual bar charts.
-   **Self-Reflection**: The KI-Coach system prompt includes a quality assurance self-check: before responding, the AI verifies consistency with the bioLogic knowledge base, correct terminology (Prägung not Typ, correct color mappings), practical relevance, and faithful interpretation of source documents.
-   **Knowledge Base (RAG)**: Admin can create/edit/delete knowledge documents via "Wissensdatenbank" tab. Documents are stored in `knowledge_documents` table (39 docs covering methodik, recruiting, fuehrung, teamdynamik, kommunikation, allgemein). Includes 13 individual constellation profiles with FULL original texts (RGB, RBG, GRB, GBR, BGR, BRG, ALLTIE, RGDD, BRDD, GBDD, GRBDD, RGBDD, BGRDD), Coaching-Werkzeugkasten, Management-Konzepte durch bioLogic-Linse, extended bioLogic translations of external concepts (Design Thinking, Lean, 360-Grad-Feedback, Psychological Safety, Change Management, GFK, OKR), 10 anonymized practice cases (Praxisfälle Teil 1 + Teil 2), Checklisten, Sofort-Interventionen (concrete coaching sentences per trait), Kompaktmodule (Leadership, Recruiting). On each KI-Coach request, relevant documents are found via enhanced search (synonym expansion, category-aware scoring, stopword filtering, phrase matching, cross-category diversity) and injected into the system prompt. Search uses last 3 user messages for context. Returns up to 5 documents with category diversity when query spans multiple topics.
-   **Auto-Seeding**: On startup, `seedAdmin()` in `server/seed-admin.ts` auto-seeds knowledge documents (39), golden answers, and coach topics (6 unique categories) from JSON files in `server/` if the respective DB tables are empty. Each seed operation runs in a DB transaction for atomicity. Seed files: `knowledge-seed-data.json`, `golden-answers-seed.json`, `coach-topics-seed.json`. This ensures production deployments start with a complete knowledge base.
-   **Conversation Summary**: For conversations longer than 10 messages, older messages are compressed into a structured summary (user profile hints, topic progression, key decisions) while keeping the last 6 messages verbatim. Prevents repetition and maintains focus in long conversations.
-   **Anti-KI Formulierungen**: Extended list of forbidden phrases to prevent AI-typical patterns: banned numbered lists with bold headings, template phrases ("In der Tat", "Hier sind einige Tipps", etc.), and filler language. Temperature raised from 0.4 to 0.55 for more natural variation.
-   **Roleplay Mode Detection**: Automatic detection of roleplay/simulation conversations. When active: dedicated prompt section forces the AI to stay in character, higher temperature (0.65) for more authentic reactions, clear separation of role response and coach feedback, and instruction to make scenarios realistically challenging.
-   **Editable System Prompt**: The Louis system prompt is stored in `coach_system_prompt` DB table. Admin can view and edit the full prompt via the "Prompt" tab in the admin panel. Changes take effect immediately. A "Standard wiederherstellen" button resets to the hardcoded default. The editable part is the main body (tone, rules, behavior); the intro line and dynamic injections (region, mode, knowledge docs) are added automatically by the code.
-   **Topic Filter**: KI-Coach only answers questions related to HR, recruiting, leadership, teams, communication, marketing, and bioLogic methodology. Off-topic questions are politely declined.
-   **Enterprise Organizations**: `organizations` table with name, optional `aiRequestLimit`, `aiRequestsUsed` counter, and `currentPeriodStart`. Users can be assigned to an org via `organizationId` FK on `users`. Admin CRUD at `/api/admin/organizations`. Usage reset at `/api/admin/organizations/:id/reset-usage`. Admin user create/update APIs accept `organizationId` for org assignment.
-   **Usage Tracking**: `usage_events` table logs every AI call with userId, organizationId, and canonical eventType (`ki_coach`, `rollendna`, `teamdynamik`, `matchcheck`). Tracked fire-and-forget after successful responses on all AI endpoints: ki-coach, generate-kompetenzen, reclassify-kompetenzen, generate-bericht, generate-analyse, generate-team-report, generate-kandidatenprofil. Admin can query org usage (totals + per-user breakdown) at `/api/admin/organizations/:id/usage?since=`. Subadmins can query their own org at `/api/subadmin/usage`.
-   **KI Limit Enforcement**: `checkAiLimit()` checks both per-user and per-org limits before any AI call. Per-user: `users.aiRequestLimit` (default 1000), `users.aiRequestsUsed`, `users.aiPeriodStart`. Per-org: `organizations.aiRequestLimit`, `organizations.aiRequestsUsed`, `organizations.currentPeriodStart`. Both reset automatically on month change via `isNewMonth()`. If either limit exceeded, returns HTTP 429 with German-language error. Admin can set per-user limit in user management form.
-   **Subadmin Role**: `requireSubadmin` middleware allows both admin and subadmin roles. Subadmins see their own org's usage stats (totals + per-user breakdown) via `/api/subadmin/usage`.
-   **Firmen-Dashboard**: `/firma-dashboard` page for subadmins and admins. Shows org KI quota bar, per-feature usage stats (KI-Coach, Rollen-DNA, Teamdynamik, TeamCheck, MatchCheck), per-user breakdown table, and period filter (7d/30d/90d/all). Route-guarded for admin/subadmin roles. Nav icon (Building2) in global nav for subadmin/admin.
-   **Admin Organizations Tab**: "Organisationen" tab in admin panel. Full CRUD for orgs (name, KI-limit). Usage stats per org (expandable per-org detail). Reset usage counter. User-to-org assignment via org dropdown in user edit form. Subadmin badge display in user list.
-   **KI-Coach Limit Feedback**: When org KI quota is exhausted (HTTP 429), the coach shows a friendly German message explaining the limit and suggesting contacting the admin, instead of a generic error.

### MatchCheck Test-Runner
-   **Location**: `tests/matchcheck-runner.ts`
-   **Run**: `npx tsx tests/matchcheck-runner.ts`
-   **Coverage**: 5 test groups – variant recognition (13 profiles), self-match (diagonal), cross-variant structural conflicts (HARD/SOFT), boundary cases (incl. 27/26/47 case), robustness (small variations). Colored console output with specific error diagnostics. Exit code 0 on success, 1 on failure.

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