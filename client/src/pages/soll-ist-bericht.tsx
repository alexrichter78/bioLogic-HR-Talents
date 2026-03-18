import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { buildAndSavePdf } from "@/lib/pdf-direct-builder";
import { AlertTriangle, Download, Loader2, ChevronLeft, ChevronDown, SlidersHorizontal, Zap, Compass, BarChart3, Triangle, Shield, Flame, Clock, TrendingUp, CheckCircle2, FileText, Award, AlertCircle, ArrowRight } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { dominanceModeOf, labelComponent } from "@/lib/jobcheck-engine";
import { computeSollIst, mapFuehrungsArt } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { SollIstResult, Severity, FuehrungsArt } from "@/lib/soll-ist-engine";
import logoPath from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

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

import { COMP_HEX, SECTION_COLORS, BIO_COLORS, fitColor as bioFitColor, controlColor as bioControlColor } from "@/lib/bio-design";
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
  return `Die größte Abweichung liegt im Bereich ${COMP_LABELS[maxKey]}. Genau dort liegt die Kernanforderung der Stelle.`;
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
    if (!result || isExportingPdf || !roleTriad) return;
    setIsExportingPdf(true);
    try {
      const safeName = roleName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_") || "Bericht";
      await buildAndSavePdf(result, roleTriad, candidateProfile, `Passungsbericht_${safeName}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
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

          const SectionHead = ({ num, icon: Icon, title, iconColor }: { num: number; icon?: any; title: string; iconColor?: string }) => (
            <div className="bio-section-head" style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, borderRadius: 10, overflow: "hidden", background: iconColor || "#1A5DAB" }}>
              <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#FFF" }}>{num}</span>
              </div>
              {Icon && (
                <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 16px" }}>{title}</span>
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

              {/* ─── DARK HEADER (nur Logo + Titel) ─── */}
              <div style={{ background: "linear-gradient(135deg, #343A48, #2A2F3A)", padding: "32px 44px 28px", position: "relative" }} data-testid="section-header">

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={logoPath} alt="bioLogic" style={{ height: 36, opacity: 1 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.25)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Passungsbericht</span>
                  </div>
                  <button
                    onClick={exportPdf}
                    disabled={isExportingPdf}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", cursor: isExportingPdf ? "wait" : "pointer", opacity: isExportingPdf ? 0.6 : 1, transition: "all 0.15s ease", backdropFilter: "blur(8px)" }}
                    data-testid="button-export-pdf"
                  >
                    {isExportingPdf ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Download style={{ width: 14, height: 14 }} />}
                    PDF
                  </button>
                </div>

                <h1 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2 }} data-testid="text-page-title">
                  {result.roleName}
                </h1>

              </div>

              {/* ─── EXECUTIVE DECISION CONTENT (weißer Hintergrund) ─── */}
              <div style={{ padding: "28px 44px 0" }}>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 24px", textAlign: "justify", textAlignLast: "left" as any }} lang="de" data-testid="text-einleitung">
                  Diese Passungsanalyse zeigt, wie gut Person und Position in ihrer Arbeitslogik zusammenpassen. Sie macht sichtbar, wo Übereinstimmungen bestehen, wo Abweichungen entstehen und welcher Führungs- oder Entwicklungsaufwand daraus im Alltag zu erwarten ist.
                </p>
                {(() => {
                  const cCol = bioControlColor(result.controlIntensity);
                  const cLabel = result.controlIntensity === "hoch" ? "Hoch" : result.controlIntensity === "mittel" ? "Mittel" : "Gering";
                  const devLevel = result.developmentLevel;
                  const devScore = devLevel >= 4 ? 3 : devLevel >= 3 ? 2 : 1;
                  const devLabel = devScore === 3 ? "niedrig" : devScore === 2 ? "mittel" : "hoch";
                  const devCol = devScore === 3 ? BIO_COLORS.geeignet : devScore === 2 ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
                  const gapCol = result.totalGap > 40 ? BIO_COLORS.nichtGeeignet : result.totalGap > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet;
                  const personLabel = result.candidateName !== "Die Person" ? result.candidateName : "Person";

                  return (
                    <>
                      {/* SYSTEMSTATUS */}
                      <div style={{ marginBottom: 22 }} data-testid="section-systemstatus">
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px" }}>Gesamtbewertung</p>
                        <div style={{ display: "flex", gap: 10 }}>
                          {[
                            { label: "Grundpassung", value: result.fitLabel, color: fitCol },
                            { label: "Führungsaufwand", value: cLabel, color: cCol },
                            { label: "Profilabweichung", value: result.gapLevel, color: gapCol },
                            { label: "Entwicklungsaufwand", value: devLabel, color: devCol },
                          ].map(m => (
                            <div key={m.label} style={{ flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: 10, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                              <div style={{ fontSize: 10, color: "#8E8E93", marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: m.color }} data-testid={`status-${m.label.toLowerCase().replace(/\s/g, "-")}`}>{m.value}</div>
                            </div>
                          ))}
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
                          <div style={{ marginBottom: 22, padding: "20px 24px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }} data-testid="section-ueberblick">
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 16px", textAlign: "center" }}>Kurzübersicht</p>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 16 }}>
                              <div style={{ flex: 1, textAlign: "center" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>Rolle</p>
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
                      <div style={{ marginBottom: 22, padding: "16px 20px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }} data-testid="section-auswirkung">
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px" }}>Auswirkung im Arbeitsalltag</p>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>
                          {result.dominanceShiftText.split(/\n\n+/)[0]}
                        </p>
                      </div>

                      {/* MANAGEMENTKURZFAZIT */}
                      <div style={{ marginBottom: 22, padding: "16px 20px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", position: "relative" }} data-testid="section-fazit">
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px", background: `linear-gradient(180deg, ${fitCol}, ${fitCol}40)` }} />
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Managementkurzfazit</p>
                        <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0 }} data-testid="text-summary-fazit">
                          {result.summaryText.split(/\n\n+/)[0]}
                        </p>
                      </div>

                      {/* WARUM / RISIKEN compact */}
                      {(result.executiveBullets.length > 0 || result.constellationRisks.length > 0) && (
                        <div style={{ marginBottom: 0, padding: "16px 20px 20px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }} data-testid="section-executive-bullets">
                          {result.executiveBullets.length > 0 && (
                            <div style={{ marginBottom: result.constellationRisks.length > 0 ? 14 : 0 }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px" }}>Warum dieses Ergebnis</p>
                              {result.executiveBullets.map((b, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: 3, background: fitCol, flexShrink: 0, marginTop: 6 }} />
                                  <span style={{ fontSize: 14, lineHeight: 1.6, color: "#48484A" }}>{b}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {result.constellationRisks.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px" }}>Risiken dieser Konstellation</p>
                              {result.constellationRisks.map((r, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: 3, background: BIO_COLORS.nichtGeeignet, flexShrink: 0, marginTop: 6 }} />
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

              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-comparison-bars">
                <SectionHead num={2} icon={BarChart3} title="Vergleich der Profile" iconColor={SECTION_COLORS.sollIstProfil} />
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 20px", textAlign: "left" } as React.CSSProperties} lang="de">
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
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#48484A", margin: "0 0 14px", letterSpacing: "0.02em" }}>Bedeutung der Komponenten</p>
                  {(["intuitiv", "impulsiv", "analytisch"] as const).map((k, i) => {
                    const hex = BAR_HEX[k];
                    const label = labelComponent(k);
                    const meaning: Record<ComponentKey, string> = {
                      intuitiv: "Erkennen, was Gesprächspartner oder Team brauchen und Kommunikation darauf abstimmen.",
                      impulsiv: "Aufgaben schnell vorantreiben, Prioritäten setzen und Ergebnisse liefern.",
                      analytisch: "Strukturen schaffen, Abläufe organisieren und Entscheidungen nachvollziehbar vorbereiten.",
                    };
                    return (
                      <div key={k} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 4, background: hex, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{label}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, paddingLeft: 13 }}>{meaning[k]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-impact-matrix">
                <SectionHead num={3} icon={Shield} title="Wirkung der Besetzung im Arbeitsalltag" iconColor={SECTION_COLORS.wirkung} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.impactAreas.map(area => {
                    const sevCol = area.severity === "critical" ? "#FF3B30" : area.severity === "warning" ? "#FF9500" : "#34C759";
                    return (
                      <div key={area.id} style={{ display: "flex", borderRadius: 12, overflow: "hidden", background: `${sevCol}06`, border: `1px solid ${sevCol}15` }} data-testid={`impact-detail-${area.id}`}>
                        <div style={{ width: 4, background: sevCol, flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 4, background: sevCol, boxShadow: `0 0 0 2px ${sevCol}25` }} />
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{area.label}</span>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: sevCol, textTransform: "uppercase", letterSpacing: "0.05em" }}>{severityLabel(area.severity)}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Stelle verlangt</p>
                              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#1D1D1F", fontWeight: 600, margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>{area.roleNeed}</p>
                            </div>
                            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Person bringt mit</p>
                              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#48484A", margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>{area.candidatePattern}</p>
                            </div>
                          </div>
                          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: "italic", color: "#6E6E73", wordBreak: "break-word", overflowWrap: "break-word" }}>{area.risk}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-stress-behavior">
                <SectionHead num={4} icon={Flame} title="Verhalten unter Druck" iconColor={SECTION_COLORS.druck} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "#FF950008", border: "1px solid #FF950018", overflow: "visible" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <AlertCircle style={{ width: 14, height: 14, color: "#FF9500", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Kontrollierter Druck</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }} lang="de">{result.stressBehavior.controlledPressure}</p>
                  </div>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "#FF3B3008", border: "1px solid #FF3B3018", overflow: "visible" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#FF3B30", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#FF3B30", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Unkontrollierter Stress</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }} lang="de">{result.stressBehavior.uncontrolledStress}</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "14px 0 0", fontStyle: "italic" }} lang="de">
                  Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.
                </p>
              </div>

              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-risk-timeline">
                <SectionHead num={5} icon={Clock} title="Risikoprognose" iconColor={SECTION_COLORS.risiko} />
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
                            <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, wordBreak: "break-word", overflowWrap: "break-word" }}>{phase.text}</p>
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
                  <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-development">
                    <SectionHead num={6} icon={TrendingUp} title="Gesamtbewertung" iconColor={SECTION_COLORS.gesamtbewertung} />

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: rFitColor, flexShrink: 0, boxShadow: `0 0 0 3px ${rFitColor}20` }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{result.roleName}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: rFitColor }}>
                        {rFitLabel}
                      </span>
                    </div>

                    <div style={{ background: `${rFitColor}08`, borderLeft: `3px solid ${rFitColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 22 }}>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0 }}>{rFazit}</p>
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
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "left", wordBreak: "break-word", overflowWrap: "break-word" } as React.CSSProperties} lang="de">{result.developmentText}</p>

                    <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: `${rFitColor}08`, border: `1px solid ${rFitColor}18` }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Managementeinschätzung</p>
                      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0 }}>
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
                <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="section-integrationsplan">
                  <SectionHead num={7} icon={FileText} title="30-Tage-Integrationsplan" iconColor={SECTION_COLORS.integrationsplan} />
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
                                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.5, margin: "0 0 6px" }}>{phase.fokus.intro}</p>
                                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                                  {phase.fokus.bullets.map((b, bi) => (
                                    <li key={bi} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, marginBottom: 3, paddingLeft: 16, position: "relative" }}>
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
                  <div data-testid="section-final-assessment" style={{ padding: "28px", borderRadius: 16, background: `linear-gradient(135deg, ${fitCol}08, ${fitCol}03)`, border: `1px solid ${fitCol}15`, boxShadow: `0 4px 20px ${fitCol}08` }}>
                    <SectionHead num={result.integrationsplan ? 8 : 7} icon={Award} title="Schlussbewertung" iconColor={fitCol} />
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
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "left", wordBreak: "break-word", overflowWrap: "break-word" } as React.CSSProperties} lang="de" data-testid="text-final-rating-text">{result.finalText}</p>
                  </div>
                );
              })()}

              <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={logoPath} alt="bioLogic" style={{ height: 18, opacity: 0.4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
