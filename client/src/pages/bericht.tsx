import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText, Lightbulb, CheckCircle2, Check, Users, Settings, Target, Crosshair } from "lucide-react";
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

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 24,
        padding: "28px 28px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.04)",
        ...style,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: typeof BarChart3; title: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: color ? `linear-gradient(135deg, ${color}10, ${color}18)` : "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon style={{ width: 16, height: 16, color: color || "#0071E3", strokeWidth: 1.8 }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
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

function getFuehrungskontextText(fuehrungstyp: string, gesamt: BG, beruf: string, arbeitslogik: string): string {
  const sorted = [
    { key: "imp", value: gesamt.imp },
    { key: "int", value: gesamt.int },
    { key: "ana", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];

  if (fuehrungstyp === "Disziplinarische Führung mit Ergebnisverantwortung") {
    let text = `Die Stelle ${beruf} umfasst disziplinarische Führungsverantwortung mit direkter Ergebnisverantwortung. Das bedeutet: Die Führungskraft entscheidet über Personalthemen, trägt Budgetverantwortung und wird an messbaren Ergebnissen gemessen. Diese Verantwortungstiefe prägt den Arbeitsalltag grundlegend – jede Entscheidung hat direkte Auswirkungen auf Team, Budget und Ergebnis.`;
    if (top.key === "imp") {
      text += ` In Verbindung mit der umsetzungsorientierten Ausrichtung der Rolle ${beruf} wird erwartet, dass Führung über klare Zielvorgaben, konsequentes Nachhalten und schnelle Eskalation bei Abweichungen erfolgt. Entscheidungen werden top-down getroffen, das Team erhält Richtung über Ergebnisse, nicht über Konsens. Die Führungskraft muss unter Druck handlungsfähig bleiben und Verantwortung sofort übernehmen. Zögern oder übermäßiges Absichern widerspricht der Grundlogik dieser Besetzung.`;
      if (arbeitslogik === "Umsetzungsorientiert") text += ` Die umsetzungsorientierte Arbeitslogik verstärkt diese Anforderung: Ergebnisse werden durch direktes Handeln erzielt, nicht durch Planung oder Abstimmung.`;
    } else if (top.key === "ana") {
      text += ` In Verbindung mit der strukturorientierten Ausrichtung der Rolle ${beruf} wird erwartet, dass Führung über klare Rahmenbedingungen, definierte Prozesse und nachvollziehbare Entscheidungen erfolgt. Standards werden gesetzt und systematisch eingehalten. Verantwortung wird über Transparenz und Qualitätsniveaus gesteuert. Die Führungskraft schafft Orientierung durch Ordnung und Verlässlichkeit, nicht durch Charisma oder Tempo.`;
      if (arbeitslogik === "Daten-/prozessorientiert") text += ` Die daten- und prozessorientierte Arbeitslogik verstärkt diese Anforderung: Entscheidungen basieren auf Fakten, Abweichungen werden systematisch analysiert.`;
    } else {
      text += ` In Verbindung mit der kooperativen Ausrichtung der Rolle ${beruf} wird erwartet, dass Führung über Einbindung, Abstimmung und tragfähige Entscheidungen erfolgt. Das Team wird aktiv eingebunden, Entscheidungen werden so gestaltet, dass sie getragen werden – ohne dabei die Ergebnisverantwortung aus den Augen zu verlieren. Die Führungskraft muss Beziehungen aufbauen und gleichzeitig Ergebnisse einfordern können.`;
      if (arbeitslogik === "Menschenorientiert") text += ` Die menschenorientierte Arbeitslogik verstärkt diese Anforderung: Wirksamkeit entsteht über stabile Beziehungen und offene Kommunikation.`;
    }
    return text;
  }

  if (fuehrungstyp === "Fachliche Führung") {
    let text = `Die Stelle ${beruf} umfasst fachliche Führungsverantwortung ohne disziplinarische Befugnis. Die Führungskraft steuert über fachliche Expertise, setzt inhaltliche Standards und gibt Richtung über Qualität und Methodik. Ohne formale Weisungsbefugnis muss die Führungswirkung über Kompetenz und Überzeugung entstehen.`;
    if (top.key === "ana") {
      text += ` In Verbindung mit der strukturorientierten Ausrichtung der Rolle ${beruf} bedeutet dies: Fachliche Führung erfolgt über klare Standards, lückenlose Dokumentation und systematische Qualitätssicherung. Entscheidungen werden fachlich begründet und nachvollziehbar gemacht. Die Führungskraft ist Referenzpunkt für Genauigkeit, Verlässlichkeit und methodische Tiefe. Fachliche Autorität entsteht durch nachweisbare Expertise.`;
      if (arbeitslogik === "Daten-/prozessorientiert") text += ` Die daten- und prozessorientierte Arbeitslogik unterstreicht diese Anforderung: Qualität wird messbar gemacht, Prozesse werden kontinuierlich optimiert.`;
    } else if (top.key === "imp") {
      text += ` In Verbindung mit der umsetzungsorientierten Ausrichtung der Rolle ${beruf} bedeutet dies: Fachliche Führung erfolgt pragmatisch und ergebnisorientiert. Fachliche Standards werden so gesetzt, dass sie die Umsetzung unterstützen, nicht bremsen. Die Führungskraft verbindet Expertise mit Handlungsfähigkeit und sorgt dafür, dass fachliche Entscheidungen schnell in Ergebnisse übersetzt werden.`;
      if (arbeitslogik === "Umsetzungsorientiert") text += ` Die umsetzungsorientierte Arbeitslogik verstärkt diese Anforderung: Fachliche Tiefe dient der Geschwindigkeit, nicht der Absicherung.`;
    } else {
      text += ` In Verbindung mit der kooperativen Ausrichtung der Rolle ${beruf} bedeutet dies: Fachliche Führung erfolgt über Dialog, aktive Wissensweitergabe und gemeinsame Qualitätsstandards. Die Führungskraft teilt Wissen offen und stellt sicher, dass fachliche Entscheidungen im Team verstanden und mitgetragen werden. Fachliche Autorität entsteht durch Anschlussfähigkeit, nicht durch Distanz.`;
      if (arbeitslogik === "Menschenorientiert") text += ` Die menschenorientierte Arbeitslogik verstärkt diese Anforderung: Fachliche Kompetenz wird über Beziehung und Dialog vermittelt.`;
    }
    return text;
  }

  if (fuehrungstyp === "Projekt-/Teamkoordination") {
    let text = `Die Stelle ${beruf} umfasst koordinierende Verantwortung für Projekte oder Teams. Die Führungskraft steuert über Abstimmung, Priorisierung und Schnittstellenmanagement – ohne formale Weisungsbefugnis. Wirksamkeit entsteht über Einfluss, nicht über Anordnung.`;
    if (top.key === "int") {
      text += ` In Verbindung mit der kooperativen Ausrichtung der Rolle ${beruf} bedeutet dies: Koordination erfolgt über enge Abstimmung, aktive Kommunikation und situatives Eingreifen. Die Führungskraft hält das Team zusammen und stellt sicher, dass Informationen fließen und Schnittstellen reibungslos funktionieren. Konflikte werden früh erkannt und moderiert, bevor sie eskalieren.`;
      if (arbeitslogik === "Menschenorientiert") text += ` Die menschenorientierte Arbeitslogik verstärkt diese Anforderung: Koordination lebt von Vertrauen, Offenheit und aktivem Zuhören.`;
    } else if (top.key === "imp") {
      text += ` In Verbindung mit der umsetzungsorientierten Ausrichtung der Rolle ${beruf} bedeutet dies: Koordination erfolgt ergebnisorientiert mit klarem Fokus auf Fortschritt und Abschluss. Die Führungskraft priorisiert pragmatisch, treibt den Prozess aktiv voran und eskaliert bei Blockaden schnell. Abstimmung dient dem Ergebnis, nicht dem Konsens.`;
      if (arbeitslogik === "Umsetzungsorientiert") text += ` Die umsetzungsorientierte Arbeitslogik verstärkt diese Anforderung: Koordination bedeutet hier Tempo machen und Hindernisse beseitigen.`;
    } else {
      text += ` In Verbindung mit der strukturorientierten Ausrichtung der Rolle ${beruf} bedeutet dies: Koordination erfolgt über klare Pläne, definierte Meilensteine und systematische Nachverfolgung. Die Führungskraft sorgt für Ordnung im Prozess und Transparenz über den Projektfortschritt. Abweichungen werden dokumentiert und systematisch bearbeitet.`;
      if (arbeitslogik === "Daten-/prozessorientiert") text += ` Die daten- und prozessorientierte Arbeitslogik verstärkt diese Anforderung: Koordination basiert auf Fakten, Plänen und nachvollziehbaren Meilensteinen.`;
    }
    return text;
  }
  return "";
}

function getAufgabencharakterText(aufgabencharakter: string, beruf: string, gesamt: BG): string {
  const sorted = [
    { key: "imp", value: gesamt.imp },
    { key: "int", value: gesamt.int },
    { key: "ana", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];

  if (aufgabencharakter === "überwiegend operativ") {
    let text = `Der Aufgabencharakter der Stelle ${beruf} ist überwiegend operativ. Im Vordergrund steht die direkte Umsetzung und das Erzielen konkreter Arbeitsergebnisse im Tagesgeschäft. Planung und Strategie spielen eine untergeordnete Rolle – gefragt ist Handlungsfähigkeit in laufenden Prozessen.`;
    if (top.key === "imp") text += ` Dies passt zur umsetzungsorientierten Grundausrichtung der Rolle: Ergebnisse entstehen durch direktes Handeln. Die Person muss pragmatisch arbeiten, schnell reagieren und Aufgaben konsequent abschließen können.`;
    else if (top.key === "ana") text += ` In Kombination mit der strukturorientierten Grundausrichtung der Rolle bedeutet dies: Operative Aufgaben werden systematisch und nach klaren Vorgaben bearbeitet. Qualitätssicherung und Dokumentation begleiten die tägliche Umsetzung.`;
    else text += ` In Kombination mit der kooperativen Grundausrichtung der Rolle bedeutet dies: Operative Aufgaben werden in enger Abstimmung mit dem Umfeld bearbeitet. Die Person muss handeln und gleichzeitig kommunizieren, um Schnittstellen sauber zu bedienen.`;
    return text;
  }
  if (aufgabencharakter === "überwiegend strategisch") {
    let text = `Der Aufgabencharakter der Stelle ${beruf} ist überwiegend strategisch. Im Vordergrund stehen Planung, Analyse und die Entwicklung langfristiger Konzepte. Die operative Umsetzung wird delegiert oder erfolgt in nachgeordneten Prozessen. Die Wirkung entsteht über Weitsicht, nicht über Tagesgeschäft.`;
    if (top.key === "ana") text += ` Dies passt zur strukturorientierten Grundausrichtung der Rolle: Strategische Arbeit lebt von Analyse, Datengrundlage und systematischer Planung. Entscheidungen werden vorbereitet, geprüft und nachvollziehbar dokumentiert.`;
    else if (top.key === "imp") text += ` In Kombination mit der umsetzungsorientierten Grundausrichtung bedeutet dies: Strategische Planung dient hier nicht dem Selbstzweck, sondern der schnelleren und konsequenteren Umsetzung. Die Person muss strategisch denken und gleichzeitig handlungsorientiert bleiben.`;
    else text += ` In Kombination mit der kooperativen Grundausrichtung bedeutet dies: Strategische Arbeit erfolgt im Dialog mit Stakeholdern und Schnittstellen. Die Person muss übergeordnete Ziele so kommunizieren, dass sie von anderen verstanden und mitgetragen werden.`;
    return text;
  }
  if (aufgabencharakter === "überwiegend systemisch") {
    let text = `Der Aufgabencharakter der Stelle ${beruf} ist überwiegend systemisch. Im Vordergrund stehen die Arbeit an Schnittstellen, die Gestaltung von Zusammenarbeit und die Einordnung in übergeordnete Zusammenhänge. Die Rolle wirkt vernetzend und moderierend – Wirksamkeit entsteht über Einfluss, nicht über direkte Umsetzung.`;
    if (top.key === "int") text += ` Dies passt zur kooperativen Grundausrichtung der Rolle: Systemische Arbeit lebt von Beziehungsfähigkeit, Kontextsensibilität und situativem Handeln. Die Person muss unterschiedliche Perspektiven integrieren und tragfähige Lösungen entwickeln.`;
    else if (top.key === "imp") text += ` In Kombination mit der umsetzungsorientierten Grundausrichtung bedeutet dies: Systemische Arbeit wird ergebnisorientiert betrieben. Die Person nutzt Netzwerke und Schnittstellen aktiv, um Ergebnisse zu beschleunigen – nicht um Konsens herzustellen.`;
    else text += ` In Kombination mit der strukturorientierten Grundausrichtung bedeutet dies: Systemische Arbeit wird methodisch angegangen. Schnittstellen werden dokumentiert, Abstimmungsprozesse formalisiert und Verantwortlichkeiten klar definiert.`;
    return text;
  }
  if (aufgabencharakter === "Gemischt") {
    let text = `Der Aufgabencharakter der Stelle ${beruf} ist gemischt. Die Rolle verbindet operative, strategische und systemische Anforderungen. Die Person muss flexibel zwischen unterschiedlichen Arbeitsmodi wechseln können – vom konkreten Tagesgeschäft bis zur übergeordneten Planung.`;
    if (top.key === "imp") text += ` Bei der umsetzungsorientierten Grundausrichtung der Rolle liegt der Schwerpunkt im Alltag eher auf operativen Aufgaben. Strategische und systemische Anteile werden pragmatisch und ergebnisorientiert bearbeitet.`;
    else if (top.key === "ana") text += ` Bei der strukturorientierten Grundausrichtung der Rolle werden alle drei Aufgabentypen systematisch und nach klaren Prioritäten bearbeitet. Die Person muss flexibel sein, ohne dabei Ordnung und Nachvollziehbarkeit zu verlieren.`;
    else text += ` Bei der kooperativen Grundausrichtung der Rolle werden die unterschiedlichen Aufgabentypen im Dialog mit dem Umfeld bearbeitet. Die Person muss zwischen operativem Handeln, strategischem Denken und systemischer Vernetzung wechseln – und dabei anschlussfähig bleiben.`;
    return text;
  }
  return "";
}

function getArbeitslogikText(arbeitslogik: string, beruf: string, gesamt: BG): string {
  const sorted = [
    { key: "imp", value: gesamt.imp },
    { key: "int", value: gesamt.int },
    { key: "ana", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];

  if (arbeitslogik === "Umsetzungsorientiert") {
    let text = `Die vorherrschende Arbeitslogik der Stelle ${beruf} ist umsetzungsorientiert. Ergebnisse werden durch direkte Aktion erzielt – Geschwindigkeit, Konsequenz und Abschlussstärke stehen im Vordergrund. Wer in dieser Rolle arbeitet, muss liefern, nicht nur planen.`;
    if (top.key === "imp") text += ` Die umsetzungsorientierte Arbeitslogik korrespondiert direkt mit der Grundausrichtung der Rolle: Beide verlangen Tempo, Entschlossenheit und die Bereitschaft, auch unter Unsicherheit zu handeln. Diese Kombination erzeugt eine besonders klare Ergebniserwartung.`;
    else if (top.key === "ana") text += ` Die umsetzungsorientierte Arbeitslogik steht in einem produktiven Spannungsfeld zur strukturorientierten Grundausrichtung: Einerseits wird Tempo erwartet, andererseits Ordnung und Nachvollziehbarkeit. Die Person muss beides können – schnell handeln und sauber dokumentieren.`;
    else text += ` Die umsetzungsorientierte Arbeitslogik ergänzt die kooperative Grundausrichtung: Ergebnisse müssen erzielt werden, aber im Einklang mit dem Umfeld. Die Person muss handeln und gleichzeitig kommunizieren, um die Zusammenarbeit nicht zu gefährden.`;
    return text;
  }
  if (arbeitslogik === "Menschenorientiert") {
    let text = `Die vorherrschende Arbeitslogik der Stelle ${beruf} ist menschenorientiert. Ergebnisse entstehen über Zusammenarbeit, Abstimmung und tragfähige Beziehungen. Kommunikation und Einbindung sind nicht optional, sondern zentrale Werkzeuge der täglichen Arbeit.`;
    if (top.key === "int") text += ` Die menschenorientierte Arbeitslogik korrespondiert direkt mit der kooperativen Grundausrichtung der Rolle: Beide verlangen Dialogfähigkeit, Beziehungsstärke und die Fähigkeit, unterschiedliche Interessen zusammenzuführen. Diese Kombination erzeugt eine besonders klare Erwartung an Kommunikation und Einbindung.`;
    else if (top.key === "imp") text += ` Die menschenorientierte Arbeitslogik steht in einem Spannungsfeld zur umsetzungsorientierten Grundausrichtung: Einerseits wird Tempo erwartet, andererseits Einbindung und Dialog. Die Person muss konsequent handeln und gleichzeitig Beziehungen pflegen – eine anspruchsvolle Kombination.`;
    else text += ` Die menschenorientierte Arbeitslogik ergänzt die strukturorientierte Grundausrichtung: Ordnung und Prozesse allein reichen nicht – die Person muss auch kommunizieren, einbinden und Erwartungen klären, um Ergebnisse zu erzielen.`;
    return text;
  }
  if (arbeitslogik === "Daten-/prozessorientiert") {
    let text = `Die vorherrschende Arbeitslogik der Stelle ${beruf} ist daten- und prozessorientiert. Ergebnisse entstehen über systematische Analyse, klare Abläufe und nachvollziehbare Entscheidungen. Bauchgefühl und Improvisation haben wenig Raum – gefragt sind Fakten und Methodik.`;
    if (top.key === "ana") text += ` Die daten- und prozessorientierte Arbeitslogik korrespondiert direkt mit der strukturorientierten Grundausrichtung der Rolle: Beide verlangen Genauigkeit, Systematik und die Fähigkeit, Komplexität zu ordnen. Diese Kombination erzeugt eine besonders klare Erwartung an Qualität und Nachvollziehbarkeit.`;
    else if (top.key === "imp") text += ` Die daten- und prozessorientierte Arbeitslogik steht in einem Spannungsfeld zur umsetzungsorientierten Grundausrichtung: Einerseits wird schnelles Handeln erwartet, andererseits faktenbasierte Entscheidungen. Die Person muss zügig arbeiten und gleichzeitig Qualitätsstandards einhalten.`;
    else text += ` Die daten- und prozessorientierte Arbeitslogik ergänzt die kooperative Grundausrichtung: Abstimmung und Dialog basieren auf Fakten, nicht auf Meinungen. Die Person muss Daten nutzen, um Entscheidungen zu fundieren, und gleichzeitig anschlussfähig kommunizieren.`;
    return text;
  }
  return "";
}

function getErfolgsfokusText(erfolgsfokusIndices: number[], beruf: string, gesamt: BG): string {
  if (erfolgsfokusIndices.length === 0) return "";
  const labels = erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);
  if (labels.length === 0) return "";

  const sorted = [
    { key: "imp", value: gesamt.imp },
    { key: "int", value: gesamt.int },
    { key: "ana", value: gesamt.ana },
  ].sort((a, b) => b.value - a.value);
  const top = sorted[0];

  const hasErgebnis = erfolgsfokusIndices.includes(0);
  const hasBeziehung = erfolgsfokusIndices.includes(1);
  const hasInnovation = erfolgsfokusIndices.includes(2);
  const hasProzess = erfolgsfokusIndices.includes(3);
  const hasExpertise = erfolgsfokusIndices.includes(4);
  const hasStrategie = erfolgsfokusIndices.includes(5);

  const fokusListe = labels.length === 1
    ? labels[0]
    : labels.slice(0, -1).join(", ") + " und " + labels[labels.length - 1];

  let text = `Für die Stelle ${beruf} wurde als Erfolgsfokus definiert: ${fokusListe}. Diese Ausrichtung bestimmt, woran die Wirksamkeit der Rolle gemessen wird und welche Prioritäten im Alltag gesetzt werden.`;

  if (hasErgebnis) {
    text += ` Der Fokus auf Ergebnis- und Umsatzwirkung bedeutet, dass die Person an konkreten, messbaren Ergebnissen gemessen wird. Umsatz, Abschlüsse oder quantifizierbare Leistungen stehen im Zentrum der Bewertung.`;
    if (top.key === "imp") text += ` Die umsetzungsorientierte Grundausrichtung der Rolle unterstützt diesen Fokus direkt – Tempo und Konsequenz treiben das Ergebnis.`;
  }
  if (hasBeziehung) {
    text += ` Der Fokus auf Beziehungs- und Netzwerkstabilität bedeutet, dass langfristige Partnerschaften, interne Zusammenarbeit und Vertrauen als Erfolgsfaktoren gelten. Kurzfristige Gewinne auf Kosten von Beziehungen sind kontraproduktiv.`;
    if (top.key === "int") text += ` Die kooperative Grundausrichtung der Rolle unterstützt diesen Fokus direkt – tragfähige Beziehungen sind das natürliche Ergebnis kooperativer Arbeit.`;
  }
  if (hasInnovation) {
    text += ` Der Fokus auf Innovations- und Transformationsleistung bedeutet, dass Veränderungsbereitschaft, kreative Lösungen und die Fähigkeit, Neues zu etablieren, als Erfolgsfaktoren gelten. Routine und Bewahrung allein reichen nicht.`;
  }
  if (hasProzess) {
    text += ` Der Fokus auf Prozess- und Effizienzqualität bedeutet, dass reibungslose Abläufe, Fehlerfreiheit und kontinuierliche Verbesserung als Erfolgsfaktoren gelten. Qualität zeigt sich in der Stabilität der Prozesse, nicht nur im Einzelergebnis.`;
    if (top.key === "ana") text += ` Die strukturorientierte Grundausrichtung der Rolle unterstützt diesen Fokus direkt – Ordnung und Systematik treiben Prozessqualität.`;
  }
  if (hasExpertise) {
    text += ` Der Fokus auf fachliche Exzellenz bedeutet, dass tiefe Fachkenntnis, methodische Kompetenz und inhaltliche Autorität als Erfolgsfaktoren gelten. Die Person muss Referenzpunkt in ihrem Fachgebiet sein.`;
  }
  if (hasStrategie) {
    text += ` Der Fokus auf strategische Wirkung und Positionierung bedeutet, dass langfristige Ausrichtung, Marktpositionierung und übergeordnete Wirksamkeit als Erfolgsfaktoren gelten. Die Person muss über den Tellerrand hinaus denken und die Organisation strategisch voranbringen.`;
  }

  return text;
}

export default function Bericht() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<{
    beruf: string; isLeadership: boolean; fuehrungstyp: string;
    gesamt: BG; haupt: BG; neben: BG; fuehrung: BG;
    texts: ReportTexts; intensity: Intensity;
    aufgabencharakterText: string; arbeitslogikText: string;
    erfolgsfokusText: string; fuehrungskontextText: string;
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
      const haupt = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
      const neben = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
      const fuehrung = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
      const rahmen = computeRahmen(state);
      const gesamt = computeGesamt(haupt, neben, fuehrung, rahmen);
      const { type, intensity } = classifyProfile(gesamt);
      const texts = getReportTexts(beruf, isLeadership, type, intensity);
      const aufgabencharakterText = getAufgabencharakterText(state.aufgabencharakter || "", beruf, gesamt);
      const arbeitslogikText = getArbeitslogikText(arbeitslogik, beruf, gesamt);
      const erfolgsfokusText = getErfolgsfokusText(state.erfolgsfokusIndices || [], beruf, gesamt);
      const fuehrungskontextText = isLeadership ? getFuehrungskontextText(fuehrungstyp, gesamt, beruf, arbeitslogik) : "";
      setData({ beruf, isLeadership, fuehrungstyp, gesamt, haupt, neben, fuehrung, texts, intensity, aufgabencharakterText, arbeitslogikText, erfolgsfokusText, fuehrungskontextText });
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

  const { beruf, isLeadership, fuehrungstyp, gesamt, haupt, neben, fuehrung, texts, intensity, aufgabencharakterText, arbeitslogikText, erfolgsfokusText, fuehrungskontextText } = data;

  const intensityNote = intensity === "strong"
    ? "Der Schwerpunkt ist eindeutig."
    : intensity === "clear"
      ? "Die Ausrichtung ist klar erkennbar."
      : intensity === "light"
        ? "Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv."
        : "";

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
          <div className="text-center mb-10">
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.1 }} data-testid="text-bericht-title">
              Entscheidungsbericht
            </h1>
            <p style={{ fontSize: 15, color: "#6E6E73", fontWeight: 400, lineHeight: 1.5, marginTop: 8 }}>
              Strukturelle Anforderungsanalyse: {beruf}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <GlassCard testId="bericht-intro">
              <SectionHeader icon={Users} title="Warum dieser Bericht" />
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>
                Fachliche Qualifikation allein sichert keine Leistung. Mitarbeitende, die persönlich zur Stelle passen, arbeiten wirksamer, bleiben länger und stabilisieren ihr Umfeld. Dieser Bericht beschreibt, welche strukturellen Anforderungen die Rolle {beruf} stellt – unabhängig von Lebenslauf und Zertifikaten.
              </p>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 8 }}>
                {texts.intro}
              </p>
              {intensityNote && (
                <p style={{ fontSize: 13, color: "#0071E3", fontWeight: 500, marginTop: 10 }}>{intensityNote}</p>
              )}
            </GlassCard>

            {aufgabencharakterText && (
              <GlassCard testId="bericht-aufgabencharakter">
                <SectionHeader icon={Settings} title="Aufgabencharakter" color="#6E6E73" />
                <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>{aufgabencharakterText}</p>
              </GlassCard>
            )}

            {arbeitslogikText && (
              <GlassCard testId="bericht-arbeitslogik">
                <SectionHeader icon={Crosshair} title="Arbeitslogik" color="#6E6E73" />
                <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>{arbeitslogikText}</p>
              </GlassCard>
            )}

            {erfolgsfokusText && (
              <GlassCard testId="bericht-erfolgsfokus">
                <SectionHeader icon={Target} title="Erfolgsfokus" color="#34AADC" />
                <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>{erfolgsfokusText}</p>
              </GlassCard>
            )}

            {isLeadership && fuehrungskontextText && (
              <GlassCard testId="bericht-fuehrungskontext">
                <SectionHeader icon={Shield} title="Führungskontext" color="#1A5DAB" />
                <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>{fuehrungskontextText}</p>
              </GlassCard>
            )}

            <GlassCard testId="bericht-gesamtprofil">
              <SectionHeader icon={BarChart3} title="Gesamtprofil" />
              {BarsForProfile(gesamt)}
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.overall}</p>
            </GlassCard>

            <GlassCard testId="bericht-taetigkeitsstruktur">
              <SectionHeader icon={Briefcase} title="Tätigkeitsstruktur" color="#F39200" />
              {BarsForProfile(haupt)}
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.tasks}</p>
            </GlassCard>

            <GlassCard testId="bericht-humankompetenzen">
              <SectionHeader icon={Heart} title="Humankompetenzen" color="#C41E3A" />
              {BarsForProfile(neben)}
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.human}</p>
            </GlassCard>

            {isLeadership && texts.leadership_section && (
              <GlassCard testId="bericht-fuehrungskompetenzen">
                <SectionHeader icon={Shield} title="Führungskompetenzen" color="#1A5DAB" />
                {BarsForProfile(fuehrung)}
                <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>{texts.leadership_section}</p>
              </GlassCard>
            )}

            <GlassCard testId="bericht-ueberpraegung" style={{ padding: "32px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(255,149,0,0.10), rgba(255,59,48,0.08))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: "#FF9500", strokeWidth: 1.8 }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Wirkung bei struktureller Abweichung</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {texts.overweight.map((ow, i) => (
                  <EffectCard key={i} {...ow} />
                ))}
              </div>
            </GlassCard>

            <GlassCard testId="bericht-fazit" style={{
              background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04), rgba(255,255,255,0.65))",
              border: "1px solid rgba(0,113,227,0.10)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(0,113,227,0.12), rgba(52,170,220,0.12))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Lightbulb size={16} style={{ color: "#0071E3" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fazit</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.6 }}>
                {texts.conclusion}
              </p>
            </GlassCard>

          </div>
        </main>
      </div>
    </div>
  );
}
