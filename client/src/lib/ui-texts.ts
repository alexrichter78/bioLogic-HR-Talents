import { useRegion } from "./region";

type UILang = "de" | "en";

export const UI = {
  de: {
    nav: {
      home: "Home",
      homeSub: "",
      jobcheck: "JobCheck",
      jobcheckSub: "Stellenanalyse",
      matchcheck: "MatchCheck",
      matchcheckSub: "Stelle ↔ Person",
      teamcheck: "TeamCheck",
      teamcheckSub: "Teamstruktur",
      coach: "Louis (KI-Coach)",
      coachSub: "Führung & Entwicklung",
      courses: "Kursbereich",
      coursesSub: "Lernmodule",
      regionTitle: "Sprachregion",
      regionLabel: (l: string) => `Sprachregion: ${l}`,
      firmaDashboard: "Firmen-Dashboard",
      userManagement: "Benutzerverwaltung",
      logout: "Abmelden",
    },
    footer: {
      aiQuotaTitle: (used: number, total: number, reset: string) =>
        `${used} von ${total} KI-Anfragen genutzt\nAutomatische Zurücksetzung am ${reset}`,
      aiPrefix: "KI:",
      aiOf: "von",
      aiLeft: "übrig",
      resetOn: "Reset am",
      accessUntil: "Freigeschaltet bis:",
      imprint: "Impressum",
      privacy: "Datenschutz",
      disclaimer: "Disclaimer",
    },
    region: {
      DE: "Deutschland",
      CH: "Schweiz",
      AT: "Österreich",
      EN: "English",
    },
    home: {
      resetTitle: "Bist du sicher?",
      resetBody: "Alle eingegebenen Daten werden gelöscht.",
      cancel: "Abbrechen",
      continue: "Weiter",
      fileError: "Die Datei konnte nicht gelesen werden.",
      jobcheckTitle: "Stellenanalyse",
      jobcheckSubtitle: "Strukturelle Passung für sichere Besetzungsentscheidungen",
      jobcheckDesc: "Definiere eine Stelle und analysiere die strukturelle Passung. Die Analyse liefert klare Handlungsempfehlungen für Besetzung, Führung und Zusammenarbeit.",
      newAnalysis: "Neue Analyse",
      openAnalysis: "Analyse öffnen",
      jobcheckBullets: [
        "Wissenschaftlich fundierte Methodik",
        "Klare Entscheidungsstruktur",
        "Objektive Personalentscheidungen",
        "Transparente Ergebnislogik",
        "Reduziert Fehlbesetzungsrisiken",
        "Passgenaue Rollenbesetzung",
      ],
      coachTitle: "Louis",
      coachSubtitle: "Coach für Entscheidungen im richtigen Moment",
      coachDesc: "Nutze Louis für Recruiting, Teamfragen, Gesprächsvorbereitung und konkrete Handlungsempfehlungen – jederzeit, auch ohne Analyse.",
      openCoach: "Louis öffnen",
      coachBullets: [
        "Recruiting und Stellenanzeigen",
        "Gesprächsvorbereitung",
        "Analyse von Teamkonstellationen",
        "Konfliktmuster erkennen und lösen",
        "Rollenspiele und Gesprächssimulation",
        "Quellenbasierte Führungsberatung",
      ],
    },
  },
  en: {
    nav: {
      home: "Home",
      homeSub: "",
      jobcheck: "JobCheck",
      jobcheckSub: "Role analysis",
      matchcheck: "MatchCheck",
      matchcheckSub: "Role ↔ Person",
      teamcheck: "TeamCheck",
      teamcheckSub: "Team structure",
      coach: "Louis (AI Coach)",
      coachSub: "Leadership & development",
      courses: "Courses",
      coursesSub: "Learning modules",
      regionTitle: "Language region",
      regionLabel: (l: string) => `Language region: ${l}`,
      firmaDashboard: "Company dashboard",
      userManagement: "User management",
      logout: "Log out",
    },
    footer: {
      aiQuotaTitle: (used: number, total: number, reset: string) =>
        `${used} of ${total} AI requests used\nAutomatic reset on ${reset}`,
      aiPrefix: "AI:",
      aiOf: "of",
      aiLeft: "left",
      resetOn: "Reset on",
      accessUntil: "Access until:",
      imprint: "Imprint",
      privacy: "Privacy",
      disclaimer: "Disclaimer",
    },
    region: {
      DE: "Germany",
      CH: "Switzerland",
      AT: "Austria",
      EN: "English",
    },
    home: {
      resetTitle: "Are you sure?",
      resetBody: "All entered data will be deleted.",
      cancel: "Cancel",
      continue: "Continue",
      fileError: "The file could not be read.",
      jobcheckTitle: "Role analysis",
      jobcheckSubtitle: "Structural fit for confident hiring decisions",
      jobcheckDesc: "Define a role and analyse its structural fit. The analysis delivers clear recommendations for hiring, leadership and collaboration.",
      newAnalysis: "New analysis",
      openAnalysis: "Open analysis",
      jobcheckBullets: [
        "Scientifically grounded methodology",
        "Clear decision structure",
        "Objective people decisions",
        "Transparent reasoning",
        "Reduces mis-hire risk",
        "Precise role placement",
      ],
      coachTitle: "Louis",
      coachSubtitle: "Coach for decisions at the right moment",
      coachDesc: "Use Louis for recruiting, team questions, interview preparation and concrete recommendations – anytime, even without an analysis.",
      openCoach: "Open Louis",
      coachBullets: [
        "Recruiting and job postings",
        "Interview preparation",
        "Analysing team constellations",
        "Spotting and resolving conflict patterns",
        "Role play and conversation simulation",
        "Source-based leadership advice",
      ],
    },
  },
} as const;

export type UIDict = typeof UI.de;

export function useUI(): UIDict {
  const { region } = useRegion();
  return region === "EN" ? (UI.en as unknown as UIDict) : UI.de;
}

export function getUI(region: string): UIDict {
  return region === "EN" ? (UI.en as unknown as UIDict) : UI.de;
}
