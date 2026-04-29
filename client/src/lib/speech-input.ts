import type { Region } from "./region";

export function regionToBcp47Lang(region: Region): string {
  switch (region) {
    case "DE": return "de-DE";
    case "CH": return "de-CH";
    case "AT": return "de-AT";
    case "EN": return "en-US";
    case "FR": return "fr-FR";
    case "IT": return "it-IT";
    default: return "de-DE";
  }
}

type DictRule = { pattern: RegExp; replacement: string };

const RULES: Record<"de" | "en" | "fr" | "it", DictRule[]> = {
  de: [
    { pattern: /\s*[Aa]usrufezeichen\s*/g, replacement: "! " },
    { pattern: /\s*[Ff]ragezeichen\s*/g, replacement: "? " },
    { pattern: /\s*[Dd]oppelpunkt\s*/g, replacement: ": " },
    { pattern: /\s*[Ss]emikolon\s*/g, replacement: "; " },
    { pattern: /\s*[Nn]eue [Zz]eile\s*/g, replacement: "\n" },
    { pattern: /\s*[Aa]bsatz\s*/g, replacement: "\n\n" },
    { pattern: /\s*[Pp]unkt\s*/g, replacement: ". " },
    { pattern: /\s*[Kk]omma\s*/g, replacement: ", " },
  ],
  en: [
    { pattern: /\s*\b[Ee]xclamation\s+(?:[Mm]ark|[Pp]oint)\b\s*/g, replacement: "! " },
    { pattern: /\s*\b[Qq]uestion\s+[Mm]ark\b\s*/g, replacement: "? " },
    { pattern: /\s*\b[Ss]emi-?colon\b\s*/g, replacement: "; " },
    { pattern: /\s*\b[Cc]olon\b\s*/g, replacement: ": " },
    { pattern: /\s*\b[Nn]ew\s+[Pp]aragraph\b\s*/g, replacement: "\n\n" },
    { pattern: /\s*\b[Nn]ew\s+[Ll]ine\b\s*/g, replacement: "\n" },
    { pattern: /\s*\b[Pp]aragraph\b\s*/g, replacement: "\n\n" },
    { pattern: /\s*\b[Ff]ull\s+[Ss]top\b\s*/g, replacement: ". " },
    { pattern: /\s*\b[Pp]eriod\b\s*/g, replacement: ". " },
    { pattern: /\s*\b[Cc]omma\b\s*/g, replacement: ", " },
  ],
  fr: [
    { pattern: /\s*\b[Pp]oint\s+d['']exclamation\b\s*/g, replacement: "! " },
    { pattern: /\s*\b[Pp]oint\s+d['']interrogation\b\s*/g, replacement: "? " },
    { pattern: /\s*\b[Pp]oint[- ]virgule\b\s*/g, replacement: "; " },
    { pattern: /\s*\b[Dd]eux[- ]points\b\s*/g, replacement: ": " },
    { pattern: /\s*\b[Nn]ouveau\s+paragraphe\b\s*/g, replacement: "\n\n" },
    { pattern: /\s*\b[Pp]aragraphe\b\s*/g, replacement: "\n\n" },
    { pattern: /\s*\bà\s+la\s+ligne\b\s*/gi, replacement: "\n" },
    { pattern: /\s*\b[Pp]oint\b\s*/g, replacement: ". " },
    { pattern: /\s*\b[Vv]irgule\b\s*/g, replacement: ", " },
  ],
  it: [
    { pattern: /\s*\b[Pp]unto\s+esclamativo\b\s*/g, replacement: "! " },
    { pattern: /\s*\b[Pp]unto\s+interrogativo\b\s*/g, replacement: "? " },
    { pattern: /\s*\b[Pp]unto\s+e\s+virgola\b\s*/g, replacement: "; " },
    { pattern: /\s*\b[Dd]ue\s+punti\b\s*/g, replacement: ": " },
    { pattern: /\s*\b[Nn]uovo\s+paragrafo\b\s*/g, replacement: "\n\n" },
    { pattern: /\s*\b[Pp]aragrafo\b\s*/g, replacement: "\n\n" },
    { pattern: /\s*\b[Aa]\s+capo\b\s*/g, replacement: "\n" },
    { pattern: /\s*\b[Nn]uova\s+riga\b\s*/g, replacement: "\n" },
    { pattern: /\s*\b[Pp]unto\b\s*/g, replacement: ". " },
    { pattern: /\s*\b[Vv]irgola\b\s*/g, replacement: ", " },
  ],
};

function regionToDictLang(region: Region): "de" | "en" | "fr" | "it" {
  switch (region) {
    case "EN": return "en";
    case "FR": return "fr";
    case "IT": return "it";
    default: return "de";
  }
}

export function cleanDictation(raw: string, region: Region): string {
  const rules = RULES[regionToDictLang(region)] ?? RULES.de;
  let out = raw;
  for (const r of rules) {
    out = out.replace(r.pattern, r.replacement);
  }
  out = out
    .replace(/([.!?])\s+(\w)/g, (_, p, c) => p + " " + c.toUpperCase())
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return out;
}

export type SpeechErrorKind = "permission" | "no-mic" | "network" | "other" | "ignored";

export function classifySpeechError(errorCode: string): SpeechErrorKind {
  if (errorCode === "no-speech" || errorCode === "aborted") return "ignored";
  if (errorCode === "not-allowed" || errorCode === "service-not-allowed") return "permission";
  if (errorCode === "audio-capture") return "no-mic";
  if (errorCode === "network") return "network";
  return "other";
}

export function isSpeechRecognitionAvailable(): boolean {
  return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}
