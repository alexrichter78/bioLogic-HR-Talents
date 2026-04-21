import { createContext, useContext, useState, type ReactNode } from "react";

export type Region = "DE" | "CH" | "AT" | "EN";

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
};

const RegionContext = createContext<RegionContextType | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(() => {
    const stored = localStorage.getItem("appRegion");
    if (stored === "DE" || stored === "CH" || stored === "AT" || stored === "EN") return stored;
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
    if (region === "CH" || region === "EN") return text;
    return ssToSz(text);
  };
}

export function localizeStr(text: string, region: Region): string {
  if (region === "CH" || region === "EN") return text;
  return ssToSz(text);
}

export function localizeDeep<T>(obj: T, region: Region): T {
  if (typeof obj === "string") return localizeStr(obj, region) as unknown as T;
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
