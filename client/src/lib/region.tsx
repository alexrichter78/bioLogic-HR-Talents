import { createContext, useContext, useState, type ReactNode } from "react";

export type Region = "DE" | "CH" | "AT" | "EN" | "FR" | "IT";

interface RegionContextType {
  region: Region;
  setRegion: (r: Region) => void;
  locale: string;
  regionLabel: string;
}

const REGION_MAP: Record<Region, { locale: string; label: string }> = {
  DE: { locale: "de-DE", label: "Deutschland" },
  CH: { locale: "de-CH", label: "Schweiz" },
  AT: { locale: "de-AT", label: "Österreich" },
  EN: { locale: "en-US", label: "English" },
  FR: { locale: "fr-FR", label: "Français" },
  IT: { locale: "it-IT", label: "Italiano" },
};

const RegionContext = createContext<RegionContextType | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(() => {
    const stored = localStorage.getItem("appRegion");
    if (stored === "DE" || stored === "CH" || stored === "AT" || stored === "EN" || stored === "FR" || stored === "IT") return stored;
    return "DE";
  });

  const setRegion = (r: Region) => {
    setRegionState(r);
    localStorage.setItem("appRegion", r);
  };

  const info = REGION_MAP[region];

  return (
    <RegionContext.Provider value={{ region, setRegion, locale: info.locale, regionLabel: info.label }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}

type Replacer = string | ((...args: string[]) => string);
const SS_RULES: [RegExp, Replacer][] = [
  [/[Gg]rösst/g, (m) => m[0] === "G" ? "Größt" : "größt"],
  [/[Gg]rösser/g, (m) => m[0] === "G" ? "Größer" : "größer"],
  [/[Gg]rössen/g, (m) => m[0] === "G" ? "Größen" : "größen"],
  [/[Gg]ross/g, (m) => m[0] === "G" ? "Groß" : "groß"],
  [/[Mm]ässig/g, (m) => m[0] === "M" ? "Mäßig" : "mäßig"],
  [/[Mm]assnahm/g, (m) => m[0] === "M" ? "Maßnahm" : "maßnahm"],
  [/[Mm]assgeblich/g, (m) => m[0] === "M" ? "Maßgeblich" : "maßgeblich"],
  [/[Mm]assgeschneidert/g, (m) => m[0] === "M" ? "Maßgeschneidert" : "maßgeschneidert"],
  [/[Mm]assstäb/g, (m) => m[0] === "M" ? "Maßstäb" : "maßstäb"],
  [/[Mm]assstab/g, (m) => m[0] === "M" ? "Maßstab" : "maßstab"],
  [/\bMass\b/g, "Maß"],
  [/[Aa]usser/g, (m) => m[0] === "A" ? "Außer" : "außer"],
  [/[Aa]ussen\b/g, (m) => m[0] === "A" ? "Außen" : "außen"],
  [/[Gg]emäss/g, (m) => m[0] === "G" ? "Gemäß" : "gemäß"],
  [/[Ss]chliess/g, (m) => m[0] === "S" ? "Schließ" : "schließ"],
  [/[Ss]toss/g, (m) => m[0] === "S" ? "Stoß" : "stoß"],
  [/[Ss]trass/g, (m) => m[0] === "S" ? "Straß" : "straß"],
  [/[Hh]eisst/g, (m) => m[0] === "H" ? "Heißt" : "heißt"],
  [/\b[Ww]eiss\b/g, (m) => m[0] === "W" ? "Weiß" : "weiß"],
  [/\b[Ww]eiss([,.])/g, (m, p) => (m[0] === "W" ? "Weiß" : "weiß") + p],
  [/[Rr]eiss/g, (m) => m[0] === "R" ? "Reiß" : "reiß"],
  [/[Gg]iess/g, (m) => m[0] === "G" ? "Gieß" : "gieß"],
  [/[Ff]liess/g, (m) => m[0] === "F" ? "Fließ" : "fließ"],
  [/[Ss]chiess/g, (m) => m[0] === "S" ? "Schieß" : "schieß"],
  [/[Ss]chweiss/g, (m) => m[0] === "S" ? "Schweiß" : "schweiß"],
  [/[Vv]erstoss/g, (m) => m[0] === "V" ? "Verstoß" : "verstoß"],
  [/[Ee]rschliess/g, (m) => m[0] === "E" ? "Erschließ" : "erschließ"],
  [/[Gg]leichermassen/g, (m) => m[0] === "G" ? "Gleichermaßen" : "gleichermaßen"],
];

function ssToSz(text: string): string {
  let result = text;
  for (const [pattern, replacement] of SS_RULES) {
    result = result.replace(pattern, replacement as any);
  }
  return result;
}

export function useLocalizedText() {
  const { region } = useRegion();
  return (text: string) => {
    if (region === "CH" || region === "EN" || region === "FR" || region === "IT") return text;
    return ssToSz(text);
  };
}

export function localizeStr(text: string, region: Region): string {
  if (region === "CH" || region === "EN" || region === "FR" || region === "IT") return text;
  return ssToSz(text);
}

const ENGINE_VALUE_MAP_EN: Record<string, string> = {
  "Verstärkung": "Reinforcement",
  "Spannung": "Tension",
  "Transformation": "Transformation",
  "Ergänzung": "Complement",
  "Korrekturimpuls": "Corrective impulse",
  "Spannungsreiche Ergänzung": "Tension-rich complement",
  "Kritische Spannung": "Critical tension",
  "Spannungsreiche Abweichung": "Tension-rich deviation",
  "Stabile Passung": "Stable fit",
  "Anpassungsleistung": "Adaptive performance",
  "Hoch": "High",
  "hoch": "high",
  "Mittel": "Moderate",
  "mittel": "moderate",
  "Gering": "Low",
  "gering": "low",
  "Niedrig": "Low",
  "niedrig": "low",
  "Geeignet": "Suitable",
  "Bedingt geeignet": "Conditionally suitable",
  "Nicht geeignet": "Not suitable",
  "Gesamtpassung": "Overall fit",
  "Systemwirkung": "System impact",
  "Teamprofil": "Team profile",
  "Personenprofil": "Person profile",
  "Intensität": "Intensity",
  "Steuerungsaufwand": "Management effort",
  "Passend": "Suitable",
  "Teilweise passend": "Partially suitable",
  "Kritisch": "Critical",
  "Kein Ziel gewählt": "No goal selected",
  "Stabile Ergänzung": "Stable complement",
  "Ergänzung mit Spannung": "Complement under tension",
  "nicht bewertet": "not assessed",
};

const ENGINE_VALUE_MAP_FR: Record<string, string> = {
  "Verstärkung": "Renforcement",
  "Spannung": "Tension",
  "Transformation": "Transformation",
  "Ergänzung": "Complémentarité",
  "Korrekturimpuls": "Impulsion correctrice",
  "Spannungsreiche Ergänzung": "Complémentarité sous tension",
  "Kritische Spannung": "Tension critique",
  "Spannungsreiche Abweichung": "Écart sous tension",
  "Stabile Passung": "Adéquation stable",
  "Anpassungsleistung": "Capacité d'adaptation",
  "Hoch": "Élevé",
  "hoch": "élevé",
  "Mittel": "Moyen",
  "mittel": "moyen",
  "Gering": "Faible",
  "gering": "faible",
  "Niedrig": "Bas",
  "niedrig": "bas",
  "Geeignet": "Adapté",
  "Bedingt geeignet": "Partiellement adapté",
  "Nicht geeignet": "Non adapté",
  "Gesamtpassung": "Adéquation globale",
  "Systemwirkung": "Impact systémique",
  "Teamprofil": "Profil d'équipe",
  "Personenprofil": "Profil personnel",
  "Intensität": "Intensité",
  "Steuerungsaufwand": "Effort de pilotage",
  "Passend": "Adapté",
  "Teilweise passend": "Partiellement adapté",
  "Kritisch": "Critique",
  "Kein Ziel gewählt": "Aucun objectif sélectionné",
  "Stabile Ergänzung": "Complémentarité stable",
  "Ergänzung mit Spannung": "Complémentarité sous tension",
  "nicht bewertet": "non évalué",
};

const ENGINE_VALUE_MAP_IT: Record<string, string> = {
  "Verstärkung": "Potenziamento",
  "Spannung": "Tensione",
  "Transformation": "Trasformazione",
  "Ergänzung": "Complementarità",
  "Korrekturimpuls": "Impulso correttivo",
  "Spannungsreiche Ergänzung": "Complementarità sotto tensione",
  "Kritische Spannung": "Tensione critica",
  "Spannungsreiche Abweichung": "Scarto sotto tensione",
  "Stabile Passung": "Adeguatezza stabile",
  "Anpassungsleistung": "Capacità di adattamento",
  "Hoch": "Elevato",
  "hoch": "elevato",
  "Mittel": "Moderato",
  "mittel": "moderato",
  "Gering": "Basso",
  "gering": "basso",
  "Niedrig": "Basso",
  "niedrig": "basso",
  "Geeignet": "Adatto",
  "Bedingt geeignet": "Parzialmente adatto",
  "Nicht geeignet": "Non adatto",
  "Gesamtpassung": "Adeguatezza globale",
  "Systemwirkung": "Impatto sistemico",
  "Teamprofil": "Profilo del team",
  "Personenprofil": "Profilo della persona",
  "Intensität": "Intensità",
  "Steuerungsaufwand": "Sforzo di gestione",
  "Passend": "Adatto",
  "Bedingt passend": "Parzialmente adatto",
  "Nicht passend": "Non adatto",
  "Teilweise passend": "Parzialmente adatto",
  "Kritisch": "Critico",
  "Kein Ziel gewählt": "Nessun obiettivo selezionato",
  "Stabile Ergänzung": "Complementarità stabile",
  "Ergänzung mit Spannung": "Complementarità sotto tensione",
  "nicht bewertet": "non valutato",
  "Integrationsaufwand": "Sforzo di integrazione",
};

export function translateEngineValue(value: string | null | undefined, region: Region): string {
  if (!value) return value ?? "";
  if (region === "EN") return ENGINE_VALUE_MAP_EN[value] ?? value;
  if (region === "FR") return ENGINE_VALUE_MAP_FR[value] ?? value;
  if (region === "IT") return ENGINE_VALUE_MAP_IT[value] ?? value;
  return value;
}

export function localizeDeep<T>(obj: T, region: Region): T {
  if (typeof obj === "string") {
    const s = localizeStr(obj, region);
    if (region === "FR" || region === "EN" || region === "IT") return translateEngineValue(s, region) as unknown as T;
    return s as unknown as T;
  }
  if (Array.isArray(obj)) return obj.map(item => localizeDeep(item, region)) as unknown as T;
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = localizeDeep(v, region);
    }
    return out as T;
  }
  return obj;
}
