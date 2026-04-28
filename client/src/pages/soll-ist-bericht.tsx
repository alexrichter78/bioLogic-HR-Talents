import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, Loader2, ChevronLeft, ChevronDown, SlidersHorizontal, Zap, Compass, Triangle, CheckCircle2, AlertCircle, ArrowRight, Printer } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useLocalizedText, localizeDeep, useRegion } from "@/lib/region";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUI } from "@/lib/ui-texts";
import { dominanceModeOf, labelComponent, buildRoleAnalysisFromState } from "@/lib/jobcheck-engine";
import { computeSollIst, mapFuehrungsArt } from "@/lib/soll-ist-engine";
import { getVisualFitPoint } from "@/lib/passungsnaehe";
import { capRoleProfile, capRoleAnalysis } from "@/lib/profile-cap";
import type { Triad, ComponentKey, RoleAnalysis } from "@/lib/jobcheck-engine";
import type { SollIstResult, Severity, FuehrungsArt } from "@/lib/soll-ist-engine";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

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

type BG = { imp: number; int: number; ana: number };
type RoleDnaState = {
  beruf: string;
  fuehrung: string;
  erfolgsfokusIndices: number[];
  aufgabencharakter: string;
  arbeitslogik: string;
  taetigkeiten: { id: number; name: string; kategorie: string }[];
  bioGramGesamt?: BG;
  bioGramHaupt?: BG;
  bioGramNeben?: BG;
  bioGramFuehrung?: BG;
  bioGramRahmen?: BG;
};

const COMP_LABELS: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung / Tempo",
  intuitiv: "Zusammenarbeit / Kommunikation",
  analytisch: "Struktur / Analyse",
};

import { COMP_HEX, BIO_COLORS, fitColor as bioFitColor, controlColor as bioControlColor } from "@/lib/bio-design";
import { REPORT_INTRO_DISCLAIMER, REPORT_INTRO_DISCLAIMER_EN, REPORT_INTRO_DISCLAIMER_FR } from "@/lib/report-texts";
const BAR_HEX = COMP_HEX;

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

const COMP_LABELS_EN: Record<ComponentKey, string> = {
  impulsiv: "Action-oriented",
  intuitiv: "Relational",
  analytisch: "Analytical",
};

const COMP_LABELS_FR: Record<ComponentKey, string> = {
  impulsiv: "Orienté action",
  intuitiv: "Relationnel",
  analytisch: "Analytique",
};

const COMP_LABELS_IT: Record<ComponentKey, string> = {
  impulsiv: "Orientato all'azione",
  intuitiv: "Relazionale",
  analytisch: "Analitico",
};

function severityLabel(s: Severity, region?: string) {
  if (region === "IT") {
    if (s === "critical") return "critico";
    if (s === "warning") return "con scostamento";
    return "generalmente allineato";
  }
  if (region === "FR") {
    if (s === "critical") return "critique";
    if (s === "warning") return "avec écart";
    return "globalement aligné";
  }
  if (region === "EN") {
    if (s === "critical") return "critical";
    if (s === "warning") return "with deviation";
    return "largely aligned";
  }
  if (s === "critical") return "kritisch";
  if (s === "warning") return "mit Abweichung";
  return "weitgehend stimmig";
}

function biggestGapText(rt: Triad, ct: Triad, region?: string): string {
  const isEN = region === "EN";
  const isIT = region === "IT";
  const labels = region === "IT" ? COMP_LABELS_IT : region === "FR" ? COMP_LABELS_FR : isEN ? COMP_LABELS_EN : COMP_LABELS;
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  let maxGap = 0, maxKey: ComponentKey = "analytisch";
  for (const k of keys) {
    const g = Math.abs(rt[k] - ct[k]);
    if (g > maxGap) { maxGap = g; maxKey = k; }
  }
  const isFR = region === "FR";
  if (maxGap <= 3) {
    return isEN
      ? "The profiles do not differ significantly in any of the three dimensions. The basic structure is aligned."
      : isIT
        ? "I profili non si discostano significativamente in nessuna delle tre dimensioni. La struttura di base e\' allineata."
        : isFR
          ? "Les profils ne diffèrent pas significativement dans aucune des trois dimensions. La structure de base est alignée."
          : "Die Profile weichen in keinem der drei Bereiche wesentlich voneinander ab. Die Grundstruktur passt.";
  }
  const sorted = keys.slice().sort((a, b) => rt[b] - rt[a]);
  const roleRange = rt[sorted[0]] - rt[sorted[2]];
  if (roleRange <= 8) {
    return isEN
      ? `The largest deviation is in the ${labels[maxKey]} dimension. Since the role requires a balanced profile, any deviation affects the overall fit.`
      : isIT
        ? `Lo scostamento maggiore si trova nella dimensione ${labels[maxKey]}. Poiche\' il ruolo richiede un profilo equilibrato, qualsiasi scostamento influisce sull\'adeguatezza complessiva.`
        : isFR
          ? `L'écart le plus important se trouve dans le domaine ${labels[maxKey]}. Le poste exigeant un profil équilibré, tout écart affecte l'adéquation globale.`
          : `Die deutlichste Abweichung liegt im Bereich ${labels[maxKey]}. Da die Stelle ein ausgeglichenes Profil erfordert, wirkt sich jede Abweichung auf die Gesamtpassung aus.`;
  }
  const primaryKey = sorted[0];
  if (maxKey === primaryKey) {
    return isEN
      ? `The largest deviation is in the ${labels[maxKey]} dimension — which is precisely the core requirement of this role.`
      : isIT
        ? `Lo scostamento maggiore si trova nella dimensione ${labels[maxKey]}, che e\' precisamente il requisito centrale di questo ruolo.`
        : isFR
          ? `L'écart le plus important se trouve dans le domaine ${labels[maxKey]}, qui est précisément le domaine central du poste.`
          : `Die deutlichste Abweichung liegt im Bereich ${labels[maxKey]} – und damit genau im Kernbereich der Stellenanforderung.`;
  }
  return isEN
    ? `The largest deviation is in the ${labels[maxKey]} dimension. The core requirement of the role (${labels[primaryKey]}) is less affected.`
    : isIT
      ? `Lo scostamento maggiore si trova nella dimensione ${labels[maxKey]}. Il requisito centrale del ruolo (${labels[primaryKey]}) e\' meno interessato.`
      : isFR
        ? `L'écart le plus important se trouve dans le domaine ${labels[maxKey]}. Le domaine central du poste (${labels[primaryKey]}) est moins concerné.`
        : `Die deutlichste Abweichung liegt im Bereich ${labels[maxKey]}. Der Kernbereich der Stelle (${labels[primaryKey]}) ist davon weniger betroffen.`;
}



function TriangleChart({ role, candidate }: { role: Triad; candidate: Triad }) {
  const { region: _r } = useRegion();
  const _L = (de: string, en: string, fr?: string, it?: string) => _r === "EN" ? en : _r === "IT" && it ? it : _r === "FR" && fr ? fr : de;
  const w = 360, h = 330;
  const cx = w / 2, cy = 178;
  const R = 110;
  const MAX_VAL = 67;
  const angles = [-Math.PI / 2, Math.PI / 2 - Math.PI / 3, Math.PI / 2 + Math.PI / 3];
  const verts = angles.map(a => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }));
  const labelR = R + 22;
  const labelPts = angles.map(a => ({ x: cx + labelR * Math.cos(a), y: cy + labelR * Math.sin(a) }));

  function triadPoly(t: Triad) {
    const vals = [t.analytisch, t.intuitiv, t.impulsiv];
    return vals.map((v, i) => {
      const d = (Math.min(v, MAX_VAL) / MAX_VAL) * R;
      return { x: cx + d * Math.cos(angles[i]), y: cy + d * Math.sin(angles[i]) };
    });
  }

  const rp = triadPoly(role);
  const cp = triadPoly(candidate);
  const toStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(" ");
  const toPath = (pts: { x: number; y: number }[]) => `M${pts.map(p => `${p.x},${p.y}`).join("L")}Z`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: 400, height: "auto" }}>
        <defs>
          <linearGradient id="rFill" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="cFill" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        <polygon points={toStr(verts)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        {[0.33, 0.66].map(s => (
          <polygon key={s} points={verts.map(v => `${cx + (v.x - cx) * s},${cy + (v.y - cy) * s}`).join(" ")} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 4" />
        ))}

        <path d={toPath(rp)} fill="url(#rFill)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />
        <path d={toPath(cp)} fill="url(#cFill)" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />

        {rp.map((p, i) => <circle key={`r${i}`} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />)}
        {cp.map((p, i) => <circle key={`c${i}`} cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />)}

        <text x={labelPts[0].x} y={labelPts[0].y - 4} textAnchor="middle" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>{_L("Analytisch", "Analytical", "Analytique", "Analitico")}</text>
        <text x={labelPts[1].x - 4} y={labelPts[1].y + 14} textAnchor="start" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>{_L("Intuitiv", "Relational", "Relationnel", "Relazionale")}</text>
        <text x={labelPts[2].x + 4} y={labelPts[2].y + 14} textAnchor="end" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>{_L("Impulsiv", "Action-oriented", "Orienté action", "Orientato all'azione")}</text>
      </svg>
    </div>
  );
}

export default function SollIstBericht() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const t = useLocalizedText();
  const { region } = useRegion();
  const ui = useUI();
  const [candidateName, setCandidateName] = useState("");
  const [candTriad, setCandTriad] = useState<{impulsiv: number; intuitiv: number; analytisch: number}>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });

  const rebalanceTriad = useCallback((prev: {impulsiv: number; intuitiv: number; analytisch: number}, key: ComponentKey, newVal: number) => {
    const clamped = Math.max(5, Math.min(67, Math.round(newVal)));
    const others = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== key);
    const remaining = 100 - clamped;
    const otherSum = prev[others[0]] + prev[others[1]];
    let o1: number, o2: number;
    if (otherSum === 0) {
      o1 = Math.round(remaining / 2);
      o2 = remaining - o1;
    } else {
      o1 = Math.round((prev[others[0]] / otherSum) * remaining);
      o2 = remaining - o1;
    }
    o1 = Math.max(5, Math.min(67, o1));
    o2 = Math.max(5, Math.min(67, o2));
    const total = clamped + o1 + o2;
    if (total !== 100) {
      const diff = 100 - total;
      if (o1 + diff >= 5 && o1 + diff <= 67) o1 += diff;
      else o2 += diff;
    }
    return { ...prev, [key]: clamped, [others[0]]: o1, [others[1]]: o2 };
  }, []);

  const updateCandTriad = useCallback((key: ComponentKey, newVal: number) => {
    setCandTriad(prev => {
      const clamped = Math.max(5, Math.min(67, Math.round(newVal)));
      const others = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== key);
      const remaining = 100 - clamped;
      const otherSum = prev[others[0]] + prev[others[1]];
      let o1: number, o2: number;
      if (otherSum === 0) {
        o1 = Math.round(remaining / 2);
        o2 = remaining - o1;
      } else {
        o1 = Math.round((prev[others[0]] / otherSum) * remaining);
        o2 = remaining - o1;
      }
      o1 = Math.max(5, Math.min(67, o1));
      o2 = Math.max(5, Math.min(67, o2));
      const total = clamped + o1 + o2;
      if (total !== 100) {
        const diff = 100 - total;
        if (o2 + diff >= 5 && o2 + diff <= 67) o2 += diff;
        else if (o1 + diff >= 5 && o1 + diff <= 67) o1 += diff;
      }
      return { [key]: clamped, [others[0]]: o1, [others[1]]: o2 } as typeof prev;
    });
  }, []);
  const [roleName, setRoleName] = useState<string>(() => {
    try {
      const raw = localStorage.getItem("rollenDnaState");
      if (raw) { const dna = JSON.parse(raw); return dna.beruf || ""; }
    } catch {}
    return "";
  });
  const [roleTriad, setRoleTriad] = useState<Triad | null>(() => {
    try {
      const raw = localStorage.getItem("rollenDnaState");
      if (raw) { const dna = JSON.parse(raw); if (dna.beruf && dna.bioGramGesamt) return bgToTriad(dna.bioGramGesamt); }
    } catch {}
    return null;
  });
  const [roleAnalysisObj, setRoleAnalysisObj] = useState<RoleAnalysis | undefined>(() => {
    try {
      const raw = localStorage.getItem("rollenDnaState");
      if (raw) { const dna = JSON.parse(raw); if (dna.beruf && dna.bioGramGesamt) return buildRoleAnalysisFromState(dna) || undefined; }
    } catch {}
    return undefined;
  });
  const [hasRollenDna, setHasRollenDna] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("rollenDnaState");
      if (raw) { const dna = JSON.parse(raw); return !!(dna.beruf && dna.bioGramGesamt); }
    } catch {}
    return false;
  });
  const [reportGenerated, setReportGenerated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNarrative, setAiNarrative] = useState<{
    summaryText: string;
    executiveBullets: string[];
    constellationRisks: string[];
    dominanceShiftText: string;
    developmentText: string;
    actions: string[];
    finalText: string;
    impactAreas?: Array<{ id: string; label: string; severity: string; roleNeed: string; candidatePattern: string; risk: string }>;
    riskTimeline?: Array<{ label: string; period: string; text: string }>;
    integrationsplan?: Array<{ num: number; title: string; period: string; ziel: string; items: string[]; fokus: { intro: string; bullets: string[] } }> | null;
  } | null>(null);
  const [lastInputHash, setLastInputHash] = useState<string | null>(null);
  const narrativeCacheRef = useRef<Record<string, { narrative: typeof aiNarrative; hash: string }>>({});
  useEffect(() => {
    const cached = narrativeCacheRef.current[region];
    if (cached) {
      setAiNarrative(cached.narrative);
      setLastInputHash(cached.hash);
      setReportGenerated(true);
      setAiError(null);
    } else {
      setAiNarrative(null);
      setAiError(null);
      setReportGenerated(false);
      setLastInputHash(null);
    }
  }, [region]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const subCircleCache = useRef<Record<string, string>>({});
  const [profilvergleichOpen, setProfilvergleichOpen] = useState(true);
  const [systemwirkungOpen, setSystemwirkungOpen] = useState(true);
  const [fuehrungsArt, setFuehrungsArt] = useState<FuehrungsArt>("keine");

  const currentInputHash = useMemo(() => JSON.stringify({
    roleName, candidateName, fuehrungsArt, region,
    role: roleTriad,
    candidate: { impulsiv: candTriad.impulsiv, intuitiv: candTriad.intuitiv, analytisch: candTriad.analytisch },
  }), [roleName, candidateName, fuehrungsArt, region, roleTriad, candTriad.impulsiv, candTriad.intuitiv, candTriad.analytisch]);

  const reportIsValid = reportGenerated && lastInputHash !== null && currentInputHash === lastInputHash;

  const updateRoleTriad = useCallback((key: ComponentKey, newVal: number) => {
    setRoleTriad(prev => {
      if (!prev) return prev;
      return rebalanceTriad(prev, key, newVal) as Triad;
    });
  }, [rebalanceTriad]);

  useEffect(() => {
    if (!roleTriad) return;
    setRoleAnalysisObj(prev => {
      if (!prev) return prev;
      if (prev.role_profile.impulsiv === roleTriad.impulsiv &&
          prev.role_profile.intuitiv === roleTriad.intuitiv &&
          prev.role_profile.analytisch === roleTriad.analytisch) return prev;
      return { ...prev, role_profile: roleTriad };
    });
  }, [roleTriad]);
  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      try {
        const dna = JSON.parse(raw) as RoleDnaState;
        if (dna.beruf && dna.bioGramGesamt) {
          setHasRollenDna(true);
          setRoleName(dna.beruf);
          setRoleTriad(bgToTriad(dna.bioGramGesamt));
          if (dna.fuehrung) setFuehrungsArt(mapFuehrungsArt(dna.fuehrung));
          setRoleAnalysisObj(buildRoleAnalysisFromState(dna) || undefined);
        }
      } catch {}
    }

    const candRaw = localStorage.getItem("jobcheckCandProfile");
    if (candRaw) {
      try {
        const cand = JSON.parse(candRaw);
        if (cand.name) setCandidateName(cand.name);
        if (cand.impulsiv != null && cand.intuitiv != null && cand.analytisch != null) {
          setCandTriad({ impulsiv: cand.impulsiv, intuitiv: cand.intuitiv, analytisch: cand.analytisch });
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const existing = localStorage.getItem("jobcheckCandProfile");
    let data: Record<string, unknown> = {};
    if (existing) { try { data = JSON.parse(existing); } catch {} }
    data.impulsiv = candTriad.impulsiv;
    data.intuitiv = candTriad.intuitiv;
    data.analytisch = candTriad.analytisch;
    localStorage.setItem("jobcheckCandProfile", JSON.stringify(data));
  }, [candTriad]);

  const candidateProfile = candTriad;
  const candDom = dominanceModeOf(candidateProfile);

  const result: SollIstResult | null = useMemo(() => {
    if (!roleTriad || !reportIsValid) return null;
    const cappedRoleTriad = capRoleProfile(roleTriad);
    const cappedRoleAnalysis = roleAnalysisObj ? capRoleAnalysis(roleAnalysisObj) : roleAnalysisObj;
    const raw = computeSollIst(roleName, candidateName || "Person", cappedRoleTriad, candidateProfile, fuehrungsArt, cappedRoleAnalysis, region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de");
    const base = localizeDeep(raw, region);
    return (aiNarrative ? { ...base, ...aiNarrative } : base) as SollIstResult;
  }, [roleTriad, roleName, candidateName, candidateProfile.impulsiv, candidateProfile.intuitiv, candidateProfile.analytisch, reportIsValid, fuehrungsArt, region, roleAnalysisObj, aiNarrative]);

  const exportPdf = useCallback(async () => {
    if (!result || isExportingPdf || !roleTriad || !reportRef.current) return;
    setIsExportingPdf(true);
    let clone: HTMLElement | null = null;
    let pdfBtn: HTMLElement | null = null;
    let backBtn: HTMLElement | null = null;
    let reconfigBtn: HTMLElement | null = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const source = reportRef.current;
      pdfBtn = source.querySelector("[data-testid='button-export-pdf']") as HTMLElement | null;
      backBtn = source.querySelector("[data-testid='link-back-matchcheck']") as HTMLElement | null;
      reconfigBtn = source.querySelector("[data-testid='button-reconfigure']") as HTMLElement | null;
      if (pdfBtn) pdfBtn.style.display = "none";
      if (backBtn) backBtn.style.display = "none";
      if (reconfigBtn) reconfigBtn.style.display = "none";

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
        el.style.hyphens = "none";
        (el.style as any).WebkitHyphens = "none";
        el.style.wordBreak = "normal";
        el.style.overflowWrap = "break-word";
        el.style.textAlign = "left";
      });

      clone.querySelectorAll<HTMLElement>(".bio-section-head").forEach(sh => {
        sh.style.justifyContent = "flex-start";
        sh.style.gap = "0";
      });

      const animatedSections = clone.querySelectorAll<HTMLElement>(
        "[data-testid='print-report-card'] > div > div, .bio-bar-animate"
      );
      animatedSections.forEach(el => {
        el.style.animation = "none";
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.transition = "none";
      });

      clone.querySelectorAll<HTMLElement>(".no-print").forEach(el => {
        el.style.display = "none";
      });

      const cardEl = clone.querySelector<HTMLElement>("[data-testid='print-report-card']");
      if (cardEl) {
        cardEl.style.overflow = "visible";
        cardEl.style.borderRadius = "0";
      }

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
      if (backBtn) { backBtn.style.display = ""; backBtn = null; }
      if (reconfigBtn) { reconfigBtn.style.display = ""; reconfigBtn = null; }

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

      const safeName = (roleName || "Bericht").replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_");
      doc.save(`MatchCheck_${safeName}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert(region === "IT" ? "L'esportazione PDF non e' riuscita. Riprova." : region === "FR" ? "L'export PDF a échoué. Veuillez réessayer." : region === "EN" ? "PDF export failed. Please try again." : "PDF-Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      if (pdfBtn) pdfBtn.style.display = "";
      if (backBtn) backBtn.style.display = "";
      if (reconfigBtn) reconfigBtn.style.display = "";
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, roleName, result, roleTriad, candidateProfile]);

  if (!hasRollenDna || !roleTriad) {
    return (
      <div className="page-gradient-bg">
        <GlobalNav />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-950 mb-3">{ui.matchcheck.noRoleDNA}</h2>
          <p className="text-sm text-slate-600 mb-6 leading-6">
            {ui.matchcheck.noRoleDNADesc}
          </p>
          <button
            onClick={() => setLocation("/rollen-dna")}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            data-testid="button-go-to-rolle"
          >
            {ui.matchcheck.gotoRoleAnalysis}
          </button>
        </div>
      </div>
    );
  }

  if (aiLoading) {
    return (
      <div className="page-gradient-bg">
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 18px", border: "3px solid #E5E5E7", borderTopColor: "#0071E3", borderRadius: "50%", animation: "bio-spin 0.9s linear infinite" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>
              {ui.matchcheck.generatingMatch}
            </h2>
            <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6 }}>
              {ui.matchcheck.generatingMatchDesc}
            </p>
            <style>{`@keyframes bio-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-gradient-bg">
      <GlobalNav />

      {!reportIsValid && (
        <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999 }}>
          <div className="dark:!bg-background" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px", minHeight: isMobile ? 48 : 62 }}>
            <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
              <div className="text-center">
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-matchcheck-title">
                  {ui.matchcheck.configureMatch}
                </h1>
                <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="text-matchcheck-subtitle">
                  {ui.matchcheck.configureMatchDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto" style={{ maxWidth: 1100, paddingTop: !reportIsValid ? (isMobile ? 110 : 135) : 40, paddingBottom: isMobile ? 100 : 40, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24 }}>

        {/* === INPUT: Slider area before report === */}
        {!reportIsValid && (<>
          <div style={{ background: "#FFFFFF", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 32 }}>
            <button
              onClick={() => setProfilvergleichOpen(!profilvergleichOpen)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 14px" : "20px 32px", border: "none", outline: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              data-testid="button-toggle-profilvergleich"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg, #34C759, #30B350)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SlidersHorizontal style={{ width: 15, height: 15, color: "#fff", strokeWidth: 2.5 }} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#34C759" }}>
                  {ui.matchcheck.profileComparison}<span style={{ fontWeight: 700, color: "#1D1D1F" }}>{roleName}</span>
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profilvergleichOpen ? "rotate-180" : ""}`} />
            </button>

            {profilvergleichOpen && (<div style={{ padding: isMobile ? "0 14px 14px" : "0 32px 32px" }}>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="card-soll-profil">
                <p className="text-base font-semibold text-slate-900 mb-6">{ui.matchcheck.targetProfile} <span className="font-normal text-slate-500">({ui.matchcheck.role})</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                    const val = roleTriad[k];
                    const hex = BAR_HEX[k];
                    const pct = val;
                    const widthPct = (val / 67) * 100;
                    const isSmall = widthPct < 18;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 26 }} data-testid={`slider-row-role-${k}`}>
                        <span style={{ fontSize: 14, color: "#48484A", width: region === "FR" || region === "IT" ? 115 : 72, flexShrink: 0, lineHeight: "1.35" }}>
                          {labelComponent(k, region)}
                        </span>
                        <div style={{ flex: 1, position: "relative", height: 26 }}>
                          <div style={{
                            position: "absolute", inset: 0,
                            borderRadius: 13, background: "rgba(0,0,0,0.06)",
                          }} />
                          <div style={{
                            position: "absolute", left: 0, top: 0, bottom: 0,
                            width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                            borderRadius: 13, background: hex,
                            transition: "width 150ms ease",
                            display: "flex", alignItems: "center", paddingLeft: 10,
                            minWidth: isSmall ? 8 : 50,
                          }}>
                            {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap", lineHeight: "26px" }}>{pct} %</span>}
                          </div>
                          <div
                            data-testid={`slider-role-${k}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const track = e.currentTarget.parentElement!;
                              const rect = track.getBoundingClientRect();
                              const move = (ev: MouseEvent) => {
                                const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                                const raw = Math.round(ratio * 67);
                                updateRoleTriad(k, raw);
                              };
                              const up = () => {
                                window.removeEventListener("mousemove", move);
                                window.removeEventListener("mouseup", up);
                              };
                              window.addEventListener("mousemove", move);
                              window.addEventListener("mouseup", up);
                            }}
                            onTouchStart={(e) => {
                              const track = e.currentTarget.parentElement!;
                              const rect = track.getBoundingClientRect();
                              const move = (ev: TouchEvent) => {
                                ev.preventDefault();
                                const touch = ev.touches[0];
                                const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                                const raw = Math.round(ratio * 67);
                                updateRoleTriad(k, raw);
                              };
                              const up = () => {
                                window.removeEventListener("touchmove", move);
                                window.removeEventListener("touchend", up);
                                window.removeEventListener("touchcancel", up);
                              };
                              window.addEventListener("touchmove", move, { passive: false });
                              window.addEventListener("touchend", up);
                              window.addEventListener("touchcancel", up);
                            }}
                            style={{
                              position: "absolute",
                              left: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 28, height: 28, borderRadius: "50%",
                              background: hex,
                              border: "3px solid #F0F0F2",
                              transition: "left 80ms ease",
                              zIndex: 3,
                              cursor: "grab",
                              touchAction: "none",
                            }}
                          />
                          {isSmall && (
                            <span style={{
                              position: "absolute", top: "50%", transform: "translateY(-50%)",
                              left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 20px)`,
                              fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                              transition: "left 150ms ease",
                              zIndex: 4,
                            }}>{pct} %</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="card-ist-profil">
                <p className="text-base font-semibold text-slate-900 mb-6">{ui.matchcheck.actualProfile} <span className="font-normal text-slate-500">({ui.matchcheck.person})</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                    const val = candTriad[k];
                    const hex = BAR_HEX[k];
                    const pct = val;
                    const widthPct = (val / 67) * 100;
                    const isSmall = widthPct < 18;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 26 }} data-testid={`slider-row-${k}`}>
                        <span style={{ fontSize: 14, color: "#48484A", width: region === "FR" || region === "IT" ? 115 : 72, flexShrink: 0, lineHeight: "1.35" }}>
                          {labelComponent(k, region)}
                        </span>
                        <div style={{ flex: 1, position: "relative", height: 26 }}>
                          <div style={{
                            position: "absolute", inset: 0,
                            borderRadius: 13, background: "rgba(0,0,0,0.06)",
                          }} />
                          <div style={{
                            position: "absolute", left: 0, top: 0, bottom: 0,
                            width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                            borderRadius: 13, background: hex,
                            transition: "width 150ms ease",
                            display: "flex", alignItems: "center", paddingLeft: 10,
                            minWidth: isSmall ? 8 : 50,
                          }}>
                            {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap", lineHeight: "26px" }}>{pct} %</span>}
                          </div>
                          <div
                            data-testid={`slider-${k}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const track = e.currentTarget.parentElement!;
                              const rect = track.getBoundingClientRect();
                              const move = (ev: MouseEvent) => {
                                const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                                const raw = Math.round(ratio * 67);
                                updateCandTriad(k, raw);
                              };
                              const up = () => {
                                window.removeEventListener("mousemove", move);
                                window.removeEventListener("mouseup", up);
                              };
                              window.addEventListener("mousemove", move);
                              window.addEventListener("mouseup", up);
                            }}
                            onTouchStart={(e) => {
                              const track = e.currentTarget.parentElement!;
                              const rect = track.getBoundingClientRect();
                              const move = (ev: TouchEvent) => {
                                const touch = ev.touches[0];
                                const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                                const raw = Math.round(ratio * 67);
                                updateCandTriad(k, raw);
                              };
                              const up = () => {
                                window.removeEventListener("touchmove", move);
                                window.removeEventListener("touchend", up);
                              };
                              window.addEventListener("touchmove", move);
                              window.addEventListener("touchend", up);
                            }}
                            style={{
                              position: "absolute",
                              left: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 28, height: 28, borderRadius: "50%",
                              background: hex,
                              border: "3px solid #F0F0F2",
                              transition: "left 80ms ease",
                              zIndex: 3,
                              cursor: "default",
                            }}
                          />
                          {isSmall && (
                            <span style={{
                              position: "absolute", top: "50%", transform: "translateY(-50%)",
                              left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 20px)`,
                              fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                              transition: "left 150ms ease",
                              zIndex: 4,
                            }}>{pct} %</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 16, marginTop: 16 }}>
            {(() => {
              const rN = roleTriad;
              const cN = candTriad;
              if (!rN) return null;
              const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
              const sorted = (t: typeof rN) => keys.map(k => ({ key: k, value: t[k] })).sort((a, b) => b.value - a.value);
              const rs = sorted(rN);
              const cs = sorted(cN);
              const rGap1 = rs[0].value - rs[1].value;
              const rGap2 = rs[1].value - rs[2].value;
              const cGap1 = cs[0].value - cs[1].value;
              const cGap2 = cs[1].value - cs[2].value;
              const rBal = rGap1 <= 5 && rGap2 <= 5;
              const rDualTop = !rBal && rGap1 <= 4;
              const rDualBot = !rBal && !rDualTop && rGap2 <= 5;
              const cBal = cGap1 <= 5 && cGap2 <= 5;
              const cDualTop = !cBal && cGap1 <= 4;
              const cDualBot = !cBal && !cDualTop && cGap2 <= 5;

              const items: { icon: string; text: string; active: boolean }[] = [
                {
                  icon: "≈",
                  text: "Alle drei Anteile liegen nah beieinander (max. 5% Unterschied) — keine klare Hauptrichtung erkennbar",
                  active: rBal || cBal,
                },
                {
                  icon: "⇆",
                  text: "Zwei Anteile sind fast gleich stark und bilden gemeinsam den Schwerpunkt (Doppelschwerpunkt oben)",
                  active: rDualTop || cDualTop,
                },
                {
                  icon: "⇊",
                  text: "Ein Anteil führt klar, die anderen beiden liegen nah beieinander (Gleichstand unten)",
                  active: rDualBot || cDualBot,
                },
              ];

              void items;
              return null;
            })()}
              <button
                onClick={async () => {
                  if (!roleTriad) return;
                  setAiLoading(true);
                  setAiError(null);
                  setAiNarrative(null);
                  try {
                    const cappedRoleTriad = capRoleProfile(roleTriad);
                    const cappedRoleAnalysis = roleAnalysisObj ? capRoleAnalysis(roleAnalysisObj) : roleAnalysisObj;
                    const computed = computeSollIst(roleName, candidateName || "Person", cappedRoleTriad, candidateProfile, fuehrungsArt, cappedRoleAnalysis, region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de");
                    const payload: Record<string, unknown> = {
                      context: { roleName: roleName || "Rolle", candidateName: candidateName || "Person" },
                      profiles: {
                        role:      { impulsiv: Math.round(cappedRoleTriad.impulsiv), intuitiv: Math.round(cappedRoleTriad.intuitiv), analytisch: Math.round(cappedRoleTriad.analytisch) },
                        candidate: { impulsiv: Math.round(candidateProfile.impulsiv), intuitiv: Math.round(candidateProfile.intuitiv), analytisch: Math.round(candidateProfile.analytisch) },
                      },
                      calculated: {
                        fitLabel: computed.fitLabel,
                        fitRating: computed.fitRating,
                        totalGap: computed.totalGap,
                        gapLevel: computed.gapLevel,
                        developmentLabel: computed.developmentLabel,
                        developmentLevel: computed.developmentLevel,
                        controlIntensity: computed.controlIntensity,
                        roleConstellationLabel: computed.roleConstellationLabel,
                        candConstellationLabel: computed.candConstellationLabel,
                      },
                      region,
                    };
                    if (region === "FR") {
                      payload.sourceTexts = {
                        impactAreas: computed.impactAreas.map(a => ({ id: a.id, label: a.label, severity: a.severity, roleNeed: a.roleNeed, candidatePattern: a.candidatePattern, risk: a.risk })),
                        riskTimeline: computed.riskTimeline.map(p => ({ label: p.label, period: p.period, text: p.text })),
                        integrationsplan: computed.integrationsplan?.map(p => ({ num: p.num, title: p.title, period: p.period, ziel: p.ziel, items: p.items, fokus: p.fokus })) ?? null,
                      };
                    }
                    const resp = await fetch("/api/generate-soll-ist-narrative", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!resp.ok) {
                      const err = await resp.json().catch(() => ({}));
                      throw new Error(err.error || `HTTP ${resp.status}`);
                    }
                    const narrative = await resp.json();
                    setAiNarrative(narrative);
                    setLastInputHash(currentInputHash);
                    setReportGenerated(true);
                    narrativeCacheRef.current[region] = { narrative, hash: currentInputHash };
                  } catch (err: any) {
                    setAiError(err.message || "Generation failed");
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                data-testid="button-generate-report"
                style={{
                  height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                  borderRadius: 14, border: "none", outline: "none", cursor: aiLoading ? "not-allowed" : "pointer",
                  background: aiLoading ? "linear-gradient(135deg, #8E8E93, #AEAEB2)" : "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                  boxShadow: aiLoading ? "none" : "0 4px 16px rgba(0,113,227,0.3)", transition: "all 200ms ease",
                  display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (!aiLoading) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = aiLoading ? "none" : "0 4px 16px rgba(0,113,227,0.3)"; }}
              >
                {aiLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    {ui.matchcheck.generating}
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  </>
                ) : ui.matchcheck.generateReport}
              </button>
              {aiError && (
                <p style={{ fontSize: 13, color: "#D64045", margin: "8px 0 0", width: "100%", textAlign: "center" }} data-testid="text-ai-error">
                  {ui.matchcheck.errorPrefix}{aiError}
                </p>
              )}
            </div>
            </div>)}
          </div>

          {(() => {
            const effective = result || (roleTriad ? localizeDeep(computeSollIst(roleName, candidateName || "Person", capRoleProfile(roleTriad), candidateProfile, fuehrungsArt, roleAnalysisObj ? capRoleAnalysis(roleAnalysisObj) : roleAnalysisObj, region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"), region) : null);
            if (!effective) return null;

            const fitLabel = effective.fitLabel;
            const fitRating = effective.fitRating;
            const fitColor = bioFitColor(fitRating);

            const shortFazit = fitRating === "GEEIGNET" ? ui.matchcheck.fitHigh : fitRating === "BEDINGT" ? ui.matchcheck.fitMedium : ui.matchcheck.fitLow;

            const devLevel = effective.developmentLevel;
            const devScore = devLevel === 1 ? 3 : devLevel === 2 ? 2 : 1;
            const devGaugeColor = devScore === 3 ? BIO_COLORS.geeignet : devScore === 2 ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
            const devShort = devScore === 3 ? ui.matchcheck.devShortLow : devScore === 2 ? ui.matchcheck.devShortMedium : ui.matchcheck.devShortHigh;

            const bulletCol = fitRating === "GEEIGNET" ? BIO_COLORS.geeignet : fitRating === "BEDINGT" ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;

            const samePrimary = effective.roleDomKey === effective.candDomKey;
            const sameSecondary = effective.roleDom2Key === effective.candDom2Key;
            const isEqualDist = effective.candIsEqualDist;
            const isDualDom = effective.candIsDualDom;

            const kritischLabel = fitRating === "GEEIGNET" ? ui.matchcheck.strengths : fitRating === "BEDINGT" ? ui.matchcheck.notable : ui.matchcheck.critical;
            const kritischBullets: string[] = fitRating === "GEEIGNET"
              ? [ui.matchcheck.workstyleAligned, ui.matchcheck.decisionMatches, ui.matchcheck.paceCompatible]
              : fitRating === "BEDINGT"
              ? [ui.matchcheck.workstyleDeviates, ui.matchcheck.decisionCompatible, ui.matchcheck.intensityMisaligned]
              : [ui.matchcheck.workstyleNoFit, ui.matchcheck.decisionDeviates, ui.matchcheck.intensityTooStrong];

            const auswirkungBullets: string[] = fitRating === "GEEIGNET"
              ? [ui.matchcheck.smoothCollab, ui.matchcheck.stableTeam, ui.matchcheck.lowMgmt]
              : fitRating === "BEDINGT"
              ? [ui.matchcheck.moreCoord, ui.matchcheck.tensionPotential, ui.matchcheck.increasedMgmt]
              : [ui.matchcheck.moreCoordSig, ui.matchcheck.conflictPotential, ui.matchcheck.highMgmt];

            const BulletItem = ({ text, color }: { text: string; color: string }) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CheckCircle2 style={{ width: 15, height: 15, color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.5 }}>{text}</span>
              </div>
            );

            return (
              <div style={{ marginTop: 20 }} data-testid="section-summary-card">
                <div style={{ background: "#FFFFFF", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden" }}>
                  <button
                    onClick={() => setSystemwirkungOpen(!systemwirkungOpen)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 14px" : "20px 32px", border: "none", outline: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    data-testid="button-toggle-systemwirkung"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg, #34C759, #30B350)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Zap style={{ width: 15, height: 15, color: "#fff", strokeWidth: 2.5 }} />
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }}>
                        <span style={{ color: "#34C759" }}>MatchCheck:</span> {roleName || "Stelle"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${systemwirkungOpen ? "rotate-180" : ""}`} />
                  </button>

                  {systemwirkungOpen && (
                  <div style={{ padding: isMobile ? "0 14px 14px" : "0 32px 28px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>

                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 5, background: fitColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: fitColor }} data-testid="text-summary-fit">{fitLabel}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#6E6E73", margin: 0, lineHeight: 1.6 }} data-testid="text-summary-fazit">{shortFazit}</p>
                      </div>

                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 5, background: devGaugeColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: devGaugeColor }}>{ui.matchcheck.developmentEffort}: {devScore === 3 ? ui.matchcheck.devLow : devScore === 2 ? ui.matchcheck.devMedium : ui.matchcheck.devHigh}</span>
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {Array.from({ length: 3 }).map((_, i) => {
                            const filledBars = 4 - devScore;
                            return <div key={i} style={{ flex: 1, height: 12, borderRadius: 4, background: i < filledBars ? devGaugeColor : "rgba(0,0,0,0.08)" }} />;
                          })}
                        </div>
                      </div>

                      {(() => {
                        const pn = ui.matchcheck.passungsnaehe;
                        const cMax = Math.max(
                          Math.abs(effective.roleTriad.impulsiv - effective.candTriad.impulsiv),
                          Math.abs(effective.roleTriad.intuitiv - effective.candTriad.intuitiv),
                          Math.abs(effective.roleTriad.analytisch - effective.candTriad.analytisch),
                        );
                        const visual = getVisualFitPoint({
                          fitRating: effective.fitRating,
                          structureType: effective.structureRelation.type,
                          maxDiff: cMax,
                          totalGap: effective.totalGap,
                        });
                        const ZONE_COLORS_S = {
                          GEEIGNET: BIO_COLORS.geeignet,
                          BEDINGT: BIO_COLORS.bedingt,
                          NICHT_GEEIGNET: BIO_COLORS.nichtGeeignet,
                        } as const;
                        const ZONE_LABELS_S = {
                          GEEIGNET: pn.zoneGeeignet,
                          BEDINGT: pn.zoneBedingt,
                          NICHT_GEEIGNET: pn.zoneNicht,
                        } as const;
                        const markerCol = ZONE_COLORS_S[visual.zone];
                        const greenCol = ZONE_COLORS_S.GEEIGNET;
                        const yellowCol = ZONE_COLORS_S.BEDINGT;
                        const redCol = ZONE_COLORS_S.NICHT_GEEIGNET;
                        const markerLeftPctS = `${(visual.position01 * 100).toFixed(2)}%`;
                        const markerSizeS = isMobile ? 18 : 20;
                        const trackHeightS = isMobile ? 8 : 10;
                        return (
                          <div style={{ gridColumn: "1 / -1", padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }} data-testid="section-summary-passungsnaehe">
                            <div style={{ display: "flex", gap: 0, marginBottom: 6 }}>
                              <div style={{ flex: 1, fontSize: isMobile ? 9 : 10, fontWeight: 700, color: greenCol, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS_S.GEEIGNET}</div>
                              <div style={{ flex: 1, fontSize: isMobile ? 9 : 10, fontWeight: 700, color: yellowCol, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS_S.BEDINGT}</div>
                              <div style={{ flex: 1, fontSize: isMobile ? 9 : 10, fontWeight: 700, color: redCol, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS_S.NICHT_GEEIGNET}</div>
                            </div>
                            <div style={{ position: "relative", height: markerSizeS + 8, paddingTop: (markerSizeS + 8 - trackHeightS) / 2, paddingBottom: (markerSizeS + 8 - trackHeightS) / 2 }} data-testid="track-summary-passungsnaehe">
                              <div style={{ position: "relative", height: trackHeightS, borderRadius: 999, overflow: "visible", display: "flex", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)" }}>
                                <div style={{ flex: 1, background: `linear-gradient(90deg, ${greenCol}aa, ${greenCol}66)`, borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }} />
                                <div style={{ flex: 1, background: `linear-gradient(90deg, ${yellowCol}66, ${yellowCol}aa, ${yellowCol}66)` }} />
                                <div style={{ flex: 1, background: `linear-gradient(90deg, ${redCol}66, ${redCol}aa)`, borderTopRightRadius: 999, borderBottomRightRadius: 999 }} />
                                <div style={{ position: "absolute", top: -3, bottom: -3, left: "33.333%", width: 1, background: "rgba(0,0,0,0.12)" }} />
                                <div style={{ position: "absolute", top: -3, bottom: -3, left: "66.666%", width: 1, background: "rgba(0,0,0,0.12)" }} />
                                <div
                                  data-testid="marker-summary-passungsnaehe"
                                  style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: markerLeftPctS,
                                    width: markerSizeS,
                                    height: markerSizeS,
                                    marginLeft: -markerSizeS / 2,
                                    marginTop: -markerSizeS / 2,
                                    borderRadius: "50%",
                                    background: markerCol,
                                    border: "2.5px solid #FFFFFF",
                                    boxShadow: `0 0 0 1.5px ${markerCol}, 0 2px 6px rgba(0,0,0,0.18)`,
                                    transition: "left 600ms cubic-bezier(0.4, 0, 0.2, 1), background 350ms ease, box-shadow 350ms ease",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>{kritischLabel}</p>
                        {kritischBullets.map((b, i) => (
                          <BulletItem key={i} text={b} color={bulletCol} />
                        ))}
                      </div>

                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>{ui.matchcheck.impact}</p>
                        {auswirkungBullets.map((b, i) => (
                          <BulletItem key={i} text={b} color={bulletCol} />
                        ))}
                      </div>

                    </div>
                  </div>
                  )}
                </div>
              </div>
            );
          })()}
        </>)}

        {/* === REPORT OUTPUT === */}
        {result && (() => {
          const fitCol = result.fitRating === "GEEIGNET" ? "#34C759" : result.fitRating === "BEDINGT" ? "#E5A832" : "#D64045";
          const rc = BAR_HEX[result.roleDomKey];
          const cc = BAR_HEX[result.candDomKey];
          const sep = { paddingBottom: 36, marginBottom: 36 } as const;

          const sectionCircleUrls: Record<number, string> = {};
          for (let i = 1; i <= 9; i++) {
            sectionCircleUrls[i] = makeCircleDataUrl(String(i).padStart(2, "0"), 28, "rgba(255,255,255,0.95)", "#343A48", 12, 800, true);
          }

          const SectionHead = ({ num, title }: { num: number; title: string }) => (
            <div className="bio-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginLeft: -44, marginRight: -44, padding: "0 18px", height: 38, background: "linear-gradient(135deg, #343A48 0%, #3d4455 50%, #464f62 100%)", boxShadow: "0 2px 6px rgba(52,58,72,0.3)" }}>
              <img src={sectionCircleUrls[num]} alt={String(num).padStart(2, "0")} style={{ width: 28, height: 28, flexShrink: 0, display: "block" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: "38px", height: 38, display: "inline-block" }}>{title}</span>
            </div>
          );

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
          <div ref={reportRef} style={{ maxWidth: 820, margin: "0 auto" }} data-testid="print-report-wrapper">
            <button
              className="no-print"
              onClick={() => { narrativeCacheRef.current = {}; setReportGenerated(false); setLastInputHash(null); setAiNarrative(null); setAiError(null); window.scrollTo(0, 0); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                outline: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "#2563EB",
                padding: "4px 0",
                marginBottom: 16,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              data-testid="link-back-matchcheck"
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
              {ui.matchcheck.backToMatchCheck}
            </button>
            <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }} data-testid="print-report-card" data-bericht lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>

              {/* ─── DARK HEADER ─── */}
              <div data-pdf-block className="report-header" data-testid="section-header">

                <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />

                <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      const printWin = window.open("", "_blank");
                      if (!printWin) return;
                      const reportEl = reportRef.current;
                      if (!reportEl) return;
                      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                        .map(el => el.outerHTML).join("\n");
                      printWin.document.write(`<!DOCTYPE html><html lang="${region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}"><head><meta charset="utf-8"><title>MatchCheck – ${result.roleName || "Report"}</title>${styles}<style>body{margin:0;padding:20px 0;background:#fff}
.report-header-btn,.report-pdf-btn,.no-print,nav{display:none!important}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
[data-pdf-block]{break-inside:avoid!important}
[data-testid="print-report-card"]{overflow:visible!important;border-radius:0!important;box-shadow:none!important}
</style></head><body>${reportEl.outerHTML}</body></html>`);
                      printWin.document.close();
                      setTimeout(() => { printWin.print(); }, 600);
                    }}
                    data-testid="button-print-soll-ist"
                    className="report-header-btn"
                    title={ui.matchcheck.printTooltip}
                  >
                    <Printer style={{ width: 15, height: 15 }} />
                    <span>{ui.general.print}</span>
                  </button>
                </div>

                <div className="report-kicker">{ui.matchcheck.kicker}</div>
                <h1 className="report-title" data-testid="text-page-title">MatchCheck</h1>
                <div className="report-subtitle">{result.roleName}</div>

                <div className="report-rings" />
              </div>

              {/* ─── EXECUTIVE DECISION CONTENT (weisser Hintergrund) ─── */}
              <div style={{ padding: "28px 44px 0" }}>
                <p data-pdf-block style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 16px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"} data-testid="text-einleitung">
                  {ui.matchcheck.reportIntroText}
                </p>
                <div data-pdf-block style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>
                    {region === "IT" ? REPORT_INTRO_DISCLAIMER_EN : region === "FR" ? REPORT_INTRO_DISCLAIMER_FR : region === "EN" ? REPORT_INTRO_DISCLAIMER_EN : REPORT_INTRO_DISCLAIMER}
                  </p>
                </div>
                <SectionHead num={1} title={ui.matchcheck.overallAssessment} />
                {(() => {
                  const cCol = bioControlColor(result.controlIntensity);
                  const cLabel = result.controlIntensity === "hoch" ? ui.matchcheck.controlHigh : result.controlIntensity === "mittel" ? ui.matchcheck.controlMedium : ui.matchcheck.controlLow;
                  const devLevel = result.developmentLevel;
                  const devScore = devLevel === 1 ? 3 : devLevel === 2 ? 2 : 1;
                  const devLabel = devScore === 3 ? ui.matchcheck.devLow : devScore === 2 ? ui.matchcheck.devMedium : ui.matchcheck.devHigh;
                  const devCol = devScore === 3 ? BIO_COLORS.geeignet : devScore === 2 ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
                  const gapCol = result.totalGap > 40 ? BIO_COLORS.nichtGeeignet : result.totalGap > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet;
                  const personLabel = (result.candidateName !== "Die Person" && result.candidateName !== "The person" && result.candidateName !== "La personne") ? result.candidateName : "Person";

                  const gesamtIntroText = (() => {
                    const fr = result.fitRating;
                    const ci = result.controlIntensity;
                    const gl = result.gapLevel;
                    const dl = result.developmentLabel;
                    if (fr === "GEEIGNET") {
                      if (ci === "gering" && gl === "gering") return ui.matchcheck.gesamtIntroSuitableLow;
                      if (ci === "mittel" || gl === "mittel") return ui.matchcheck.gesamtIntroSuitableMid;
                      return ui.matchcheck.gesamtIntroSuitableDefault;
                    }
                    if (fr === "BEDINGT") {
                      if (ci === "hoch" || dl === "hoch") return ui.matchcheck.gesamtIntroPartialHigh;
                      if (result.fitSubtype === "STRUCTURE_MATCH_INTENSITY_OFF") return ui.matchcheck.gesamtIntroPartialStructure;
                      if (gl === "gering") return ui.matchcheck.gesamtIntroPartialLow;
                      return ui.matchcheck.gesamtIntroPartialDefault;
                    }
                    if (ci === "hoch" && (gl === "hoch" || dl === "hoch")) return ui.matchcheck.gesamtIntroCriticalHigh;
                    if (ci === "mittel") return ui.matchcheck.gesamtIntroCriticalMid;
                    return ui.matchcheck.gesamtIntroCriticalDefault;
                  })();

                  return (
                    <>
                      <p data-pdf-block style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 22px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"} data-testid="text-gesamt-intro">
                        {gesamtIntroText}
                      </p>
                      <div data-pdf-block style={{ marginBottom: 22 }} data-testid="section-systemstatus">
                        <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${fitCol}08`, border: `1px solid ${fitCol}25` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{ui.matchcheck.basicFit}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: fitCol }} data-testid="status-grundpassung">{result.fitLabel}</div>
                          </div>
                          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${cCol}08`, border: `1px solid ${cCol}25` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{ui.matchcheck.managementEffort}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: cCol }} data-testid="status-führungsaufwand">{cLabel}</div>
                          </div>
                        </div>
                        <div style={{ display: "none", gap: 16, marginTop: 16 }}>
                          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${gapCol}08`, border: `1px solid ${gapCol}25` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{ui.matchcheck.profileDeviation}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="status-profilabweichung">{result.gapLevel === "gering" ? ui.matchcheck.gapLow : result.gapLevel === "mittel" ? ui.matchcheck.gapMedium : ui.matchcheck.gapHigh}</div>
                          </div>
                          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${devCol}08`, border: `1px solid ${devCol}25` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 5, background: devCol, flexShrink: 0 }} />
                              <span style={{ fontSize: 14, fontWeight: 700, color: devCol }} data-testid="status-entwicklungsaufwand">{ui.matchcheck.developmentEffort}: {devLabel}</span>
                            </div>
                            <div style={{ display: "flex", gap: 5 }}>
                              {Array.from({ length: 3 }).map((_, i) => {
                                const filledBars = devScore === 3 ? 1 : devScore === 2 ? 2 : 3;
                                return <div key={i} style={{ flex: 1, height: 12, borderRadius: 4, background: i < filledBars ? devCol : "rgba(0,0,0,0.08)" }} />;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PASSUNGSNÄHE – 12-Punkte-Feinanzeige (rein visuell) */}
                      {(() => {
                        const pn = ui.matchcheck.passungsnaehe;
                        const computedMaxDiff = Math.max(
                          Math.abs(result.roleTriad.impulsiv - result.candTriad.impulsiv),
                          Math.abs(result.roleTriad.intuitiv - result.candTriad.intuitiv),
                          Math.abs(result.roleTriad.analytisch - result.candTriad.analytisch),
                        );
                        const visual = getVisualFitPoint({
                          fitRating: result.fitRating,
                          structureType: result.structureRelation.type,
                          maxDiff: computedMaxDiff,
                          totalGap: result.totalGap,
                        });
                        const ZONE_COLORS = {
                          GEEIGNET: BIO_COLORS.geeignet,
                          BEDINGT: BIO_COLORS.bedingt,
                          NICHT_GEEIGNET: BIO_COLORS.nichtGeeignet,
                        } as const;
                        const ZONE_LABELS = {
                          GEEIGNET: pn.zoneGeeignet,
                          BEDINGT: pn.zoneBedingt,
                          NICHT_GEEIGNET: pn.zoneNicht,
                        } as const;
                        const markerColor = ZONE_COLORS[visual.zone];
                        const greenColR = ZONE_COLORS.GEEIGNET;
                        const yellowColR = ZONE_COLORS.BEDINGT;
                        const redColR = ZONE_COLORS.NICHT_GEEIGNET;
                        const markerLeftPct = `${(visual.position01 * 100).toFixed(2)}%`;
                        const markerSize = isMobile ? 22 : 26;
                        const trackHeight = isMobile ? 10 : 12;
                        return (
                          <div
                            data-pdf-block
                            data-testid="section-passungsnaehe"
                            style={{
                              marginBottom: 22,
                              padding: isMobile ? "16px 16px" : "18px 22px",
                              borderRadius: 12,
                              background: "#FFFFFF",
                              border: "1px solid rgba(0,0,0,0.06)",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                            }}
                          >
                            <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
                              <div style={{ flex: 1, fontSize: isMobile ? 9.5 : 10.5, fontWeight: 700, color: greenColR, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS.GEEIGNET}</div>
                              <div style={{ flex: 1, fontSize: isMobile ? 9.5 : 10.5, fontWeight: 700, color: yellowColR, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS.BEDINGT}</div>
                              <div style={{ flex: 1, fontSize: isMobile ? 9.5 : 10.5, fontWeight: 700, color: redColR, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>{ZONE_LABELS.NICHT_GEEIGNET}</div>
                            </div>
                            <div style={{ position: "relative", height: markerSize + 12, paddingTop: (markerSize + 12 - trackHeight) / 2, paddingBottom: (markerSize + 12 - trackHeight) / 2 }} data-testid="track-passungsnaehe">
                              <div style={{ position: "relative", height: trackHeight, borderRadius: 999, overflow: "visible", display: "flex", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.07)" }}>
                                <div style={{ flex: 1, background: `linear-gradient(90deg, ${greenColR}cc, ${greenColR}66)`, borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }} />
                                <div style={{ flex: 1, background: `linear-gradient(90deg, ${yellowColR}66, ${yellowColR}cc, ${yellowColR}66)` }} />
                                <div style={{ flex: 1, background: `linear-gradient(90deg, ${redColR}66, ${redColR}cc)`, borderTopRightRadius: 999, borderBottomRightRadius: 999 }} />
                                <div style={{ position: "absolute", top: -4, bottom: -4, left: "33.333%", width: 1, background: "rgba(0,0,0,0.14)" }} />
                                <div style={{ position: "absolute", top: -4, bottom: -4, left: "66.666%", width: 1, background: "rgba(0,0,0,0.14)" }} />
                                <div
                                  data-testid="marker-passungsnaehe"
                                  style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: markerLeftPct,
                                    width: markerSize,
                                    height: markerSize,
                                    marginLeft: -markerSize / 2,
                                    marginTop: -markerSize / 2,
                                    borderRadius: "50%",
                                    background: markerColor,
                                    border: "3px solid #FFFFFF",
                                    boxShadow: `0 0 0 1.5px ${markerColor}, 0 3px 8px rgba(0,0,0,0.18)`,
                                    transition: "left 600ms cubic-bezier(0.4, 0, 0.2, 1), background 350ms ease, box-shadow 350ms ease",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* KURZÜBERSICHT – Rolle vs Person */}
                      {(() => {
                        const matchSymbol = result.fitRating === "GEEIGNET" ? "=" : result.fitRating === "BEDINGT" ? "~" : "⚡";
                        const matchColor = result.fitRating === "GEEIGNET" ? "#34C759" : result.fitRating === "BEDINGT" ? "#E5A832" : "#D64045";

                        const roleKeys: ComponentKey[] = result.roleIsBalFull
                          ? (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[])
                          : result.roleIsDualDom
                            ? [result.roleDomKey, result.roleDom2Key]
                            : [result.roleDomKey];

                        const candKeys: ComponentKey[] = result.candIsEqualDist
                          ? (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[])
                          : result.candIsDualDom
                            ? [result.candDomKey, result.candDom2Key]
                            : [result.candDomKey];

                        return (
                          <div data-pdf-block style={{ marginBottom: 22, padding: "20px 24px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }} data-testid="section-ueberblick">
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 16px", textAlign: "center" }}>{ui.matchcheck.overview}</p>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 16 }}>
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>{ui.matchcheck.role}</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                  {roleKeys.map(k => (
                                    <div key={k} style={{ padding: "10px 20px", borderRadius: 20, background: `${BAR_HEX[k]}14`, border: `1px solid ${BAR_HEX[k]}30` }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: BAR_HEX[k] }}>{labelComponent(k, region)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0, marginTop: roleKeys.length > 1 ? roleKeys.length * 14 + 4 : 18, width: 36, height: 36, borderRadius: "50%", background: `${matchColor}14`, border: `2px solid ${matchColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: matchColor, lineHeight: 1 }}>{matchSymbol}</span>
                              </div>
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>{ui.matchcheck.person}</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                  {candKeys.map(k => (
                                    <div key={k} style={{ padding: "10px 20px", borderRadius: 20, background: `${BAR_HEX[k]}14`, border: `1px solid ${BAR_HEX[k]}30` }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: BAR_HEX[k] }}>{labelComponent(k, region)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* AUSWIRKUNG IM ARBEITSALLTAG */}
                      <div data-pdf-block style={{ marginBottom: 22 }} data-testid="section-auswirkung">
                        <SubHead num={1} title={ui.matchcheck.impactDailyWork} color="#0F3A6E" />
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>
                          {result.dominanceShiftText.split(/\n\n+/)[0]}
                        </p>
                      </div>

                      {/* MANAGEMENTKURZFAZIT */}
                      <div data-pdf-block style={{ marginBottom: 22 }} data-testid="section-fazit">
                        <SubHead num={2} title={ui.matchcheck.sectionMgmtSummary} color="#0F3A6E" />
                        <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"} data-testid="text-summary-fazit">
                          {result.summaryText.split(/\n\n+/)[0]}
                        </p>
                      </div>

                      {/* WARUM / RISIKEN compact */}
                      {(result.executiveBullets.length > 0 || result.constellationRisks.length > 0) && (
                        <div data-pdf-block style={{ marginBottom: 0 }} data-testid="section-executive-bullets">
                          {result.executiveBullets.length > 0 && (
                            <div style={{ marginBottom: result.constellationRisks.length > 0 ? 14 : 0 }}>
                              <SubHead num={3} title={ui.matchcheck.whyThisResult} color="#0F3A6E" />
                              {result.executiveBullets.map((b, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: 3, background: "#0F3A6E", flexShrink: 0 }} />
                                  <span style={{ fontSize: 14, lineHeight: 1.6, color: "#48484A" }}>{b}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {result.constellationRisks.length > 0 && (
                            <div>
                              <SubHead num={4} title={ui.matchcheck.sectionRisks} color="#0F3A6E" />
                              {result.constellationRisks.map((r, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: 3, background: "#0F3A6E", flexShrink: 0 }} />
                                  <span style={{ fontSize: 14, lineHeight: 1.6, color: "#48484A" }}>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* ─── END EXECUTIVE DECISION PAGE ─── */}

              <div style={{ padding: "36px 44px 48px" }}>

              <div data-pdf-block style={{ ...sep, borderBottom: "none" }} data-testid="section-comparison-bars">
                <SectionHead num={2} title={ui.matchcheck.sectionProfileComparison} />
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 20px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>
                  {biggestGapText(result.roleTriad, result.candTriad, region)}
                </p>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2" style={{ marginBottom: 14 }}>
                  <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #fafbfd, #f5f7fb)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>{ui.matchcheck.targetProfile} <span style={{ fontWeight: 400, color: "#8E8E93" }}>({ui.matchcheck.role})</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                        const val = Math.round(roleTriad![k]);
                        const hex = BAR_HEX[k];
                        const widthPct = (val / 67) * 100;
                        const isSmall = widthPct < 18;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 14, color: "#48484A", width: region === "FR" || region === "IT" ? 115 : 72, flexShrink: 0, lineHeight: "1.35" }}>{labelComponent(k, region)}</span>
                            <div style={{ flex: 1, position: "relative", height: 28 }}>
                              <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(0,0,0,0.05)" }} />
                              <div className="bio-bar-animate" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(Math.max(widthPct, 4), 100)}%`, borderRadius: 14, background: `linear-gradient(90deg, ${hex}, ${hex}CC)`, display: "flex", alignItems: "center", paddingLeft: 10, minWidth: isSmall ? 8 : 50, boxShadow: `0 2px 8px ${hex}30`, transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                                {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{val} %</span>}
                              </div>
                              {isSmall && (
                                <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`, fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap" }}>{val} %</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #fafbfd, #f5f7fb)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>{ui.matchcheck.actualProfile} <span style={{ fontWeight: 400, color: "#8E8E93" }}>({ui.matchcheck.person})</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                        const val = Math.round(candidateProfile[k]);
                        const hex = BAR_HEX[k];
                        const widthPct = (val / 67) * 100;
                        const isSmall = widthPct < 18;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 14, color: "#48484A", width: region === "FR" || region === "IT" ? 115 : 72, flexShrink: 0, lineHeight: "1.35" }}>{labelComponent(k, region)}</span>
                            <div style={{ flex: 1, position: "relative", height: 28 }}>
                              <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(0,0,0,0.05)" }} />
                              <div className="bio-bar-animate" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(Math.max(widthPct, 4), 100)}%`, borderRadius: 14, background: `linear-gradient(90deg, ${hex}, ${hex}CC)`, display: "flex", alignItems: "center", paddingLeft: 10, minWidth: isSmall ? 8 : 50, boxShadow: `0 2px 8px ${hex}30`, transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                                {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{val} %</span>}
                              </div>
                              {isSmall && (
                                <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`, fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap" }}>{val} %</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div data-pdf-block style={{ marginTop: 20, padding: "18px 20px", borderRadius: 12, background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#48484A", margin: "0 0 12px" }}>{ui.matchcheck.componentMeaning}</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {([
                      { key: "impulsiv", label: ui.general.labelImpulsiv, color: BAR_HEX.impulsiv, text: ui.matchcheck.actionOrientedDesc },
                      { key: "analytisch", label: ui.general.labelAnalytisch, color: BAR_HEX.analytisch, text: ui.matchcheck.analytischDesc },
                      { key: "intuitiv", label: ui.general.labelIntuitiv, color: BAR_HEX.intuitiv, text: ui.matchcheck.intuitivDesc },
                    ] as const).map(kb => (
                      <div key={kb.key} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ flex: 1, padding: "14px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${kb.color}12, ${kb.color}06)`, border: `1px solid ${kb.color}20`, display: "flex", flexDirection: "column" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: kb.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>{kb.label}</span>
                            <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>
                              {kb.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div data-pdf-block style={{ ...sep, borderBottom: "none" }} data-testid="section-impact-matrix">
                <SectionHead num={3} title={ui.matchcheck.placementImpact} />
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {result.impactAreas.map((area, areaIdx) => {
                    const sevCol = area.severity === "critical" ? "#FF3B30" : area.severity === "warning" ? "#FF9500" : "#34C759";
                    return (
                      <div key={area.id} data-testid={`impact-detail-${area.id}`} style={{ borderTop: areaIdx > 0 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                        <div style={{ padding: "18px 0 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <SubHead num={areaIdx + 1} title={({
                              "Entscheidungsverhalten": ui.matchcheck.areaDecision,
                              "Arbeitsweise": ui.matchcheck.areaWorkstyle,
                              "Führungswirkung": ui.matchcheck.areaLeadership,
                              "Kommunikationsverhalten": ui.matchcheck.areaCommunication,
                              "Wirkung auf Zusammenarbeit und Teamkultur": ui.matchcheck.areaCollaboration,
                            } as Record<string, string>)[area.label] ?? area.label} color="#0F3A6E" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: sevCol, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{severityLabel(area.severity, region)}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                            <div data-text-left style={{ background: "#FAFAFA", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.07)" }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{ui.matchcheck.roleRequirement}</p>
                              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{area.roleNeed}</p>
                            </div>
                            <div data-text-left style={{ background: "#FAFAFA", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.07)" }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{ui.matchcheck.person}</p>
                              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{area.candidatePattern}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", borderRadius: 8, background: `${sevCol}08`, alignItems: "stretch" }}>
                            <div style={{ width: 4, flexShrink: 0, background: sevCol, borderRadius: 999, margin: "8px 0 8px 8px" }} />
                            <div style={{ padding: "10px 14px", flex: 1 }}>
                            <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: "#48484A", wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{area.risk}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div data-pdf-block style={{ ...sep, borderBottom: "none" }} data-testid="section-stress-behavior">
                <SectionHead num={4} title={ui.matchcheck.behaviourUnderPressure} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "#FF950008", border: "1px solid #FF950018", overflow: "visible" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <AlertCircle style={{ width: 14, height: 14, color: "#FF9500", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{ui.matchcheck.controlledPressure}</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{result.stressBehavior.controlledPressure}</p>
                  </div>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "#FF3B3008", border: "1px solid #FF3B3018", overflow: "visible" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#FF3B30", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#FF3B30", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{ui.matchcheck.uncontrolledStress}</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{result.stressBehavior.uncontrolledStress}</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "14px 0 0", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>
                  {ui.matchcheck.stressBehaviorIntro}
                </p>
              </div>

              <div data-pdf-block style={{ ...sep, borderBottom: "none" }} data-testid="section-risk-timeline">
                <SectionHead num={5} title={ui.matchcheck.riskForecast} />
                <div style={{ position: "relative", paddingLeft: 28 }}>
                  <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "rgba(0,0,0,0.08)", borderRadius: 1 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {result.riskTimeline.map((phase, i) => {
                      const phaseCol = i === 0 ? "#34C759" : i === 1 ? "#FF9500" : "#C41E3A";
                      return (
                        <div key={i} style={{ position: "relative" }}>
                          <div style={{ position: "absolute", left: -22, top: 14, width: 10, height: 10, borderRadius: 5, background: phaseCol, boxShadow: `0 0 0 3px ${phaseCol}20` }} />
                          <div style={{ padding: "12px 16px", borderRadius: 12, background: `${phaseCol}06`, border: `1px solid ${phaseCol}15` }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: phaseCol, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{phase.label} <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: "0" }}>{phase.period}</span></p>
                            <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{phase.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {(() => {
                const rFitLabel = result.fitLabel;
                const rFitColor = result.fitColor;

                const rGapLevel = result.gapLevel;
                let rFazit: string;
                if (rFitLabel === "Geeignet" || rFitLabel === "Suitable" || rFitLabel === "Adapté" || rFitLabel === "Adatto") {
                  rFazit = ui.matchcheck.rFazitSuitable;
                } else if ((rFitLabel === "Bedingt geeignet" || rFitLabel === "Conditionally suitable" || rFitLabel === "Partiellement adapté" || rFitLabel === "Parzialmente adatto") && rGapLevel === "gering") {
                  rFazit = ui.matchcheck.rFazitPartialLow;
                } else if (rFitLabel === "Bedingt geeignet" || rFitLabel === "Conditionally suitable" || rFitLabel === "Partiellement adapté" || rFitLabel === "Parzialmente adatto") {
                  rFazit = ui.matchcheck.rFazitPartialDefault;
                } else if ((rFitLabel === "Nicht geeignet" || rFitLabel === "Not suitable" || rFitLabel === "Non adapté" || rFitLabel === "Non adatto") && rGapLevel !== "hoch") {
                  rFazit = ui.matchcheck.rFazitCriticalMid;
                } else {
                  rFazit = ui.matchcheck.rFazitCriticalHigh;
                }


                return (
                  <div data-pdf-block style={{ ...sep, borderBottom: "none" }} data-testid="section-development">
                    <SectionHead num={6} title={ui.matchcheck.overallAssessment} />

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: rFitColor, flexShrink: 0, boxShadow: `0 0 0 3px ${rFitColor}20` }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{result.roleName}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: rFitColor }}>
                        {rFitLabel}
                      </span>
                    </div>

                    <div style={{ background: `${rFitColor}08`, borderLeft: `3px solid ${rFitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 22 }}>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{rFazit}</p>
                    </div>

                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, wordBreak: "break-word", overflowWrap: "break-word", hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{result.finalText}</p>
                  </div>
                );
              })()}

              {result.integrationsplan && (
                <div data-pdf-block style={{ ...sep, borderBottom: "none" }} data-testid="section-integrationsplan">
                  <SectionHead num={7} title={ui.matchcheck.thirtyDayPlan} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {result.integrationsplan.map(phase => {
                      const phaseCol = phase.num === 1 ? "#0071E3" : phase.num === 2 ? "#F39200" : "#34C759";
                      return (
                        <div key={phase.num} data-testid={`integration-phase-${phase.num}`} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${phaseCol}20` }}>
                          <div style={{ padding: "12px 20px", background: `${phaseCol}10`, borderBottom: `1px solid ${phaseCol}15`, display: "flex", alignItems: "baseline", gap: 10 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 13, background: phaseCol, color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{phase.num}</span>
                            <div>
                              <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{phase.title}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#8E8E93", marginLeft: 8 }}>{phase.period}</span>
                            </div>
                          </div>
                          <div style={{ padding: "16px 20px" }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 14px", lineHeight: 1.7 }}>
                              <span style={{ fontWeight: 700 }}>{ui.matchcheck.goalLabel}</span>{phase.ziel}
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                              {phase.items.map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: 3, background: phaseCol, flexShrink: 0, marginTop: 9 }} />
                                  <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{item}</span>
                                </div>
                              ))}
                            </div>

                            <div style={{ padding: "14px 16px", borderRadius: 10, background: `${phaseCol}06`, borderLeft: `4px solid ${phaseCol}` }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: phaseCol, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{ui.matchcheck.whatMatters}</p>
                              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: "0 0 8px", hyphens: "auto", WebkitHyphens: "auto" } as any} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{phase.fokus.intro}</p>
                              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                                {phase.fokus.bullets.map((b, bi) => (
                                  <li key={bi} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, marginBottom: 4, paddingLeft: 18, position: "relative" }}>
                                    <span style={{ position: "absolute", left: 0, top: 9, width: 6, height: 6, borderRadius: "50%", background: phaseCol, opacity: 0.7 }} />
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#C0C0C5" }}>
                  © {new Date().getFullYear()} bioLogic Talent Navigator · {ui.matchcheck.fitAnalysis} · {ui.matchcheck.createdAt} {new Date().toLocaleDateString(region === "IT" ? "it-IT" : region === "FR" ? "fr-FR" : region === "EN" ? "en-GB" : "de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </div>

            </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }} className="no-print">
              <button
                onClick={() => { narrativeCacheRef.current = {}; setReportGenerated(false); setLastInputHash(null); setAiNarrative(null); setAiError(null); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 20px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "#FFF", fontSize: 14, fontWeight: 600, color: "#6E6E73", cursor: "pointer" }}
                data-testid="button-reconfigure"
              >
                {ui.matchcheck.reconfigure}
              </button>
            </div>
          </div>
          );
        })()}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }
          [data-testid="print-report-card"] > div:nth-child(2) > div {
            animation: fadeSlideIn 0.5s ease both;
          }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(1) { animation-delay: 0.05s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(2) { animation-delay: 0.12s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(3) { animation-delay: 0.19s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(4) { animation-delay: 0.26s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(5) { animation-delay: 0.33s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(6) { animation-delay: 0.40s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(7) { animation-delay: 0.47s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(8) { animation-delay: 0.54s; }
          [data-testid="print-report-card"] > div:nth-child(2) > div:nth-child(9) { animation-delay: 0.61s; }
          .bio-section-head {
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          @media (prefers-reduced-motion: reduce) {
            [data-testid="print-report-card"] > div:nth-child(2) > div { animation: none !important; }
            .bio-bar-animate { transition: none !important; }
          }
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            p, li { orphans: 3; widows: 3; text-align: left !important; }
            h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
            [data-testid^="section-"], [data-testid^="impact-detail-"], [data-testid^="integration-phase-"] {
              break-inside: avoid; page-break-inside: avoid;
            }
            [data-testid="print-report-card"] > div:nth-child(2) > div { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
