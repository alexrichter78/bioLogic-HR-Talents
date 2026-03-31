import { createContext, useContext, useState, type ReactNode } from "react";

export type Region = "DE" | "CH" | "AT";

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
};

const RegionContext = createContext<RegionContextType | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(() => {
    const stored = localStorage.getItem("appRegion");
    if (stored === "DE" || stored === "CH" || stored === "AT") return stored;
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

export function useLocalizedText() {
  const { region } = useRegion();
  return (text: string) => region === "CH" ? text.replace(/ß/g, "ss") : text;
}
