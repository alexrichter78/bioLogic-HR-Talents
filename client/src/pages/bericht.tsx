import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText, Check, Users, Settings, RefreshCw, Loader2 } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import { BERUFE } from "@/data/berufe";
import { apiRequest } from "@/lib/queryClient";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

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

  if (abII <= 6 && abIA <= 6 && abNA <= 6) {
    return { type: "balanced_all", intensity: "balanced" };
  }
  if (max.value >= 55) {
    return { type: `strong_${max.key}` as ProfileType, intensity: "strong" };
  }
  if (gap12 >= 8) {
    return { type: `dominant_${max.key}` as ProfileType, intensity: "clear" };
  }
  if (gap12 <= 5 && gap23 > 5) {
    const k1 = max.key, k2 = second.key;
    const hybridKey = `hybrid_${k1}_${k2}`;
    const validHybrids = ["hybrid_imp_ana", "hybrid_ana_int", "hybrid_imp_int"];
    const reverseMap: Record<string, string> = {
      "hybrid_ana_imp": "hybrid_imp_ana",
      "hybrid_int_ana": "hybrid_ana_int",
      "hybrid_int_imp": "hybrid_imp_int",
    };
    const resolved = validHybrids.includes(hybridKey) ? hybridKey : (reverseMap[hybridKey] || "hybrid_imp_ana");
    const hybridIntensity: Intensity = gap23 >= 15 ? "strong" : gap23 >= 8 ? "clear" : "light";
    return { type: resolved as ProfileType, intensity: hybridIntensity };
  }
  if (gap12 >= 5) {
    return { type: `light_${max.key}` as ProfileType, intensity: "light" };
  }
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
  risikobewertung: {
    label: string;
    bullets: string[];
    alltagssatz: string;
  }[];
  fazit: {
    kernsatz: string;
    persoenlichkeit: string[];
    fehlbesetzung: string;
    schlusssatz: string;
  };
}

function BarChart({ data, compact }: { data: { label: string; value: number; color: string }[]; compact?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 10 }}>
      {data.map((bar) => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: compact ? 11 : 12, color: "#6E6E73", fontWeight: 400, width: compact ? 62 : 70, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: compact ? 26 : 28, borderRadius: 4, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{
              width: `${Math.max(bar.value, 5)}%`,
              height: "100%",
              borderRadius: 4,
              background: bar.color,
              transition: "width 600ms ease",
              display: "flex",
              alignItems: "center",
              paddingLeft: 10,
              minWidth: 42,
            }}>
              <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                {Math.round(bar.value)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileRing({ bg }: { bg: BG }) {
  const total = bg.imp + bg.int + bg.ana;
  const r = 54, cx = 64, cy = 64, sw = 12;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: bg.imp, color: COLORS.imp, label: "Impulsiv" },
    { value: bg.int, color: COLORS.int, label: "Intuitiv" },
    { value: bg.ana, color: COLORS.ana, label: "Analytisch" },
  ];

  let offset = -90;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const dashLen = pct * circumference;
    const gap = circumference - dashLen;
    const rotation = offset;
    offset += pct * 360;
    return { ...seg, dashLen, gap, rotation, pct };
  });

  const sorted = [...segments].sort((a, b) => b.value - a.value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, justifyContent: "center", padding: "8px 0" }}>
      <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={sw} />
          {arcs.map((arc, i) => (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={arc.color} strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={`${arc.dashLen - 2} ${arc.gap + 2}`}
              transform={`rotate(${arc.rotation} ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 800ms ease" }}
            />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", lineHeight: 1 }}>{Math.round(sorted[0].value)}%</span>
          <span style={{ fontSize: 9, color: "#8E8E93", fontWeight: 500, marginTop: 2 }}>{sorted[0].label}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0, boxShadow: `0 1px 4px ${seg.color}40` }} />
            <span style={{ fontSize: 13, color: "#3A3A3C", fontWeight: i === 0 ? 600 : 400, minWidth: 60 }}>{seg.label}</span>
            <span style={{ fontSize: 13, color: i === 0 ? "#1D1D1F" : "#8E8E93", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{Math.round(seg.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderRadius: 28,
        padding: "32px 30px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.03), 0 16px 56px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.6)",
        border: "1px solid rgba(0,0,0,0.03)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        ...style,
      }}
      data-testid={testId}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.7)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.03), 0 16px 56px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.6)"; }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ margin: "0 34px", display: "flex", alignItems: "center", gap: 0 }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06))" }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(0,0,0,0.08)", flexShrink: 0, margin: "0 2px" }} />
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(0,0,0,0.06), transparent)" }} />
    </div>
  );
}

function BarsForProfile(bg: BG, compact?: boolean) {
  return <BarChart compact={compact} data={[
    { label: "Impulsiv", value: bg.imp, color: COLORS.imp },
    { label: "Intuitiv", value: bg.int, color: COLORS.int },
    { label: "Analytisch", value: bg.ana, color: COLORS.ana },
  ]} />;
}

function MiniCard({ icon: Icon, title, bg, iconColor }: { icon: typeof BarChart3; title: string; bg: BG; iconColor: string }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.02)", borderRadius: 16, padding: "18px 20px",
      border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <Icon style={{ width: 14, height: 14, color: iconColor, strokeWidth: 1.8 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{title}</span>
      </div>
      {BarsForProfile(bg, true)}
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingLeft: 2 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: color || "#8E8E93", marginTop: 7, flexShrink: 0, opacity: 0.6 }} />
          <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function RiskCard({ label, color, bullets, alltagssatz }: { label: string; color: string; bullets: string[]; alltagssatz: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.5)", borderRadius: 18, padding: "22px 24px",
      border: `1px solid ${color}15`, boxShadow: `0 2px 12px ${color}08`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${color}12`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 12px ${color}08`; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: `linear-gradient(135deg, ${color}18, ${color}0C)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertTriangle style={{ width: 13, height: 13, color, strokeWidth: 2 }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{label}</p>
      </div>
      <BulletList items={bullets} color={color} />
      <div style={{ marginTop: 16, padding: "14px 16px", background: `${color}06`, borderRadius: 12, borderLeft: `3px solid ${color}40` }}>
        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{alltagssatz}</p>
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
      setProfileData({
        beruf, bereich, isLeadership, gesamt, haupt, neben, fuehrung, rahmen,
        intensity, profileType, fuehrungstyp, aufgabencharakter, arbeitslogik,
        erfolgsfokusIndices, taetigkeiten,
      });
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
        beruf: profileData.beruf,
        bereich: profileData.bereich,
        fuehrungstyp: profileData.fuehrungstyp,
        aufgabencharakter: profileData.aufgabencharakter,
        arbeitslogik: profileData.arbeitslogik,
        erfolgsfokusLabels,
        taetigkeiten: profileData.taetigkeiten,
        gesamt: profileData.gesamt,
        haupt: profileData.haupt,
        neben: profileData.neben,
        fuehrungBG: profileData.fuehrung,
        rahmen: profileData.rahmen,
        profileType: profileData.profileType,
        intensity: profileData.intensity,
        isLeadership: profileData.isLeadership,
      });
      const data = await res.json();
      setBericht(data);
      localStorage.setItem("berichtCache", JSON.stringify({
        beruf: profileData.beruf,
        hash: JSON.stringify(profileData.gesamt),
        data,
      }));
    } catch (err: any) {
      setError("Der Bericht konnte nicht generiert werden. Bitte versuchen Sie es erneut.");
      console.error("Bericht generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #f0f2f5 0%, #e8eaef 100%)" }}>
        <GlassCard testId="bericht-no-data">
          <div className="text-center" style={{ padding: "20px 40px" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }}>Keine Analyse vorhanden</p>
            <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 16 }}>Bitte erfassen Sie zuerst die Rollendaten.</p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              style={{ background: "#0071E3", color: "white", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
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

  const chapterNum = (n: number) => (
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: "linear-gradient(135deg, #0071E3, #34AADC)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginRight: 12, flexShrink: 0,
      boxShadow: "0 2px 8px rgba(0,113,227,0.15)",
    }}>
      <span style={{
        fontSize: 13, fontWeight: 700, color: "#FFFFFF",
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
      }}>{String(n).padStart(2, "0")}</span>
    </div>
  );

  let chapter = 1;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
          "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(252,205,210,0.25) 0%, transparent 50%), " +
          "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
      }} />

      <div className="relative z-10">
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(255,255,255,0.82)" }}>
            <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-bericht">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-bericht">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <img src={logoSrc} alt="bioLogic Logo" className="h-7 w-auto" data-testid="logo-bericht" />
                <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">RoleDynamics</span>
              </div>
              {bericht && !isGenerating && (
                <button
                  onClick={generateBericht}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  style={{ fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer" }}
                  data-testid="button-regenerate-bericht"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Neu generieren
                </button>
              )}
            </header>
          </div>
        </div>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20 pt-8">
          <div className="text-center mb-10">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
              borderRadius: 20, padding: "6px 16px", marginBottom: 16,
              border: "1px solid rgba(0,113,227,0.08)",
            }}>
              <FileText style={{ width: 13, height: 13, color: "#0071E3" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.1em" }}>Strukturanalyse</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 750, letterSpacing: "-0.035em", color: "#1D1D1F", lineHeight: 1.1 }} data-testid="text-bericht-title">
              Entscheidungsbericht
            </h1>
          </div>

          {isGenerating && (
            <GlassCard testId="bericht-loading" style={{ padding: "60px 40px", textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#0071E3" }} />
                <div>
                  <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>Bericht wird generiert...</p>
                  <p style={{ fontSize: 14, color: "#8E8E93" }}>Die KI erstellt einen rollenspezifischen Entscheidungsbericht. Das kann einen Moment dauern.</p>
                </div>
              </div>
            </GlassCard>
          )}

          {error && !isGenerating && (
            <GlassCard testId="bericht-error" style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#C41E3A", marginBottom: 12 }}>{error}</p>
              <button
                onClick={generateBericht}
                style={{ background: "#0071E3", color: "white", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                data-testid="button-retry-bericht"
              >
                Erneut versuchen
              </button>
            </GlassCard>
          )}

          {bericht && !isGenerating && (
            <GlassCard testId="bericht-report" style={{ padding: 0, borderRadius: 28, overflow: "hidden" }}>

              <div style={{ padding: "32px 34px 24px" }} data-testid="bericht-header">
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", marginBottom: 6 }} data-testid="text-bericht-beruf">
                  Entscheidungsgrundlage: {beruf}
                </h2>
                {bereich && (
                  <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 10 }}>
                    Bereich: {bereich}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#48484A" }}>
                    Rollencharakter: <strong style={{ color: "#1D1D1F" }}>{bericht.rollencharakter}</strong>
                  </span>
                  <span style={{ fontSize: 13, color: "#48484A" }}>
                    Dominante Komponente: <strong style={{ color: "#1D1D1F" }}>{bericht.dominanteKomponente}</strong>
                  </span>
                </div>
              </div>

              <Divider />

              {/* 01 Einleitung */}
              <div style={{ padding: "28px 34px 24px" }} data-testid="bericht-section-intro">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                  {chapterNum(chapter++)}
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Einleitung</span>
                </div>
                {bericht.einleitung.split("\n\n").map((p, i) => (
                  <p key={i} style={{ fontSize: i === 0 ? 15 : 14, fontWeight: i === 0 ? 500 : 400, color: i === 0 ? "#1D1D1F" : "#48484A", lineHeight: 1.8, marginBottom: 10 }}>{p}</p>
                ))}
              </div>

              <Divider />

              {/* 02 Gesamtprofil */}
              <div style={{ padding: "28px 34px" }} data-testid="bericht-section-gesamtprofil">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                  {chapterNum(chapter++)}
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Gesamtprofil der Stellenanforderung</span>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <MiniCard icon={BarChart3} title="Gesamtprofil" bg={gesamt} iconColor="#6E6E73" />
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8 }}>{bericht.gesamtprofil}</p>
              </div>

              <Divider />

              {/* 03 Rahmenbedingungen */}
              <div style={{ padding: "28px 34px" }} data-testid="bericht-section-rahmen">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                  {chapterNum(chapter++)}
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Rahmenbedingungen der Rolle</span>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <MiniCard icon={Settings} title="Rahmenbedingungen" bg={rahmen} iconColor="#6E6E73" />
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginBottom: 16 }}>{bericht.rahmenbedingungen.beschreibung}</p>

                {bericht.rahmenbedingungen.verantwortungsfelder?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Zentrale Verantwortungsbereiche:</p>
                    <BulletList items={bericht.rahmenbedingungen.verantwortungsfelder} />
                  </div>
                )}

                {bericht.rahmenbedingungen.erfolgsmessung?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Erfolg wird gemessen an:</p>
                    <BulletList items={bericht.rahmenbedingungen.erfolgsmessung} />
                  </div>
                )}

                {bericht.rahmenbedingungen.spannungsfelder_rahmen?.length > 0 && (
                  <div style={{
                    marginTop: 16, padding: "16px 20px", borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
                    borderLeft: "3px solid rgba(0,113,227,0.25)",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Die Rolle verlangt, Spannungsfelder aktiv zu steuern:</p>
                    <BulletList items={bericht.rahmenbedingungen.spannungsfelder_rahmen} color="#0071E3" />
                  </div>
                )}
              </div>

              <Divider />

              {/* 04 Führungskontext */}
              {bericht.fuehrungskontext && (
                <>
                  <div style={{ padding: "28px 34px" }} data-testid="bericht-section-fuehrung">
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                      {chapterNum(chapter++)}
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Führungskontext</span>
                    </div>
                    {isLeadership && (
                      <div style={{ marginBottom: 18 }}>
                        <MiniCard icon={Shield} title="Führungskompetenzen" bg={fuehrung} iconColor="#6E6E73" />
                      </div>
                    )}
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginBottom: 16 }}>{bericht.fuehrungskontext.beschreibung}</p>

                    {bericht.fuehrungskontext.wirkungshebel?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>
                          {isLeadership ? "Führungswirkung entsteht über:" : "Die Rolle wirkt steuernd über:"}
                        </p>
                        <BulletList items={bericht.fuehrungskontext.wirkungshebel} />
                      </div>
                    )}

                    {bericht.fuehrungskontext.analytische_anforderungen?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Analytische Stabilisierung erfordert:</p>
                        <BulletList items={bericht.fuehrungskontext.analytische_anforderungen} />
                      </div>
                    )}

                    {bericht.fuehrungskontext.schlusssatz && (
                      <div style={{
                        marginTop: 16, padding: "14px 18px", borderRadius: 14,
                        background: "rgba(0,0,0,0.02)", borderLeft: "3px solid rgba(0,0,0,0.08)",
                      }}>
                        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                          {bericht.fuehrungskontext.schlusssatz}
                        </p>
                      </div>
                    )}
                  </div>
                  <Divider />
                </>
              )}

              {/* 05 Kompetenzanalyse */}
              <div style={{ padding: "28px 34px" }} data-testid="bericht-section-kompetenz">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                  {chapterNum(chapter++)}
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Kompetenzanalyse</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  <MiniCard icon={Briefcase} title="Tätigkeiten" bg={haupt} iconColor="#6E6E73" />
                  <MiniCard icon={Heart} title="Humankompetenzen" bg={neben} iconColor="#6E6E73" />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>Tätigkeiten</p>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginBottom: 12 }}>{bericht.kompetenzanalyse.taetigkeiten_text}</p>
                  {bericht.kompetenzanalyse.taetigkeiten_anforderungen?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Strukturelle Anforderungen:</p>
                      <BulletList items={bericht.kompetenzanalyse.taetigkeiten_anforderungen} />
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, fontStyle: "italic", marginTop: 10 }}>{bericht.kompetenzanalyse.taetigkeiten_schluss}</p>
                </div>

                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>Humankompetenzen</p>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginBottom: 12 }}>{bericht.kompetenzanalyse.human_text}</p>
                  {bericht.kompetenzanalyse.human_anforderungen?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Gefordert sind:</p>
                      <BulletList items={bericht.kompetenzanalyse.human_anforderungen} />
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, fontStyle: "italic", marginTop: 10 }}>{bericht.kompetenzanalyse.human_schluss}</p>
                </div>
              </div>

              <Divider />

              {/* 06 Spannungsfelder */}
              {bericht.spannungsfelder?.length > 0 && (
                <>
                  <div style={{ padding: "28px 34px" }} data-testid="bericht-section-spannungsfelder">
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                      {chapterNum(chapter++)}
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Typische Spannungsfelder der Rolle</span>
                    </div>
                    <BulletList items={bericht.spannungsfelder} color="#0071E3" />
                    {bericht.spannungsfelder_schluss && (
                      <div style={{
                        marginTop: 16, padding: "14px 18px", borderRadius: 14,
                        background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
                        borderLeft: "3px solid rgba(0,113,227,0.25)",
                      }}>
                        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                          {bericht.spannungsfelder_schluss}
                        </p>
                      </div>
                    )}
                  </div>
                  <Divider />
                </>
              )}

              {/* 07 Risikobewertung */}
              <div style={{ padding: "28px 34px" }} data-testid="bericht-section-risiko">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                  {chapterNum(chapter++)}
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Risikobewertung bei struktureller Fehlpassung</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(bericht.risikobewertung || []).map((risk, i) => (
                    <RiskCard
                      key={i}
                      label={risk.label}
                      color={getRiskColor(risk.label)}
                      bullets={risk.bullets}
                      alltagssatz={risk.alltagssatz}
                    />
                  ))}
                </div>
              </div>

              {/* 08 Fazit */}
              <div style={{
                padding: "32px 34px 36px",
                background: "linear-gradient(180deg, rgba(0,113,227,0.04) 0%, rgba(52,170,220,0.02) 100%)",
                borderTop: "1px solid rgba(0,113,227,0.06)",
                borderRadius: "0 0 28px 28px",
              }} data-testid="bericht-section-fazit">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                  {chapterNum(chapter)}
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Fazit</span>
                </div>

                <p style={{
                  fontSize: 15, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.75, margin: 0,
                  paddingBottom: 16, borderBottom: "1px solid rgba(0,113,227,0.08)",
                }}>{bericht.fazit.kernsatz}</p>

                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>Entscheidend für die Besetzung ist eine Persönlichkeit, die:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(bericht.fazit.persoenlichkeit || []).map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                          background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check style={{ width: 10, height: 10, color: "#0071E3", strokeWidth: 2.5 }} />
                        </div>
                        <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginBottom: 12 }}>{bericht.fazit.fehlbesetzung}</p>

                <div style={{
                  marginTop: 4, padding: "16px 20px", borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.03))",
                  borderLeft: "3px solid rgba(0,113,227,0.25)",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: "rgba(0,113,227,0.10)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check style={{ width: 11, height: 11, color: "#0071E3", strokeWidth: 2.5 }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F", lineHeight: 1.75, margin: 0 }}>{bericht.fazit.schlusssatz}</p>
                </div>
              </div>

            </GlassCard>
          )}
        </main>
      </div>
    </div>
  );
}
