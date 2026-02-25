import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText, Lightbulb, CheckCircle2, Check, Users } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import { PROFILE_TEXTS, type VariantTexts } from "@/data/bericht-texte";

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

function classifyProfile(bg: BG): { type: ProfileType; intensity: Intensity; top1: string; top2: string } {
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
    return { type: "balanced_all", intensity: "balanced", top1: "none", top2: "none" };
  }
  if (max.value >= 55) {
    return { type: `strong_${max.key}` as ProfileType, intensity: "strong", top1: max.key, top2: second.key };
  }
  if (gap12 >= 8) {
    return { type: `dominant_${max.key}` as ProfileType, intensity: "clear", top1: max.key, top2: second.key };
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
    return { type: resolved as ProfileType, intensity: hybridIntensity, top1: k1, top2: k2 };
  }
  if (gap12 >= 5) {
    return { type: `light_${max.key}` as ProfileType, intensity: "light", top1: max.key, top2: second.key };
  }
  return { type: "balanced_all", intensity: "balanced", top1: "none", top2: "none" };
}

interface OverweightEffect {
  label: string;
  color: string;
  bullets: string[];
  text: string;
}

interface ReportTexts {
  intro: string;
  overall: string;
  tasks: string;
  human: string;
  leadership_section?: string;
  overweight: OverweightEffect[];
  conclusion: string;
}

function resolveProfileKey(profileType: ProfileType): string {
  const map: Record<string, string> = {
    balanced_all: "balanced_all",
    strong_imp: "imp", dominant_imp: "imp", light_imp: "imp",
    strong_ana: "ana", dominant_ana: "ana", light_ana: "ana",
    strong_int: "int", dominant_int: "int", light_int: "int",
    hybrid_imp_ana: "hybrid_imp_ana",
    hybrid_ana_int: "hybrid_ana_int",
    hybrid_imp_int: "hybrid_imp_int",
  };
  return map[profileType] || "balanced_all";
}

function resolveIntensityKey(profileType: ProfileType, intensity: Intensity): string {
  if (profileType === "balanced_all") return "balanced";
  if (profileType.startsWith("strong_")) return "strong";
  if (profileType.startsWith("dominant_")) return "clear";
  if (profileType.startsWith("light_")) return "light";
  if (profileType.startsWith("hybrid_")) return intensity;
  return intensity;
}

function getReportTexts(roleTitle: string, isLeadership: boolean, profileType: ProfileType, intensity: Intensity): ReportTexts {
  const profileKey = resolveProfileKey(profileType);
  const intensityKey = resolveIntensityKey(profileType, intensity);

  const profileData = PROFILE_TEXTS[profileKey] || PROFILE_TEXTS.balanced_all;
  const side = isLeadership ? profileData.leadership : profileData.noLeadership;

  let variant: VariantTexts | undefined = side[intensityKey];
  if (!variant) {
    const fallbackOrder = ["clear", "strong", "light", "balanced"];
    for (const fb of fallbackOrder) {
      if (side[fb]) { variant = side[fb]; break; }
    }
  }
  if (!variant) {
    const firstKey = Object.keys(side)[0];
    variant = side[firstKey];
  }

  const introPrefix = isLeadership
    ? `Dieser Bericht beschreibt die Anforderungen der Führungsrolle ${roleTitle}. `
    : `Dieser Bericht beschreibt die Anforderungen der Rolle ${roleTitle}. `;

  const owLabels: Record<string, { label: string; color: string }> = {
    speed_over: { label: "Wird zu viel Tempo gemacht", color: COLORS.imp },
    structure_over: { label: "Wird zu viel Struktur eingesetzt", color: COLORS.ana },
    collaboration_over: { label: "Wird zu viel Abstimmung priorisiert", color: COLORS.int },
  };

  const overweight: OverweightEffect[] = Object.entries(variant!.overweight).map(([key, val]) => ({
    label: owLabels[key]?.label || key,
    color: owLabels[key]?.color || "#6E6E73",
    bullets: val.bullets,
    text: val.text,
  }));

  return {
    intro: introPrefix + variant!.intro,
    overall: variant!.overall,
    tasks: variant!.tasks,
    human: variant!.human,
    leadership_section: variant!.leadership_section,
    overweight,
    conclusion: variant!.conclusion,
  };
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div>
      {data.map((bar) => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "#6E6E73", width: 72, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{
              width: `${Math.max(bar.value, 2)}%`,
              height: "100%",
              borderRadius: 6,
              background: bar.color,
              transition: "width 600ms ease",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
              minWidth: 40,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                {Math.round(bar.value)} %
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GlassCard({ children, style, testId, accentColor }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string; accentColor?: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 24,
        padding: "32px 30px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.04)",
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        ...style,
      }}
      data-testid={testId}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.07), inset 0 0 0 1px rgba(255,255,255,0.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)"; }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color, tag }: { icon: typeof BarChart3; title: string; color?: string; tag?: string }) {
  const c = color || "#0071E3";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 11,
        background: `linear-gradient(135deg, ${c}14, ${c}0A)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon style={{ width: 16, height: 16, color: c, strokeWidth: 1.8 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>{title}</p>
        {tag && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: c, textTransform: "uppercase", letterSpacing: "0.08em",
            background: `${c}0C`, padding: "3px 8px", borderRadius: 6,
          }}>{tag}</span>
        )}
      </div>
    </div>
  );
}

function ProseBlock({ text, accentColor }: { text: string; accentColor?: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 2) {
    return <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.8 }}>{text}</p>;
  }
  const lead = sentences.slice(0, 2).join(" ");
  const rest = sentences.slice(2).join(" ");
  return (
    <div>
      <p style={{
        fontSize: 15, fontWeight: 500, color: "#1D1D1F", lineHeight: 1.75,
        paddingBottom: 12, marginBottom: 12,
        borderBottom: `1px solid ${accentColor ? accentColor + "18" : "rgba(0,0,0,0.06)"}`,
      }}>{lead}</p>
      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8 }}>{rest}</p>
    </div>
  );
}

function KeyInsight({ text, color }: { text: string; color?: string }) {
  const c = color || "#0071E3";
  return (
    <div style={{
      marginTop: 16, padding: "14px 18px", borderRadius: 14,
      background: `linear-gradient(135deg, ${c}08, ${c}04)`,
      borderLeft: `3px solid ${c}30`,
    }}>
      <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{text}</p>
    </div>
  );
}

function BarsForProfile(bg: BG) {
  return <BarChart data={[
    { label: "Impulsiv", value: bg.imp, color: COLORS.imp },
    { label: "Intuitiv", value: bg.int, color: COLORS.int },
    { label: "Analytisch", value: bg.ana, color: COLORS.ana },
  ]} />;
}

function EffectCard({ label, color, bullets, text }: OverweightEffect) {
  return (
    <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: 16, padding: "20px 22px", border: `1px solid ${color}12` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle style={{ width: 12, height: 12, color, strokeWidth: 2 }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{label}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {bullets.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Check style={{ width: 12, height: 12, color: "#8E8E93", marginTop: 3, flexShrink: 0, strokeWidth: 2 }} />
            <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6 }}>{e}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "12px 14px", background: `${color}06`, borderRadius: 10, borderLeft: `3px solid ${color}` }}>
        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65, margin: 0 }}>{text}</p>
      </div>
    </div>
  );
}

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/ Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Innovations- & Transformationsleistung",
  "Prozess- und Effizienzqualität",
  "Fachliche Exzellenz / Expertise",
  "Strategische Wirkung / Positionierung",
];

function getFuehrungskontextText(fuehrungstyp: string, gesamt: BG, arbeitslogik: string): string {
  const sorted = [
    { key: "imp", value: gesamt.imp },
    { key: "int", value: gesamt.int },
    { key: "ana", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];

  if (fuehrungstyp === "Disziplinarische Führung mit Ergebnisverantwortung") {
    let text = `Die Rolle umfasst disziplinarische Führungsverantwortung mit direkter Ergebnisverantwortung. Die Führungskraft entscheidet über Personalthemen, trägt Budgetverantwortung und wird an messbaren Ergebnissen gemessen. Diese Verantwortungstiefe prägt den Arbeitsalltag grundlegend.`;
    if (top.key === "imp") {
      text += ` In Verbindung mit der umsetzungsorientierten Ausrichtung wird erwartet, dass Führung über klare Zielvorgaben, konsequentes Nachhalten und schnelle Eskalation bei Abweichungen erfolgt. Entscheidungen werden top-down getroffen, das Team erhält Richtung über Ergebnisse, nicht über Konsens. Zögern oder übermäßiges Absichern widerspricht der Grundlogik dieser Besetzung.`;
      if (arbeitslogik === "Umsetzungsorientiert") text += ` Die umsetzungsorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    } else if (top.key === "ana") {
      text += ` In Verbindung mit der strukturorientierten Ausrichtung wird erwartet, dass Führung über klare Rahmenbedingungen, definierte Prozesse und nachvollziehbare Entscheidungen erfolgt. Standards werden gesetzt und systematisch eingehalten. Die Führungskraft schafft Orientierung durch Ordnung und Verlässlichkeit.`;
      if (arbeitslogik === "Daten-/prozessorientiert") text += ` Die daten- und prozessorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    } else {
      text += ` In Verbindung mit der kooperativen Ausrichtung wird erwartet, dass Führung über Einbindung, Abstimmung und tragfähige Entscheidungen erfolgt. Das Team wird aktiv eingebunden, Entscheidungen werden so gestaltet, dass sie getragen werden – ohne dabei die Ergebnisverantwortung aus den Augen zu verlieren.`;
      if (arbeitslogik === "Menschenorientiert") text += ` Die menschenorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    }
    return text;
  }

  if (fuehrungstyp === "Fachliche Führung") {
    let text = `Die Rolle umfasst fachliche Führungsverantwortung ohne disziplinarische Befugnis. Die Führungskraft steuert über Expertise, setzt inhaltliche Standards und gibt Richtung über Qualität und Methodik. Führungswirkung muss über Kompetenz und Überzeugung entstehen.`;
    if (top.key === "ana") {
      text += ` In Verbindung mit der strukturorientierten Ausrichtung bedeutet dies: Fachliche Führung erfolgt über klare Standards, lückenlose Dokumentation und systematische Qualitätssicherung. Die Führungskraft ist Referenzpunkt für Genauigkeit und methodische Tiefe.`;
      if (arbeitslogik === "Daten-/prozessorientiert") text += ` Die daten- und prozessorientierte Arbeitslogik unterstreicht diese Anforderung zusätzlich.`;
    } else if (top.key === "imp") {
      text += ` In Verbindung mit der umsetzungsorientierten Ausrichtung bedeutet dies: Fachliche Führung erfolgt pragmatisch und ergebnisorientiert. Fachliche Standards werden so gesetzt, dass sie die Umsetzung unterstützen, nicht bremsen.`;
      if (arbeitslogik === "Umsetzungsorientiert") text += ` Die umsetzungsorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    } else {
      text += ` In Verbindung mit der kooperativen Ausrichtung bedeutet dies: Fachliche Führung erfolgt über Dialog, aktive Wissensweitergabe und gemeinsame Standards. Fachliche Autorität entsteht durch Anschlussfähigkeit, nicht durch Distanz.`;
      if (arbeitslogik === "Menschenorientiert") text += ` Die menschenorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    }
    return text;
  }

  if (fuehrungstyp === "Projekt-/Teamkoordination") {
    let text = `Die Rolle umfasst koordinierende Verantwortung für Projekte oder Teams. Die Steuerung erfolgt über Abstimmung, Priorisierung und Schnittstellenmanagement – ohne formale Weisungsbefugnis. Wirksamkeit entsteht über Einfluss, nicht über Anordnung.`;
    if (top.key === "int") {
      text += ` In Verbindung mit der kooperativen Ausrichtung bedeutet dies: Koordination erfolgt über enge Abstimmung, aktive Kommunikation und situatives Eingreifen. Die Führungskraft hält das Team zusammen und stellt sicher, dass Informationen fließen und Schnittstellen funktionieren.`;
      if (arbeitslogik === "Menschenorientiert") text += ` Die menschenorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    } else if (top.key === "imp") {
      text += ` In Verbindung mit der umsetzungsorientierten Ausrichtung bedeutet dies: Koordination erfolgt ergebnisorientiert mit klarem Fokus auf Fortschritt und Abschluss. Die Führungskraft priorisiert pragmatisch und eskaliert bei Blockaden schnell.`;
      if (arbeitslogik === "Umsetzungsorientiert") text += ` Die umsetzungsorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    } else {
      text += ` In Verbindung mit der strukturorientierten Ausrichtung bedeutet dies: Koordination erfolgt über klare Pläne, definierte Meilensteine und systematische Nachverfolgung. Die Führungskraft sorgt für Ordnung und Transparenz im Prozess.`;
      if (arbeitslogik === "Daten-/prozessorientiert") text += ` Die daten- und prozessorientierte Arbeitslogik verstärkt diese Anforderung zusätzlich.`;
    }
    return text;
  }
  return "";
}

function getRahmenbedingungenText(aufgabencharakter: string, arbeitslogik: string, erfolgsfokusIndices: number[], gesamt: BG): string {
  const sorted = [
    { key: "imp", value: gesamt.imp },
    { key: "int", value: gesamt.int },
    { key: "ana", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const parts: string[] = [];

  if (aufgabencharakter === "überwiegend operativ") {
    let t = "Der Aufgabencharakter ist überwiegend operativ – im Vordergrund steht die direkte Umsetzung und das Erzielen konkreter Arbeitsergebnisse im Tagesgeschäft.";
    if (top.key === "imp") t += " Dies passt zur umsetzungsorientierten Grundausrichtung: Ergebnisse entstehen durch direktes Handeln, pragmatisches Arbeiten und konsequentes Abschließen.";
    else if (top.key === "ana") t += " In Kombination mit der strukturorientierten Grundausrichtung werden operative Aufgaben systematisch und nach klaren Vorgaben bearbeitet.";
    else t += " In Kombination mit der kooperativen Grundausrichtung werden operative Aufgaben in enger Abstimmung mit dem Umfeld bearbeitet.";
    parts.push(t);
  } else if (aufgabencharakter === "überwiegend strategisch") {
    let t = "Der Aufgabencharakter ist überwiegend strategisch – im Vordergrund stehen Planung, Analyse und die Entwicklung langfristiger Konzepte.";
    if (top.key === "ana") t += " Dies passt zur strukturorientierten Grundausrichtung: Strategische Arbeit lebt von Analyse, Datengrundlage und systematischer Planung.";
    else if (top.key === "imp") t += " In Kombination mit der umsetzungsorientierten Grundausrichtung dient strategische Planung der schnelleren und konsequenteren Umsetzung.";
    else t += " In Kombination mit der kooperativen Grundausrichtung erfolgt strategische Arbeit im Dialog mit Stakeholdern und Schnittstellen.";
    parts.push(t);
  } else if (aufgabencharakter === "überwiegend systemisch") {
    let t = "Der Aufgabencharakter ist überwiegend systemisch – im Vordergrund stehen die Arbeit an Schnittstellen und die Gestaltung von Zusammenarbeit.";
    if (top.key === "int") t += " Dies passt zur kooperativen Grundausrichtung: Systemische Arbeit lebt von Beziehungsfähigkeit und situativem Handeln.";
    else if (top.key === "imp") t += " In Kombination mit der umsetzungsorientierten Grundausrichtung wird systemische Arbeit ergebnisorientiert betrieben.";
    else t += " In Kombination mit der strukturorientierten Grundausrichtung wird systemische Arbeit methodisch angegangen und Schnittstellen klar definiert.";
    parts.push(t);
  } else if (aufgabencharakter === "Gemischt") {
    let t = "Der Aufgabencharakter ist gemischt – die Rolle verbindet operative, strategische und systemische Anforderungen.";
    if (top.key === "imp") t += " Bei der umsetzungsorientierten Grundausrichtung liegt der Schwerpunkt eher auf operativen Aufgaben.";
    else if (top.key === "ana") t += " Bei der strukturorientierten Grundausrichtung werden alle Aufgabentypen systematisch und nach klaren Prioritäten bearbeitet.";
    else t += " Bei der kooperativen Grundausrichtung werden die Aufgabentypen im Dialog mit dem Umfeld bearbeitet.";
    parts.push(t);
  }

  if (arbeitslogik === "Umsetzungsorientiert") {
    let t = "Die vorherrschende Arbeitslogik ist umsetzungsorientiert – Ergebnisse werden durch direkte Aktion erzielt, Geschwindigkeit und Konsequenz stehen im Vordergrund.";
    if (top.key === "imp") t += " Dies korrespondiert direkt mit der Grundausrichtung und erzeugt eine besonders klare Ergebniserwartung.";
    else if (top.key === "ana") t += " Dies steht in einem produktiven Spannungsfeld zur strukturorientierten Grundausrichtung: Tempo und Ordnung müssen gleichzeitig bedient werden.";
    else t += " Ergebnisse müssen erzielt werden, aber im Einklang mit dem kooperativen Umfeld.";
    parts.push(t);
  } else if (arbeitslogik === "Menschenorientiert") {
    let t = "Die vorherrschende Arbeitslogik ist menschenorientiert – Ergebnisse entstehen über Zusammenarbeit, Abstimmung und tragfähige Beziehungen.";
    if (top.key === "int") t += " Dies korrespondiert direkt mit der kooperativen Grundausrichtung und erzeugt eine besonders klare Erwartung an Kommunikation und Einbindung.";
    else if (top.key === "imp") t += " Dies steht in einem Spannungsfeld zur umsetzungsorientierten Grundausrichtung: Tempo und Einbindung müssen gleichzeitig geleistet werden.";
    else t += " Ordnung und Prozesse allein reichen nicht – die Person muss auch kommunizieren und Erwartungen klären.";
    parts.push(t);
  } else if (arbeitslogik === "Daten-/prozessorientiert") {
    let t = "Die vorherrschende Arbeitslogik ist daten- und prozessorientiert – Ergebnisse entstehen über systematische Analyse und nachvollziehbare Entscheidungen.";
    if (top.key === "ana") t += " Dies korrespondiert direkt mit der strukturorientierten Grundausrichtung und erzeugt eine besonders klare Erwartung an Qualität und Nachvollziehbarkeit.";
    else if (top.key === "imp") t += " Dies steht in einem Spannungsfeld zur umsetzungsorientierten Grundausrichtung: schnelles Handeln und faktenbasierte Entscheidungen müssen zusammengehen.";
    else t += " Abstimmung und Dialog basieren auf Fakten, nicht auf Meinungen.";
    parts.push(t);
  }

  if (erfolgsfokusIndices.length > 0) {
    const labels = erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);
    if (labels.length > 0) {
      const fokusListe = labels.length === 1
        ? labels[0]
        : labels.slice(0, -1).join(", ") + " und " + labels[labels.length - 1];
      let t = `Der definierte Erfolgsfokus liegt auf ${fokusListe}. Diese Ausrichtung bestimmt, woran die Wirksamkeit gemessen wird.`;

      const hasErgebnis = erfolgsfokusIndices.includes(0);
      const hasBeziehung = erfolgsfokusIndices.includes(1);
      const hasProzess = erfolgsfokusIndices.includes(3);

      if (hasErgebnis && top.key === "imp") t += " Die umsetzungsorientierte Grundausrichtung unterstützt den Ergebnisfokus direkt – Tempo und Konsequenz treiben das Ergebnis.";
      if (hasBeziehung && top.key === "int") t += " Die kooperative Grundausrichtung unterstützt den Beziehungsfokus direkt – tragfähige Beziehungen entstehen natürlich aus kooperativer Arbeit.";
      if (hasProzess && top.key === "ana") t += " Die strukturorientierte Grundausrichtung unterstützt den Prozessfokus direkt – Ordnung und Systematik treiben Prozessqualität.";
      parts.push(t);
    }
  }

  return parts.join("\n\n");
}

function getFazitText(
  conclusionBase: string,
  gesamt: BG,
  isLeadership: boolean,
  intensity: Intensity,
  aufgabencharakter: string,
  arbeitslogik: string,
  fuehrungstyp: string,
): string[] {
  const sorted = [
    { key: "imp", label: "Umsetzungsorientierung", value: gesamt.imp },
    { key: "int", label: "Kooperationsfähigkeit", value: gesamt.int },
    { key: "ana", label: "Strukturorientierung", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const low = sorted[2];

  const paragraphs: string[] = [];

  paragraphs.push(conclusionBase);

  let profilSatz = "";
  if (intensity === "strong") {
    profilSatz = `Das Anforderungsprofil zeigt eine eindeutige Ausprägung: ${top.label} dominiert mit ${top.value} % und bestimmt den Charakter der Rolle maßgeblich. Wer diese Stelle besetzt, muss diesen Schwerpunkt nicht nur mitbringen, sondern aktiv leben.`;
  } else if (intensity === "clear") {
    profilSatz = `Das Anforderungsprofil zeigt eine deutliche Tendenz: ${top.label} bildet mit ${top.value} % den erkennbaren Schwerpunkt. Diese Ausrichtung sollte bei der Besetzung klar berücksichtigt werden, auch wenn weitere Kompetenzen gefordert sind.`;
  } else if (intensity === "light") {
    profilSatz = `Das Anforderungsprofil zeigt eine erkennbare, aber nicht exklusive Tendenz. ${top.label} bildet den Schwerpunkt, wird aber durch die anderen Bereiche substantiell ergänzt. Die Rolle verlangt Flexibilität.`;
  } else {
    profilSatz = "Das Anforderungsprofil ist ausgeglichen. Alle drei Kompetenzbereiche sind in ähnlichem Maß gefordert. Die Rolle verlangt von der Person Vielseitigkeit und die Fähigkeit, zwischen unterschiedlichen Anforderungen zu wechseln.";
  }
  paragraphs.push(profilSatz);

  if (aufgabencharakter && arbeitslogik) {
    let kontextSatz = `Der ${aufgabencharakter.startsWith("ü") ? aufgabencharakter : aufgabencharakter.toLowerCase()}e Aufgabencharakter in Verbindung mit der ${arbeitslogik === "Daten-/prozessorientiert" ? "daten- und prozessorientierten" : arbeitslogik === "Menschenorientiert" ? "menschenorientierten" : "umsetzungsorientierten"} Arbeitslogik `;
    if (
      (top.key === "imp" && arbeitslogik === "Umsetzungsorientiert") ||
      (top.key === "ana" && arbeitslogik === "Daten-/prozessorientiert") ||
      (top.key === "int" && arbeitslogik === "Menschenorientiert")
    ) {
      kontextSatz += "verstärkt die Grundausrichtung des Profils. Rahmenbedingungen und Kompetenzstruktur zeigen in dieselbe Richtung – die Anforderung ist konsistent und klar.";
    } else {
      kontextSatz += "erzeugt ein produktives Spannungsfeld. Die Person muss unterschiedliche Anforderungen gleichzeitig bedienen können, ohne einen Bereich zu vernachlässigen.";
    }
    paragraphs.push(kontextSatz);
  }

  if (isLeadership) {
    let fuehrungsSatz = "Die Führungsverantwortung erhöht die Anforderung zusätzlich. ";
    if (fuehrungstyp === "Disziplinarische Führung mit Ergebnisverantwortung") {
      fuehrungsSatz += "Als disziplinarische Führungskraft mit Ergebnisverantwortung muss die Person nicht nur fachlich passen, sondern auch unter Druck tragfähige Entscheidungen treffen und Verantwortung für Team und Budget übernehmen. Eine strukturelle Fehlbesetzung auf dieser Ebene wirkt sich direkt auf Teamstabilität und Ergebnis aus.";
    } else if (fuehrungstyp === "Fachliche Führung") {
      fuehrungsSatz += "Als fachliche Führungskraft muss die Person über Kompetenz und Überzeugung führen – ohne formale Weisungsbefugnis. Eine strukturelle Fehlbesetzung führt hier zu Autoritätsverlust und sinkender Orientierung im Team.";
    } else {
      fuehrungsSatz += "In der koordinierenden Funktion muss die Person über Einfluss und Abstimmung wirken. Eine strukturelle Fehlbesetzung führt hier zu Reibungsverlusten an Schnittstellen und stockenden Prozessen.";
    }
    paragraphs.push(fuehrungsSatz);
  }

  let schluss = "Entscheidend für eine erfolgreiche Besetzung ist nicht die fachliche Qualifikation allein, sondern die strukturelle Passung zwischen Person und Rolle. ";
  if (low.value < 20) {
    schluss += `Der Bereich ${low.label} ist in dieser Rolle mit ${low.value} % am geringsten gefordert – eine Überbetonung dieses Bereichs durch die Person würde zu Reibung und Ineffizienz führen. `;
  }
  schluss += "Dieser Bericht bietet die Grundlage, um Besetzungsentscheidungen nicht nur nach Lebenslauf, sondern nach struktureller Eignung zu treffen.";
  paragraphs.push(schluss);

  return paragraphs;
}

export default function Bericht() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<{
    beruf: string; isLeadership: boolean;
    gesamt: BG; haupt: BG; neben: BG; fuehrung: BG;
    texts: ReportTexts; intensity: Intensity;
    rahmenbedingungenText: string; fuehrungskontextText: string;
    fazitParagraphs: string[];
  } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const beruf = state.beruf || "Unbenannte Rolle";
      const fuehrungstyp = state.fuehrung || "Keine";
      const isLeadership = fuehrungstyp !== "Keine";
      const taetigkeiten = state.taetigkeiten || [];
      const arbeitslogik = state.arbeitslogik || "";
      const aufgabencharakter = state.aufgabencharakter || "";
      const haupt = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
      const neben = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
      const fuehrung = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
      const rahmen = computeRahmen(state);
      const gesamt = computeGesamt(haupt, neben, fuehrung, rahmen);
      const { type, intensity } = classifyProfile(gesamt);
      const texts = getReportTexts(beruf, isLeadership, type, intensity);
      const rahmenbedingungenText = getRahmenbedingungenText(aufgabencharakter, arbeitslogik, state.erfolgsfokusIndices || [], gesamt);
      const fuehrungskontextText = isLeadership ? getFuehrungskontextText(fuehrungstyp, gesamt, arbeitslogik) : "";
      const fazitParagraphs = getFazitText(texts.conclusion, gesamt, isLeadership, intensity, aufgabencharakter, arbeitslogik, fuehrungstyp);
      setData({ beruf, isLeadership, gesamt, haupt, neben, fuehrung, texts, intensity, rahmenbedingungenText, fuehrungskontextText, fazitParagraphs });
    } catch {}
  }, []);

  if (!data) {
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

  const { beruf, isLeadership, gesamt, haupt, neben, fuehrung, texts, intensity, rahmenbedingungenText, fuehrungskontextText, fazitParagraphs } = data;

  const intensityNote = intensity === "strong"
    ? "Der Schwerpunkt ist eindeutig."
    : intensity === "clear"
      ? "Die Ausrichtung ist klar erkennbar."
      : intensity === "light"
        ? "Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv."
        : "";

  const chapterNum = (n: number) => (
    <span style={{
      fontSize: 11, fontWeight: 700, color: "#0071E3",
      background: "rgba(0,113,227,0.07)", borderRadius: 6,
      padding: "2px 8px", marginRight: 8, fontVariantNumeric: "tabular-nums",
    }}>{String(n).padStart(2, "0")}</span>
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
            </header>
          </div>
        </div>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20 pt-6">
          <div className="text-center mb-12">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(0,113,227,0.06)", borderRadius: 20, padding: "5px 14px", marginBottom: 14,
            }}>
              <FileText style={{ width: 12, height: 12, color: "#0071E3" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.08em" }}>Strukturanalyse</span>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.1 }} data-testid="text-bericht-title">
              Entscheidungsbericht
            </h1>
            <p style={{ fontSize: 16, color: "#6E6E73", fontWeight: 400, lineHeight: 1.5, marginTop: 10 }}>
              Strukturelle Anforderungsanalyse: <span style={{ fontWeight: 600, color: "#3A3A3C" }}>{beruf}</span>
            </p>
          </div>

          <GlassCard testId="bericht-report" style={{
            padding: 0, borderRadius: 28, overflow: "hidden",
          }}>

            <div style={{ padding: "36px 34px 28px" }} data-testid="bericht-section-intro">
              <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                {chapterNum(chapter++)}
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Einleitung</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#1D1D1F", lineHeight: 1.75, marginBottom: 10 }}>
                Fachliche Qualifikation allein sichert keine Leistung. Mitarbeitende, die persönlich zur Stelle passen, arbeiten wirksamer, bleiben länger und stabilisieren ihr Umfeld.
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8 }}>
                Dieser Bericht beschreibt, welche strukturellen Anforderungen die Rolle stellt – unabhängig von Lebenslauf und Zertifikaten. {texts.intro}
              </p>
              {intensityNote && <KeyInsight text={intensityNote} />}
            </div>

            <div style={{ margin: "0 34px", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />

            {rahmenbedingungenText && (
              <>
                <div style={{ padding: "28px 34px" }} data-testid="bericht-section-rahmen">
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                    {chapterNum(chapter++)}
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Rahmenbedingungen</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {rahmenbedingungenText.split("\n\n").map((paragraph, i) => (
                      <p key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, margin: 0 }}>{paragraph}</p>
                    ))}
                  </div>
                </div>
                <div style={{ margin: "0 34px", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />
              </>
            )}

            {isLeadership && fuehrungskontextText && (
              <>
                <div style={{ padding: "28px 34px" }} data-testid="bericht-section-fuehrung">
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                    {chapterNum(chapter++)}
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Führungskontext</span>
                  </div>
                  <ProseBlock text={fuehrungskontextText} accentColor="#1A5DAB" />
                </div>
                <div style={{ margin: "0 34px", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />
              </>
            )}

            <div style={{ padding: "28px 34px" }} data-testid="bericht-section-kompetenz">
              <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                {chapterNum(chapter++)}
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Kompetenzanalyse</span>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BarChart3 style={{ width: 15, height: 15, color: "#0071E3", strokeWidth: 1.8 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>Gesamtprofil</span>
                </div>
                {BarsForProfile(gesamt)}
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginTop: 14 }}>{texts.overall}</p>
              </div>

              <div style={{ height: 1, background: "rgba(0,0,0,0.04)", margin: "0 0 28px" }} />

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Briefcase style={{ width: 15, height: 15, color: "#F39200", strokeWidth: 1.8 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>Tätigkeitsstruktur</span>
                </div>
                {BarsForProfile(haupt)}
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginTop: 14 }}>{texts.tasks}</p>
              </div>

              <div style={{ height: 1, background: "rgba(0,0,0,0.04)", margin: "0 0 28px" }} />

              <div style={{ marginBottom: isLeadership && texts.leadership_section ? 28 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Heart style={{ width: 15, height: 15, color: "#C41E3A", strokeWidth: 1.8 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>Humankompetenzen</span>
                </div>
                {BarsForProfile(neben)}
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginTop: 14 }}>{texts.human}</p>
              </div>

              {isLeadership && texts.leadership_section && (
                <>
                  <div style={{ height: 1, background: "rgba(0,0,0,0.04)", margin: "0 0 28px" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Shield style={{ width: 15, height: 15, color: "#1A5DAB", strokeWidth: 1.8 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>Führungskompetenzen</span>
                    </div>
                    {BarsForProfile(fuehrung)}
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginTop: 14 }}>{texts.leadership_section}</p>
                  </div>
                </>
              )}
            </div>

            <div style={{ margin: "0 34px", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />

            <div style={{ padding: "28px 34px" }} data-testid="bericht-section-risiko">
              <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                {chapterNum(chapter++)}
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Risikobewertung</span>
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginBottom: 18 }}>
                Was passiert, wenn die strukturelle Passung nicht gegeben ist? Die folgenden Szenarien beschreiben typische Auswirkungen bei Abweichungen vom Anforderungsprofil.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {texts.overweight.map((ow, i) => (
                  <EffectCard key={i} {...ow} />
                ))}
              </div>
            </div>

            <div style={{
              padding: "32px 34px",
              background: "linear-gradient(135deg, rgba(0,113,227,0.05), rgba(52,170,220,0.03))",
              borderTop: "1px solid rgba(0,113,227,0.08)",
            }} data-testid="bericht-section-fazit">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                {chapterNum(chapter)}
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>Fazit</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {fazitParagraphs.map((p, i) => (
                  <p key={i} style={{
                    fontSize: i === 0 ? 15 : 14,
                    fontWeight: i === 0 ? 600 : 400,
                    color: i === 0 ? "#1D1D1F" : "#48484A",
                    lineHeight: 1.75,
                    margin: 0,
                    ...(i === 0 ? { paddingBottom: 14, borderBottom: "1px solid rgba(0,113,227,0.08)" } : {}),
                    ...(i === fazitParagraphs.length - 1 ? {
                      marginTop: 4, padding: "14px 18px", borderRadius: 14,
                      background: "rgba(0,113,227,0.04)", borderLeft: "3px solid rgba(0,113,227,0.20)",
                      fontSize: 13, fontWeight: 500, color: "#1D1D1F",
                    } : {}),
                  }}>{p}</p>
                ))}
              </div>
            </div>

          </GlassCard>
        </main>
      </div>
    </div>
  );
}
