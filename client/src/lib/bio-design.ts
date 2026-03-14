import type { ComponentKey } from "./jobcheck-engine";

export const BIO_COLORS = {
  impulsiv: "#C41E3A",
  intuitiv: "#F39200",
  analytisch: "#1A5DAB",
  geeignet: "#3A9A5C",
  bedingt: "#E5A832",
  nichtGeeignet: "#D64045",

  headerBg: "#343A48",
  headerBgEnd: "#2A2F3A",

  textPrimary: "#1D1D1F",
  textSecondary: "#48484A",
  textMuted: "#6E6E73",
  textFaint: "#8E8E93",
  textSubtle: "#A0A0A5",
  textDisabled: "#B0B0B5",

  bgPage: "#F1F5F9",
  bgCard: "#FFFFFF",
  bgSoft: "#f8f9fb",
  bgSoftEnd: "#f1f3f8",

  border: "rgba(0,0,0,0.05)",
  borderCard: "rgba(0,0,0,0.06)",
  separator: "rgba(0,0,0,0.05)",

  severityCritical: "#FF3B30",
  severityWarning: "#FF9500",
  severityOk: "#34C759",
} as const;

export const COMP_HEX: Record<ComponentKey, string> = {
  impulsiv: BIO_COLORS.impulsiv,
  intuitiv: BIO_COLORS.intuitiv,
  analytisch: BIO_COLORS.analytisch,
};

export const SECTION_COLORS = {
  sollIstProfil: BIO_COLORS.analytisch,
  unterschied: BIO_COLORS.intuitiv,
  wirkung: BIO_COLORS.impulsiv,
  druck: BIO_COLORS.bedingt,
  risiko: BIO_COLORS.analytisch,
  gesamtbewertung: BIO_COLORS.geeignet,
  integrationsplan: BIO_COLORS.analytisch,
  schlussbewertung: BIO_COLORS.analytisch,
} as const;

export const TC_SECTION_COLORS = [
  BIO_COLORS.analytisch,
  BIO_COLORS.geeignet,
  BIO_COLORS.intuitiv,
  BIO_COLORS.impulsiv,
  BIO_COLORS.analytisch,
  BIO_COLORS.intuitiv,
  BIO_COLORS.impulsiv,
  BIO_COLORS.bedingt,
  BIO_COLORS.impulsiv,
  BIO_COLORS.nichtGeeignet,
  BIO_COLORS.analytisch,
  BIO_COLORS.geeignet,
  BIO_COLORS.nichtGeeignet,
  BIO_COLORS.analytisch,
  BIO_COLORS.geeignet,
  BIO_COLORS.intuitiv,
] as const;

export function fitColor(rating: string): string {
  if (rating === "GEEIGNET" || rating === "Geeignet") return BIO_COLORS.geeignet;
  if (rating === "BEDINGT" || rating === "Bedingt geeignet") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}

export function controlColor(ci: string): string {
  if (ci === "hoch") return BIO_COLORS.nichtGeeignet;
  if (ci === "mittel") return BIO_COLORS.bedingt;
  return BIO_COLORS.geeignet;
}
