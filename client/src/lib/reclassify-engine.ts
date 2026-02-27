type KompetenzTyp = "Impulsiv" | "Intuitiv" | "Analytisch";

const KEYWORDS_IMP = [
  "entscheid", "durchsetz", "verhandl", "umsetz", "steuer", "prioris", "druck",
  "tempo", "abschluss", "ergebnis", "ziel", "deal", "akquise", "vertrieb", "verkauf",
  "pipeline", "forecast", "einkauf", "budget", "krise", "eskalat", "intervention",
  "initiative", "antrieb", "leistung", "wettbewerb", "durchgriff", "verantwort",
  "delegier", "anweis", "vorgabe", "durchhalten", "belastbar", "konflikt",
  "risiko", "schnell", "direkt", "verbindlich", "konsequen", "pragmat",
  "hands-on", "operativ", "mach", "treib", "führ", "leit", "manage",
  "performan", "produktiv", "effizien", "kontroll", "monitor", "überprüf",
];

const KEYWORDS_INT = [
  "beziehung", "empathie", "team", "zusammenarbeit", "kommunikation",
  "moderier", "vermittel", "coaching", "mentor", "vertrauen", "zuhör",
  "einfühl", "wertschätz", "feedback", "konfliktlös", "mediat",
  "netzwerk", "stakeholder", "kunden", "kontakt", "pflege", "betreu",
  "kultur", "klima", "harmonie", "konsens", "abstimm", "kooperat",
  "partizipat", "interkulturell", "diversit", "inklus", "sozial",
  "emotional", "motivier", "inspir", "begeister", "förder",
  "entwickl", "onboard", "integrat", "bindung", "zufried",
  "service", "gastfreund", "hospitality", "patient",
  "unterstütz", "hilfsbereit", "fürsorge",
];

const KEYWORDS_ANA = [
  "analyse", "analys", "strateg", "planung", "konzept", "methode", "method",
  "daten", "kennzahl", "kpi", "report", "bericht", "auswert", "statis",
  "qualität", "standard", "prozess", "system", "struktur", "ordnung",
  "dokument", "protokoll", "compliance", "regulat", "recht", "gesetz",
  "audit", "prüf", "kontroll", "risikomanag", "sicherheit",
  "fach", "expert", "wissen", "forsch", "innovat", "technolog",
  "programm", "software", "architektur", "design", "entwickl",
  "budget", "finanz", "controlling", "buchhalt", "bilanz",
  "logik", "systematisch", "präzis", "sorgfalt", "gründlich",
  "optimier", "verbesser", "lean", "six sigma",
  "wissenschaft", "evidenz", "benchmark", "best practice",
];

function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) count++;
  }
  return count;
}

export function classifyKompetenz(name: string, kategorie?: string): KompetenzTyp {
  const text = name.toLowerCase().replace(/[-_]/g, "");

  const impScore = countMatches(text, KEYWORDS_IMP);
  const intScore = countMatches(text, KEYWORDS_INT);
  const anaScore = countMatches(text, KEYWORDS_ANA);

  if (impScore === 0 && intScore === 0 && anaScore === 0) {
    if (kategorie === "fuehrung") return "Impulsiv";
    if (kategorie === "neben") return "Intuitiv";
    return "Analytisch";
  }

  if (impScore > intScore && impScore > anaScore) return "Impulsiv";
  if (intScore > impScore && intScore > anaScore) return "Intuitiv";
  if (anaScore > impScore && anaScore > intScore) return "Analytisch";

  if (impScore === intScore && impScore > anaScore) return "Impulsiv";
  if (anaScore === intScore && anaScore > impScore) return "Analytisch";
  if (impScore === anaScore && impScore > intScore) return "Impulsiv";

  if (kategorie === "fuehrung") return "Impulsiv";
  if (kategorie === "neben") return "Intuitiv";
  return "Analytisch";
}

export function reclassifyItems(items: { name: string; kategorie: string }[]): { kompetenz: KompetenzTyp }[] {
  return items.map(item => ({
    kompetenz: classifyKompetenz(item.name, item.kategorie),
  }));
}
