import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Download, AlertTriangle, CheckCircle } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { BERUFE } from "@/data/berufe";
import { hyphenateText } from "@/lib/hyphenate";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

type BG = { imp: number; int: number; ana: number };
type ProfileType = "balanced_all" | "strong_imp" | "strong_ana" | "strong_int" |
  "dominant_imp" | "dominant_ana" | "dominant_int" |
  "light_imp" | "light_ana" | "light_int" |
  "hybrid_imp_ana" | "hybrid_ana_int" | "hybrid_imp_int";
type Intensity = "strong" | "clear" | "light" | "balanced";

function roundPercentages(p1: number, p2: number, p3: number): [number, number, number] {
  const factor = 10;
  const raw = [p1 * factor, p2 * factor, p3 * factor];
  const flo = [Math.floor(raw[0]), Math.floor(raw[1]), Math.floor(raw[2])];
  const rest = [raw[0] - flo[0], raw[1] - flo[1], raw[2] - flo[2]];
  const targetSum = 100 * factor;
  let missing = targetSum - (flo[0] + flo[1] + flo[2]);
  while (missing > 0) {
    let maxIdx = 0;
    if (rest[1] > rest[maxIdx]) maxIdx = 1;
    if (rest[2] > rest[maxIdx]) maxIdx = 2;
    flo[maxIdx] += 1;
    rest[maxIdx] = 0;
    missing -= 1;
  }
  return [flo[0] / factor, flo[1] / factor, flo[2] / factor];
}

function calcBioGram(taetigkeiten: any[]): BG {
  if (!taetigkeiten.length) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const weights: Record<string, number> = { Niedrig: 0.6, Mittel: 1.0, Hoch: 1.8 };
  let sI = 0, sN = 0, sA = 0;
  for (const t of taetigkeiten) {
    const w = weights[t.niveau] || 1.0;
    if (t.kompetenz === "Impulsiv") sI += w;
    else if (t.kompetenz === "Intuitiv") sN += w;
    else sA += w;
  }
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function computeGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
  const all = [haupt, neben, fuehrung, rahmen];
  let vals = [
    all.reduce((s, g) => s + g.imp, 0) / 4,
    all.reduce((s, g) => s + g.int, 0) / 4,
    all.reduce((s, g) => s + g.ana, 0) / 4,
  ];
  const MAX = 67;
  const peak = Math.max(...vals);
  if (peak > MAX) {
    const scale = MAX / peak;
    vals = vals.map(v => v * scale);
  }
  const [imp, int, ana] = roundPercentages(vals[0], vals[1], vals[2]);
  return { imp, int, ana };
}

function computeRahmen(state: any): BG {
  let sI = 0, sN = 0, sA = 0;
  const f = state.fuehrung || "";
  if (f === "Fachliche Führung") sA += 1;
  else if (f === "Projekt-/Teamkoordination") sN += 1;
  else if (f.startsWith("Disziplinarische")) sI += 1;
  for (const idx of (state.erfolgsfokusIndices || [])) {
    if (idx === 0 || idx === 2) sI += 1;
    else if (idx === 1 || idx === 5) sN += 1;
    else if (idx === 3 || idx === 4) sA += 1;
  }
  if (state.aufgabencharakter === "überwiegend operativ") sI += 1;
  else if (state.aufgabencharakter === "überwiegend systemisch") sN += 1;
  else if (state.aufgabencharakter === "überwiegend strategisch") sA += 1;
  if (state.arbeitslogik === "Umsetzungsorientiert") sI += 1;
  else if (state.arbeitslogik === "Menschenorientiert") sN += 1;
  else if (state.arbeitslogik === "Daten-/prozessorientiert") sA += 1;
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function classifyProfile(bg: BG): { type: ProfileType; intensity: Intensity } {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
  const [max, second, third] = vals;
  const gap12 = max.value - second.value;
  const gap23 = second.value - third.value;
  const abII = Math.abs(bg.imp - bg.int);
  const abIA = Math.abs(bg.imp - bg.ana);
  const abNA = Math.abs(bg.int - bg.ana);

  if (abII <= 6 && abIA <= 6 && abNA <= 6) return { type: "balanced_all", intensity: "balanced" };
  if (max.value >= 55) return { type: `strong_${max.key}` as ProfileType, intensity: "strong" };
  if (gap12 >= 8) return { type: `dominant_${max.key}` as ProfileType, intensity: "clear" };
  if (gap12 <= 5 && gap23 > 5) {
    const k1 = max.key, k2 = second.key;
    const hybridKey = `hybrid_${k1}_${k2}`;
    const validHybrids = ["hybrid_imp_ana", "hybrid_ana_int", "hybrid_imp_int"];
    const reverseMap: Record<string, string> = { "hybrid_ana_imp": "hybrid_imp_ana", "hybrid_int_ana": "hybrid_ana_int", "hybrid_int_imp": "hybrid_imp_int" };
    const resolved = validHybrids.includes(hybridKey) ? hybridKey : (reverseMap[hybridKey] || "hybrid_imp_ana");
    const hybridIntensity: Intensity = gap23 >= 15 ? "strong" : gap23 >= 8 ? "clear" : "light";
    return { type: resolved as ProfileType, intensity: hybridIntensity };
  }
  if (gap12 >= 5) return { type: `light_${max.key}` as ProfileType, intensity: "light" };
  return { type: "balanced_all", intensity: "balanced" };
}

const SORT_PRIORITY: Record<string, number> = { imp: 0, int: 1, ana: 2 };

function sortedTriad(bg: BG) {
  return [
    { key: "imp" as const, label: "Impulsiv", value: bg.imp },
    { key: "int" as const, label: "Intuitiv", value: bg.int },
    { key: "ana" as const, label: "Analytisch", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
}

function dominant(bg: BG) { return sortedTriad(bg)[0]; }
function secondary(bg: BG) { return sortedTriad(bg)[1]; }
function weakest(bg: BG) { return sortedTriad(bg)[2]; }

function kompShort(k: string): string {
  if (k === "imp" || k === "Impulsiv") return "Umsetzungsstärke";
  if (k === "int" || k === "Intuitiv") return "Beziehungsfähigkeit";
  return "Strukturkompetenz";
}

function kompLabel(k: string): string {
  if (k === "imp" || k === "Impulsiv" || k === "impulsiv") return "Handlungs- und Umsetzungskompetenz";
  if (k === "int" || k === "Intuitiv" || k === "intuitiv") return "Sozial- und Beziehungskompetenz";
  return "Fach- und Methodenkompetenz";
}

function kompAdj(k: string): string {
  if (k === "imp" || k === "Impulsiv") return "handlungsorientiert";
  if (k === "int" || k === "Intuitiv") return "beziehungsorientiert";
  return "strukturiert";
}

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/ Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Innovations- & Transformationsleistung",
  "Prozess- und Effizienzqualität",
  "Fachliche Exzellenz / Expertise",
  "Strategische Wirkung / Positionierung",
];

type ReportData = {
  beruf: string;
  bereich: string;
  isLeadership: boolean;
  fuehrungstyp: string;
  aufgabencharakter: string;
  arbeitslogik: string;
  gesamt: BG;
  haupt: BG;
  neben: BG;
  fuehrung: BG;
  rahmen: BG;
  profileType: ProfileType;
  intensity: Intensity;
  dom: { key: string; label: string; value: number };
  sec: { key: string; label: string; value: number };
  wk: { key: string; label: string; value: number };
  taetigkeiten: any[];
  erfolgsfokusIndices: number[];
};

function buildStressTexts(bg: BG) {
  const COMP_LABELS: Record<string, string> = { imp: "Impulsiv", int: "Intuitiv", ana: "Analytisch" };
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
  const [top, mid, low] = vals;
  const gap12 = Math.round(top.value - mid.value);
  const gap23 = Math.round(mid.value - low.value);
  const hasDualDominance = gap12 <= 5;
  const hasSecondaryCompetition = gap12 >= 10 && gap23 <= 5;
  const hasFullSymmetry = gap12 <= 5 && gap23 <= 5;
  const dominantLabel = COMP_LABELS[top.key];
  const secondLabel = COMP_LABELS[mid.key];
  const thirdLabel = COMP_LABELS[low.key];

  let controlled = "";
  if (hasFullSymmetry) {
    controlled = `Wenn der Arbeitsdruck steigt, fehlt ein klarer Verstärkungsmechanismus. Es gibt keine dominante Komponente, die sich durchsetzen kann. Stattdessen wird die Reaktion kontextabhängig – mal ${dominantLabel.toLowerCase()}, mal ${secondLabel.toLowerCase()}. Die Person zeigt unter moderatem Druck kein vorhersagbares Muster und reagiert situativ.`;
  } else if (hasDualDominance) {
    controlled = `Wenn der Arbeitsdruck steigt, wird sich eine der beiden starken Seiten (${dominantLabel} oder ${secondLabel}) durchsetzen. Das kann kurzfristig Klarheit schaffen: Die Person konzentriert sich auf eine Steuerungslogik und stabilisiert die Situation. Gleichzeitig wird die andere Seite vorübergehend unterdrückt.`;
  } else {
    controlled = `Wenn der Arbeitsdruck steigt, zeigt sich die Stärke der Rolle besonders deutlich. Die Person stabilisiert Situationen vor allem über ${kompShort(top.key).toLowerCase()}. ${dominantLabel} verstärkt sich – ${secondLabel} und ${thirdLabel} treten in den Hintergrund. Gerade unter Druck entsteht dadurch Sicherheit und Orientierung für das Umfeld.`;
  }

  let uncontrolled = "";
  if (hasFullSymmetry) {
    uncontrolled = `Wenn der Druck sehr hoch wird und viele Anforderungen gleichzeitig auftreten, fehlt der Rückfallmechanismus komplett. Das Verhalten springt zwischen allen drei Logiken – ${dominantLabel}, ${secondLabel} und ${thirdLabel} konkurrieren gleichzeitig. Entscheidungen werden sprunghaft, widersprüchlich oder bleiben ganz aus.`;
  } else if (hasSecondaryCompetition) {
    uncontrolled = `Wenn der Druck sehr hoch wird, beginnen ${secondLabel} und ${thirdLabel} zu konkurrieren. Die klare ${dominantLabel}-Führung bricht ein, das Verhalten wird wechselhaft. Die Person arbeitet dann stärker über wechselnde Strategien, ohne sich für eine klare Linie zu entscheiden.`;
  } else if (hasDualDominance) {
    uncontrolled = `Wenn der Druck sehr hoch wird, geraten ${dominantLabel} und ${secondLabel} in einen internen Konflikt. Beide Seiten wollen gleichzeitig steuern – das erzeugt Widersprüche im Verhalten. Entscheidungen werden zögerlich oder sprunghaft, weil keine klare Leitlinie dominiert.`;
  } else {
    uncontrolled = `Wenn der Druck sehr hoch wird und viele Anforderungen gleichzeitig auftreten, verschiebt sich der Fokus der Rolle. Die Person arbeitet dann stärker über ${kompShort(mid.key).toLowerCase()} und ${kompAdj(mid.key)}es Vorgehen. Die ursprüngliche ${dominantLabel}-Stärke verliert an Durchschlagskraft. Entscheidungen werden ${mid.key === "ana" ? "sachlicher getroffen und Situationen klarer organisiert" : mid.key === "int" ? "stärker über Abstimmung und Konsens getroffen" : "schneller und direkter getroffen, teils ohne ausreichende Prüfung"}.`;
  }

  return { controlled, uncontrolled };
}

function buildTeamwirkung(data: ReportData) {
  const { isLeadership, dom, sec, wk, beruf, fuehrungstyp } = data;

  let fuehrungswirkung = "";
  if (isLeadership) {
    if (dom.key === "imp") {
      fuehrungswirkung = `Die Rolle übernimmt ${fuehrungstyp.toLowerCase()} im Team. Die Führungswirkung entsteht vor allem über Entscheidungsgeschwindigkeit, klare Vorgaben und verbindliche Ergebnisorientierung. Teammitglieder erleben eine direktive Führung, die Tempo vorgibt und Prioritäten setzt. In Situationen mit hohem Handlungsdruck zeigt diese Führungslogik ihre größte Stärke.`;
    } else if (dom.key === "int") {
      fuehrungswirkung = `Die Rolle übernimmt ${fuehrungstyp.toLowerCase()} im Team. Die Führungswirkung entsteht vor allem über Beziehungsgestaltung, Vertrauen und die Fähigkeit, unterschiedliche Perspektiven zusammenzubringen. Teammitglieder orientieren sich an dieser Person bei zwischenmenschlichen Entscheidungen und im Umgang mit anspruchsvollen Situationen.`;
    } else {
      fuehrungswirkung = `Die Rolle übernimmt ${fuehrungstyp.toLowerCase()} im Team. Die Führungswirkung entsteht vor allem über fachliche Expertise, systematische Steuerung und Qualitätssicherung. Teammitglieder vertrauen auf die methodische Kompetenz und die strukturierte Herangehensweise dieser Person.`;
    }
  } else {
    fuehrungswirkung = `Die Rolle hat keine direkte Führungsverantwortung. Die Wirkung im Team entsteht über ${kompShort(dom.key).toLowerCase()} als primären Beitrag. Kolleginnen und Kollegen schätzen die ${kompAdj(dom.key)}e Arbeitsweise und orientieren sich daran bei ${dom.key === "imp" ? "operativen Entscheidungen und Umsetzungsfragen" : dom.key === "int" ? "zwischenmenschlichen Situationen und Teamabstimmungen" : "fachlichen Fragen und Prozessthemen"}.`;
  }

  return fuehrungswirkung;
}

function buildSpannungsfelder(data: ReportData): string[] {
  const { dom, sec, wk, isLeadership, profileType, beruf } = data;
  const fields: string[] = [];

  const hauptTaetigkeiten = (data.taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
  const hochItems = hauptTaetigkeiten.filter((t: any) => t.niveau === "Hoch");

  if (dom.key === "imp") {
    if (hochItems.some((t: any) => t.kompetenz === "Intuitiv" || t.kompetenz === "Analytisch")) {
      fields.push(`${kompShort("imp")} vs. ${hochItems.find((t: any) => t.kompetenz !== "Impulsiv")?.name || "ergänzende Anforderungen"}`);
    }
    fields.push("Tempo und Ergebnisorientierung vs. Sorgfalt und Absicherung");
    if (isLeadership) fields.push("Durchsetzungskraft vs. Mitarbeiterbindung und Teamakzeptanz");
    else fields.push("Eigeninitiative und schnelles Handeln vs. Abstimmung im Team");
  } else if (dom.key === "int") {
    fields.push("Persönliche Beziehungspflege vs. wirtschaftliche Kalkulation");
    fields.push("Individuelle Beratung und Empathie vs. Zeitdruck und Effizienz");
    if (isLeadership) fields.push("Konsensorientierung vs. klare Entscheidungen unter Zeitdruck");
    else fields.push("Teamorientierung vs. eigenverantwortliches Handeln");
  } else {
    fields.push("Gründlichkeit und Qualitätsanspruch vs. Pragmatismus und Geschwindigkeit");
    fields.push("Kontrolle und Standards vs. Flexibilität und Anpassung");
    if (isLeadership) fields.push("Detailsteuerung vs. strategischer Überblick und Delegation");
    else fields.push("Systematische Arbeitsweise vs. kreative Lösungsansätze");
  }

  if (profileType.startsWith("hybrid_")) {
    fields.push(`${dom.label} und ${sec.label} als gleichwertige Anforderungen – Prioritätenkonflikt`);
  }

  if (wk.key === "imp") fields.push("Reflexion und Gründlichkeit vs. Handlungsdruck");
  else if (wk.key === "int") fields.push("Sachliche Korrektheit vs. Beziehungspflege");
  else fields.push("Intuition und Gespür vs. Strukturbedarf");

  return fields;
}

function buildFehlbesetzung(data: ReportData): { label: string; bullets: string[] }[] {
  const { dom, sec, wk, isLeadership } = data;
  const risks: { label: string; bullets: string[] }[] = [];

  if (dom.key === "imp" || dom.value >= 45) {
    risks.push({
      label: `Wenn zu stark ${kompAdj("imp")} gearbeitet wird`,
      bullets: [
        dom.key === "int" ? "Beratung wird hektischer, Gesprächsqualität sinkt" : "Entscheidungen werden zu schnell und ohne Absicherung getroffen",
        isLeadership ? "Das Team kann das Tempo nicht mithalten, Frustration entsteht" : "Abstimmung mit Kolleginnen und Kollegen leidet",
        dom.key === "int" ? "Kunden und Gesprächspartner fühlen sich weniger individuell betreut" : "Prozessfehler und Qualitätsprobleme nehmen zu",
      ],
    });
  }

  if (dom.key === "ana" || wk.key === "int") {
    risks.push({
      label: `Wenn zu stark ${kompAdj("ana")} gearbeitet wird`,
      bullets: [
        dom.key === "int" ? "Beratung wirkt distanzierter und unpersönlich" : "Überanalyse bremst Entscheidungen und Umsetzung",
        "Zwischenmenschliche Signale werden übersehen oder ignoriert",
        isLeadership ? "Teammitglieder fühlen sich kontrolliert statt geführt" : "Zusammenarbeit wird als starr und unflexibel empfunden",
      ],
    });
  }

  if (wk.key === "ana" || (dom.key === "int" && sec.key === "imp")) {
    risks.push({
      label: "Wenn Beziehung wichtiger wird als Struktur",
      bullets: [
        "Wirtschaftliche und prozessuale Aspekte werden vernachlässigt",
        "Abläufe verlieren an Klarheit und Verbindlichkeit",
        isLeadership ? "Standards werden zugunsten von Harmonie aufgeweicht" : "Dokumentation und Nachvollziehbarkeit leiden",
      ],
    });
  }

  if (wk.key === "imp") {
    risks.push({
      label: "Wenn Umsetzung zu langsam wird",
      bullets: [
        "Entscheidungen werden aufgeschoben oder zu lange abgewogen",
        "Chancen werden verpasst, weil die Reaktionsgeschwindigkeit fehlt",
        isLeadership ? "Das Team wartet auf klare Ansagen, die ausbleiben" : "Wichtige Aufgaben werden nicht rechtzeitig priorisiert",
      ],
    });
  }

  return risks.slice(0, 3);
}

function buildFazit(data: ReportData): { kernsatz: string; persoenlichkeit: string[] } {
  const { dom, sec, wk, beruf, isLeadership, taetigkeiten, profileType } = data;
  const hoch = (taetigkeiten || []).filter((t: any) => t.niveau === "Hoch");

  let kernsatz: string;
  if (profileType === "balanced_all") {
    kernsatz = `Die Rolle ${beruf} funktioniert am stabilsten mit einer Persönlichkeit, die alle drei Kompetenzbereiche auf solidem Niveau mitbringt und situativ zwischen verschiedenen Arbeitslogiken wechseln kann.`;
  } else {
    kernsatz = `Die Rolle ${beruf} funktioniert am stabilsten mit einer Persönlichkeit, die:`;
  }

  const points: string[] = [];
  if (dom.key === "int") {
    points.push("Menschen schnell versteht und Vertrauen aufbaut");
  } else if (dom.key === "imp") {
    points.push("schnell entscheidet und konsequent umsetzt");
  } else {
    points.push("systematisch denkt und strukturiert arbeitet");
  }

  if (sec.key === "ana") points.push("gleichzeitig strukturiert arbeitet und Qualität sichert");
  else if (sec.key === "int") points.push("gleichzeitig Beziehungen pflegt und das Team mitnimmt");
  else points.push("gleichzeitig handlungsfähig bleibt und Tempo hält");

  points.push("auch unter Druck ruhig und klar bleibt");

  if (hoch.length > 0) {
    points.push(`die kritischen Anforderungen (${hoch.slice(0, 3).map((t: any) => t.name).join(", ")}) auf hohem Niveau erfüllt`);
  }

  if (isLeadership) {
    points.push(`Führungswirkung über ${kompShort(dom.key).toLowerCase()} entfaltet und dabei das Team mitnimmt`);
  }

  return { kernsatz, persoenlichkeit: points };
}

const MAX_BIO = 67;

function ProfileBar({ label, value, color }: { label: string; value: number; color: string }) {
  const widthPct = (value / MAX_BIO) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{
          width: value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 5), 100)}%`,
          height: "100%", borderRadius: 8, background: color,
          display: "flex", alignItems: "center", paddingLeft: 10,
          minWidth: value === 0 ? 0 : 44,
          transition: "width 300ms ease",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>
        </div>
      </div>
    </div>
  );
}

export default function Rollenprofil() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ReportData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("rollenDnaCompleted");
    if (completed !== "true") return;
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const taetigkeiten = state.taetigkeiten || [];
      const hauptItems = taetigkeiten.filter((t: any) => t.kategorie === "haupt");
      const nebenItems = taetigkeiten.filter((t: any) => t.kategorie === "neben");
      const fuehrungItems = taetigkeiten.filter((t: any) => t.kategorie === "fuehrung");

      let haupt = state.bioGramHaupt;
      let neben = state.bioGramNeben;
      let fuehrung = state.bioGramFuehrung;
      let rahmen = state.bioGramRahmen;
      if (!haupt) haupt = calcBioGram(hauptItems);
      if (!neben) neben = calcBioGram(nebenItems);
      if (!fuehrung) fuehrung = calcBioGram(fuehrungItems);
      if (!rahmen) rahmen = computeRahmen(state);

      const gesamt = state.bioGramGesamt || computeGesamt(haupt, neben, fuehrung, rahmen);
      const beruf = state.beruf || "Unbekannte Rolle";
      const bereich = BERUFE[beruf] || state.bereich || "";
      const fuehrungstyp = state.fuehrung || "Keine";
      const isLeadership = fuehrungstyp !== "Keine";
      const aufgabencharakter = state.aufgabencharakter || "";
      const arbeitslogik = state.arbeitslogik || "";
      const erfolgsfokusIndices = state.erfolgsfokusIndices || [];
      const { type: profileType, intensity } = classifyProfile(gesamt);
      const dom = dominant(gesamt);
      const sec = secondary(gesamt);
      const wk = weakest(gesamt);

      setData({
        beruf, bereich, isLeadership, fuehrungstyp, aufgabencharakter, arbeitslogik,
        gesamt, haupt, neben, fuehrung, rahmen, profileType, intensity,
        dom, sec, wk, taetigkeiten, erfolgsfokusIndices,
      });
    } catch {}
  }, []);

  const handlePDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 10;
      let remaining = imgH;
      const usableH = pageH - 20;
      let page = 0;
      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, y - (page * usableH), imgW, imgH);
        remaining -= usableH;
        page++;
        y = 10;
      }
      pdf.save(`Rollen-DNA_${data?.beruf || "Bericht"}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }}>
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 24, padding: "48px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
            <AlertTriangle style={{ width: 40, height: 40, color: "#FF9500", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Keine Rollen-DNA vorhanden</h2>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: "0 0 24px", lineHeight: 1.6 }}>
              Bitte erstellen Sie zuerst eine Rollen-DNA, um den Bericht generieren zu können.
            </p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              data-testid="button-go-rollen-dna"
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: "#0071E3", color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Rollen-DNA erstellen
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stress = buildStressTexts(data.gesamt);
  const teamwirkung = buildTeamwirkung(data);
  const spannungsfelder = buildSpannungsfelder(data);
  const fehlbesetzung = buildFehlbesetzung(data);
  const fazit = buildFazit(data);

  const hauptTaetigkeiten = (data.taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
  const hochItems = hauptTaetigkeiten.filter((t: any) => t.niveau === "Hoch");
  const erfolgsfokusLabels = data.erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);

  const rollenBeschreibung = (() => {
    if (data.dom.key === "int") {
      return `Die Rolle wirkt vor allem über ${data.isLeadership ? "Führung durch Beziehungsgestaltung, " : ""}Kommunikation und persönliche Interaktion. Gleichzeitig braucht sie ${data.sec.key === "ana" ? "eine strukturierte Arbeitsweise, um Abläufe und wirtschaftliche Aspekte stabil zu steuern" : "Durchsetzungsfähigkeit, um Entscheidungen konsequent umzusetzen"}.`;
    } else if (data.dom.key === "imp") {
      return `Die Rolle wirkt vor allem über ${data.isLeadership ? "zielgerichtete Führung, " : ""}schnelle Entscheidungen und konsequente Umsetzung. Gleichzeitig braucht sie ${data.sec.key === "int" ? "die Fähigkeit, Beziehungen aufzubauen und das Team einzubinden" : "analytische Sorgfalt, um Qualität und Nachhaltigkeit sicherzustellen"}.`;
    } else {
      return `Die Rolle wirkt vor allem über ${data.isLeadership ? "methodische Führung, " : ""}systematisches Arbeiten und fundierte Analysen. Gleichzeitig braucht sie ${data.sec.key === "int" ? "Empathie und Kommunikationsfähigkeit, um Ergebnisse im Team zu verankern" : "Handlungsfähigkeit, um Erkenntnisse in konkrete Maßnahmen umzusetzen"}.`;
    }
  })();

  const arbeitslogikText = (() => {
    if (data.dom.key === "int") {
      return `Im Alltag entsteht Wirkung vor allem im direkten Kontakt – ${data.isLeadership ? "mit dem Team, Stakeholdern und Entscheidungsträgern" : "mit Kolleginnen und Kollegen, Kundinnen und Kunden oder Gesprächspartnern"}. Entscheidungen werden häufig situativ getroffen, gleichzeitig braucht es die Fähigkeit, ${data.sec.key === "ana" ? "Abläufe zu strukturieren und Prioritäten zu setzen" : "schnell zu handeln und Ergebnisse zu liefern"}.`;
    } else if (data.dom.key === "imp") {
      return `Im Alltag entsteht Wirkung vor allem über schnelle Umsetzung und klare Priorisierung. ${data.isLeadership ? "Als Führungskraft gibt diese Person das Tempo vor und treibt Ergebnisse." : "Die Person treibt Themen eigenständig voran."} Entscheidungen werden zügig getroffen, ${data.sec.key === "int" ? "ohne dabei den Blick für das Team und die Beziehungsebene zu verlieren" : "abgesichert durch analytische Prüfung und Datengrundlage"}.`;
    } else {
      return `Im Alltag entsteht Wirkung über systematische Analyse, klare Prozesse und fundierte Entscheidungsgrundlagen. ${data.isLeadership ? "Als Führungskraft setzt diese Person auf Qualitätsstandards und nachvollziehbare Steuerung." : "Die Person überzeugt durch fachliche Tiefe und methodische Genauigkeit."} ${data.sec.key === "int" ? "Die ergänzende Beziehungsfähigkeit sorgt dafür, dass Erkenntnisse im Team ankommen." : "Die ergänzende Handlungsorientierung sorgt dafür, dass Analysen auch in Umsetzung münden."}`;
    }
  })();

  const alltagsverhalten = (() => {
    const hochNamen = hochItems.slice(0, 3).map((t: any) => t.name);
    if (data.dom.key === "int") {
      return `Die Rolle zeigt ihre Stärke vor allem in ${hochNamen.length > 0 ? hochNamen.join(", ") : "der persönlichen Interaktion und Beziehungsgestaltung"}. ${data.isLeadership ? "Die Führungskraft" : "Die Person"} baut Vertrauen auf, versteht Bedürfnisse schnell und schafft ein Arbeitsumfeld, in dem sich Menschen gehört fühlen. Gleichzeitig erfordert die Rolle ${data.sec.key === "ana" ? "eine strukturierte Organisation von Abläufen, Dokumentation und Standards" : "die Fähigkeit, Tempo zu machen und Entscheidungen durchzusetzen"}.`;
    } else if (data.dom.key === "imp") {
      return `Die Rolle zeigt ihre Stärke vor allem in ${hochNamen.length > 0 ? hochNamen.join(", ") : "schneller Entscheidungsfindung und konsequenter Umsetzung"}. ${data.isLeadership ? "Die Führungskraft" : "Die Person"} priorisiert klar, treibt Ergebnisse voran und bleibt auch bei Widerständen handlungsfähig. Gleichzeitig erfordert die Rolle ${data.sec.key === "int" ? "Sensibilität im Umgang mit dem Team und die Pflege wichtiger Beziehungen" : "analytische Sorgfalt, um Fehlentscheidungen zu vermeiden"}.`;
    } else {
      return `Die Rolle zeigt ihre Stärke vor allem in ${hochNamen.length > 0 ? hochNamen.join(", ") : "systematischer Analyse und fundierter Entscheidungsfindung"}. ${data.isLeadership ? "Die Führungskraft" : "Die Person"} arbeitet methodisch, dokumentiert sauber und sichert Qualität. Gleichzeitig erfordert die Rolle ${data.sec.key === "int" ? "Empathie und Kommunikationsgeschick, um fachliche Erkenntnisse verständlich zu vermitteln" : "die Bereitschaft, schnell zu entscheiden und auch bei unvollständiger Datenlage zu handeln"}.`;
    }
  })();

  const strukturprofilText = (() => {
    if (data.profileType === "balanced_all") {
      return "Die Rolle zeigt eine ausgeglichene Verteilung aller drei Kompetenzbereiche. Keine einzelne Steuerungslogik dominiert – die Rolle erfordert ständiges situatives Umschalten zwischen Handlungsorientierung, Beziehungsgestaltung und analytischem Denken.";
    }
    if (data.profileType.startsWith("hybrid_")) {
      return `Die Rolle wird gleichzeitig durch ${data.dom.label} und ${data.sec.label} getragen. Beide Arbeitslogiken sind nahezu gleichauf und prägen die Rollenanforderung gemeinsam. ${data.wk.label} spielt eine ergänzende, aber deutlich nachrangige Rolle.`;
    }
    const adj = data.intensity === "strong" ? "klar dominiert" : data.intensity === "clear" ? "deutlich geprägt" : "erkennbar ausgerichtet";
    return `Die Rolle wird hauptsächlich über ${kompShort(data.dom.key).toLowerCase()} getragen. Das Profil ist ${adj} durch die ${data.dom.label.toLowerCase()}e Komponente. ${kompShort(data.sec.key)} sorgt für Stabilität bei Entscheidungen und Abläufen.`;
  })();

  const abschlussText = `Diese Kombination sichert ${data.dom.key === "int" ? "Beziehungsqualität, " : data.dom.key === "imp" ? "Ergebnisorientierung, " : "Prozessqualität, "}${data.sec.key === "ana" ? "wirtschaftliche Stabilität" : data.sec.key === "int" ? "Teamzusammenhalt" : "Umsetzungsgeschwindigkeit"} und ${data.isLeadership ? "Führungswirksamkeit" : "eigenverantwortliches Arbeiten"}.`;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }} lang="de">
      <GlobalNav rightSlot={
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          data-testid="button-pdf-export"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10,
            background: pdfLoading ? "rgba(0,113,227,0.04)" : "rgba(0,113,227,0.08)",
            border: "none", cursor: pdfLoading ? "default" : "pointer",
            fontSize: 13, fontWeight: 600, color: "#0071E3",
            transition: "all 200ms ease",
          }}
        >
          <Download style={{ width: 14, height: 14 }} />
          {pdfLoading ? "Wird erstellt..." : "PDF"}
        </button>
      } />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 80px" }}>
        <div ref={reportRef} style={{
          background: "#FFFFFF",
          borderRadius: 4,
          padding: "48px 44px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}>

          {/* ── HEADER ── */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#0071E3", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>bioLogic Strukturanalyse</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1D1D1F", margin: "0 0 6px", letterSpacing: "-0.025em" }} data-testid="text-report-title">
              Rollen-DNA: {data.beruf}
            </h1>
            {data.bereich && (
              <p style={{ fontSize: 13, color: "#8E8E93", margin: 0, fontWeight: 500 }}>{data.bereich}</p>
            )}
            <div style={{ width: 48, height: 3, background: "#0071E3", borderRadius: 2, margin: "20px auto 0" }} />
          </div>

          {/* ── SEITE 1: ROLLEN-DNA ── */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" }} data-testid="section-1-title">
              Seite 1 – Rollen-DNA · die Entscheidungsgrundlage
            </h2>

            <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>Welche Persönlichkeit braucht diese Rolle?</p>

            {/* 1. Kurzbeschreibung */}
            <div style={{ marginTop: 24, marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>1. Kurzbeschreibung der Rolle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(rollenBeschreibung)}
              </p>
            </div>

            {/* 2. Strukturprofil */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>2. Strukturprofil der Rolle</p>
              <div style={{ maxWidth: 400, marginBottom: 14 }}>
                <ProfileBar label="Impulsiv" value={data.gesamt.imp} color={COLORS.imp} />
                <div style={{ height: 8 }} />
                <ProfileBar label="Intuitiv" value={data.gesamt.int} color={COLORS.int} />
                <div style={{ height: 8 }} />
                <ProfileBar label="Analytisch" value={data.gesamt.ana} color={COLORS.ana} />
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(strukturprofilText)}
              </p>
            </div>

            {/* 3. Arbeitslogik */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>3. Arbeitslogik der Rolle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(arbeitslogikText)}
              </p>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 0 40px" }} />

          {/* ── SEITE 2: VERHALTEN ── */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" }} data-testid="section-2-title">
              Seite 2 – Verhalten der Rolle · Alltag + Stress
            </h2>

            {/* Verhalten im Alltag */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Verhalten im Alltag</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(alltagsverhalten)}
              </p>
            </div>

            {/* Verhalten unter Druck */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Verhalten unter Druck</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(stress.controlled)}
              </p>
            </div>

            {/* Verhalten bei starkem Stress */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Verhalten bei starkem Stress</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(stress.uncontrolled)}
              </p>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 0 40px" }} />

          {/* ── SEITE 3: TEAMWIRKUNG & RISIKEN ── */}
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" }} data-testid="section-3-title">
              Seite 3 – Teamwirkung und Fehlbesetzungsrisiken
            </h2>

            {/* Führungswirkung / Teamwirkung */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>
                {data.isLeadership ? "Führungswirkung der Rolle" : "Teamwirkung der Rolle"}
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(teamwirkung)}
              </p>
            </div>

            {/* Spannungsfelder */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Spannungsfelder der Rolle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, margin: "0 0 12px" }}>
                Typische Spannungen dieser Rolle sind:
              </p>
              <div style={{ paddingLeft: 4 }}>
                {spannungsfelder.map((sf, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D1D1F", marginTop: 8, flexShrink: 0, opacity: 0.4 }} />
                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{sf}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "12px 0 0", textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(`Die Person muss diese Gegensätze situativ ausbalancieren, ohne dabei die Kernstärke – ${kompShort(data.dom.key)} – aus den Augen zu verlieren.`)}
              </p>
            </div>

            {/* Fehlbesetzungsrisiken */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>Fehlbesetzungsrisiken</p>
              {fehlbesetzung.map((risk, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#3A3A3C", margin: "0 0 8px", fontStyle: "italic" }}>{risk.label}</p>
                  <div style={{ paddingLeft: 4 }}>
                    {risk.bullets.map((b, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF3B30", marginTop: 8, flexShrink: 0, opacity: 0.5 }} />
                        <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Entscheidungsfazit */}
            <div style={{
              marginTop: 32, padding: "24px 28px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(0,113,227,0.02))",
              border: "1px solid rgba(0,113,227,0.1)",
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>Entscheidungsfazit</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 14px", textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {hyphenateText(fazit.kernsatz)}
              </p>
              <div style={{ paddingLeft: 4 }}>
                {fazit.persoenlichkeit.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <CheckCircle style={{ width: 16, height: 16, color: "#34C759", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{p}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "14px 0 0", textAlign: "justify", textAlignLast: "left" as any, fontWeight: 500 }} lang="de">
                {hyphenateText(abschlussText)}
              </p>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#C7C7CC", margin: 0, letterSpacing: "0.02em" }}>
              bioLogic RoleDynamics · Strukturanalyse · Erstellt am {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
