import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Download, Loader2, ChevronLeft, ChevronDown, SlidersHorizontal, Zap, Compass, Triangle, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { dominanceModeOf, labelComponent } from "@/lib/jobcheck-engine";
import { computeSollIst, mapFuehrungsArt } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
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
const BAR_HEX = COMP_HEX;

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

function severityLabel(s: Severity) {
  if (s === "critical") return "kritisch";
  if (s === "warning") return "bedingt";
  return "passend";
}

function biggestGapText(rt: Triad, ct: Triad): string {
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  let maxGap = 0, maxKey: ComponentKey = "analytisch";
  for (const k of keys) {
    const g = Math.abs(rt[k] - ct[k]);
    if (g > maxGap) { maxGap = g; maxKey = k; }
  }
  return `Die deutlichste Abweichung liegt im Bereich ${COMP_LABELS[maxKey]} und betrifft damit genau den Anforderungsbereich, der für diese Stelle von zentraler Bedeutung ist.`;
}



function TriangleChart({ role, candidate }: { role: Triad; candidate: Triad }) {
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

        <text x={labelPts[0].x} y={labelPts[0].y - 4} textAnchor="middle" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>Analytisch</text>
        <text x={labelPts[1].x - 4} y={labelPts[1].y + 14} textAnchor="start" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>Intuitiv</text>
        <text x={labelPts[2].x + 4} y={labelPts[2].y + 14} textAnchor="end" style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.02em" }}>Impulsiv</text>
      </svg>
    </div>
  );
}

export default function SollIstBericht() {
  const [, setLocation] = useLocation();
  const [candidateName, setCandidateName] = useState("");
  const [candTriad, setCandTriad] = useState<{impulsiv: number; intuitiv: number; analytisch: number}>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });

  const updateCandTriad = useCallback((key: ComponentKey, newVal: number) => {
    setMatchCheckFit(undefined);
    setMatchCheckControl(undefined);
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
  const [roleName, setRoleName] = useState("");
  const [roleTriad, setRoleTriad] = useState<Triad | null>(null);
  const [hasRollenDna, setHasRollenDna] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const subCircleCache = useRef<Record<string, string>>({});
  const [profilvergleichOpen, setProfilvergleichOpen] = useState(true);
  const [systemwirkungOpen, setSystemwirkungOpen] = useState(true);
  const [fuehrungsArt, setFuehrungsArt] = useState<FuehrungsArt>("keine");
  const [matchCheckFit, setMatchCheckFit] = useState<string | undefined>(undefined);
  const [matchCheckControl, setMatchCheckControl] = useState<string | undefined>(undefined);

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

    const savedFit = localStorage.getItem("jobcheckOverallFit");
    if (savedFit) setMatchCheckFit(savedFit);
    const savedControl = localStorage.getItem("jobcheckControlIntensity");
    if (savedControl) setMatchCheckControl(savedControl);
  }, []);

  const candidateProfile = candTriad;
  const candDom = dominanceModeOf(candidateProfile);

  const result: SollIstResult | null = useMemo(() => {
    if (!roleTriad || !reportGenerated) return null;
    return computeSollIst(roleName, candidateName || "Person", roleTriad, candidateProfile, fuehrungsArt, matchCheckFit, matchCheckControl);
  }, [roleTriad, roleName, candidateName, candidateProfile.impulsiv, candidateProfile.intuitiv, candidateProfile.analytisch, reportGenerated, fuehrungsArt, matchCheckFit, matchCheckControl]);

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
      alert("PDF-Export fehlgeschlagen. Bitte versuchen Sie es erneut.");
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <GlobalNav />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-950 mb-3">Keine Rollen-DNA vorhanden</h2>
          <p className="text-sm text-slate-600 mb-6 leading-6">
            Bitte erstellen Sie zuerst eine Stellenanalyse, um den Soll-Ist-Bericht generieren zu können.
          </p>
          <button
            onClick={() => setLocation("/rollen-dna")}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            data-testid="button-go-to-rolle"
          >
            Zur Stellenanalyse
          </button>
        </div>
      </div>
    );
  }

  const roleProfile = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => ({
    label: labelComponent(k),
    value: roleTriad[k],
    hex: BAR_HEX[k],
    key: k,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <GlobalNav />

      {!reportGenerated && (
        <div style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 8999 }}>
          <div className="dark:!bg-background" style={{ background: "#F1F5F9", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "5px 0 10px", minHeight: 62 }}>
            <div className="w-full mx-auto px-6" style={{ maxWidth: 1100 }}>
              <div className="text-center">
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }} data-testid="text-matchcheck-title">
                  Passungsanalyse konfigurieren
                </h1>
                <p style={{ fontSize: 13, color: "#8E8E93", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="text-matchcheck-subtitle">
                  Vergleichen Sie das Stellenprofil mit dem Personenprofil, um die strukturelle Passung für diese Stelle zu analysieren.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto px-6" style={{ maxWidth: 1100, paddingTop: !reportGenerated ? 135 : 40, paddingBottom: 40 }}>

        {/* === INPUT: Slider area before report === */}
        {!reportGenerated && (<>
          <div style={{ background: "#FFFFFF", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 32 }}>
            <button
              onClick={() => setProfilvergleichOpen(!profilvergleichOpen)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              data-testid="button-toggle-profilvergleich"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SlidersHorizontal style={{ width: 22, height: 22, color: "#34C759", flexShrink: 0 }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>
                  Profilvergleich
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profilvergleichOpen ? "rotate-180" : ""}`} />
            </button>

            {profilvergleichOpen && (<div style={{ padding: "0 32px 32px" }}>
            <div className="grid gap-6 grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="card-soll-profil">
                <p className="text-base font-semibold text-slate-900 mb-6">Soll-Profil <span className="font-normal text-slate-500">(Stelle)</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {roleProfile.map(item => {
                    const hex = item.hex;
                    const widthPct = (item.value / 67) * 100;
                    const isSmall = widthPct < 18;
                    return (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, height: 26 }}>
                        <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0, lineHeight: "26px" }}>
                          {item.label}
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
                            transition: "width 600ms ease",
                            display: "flex", alignItems: "center", paddingLeft: 10,
                            minWidth: isSmall ? 8 : 50,
                          }}>
                            {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap", lineHeight: "26px" }}>{Math.round(item.value)} %</span>}
                          </div>
                          {isSmall && (
                            <span style={{
                              position: "absolute", top: "50%", transform: "translateY(-50%)",
                              left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`,
                              fontSize: 13, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                              transition: "left 600ms ease", lineHeight: "26px",
                            }}>{Math.round(item.value)} %</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="card-ist-profil">
                <p className="text-base font-semibold text-slate-900 mb-6">Ist-Profil <span className="font-normal text-slate-500">(Person)</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                    const val = candTriad[k];
                    const hex = BAR_HEX[k];
                    const pct = val;
                    const widthPct = (val / 67) * 100;
                    const isSmall = widthPct < 18;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, height: 26 }} data-testid={`slider-row-${k}`}>
                        <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0, lineHeight: "26px" }}>
                          {labelComponent(k)}
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

            <div className="mt-8 flex items-center justify-end">
              <button
                onClick={() => setReportGenerated(true)}
                data-testid="button-generate-report"
                style={{
                  height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                  borderRadius: 14, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(0,113,227,0.3)", transition: "all 200ms ease",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)"; }}
              >
                Bericht erstellen
              </button>
            </div>
            </div>)}
          </div>

          {(() => {
            const effective = result || (roleTriad ? computeSollIst(roleName, candidateName || "Person", roleTriad, candidateProfile, fuehrungsArt, matchCheckFit, matchCheckControl) : null);
            if (!effective) return null;

            const fitLabel = effective.fitLabel;
            const fitColor = bioFitColor(fitLabel);

            let shortFazit: string;
            if (fitLabel === "Geeignet") {
              shortFazit = "Arbeitsweise der Person passt zur Stelle";
            } else if (fitLabel === "Bedingt geeignet") {
              shortFazit = "Arbeitsweise der Person passt teilweise zur Stelle";
            } else {
              shortFazit = "Arbeitsweise der Person passt nicht zur Stelle";
            }

            const devLevel = effective.developmentLevel;
            const devScore = devLevel >= 4 ? 3 : devLevel >= 3 ? 2 : 1;
            const devGaugeColor = devScore === 3 ? "#34C759" : devScore === 2 ? "#E5A832" : "#D64045";
            const devShort = devScore === 3 ? "Gute Aussichten · Wenig Aufwand" : devScore === 2 ? "Machbar · Gezielte Führung nötig" : "Hoher Aufwand · Ergebnis unsicher";

            const bulletCol = fitLabel === "Geeignet" ? "#34C759" : fitLabel === "Bedingt geeignet" ? "#FF9500" : "#D64045";

            let kritischLabel: string;
            const kritischBullets: string[] = [];
            if (fitLabel === "Geeignet") {
              kritischLabel = "Stärken";
              kritischBullets.push("Arbeitsweise stimmt überein");
              kritischBullets.push("Entscheidungslogik passt");
              kritischBullets.push("Tempo und Struktur kompatibel");
            } else if (fitLabel === "Bedingt geeignet") {
              kritischLabel = "Auffällig";
              kritischBullets.push("Arbeitsweise weicht teilweise ab");
              kritischBullets.push("Entscheidungslogik unterschiedlich");
              kritischBullets.push("Tempo / Struktur nicht deckungsgleich");
            } else {
              kritischLabel = "Kritisch";
              kritischBullets.push("Arbeitsweise weicht deutlich ab");
              kritischBullets.push("Entscheidungslogik passt nicht");
              kritischBullets.push("Tempo / Struktur nicht kompatibel");
            }

            const auswirkungBullets: string[] = [];
            if (fitLabel === "Geeignet") {
              auswirkungBullets.push("Reibungslose Zusammenarbeit");
              auswirkungBullets.push("Stabiles Teamgefüge");
              auswirkungBullets.push("Geringer Führungsaufwand");
            } else if (fitLabel === "Bedingt geeignet") {
              auswirkungBullets.push("Mehr Abstimmung nötig");
              auswirkungBullets.push("Leichtes Spannungspotenzial");
              auswirkungBullets.push("Erhöhter Führungsaufwand");
            } else {
              auswirkungBullets.push("Deutlich mehr Abstimmung nötig");
              auswirkungBullets.push("Konfliktpotenzial im Team");
              auswirkungBullets.push("Hoher Führungsaufwand");
            }

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
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    data-testid="button-toggle-systemwirkung"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Zap style={{ width: 22, height: 22, color: "#34C759", flexShrink: 0 }} />
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>
                        MatchCheck: {roleName || "Stelle"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${systemwirkungOpen ? "rotate-180" : ""}`} />
                  </button>

                  {systemwirkungOpen && (
                  <div style={{ padding: "0 32px 28px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 7, background: fitColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 15, fontWeight: 700, color: fitColor }} data-testid="text-summary-fit">{fitLabel}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#6E6E73", margin: 0 }} data-testid="text-summary-fazit">{shortFazit}</p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Entwicklungsaufwand</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <div style={{ display: "flex", gap: 5, flex: 1 }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} style={{ flex: 1, height: 12, borderRadius: 4, background: i < devScore ? devGaugeColor : "rgba(0,0,0,0.08)" }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: devGaugeColor, flexShrink: 0 }}>{devScore === 3 ? "niedrig" : devScore === 2 ? "mittel" : "hoch"}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }} data-testid="text-dev-short">{devShort}</p>
                      </div>

                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>{kritischLabel}</p>
                        {kritischBullets.map((b, i) => (
                          <BulletItem key={i} text={b} color={bulletCol} />
                        ))}
                      </div>

                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.02)" }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>Auswirkung</p>
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
              <div data-subhead-line style={{ width: 36, height: 2.5, borderRadius: 2, background: color, marginTop: 4, marginLeft: num != null ? 34 : 0, opacity: 0.7 }} />
            </div>
          );

          return (
          <div ref={reportRef} style={{ maxWidth: 820, margin: "0 auto" }} data-testid="print-report-wrapper">
            <button
              onClick={() => { setReportGenerated(false); window.scrollTo(0, 0); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
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
              Zurück zum MatchCheck
            </button>
            <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }} data-testid="print-report-card">

              {/* ─── DARK HEADER ─── */}
              <div data-pdf-block className="report-header" data-testid="section-header">

                <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />

                <button
                  onClick={exportPdf}
                  disabled={isExportingPdf}
                  data-testid="button-export-pdf"
                  className="report-pdf-btn"
                  style={{ cursor: isExportingPdf ? "wait" : "pointer", opacity: isExportingPdf ? 0.6 : 1, transition: "all 0.15s ease" }}
                >
                  {isExportingPdf ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> : <Download style={{ width: 15, height: 15 }} />}
                  <span>PDF</span>
                </button>

                <div className="report-kicker">PASSUNGSANALYSE</div>
                <h1 className="report-title" data-testid="text-page-title">MatchCheck</h1>
                <div className="report-subtitle">{result.roleName}</div>

                <div className="report-rings" />
              </div>

              {/* ─── EXECUTIVE DECISION CONTENT (weißer Hintergrund) ─── */}
              <div style={{ padding: "28px 44px 0" }}>
                <p data-pdf-block style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 16px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-einleitung">
                  Diese Passungsanalyse zeigt, wie gut Person und Position in ihrer Arbeitslogik zusammenpassen. Sie macht sichtbar, wo Übereinstimmungen bestehen, wo Abweichungen entstehen und welcher Führungs- oder Entwicklungsaufwand daraus im Alltag zu erwarten ist.
                </p>
                <div data-pdf-block style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                    Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.
                  </p>
                </div>
                <SectionHead num={1} title="Gesamtbewertung" />
                {(() => {
                  const cCol = bioControlColor(result.controlIntensity);
                  const cLabel = result.controlIntensity === "hoch" ? "Hoch" : result.controlIntensity === "mittel" ? "Mittel" : "Gering";
                  const devLevel = result.developmentLevel;
                  const devScore = devLevel >= 4 ? 3 : devLevel >= 3 ? 2 : 1;
                  const devLabel = devScore === 3 ? "niedrig" : devScore === 2 ? "mittel" : "hoch";
                  const devCol = devScore === 3 ? BIO_COLORS.geeignet : devScore === 2 ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
                  const gapCol = result.totalGap > 40 ? BIO_COLORS.nichtGeeignet : result.totalGap > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet;
                  const personLabel = result.candidateName !== "Die Person" ? result.candidateName : "Person";

                  const gesamtIntroText = (() => {
                    const fr = result.fitRating;
                    const ci = result.controlIntensity;
                    const gl = result.gapLevel;
                    const dl = result.developmentLabel;

                    if (fr === "GEEIGNET") {
                      if (ci === "gering" && gl === "gering") {
                        return "Die Gesamtbewertung spricht für eine sehr gute Passung. Die strukturelle Übereinstimmung ist hoch, der Steuerungs- und Entwicklungsaufwand gering. Die Besetzung kann ohne besondere Maßnahmen erfolgen.";
                      }
                      if (ci === "mittel" || gl === "mittel") {
                        return "Die Gesamtbewertung spricht für eine gute Passung. Die strukturelle Übereinstimmung ist gegeben, der Steuerungs- und Entwicklungsaufwand überschaubar. Eine erfolgreiche Besetzung ist mit geringem Führungsaufwand realistisch.";
                      }
                      return "Die Gesamtbewertung spricht für eine solide Passung. Die Arbeitslogik stimmt grundsätzlich überein. Der Entwicklungsaufwand ist begrenzt und die Besetzung kann mit normalem Führungsaufwand gelingen.";
                    }

                    if (fr === "BEDINGT") {
                      if (ci === "hoch" || dl === "hoch") {
                        return "Die Gesamtbewertung spricht für eine eingeschränkte Passung. Die strukturelle Abweichung ist spürbar, der Steuerungs- und Entwicklungsaufwand erhöht. Eine erfolgreiche Besetzung erfordert gezielte Führung und regelmäßige Abstimmung.";
                      }
                      if (gl === "gering") {
                        return "Die Gesamtbewertung spricht für eine bedingte Passung. Die Profilabweichung ist gering, doch die Arbeitslogik unterscheidet sich in einzelnen Bereichen. Mit gezielter Führung ist eine erfolgreiche Besetzung realistisch.";
                      }
                      return "Die Gesamtbewertung spricht für eine bedingte Passung. Die Arbeitslogik stimmt teilweise überein, in einzelnen Bereichen bestehen jedoch relevante Abweichungen. Eine erfolgreiche Besetzung ist mit bewusster Führung und klarer Erwartungshaltung möglich.";
                    }

                    if (ci === "hoch" && (gl === "hoch" || dl === "hoch")) {
                      return "Die Gesamtbewertung spricht für eine kritische Passung. Die strukturelle Abweichung ist deutlich, der Steuerungs- und Entwicklungsaufwand entsprechend hoch. Eine erfolgreiche Besetzung wäre nur unter klarer Führung und mit bewusstem Integrationsaufwand realistisch.";
                    }
                    if (ci === "mittel") {
                      return "Die Gesamtbewertung spricht für eine unzureichende Passung. Die Arbeitslogik weicht in wesentlichen Bereichen ab. Selbst mit intensiver Führung und Entwicklungsmaßnahmen bleibt das Risiko einer Fehlbesetzung erheblich.";
                    }
                    return "Die Gesamtbewertung spricht für eine kritische Passung. Die strukturelle Abweichung ist erheblich und der erforderliche Führungs- und Entwicklungsaufwand sehr hoch. Eine Besetzung ist unter diesen Voraussetzungen mit hohem Risiko verbunden.";
                  })();

                  return (
                    <>
                      <p data-pdf-block style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 22px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-gesamt-intro">
                        {gesamtIntroText}
                      </p>
                      {/* SYSTEMSTATUS */}
                      <div data-pdf-block style={{ marginBottom: 22 }} data-testid="section-systemstatus">
                        <div style={{ display: "flex", gap: 10 }}>
                          {[
                            { label: "Grundpassung", value: result.fitLabel, color: fitCol },
                            { label: "Führungsaufwand", value: cLabel, color: cCol },
                            { label: "Profilabweichung", value: result.gapLevel, color: gapCol },
                            { label: "Entwicklungsaufwand", value: devLabel, color: devCol },
                          ].map(m => {
                            const bg = `linear-gradient(135deg, ${m.color}10 0%, ${m.color}06 100%)`;
                            return (
                              <div key={m.label} style={{ flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: 10, background: bg, border: `1px solid ${m.color}18` }}>
                                <div style={{ fontSize: 10, color: "#1D1D1F", marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: m.color }} data-testid={`status-${m.label.toLowerCase().replace(/\s/g, "-")}`}>{m.value}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

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
                            <SubHead title="Kurzübersicht" color={fitCol} />
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 16 }}>
                              <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>Stelle</p>
                                <div style={{ display: "inline-flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                  {roleKeys.map(k => (
                                    <div key={k} style={{ padding: "10px 20px", borderRadius: 20, background: `${BAR_HEX[k]}14`, border: `1px solid ${BAR_HEX[k]}30` }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: BAR_HEX[k] }}>{COMP_LABELS[k]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0, marginTop: roleKeys.length > 1 ? roleKeys.length * 14 + 4 : 18, width: 36, height: 36, borderRadius: "50%", background: `${matchColor}14`, border: `2px solid ${matchColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: matchColor, lineHeight: 1 }}>{matchSymbol}</span>
                              </div>
                              <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>Person</p>
                                <div style={{ display: "inline-flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                  {candKeys.map(k => (
                                    <div key={k} style={{ padding: "10px 20px", borderRadius: 20, background: `${BAR_HEX[k]}14`, border: `1px solid ${BAR_HEX[k]}30` }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: BAR_HEX[k] }}>{COMP_LABELS[k]}</span>
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
                        <SubHead num={1} title="Auswirkung im Arbeitsalltag" color={fitCol} />
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                          {result.dominanceShiftText.split(/\n\n+/)[0]}
                        </p>
                      </div>

                      {/* MANAGEMENTKURZFAZIT */}
                      <div data-pdf-block style={{ marginBottom: 22 }} data-testid="section-fazit">
                        <SubHead num={2} title="Managementkurzfazit" color={fitCol} />
                        <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-summary-fazit">
                          {result.summaryText.split(/\n\n+/)[0]}
                        </p>
                      </div>

                      {/* WARUM / RISIKEN compact */}
                      {(result.executiveBullets.length > 0 || result.constellationRisks.length > 0) && (
                        <div data-pdf-block style={{ marginBottom: 0 }} data-testid="section-executive-bullets">
                          {result.executiveBullets.length > 0 && (
                            <div style={{ marginBottom: result.constellationRisks.length > 0 ? 14 : 0 }}>
                              <SubHead num={3} title="Warum dieses Ergebnis" color={fitCol} />
                              {result.executiveBullets.map((b, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: 3, background: fitCol, flexShrink: 0 }} />
                                  <span style={{ fontSize: 14, lineHeight: 1.6, color: "#48484A" }}>{b}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {result.constellationRisks.length > 0 && (
                            <div>
                              <SubHead num={4} title="Risiken dieser Konstellation" color={BIO_COLORS.nichtGeeignet} />
                              {result.constellationRisks.map((r, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: 3, background: BIO_COLORS.nichtGeeignet, flexShrink: 0 }} />
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

              <div data-pdf-block style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-comparison-bars">
                <SectionHead num={2} title="Vergleich der Profile" />
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 20px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  {biggestGapText(result.roleTriad, result.candTriad)}
                </p>
                <div className="grid gap-6 grid-cols-2" style={{ marginBottom: 14 }}>
                  <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #fafbfd, #f5f7fb)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>Soll-Profil <span style={{ fontWeight: 400, color: "#8E8E93" }}>(Stelle)</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                        const val = Math.round(roleTriad![k]);
                        const hex = BAR_HEX[k];
                        const widthPct = (val / 67) * 100;
                        const isSmall = widthPct < 18;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>{labelComponent(k)}</span>
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
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>Ist-Profil <span style={{ fontWeight: 400, color: "#8E8E93" }}>(Person)</span></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
                        const val = Math.round(candidateProfile[k]);
                        const hex = BAR_HEX[k];
                        const widthPct = (val / 67) * 100;
                        const isSmall = widthPct < 18;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>{labelComponent(k)}</span>
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
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#48484A", margin: "0 0 12px" }}>Bedeutung der Komponenten</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {([
                      { key: "impulsiv", label: "Impulsiv", color: BAR_HEX.impulsiv, text: "Steht für zügiges Handeln, klare Prioritäten und konsequente Umsetzung.", warning: "Fehlt dieser Anteil, werden Entscheidungen verzögert und Chancen nicht genutzt." },
                      { key: "analytisch", label: "Analytisch", color: BAR_HEX.analytisch, text: "Sichert Struktur, Sorgfalt und nachvollziehbare Abläufe.", warning: "Fehlt dieser Anteil, entstehen Fehler in Planung, Kalkulation und Dokumentation." },
                      { key: "intuitiv", label: "Intuitiv", color: BAR_HEX.intuitiv, text: "Unterstützt das Erkennen von Bedürfnissen und die passende Abstimmung im Team.", warning: "Fehlt dieser Anteil, leidet die Zusammenarbeit und Vertrauen sinkt." },
                    ] as const).map(kb => (
                      <div key={kb.key} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ flex: 1, padding: "14px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${kb.color}12, ${kb.color}06)`, border: `1px solid ${kb.color}20`, display: "flex", flexDirection: "column" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: kb.color, marginBottom: 8, display: "block" }}>{kb.label}</span>
                            <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                              {kb.text}
                            </p>
                          </div>
                          <div style={{ width: "100%", height: 2, background: kb.color, margin: "10px 0", borderRadius: 1, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                            {kb.warning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div data-pdf-block style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-impact-matrix">
                <SectionHead num={3} title="Wirkung der Besetzung im Arbeitsalltag" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.impactAreas.map((area, areaIdx) => {
                    const sevCol = area.severity === "critical" ? "#FF3B30" : area.severity === "warning" ? "#FF9500" : "#34C759";
                    return (
                      <div key={area.id} data-testid={`impact-detail-${area.id}`}>
                        <div style={{ padding: "14px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <SubHead num={areaIdx + 1} title={area.label} color={sevCol} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: sevCol, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{severityLabel(area.severity)}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#1D1D1F", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Stelle verlangt</p>
                              <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{area.roleNeed}</p>
                            </div>
                            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#1D1D1F", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Person bringt mit</p>
                              <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{area.candidatePattern}</p>
                            </div>
                          </div>
                          <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, color: "#48484A", wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{area.risk}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div data-pdf-block style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-stress-behavior">
                <SectionHead num={4} title="Verhalten unter Druck" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "#FF950008", border: "1px solid #FF950018", overflow: "visible" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <AlertCircle style={{ width: 14, height: 14, color: "#FF9500", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Kontrollierter Druck</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{result.stressBehavior.controlledPressure}</p>
                  </div>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "#FF3B3008", border: "1px solid #FF3B3018", overflow: "visible" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#FF3B30", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#FF3B30", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Unkontrollierter Stress</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{result.stressBehavior.uncontrolledStress}</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "14px 0 0", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.
                </p>
              </div>

              <div data-pdf-block style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-risk-timeline">
                <SectionHead num={5} title="Risikoprognose" />
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
                            <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{phase.text}</p>
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
                if (rFitLabel === "Geeignet") {
                  rFazit = "Die Arbeitsweise der Person passt gut zu den Anforderungen der Stelle. Aufgaben, Entscheidungen und Arbeitsstil stimmen weitgehend überein.";
                } else if (rFitLabel === "Bedingt geeignet" && rGapLevel === "gering") {
                  rFazit = "Die Grundausrichtung ist ähnlich, jedoch unterscheidet sich die Gewichtung einzelner Arbeitsbereiche. Im Alltag kann das zu erhöhtem Abstimmungsbedarf und höherem Führungsaufwand führen.";
                } else if (rFitLabel === "Bedingt geeignet") {
                  rFazit = "Die Grundausrichtung ist ähnlich. In einzelnen Bereichen zeigt sich jedoch spürbarer Anpassungsbedarf. Im Alltag kann das zu Konflikten im Team und deutlich höherem Führungsaufwand führen.";
                } else if (rFitLabel === "Nicht geeignet" && rGapLevel !== "hoch") {
                  rFazit = "Die strukturelle Abweichung zwischen Stelle und Person ist deutlich. Im Alltag kann das zu erhöhtem Abstimmungsbedarf, Konflikten im Team und deutlich höherem Führungsaufwand führen.";
                } else {
                  rFazit = "Die Anforderungen der Stelle und die Arbeitsweise der Person unterscheiden sich deutlich. Im Alltag kann das zu erhöhtem Abstimmungsbedarf, Konflikten im Team und deutlich höherem Führungsaufwand führen.";
                }

                const rDevLevel = result.developmentLevel;
                const rDev = rDevLevel >= 4 ? 3 : rDevLevel >= 3 ? 2 : 1;
                const rDevLabel = result.developmentLabel === "hoch" ? "Gute Aussichten, wenig Aufwand" : result.developmentLabel === "mittel" ? "Machbar, braucht gezielte Führung" : "Hoher Aufwand, Ergebnis unsicher";
                const rGaugeCol = rDev === 3 ? "#34C759" : rDev === 2 ? "#E5A832" : "#D64045";

                return (
                  <div data-pdf-block style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-development">
                    <SectionHead num={6} title="Gesamtbewertung" />

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: rFitColor, flexShrink: 0, boxShadow: `0 0 0 3px ${rFitColor}20` }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{result.roleName}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: rFitColor }}>
                        {rFitLabel}
                      </span>
                    </div>

                    <div style={{ background: `${rFitColor}08`, borderLeft: `3px solid ${rFitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 22 }}>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{rFazit}</p>
                    </div>

                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
                      Entwicklungsprognose
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>
                      {rDev} von 3 <span style={{ fontWeight: 400, fontSize: 14, color: "#48484A" }}>{rDevLabel}</span>
                    </p>
                    <div style={{ display: "flex", gap: 5, marginBottom: 16 }} data-testid="gauge-development">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 10, borderRadius: 3, background: i < rDev ? rGaugeCol : "rgba(0,0,0,0.08)" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, wordBreak: "break-word", overflowWrap: "break-word", hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{result.developmentText}</p>

                    <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: `${rFitColor}08`, border: `1px solid ${rFitColor}18` }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Managementeinschätzung</p>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                        {rFitLabel === "Geeignet"
                          ? "Die Arbeitsweise der Person und die Stellenanforderungen stimmen gut überein. Eine stabile Besetzung ist ohne erhöhten Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung empfohlen."
                          : rFitLabel === "Bedingt geeignet"
                          ? "Die Arbeitsweise der Person weicht in einzelnen Bereichen von den Stellenanforderungen ab. Eine stabile Besetzung ist mit gezielter Führung und regelmässiger Rückmeldung möglich. Aus Managementsicht ist diese Besetzung unter Voraussetzungen vertretbar."
                          : "Die strukturelle Abweichung zwischen Stelle und Person ist deutlich. Eine stabile Besetzung wäre nur mit dauerhaft erhöhtem Führungsaufwand möglich. Aus Managementsicht wird diese Besetzung nicht empfohlen."}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {result.integrationsplan && (
                <div data-pdf-block style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-integrationsplan">
                  <SectionHead num={7} title="30-Tage-Integrationsplan" />
                  <div style={{ position: "relative", paddingLeft: 28 }}>
                    <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "rgba(0,0,0,0.08)", borderRadius: 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {result.integrationsplan.map(phase => {
                        const phaseCol = phase.num === 1 ? "#0071E3" : phase.num === 2 ? "#F39200" : "#34C759";
                        return (
                          <div key={phase.num} style={{ position: "relative" }} data-testid={`integration-phase-${phase.num}`}>
                            <div style={{ position: "absolute", left: -22, top: 14, width: 10, height: 10, borderRadius: 5, background: phaseCol, boxShadow: `0 0 0 3px ${phaseCol}20` }} />
                            <div style={{ padding: "14px 18px", borderRadius: 12, background: `${phaseCol}06`, border: `1px solid ${phaseCol}15` }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: phaseCol, margin: "0 0 4px" }}>
                                Phase {phase.num}: {phase.title} <span style={{ fontWeight: 500, color: "#8E8E93" }}>({phase.period})</span>
                              </p>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#48484A", margin: "0 0 10px" }}>Ziel: {phase.ziel}</p>

                              <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Massnahmen</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                                {phase.items.map((item, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                    <div style={{ width: 5, height: 5, borderRadius: 3, background: phaseCol, flexShrink: 0, marginTop: 7 }} />
                                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85 }}>{item}</span>
                                  </div>
                                ))}
                              </div>

                              <div style={{ padding: "10px 14px", borderRadius: 8, background: `${phaseCol}08`, borderLeft: `3px solid ${phaseCol}40` }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: phaseCol, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Integrationsfokus</p>
                                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 6px", hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">{phase.fokus.intro}</p>
                                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                                  {phase.fokus.bullets.map((b, bi) => (
                                    <li key={bi} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, marginBottom: 3, paddingLeft: 16, position: "relative" }}>
                                      <span style={{ position: "absolute", left: 0, top: 8, width: 6, height: 6, borderRadius: "50%", background: phaseCol }} />
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
                </div>
              )}

              {(() => {
                const fDevLevel = result.developmentLevel;
                const fDev = fDevLevel >= 4 ? 3 : fDevLevel >= 3 ? 2 : 1;
                const fDevCol = fDev === 3 ? "#34C759" : fDev === 2 ? "#E5A832" : "#D64045";
                const fDevLabel = result.developmentLabel === "hoch" ? "Entwicklung sehr wahrscheinlich" : result.developmentLabel === "mittel" ? "Entwicklung mit Unterstützung möglich" : "Entwicklung unwahrscheinlich";
                return (
                  <div data-pdf-block data-testid="section-final-assessment" style={{ padding: "28px", borderRadius: 16, background: `linear-gradient(135deg, ${fitCol}08, ${fitCol}03)`, border: `1px solid ${fitCol}15`, boxShadow: `0 4px 20px ${fitCol}08` }}>
                    <SectionHead num={result.integrationsplan ? 8 : 7} title="Schlussbewertung" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                      <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Grundpassung</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 5, background: fitCol, boxShadow: `0 0 0 3px ${fitCol}20` }} />
                          <span style={{ fontSize: 16, fontWeight: 700, color: fitCol }}>{result.fitLabel}</span>
                        </div>
                      </div>
                      <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Entwicklungsprognose</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: fDevCol, margin: "0 0 10px" }}>{fDevLabel}</p>
                        <div style={{ display: "flex", gap: 4, maxWidth: 100, margin: "0 auto" }}>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < fDev ? fDevCol : "rgba(0,0,0,0.06)" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, wordBreak: "break-word", overflowWrap: "break-word", hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-final-rating-text">{result.finalText}</p>
                  </div>
                );
              })()}

              <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={logoPath} alt="bioLogic" style={{ height: 28, opacity: 0.35 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#C0C0C5", letterSpacing: "0.02em" }}>Passungsanalyse</span>
                </div>
                <span style={{ fontSize: 11, color: "#C0C0C5" }}>
                  {new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>

            </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }} className="no-print">
              <button
                onClick={() => setReportGenerated(false)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 20px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "#FFF", fontSize: 14, fontWeight: 600, color: "#6E6E73", cursor: "pointer" }}
                data-testid="button-reconfigure"
              >
                Profil anpassen
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
