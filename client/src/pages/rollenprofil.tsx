import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Sun, Gauge, Flame, Printer } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRegion, useLocalizedText } from "@/lib/region";
import { BERUFE } from "@/data/berufe";
import logoSrc from "@assets/LOGO_bio_1773853681939.png";
import { generateJobCheckRoleReport, getForbiddenPhrases, type SuccessFocusKey, type ComponentKey, type JobCheckReportTexts } from "@/lib/entscheidungsbericht-engine";
import { REPORT_INTRO_DISCLAIMER, REPORT_INTRO_DISCLAIMER_EN, REPORT_LABELS } from "@/lib/report-texts";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

const cleanTaskName = (n: string) => n.replace(/\.\s*$/, "").replace(/,\s*$/, "");

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
  const gap1 = max.value - second.value;
  const gap2 = second.value - third.value;

  const isExtreme = max.value >= 60 || gap1 >= 18;
  const isClear = gap1 >= 8;
  const isDual = gap1 <= 4 && gap2 >= 6;
  const isFullBal = gap1 <= 5 && gap2 <= 5;
  const isBalTendency = gap1 <= 7 && gap2 <= 7 && max.value > second.value;

  if (isExtreme) return { type: `strong_${max.key}` as ProfileType, intensity: "strong" };
  if (isDual) {
    const k1 = max.key, k2 = second.key;
    const hybridKey = `hybrid_${k1}_${k2}`;
    const validHybrids = ["hybrid_imp_ana", "hybrid_ana_int", "hybrid_imp_int"];
    const reverseMap: Record<string, string> = { "hybrid_ana_imp": "hybrid_imp_ana", "hybrid_int_ana": "hybrid_ana_int", "hybrid_int_imp": "hybrid_imp_int" };
    const resolved = validHybrids.includes(hybridKey) ? hybridKey : (reverseMap[hybridKey] || "hybrid_imp_ana");
    const hybridIntensity: Intensity = gap2 >= 15 ? "strong" : gap2 >= 8 ? "clear" : "light";
    return { type: resolved as ProfileType, intensity: hybridIntensity };
  }
  if (isClear) return { type: `dominant_${max.key}` as ProfileType, intensity: "clear" };
  if (isFullBal) return { type: "balanced_all", intensity: "balanced" };
  if (isBalTendency) return { type: `light_${max.key}` as ProfileType, intensity: "light" };
  return { type: "balanced_all", intensity: "balanced" };
}

const SORT_PRIORITY: Record<string, number> = { imp: 0, int: 1, ana: 2 };

function sortedTriad(bg: BG) {
  return [
    { key: "imp" as const, label: region === "EN" ? "Impulsive" : "Impulsiv", value: bg.imp },
    { key: "int" as const, label: region === "EN" ? "Intuitive" : "Intuitiv", value: bg.int },
    { key: "ana" as const, label: region === "EN" ? "Analytical" : "Analytisch", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
}

function dominant(bg: BG) { return sortedTriad(bg)[0]; }
function secondary(bg: BG) { return sortedTriad(bg)[1]; }
function weakest(bg: BG) { return sortedTriad(bg)[2]; }

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

function buildProfilkonflikt(data: ReportData, lang: "de" | "en" = "de"): string | null {
  const hauptDom = dominant(data.haupt);
  const { dom } = data;
  if (hauptDom.key === dom.key) return null;
  if (lang === "en") {
    const hauptBehavior = hauptDom.key === "imp" ? "fast action and execution" : hauptDom.key === "int" ? "personal contact and relationship work" : "structured analysis and diligence";
    const gesamtBehavior = dom.key === "imp" ? "decisiveness and pace" : dom.key === "int" ? "relationship building and communication" : "methodical work and quality assurance";
    return `Note: The core tasks of this role primarily call for ${hauptBehavior}. The overall profile, however, shifts towards ${gesamtBehavior}. Framework conditions and additional requirements change the demand profile. During the hiring process, it should be checked whether the candidate can primarily cover the core tasks or the full package.`;
  }
  const hauptBehavior = hauptDom.key === "imp" ? "schnelles Handeln und Umsetzung" : hauptDom.key === "int" ? "persönlichen Kontakt und Beziehungsarbeit" : "strukturierte Analyse und Sorgfalt";
  const gesamtBehavior = dom.key === "imp" ? "Entscheidungskraft und Tempo" : dom.key === "int" ? "Beziehungsgestaltung und Kommunikation" : "methodisches Arbeiten und Qualitätssicherung";
  return `Hinweis: Die Kerntätigkeiten der Stelle verlangen vor allem ${hauptBehavior}. Das Gesamtprofil verschiebt sich jedoch in Richtung ${gesamtBehavior}. Rahmenbedingungen und ergänzende Anforderungen verändern das Anforderungsprofil. Im Besetzungsprozess sollte geprüft werden, ob die Person primär die Kerntätigkeiten oder das Gesamtpaket abbilden kann.`;
}


function makeCircleDataUrl(
  text: string,
  size: number,
  bgColor: string,
  textColor: string,
  fontSize: number,
  fontWeight: number = 800,
  shadow: boolean = false,
): string {
  const scale = 4;
  const s = size * scale;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 3 * scale;
    ctx.shadowOffsetY = 1 * scale;
  }
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - (shadow ? 2 * scale : 0), 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.font = `${fontWeight} ${fontSize * scale}px Inter, Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  const textH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const yPos = s / 2 + textH / 2 - m.actualBoundingBoxDescent;
  ctx.fillText(text, s / 2, yPos);
  return c.toDataURL("image/png");
}

const MAX_BIO = 67;

function ProfileBar({ label, value, color }: { label: string; value: number; color: string }) {
  const widthPct = (value / MAX_BIO) * 100;
  return (
    <div data-profile-bar style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0, fontWeight: 500, lineHeight: "30px", height: 30 }}>{label}</span>
      <div style={{ flex: 1, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.04)", position: "relative" }}>
        <div style={{
          width: value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 5), 100)}%`,
          height: 30, borderRadius: 8, background: color,
          paddingLeft: 10,
          minWidth: value === 0 ? 0 : (widthPct < 18 ? 8 : 44),
          transition: "width 300ms ease",
        }}>
          {widthPct >= 18 && <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", lineHeight: "30px", height: 30, display: "inline-block" }}>{Math.round(value)} %</span>}
        </div>
        {widthPct < 18 && <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 5), 100)}% + 16px)`, fontSize: 12, fontWeight: 700, color: "#48484A", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>}
      </div>
    </div>
  );
}

export default function Rollenprofil() {
  const [, setLocation] = useLocation();
  const { region } = useRegion();
  const t = useLocalizedText();
  const L = REPORT_LABELS[region === "EN" ? "en" : "de"];
  const isMobile = useIsMobile();
  const [data, setData] = useState<ReportData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [kandidatenText, setKandidatenText] = useState<string | null>(null);
  const [kandidatenLoading, setKandidatenLoading] = useState(false);
  const [kandidatenError, setKandidatenError] = useState(false);

  useEffect(() => {
    setKandidatenText(null);
    setKandidatenError(false);
    setKandidatenLoading(false);
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
      const beruf = state.beruf || "Unbekannte Stelle";
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

      const newData = {
        beruf, bereich, isLeadership, fuehrungstyp, aufgabencharakter, arbeitslogik,
        gesamt, haupt, neben, fuehrung, rahmen, profileType, intensity,
        dom, sec, wk, taetigkeiten, erfolgsfokusIndices,
      };
      setData(newData);

      const hauptNamen = (taetigkeiten || [])
        .filter((t: any) => t.kategorie === "haupt")
        .map((t: any) => t.name)
        .sort()
        .join(",");
      const cacheKey = `kandidatenProfil_v2_${region}_${beruf}_${bereich}_${fuehrungstyp}_${hauptNamen.slice(0, 200)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setKandidatenText(cached);
      } else {
        setKandidatenLoading(true);
        fetch("/api/generate-kandidatenprofil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beruf, bereich, taetigkeiten,
            fuehrungstyp, aufgabencharakter, arbeitslogik, region,
          }),
        })
          .then(r => {
            if (!r.ok) throw new Error("API error");
            return r.json();
          })
          .then(json => {
            if (json.text) {
              setKandidatenText(json.text);
              try { localStorage.setItem(cacheKey, json.text); } catch {}
            } else {
              setKandidatenError(true);
            }
          })
          .catch(() => setKandidatenError(true))
          .finally(() => setKandidatenLoading(false));
      }
    } catch {}
  }, [region]);

  const handlePDF = async () => {
    if (!data || !reportRef.current) return;
    setPdfLoading(true);
    let clone: HTMLElement | null = null;
    let pdfBtn: HTMLElement | null = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const source = reportRef.current;
      pdfBtn = source.querySelector("[data-testid='button-pdf-export']") as HTMLElement | null;
      if (pdfBtn) pdfBtn.style.display = "none";

      clone = source.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = "794px";
      clone.style.borderRadius = "0";
      clone.style.boxShadow = "none";
      clone.style.overflow = "visible";
      document.body.appendChild(clone);

      const allTextEls = clone.querySelectorAll<HTMLElement>("p, span, li, div");
      allTextEls.forEach(el => {
        if (el.closest("[data-profile-bar]")) return;
        el.style.hyphens = "none";
        (el.style as any).WebkitHyphens = "none";
        el.style.wordBreak = "normal";
        el.style.overflowWrap = "break-word";
        el.style.textAlign = "left";
      });

      clone.querySelectorAll<HTMLElement>(".bio-section-head").forEach(sh => {
        const img = sh.querySelector("img");
        if (img) img.remove();
        sh.style.justifyContent = "flex-start";
        sh.style.gap = "0";
      });
      clone.querySelectorAll<HTMLElement>("[data-subhead-circle]").forEach(el => el.remove());
      clone.querySelectorAll<HTMLElement>("[data-subhead-line]").forEach(el => el.remove());

      const A4_W = 595.28;
      const A4_H = 841.89;
      const TOP_MARGIN_PT = 28.35;
      const pxWidth = 794;
      const usablePageH = A4_H - TOP_MARGIN_PT;
      const pxPageH = Math.floor((usablePageH / A4_W) * pxWidth);

      const cloneTop = clone.getBoundingClientRect().top;
      const allBlocks = clone.querySelectorAll<HTMLElement>("[data-pdf-block]");
      const breakPoints: number[] = [0];
      allBlocks.forEach(b => {
        const r = b.getBoundingClientRect();
        const top = r.top - cloneTop;
        const bottom = r.bottom - cloneTop;
        if (top > 0) breakPoints.push(top);
        if (bottom > 0) breakPoints.push(bottom);
      });
      breakPoints.sort((a, b) => a - b);

      const contentH = clone.scrollHeight;
      const scale = contentH > 8000 ? 1.5 : 2;

      const canvas = await html2canvas(clone, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#FFFFFF",
        width: pxWidth,
        windowWidth: pxWidth,
      });

      document.body.removeChild(clone);
      clone = null;
      if (pdfBtn) { pdfBtn.style.display = ""; pdfBtn = null; }

      const totalH = canvas.height / scale;
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageCuts: number[] = [0];
      let cursor = 0;
      while (cursor < totalH) {
        const ideal = cursor + pxPageH;
        if (ideal >= totalH) {
          pageCuts.push(totalH);
          break;
        }
        let bestCut = ideal;
        for (let i = breakPoints.length - 1; i >= 0; i--) {
          if (breakPoints[i] <= ideal && breakPoints[i] > cursor + pxPageH * 0.3) {
            bestCut = breakPoints[i];
            break;
          }
        }
        pageCuts.push(bestCut);
        cursor = bestCut;
      }

      for (let p = 0; p < pageCuts.length - 1; p++) {
        if (p > 0) doc.addPage();
        const yStart = pageCuts[p];
        const sliceH = pageCuts[p + 1] - yStart;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = pxWidth * scale;
        pageCanvas.height = sliceH * scale;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, yStart * scale,
          pxWidth * scale, sliceH * scale,
          0, 0,
          pxWidth * scale, sliceH * scale
        );

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.92);
        const imgW = A4_W;
        const imgH = (sliceH / pxWidth) * A4_W;
        doc.addImage(imgData, "JPEG", 0, TOP_MARGIN_PT, imgW, imgH);
      }

      const safeName = (data.beruf || "Bericht").replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_");
      doc.save(`Stellenprofil_${safeName}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert("PDF-Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      if (pdfBtn) pdfBtn.style.display = "";
      setPdfLoading(false);
    }
  };

  const sectionCircleUrls = useMemo(() => ({
    1: makeCircleDataUrl("01", 28, "rgba(255,255,255,0.95)", "#343A48", 12, 800, true),
    2: makeCircleDataUrl("02", 28, "rgba(255,255,255,0.95)", "#343A48", 12, 800, true),
    3: makeCircleDataUrl("03", 28, "rgba(255,255,255,0.95)", "#343A48", 12, 800, true),
    4: makeCircleDataUrl("04", 28, "rgba(255,255,255,0.95)", "#343A48", 12, 800, true),
  }), []);

  const subCircleCache = useRef<Record<string, string>>({});

  // Engine-Berechnung defensiv (auch ohne data, damit Hook-Reihenfolge stabil bleibt)
  const FOKUS_TO_KEY_PRE: Record<number, ComponentKey> = {
    0: "imp", 1: "int", 2: "imp", 3: "ana", 4: "ana", 5: "int",
  };
  const preEngineInput = useMemo(() => {
    if (!data) return null;
    const haupt = (data.taetigkeiten || []).filter((x: any) => x.kategorie === "haupt");
    const top = haupt.slice(0, 3).map((x: any) => cleanTaskName(x.name));
    const focusIdx: number[] = data.erfolgsfokusIndices || [];
    const focusKey: SuccessFocusKey = focusIdx.length > 0 ? (FOKUS_TO_KEY_PRE[focusIdx[0]] ?? null) : null;
    return {
      jobTitle: data.beruf,
      tasks: top,
      triad: { imp: Math.round(data.gesamt.imp), int: Math.round(data.gesamt.int), ana: Math.round(data.gesamt.ana) },
      successFocus: focusKey,
      environment: {
        taskCharacter: data.aufgabencharakter || null,
        workLogic: data.arbeitslogik || null,
        leadershipType: data.isLeadership ? data.fuehrungstyp : null,
      },
    };
  }, [data]);

  const preEngineReport = useMemo(
    () => preEngineInput ? generateJobCheckRoleReport(preEngineInput) : null,
    [preEngineInput]
  );

  const narrativePayload = useMemo(() => {
    if (!preEngineInput || !preEngineReport) return null;
    return {
      jobTitle: preEngineInput.jobTitle,
      tasks: preEngineInput.tasks,
      triad: preEngineInput.triad,
      successFocus: preEngineInput.successFocus,
      environment: preEngineInput.environment,
      meta: preEngineReport.meta,
      forbiddenPhrases: getForbiddenPhrases(preEngineReport.meta.profileClass),
      locale: region === "EN" ? "en" : "de",
    };
  }, [preEngineInput, preEngineReport, region]);

  const narrativeQuery = useQuery<Partial<JobCheckReportTexts>>({
    queryKey: ["/api/generate-stellenanalyse-text", narrativePayload ? JSON.stringify(narrativePayload) : "none"],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/generate-stellenanalyse-text", narrativePayload);
      return await res.json();
    },
    enabled: !!narrativePayload,
    staleTime: Infinity,
    retry: false,
  });

  if (!data) {
    return (
      <div className="page-gradient-bg">
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 20, padding: "28px 32px", boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <AlertTriangle style={{ width: 40, height: 40, color: "#FF9500", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{L.noProfileTitle}</h2>
            <p style={{ fontSize: 14, color: "#48484A", margin: "0 0 24px", lineHeight: 1.6 }}>
              {L.noProfileBody}
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
              {L.noProfileButton}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Solange die KI-Texte noch nicht da sind, zeigen wir einen Ladebildschirm
  // (statt sofort die alten Engine-Templates zu rendern, was den Eindruck erweckt,
  // es habe sich nichts geändert).
  if (narrativeQuery.isLoading || (narrativeQuery.isFetching && !narrativeQuery.data)) {
    return (
      <div className="page-gradient-bg">
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 18px", border: "3px solid #E5E5E7", borderTopColor: "#0071E3", borderRadius: "50%", animation: "bio-spin 0.9s linear infinite" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }} data-testid="text-report-loading-title">{L.loadingTitle}</h2>
            <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6 }}>
              {L.loadingBody}
            </p>
            <style>{`@keyframes bio-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      </div>
    );
  }

  const hauptTaetigkeiten = (data.taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
  const topTaetigkeiten = hauptTaetigkeiten.slice(0, 3).map((t: any) => cleanTaskName(t.name));

  // Wenn EN gewählt ist, nutzen wir die KI-Übersetzungen für Stellentitel und
  // Aufgaben-Bullets, falls die KI-Antwort sie geliefert hat. Fallback ist der
  // Originaltext, damit nichts leer bleibt.
  const llmAny = (narrativeQuery.data || {}) as any;
  const jobTitleTranslated: string | undefined =
    region === "EN" && typeof llmAny.jobTitleEnglish === "string" && llmAny.jobTitleEnglish.trim()
      ? llmAny.jobTitleEnglish.trim()
      : undefined;
  const tasksTranslated: string[] | undefined =
    region === "EN" && Array.isArray(llmAny.tasksEnglish) && llmAny.tasksEnglish.length > 0
      ? (llmAny.tasksEnglish as string[]).map(s => cleanTaskName(String(s)))
      : undefined;
  const displayBeruf = jobTitleTranslated ?? data.beruf;
  const displayTopTaetigkeiten = tasksTranslated && tasksTranslated.length >= topTaetigkeiten.length
    ? tasksTranslated.slice(0, 3)
    : topTaetigkeiten;
  const profilkonfliktRaw = buildProfilkonflikt(data, region === "EN" ? "en" : "de");
  const profilkonflikt = profilkonfliktRaw ? t(profilkonfliktRaw) : null;

  const engineInput = preEngineInput!;
  const engineReport = preEngineReport!;
  const llm = narrativeQuery.data || {};
  const pick = <K extends keyof JobCheckReportTexts>(key: K): JobCheckReportTexts[K] => {
    const v = (llm as any)[key];
    if (v == null) return engineReport[key];
    if (Array.isArray(v) && v.length === 0) return engineReport[key];
    return v;
  };

  const report: JobCheckReportTexts = {
    meta: engineReport.meta,
    intro: pick("intro"),
    shortDescription: pick("shortDescription"),
    structureProfile: pick("structureProfile"),
    componentMeaning: pick("componentMeaning"),
    workLogic: pick("workLogic"),
    framework: pick("framework"),
    successFocus: pick("successFocus"),
    behaviourDaily: pick("behaviourDaily"),
    behaviourPressure: pick("behaviourPressure"),
    behaviourStress: pick("behaviourStress"),
    teamImpact: pick("teamImpact"),
    tensionFields: pick("tensionFields"),
    miscastRisks: pick("miscastRisks"),
    typicalPerson: pick("typicalPerson"),
    finalDecision: pick("finalDecision"),
  };

  const rollenBeschreibungIntro = t(report.shortDescription);

  const strukturprofilText = t(report.structureProfile);
  const arbeitslogikText = t(report.workLogic);
  const rahmenText = t(report.framework);
  const erfolgsfokusText = t(report.successFocus);
  const alltagsverhalten = t(report.behaviourDaily);
  const stress = { controlled: t(report.behaviourPressure), uncontrolled: t(report.behaviourStress) };
  const teamwirkung = t(report.teamImpact);
  const spannungsfelder = report.tensionFields.map(f => t(f));
  const fehlbesetzung = report.miscastRisks.map(f => ({ label: t(f.label), bullets: f.bullets.map(b => t(b)) }));
  const fazit = { titel: L.section4, absaetze: [t(report.finalDecision)] };

  const COMP_COLORS: Record<string, string> = { imp: COLORS.imp, int: COLORS.int, ana: COLORS.ana };
  const komponentenBedeutung = report.componentMeaning.map(k => ({
    key: k.component,
    label: k.title,
    color: COMP_COLORS[k.component] || COLORS.ana,
    text: t(k.text),
  }));



  const SectionHead = ({ num, title }: { num: number; title: string; color?: string }) => (
    <div className="bio-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginLeft: -44, marginRight: -44, padding: "0 18px", height: 38, background: "linear-gradient(135deg, #343A48 0%, #3d4455 50%, #464f62 100%)", boxShadow: "0 2px 6px rgba(52,58,72,0.3)" }}>
      <img src={sectionCircleUrls[num as keyof typeof sectionCircleUrls]} alt={String(num).padStart(2, "0")} style={{ width: 28, height: 28, flexShrink: 0, display: "block" }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: "38px", height: 38, display: "inline-block" }}>{title}</span>
    </div>
  );

  const SECTION_COLORS = {
    rollenDna: "#0F3A6E",
    verhalten: "#0F3A6E",
    teamwirkung: "#0F3A6E",
    fazit: "#0F3A6E",
  };

  const getSubCircle = (num: number, color: string) => {
    const key = `${num}-${color}`;
    if (!subCircleCache.current[key]) {
      subCircleCache.current[key] = makeCircleDataUrl(String(num), 24, color, "#fff", 11, 800);
    }
    return subCircleCache.current[key];
  };

  const SubHead = ({ num, title, color }: { num?: number; title: string; color: string }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {num != null && (
          <img src={getSubCircle(num, color)} alt={String(num)} data-subhead-circle style={{ width: 24, height: 24, flexShrink: 0 }} />
        )}
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, lineHeight: 1 }}>{title}</p>
      </div>
    </div>
  );

  return (
    <div className="page-gradient-bg" lang={L.pageLang}>
      <GlobalNav />

      <main style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "16px 12px 80px" : "24px 16px 48px" }}>
        <div ref={reportRef} style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

          {/* ── DARK HEADER ── */}
          <div className="report-header" data-testid="bericht-header">

            <img src={logoSrc} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />

            <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const printWin = window.open("", "_blank");
                  if (!printWin) return;
                  const reportEl = reportRef.current;
                  if (!reportEl) return;
                  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                    .map(el => el.outerHTML).join("\n");
                  printWin.document.write(`<!DOCTYPE html><html lang="${L.pageLang}"><head><meta charset="utf-8"><title>${L.title} – ${displayBeruf || L.title}</title>${styles}<style>body{margin:0;padding:20px 0;background:#fff}
.report-header-btn,.report-pdf-btn,.no-print,nav{display:none!important}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
[data-pdf-block]{break-inside:avoid!important}
</style></head><body>${reportEl.outerHTML}</body></html>`);
                  printWin.document.close();
                  setTimeout(() => { printWin.print(); }, 600);
                }}
                data-testid="button-print-stellenprofil"
                className="report-header-btn"
                title={L.printTooltip}
              >
                <Printer style={{ width: 15, height: 15 }} />
                <span>{L.printButton}</span>
              </button>
            </div>

            <div className="report-kicker">{L.kicker}</div>
            <h1 className="report-title" data-testid="text-report-title">{L.title}</h1>
            <div className="report-subtitle">{displayBeruf}</div>
            <div className="report-rings" />
          </div>

          {/* ── BODY ── */}
          <div style={{ padding: "40px 44px 48px" }}>

          {/* ── EINLEITUNG ── */}
          <div style={{ marginBottom: 32 }} data-testid="bericht-section-intro" data-pdf-block>
            {t(report.intro).split("\n\n").slice(0, 2).map((para, i) => (
              <p key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 16px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid={i === 0 ? "text-einleitung" : undefined}>
                {para}
              </p>
            ))}
            <div style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto", MozHyphens: "auto", msHyphens: "auto", overflowWrap: "break-word", wordBreak: "break-word" } as any} lang="de">
                {region === "EN" ? REPORT_INTRO_DISCLAIMER_EN : REPORT_INTRO_DISCLAIMER}
              </p>
            </div>
          </div>

          {/* ── SEITE 1: ROLLEN-DNA ── */}
          <div data-section="struktur" style={{ marginBottom: 40 }} data-testid="bericht-section-gesamtprofil">
            {/* 1. Kurzbeschreibung */}
            <div style={{ marginBottom: 28 }} data-pdf-block>
              <SectionHead num={1} title={L.section1} color={SECTION_COLORS.rollenDna} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{L.section1Headline}</p>
              <div style={{ marginTop: 24 }}>
                <SubHead num={1} title={L.sub1ShortDescription} color={SECTION_COLORS.rollenDna} />
              </div>

              {displayTopTaetigkeiten.length > 0 && (
                <>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: "0 0 8px" }}>
                    {L.coreTasksIntro}
                  </p>
                  <ul style={{ margin: "0 0 14px", paddingLeft: 20, listStyleType: "disc" }}>
                    {displayTopTaetigkeiten.map((t, i) => (
                      <li key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, marginBottom: 3 }}>{t}</li>
                    ))}
                  </ul>
                </>
              )}

              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                {rollenBeschreibungIntro}
              </p>
            </div>

            {/* 2. Strukturprofil */}
            <div style={{ marginBottom: 28 }}>
              <div data-pdf-block>
                <SubHead num={2} title={L.sub2StructureProfile} color={SECTION_COLORS.rollenDna} />
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, fontWeight: 400, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                    {strukturprofilText}
                  </p>
                </div>
              </div>
              <div data-pdf-block>
                <div style={{ padding: "18px 20px", borderRadius: 12, background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: "0 0 16px", fontWeight: 400, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                    {L.structureExplanation}
                    <br /><br />
                    {L.structureExplanation2}
                  </p>
                  <ProfileBar label={L.barLabelImp} value={data.gesamt.imp} color={COLORS.imp} />
                  <div style={{ height: 8 }} />
                  <ProfileBar label={L.barLabelInt} value={data.gesamt.int} color={COLORS.int} />
                  <div style={{ height: 8 }} />
                  <ProfileBar label={L.barLabelAna} value={data.gesamt.ana} color={COLORS.ana} />
                </div>
              </div>
              <div data-pdf-block>
                <div style={{ padding: "18px 20px", borderRadius: 12, background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#48484A", margin: "0 0 12px" }}>{L.componentMeaning}</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {komponentenBedeutung.map((kb, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ flex: 1, padding: "14px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${kb.color}12, ${kb.color}06)`, border: `1px solid ${kb.color}20`, display: "flex", flexDirection: "column" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: kb.color, marginBottom: 8, display: "block" }}>{kb.label}</span>
                            <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang} data-testid={`text-bedeutung-${kb.key}`}>
                              {kb.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {profilkonflikt && (
                <div data-pdf-block style={{
                  marginTop: 14, padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.15)",
                }}>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, fontWeight: 450 }} data-testid="text-profilkonflikt" lang={L.pageLang}>
                    {profilkonflikt}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Arbeitslogik */}
            <div style={{ marginBottom: 28 }} data-pdf-block>
              <SubHead num={3} title={L.sub3WorkLogic} color={SECTION_COLORS.rollenDna} />
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                {arbeitslogikText}
              </p>
            </div>

            {/* 4. Rahmenbedingungen */}
            {rahmenText && (
              <div style={{ marginBottom: 28 }} data-testid="bericht-section-rahmen" data-pdf-block>
                <SubHead num={4} title={L.sub4Framework} color={SECTION_COLORS.rollenDna} />
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang} data-testid="text-rahmenbedingungen">
                  {rahmenText}
                </p>
              </div>
            )}

            {/* 5. Erfolgsfokus */}
            {erfolgsfokusText && (
              <div style={{ marginBottom: 0 }} data-testid="bericht-section-kompetenz" data-pdf-block>
                <SubHead num={rahmenText ? 5 : 4} title={L.successFocusLabel} color={SECTION_COLORS.rollenDna} />
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang} data-testid="text-erfolgsfokus">
                  {erfolgsfokusText}
                </p>
              </div>
            )}
          </div>

          {/* ── SEITE 2: VERHALTEN ── */}
          <div data-section="position" style={{ marginBottom: 40 }} data-testid="bericht-section-struktur">
            {/* Verhalten im Alltag */}
            <div style={{ marginBottom: 20 }} data-pdf-block>
              <SectionHead num={2} title={L.section2} color={SECTION_COLORS.verhalten} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{L.section2Headline}</p>
              <p style={{ fontSize: 14, color: "#6E6E73", margin: "0 0 20px", lineHeight: 1.6 }}>{L.section2Sub}</p>
              <div style={{ borderLeft: "4px solid #34C759", borderRadius: 8, background: "rgba(52,199,89,0.04)", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, flexShrink: 0 }}><Sun size={18} color="#34C759" strokeWidth={2.2} /></span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, lineHeight: 1 }}>{L.behaviourDaily}</p>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                  {alltagsverhalten}
                </p>
              </div>
            </div>

            {/* Verhalten unter Druck */}
            <div style={{ marginBottom: 20, borderLeft: "4px solid #FF9500", borderRadius: 8, background: "rgba(255,149,0,0.04)", padding: "16px 20px" }} data-pdf-block>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, flexShrink: 0 }}><Gauge size={18} color="#FF9500" strokeWidth={2.2} /></span>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, lineHeight: 1 }}>{L.behaviourPressure}</p>
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                {stress.controlled}
              </p>
            </div>

            {/* Verhalten bei starkem Stress */}
            <div style={{ marginBottom: 0, borderLeft: "4px solid #FF3B30", borderRadius: 8, background: "rgba(255,59,48,0.04)", padding: "16px 20px" }} data-pdf-block>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, flexShrink: 0 }}><Flame size={18} color="#FF3B30" strokeWidth={2.2} /></span>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, lineHeight: 1 }}>{L.behaviourStress}</p>
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                {stress.uncontrolled}
              </p>
            </div>
          </div>

          {/* ── SEITE 3: TEAMWIRKUNG & RISIKEN ── */}
          <div data-section="anforderung" data-testid="bericht-section-risiko">
            {/* Führungswirkung / Teamwirkung */}
            <div style={{ marginBottom: 28 }} data-pdf-block>
              <SectionHead num={3} title={L.section3} color={SECTION_COLORS.teamwirkung} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{L.section3Headline}</p>
              <p style={{ fontSize: 14, color: "#6E6E73", margin: "0 0 20px", lineHeight: 1.6 }}>{data.isLeadership ? L.section3SubLeadership : L.section3SubNonLeadership}</p>
              <SubHead num={1} title={data.isLeadership ? L.sub1LeadershipImpact : L.sub1TeamImpact} color={SECTION_COLORS.teamwirkung} />
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                {teamwirkung}
              </p>
            </div>

            {/* Spannungsfelder */}
            <div style={{ marginBottom: 28 }} data-pdf-block>
              <SubHead num={2} title={L.sub2Tensions} color={SECTION_COLORS.teamwirkung} />
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, margin: "0 0 12px" }}>
                {L.tensionsIntro}
              </p>
              <div style={{ paddingLeft: 4 }}>
                {spannungsfelder.map((sf, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D1D1F", marginTop: 8, flexShrink: 0, opacity: 0.4 }} />
                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{sf}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fehlbesetzungsrisiken */}
            <div style={{ marginBottom: 28 }} data-pdf-block>
              <SubHead num={3} title={L.sub3MiscastRisks} color={SECTION_COLORS.teamwirkung} />
              {fehlbesetzung.map((risk, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#3A3A3C", margin: "0 0 8px", fontStyle: "italic" }}>{risk.label}</p>
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

            {/* Typischer Kandidat (AI-generiert) */}
            {(kandidatenText || kandidatenLoading || kandidatenError) && (
              <div style={{ marginBottom: 28 }} data-testid="section-kandidatenprofil" data-pdf-block>
                <SubHead num={4} title={L.sub4TypicalPerson} color={SECTION_COLORS.teamwirkung} />
                {kandidatenLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid rgba(0,113,227,0.2)",
                      borderTopColor: "#0071E3",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <span style={{ fontSize: 13, color: "#8E8E93" }}>{L.candidateLoading}</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : kandidatenError ? (
                  <p style={{ fontSize: 13, color: "#8E8E93", margin: 0, fontStyle: "italic" }}>
                    {L.candidateError}
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang} data-testid="text-kandidatenprofil">
                    {kandidatenText}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* ── SEITE 4: ENTSCHEIDUNGSFAZIT ── */}
          <div data-section="fazit" style={{ marginBottom: 40 }} data-testid="bericht-section-fazit">
            <div data-pdf-block>
              <SectionHead num={4} title={L.section4} color={SECTION_COLORS.fazit} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 14px" }}>{fazit.titel}</p>
              {fazit.absaetze.map((absatz, i) => (
                <p key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: i < fazit.absaetze.length - 1 ? "0 0 10px" : "0", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={L.pageLang}>
                  {absatz}
                </p>
              ))}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#C7C7CC", margin: 0, letterSpacing: "0.02em" }}>
              © {new Date().getFullYear()} bioLogic Talent Navigator · {L.footerLabel} · {L.footerCreatedOn} {new Date().toLocaleDateString(L.dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
