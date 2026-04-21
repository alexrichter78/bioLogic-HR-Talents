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
