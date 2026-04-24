# bioLogic RoleDynamics - Strukturanalyse

## Overview

bioLogic RoleDynamics is a German-language web application for structural analysis, focused on optimizing staffing and team structures through precision in role definition and team composition. It offers an AI-powered platform for defining role requirements, analyzing team dynamics, and generating dynamic reports for strategic decision-making. The project aims to provide comprehensive tools for HR and leadership to enhance organizational efficiency and employee fit.

Key capabilities include:
-   **Rollen-DNA (Role DNA)**: A guided process for defining detailed role requirements.
-   **AI-powered Analysis**: Generates role-specific structural analyses, charts, and recommendations.
-   **Entscheidungsbericht (Decision Report)**: Combines deterministic structural analysis with AI-generated insights.
-   **bioLogic JobCheck (MatchCheck)**: Assesses candidate-role fit, including dominance shift and risk assessments, using a unified engine.
-   **Teamdynamik (Team Dynamics)**: A dashboard providing 13 deterministic system variants for team-person constellations, with steering levers and stress simulation.
-   **KI-Coach (AI Coach)**: A conversational AI for leadership, HR, and assessment, featuring context-aware interactions and structured interview guide generation.

## Localization

The platform supports four languages via the region switcher (DE/CH/AT/EN/FR/IT):
- **German (DE/CH/AT)**: Default language across all UI, engines, and reports.
- **English (EN)**: Full support across all pages, engines, and reports.
- **French (FR)**: Full support across all pages, engines, and reports.
- **Italian (IT)**: Full support across all pages, engines, and reports.
  - Component labels: "Ritmo e Decisione" (impulsiv), "Comunicazione e Relazioni" (intuitiv), "Struttura e Rigore" (analytisch)
  - UI: informal "tu" form; Report narratives: formal third-person
  - No em-dashes, no percentage symbols in IT narratives

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
-   **UI/UX**: Responsive design (mobile-first), global navigation (with mobile tab bar), consistent use of bioLogic brand colors, specific report layouts (e.g., dark anthrazit header for Entscheidungsbericht), and unified `TeamCheck V4` engine for all team assessments.

### Backend
-   **Framework**: Express 5 on Node.js with TypeScript.
-   **API Pattern**: All routes prefixed with `/api`.
-   **Storage Layer**: Abstracted via `IStorage` interface.
-   **Dev Server**: Vite dev server integrated as Express middleware.

### Shared Code
-   **Location**: `shared/schema.ts` for Drizzle ORM table definitions and Zod validation schemas.

### Database
-   **ORM**: Drizzle ORM with PostgreSQL dialect.

### Key Design Decisions
-   **Storage Interface Abstraction**: Decouples business logic from data persistence, allowing for database swapping.
-   **Monorepo-style Shared Code**: Facilitates type and schema sharing between client and server.
-   **Express 5**: Leverages native async error handling and other latest features.
-   **Vite as Dev Middleware**: Provides a single port for both API and frontend during development.
-   **Coach-only Role**: Restricts access for specific users to only the KI-Coach functionality.
-   **Region Switcher**: Supports DE, CH, AT, EN, and FR for localization of UI, AI prompts, and deterministic text. FR uses plain labels "Rythme et Décision" / "Communication et Relations" / "Structure et Rigueur", tutoie ("tu"), no em-dashes, no percentages in narrative output. FR support spans: login page (flag selector), all 7 Claude endpoints, all report pages (rollen-dna, soll-ist-bericht, teamcheck, team-report, jobcheck, rollenprofil, teamdynamik), engine types (soll-ist-engine, jobcheck-engine, teamcheck-v4-engine), ENGINE_VALUE_MAP_FR in region.tsx, REPORT_LABELS.fr in report-texts.ts, and help-bot.tsx.
-   **AI Integration**: Utilizes a combination of OpenAI for reports and image generation, and Anthropic's Claude for the KI-Coach, with robust prompt engineering and knowledge base integration.
-   **KI-Coach Features**: Includes conversation modes, feedback system, golden answers, topic tracking, self-reflection, and a RAG (Retrieval Augmented Generation) system with an editable system prompt and a comprehensive knowledge base.
-   **Enterprise Features**: Implements organization management, usage tracking, and AI request limits for users and organizations, with subadmin roles and a dedicated Firmen-Dashboard.
-   **Live Translation System**: DB-backed translation table (`translations`) with 445 entries across all 4 languages. Admin page at `/ubersetzung` provides inline cell editing — click any DE/EN/FR/IT text, edit, press Enter → saved instantly via PATCH `/api/translations/:key`. `TranslationProvider` wraps the app, seeds DB on first admin login (via `all-translations.ts`), and `useUI()` deep-merges DB overrides over hardcoded `ui-texts.ts` values. Changes reflect immediately. `POST /api/translations/sync` inserts missing keys without overwriting admin edits. **Fully wired pages** (all UI labels via `useUI()`): login, kurs, analyse, rollenprofil, rollen-dna, soll-ist-bericht, teamdynamik, teamcheck (38 refs), team-report (27 refs), jobcheck (31 refs), help-bot component (11 refs), impressum/disclaimer/datenschutz (back button). **Deduplication completed**: canonical key map established — `general.print/pdfExportFail/generating/back/next/labelImpulsiv/Intuitiv/Analytisch` are canonical; `teamreport.*` is canonical for shared report content; `teamdyn.newLeader/newMember` for role labels. `ui-texts.ts` has 2304 lines; `all-translations.ts` has 445 entries (previously 484 before dedup).
-   **MatchCheck Engine**: Unified `computeCoreFit()` for all fit calculations, ensuring consistency across JobCheck and other analyses.
-   **TeamCheck V4 Engine**: Powers all team assessment views with a score-based formula and detailed output for systemwirkung, task fit, and overall assessment.
-   **Report Generation**: Deterministic reports (e.g., JobCheck, Team Report) are generated by dedicated engines (`entscheidungsbericht-engine.ts`, `team-report-engine.ts`) to ensure consistency and structure.

## External Dependencies

### Database
-   **PostgreSQL**: Primary database used with Drizzle ORM.

### Key NPM Packages
-   **drizzle-orm** / **drizzle-kit**: ORM and migration tooling for database interactions.
-   **express**: Node.js web application framework.
-   **@tanstack/react-query**: For efficient client-side data fetching, caching, and synchronization.
-   **zod**: Schema declaration and validation library for robust data handling.
-   **wouter**: A small and modern client-side router for React.
-   **shadcn/ui + Radix UI**: UI component library providing accessible and customizable building blocks.
-   **recharts**: A composable charting library built with React and D3.
-   **html2canvas** / **jsPDF**: For client-side HTML-to-PDF conversion and PDF generation.

### AI Services
-   **OpenAI (GPT-4.1)**: Used for various AI-generated reports (Rollen-DNA, MatchCheck, TeamCheck, Analyse, Kompetenzen, Kandidatenprofil) and image generation.
-   **Anthropic (Claude Sonnet 4.5)**: Powers the KI-Coach "Louis," handling conversational AI, tool use (web search, image generation), and context-aware responses.