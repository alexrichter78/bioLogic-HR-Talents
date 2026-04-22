import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { useRegion, localizeDeep } from "@/lib/region";
import { useIsMobile } from "@/hooks/use-mobile";
import { computeTeamCheckV4, type TeamCheckV4Result, type TeamCheckV4Input, type V4Block } from "@/lib/teamcheck-v4-engine";
import { ArrowLeft, Download, Loader2, Printer, AlertTriangle } from "lucide-react";
import { BIO_COLORS, COMP_HEX } from "@/lib/bio-design";
import type { ComponentKey } from "@/lib/bio-types";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

const bewColor = (b: string) => {
  if (b === "Sehr passend" || b === "Gut passend" || b === "Strong fit" || b === "Good fit") return BIO_COLORS.geeignet;
  if (b === "Kritisch" || b === "Critical" || b === "Functionally interesting, culturally risky" || b === "Inhaltlich interessant, kulturell riskant" || b === "High friction, limited added value" || b === "Spannungsreich bei begrenztem Zusatznutzen") return BIO_COLORS.nichtGeeignet;
  return BIO_COLORS.bedingt;
};
const axisColor = (v: string) => v === "hoch" ? BIO_COLORS.geeignet : v === "mittel" ? BIO_COLORS.bedingt : v === "gering" ? BIO_COLORS.nichtGeeignet : "#94a3b8";
const makeAxisLabel = (region: string) => (v: string) => {
  const isEN = region === "EN";
  if (v === "hoch") return isEN ? "High" : "Hoch";
  if (v === "mittel") return isEN ? "Moderate" : "Mittel";
  if (v === "gering") return isEN ? "Low" : "Gering";
  return isEN ? "Not assessed" : "Nicht bewertbar";
};

function SectionHead({ num, title, id }: { num: number; title: string; id: string }) {
  return (
    <div id={`s-${id}`} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, paddingBottom: 12, borderBottom: "2px solid rgba(0,0,0,0.06)", scrollMarginTop: 80 }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: "#343A48", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{num}</div>
      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>{title}</span>
    </div>
  );
}

function SubHead({ num, title, color }: { num: number; title: string; color?: string }) {
  const c = color || "#0F3A6E";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ width: 24, height: 24, borderRadius: 12, background: c, color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{num}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", textDecoration: "underline", textUnderlineOffset: 3 }}>{title}</span>
    </div>
  );
}

const HIGHLIGHT_PREFIXES = [
  "Die Kernaussage", "Konkret bedeutet das", "Für die Praxis bedeutet das",
  "The key point", "In practice", "What this means",
];

function TextBlock({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((para, i) =>
        HIGHLIGHT_PREFIXES.some(p => para.startsWith(p)) ? (
          <div key={i} style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(0,0,0,0.02)", borderLeft: "3px solid #8E8E93", margin: "16px 0" }}>
            <p style={{ ...bodyText, margin: 0, fontWeight: 600, color: "#1D1D1F" }}>{para}</p>
          </div>
        ) : (
          <p key={i} style={bodyText}>{para}</p>
        )
      )}
    </>
  );
}

const bodyText: React.CSSProperties = { fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: "0 0 12px", textAlign: "justify", textAlignLast: "left", hyphens: "auto", WebkitHyphens: "auto" } as any;
const sectionStyle = { paddingBottom: 40, marginBottom: 72, borderBottom: "1px solid rgba(0,0,0,0.05)" } as const;



export default function TeamCheckReportV4() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { region } = useRegion();
  const isEN = region === "EN";
  const t = (de: string, en: string) => isEN ? en : de;
  const axisLabel = makeAxisLabel(region);
  const [result, setResult] = useState<TeamCheckV4Result | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<{
    fuehrungsprofil: string;
    teamdynamikAlltag: string;
    systemwirkung: string;
    kulturwirkung: string;
    chancen: string;
    risiken: string;
    systemfazit: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const narrativeCacheRef = useRef<Record<string, typeof aiNarrative>>({});

  useEffect(() => {
    const cached = narrativeCacheRef.current[region];
    if (cached) {
      setAiNarrative(cached);
      setAiLoading(false);
      const raw = sessionStorage.getItem("teamcheckV4Input");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as TeamCheckV4Input;
          const computed = computeTeamCheckV4({ ...parsed, lang: region === "FR" ? "fr" : region === "EN" ? "en" : "de" });
          setResult(localizeDeep(computed, region));
        } catch {}
      }
      return;
    }
    setAiNarrative(null);
    setAiLoading(true);
    const raw = sessionStorage.getItem("teamcheckV4Input");
    if (!raw) { navigate("/team-report"); return; }
    try {
      const parsed = JSON.parse(raw) as TeamCheckV4Input;
      const computed = computeTeamCheckV4({ ...parsed, lang: region === "FR" ? "fr" : region === "EN" ? "en" : "de" });
      setResult(localizeDeep(computed, region));

      const tp = parsed.teamProfile;
      const pp = parsed.personProfile;
      const gap = Math.round((Math.abs(tp.impulsiv - pp.impulsiv) + Math.abs(tp.intuitiv - pp.intuitiv) + Math.abs(tp.analytisch - pp.analytisch)) / 2);
      const devLevel = computed.begleitungsbedarf === "gering" ? 1 : computed.begleitungsbedarf === "mittel" ? 2 : 3;

      fetch("/api/generate-team-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            roleName: parsed.roleTitle || "",
            candidateName: parsed.candidateName || "",
            isLeadership: parsed.roleType === "fuehrung",
            teamGoal: parsed.teamGoal || null,
            roleLevel: parsed.roleLevel,
            taskStructure: parsed.taskStructure,
            workStyle: parsed.workStyle,
          },
          profiles: {
            person: { impulsiv: pp.impulsiv, intuitiv: pp.intuitiv, analytisch: pp.analytisch },
            team: { impulsiv: tp.impulsiv, intuitiv: tp.intuitiv, analytisch: tp.analytisch },
          },
          calculated: {
            gesamtpassung: computed.gesamteinschaetzung,
            gesamtpassungLabel: computed.gesamteinschaetzung,
            teamIstGap: gap,
            controlIntensity: computed.begleitungsbedarf,
            developmentLevel: devLevel,
            teamConstellationLabel: computed.teamKontext,
            istConstellationLabel: computed.gesamtbewertungText.substring(0, 120),
            teamGoalLabel: computed.teamGoalLabel || null,
          },
          region,
        }),
      })
        .then(r => r.json())
        .then(data => { if (data.error) { setAiError(data.error); } else { narrativeCacheRef.current[region] = data; setAiNarrative(data); } })
        .catch(err => setAiError(err.message))
        .finally(() => setAiLoading(false));
    } catch { navigate("/team-report"); }
  }, [navigate, region]);

  const exportPdf = useCallback(async () => {
    if (!result || isExportingPdf || !reportRef.current) return;
    setIsExportingPdf(true);
    let clone: HTMLElement | null = null;
    let pdfBtn: HTMLElement | null = null;
    let backBtn: HTMLElement | null = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const source = reportRef.current;
      pdfBtn = source.querySelector("[data-testid='button-export-pdf-v4']") as HTMLElement | null;
      backBtn = source.closest("[data-testid='v4-report-wrapper']")?.parentElement?.querySelector("[data-testid='button-back-v4']") as HTMLElement | null;
      if (pdfBtn) pdfBtn.style.display = "none";
      if (backBtn) backBtn.style.display = "none";

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
        ".bio-bar-animate, [data-testid='v4-report-wrapper'] > div > div"
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

      const kurzBox = clone.querySelector<HTMLElement>("[data-testid='v4-kurzuebersicht-dominanz']");
      if (kurzBox) {
        kurzBox.querySelectorAll<HTMLElement>("[data-pill]").forEach(pill => {
          pill.style.display = "table";
          pill.style.height = "40px";
          const span = pill.querySelector("span");
          if (span) {
            span.style.display = "table-cell";
            span.style.verticalAlign = "middle";
            span.style.textAlign = "center";
          }
        });
      }

      const cardEl = clone.firstElementChild as HTMLElement | null;
      if (cardEl) {
        cardEl.style.overflow = "visible";
        cardEl.style.borderRadius = "0";
        cardEl.style.background = "#FFFFFF";
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

      const safeName = (result.roleTitle || "TeamCheck").replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_");
      doc.save(`TeamCheck_${safeName}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert("PDF-Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      if (pdfBtn) pdfBtn.style.display = "";
      if (backBtn) backBtn.style.display = "";
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, result]);

  if (!result || aiLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 18px", border: "3px solid #E5E5E7", borderTopColor: "#0071E3", borderRadius: "50%", animation: "bio-spin 0.9s linear infinite" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>
              {region === "FR" ? "Génération de l'analyse d'équipe" : isEN ? "Generating team analysis" : "TeamCheck wird erstellt"}
            </h2>
            <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6 }}>
              {region === "FR"
                ? "Les textes sont générés sur la base du profil. Cela prend généralement 15 à 25 secondes."
                : isEN
                ? "We're writing the report based on the profile. This usually takes 15–25 seconds."
                : "Die Texte werden gerade auf Basis des Profils generiert. Das dauert in der Regel 15–25 Sekunden."}
            </p>
            <style>{`@keyframes bio-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      </div>
    );
  }

  const bCol = bewColor(result.gesamteinschaetzung);
  const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1D1D1F", lineHeight: 1.6 }} className="v4-report-page">
      <GlobalNav />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "64px 12px 80px" : "80px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }} className="no-print">
          <button onClick={() => navigate("/team-report")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#1A5DAB", fontWeight: 600, fontSize: 14, padding: 0 }} data-testid="button-back-v4">
            <ArrowLeft size={16} /> Zurück zum TeamCheck
          </button>
        </div>

        <div ref={reportRef} data-testid="v4-report-wrapper">
          <div style={{ position: "relative", background: "#F8F9FB", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

            <div data-pdf-block className="report-header report-header--auto" data-testid="v4-header">
              <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="report-kicker">TEAMANALYSE</div>
              <h1 className="report-title report-title--flow">Integrationsanalyse</h1>
              <div className="report-subtitle report-subtitle--flow">{result.roleTitle || "Teamsimulation"}</div>
              <div className="report-rings" />
              <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    const printWin = window.open("", "_blank");
                    if (!printWin) return;
                    const reportEl = reportRef.current;
                    if (!reportEl) return;
                    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                      .map(el => el.outerHTML).join("\n");
                    printWin.document.write(`<!DOCTYPE html><html lang="${isEN ? "en" : "de"}"><head><meta charset="utf-8"><title>TeamCheck \u2013 ${result.roleTitle || (isEN ? "Report" : "Bericht")}</title>${styles}<style>body{margin:0;padding:20px 0;background:#fff}
.report-header-btn,.no-print,nav{display:none!important}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
[data-pdf-block]{break-inside:avoid!important}
[data-testid="v4-section-integrationsplan"]>div:first-child{break-after:avoid!important}
[data-testid="v4-integration-phase-3"]{break-before:page!important}
[data-testid^="v4-section-"]{padding-bottom:14px!important;margin-bottom:24px!important}
[data-testid="v4-hero-bewertung"]{margin-bottom:14px!important}
[data-testid="v4-kurzuebersicht-dominanz"]{padding:14px 18px!important;margin-top:10px!important}
[data-testid="v4-kurzueberblick"]{margin-top:10px!important}
[data-testid="v4-integration-warnsignale"],[data-testid="v4-integration-leitfragen"],[data-testid="v4-integration-verantwortung"]{break-inside:avoid!important}
[data-pill]{white-space:nowrap!important}
</style></head><body class="v4-report-page">${reportEl.outerHTML}</body></html>`);
                    printWin.document.close();
                    setTimeout(() => {
                      printWin.print();
                    }, 600);
                  }}
                  data-testid="button-print-v4"
                  className="report-header-btn"
                  title={t("1:1 Qualität — im Druckdialog 'Als PDF speichern' wählen", "Print or save as PDF")}
                >
                  <Printer style={{ width: 15, height: 15 }} />
                  <span>{t("Drucken", "Print")}</span>
                </button>
              </div>
            </div>

            <div style={{ padding: "28px 32px 0" }}>
              {result.introText.split("\n\n").map((p, i, arr) => {
                if (i < arr.length - 1) {
                  return <p key={i} style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.85, margin: "0 0 8px" }} data-testid={`text-einleitung-v4${i === 0 ? "" : `-${i}`}`}>{p}</p>;
                }
                return (
                  <div key={i} data-pdf-block style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 24 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any}>
                      {p}
                    </p>
                  </div>
                );
              })}

              {/* === Section 1: Gesamtbewertung === */}
              <div style={sectionStyle} data-testid="v4-section-gesamtbewertung">
              <SectionHead num={1} title="Gesamtbewertung" id="gesamtbewertung" />

              <div style={{ margin: "0 0 24px" }} data-testid="v4-hero-bewertung">
                <TextBlock text={aiNarrative?.fuehrungsprofil || result.gesamtbewertungText} />

                <div data-pdf-block style={{ display: "flex", gap: 16, marginTop: 16, breakInside: "avoid" }} data-testid="v4-two-axis">
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${bCol}08`, border: `1px solid ${bCol}25` }} data-testid="v4-gesamt-card">
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{t("Gesamteinschätzung", "Overall assessment")}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: bCol }} data-testid="v4-gesamt-label">{result.gesamteinschaetzung}</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${axisColor(result.passungZumTeam)}08`, border: `1px solid ${axisColor(result.passungZumTeam)}25` }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{t("Passung zum Team", "Team fit")}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: axisColor(result.passungZumTeam) }} data-testid="v4-passung-team">{axisLabel(result.passungZumTeam)}</div>
                  </div>
                </div>

                {(() => {
                  const COMP_LABEL: Record<string, string> = isEN ? {
                    impulsiv: "Pace and Decision",
                    intuitiv: "Communication and Relationships",
                    analytisch: "Structure and Diligence",
                  } : {
                    impulsiv: "Umsetzung / Tempo",
                    intuitiv: "Zusammenarbeit / Kommunikation",
                    analytisch: "Struktur / Analyse",
                  };
                  const matchSymbol = result.sameDominance ? "=" : "⚡";
                  const matchColor = result.sameDominance ? "#34C759" : "#D64045";
                  return (
                    <div data-pdf-block style={{ marginTop: 16, padding: "20px 24px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", breakInside: "avoid" }} data-testid="v4-kurzuebersicht-dominanz">
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 16px", textAlign: "center" }}>{t("Kurzübersicht", "Overview")}</p>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 16 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Person</p>
                          <div data-pill style={{ padding: "0 20px", borderRadius: 20, background: `${COMP_HEX[result.personPrimary]}14`, border: `1px solid ${COMP_HEX[result.personPrimary]}30`, height: 40, lineHeight: "40px", textAlign: "center" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: COMP_HEX[result.personPrimary], lineHeight: "40px", verticalAlign: "middle" }}>{COMP_LABEL[result.personPrimary]}</span>
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, marginTop: 18, width: 36, height: 36, borderRadius: "50%", background: `${matchColor}14`, border: `2px solid ${matchColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: matchColor, lineHeight: 1 }}>{matchSymbol}</span>
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Team</p>
                          <div data-pill style={{ padding: "0 20px", borderRadius: 20, background: `${COMP_HEX[result.teamPrimary]}14`, border: `1px solid ${COMP_HEX[result.teamPrimary]}30`, height: 40, lineHeight: "40px", textAlign: "center" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: COMP_HEX[result.teamPrimary], lineHeight: "40px", verticalAlign: "middle" }}>{COMP_LABEL[result.teamPrimary]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div data-pdf-block style={{ display: "flex", gap: 16, marginTop: 16, breakInside: "avoid" }} data-testid="v4-kurzueberblick">
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{t("Stärke der Besetzung", "Key strength")}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="v4-hauptstaerke">{result.hauptstaerke}</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{t("Risiko der Besetzung", "Key risk")}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="v4-hauptabweichung">{result.hauptabweichung}</div>
                  </div>
                </div>
              </div>

              <div data-pdf-block style={{ padding: "12px 18px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", borderLeft: "3px solid #8E8E93", marginBottom: 20, breakInside: "avoid" }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#48484A", margin: 0, fontWeight: 600 }} data-testid="v4-team-kontext">{result.teamKontext}</p>
              </div>
            </div>
            </div>

            <div style={{ padding: "0 32px 48px" }}>

              {/* === Section 2: Vergleich der Profile === */}
              {(() => {
                const COMP_LABEL_FULL: Record<string, string> = isEN
                  ? { impulsiv: "Pace and Decision", intuitiv: "Communication and Relationships", analytisch: "Structure and Diligence" }
                  : { impulsiv: "Impulsiv", intuitiv: "Intuitiv", analytisch: "Analytisch" };
                const COMP_LABEL_AREA: Record<string, string> = isEN
                  ? { impulsiv: "Pace and Decision", intuitiv: "Communication and Relationships", analytisch: "Structure and Diligence" }
                  : { impulsiv: "Umsetzung / Tempo", intuitiv: "Zusammenarbeit / Kommunikation", analytisch: "Struktur / Analyse" };
                const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
                let maxGap = 0, maxKey: ComponentKey = "analytisch";
                for (const k of keys) {
                  const g = Math.abs(result.teamTriad[k] - result.personTriad[k]);
                  if (g > maxGap) { maxGap = g; maxKey = k; }
                }
                const gapText = isEN
                  ? `The largest gap between team and person is in the area of ${COMP_LABEL_AREA[maxKey]}. This is where the working approaches differ most.`
                  : `Die grösste Abweichung zwischen Team und Person liegt im Bereich ${COMP_LABEL_AREA[maxKey]}. Hier unterscheiden sich die Arbeitsweisen am stärksten.`;
                const renderBar = (k: ComponentKey, val: number) => {
                  const hex = COMP_HEX[k];
                  const widthPct = (val / 67) * 100;
                  const isSmall = widthPct < 18;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>{COMP_LABEL_FULL[k]}</span>
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
                };
                return (
                  <div style={sectionStyle} data-testid="v4-section-vergleich">
                    <SectionHead num={2} title={t("Vergleich der Profile", "Profile comparison")} id="vergleich" />
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 20px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any}>{gapText}</p>
                    <div data-pdf-block style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 14 }}>
                      <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #fafbfd, #f5f7fb)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>{t("Team-Profil", "Team profile")}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {keys.map(k => renderBar(k, Math.round(result.teamTriad[k])))}
                        </div>
                      </div>
                      <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #fafbfd, #f5f7fb)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", margin: "0 0 20px" }}>{t("Personen-Profil", "Person profile")}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {keys.map(k => renderBar(k, Math.round(result.personTriad[k])))}
                        </div>
                      </div>
                    </div>
                    <div data-pdf-block style={{ marginTop: 20, padding: "18px 20px", borderRadius: 12, background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#48484A", margin: "0 0 12px" }}>{t("Bedeutung der Komponenten", "What the dimensions mean")}</p>
                      <div style={{ display: "flex", gap: 12 }}>
                        {([
                          { key: "impulsiv" as ComponentKey, label: t("Impulsiv", "Pace and Decision"), color: COMP_HEX.impulsiv, text: t("Steht für zügiges Handeln, klare Prioritäten und konsequente Umsetzung.", "Drives pace, clear priorities and direct results.") },
                          { key: "analytisch" as ComponentKey, label: t("Analytisch", "Structure and Diligence"), color: COMP_HEX.analytisch, text: t("Sichert Struktur, Sorgfalt und nachvollziehbare Abläufe.", "Ensures structure, thoroughness and reliable processes.") },
                          { key: "intuitiv" as ComponentKey, label: t("Intuitiv", "Communication and Relationships"), color: COMP_HEX.intuitiv, text: t("Unterstützt das Erkennen von Bedürfnissen und die passende Abstimmung im Team.", "Supports collaboration, sensing needs and aligning the team.") },
                        ]).map(kb => (
                          <div key={kb.key} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ flex: 1, padding: "14px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${kb.color}12, ${kb.color}06)`, border: `1px solid ${kb.color}20`, display: "flex", flexDirection: "column" }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: kb.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>{kb.label}</span>
                                <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any}>{kb.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* === Section 3: Warum dieses Ergebnis entsteht === */}
              <div data-pdf-block style={sectionStyle} data-testid="v4-section-warum">
                <SectionHead num={3} title={t("Warum dieses Ergebnis entsteht", "Why this result occurs")} id="warum" />
                <TextBlock text={aiNarrative?.systemwirkung || result.warumText} />
              </div>

              {/* === Section 4: Wirkung im Arbeitsalltag === */}
              <div data-pdf-block style={sectionStyle} data-testid="v4-section-wirkung">
                <SectionHead num={4} title={t("Wirkung im Arbeitsalltag", "Day-to-day impact")} id="wirkung" />
                <TextBlock text={aiNarrative?.teamdynamikAlltag || result.wirkungAlltagText} />
              </div>

              {/* === Section 5: Chancen und Risiken === */}
              <div data-pdf-block style={sectionStyle} data-testid="v4-section-chancen-risiken">
                <SectionHead num={5} title={t("Chancen und Risiken dieser Besetzung", "Opportunities and risks")} id="chancen-risiken" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: "20px", borderRadius: 12, background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 11, background: "#1B7A3D", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>+</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1B7A3D" }}>{t("Chancen", "Opportunities")}</span>
                    </div>
                    {result.chancen.map((ch, i) => (
                      <div key={i} style={{ marginBottom: i < result.chancen.length - 1 ? 16 : 0, paddingBottom: i < result.chancen.length - 1 ? 16 : 0, borderBottom: i < result.chancen.length - 1 ? "1px solid rgba(52,199,89,0.12)" : "none" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{ch.title}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6E6E73", margin: 0 }}>{ch.text}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "20px", borderRadius: 12, background: "rgba(255,59,48,0.03)", border: "1px solid rgba(255,59,48,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 11, background: "#C41E3A", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>–</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#C41E3A" }}>{t("Risiken", "Risks")}</span>
                    </div>
                    {result.risiken.map((ri, i) => (
                      <div key={i} style={{ marginBottom: i < result.risiken.length - 1 ? 16 : 0, paddingBottom: i < result.risiken.length - 1 ? 16 : 0, borderBottom: i < result.risiken.length - 1 ? "1px solid rgba(255,59,48,0.08)" : "none" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{ri.title}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6E6E73", margin: 0 }}>{ri.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(0,0,0,0.02)", borderLeft: "3px solid rgba(0,0,0,0.08)" }}>
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, fontStyle: "italic" }} data-testid="v4-chancen-einordnung">{aiNarrative ? `${aiNarrative.chancen} ${aiNarrative.risiken}` : result.chancenRisikenEinordnung}</p>
                </div>
              </div>

              {/* === Section 5: Verhalten unter Druck === */}
              <div data-pdf-block style={sectionStyle} data-testid="v4-section-druck">
                <SectionHead num={6} title={t("Verhalten unter Druck", "Behaviour under pressure")} id="druck" />
                <TextBlock text={aiNarrative?.kulturwirkung || result.druckText} />
              </div>

              {/* === Section 6 (only Führungskraft): Führungshinweis === */}
              {result.fuehrungshinweis && (
                <div data-pdf-block style={sectionStyle} data-testid="v4-section-fuehrung">
                  <SectionHead num={7} title={t("Was als Führungskraft für dieses Team wichtig ist", "What matters in this leadership role")} id="fuehrung" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                    {result.fuehrungshinweis.map((item, i) => (
                      <div key={item.title} data-pdf-block style={{ padding: "18px 20px", borderRadius: 12, background: "#FFF", borderLeft: "3px solid #343A48", border: "1px solid rgba(0,0,0,0.06)", borderLeftWidth: 3, borderLeftColor: "#343A48", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }} data-testid={`v4-fuehrung-${i}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 11, background: "#343A48", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.35 }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6E6E73", margin: 0 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === 30-Tage-Integrationsplan === */}
              {(() => {
                const planNum = result.fuehrungshinweis ? 8 : 7;
                return (
                  <div style={sectionStyle} data-testid="v4-section-integrationsplan">
                    <SectionHead num={planNum} title={t("30-Tage-Integrationsplan", "30-day integration plan")} id="integrationsplan" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      {result.integrationsplan.map(phase => {
                        const phaseCol = phase.num === 1 ? "#0071E3" : phase.num === 2 ? "#F39200" : "#34C759";
                        return (
                          <div key={phase.num} data-testid={`v4-integration-phase-${phase.num}`} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${phaseCol}20` }}>
                            <div style={{ padding: "12px 20px", background: `${phaseCol}10`, borderBottom: `1px solid ${phaseCol}15`, display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 13, background: phaseCol, color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{phase.num}</span>
                              <div>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{phase.title}</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#8E8E93", marginLeft: 8 }}>{phase.period}</span>
                              </div>
                            </div>
                            <div style={{ padding: "16px 20px" }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 14px", lineHeight: 1.7 }}>
                                <span style={{ fontWeight: 700 }}>{t("Ziel: ", "Goal: ")}</span>{phase.ziel}
                              </p>

                              <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#1D1D1F", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{t("Was jetzt konkret wichtig ist", "What matters right now")}</p>
                                {phase.beschreibung.split("\n\n").map((para, pi) => (
                                  <p key={pi} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 10px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any}>{para}</p>
                                ))}
                              </div>

                              <div data-pdf-block style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#1D1D1F", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{t("Praxisbezug im Alltag", "In practice")}</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {phase.praxis.map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: 3, background: phaseCol, flexShrink: 0, marginTop: 9 }} />
                                      <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div data-pdf-block style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#34C759", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{t("Woran man merkt, dass es gut läuft", "Signs that it is working")}</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {phase.signale.map((s, si) => (
                                    <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                      <span style={{ color: "#34C759", flexShrink: 0, marginTop: 2, fontSize: 14 }}>✓</span>
                                      <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div data-pdf-block style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.02)", borderLeft: "3px solid #8E8E93", marginBottom: 16 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{t("Worauf die Führungskraft achten sollte", "Leadership note")}</p>
                                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any}>{phase.fuehrungstipp}</p>
                              </div>

                              <div data-pdf-block style={{ padding: "14px 16px", borderRadius: 10, background: `${phaseCol}06`, borderLeft: `4px solid ${phaseCol}` }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: phaseCol, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{t("Worauf es ankommt", "Focus areas")}</p>
                                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: "0 0 8px", hyphens: "auto", WebkitHyphens: "auto" } as any}>{phase.fokus.intro}</p>
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

                    <div data-pdf-block style={{ marginTop: 28, padding: "18px 20px", borderRadius: 12, background: "#FFF5F5", border: "1px solid rgba(196,30,58,0.12)" }} data-testid="v4-integration-warnsignale">
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#C41E3A", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>{t("Typische Warnsignale in den ersten 30 Tagen", "Early warning signals")}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {result.intWarnsignale.map((w, wi) => (
                          <div key={wi} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <AlertTriangle size={14} style={{ color: "#C41E3A", flexShrink: 0, marginTop: 4 }} />
                            <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div data-pdf-block style={{ marginTop: 16, padding: "18px 20px", borderRadius: 12, background: "rgba(0,113,227,0.03)", border: "1px solid rgba(0,113,227,0.12)" }} data-testid="v4-integration-leitfragen">
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>{t("Leitfragen für das 30-Tage-Gespräch", "Guide questions for the 30-day conversation")}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {result.intLeitfragen.map((q, qi) => (
                          <div key={qi} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span style={{ color: "#0071E3", flexShrink: 0, marginTop: 2, fontSize: 13 }}>→</span>
                            <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div data-pdf-block style={{ marginTop: 16, padding: "16px 18px", borderRadius: 10, background: "rgba(0,0,0,0.02)", borderLeft: "3px solid #8E8E93" }} data-testid="v4-integration-verantwortung">
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{t("Wichtig", "Note")}</p>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any}>{result.intVerantwortung}</p>
                    </div>
                  </div>
                );
              })()}

              {/* === Risikoprognose === */}
              {(() => {
                const riskNum = result.fuehrungshinweis ? 9 : 8;
                return (
                  <div data-pdf-block style={sectionStyle} data-testid="v4-section-risikoprognose">
                    <SectionHead num={riskNum} title={t("Risikoprognose", "Risk forecast")} id="risikoprognose" />
                    <div style={{ position: "relative", paddingLeft: 28 }}>
                      <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "rgba(0,0,0,0.08)", borderRadius: 1 }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {result.risikoprognose.map((phase, i) => {
                          const phaseCol = i === 0 ? "#34C759" : i === 1 ? "#FF9500" : "#C41E3A";
                          return (
                            <div key={i} data-pdf-block style={{ position: "relative" }} data-testid={`v4-risk-${i}`}>
                              <div style={{ position: "absolute", left: -22, top: 14, width: 10, height: 10, borderRadius: 5, background: phaseCol, boxShadow: `0 0 0 3px ${phaseCol}20` }} />
                              <div style={{ padding: "12px 16px", borderRadius: 12, background: `${phaseCol}06`, border: `1px solid ${phaseCol}15` }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: phaseCol, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{phase.label} <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: "0" }}>{phase.period}</span></p>
                                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left", hyphens: "auto", WebkitHyphens: "auto" } as any}>{phase.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* === Was passiert, wenn das Team so bleibt === */}
              {(() => {
                const ohneNum = result.fuehrungshinweis ? 10 : 9;
                return (
                  <div data-pdf-block style={sectionStyle} data-testid="v4-section-team-ohne-person">
                    <SectionHead num={ohneNum} title={t("Was passiert, wenn das Team so bleibt", "Without this person")} id="team-ohne-person" />
                    {result.teamOhnePersonText.split("\n\n").map((p, i) => (
                      <p key={i} style={bodyText}>{p}</p>
                    ))}
                  </div>
                );
              })()}

              {/* === Was jetzt wichtig ist === */}
              {(() => {
                const empNum = result.fuehrungshinweis ? 11 : 10;
                return (
                  <div data-pdf-block style={sectionStyle} data-testid="v4-section-empfehlungen">
                    <SectionHead num={empNum} title={t("Was jetzt wichtig ist", "Key recommendations")} id="empfehlungen" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {result.empfehlungen.map((emp, i) => (
                        <div key={emp.title} style={{ padding: "16px 20px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }} data-testid={`v4-empfehlung-${i}`}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <span style={{ width: 24, height: 24, borderRadius: 12, background: "#1A5DAB", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", lineHeight: 1.4 }}>{emp.title}</p>
                              <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6E6E73", margin: 0 }}>{emp.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* === Schlussfazit === */}
              {(() => {
                const fazitNum = result.fuehrungshinweis ? 12 : 11;
                return (
                  <div data-pdf-block style={{ marginBottom: 36 }} data-testid="v4-section-schlussfazit">
                    <SectionHead num={fazitNum} title={t("Fazit", "Conclusion")} id="schlussfazit" />
                    <div style={{ padding: "20px 24px", borderRadius: 14, background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }} data-testid="v4-schlussfazit-text">
                      {(aiNarrative?.systemfazit || result.schlussfazit).split("\n\n").map((p, i, arr) => (
                        <p key={i} style={{ fontSize: 14, lineHeight: 1.85, color: "#1D1D1F", margin: i < arr.length - 1 ? "0 0 12px" : 0, textAlign: "justify", textAlignLast: "left", hyphens: "auto", WebkitHyphens: "auto" } as any}>{p}</p>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div style={{ padding: "24px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }} data-testid="v4-footer">
                <p style={{ fontSize: 12, color: "#B0B0B5", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
                  © {new Date().getFullYear()} bioLogic Talent Navigator · {t("Passungsanalyse", "Fit Analysis")} · {t("Erstellt am", "Generated on")} {today}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
