import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText, Check, Settings, RefreshCw, Loader2, Zap, Brain, Users, Target, TrendingUp, Lightbulb, Star } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import { BERUFE } from "@/data/berufe";
import { apiRequest } from "@/lib/queryClient";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };
const SOFT = { imp: "#FDEAED", int: "#FEF3E2", ana: "#E8F0FA" };
const MID = { imp: "#F5A3B3", int: "#F9C97A", ana: "#8BB8E8" };

type BG = { imp: number; int: number; ana: number };

function calcBioGram(taetigkeiten: any[]): BG {
  if (!taetigkeiten.length) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const weights: Record<string, number> = { Niedrig: 1, Mittel: 2, Hoch: 3 };
  let sI = 0, sN = 0, sA = 0;
  for (const t of taetigkeiten) {
    const w = weights[t.niveau] || 1;
    if (t.kompetenz === "Impulsiv") sI += w;
    else if (t.kompetenz === "Intuitiv") sN += w;
    else sA += w;
  }
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  return roundBG((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
}

function roundBG(a: number, b: number, c: number): BG {
  const raw = [a, b, c];
  const floored = raw.map(Math.floor);
  let remainder = 100 - floored.reduce((s, v) => s + v, 0);
  const fracs = raw.map((v, i) => ({ i, f: v - floored[i] })).sort((a, b) => b.f - a.f);
  for (const f of fracs) { if (remainder <= 0) break; floored[f.i]++; remainder--; }
  return { imp: floored[0], int: floored[1], ana: floored[2] };
}

function computeGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
  const all = [haupt, neben, fuehrung, rahmen];
  let vals = [
    all.reduce((s, g) => s + g.imp, 0) / 4,
    all.reduce((s, g) => s + g.int, 0) / 4,
    all.reduce((s, g) => s + g.ana, 0) / 4,
  ];
  const CAP = 53;
  let changed = true;
  while (changed) {
    changed = false;
    const capped: number[] = [], uncapped: number[] = [];
    vals.forEach((v, i) => { if (v > CAP) capped.push(i); else uncapped.push(i); });
    if (capped.length > 0 && uncapped.length > 0) {
      let excess = 0;
      for (const i of capped) { excess += vals[i] - CAP; vals[i] = CAP; }
      const uT = uncapped.reduce((s, i) => s + vals[i], 0);
      if (uT > 0) for (const i of uncapped) vals[i] += excess * (vals[i] / uT);
      changed = true;
    }
  }
  return roundBG(vals[0], vals[1], vals[2]);
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
  return roundBG((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
}

type ProfileType = "balanced_all" | "strong_imp" | "strong_ana" | "strong_int" |
  "dominant_imp" | "dominant_ana" | "dominant_int" |
  "light_imp" | "light_ana" | "light_int" |
  "hybrid_imp_ana" | "hybrid_ana_int" | "hybrid_imp_int";

type Intensity = "strong" | "clear" | "light" | "balanced";

function classifyProfile(bg: BG): { type: ProfileType; intensity: Intensity } {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value);
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

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/ Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Innovations- & Transformationsleistung",
  "Prozess- und Effizienzqualität",
  "Fachliche Exzellenz / Expertise",
  "Strategische Wirkung / Positionierung",
];

interface BerichtData {
  rollencharakter: string;
  dominanteKomponente: string;
  einleitung: string;
  gesamtprofil: string;
  rahmenbedingungen: {
    beschreibung: string;
    verantwortungsfelder: string[];
    erfolgsmessung: string[];
    spannungsfelder_rahmen: string[];
  };
  fuehrungskontext: {
    beschreibung: string;
    wirkungshebel: string[];
    analytische_anforderungen?: string[];
    schlusssatz: string;
  };
  kompetenzanalyse: {
    taetigkeiten_text: string;
    taetigkeiten_anforderungen: string[];
    taetigkeiten_schluss: string;
    human_text: string;
    human_anforderungen: string[];
    human_schluss: string;
  };
  spannungsfelder: string[];
  spannungsfelder_schluss: string;
  risikobewertung: { label: string; bullets: string[]; alltagssatz: string }[];
  fazit: { kernsatz: string; persoenlichkeit: string[]; fehlbesetzung: string; schlusssatz: string };
}

function splitIntoBlocks(text: string): string[] {
  const explicit = text.split(/\n\n+/).filter(p => p.trim());
  if (explicit.length > 1) return explicit;
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return [text];
  const blocks: string[] = [sentences[0].trim()];
  const mid: string[] = [];
  for (let i = 1; i < sentences.length; i++) {
    mid.push(sentences[i].trim());
    if (mid.length === 2 || (i === sentences.length - 1 && mid.length > 0)) {
      blocks.push(mid.join(" "));
      mid.length = 0;
    }
  }
  return blocks.filter(b => b.length > 0);
}

function TextBlock({ text, style }: { text: string; style?: React.CSSProperties }) {
  const blocks = splitIntoBlocks(text);
  const baseStyle: React.CSSProperties = { fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, hyphens: "auto", WebkitHyphens: "auto", overflowWrap: "break-word", wordBreak: "normal", ...style };
  const separator = <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.06)", margin: "14px 0" }} />;
  return (
    <div>
      {blocks.map((p, i) => {
        const isShort = p.length < 120;
        const pStyle: React.CSSProperties = isShort
          ? { ...baseStyle, textAlign: "left" }
          : { ...baseStyle, textAlign: "justify", textAlignLast: "left" as any };
        return (
          <div key={i}>
            {i > 0 && separator}
            <p style={pStyle} lang="de">{p}</p>
          </div>
        );
      })}
    </div>
  );
}

function SoftBar({ bg }: { bg: BG }) {
  const items = [
    { label: "Impulsiv", value: bg.imp, color: COLORS.imp },
    { label: "Intuitiv", value: bg.int, color: COLORS.int },
    { label: "Analytisch", value: bg.ana, color: COLORS.ana },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(bar => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
            <div style={{
              width: bar.value === 0 ? "0%" : `${Math.max(bar.value, 2)}%`,
              height: "100%", borderRadius: 6, background: bar.color,
              transition: "width 600ms ease",
              display: "flex", alignItems: "center", paddingLeft: 8,
              minWidth: bar.value === 0 ? 0 : 40,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(bar.value)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ icon: Icon, title, bg }: { icon: typeof BarChart3; title: string; bg: BG; accent?: string }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.02)",
      borderRadius: 14, padding: "16px 18px",
      border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
      </div>
      <SoftBar bg={bg} />
    </div>
  );
}

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 32, padding: "36px 32px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)",
      ...style,
    }} data-testid={testId}>{children}</div>
  );
}

function SectionDivider() {
  return <div style={{ height: 1, margin: "0 28px", background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 70%, transparent 100%)" }} />;
}

function ChapterBadge({ num, color }: { num: number; color: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 12,
      background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginRight: 14, flexShrink: 0,
      boxShadow: `0 4px 12px ${color}30`,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", fontVariantNumeric: "tabular-nums" }}>
        {String(num).padStart(2, "0")}
      </span>
    </div>
  );
}

const CHAPTER_COLORS = [
  "#0071E3", "#0071E3", "#0071E3", "#0071E3",
  "#0071E3", "#0071E3", "#0071E3", "#0071E3",
];

function BulletList({ items, icon, color }: { items: string[]; icon?: "check" | "dot" | "arrow"; color?: string }) {
  const c = color || "#6E6E73";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {icon === "check" ? (
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
            </div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
          )}
          <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function CalloutBox({ text, color, icon: Icon }: { text: string; color: string; icon?: typeof Lightbulb }) {
  const IconComp = Icon || Lightbulb;
  return (
    <div style={{
      padding: "16px 20px", borderRadius: 18,
      background: `linear-gradient(135deg, ${color}0A, ${color}04)`,
      border: `1px solid ${color}15`,
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconComp style={{ width: 14, height: 14, color, strokeWidth: 2 }} />
      </div>
      <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.75, margin: 0, fontWeight: 450, textAlign: "justify", textAlignLast: "left", hyphens: "auto", WebkitHyphens: "auto", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{text}</p>
    </div>
  );
}

function RiskCard({ label, color, bullets, alltagssatz }: { label: string; color: string; bullets: string[]; alltagssatz: string }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 22, padding: "24px 24px 20px",
      border: `1px solid ${color}18`,
      boxShadow: `0 2px 16px ${color}08`,
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${color}15`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 16px ${color}08`; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${color}20, ${color}0C)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertTriangle style={{ width: 15, height: 15, color, strokeWidth: 2 }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{label}</p>
      </div>
      <BulletList items={bullets} color={color} />
      <div style={{
        marginTop: 18, padding: "14px 18px", borderRadius: 14,
        background: `linear-gradient(135deg, ${color}08, ${color}04)`,
        borderLeft: `4px solid ${color}50`,
      }}>
        <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontWeight: 450 }}>{alltagssatz}</p>
      </div>
    </div>
  );
}

function getRiskColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("tempo") || l.includes("speed")) return COLORS.imp;
  if (l.includes("struktur") || l.includes("analyse")) return COLORS.ana;
  if (l.includes("beziehung") || l.includes("abstimmung")) return COLORS.int;
  return "#6E6E73";
}

function HighPriorityBadge({ name, kompetenz }: { name: string; kompetenz: string }) {
  const color = kompetenz === "Impulsiv" ? COLORS.imp : kompetenz === "Intuitiv" ? COLORS.int : COLORS.ana;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 16px", borderRadius: 14,
      background: `linear-gradient(135deg, ${color}08, ${color}03)`,
      border: `1px solid ${color}12`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
        background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Star style={{ width: 11, height: 11, color, strokeWidth: 2, fill: color }} />
      </div>
      <div>
        <span style={{ fontSize: 13, color: "#1D1D1F", lineHeight: 1.6, fontWeight: 500, display: "block" }}>{name}</span>
        <span style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 2, display: "inline-block" }}>{kompetenz}</span>
      </div>
    </div>
  );
}

function SpannungsfeldPill({ text }: { text: string }) {
  const parts = text.split(/\s+vs\.?\s+/i);
  if (parts.length === 2) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 14,
        background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.05)",
      }}>
        <span style={{ fontSize: 13, color: "#1D1D1F", fontWeight: 500 }}>{parts[0].trim()}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase",
          background: "rgba(0,0,0,0.04)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em",
        }}>vs</span>
        <span style={{ fontSize: 13, color: "#1D1D1F", fontWeight: 500 }}>{parts[1].trim()}</span>
      </div>
    );
  }
  return (
    <div style={{
      padding: "10px 16px", borderRadius: 14,
      background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.05)",
    }}>
      <span style={{ fontSize: 13, color: "#3A3A3C" }}>{text}</span>
    </div>
  );
}

export default function Bericht() {
  const [, setLocation] = useLocation();
  const [profileData, setProfileData] = useState<{
    beruf: string; bereich: string; isLeadership: boolean;
    gesamt: BG; haupt: BG; neben: BG; fuehrung: BG; rahmen: BG;
    intensity: Intensity; profileType: ProfileType;
    fuehrungstyp: string; aufgabencharakter: string; arbeitslogik: string;
    erfolgsfokusIndices: number[]; taetigkeiten: any[];
  } | null>(null);
  const [bericht, setBericht] = useState<BerichtData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const beruf = state.beruf || "Unbenannte Rolle";
      const found = BERUFE.find(b => b.name === beruf);
      const bereich = found?.kategorie || "";
      const fuehrungstyp = state.fuehrung || "Keine";
      const isLeadership = fuehrungstyp !== "Keine";
      const taetigkeiten = state.taetigkeiten || [];
      const arbeitslogik = state.arbeitslogik || "";
      const aufgabencharakter = state.aufgabencharakter || "";
      const erfolgsfokusIndices = state.erfolgsfokusIndices || [];
      const haupt = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
      const neben = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
      const fuehrung = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
      const rahmen = computeRahmen(state);
      const gesamt = computeGesamt(haupt, neben, fuehrung, rahmen);
      const { type: profileType, intensity } = classifyProfile(gesamt);
      setProfileData({ beruf, bereich, isLeadership, gesamt, haupt, neben, fuehrung, rahmen, intensity, profileType, fuehrungstyp, aufgabencharakter, arbeitslogik, erfolgsfokusIndices, taetigkeiten });
    } catch {}
  }, []);

  useEffect(() => {
    if (!profileData) return;
    const cached = localStorage.getItem("berichtCache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.beruf === profileData.beruf && parsed.hash === JSON.stringify(profileData.gesamt)) {
          setBericht(parsed.data);
          return;
        }
      } catch {}
    }
    generateBericht();
  }, [profileData]);

  async function generateBericht() {
    if (!profileData) return;
    setIsGenerating(true);
    setError(null);
    try {
      const erfolgsfokusLabels = profileData.erfolgsfokusIndices.map((i: number) => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);
      const res = await apiRequest("POST", "/api/generate-bericht", {
        beruf: profileData.beruf, bereich: profileData.bereich,
        fuehrungstyp: profileData.fuehrungstyp, aufgabencharakter: profileData.aufgabencharakter,
        arbeitslogik: profileData.arbeitslogik, erfolgsfokusLabels,
        taetigkeiten: profileData.taetigkeiten, gesamt: profileData.gesamt,
        haupt: profileData.haupt, neben: profileData.neben,
        fuehrungBG: profileData.fuehrung, rahmen: profileData.rahmen,
        profileType: profileData.profileType, intensity: profileData.intensity,
        isLeadership: profileData.isLeadership,
      });
      const data = await res.json();
      setBericht(data);
      localStorage.setItem("berichtCache", JSON.stringify({ beruf: profileData.beruf, hash: JSON.stringify(profileData.gesamt), data }));
    } catch (err: any) {
      setError("Der Bericht konnte nicht generiert werden. Bitte versuchen Sie es erneut.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }}>
        <GlassCard testId="bericht-no-data">
          <div className="text-center" style={{ padding: "24px 44px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, #E8F0FA, #FDEAED)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FileText style={{ width: 24, height: 24, color: "#6E6E73" }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }}>Keine Analyse vorhanden</p>
            <p style={{ fontSize: 14, color: "#8E8E93", marginBottom: 20, maxWidth: 260 }}>Erstelle zuerst ein Rollenprofil, um den Entscheidungsbericht zu generieren.</p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              style={{ background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.25)" }}
              data-testid="button-goto-rollen-dna"
            >
              Zur Datenerfassung
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { beruf, bereich, isLeadership, gesamt, haupt, neben, fuehrung, rahmen } = profileData;
  let chapter = 0;
  const nextChapter = () => ++chapter;

  return (
    <div className="min-h-screen relative overflow-hidden" data-bericht lang="de">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
          animation: "gradientShift 20s ease-in-out infinite alternate",
        }}
      />

      <style>{`
        @keyframes gradientShift {
          0% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-1%, 1%); }
          66% { transform: scale(1.02) translate(1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
      `}</style>

      <div className="relative z-10">
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", background: "rgba(255,255,255,0.75)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <header className="flex items-center justify-between gap-4 px-6 py-3" data-testid="header-bericht">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer" }} data-testid="button-back-bericht">
                  <ArrowLeft style={{ width: 16, height: 16, color: "#6E6E73" }} />
                </button>
                <img src={logoSrc} alt="bioLogic Logo" className="h-6 w-auto" data-testid="logo-bericht" />
              </div>
              {bericht && !isGenerating && (
                <button onClick={generateBericht} style={{
                  display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500,
                  padding: "7px 14px", borderRadius: 10, background: "rgba(0,0,0,0.04)",
                  border: "none", cursor: "pointer", color: "#6E6E73",
                }} data-testid="button-regenerate-bericht">
                  <RefreshCw style={{ width: 12, height: 12 }} />
                  Neu generieren
                </button>
              )}
            </header>
          </div>
        </div>

        <main className="flex-1 w-full max-w-2xl mx-auto px-5 pb-24 pt-10">

          {isGenerating && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: "linear-gradient(135deg, rgba(0,113,227,0.1), rgba(52,170,220,0.06))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(0,113,227,0.1)",
              }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#0071E3" }} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 650, color: "#1D1D1F", marginBottom: 8 }}>Bericht wird erstellt</p>
              <p style={{ fontSize: 14, color: "#8E8E93", maxWidth: 320, margin: "0 auto" }}>Die KI analysiert das Rollenprofil und erstellt einen individuellen Entscheidungsbericht.</p>
            </div>
          )}

          {error && !isGenerating && (
            <GlassCard testId="bericht-error" style={{ padding: "44px 36px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(196,30,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <AlertTriangle style={{ width: 24, height: 24, color: "#C41E3A" }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>Generierung fehlgeschlagen</p>
              <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 20 }}>{error}</p>
              <button onClick={generateBericht} style={{ background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "white", border: "none", borderRadius: 14, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }} data-testid="button-retry-bericht">
                Erneut versuchen
              </button>
            </GlassCard>
          )}

          {bericht && !isGenerating && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Hero Header */}
              <GlassCard testId="bericht-header" style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(52,170,220,0.03))", pointerEvents: "none" }} />

                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.1), rgba(52,170,220,0.06))",
                  borderRadius: 20, padding: "5px 14px", marginBottom: 14,
                }}>
                  <FileText style={{ width: 12, height: 12, color: "#0071E3" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.12em" }}>Entscheidungsgrundlage</span>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 6 }} data-testid="text-bericht-beruf">
                  {beruf}
                </h1>
                {bereich && <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 16 }}>{bereich}</p>}

                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "#3A3A3C",
                    background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10,
                  }}>{bericht.rollencharakter}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "#3A3A3C",
                    background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10,
                  }}>{bericht.dominanteKomponente}</span>
                </div>
              </GlassCard>

              {/* 01 Einleitung */}
              <GlassCard testId="bericht-section-intro" style={{ padding: "30px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                  <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[0]} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Einleitung</span>
                </div>
                {(() => {
                  const blocks = splitIntoBlocks(bericht.einleitung);
                  const first = blocks[0];
                  const rest = blocks.slice(1);
                  return (
                    <>
                      <CalloutBox text={first} color={CHAPTER_COLORS[0]} icon={Lightbulb} />
                      {rest.length > 0 && (
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 0 }}>
                          {rest.map((p, i) => (
                            <div key={i}>
                              {i > 0 && <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.06)", margin: "14px 0" }} />}
                              <p style={{ fontSize: 13.5, fontWeight: 400, color: "#48484A", lineHeight: 1.9, margin: 0, textAlign: "justify", textAlignLast: "left", hyphens: "auto", WebkitHyphens: "auto", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{p}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </GlassCard>

              {/* 02 Gesamtprofil */}
              <GlassCard testId="bericht-section-gesamtprofil" style={{ padding: "30px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                  <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[1]} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Gesamtprofil</span>
                </div>
                <ChartCard icon={BarChart3} title="Gesamtprofil" bg={gesamt} accent={CHAPTER_COLORS[1]} />
                <div style={{ marginTop: 18 }}><TextBlock text={bericht.gesamtprofil} /></div>
              </GlassCard>

              {/* 03 Rahmenbedingungen */}
              <GlassCard testId="bericht-section-rahmen" style={{ padding: "30px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                  <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[2]} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Rahmenbedingungen</span>
                </div>
                <ChartCard icon={Settings} title="Rahmenprofil" bg={rahmen} accent={CHAPTER_COLORS[2]} />
                <div style={{ marginTop: 18 }}><TextBlock text={bericht.rahmenbedingungen.beschreibung} /></div>

                {bericht.rahmenbedingungen.verantwortungsfelder?.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>Zentrale Verantwortungsbereiche</p>
                    <BulletList items={bericht.rahmenbedingungen.verantwortungsfelder} />
                  </div>
                )}

                {bericht.rahmenbedingungen.erfolgsmessung?.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>Erfolg wird gemessen an</p>
                    <BulletList items={bericht.rahmenbedingungen.erfolgsmessung} icon="check" color={CHAPTER_COLORS[2]} />
                  </div>
                )}

                {bericht.rahmenbedingungen.spannungsfelder_rahmen?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <CalloutBox
                      text={`Die Rolle erfordert die gleichzeitige Steuerung von ${bericht.rahmenbedingungen.spannungsfelder_rahmen.length} Spannungsfeldern.`}
                      color={CHAPTER_COLORS[2]}
                      icon={Target}
                    />
                  </div>
                )}
              </GlassCard>

              {/* 04 Führungskontext */}
              {bericht.fuehrungskontext && (
                <GlassCard testId="bericht-section-fuehrung" style={{ padding: "30px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                    <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[3]} />
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Führungskontext</span>
                  </div>
                  {isLeadership && <ChartCard icon={Shield} title="Führungskompetenzen" bg={fuehrung} accent={CHAPTER_COLORS[3]} />}
                  <div style={{ marginTop: isLeadership ? 18 : 0 }}><TextBlock text={bericht.fuehrungskontext.beschreibung} /></div>

                  {bericht.fuehrungskontext.wirkungshebel?.length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>
                        {isLeadership ? "Führungswirkung entsteht über" : "Wirkung entsteht über"}
                      </p>
                      <BulletList items={bericht.fuehrungskontext.wirkungshebel} icon="check" color={CHAPTER_COLORS[3]} />
                    </div>
                  )}

                  {bericht.fuehrungskontext.analytische_anforderungen?.length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>Strukturelle Stabilisierung</p>
                      <BulletList items={bericht.fuehrungskontext.analytische_anforderungen} />
                    </div>
                  )}

                  {bericht.fuehrungskontext.schlusssatz && (
                    <div style={{ marginTop: 18 }}>
                      <CalloutBox text={bericht.fuehrungskontext.schlusssatz} color={CHAPTER_COLORS[3]} icon={AlertTriangle} />
                    </div>
                  )}
                </GlassCard>
              )}

              {/* 05 Kompetenzanalyse */}
              <GlassCard testId="bericht-section-kompetenz" style={{ padding: "30px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                  <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[4]} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Kompetenzanalyse</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                  <ChartCard icon={Briefcase} title="Tätigkeiten" bg={haupt} accent={COLORS.imp} />
                  <ChartCard icon={Heart} title="Humankompetenzen" bg={neben} accent={COLORS.ana} />
                </div>

                {(() => {
                  const hochTaetigkeiten = (profileData.taetigkeiten || []).filter((t: any) => t.niveau === "Hoch");
                  if (hochTaetigkeiten.length === 0) return null;
                  return (
                    <div style={{
                      marginBottom: 24, padding: "22px 22px 20px", borderRadius: 22,
                      background: "linear-gradient(135deg, rgba(212,136,15,0.06), rgba(243,146,0,0.02))",
                      border: "1px solid rgba(243,146,0,0.12)",
                    }} data-testid="bericht-hoch-taetigkeiten">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 9,
                          background: "linear-gradient(135deg, rgba(243,146,0,0.18), rgba(212,136,15,0.08))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Star style={{ width: 14, height: 14, color: "#D4880F", strokeWidth: 2, fill: "#D4880F" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>Höchste Priorität</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#8E8E93", marginBottom: 14, paddingLeft: 38 }}>
                        Diese Tätigkeiten wurden in der individuellen Bewertung als besonders wichtig eingestuft und haben den höchsten Einfluss auf die Rollenanforderung.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {hochTaetigkeiten.map((t: any, i: number) => (
                          <HighPriorityBadge key={i} name={t.name} kompetenz={t.kompetenz} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Zap style={{ width: 14, height: 14, color: COLORS.imp }} />
                    <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>Tätigkeiten</span>
                  </div>
                  <TextBlock text={bericht.kompetenzanalyse.taetigkeiten_text} style={{ marginBottom: 14 }} />
                  {bericht.kompetenzanalyse.taetigkeiten_anforderungen?.length > 0 && (
                    <BulletList items={bericht.kompetenzanalyse.taetigkeiten_anforderungen} />
                  )}
                  <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.75, fontStyle: "italic", marginTop: 12 }}>{bericht.kompetenzanalyse.taetigkeiten_schluss}</p>
                </div>

                <SectionDivider />

                <div style={{ marginTop: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Brain style={{ width: 14, height: 14, color: COLORS.ana }} />
                    <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>Humankompetenzen</span>
                  </div>
                  <TextBlock text={bericht.kompetenzanalyse.human_text} style={{ marginBottom: 14 }} />
                  {bericht.kompetenzanalyse.human_anforderungen?.length > 0 && (
                    <BulletList items={bericht.kompetenzanalyse.human_anforderungen} />
                  )}
                  <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.75, fontStyle: "italic", marginTop: 12 }}>{bericht.kompetenzanalyse.human_schluss}</p>
                </div>
              </GlassCard>

              {/* 06 Spannungsfelder */}
              {bericht.spannungsfelder?.length > 0 && (
                <GlassCard testId="bericht-section-spannungsfelder" style={{ padding: "30px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                    <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[5]} />
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Spannungsfelder</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bericht.spannungsfelder.map((sf, i) => (
                      <SpannungsfeldPill key={i} text={sf} />
                    ))}
                  </div>
                  {bericht.spannungsfelder_schluss && (
                    <div style={{ marginTop: 16 }}>
                      <CalloutBox text={bericht.spannungsfelder_schluss} color={CHAPTER_COLORS[5]} icon={Target} />
                    </div>
                  )}
                </GlassCard>
              )}

              {/* 07 Risikobewertung */}
              <GlassCard testId="bericht-section-risiko" style={{ padding: "30px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                  <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[6]} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Risikobewertung</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(bericht.risikobewertung || []).map((risk, i) => (
                    <RiskCard key={i} label={risk.label} color={getRiskColor(risk.label)} bullets={risk.bullets} alltagssatz={risk.alltagssatz} />
                  ))}
                </div>
              </GlassCard>

              {/* 08 Fazit */}
              <GlassCard testId="bericht-section-fazit" style={{
                padding: "34px 28px",
                background: "linear-gradient(160deg, rgba(255,255,255,0.85), rgba(0,113,227,0.04), rgba(255,255,255,0.8))",
                border: "1px solid rgba(0,113,227,0.12)",
              }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                  <ChapterBadge num={nextChapter()} color={CHAPTER_COLORS[7]} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>Fazit</span>
                </div>

                <p style={{
                  fontSize: 16, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.7, margin: 0,
                  paddingBottom: 18, borderBottom: "1px solid rgba(0,113,227,0.12)",
                }}>{bericht.fazit.kernsatz}</p>

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 12 }}>Entscheidend für die Besetzung ist eine Persönlichkeit, die:</p>
                  <BulletList items={bericht.fazit.persoenlichkeit || []} icon="check" color={CHAPTER_COLORS[7]} />
                </div>

                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, marginBottom: 16 }}>{bericht.fazit.fehlbesetzung}</p>

                <div style={{
                  padding: "18px 22px", borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.03))",
                  border: "1px solid rgba(0,113,227,0.12)",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                    background: "rgba(0,113,227,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check style={{ width: 13, height: 13, color: "#0071E3", strokeWidth: 2.5 }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", lineHeight: 1.75, margin: 0 }}>{bericht.fazit.schlusssatz}</p>
                </div>
              </GlassCard>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
