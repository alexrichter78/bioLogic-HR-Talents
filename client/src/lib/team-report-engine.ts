import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "./jobcheck-engine";
import type { Triad, ComponentKey } from "./jobcheck-engine";
import { detectConstellation, constellationLabel } from "./soll-ist-engine";
import type { ConstellationType } from "./soll-ist-engine";

export type SystemwirkungType = "verstaerkung" | "ergaenzung" | "ausgleich" | "verschiebung" | "polarisierung" | "uebersteuerung";

export type SystemwirkungResult = {
  type: SystemwirkungType;
  label: string;
  description: string;
  intensity: "gering" | "mittel" | "hoch";
  intensityLabel: string;
  chancen: string[];
  risiken: string[];
  narrative: string;
};

export type MetricTone = "neutral" | "warning" | "danger" | "success";
export type MatrixRating = "stabil" | "steuerbar" | "kritisch";

export type TopMetric = { label: string; value: string; tone: MetricTone };
export type WirkungsmatrixRow = { area: string; rating: MatrixRating; summary: string };
export type DeltaRowData = { label: string; value: number; tone: "neutral" | "warning" | "danger" };
export type StressBarItem = { label: string; value: number; color: string };
export type StressBarsData = { normal: StressBarItem[]; pressure: StressBarItem[]; stress: StressBarItem[] };
export type RiskMeterData = { label: string; value: number; color: string };
export type ForecastItem = { title: string; text: string };
export type IntegrationPhase = { phase: string; bullets: string[] };

export type TeamReportResult = {
  managementSummary: string;
  teamstruktur: string;
  fuehrungsprofil: string;
  systemwirkung: string;
  systemwirkungResult: SystemwirkungResult;
  teamdynamikAlltag: string;
  chancen: string;
  risiken: string;
  verhaltenUnterDruck: string;
  kulturwirkung: string;
  fuehrungshebel: string;
  integrationsplan: string;
  systemfazit: string;
  topMetrics: TopMetric[];
  wirkungsmatrix: WirkungsmatrixRow[];
  deltaRows: DeltaRowData[];
  stressBars: StressBarsData;
  riskMeters: RiskMeterData[];
  systemForecast: ForecastItem[];
  integrationPhases: IntegrationPhase[];
  summaryHeadline: string;
  fazitHeadline: string;
  fazitTone: "success" | "warning" | "danger";
  fazitEmpfehlung: string;
  teamfitLabel: string;
  integrationsrisiko: string;
  shiftFrom: string;
  shiftTo: string;
  teamNoteText: string;
  sollNoteText: string;
  istNoteText: string;
  stressCallout: string;
  riskCallout: string;
  chancenItems: string[];
  risikenItems: string[];
  fuehrungshebelItems: string[];
};

function compDesc(k: ComponentKey): string {
  if (k === "impulsiv") return "Umsetzung und Tempo";
  if (k === "intuitiv") return "Zusammenarbeit und Kommunikation";
  return "Struktur und Planung";
}

function compShort(k: ComponentKey): string {
  if (k === "impulsiv") return "Tempo";
  if (k === "intuitiv") return "Kommunikation";
  return "Struktur";
}

function gapLabel(g: number): string {
  if (g <= 10) return "gering";
  if (g <= 25) return "mittel";
  return "hoch";
}

function ampel(totalGap: number): "gruen" | "gelb" | "rot" {
  if (totalGap <= 20) return "gruen";
  if (totalGap <= 40) return "gelb";
  return "rot";
}

function ampelText(a: "gruen" | "gelb" | "rot"): string {
  if (a === "gruen") return "Stabil";
  if (a === "gelb") return "Steuerbar";
  return "Spannungsfeld";
}

function totalGapOf(a: Triad, b: Triad): number {
  return Math.abs(a.impulsiv - b.impulsiv) + Math.abs(a.intuitiv - b.intuitiv) + Math.abs(a.analytisch - b.analytisch);
}

function weakestKey(t: Triad): ComponentKey {
  if (t.impulsiv <= t.intuitiv && t.impulsiv <= t.analytisch) return "impulsiv";
  if (t.intuitiv <= t.impulsiv && t.intuitiv <= t.analytisch) return "intuitiv";
  return "analytisch";
}

function strongestKey(t: Triad): ComponentKey {
  if (t.impulsiv >= t.intuitiv && t.impulsiv >= t.analytisch) return "impulsiv";
  if (t.intuitiv >= t.impulsiv && t.intuitiv >= t.analytisch) return "intuitiv";
  return "analytisch";
}

export function detectSystemwirkung(
  ist: Triad, team: Triad, cn: string,
  rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, istConst: ConstellationType, teamConst: ConstellationType
): SystemwirkungResult {
  const istRange = Math.max(ist.impulsiv, ist.intuitiv, ist.analytisch) - Math.min(ist.impulsiv, ist.intuitiv, ist.analytisch);
  const teamRange = Math.max(team.impulsiv, team.intuitiv, team.analytisch) - Math.min(team.impulsiv, team.intuitiv, team.analytisch);
  const teamWeak = weakestKey(team);
  const istStrong = strongestKey(ist);

  let type: SystemwirkungType;
  let label: string;
  let description: string;
  let chancen: string[];
  let risiken: string[];

  if (rk === tk && teamIstGap <= 15) {
    type = "verstaerkung";
    label = "Verstärkung";
    description = `${cn} bringt die gleiche Arbeitslogik wie das Team. Die vorhandene Dynamik im Bereich ${compDesc(rk)} wird stärker.`;
    chancen = ["Hohe Stabilität", "Klare Standards", "Sehr gute Qualität in der Kerndisziplin"];
    risiken = ["Entscheidungsverlangsamung bei einseitiger Logik", "Geringe Veränderungsfähigkeit", "Blinde Flecken im schwächsten Bereich"];
  } else if (istStrong === teamWeak && teamIstGap >= 15) {
    type = "ergaenzung";
    label = "Ergänzung";
    description = `${cn} bringt eine fehlende Qualität ins Team. Der Bereich ${compDesc(istStrong)}, der im Team bisher schwach ausgeprägt ist, wird durch die neue Person gestärkt. Das Team wird ausgeglichener.`;
    chancen = ["Bessere Entscheidungen durch neue Perspektive", "Mehr Balance im Team", "Höhere Problemlösungskompetenz"];
    risiken = ["Anfängliche Reibung durch unterschiedliche Arbeitslogik", "Erhöhter Abstimmungsbedarf", "Integrationswiderstand möglich"];
  } else if (istRange <= 12 && teamRange > 20) {
    type = "ausgleich";
    label = "Ausgleich";
    description = `${cn} hat ein ausgeglichenes Profil und stabilisiert das eher einseitige Teamprofil. Das System wird ruhiger und balancierter.`;
    chancen = ["Stabilere Entscheidungen", "Weniger Extremreaktionen", "Bessere Priorisierung"];
    risiken = ["Das Team empfindet die neue Person als bremsend", "Tempo kann sinken", "Klarheit der Teamidentität verwässert"];
  } else if (rk !== tk && istRange > 20 && teamIstGap > 35) {
    type = "polarisierung";
    label = "Polarisierung";
    description = `${cn} verstärkt die Gegensätze im Team. Die Arbeitslogik ${compDesc(rk)} steht der Teamlogik ${compDesc(tk)} deutlich gegenüber. Unterschiedliche Arbeitsweisen treten stärker hervor.`;
    chancen = ["Starke Innovationskraft durch Gegenpole", "Viele Perspektiven", "Hohe kreative Spannung"];
    risiken = ["Konflikte in der Zusammenarbeit", "Entscheidungsblockaden", "Lagerbildung im Team"];
  } else if (istRange > 25 && teamRange < 15 && teamIstGap > 25) {
    type = "uebersteuerung";
    label = "Übersteuerung";
    description = `${cn} bringt ein stark ausgeprägtes Profil in ein eher ausgeglichenes Team. Die Arbeitslogik des Teams wird von der neuen Person dominiert. Das System passt sich stark an.`;
    chancen = ["Schnelle Veränderungen", "Klare Richtung", "Hohe Durchsetzungskraft"];
    risiken = ["Team verliert Eigenständigkeit", "Fluktuation kann steigen", "Bestehende Teamkultur bricht"];
  } else {
    type = "verschiebung";
    label = "Verschiebung";
    description = `${cn} verändert die Grundlogik des Teams. Die bisherige Ausrichtung auf ${compDesc(tk)} verschiebt sich Richtung ${compDesc(rk)}. Das Team entwickelt eine neue Arbeitsweise.`;
    chancen = ["Neue Leistungsfähigkeit", "Strukturelle Weiterentwicklung", "Frische Impulse"];
    risiken = ["Kulturelle Reibung in der Übergangsphase", "Identitätsverlust im Team möglich", "Produktivitätsdelle in den ersten Wochen"];
  }

  const intensity: "gering" | "mittel" | "hoch" = teamIstGap <= 15 ? "gering" : teamIstGap <= 30 ? "mittel" : "hoch";
  const intensityLabel = intensity === "gering"
    ? "Die Veränderung ist subtil und gut integrierbar."
    : intensity === "mittel"
    ? "Die Veränderung ist deutlich spürbar, bleibt jedoch steuerbar."
    : "Die Veränderung ist stark. Aktive Steuerung durch die Führungskraft ist notwendig.";

  const narrative = `Systemwirkung: ${label}. ${description} Intensität: ${intensity}. ${intensityLabel}`;

  return { type, label, description, intensity, intensityLabel, chancen, risiken, narrative };
}

export function computeTeamReport(
  roleName: string,
  candidateName: string,
  sollProfile: Triad,
  istProfile: Triad,
  teamProfile: Triad
): TeamReportResult {
  const soll = normalizeTriad(sollProfile);
  const ist = normalizeTriad(istProfile);
  const team = normalizeTriad(teamProfile);

  const sollDom = dominanceModeOf(soll);
  const istDom = dominanceModeOf(ist);
  const teamDom = dominanceModeOf(team);

  const sollConst = detectConstellation(soll);
  const istConst = detectConstellation(ist);
  const teamConst = detectConstellation(team);

  const sollLabel = constellationLabel(sollConst);
  const istLabel = constellationLabel(istConst);
  const teamLabel = constellationLabel(teamConst);

  const sollIstGap = totalGapOf(soll, ist);
  const teamIstGap = totalGapOf(team, ist);
  const sollTeamGap = totalGapOf(soll, team);

  const sollIstLevel = gapLabel(sollIstGap);
  const teamIstLevel = gapLabel(teamIstGap);

  const status = ampel(sollIstGap + teamIstGap);

  const cn = candidateName || "Die neue Person";
  const rk = istDom.top1.key;
  const tk = teamDom.top1.key;
  const sk = sollDom.top1.key;

  const managementSummary = buildManagementSummary(roleName, cn, soll, ist, team, sollIstGap, teamIstGap, sollIstLevel, teamIstLevel, status, sk, rk, tk, sollLabel, istLabel, teamLabel);
  const teamstruktur = buildTeamstruktur(team, teamDom, teamConst, teamLabel, tk);
  const fuehrungsprofil = buildFuehrungsprofil(cn, ist, istDom, istConst, istLabel, rk);
  const systemwirkungResult = detectSystemwirkung(ist, team, cn, rk, tk, teamIstGap, istConst, teamConst);
  const systemwirkung = buildSystemwirkung(cn, roleName, ist, team, soll, rk, tk, sk, teamIstGap, sollIstGap, istConst, teamConst, systemwirkungResult);
  const teamdynamikAlltag = buildTeamdynamikAlltag(cn, ist, team, rk, tk, teamIstGap);
  const chancen = buildChancen(cn, ist, team, soll, rk, tk, sk, teamIstGap);
  const risiken = buildRisiken(cn, ist, team, soll, rk, tk, sk, teamIstGap, sollIstGap);
  const verhaltenUnterDruck = buildVerhaltenUnterDruck(cn, ist, team, rk, tk, istConst, teamIstGap);
  const kulturwirkung = buildKulturwirkung(cn, ist, team, rk, tk, teamIstGap);
  const fuehrungshebel = buildFuehrungshebel(cn, rk, tk, teamIstGap, sollIstGap);
  const integrationsplan = buildIntegrationsplan(cn, rk, tk, teamIstGap, sollIstGap);
  const systemfazit = buildSystemfazit(roleName, cn, soll, ist, team, sollIstGap, teamIstGap, status, sk, rk, tk);

  const teamfitLabel = ampelText(status);
  const integrationsrisikoLabel = status === "gruen" ? "Gering" : status === "gelb" ? "Erhöht" : "Hoch";
  const topMetrics = buildTopMetrics(systemwirkungResult, teamfitLabel, integrationsrisikoLabel);
  const wirkungsmatrix = buildWirkungsmatrix(cn, ist, team, soll, rk, tk, sk, teamIstGap, sollIstGap);
  const deltaRows = buildDeltaRows(sollIstGap, teamIstGap, sollTeamGap);
  const stressBarsData = buildStressBars(ist, rk, istDom.top2.key);
  const riskMetersData = buildRiskMeters(sollIstGap, teamIstGap, rk, tk);
  const systemForecastData = buildSystemForecast(cn, rk, tk, teamIstGap, sollIstGap, systemwirkungResult);
  const integrationPhasesData = buildIntegrationPhases(cn, rk, tk, teamIstGap, sollIstGap);
  const summaryHeadline = buildSummaryHeadline(status, systemwirkungResult);
  const { headline: fazitHeadline, tone: fazitTone, empfehlung: fazitEmpfehlung } = buildFazitMeta(status, teamIstGap, sollIstGap);

  const shiftFrom = compDesc(tk);
  const shiftTo = compDesc(rk);

  const teamNoteText = buildTeamNote(team, tk);
  const sollNoteText = buildSollNote(soll, sk);
  const istNoteText = buildIstNote(ist, rk, cn);

  const stressCallout = buildStressCallout(cn, rk, tk, istDom.top2.key, teamIstGap);
  const riskCallout = buildRiskCallout(cn, ist, team, rk, tk);

  const chancenItems = chancen.split("\n\n").filter(s => s.trim());
  const risikenItems = risiken.split("\n\n").filter(s => s.trim());
  const fuehrungshebelItems = fuehrungshebel.split("\n\n").filter(s => s.trim());

  return {
    managementSummary,
    teamstruktur,
    fuehrungsprofil,
    systemwirkung,
    systemwirkungResult,
    teamdynamikAlltag,
    chancen,
    risiken,
    verhaltenUnterDruck,
    kulturwirkung,
    fuehrungshebel,
    integrationsplan,
    systemfazit,
    topMetrics,
    wirkungsmatrix,
    deltaRows,
    stressBars: stressBarsData,
    riskMeters: riskMetersData,
    systemForecast: systemForecastData,
    integrationPhases: integrationPhasesData,
    summaryHeadline,
    fazitHeadline,
    fazitTone,
    fazitEmpfehlung,
    teamfitLabel,
    integrationsrisiko: integrationsrisikoLabel,
    shiftFrom,
    shiftTo,
    teamNoteText,
    sollNoteText,
    istNoteText,
    stressCallout,
    riskCallout,
    chancenItems,
    risikenItems,
    fuehrungshebelItems,
  };
}

function buildManagementSummary(
  role: string, cand: string,
  soll: Triad, ist: Triad, team: Triad,
  sollIstGap: number, teamIstGap: number,
  sollIstLevel: string, teamIstLevel: string,
  status: "gruen" | "gelb" | "rot",
  sk: ComponentKey, rk: ComponentKey, tk: ComponentKey,
  sollLabel: string, istLabel: string, teamLabel: string
): string {
  const lines: string[] = [];
  lines.push(`Rolle: ${role}`);
  lines.push(`Kandidat: ${cand}`);
  lines.push(`Sollprofil: ${sollLabel} (I ${soll.impulsiv}% / N ${soll.intuitiv}% / A ${soll.analytisch}%)`);
  lines.push(`Kandidatenprofil: ${istLabel} (I ${ist.impulsiv}% / N ${ist.intuitiv}% / A ${ist.analytisch}%)`);
  lines.push(`Teamprofil: ${teamLabel} (I ${team.impulsiv}% / N ${team.intuitiv}% / A ${team.analytisch}%)`);
  lines.push("");
  lines.push(`Abweichung Soll vs. Ist: ${sollIstGap} Punkte (${sollIstLevel})`);
  lines.push(`Abweichung Team vs. Ist: ${teamIstGap} Punkte (${teamIstLevel})`);
  lines.push(`Gesamtstatus: ${ampelText(status)}`);
  lines.push("");

  if (status === "gruen") {
    lines.push(`${cand} passt strukturell zur Rolle ${role} und zum bestehenden Team. Die Arbeitslogiken sind kompatibel. Die Integration wird voraussichtlich reibungsarm verlaufen.`);
  } else if (status === "gelb") {
    lines.push(`${cand} zeigt Abweichungen zur Rollenanforderung oder zum Teamprofil. Die Integration ist steuerbar, erfordert aber gezielte Aufmerksamkeit in den ersten Wochen. Entscheidend sind klare Erwartungen und regelmäßige Abstimmung.`);
  } else {
    lines.push(`${cand} weicht deutlich von der Rollenanforderung und/oder dem Teamprofil ab. Ohne aktive Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich. Die ersten 30 Tage sind entscheidend.`);
  }

  return lines.join("\n");
}

function buildTeamstruktur(
  team: Triad, teamDom: ReturnType<typeof dominanceModeOf>,
  teamConst: ConstellationType, teamLabel: string, tk: ComponentKey
): string {
  const lines: string[] = [];
  lines.push(`Das Team zeigt aktuell ${teamLabel.toLowerCase()}. Der stärkste Anteil liegt bei ${compDesc(tk)} (${team[tk]}%).`);

  const wk = weakestKey(team);
  lines.push(`Der schwächste Bereich ist ${compDesc(wk)} (${team[wk]}%).`);
  lines.push("");

  if (teamConst.includes("DOM")) {
    lines.push(`Die klare Ausrichtung auf ${compShort(tk)} gibt dem Team eine eindeutige Arbeitslogik. Entscheidungen und Prioritäten folgen einer einheitlichen Linie. Gleichzeitig besteht das Risiko, dass der Bereich ${compDesc(wk)} systematisch vernachlässigt wird.`);
  } else if (teamConst.includes("NEAR")) {
    lines.push(`Das Team arbeitet mit einer Doppelausrichtung. Je nach Situation wird zwischen zwei Logiken gewechselt. Das gibt Flexibilität, kann aber zu Unklarheit führen, wenn Prioritäten nicht klar gesetzt werden.`);
  } else if (teamConst === "BALANCED") {
    lines.push(`Das Team zeigt keine klare Einseitigkeit. Alle drei Bereiche sind relativ ausgeglichen vertreten. Das sorgt für Vielseitigkeit, kann aber dazu führen, dass in keinem Bereich konsequent genug gearbeitet wird.`);
  } else {
    lines.push(`Das Team ist primär auf ${compShort(tk)} ausgerichtet, hat aber einen erkennbaren sekundären Anteil. Dieses Profil ermöglicht eine fokussierte Arbeitsweise mit zusätzlicher Flexibilität im Nebenbereich.`);
  }

  return lines.join("\n");
}

function buildFuehrungsprofil(
  cand: string, ist: Triad, istDom: ReturnType<typeof dominanceModeOf>,
  istConst: ConstellationType, istLabel: string, rk: ComponentKey
): string {
  const lines: string[] = [];
  const sk2 = istDom.top2.key;
  lines.push(`${cand} zeigt ${istLabel.toLowerCase()}. Der primäre Antrieb liegt bei ${compDesc(rk)} (${ist[rk]}%), der sekundäre bei ${compDesc(sk2)} (${ist[sk2]}%).`);
  lines.push("");

  if (rk === "impulsiv") {
    lines.push(`${cand} arbeitet mit hoher Umsetzungsenergie. Entscheidungen werden zügig getroffen, Themen schnell in Bewegung gebracht. In der Zusammenarbeit ist das Tempo spürbar. Langwierige Abstimmungsprozesse werden als bremsend empfunden.`);
  } else if (rk === "intuitiv") {
    lines.push(`${cand} arbeitet beziehungsorientiert. Zusammenarbeit, Kommunikation und das Erfassen von Situationen stehen im Vordergrund. Entscheidungen werden im Kontext der beteiligten Menschen getroffen. Reine Sachorientierung ohne Beziehungsebene wird als unvollständig empfunden.`);
  } else {
    lines.push(`${cand} arbeitet strukturiert und planvoll. Qualität entsteht über Ordnung, sorgfältige Prüfung und klare Abläufe. Schnelle, ungeprüfte Entscheidungen werden als riskant eingestuft. Verlässlichkeit hat Vorrang vor Geschwindigkeit.`);
  }

  lines.push("");
  if (istConst.includes("NEAR") || istConst === "BALANCED") {
    lines.push(`Durch die ausgeglichene Profilstruktur kann ${cand} situativ zwischen verschiedenen Arbeitsweisen wechseln. Das erhöht die Anpassungsfähigkeit, macht das Verhalten aber auch weniger vorhersagbar.`);
  } else {
    lines.push(`Der sekundäre Anteil (${compShort(sk2)}) stabilisiert die Hauptlogik. ${cand} nutzt ${compDesc(sk2)} als Ergänzung, nicht als Alternative. In Drucksituationen tritt die Hauptlogik noch deutlicher hervor.`);
  }

  return lines.join("\n");
}

function buildSystemwirkung(
  cand: string, role: string,
  ist: Triad, team: Triad, soll: Triad,
  rk: ComponentKey, tk: ComponentKey, sk: ComponentKey,
  teamIstGap: number, sollIstGap: number,
  istConst: ConstellationType, teamConst: ConstellationType,
  sw: SystemwirkungResult
): string {
  const lines: string[] = [];

  lines.push(sw.description);

  lines.push("");
  lines.push("Abgleich mit Sollprofil:");
  lines.push("");

  if (sollIstGap <= 15) {
    lines.push(`Die Arbeitslogik von ${cand} liegt nahe am Sollprofil der Rolle ${role}. Die Rolle wird in ihren Kernanforderungen gut abgebildet.`);
  } else if (sollIstGap <= 30) {
    lines.push(`Die Arbeitslogik von ${cand} weicht erkennbar vom Sollprofil ab (${sollIstGap} Punkte). In einzelnen Bereichen muss gezielt nachgesteuert werden, um die Rollenanforderungen vollständig zu erfüllen.`);
  } else {
    lines.push(`Die Arbeitslogik von ${cand} weicht deutlich vom Sollprofil ab (${sollIstGap} Punkte). Ohne aktive Steuerung wird die Rolle anders gelebt als vorgesehen. Die Wirkung der Position verschiebt sich spürbar.`);
  }

  return lines.join("\n");
}

function buildTeamdynamikAlltag(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const lines: string[] = [];

  lines.push("Entscheidungen:");
  if (rk === tk) {
    lines.push(`${cand} und das Team treffen Entscheidungen nach ähnlicher Logik. Die Abstimmung ist unkompliziert, Prioritäten werden gleichartig gesetzt.`);
  } else if (rk === "impulsiv" && tk === "analytisch") {
    lines.push(`${cand} entscheidet schneller als das Team es gewohnt ist. Das Team prüft gründlich, ${cand} will zügig handeln. Es entsteht Spannung zwischen Tempo und Gründlichkeit.`);
  } else if (rk === "analytisch" && tk === "impulsiv") {
    lines.push(`${cand} bremst das Tempo des Teams. Wo das Team schnell entscheiden will, fordert ${cand} Prüfung und Absicherung. Das Team empfindet das als Verzögerung.`);
  } else if (rk === "intuitiv") {
    lines.push(`${cand} bezieht bei Entscheidungen stärker den menschlichen Kontext ein. Das Team ist stärker auf ${compShort(tk)} ausgerichtet. Abstimmungsprozesse können dadurch länger dauern.`);
  } else {
    lines.push(`Die Entscheidungslogik von ${cand} unterscheidet sich vom Team. ${cand} priorisiert ${compShort(rk)}, das Team setzt auf ${compShort(tk)}. Im Alltag führt das zu unterschiedlichen Bewertungen gleicher Situationen.`);
  }

  lines.push("");
  lines.push("Kommunikation:");
  if (teamIstGap <= 15) {
    lines.push(`Die Kommunikation verläuft voraussichtlich reibungsarm. ${cand} und das Team sprechen eine ähnliche Sprache. Missverständnisse sind selten.`);
  } else if (teamIstGap <= 30) {
    lines.push(`In der Kommunikation sind Abstimmungsverluste möglich. ${cand} betont andere Aspekte als das Team. Klare Kommunikationsregeln helfen, Missverständnisse zu vermeiden.`);
  } else {
    lines.push(`Die Kommunikationslogiken weichen deutlich voneinander ab. Was ${cand} als wichtig einstuft, priorisiert das Team anders. Ohne bewusste Steuerung entstehen regelmäßig Missverständnisse und Frustrationen.`);
  }

  lines.push("");
  lines.push("Arbeitstempo:");
  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap <= 8) {
    lines.push(`Das Arbeitstempo ist kompatibel. ${cand} und das Team arbeiten in einem ähnlichen Rhythmus.`);
  } else if (tempoGap <= 18) {
    lines.push(`Es gibt spürbare Tempounterschiede. ${ist.impulsiv > team.impulsiv ? `${cand} arbeitet schneller als das Team.` : `Das Team arbeitet schneller als ${cand}.`} Das erfordert bewusste Abstimmung.`);
  } else {
    lines.push(`Das Arbeitstempo unterscheidet sich deutlich. ${ist.impulsiv > team.impulsiv ? `${cand} arbeitet erheblich schneller als das Team. Das Team kann unter Druck geraten.` : `${cand} arbeitet deutlich langsamer als das Team. Das Team empfindet das als Bremse.`}`);
  }

  return lines.join("\n");
}

function buildChancen(
  cand: string, ist: Triad, team: Triad, soll: Triad,
  rk: ComponentKey, tk: ComponentKey, sk: ComponentKey, teamIstGap: number
): string {
  const items: string[] = [];

  if (rk !== tk) {
    const teamWeak = weakestKey(team);
    if (rk === teamWeak) {
      items.push(`${cand} stärkt den bisher schwächsten Bereich des Teams (${compDesc(teamWeak)}). Das gleicht eine strukturelle Lücke aus und macht das Team vielseitiger.`);
    }
    items.push(`Die unterschiedliche Arbeitslogik bringt eine neue Perspektive ins Team. Entscheidungen werden breiter abgestützt, wenn die Vielfalt bewusst genutzt wird.`);
  }

  if (rk === tk) {
    items.push(`${cand} verstärkt den Kernbereich des Teams (${compDesc(rk)}). Die Teamlogik wird konsequenter umgesetzt und stabilisiert.`);
  }

  if (rk === sk) {
    items.push(`Die Arbeitslogik von ${cand} passt zum Sollprofil der Rolle. Die Rolle wird so gelebt, wie sie gedacht ist. Das sichert die Wirkung der Position.`);
  }

  if (ist.intuitiv >= 35) {
    items.push(`${cand} bringt hohe Beziehungsfähigkeit mit. Das kann die Teamkohäsion stärken und Konflikte frühzeitig entschärfen.`);
  }

  if (ist.analytisch >= 35) {
    items.push(`${cand} bringt hohe Strukturorientierung mit. Das kann Prozessqualität und Verlässlichkeit im Team verbessern.`);
  }

  if (ist.impulsiv >= 35) {
    items.push(`${cand} bringt hohe Umsetzungsenergie mit. Das kann das Arbeitstempo steigern und Ergebnisorientierung stärken.`);
  }

  if (items.length === 0) {
    items.push(`${cand} bringt ein ausgeglichenes Profil mit. Das sorgt für Flexibilität und situative Anpassungsfähigkeit.`);
  }

  return items.join("\n\n");
}

function buildRisiken(
  cand: string, ist: Triad, team: Triad, soll: Triad,
  rk: ComponentKey, tk: ComponentKey, sk: ComponentKey,
  teamIstGap: number, sollIstGap: number
): string {
  const items: string[] = [];

  if (rk !== tk && teamIstGap > 25) {
    items.push(`Hohe Abweichung zum Teamprofil (${teamIstGap} Punkte): Die unterschiedliche Arbeitslogik kann im Alltag zu wiederkehrenden Konflikten führen. Das Team empfindet die Arbeitsweise von ${cand} als fremd oder störend.`);
  } else if (rk !== tk && teamIstGap > 15) {
    items.push(`Spürbare Abweichung zum Teamprofil (${teamIstGap} Punkte): In Drucksituationen können die unterschiedlichen Logiken aufeinanderprallen. Gezielte Steuerung reduziert das Risiko.`);
  }

  if (sollIstGap > 30) {
    items.push(`Deutliche Abweichung zum Sollprofil (${sollIstGap} Punkte): Die Rolle wird anders gelebt als vorgesehen. Kernaufgaben, die ${compDesc(sk)} erfordern, werden möglicherweise nicht mit der nötigen Konsequenz bearbeitet.`);
  } else if (sollIstGap > 15) {
    items.push(`Erkennbare Abweichung zum Sollprofil (${sollIstGap} Punkte): In einzelnen Teilbereichen muss gezielt nachgesteuert werden, um die Rollenanforderungen zu erfüllen.`);
  }

  if (rk === tk) {
    const teamWeak = weakestKey(team);
    if (weakestKey(ist) === teamWeak) {
      items.push(`Verstärkung des blinden Flecks: ${cand} und das Team teilen die gleiche Schwäche im Bereich ${compDesc(teamWeak)}. Dieser Bereich wird weiter vernachlässigt.`);
    }
  }

  const strukturGap = Math.abs(ist.analytisch - team.analytisch);
  if (strukturGap > 15 && ist.analytisch < team.analytisch) {
    items.push(`${cand} bringt weniger Strukturorientierung mit als das Team. Qualitätsstandards und Dokumentation können darunter leiden.`);
  }

  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  if (tempoGap > 15 && ist.impulsiv > team.impulsiv) {
    items.push(`${cand} arbeitet deutlich tempoorientierter als das Team. Das Team kann unter Zeitdruck geraten und Fehlerquoten steigen.`);
  }

  if (items.length === 0) {
    items.push(`Die Risiken sind bei der aktuellen Konstellation gering. Die Profile sind kompatibel. Normale Steuerung ist ausreichend.`);
  }

  return items.join("\n\n");
}

function buildVerhaltenUnterDruck(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey,
  istConst: ConstellationType, teamIstGap: number
): string {
  const lines: string[] = [];
  const istDom = dominanceModeOf(ist);
  const sk2 = istDom.top2.key;

  lines.push("Kontrollierter Druck:");
  lines.push("");
  if (istConst === "BALANCED") {
    lines.push(`Wenn der Arbeitsdruck steigt, zeigt ${cand} keine sehr klare Verhaltenstendenz. Da das Profil ausgeglichen ist, hängt die Reaktion stark vom Kontext und der Führung ab. Das Team kann das Verhalten schwerer einschätzen.`);
  } else if (istConst.includes("NEAR")) {
    lines.push(`Wenn der Arbeitsdruck steigt, verstärkt sich bei ${cand} die im Moment führende Logik. Da beide Hauptanteile fast gleich stark sind, kann die Reaktion je nach Situation unterschiedlich ausfallen. Mal wird stärker über ${compShort(rk)} gesteuert, mal über ${compShort(sk2)}.`);
  } else {
    lines.push(`Wenn der Arbeitsdruck steigt, verstärkt ${cand} die Tendenz zu ${compDesc(rk)}. Das hilft, die eigene Situation kurzfristig zu stabilisieren. Gleichzeitig tritt der sekundäre Bereich (${compShort(sk2)}) in den Hintergrund.`);
  }

  if (rk !== tk) {
    lines.push(`Für das Team bedeutet das: Unter Druck wird die Abweichung zur Teamlogik noch sichtbarer. ${cand} reagiert mit ${compShort(rk)}, das Team erwartet ${compShort(tk)}.`);
  }

  lines.push("");
  lines.push("Unkontrollierter Stress:");
  lines.push("");

  if (istConst === "BALANCED") {
    lines.push(`Wenn der Druck sehr hoch wird, kann das Verhalten von ${cand} kippen oder unvorhersagbar wechseln. Keine klare Hauptlogik gibt Halt. Das Team verliert Orientierung. Klare Leitplanken und direktes Feedback sind in dieser Phase besonders wichtig.`);
  } else {
    const d12 = ist[rk] - ist[sk2];
    if (d12 <= 5) {
      lines.push(`Wenn die Belastung sehr hoch wird, kann sich der Schwerpunkt bei ${cand} verschieben. Die Person bleibt in ihrer Grundlogik erkennbar, nutzt aber spürbar stärker ${compShort(sk2)}. Für das Team wird das Verhalten weniger berechenbar.`);
    } else {
      lines.push(`Wenn die Belastung sehr hoch wird, verschiebt sich das Verhalten von ${cand} deutlich. Der sekundäre Bereich ${compShort(sk2)} tritt stärker hervor. Entscheidungen werden anders getroffen als im Normalzustand. Das Team sollte darauf vorbereitet sein.`);
    }
  }

  return lines.join("\n");
}

function buildKulturwirkung(
  cand: string, ist: Triad, team: Triad,
  rk: ComponentKey, tk: ComponentKey, teamIstGap: number
): string {
  const lines: string[] = [];

  if (rk === tk && teamIstGap <= 15) {
    lines.push(`${cand} bestätigt die bestehende Teamkultur. Die Werte, Arbeitsweisen und Kommunikationsmuster bleiben stabil. Das Team wird die neue Person als passend empfinden.`);
  } else if (rk === tk && teamIstGap > 15) {
    lines.push(`${cand} teilt die Grundausrichtung des Teams, aber in einer anderen Intensität. Die Kultur bleibt in ihrer Richtung stabil, aber die Ausprägung verändert sich. ${ist[rk] > team[rk] ? `${cand} lebt die gemeinsame Logik konsequenter als das Team.` : `Das Team lebt die gemeinsame Logik konsequenter als ${cand}.`}`);
  } else {
    lines.push(`${cand} bringt eine andere Arbeitslogik mit als das Team. Das verändert die Teamkultur spürbar.`);

    if (rk === "impulsiv") {
      lines.push(`${cand} bringt mehr Tempo und Ergebnisorientierung ein. Das Team wird herausgefordert, schneller zu entscheiden und zu handeln. Für ein Team mit hoher ${compShort(tk)}-Orientierung kann das als Druck empfunden werden.`);
    } else if (rk === "intuitiv") {
      lines.push(`${cand} bringt mehr Beziehungsorientierung und Kommunikation ein. Das Team wird herausgefordert, stärker auf zwischenmenschliche Dynamiken zu achten. Das kann bereichernd sein, aber auch als langsam empfunden werden.`);
    } else {
      lines.push(`${cand} bringt mehr Struktur und Gründlichkeit ein. Das Team wird herausgefordert, sorgfältiger zu arbeiten und Abläufe stärker zu formalisieren. Das kann als einschränkend empfunden werden.`);
    }
  }

  return lines.join("\n");
}

function buildFuehrungshebel(
  cand: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, sollIstGap: number
): string {
  const items: string[] = [];

  if (teamIstGap > 20 || sollIstGap > 20) {
    items.push(`Erwartungsklärung: In der ersten Woche ein Kick-off mit dem gesamten Team durchführen. Prioritäten, Entscheidungswege und Qualitätsmaßstäbe transparent machen. ${cand} und das Team müssen verstehen, was voneinander erwartet wird.`);
  }

  if (rk !== tk) {
    items.push(`Übersetzungshilfe: Die unterschiedlichen Arbeitslogiken aktiv benennen. Dem Team erklären, warum ${cand} anders priorisiert. ${cand} erklären, warum das Team anders arbeitet. Verständnis reduziert Reibung.`);
  }

  if (teamIstGap > 30) {
    items.push(`Entscheidungszeitfenster definieren: Klare Fristen für Entscheidungen verhindern Endlosschleifen und reduzieren Reibung. Besonders wichtig bei unterschiedlichen Tempi.`);
    items.push(`Wöchentliches Steuerungsmeeting: 30 Minuten zur Abstimmung von Prioritäten, offenen Punkten und Feedback. Konflikte früh ansprechen, bevor sie eskalieren.`);
  }

  items.push(`Feedbackschleifen einbauen: Nach 2 und 4 Wochen strukturiertes Feedback einholen, sowohl vom Team als auch von ${cand}. Stimmungen und Reibungspunkte frühzeitig erkennen.`);

  if (rk === "impulsiv" && tk !== "impulsiv") {
    items.push(`Tempo steuern: ${cand} wird schneller arbeiten wollen als das Team. Klare Meilensteine und Prüfpunkte setzen, damit Tempo nicht auf Kosten der Qualität geht.`);
  }

  if (rk === "analytisch" && tk !== "analytisch") {
    items.push(`Struktur dosieren: ${cand} wird mehr Struktur einfordern als das Team gewohnt ist. Gemeinsam klären, welche Strukturen notwendig sind und welche Flexibilität bewahrt werden soll.`);
  }

  if (rk === "intuitiv" && tk !== "intuitiv") {
    items.push(`Kommunikationsraum schaffen: ${cand} braucht mehr Austausch und Abstimmung als das Team gewohnt ist. Feste Gesprächsformate einrichten, ohne das Team in endlose Meetings zu ziehen.`);
  }

  return items.slice(0, 6).join("\n\n");
}

function buildIntegrationsplan(
  cand: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, sollIstGap: number
): string {
  const lines: string[] = [];

  lines.push("Woche 1-2: Orientierung und Erwartungsklärung");
  lines.push("");
  lines.push(`- Kick-off-Gespräch: ${cand} stellt sich dem Team vor. Gemeinsam werden Arbeitsweise, Erwartungen und Spielregeln besprochen.`);
  lines.push(`- Rollenklärung: Aufgaben, Verantwortlichkeiten und Entscheidungsbefugnisse schriftlich festhalten.`);

  if (rk !== tk) {
    lines.push(`- Arbeitslogik transparent machen: Dem Team erklären, dass ${cand} eine andere Arbeitsweise mitbringt. Verständnis schaffen, nicht Anpassung erzwingen.`);
  }

  lines.push(`- Beobachten und Zuhören: ${cand} soll in den ersten Tagen die Teamdynamik verstehen, bevor eigene Akzente gesetzt werden.`);

  if (teamIstGap > 25) {
    lines.push(`- Buddy benennen: Ein erfahrenes Teammitglied als informellen Ansprechpartner für ${cand} einsetzen.`);
  }

  lines.push("");
  lines.push("Woche 3-4: Wirkung entfalten und nachjustieren");
  lines.push("");
  lines.push(`- Erste Feedbackrunde: Strukturiertes Feedback vom Team und von ${cand} einholen. Was läuft gut? Wo gibt es Reibung?`);
  lines.push(`- Prioritäten nachjustieren: Auf Basis des Feedbacks die Zusammenarbeit anpassen. Klare Vereinbarungen für die nächsten Wochen treffen.`);

  if (rk !== tk) {
    lines.push(`- Stärken nutzen: Bewusst Aufgaben zuordnen, die zur Arbeitslogik von ${cand} passen. Gleichzeitig Brücken zur Teamlogik bauen.`);
  }

  lines.push(`- Quick Wins sichern: ${cand} früh Gelegenheit geben, sichtbare Ergebnisse zu erzielen. Das baut Akzeptanz auf.`);

  if (teamIstGap > 30 || sollIstGap > 30) {
    lines.push(`- Eskalationsmechanismus klären: Wer moderiert, wenn Konflikte auftreten? Wie wird Uneinigkeit gelöst?`);
  }

  return lines.join("\n");
}

function buildSystemfazit(
  role: string, cand: string,
  soll: Triad, ist: Triad, team: Triad,
  sollIstGap: number, teamIstGap: number,
  status: "gruen" | "gelb" | "rot",
  sk: ComponentKey, rk: ComponentKey, tk: ComponentKey
): string {
  const lines: string[] = [];

  if (status === "gruen") {
    lines.push(`${cand} passt strukturell zur Rolle ${role} und zum bestehenden Team. Die Arbeitslogiken sind kompatibel. Die Integration wird voraussichtlich reibungsarm verlaufen. Normale Führungssteuerung ist ausreichend.`);
    lines.push("");
    lines.push(`Fokuspunkte: Teamkultur bestätigen, Ergänzungspotenziale bewusst nutzen, Feedbackschleifen einbauen.`);
  } else if (status === "gelb") {
    lines.push(`${cand} ist für die Rolle ${role} steuerbar einsetzbar. Es gibt erkennbare Abweichungen zum Sollprofil (${sollIstGap} Punkte) und/oder zum Team (${teamIstGap} Punkte), die mit gezielter Steuerung ausgeglichen werden können.`);
    lines.push("");
    lines.push(`Entscheidend sind die ersten 30 Tage: Klare Erwartungen setzen, Kommunikation bewusst steuern, Feedback strukturiert einholen. Wenn die Integration aktiv begleitet wird, kann ${cand} die Rolle wirksam ausfüllen.`);
    if (rk !== tk) {
      lines.push("");
      lines.push(`Die unterschiedliche Arbeitslogik (${compShort(rk)} vs. ${compShort(tk)}) ist kein Ausschlusskriterium, erfordert aber bewusste Steuerung. Besonders in Drucksituationen muss die Führung aktiv moderieren.`);
    }
  } else {
    lines.push(`${cand} zeigt deutliche Abweichungen zur Rollenanforderung (${sollIstGap} Punkte) und/oder zum Team (${teamIstGap} Punkte). Ohne aktive und konsequente Steuerung sind Reibung, Konflikte und Leistungseinbrüche wahrscheinlich.`);
    lines.push("");
    lines.push(`Die Integration stellt eine erhebliche Herausforderung dar. Die Arbeitslogiken von ${cand} und dem Team sind grundlegend verschieden. Die ersten 30 Tage sind entscheidend: Klare Kommunikation, definierte Entscheidungswege und aktives Erwartungsmanagement sind Pflicht.`);
    lines.push("");
    lines.push(`Empfehlung: Nur mit Steuerungskonzept und aktiver Führungsbegleitung einsetzen. Regelmäßige Checkpoints einplanen. Eskalationsmechanismen vorab klären.`);
  }

  return lines.join("\n");
}

function buildTopMetrics(sw: SystemwirkungResult, teamfit: string, risk: string): TopMetric[] {
  const swTone: MetricTone = sw.intensity === "gering" ? "success" : sw.intensity === "mittel" ? "warning" : "danger";
  const intTone: MetricTone = sw.intensity === "gering" ? "success" : sw.intensity === "mittel" ? "warning" : "danger";
  const tfTone: MetricTone = teamfit === "Stabil" ? "success" : teamfit === "Steuerbar" ? "warning" : "danger";
  const rrTone: MetricTone = risk === "Gering" ? "success" : risk === "Erhöht" ? "warning" : "danger";
  return [
    { label: "Systemwirkung", value: sw.label, tone: swTone },
    { label: "Intensität", value: sw.intensity.charAt(0).toUpperCase() + sw.intensity.slice(1), tone: intTone },
    { label: "Teamfit", value: teamfit, tone: tfTone },
    { label: "Integrationsrisiko", value: risk, tone: rrTone },
  ];
}

function buildWirkungsmatrix(
  cn: string, ist: Triad, team: Triad, soll: Triad,
  rk: ComponentKey, tk: ComponentKey, sk: ComponentKey,
  teamIstGap: number, sollIstGap: number
): WirkungsmatrixRow[] {
  const tempoGap = Math.abs(ist.impulsiv - team.impulsiv);
  const kommGap = Math.abs(ist.intuitiv - team.intuitiv);
  const strukturGap = Math.abs(ist.analytisch - team.analytisch);

  function rate(gap: number): MatrixRating {
    if (gap <= 8) return "stabil";
    if (gap <= 18) return "steuerbar";
    return "kritisch";
  }

  const rows: WirkungsmatrixRow[] = [];

  if (rk === tk) {
    rows.push({ area: "Entscheidungen", rating: rate(teamIstGap / 3), summary: `${cn} und das Team treffen Entscheidungen nach ähnlicher Logik.` });
  } else if (rk === "impulsiv") {
    rows.push({ area: "Entscheidungen", rating: tempoGap > 15 ? "kritisch" : "steuerbar", summary: `${cn} priorisiert Tempo, das Team eher ${compShort(tk)}.` });
  } else {
    rows.push({ area: "Entscheidungen", rating: rate(teamIstGap / 3), summary: `${cn} setzt auf ${compShort(rk)}, das Team auf ${compShort(tk)}. Unterschiedliche Bewertungen sind wahrscheinlich.` });
  }

  rows.push({ area: "Kommunikation", rating: rate(kommGap), summary: kommGap <= 8 ? "Ähnliche Kommunikationslogik. Missverständnisse sind selten." : `Gleiche Themen werden unterschiedlich gewichtet. Missverständnisse sind ${kommGap > 18 ? "sehr " : ""}wahrscheinlich.` });

  rows.push({ area: "Arbeitstempo", rating: rate(tempoGap), summary: tempoGap <= 8 ? "Kompatibles Arbeitstempo." : ist.impulsiv > team.impulsiv ? `${cn} arbeitet ${tempoGap > 18 ? "deutlich " : ""}schneller als das Team.` : `Das Team arbeitet ${tempoGap > 18 ? "deutlich " : ""}schneller als ${cn}.` });

  const sollStrukturGap = Math.abs(ist.analytisch - soll.analytisch);
  rows.push({ area: "Qualitätslogik", rating: rate(sollStrukturGap), summary: sollStrukturGap <= 8 ? "Strukturanforderung und Profil passen zusammen." : `Die Rolle verlangt ${soll.analytisch > ist.analytisch ? "mehr" : "weniger"} Struktur als ${cn} mitbringt.` });

  rows.push({ area: "Kulturwirkung", rating: rk === tk ? "stabil" : teamIstGap > 25 ? "kritisch" : "steuerbar", summary: rk === tk ? "Die Teamkultur bleibt stabil." : `Mehr ${compShort(rk)} kann als ${rk === "impulsiv" ? "Druck" : rk === "analytisch" ? "Einschränkung" : "Verzögerung"} erlebt werden.` });

  const kohGap = Math.min(tempoGap, kommGap, strukturGap);
  rows.push({ area: "Zusammenhalt", rating: teamIstGap <= 15 ? "stabil" : kohGap <= 10 ? "steuerbar" : "kritisch", summary: teamIstGap <= 15 ? "Hohe Kompatibilität stärkt den Zusammenhalt." : ist.intuitiv >= 30 ? `Der Kommunikationsanteil von ${cn} kann Spannungen teilweise abfedern.` : "Ohne bewusste Steuerung kann der Teamzusammenhalt leiden." });

  return rows;
}

function buildDeltaRows(sollIstGap: number, teamIstGap: number, sollTeamGap: number): DeltaRowData[] {
  function tone(g: number): "neutral" | "warning" | "danger" {
    if (g <= 20) return "neutral";
    if (g <= 40) return "warning";
    return "danger";
  }
  return [
    { label: "Soll vs. neue Person", value: sollIstGap, tone: tone(sollIstGap) },
    { label: "Team vs. neue Person", value: teamIstGap, tone: tone(teamIstGap) },
    { label: "Rolle vs. Team", value: sollTeamGap, tone: tone(sollTeamGap) },
  ];
}

function buildStressBars(ist: Triad, rk: ComponentKey, sk2: ComponentKey): StressBarsData {
  const bot: ComponentKey = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).find(k => k !== rk && k !== sk2)!;

  const pressureRaw = { ...ist };
  pressureRaw[rk] = Math.min(100, ist[rk] + 12);
  pressureRaw[sk2] = Math.max(0, ist[sk2] - 8);
  pressureRaw[bot] = Math.max(0, ist[bot] - 4);
  const pressure = normalizeTriad(pressureRaw);

  const stressRaw = { ...ist };
  stressRaw[rk] = Math.max(0, ist[rk] - 14);
  stressRaw[sk2] = Math.min(100, ist[sk2] + 10);
  stressRaw[bot] = Math.min(100, ist[bot] + 4);
  const stress = normalizeTriad(stressRaw);

  function toBars(t: Triad): StressBarItem[] {
    return [
      { label: "Tempo", value: Math.round(t.impulsiv), color: "bg-rose-500" },
      { label: "Kommunikation", value: Math.round(t.intuitiv), color: "bg-amber-500" },
      { label: "Struktur", value: Math.round(t.analytisch), color: "bg-blue-600" },
    ];
  }

  return {
    normal: toBars(ist),
    pressure: toBars(pressure),
    stress: toBars(stress),
  };
}

function buildRiskMeters(sollIstGap: number, teamIstGap: number, rk: ComponentKey, tk: ComponentKey): RiskMeterData[] {
  const reibung = Math.min(100, Math.round((teamIstGap / 60) * 100));
  const kultur = Math.min(100, rk !== tk ? Math.round(((teamIstGap + 10) / 70) * 100) : Math.round((teamIstGap / 80) * 100));
  const leistung = Math.min(100, Math.round(((sollIstGap * 0.6 + teamIstGap * 0.4) / 60) * 100));
  const steuerung = Math.min(100, Math.round(((sollIstGap + teamIstGap) / 80) * 100));
  return [
    { label: "Reibung im Alltag", value: reibung, color: reibung > 65 ? "bg-rose-500" : reibung > 40 ? "bg-amber-500" : "bg-blue-600" },
    { label: "Kulturveränderung", value: kultur, color: kultur > 65 ? "bg-rose-500" : kultur > 40 ? "bg-amber-500" : "bg-blue-600" },
    { label: "Leistungsrisiko", value: leistung, color: leistung > 65 ? "bg-rose-500" : leistung > 40 ? "bg-amber-500" : "bg-blue-600" },
    { label: "Steuerungsbedarf", value: steuerung, color: steuerung > 65 ? "bg-rose-500" : steuerung > 40 ? "bg-amber-500" : "bg-blue-600" },
  ];
}

function buildSystemForecast(
  cn: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, sollIstGap: number, sw: SystemwirkungResult
): ForecastItem[] {
  const items: ForecastItem[] = [];

  if (teamIstGap <= 15) {
    items.push({ title: "Kurzfristige Wirkung (0-3 Monate)", text: `Die Integration verläuft voraussichtlich reibungsarm. ${cn} und das Team arbeiten nach ähnlicher Logik. Kleine Unterschiede werden im Alltag sichtbar, bleiben aber steuerbar.` });
    items.push({ title: "Mittelfristige Wirkung (3-12 Monate)", text: `Die Zusammenarbeit stabilisiert sich. ${cn} wird als Teil des Teams wahrgenommen. Die bestehende Teamkultur bleibt weitgehend erhalten.` });
    items.push({ title: "Langfristige Wirkung (12+ Monate)", text: `Die Konstellation ist langfristig stabil. Kleinere Anpassungen in der Arbeitsweise passieren natürlich. Keine grundlegende Veränderung der Teamkultur zu erwarten.` });
    items.push({ title: "Kritischer Kipppunkt", text: `Bei dieser Konstellation gibt es keinen kritischen Kipppunkt. Normale Führungssteuerung reicht aus.` });
  } else if (teamIstGap <= 30) {
    items.push({ title: "Kurzfristige Wirkung (0-3 Monate)", text: `Unterschiede in ${compShort(rk)} und ${compShort(tk)} werden im Alltag sichtbar. Das Team braucht Orientierung und klare Spielregeln.` });
    items.push({ title: "Mittelfristige Wirkung (3-12 Monate)", text: `Wenn die Zusammenarbeit aktiv gesteuert wird, kann das Team von der neuen Perspektive profitieren. Ohne Steuerung können sich Spannungen verfestigen.` });
    items.push({ title: "Langfristige Wirkung (12+ Monate)", text: `Die Teamkultur verändert sich schrittweise. ${compShort(rk)} gewinnt an Bedeutung. Wenn diese Entwicklung bewusst begleitet wird, entsteht ein leistungsfähigeres Team.` });
    items.push({ title: "Kritischer Kipppunkt", text: `Die entscheidende Phase liegt in den Wochen 3-6. Werden in dieser Phase keine klaren Strukturen etabliert, können sich Konflikte verfestigen.` });
  } else {
    items.push({ title: "Kurzfristige Wirkung (0-3 Monate)", text: `Die unterschiedliche Arbeitslogik wird sofort sichtbar. ${cn} arbeitet stärker über ${compShort(rk)}, das Team stärker über ${compShort(tk)}. Reibungen bei Priorisierung und Arbeitsgeschwindigkeit sind wahrscheinlich.` });
    items.push({ title: "Mittelfristige Wirkung (3-12 Monate)", text: `Wenn die Zusammenarbeit aktiv moderiert wird, kann das Team von mehr ${compShort(rk)} profitieren. Ohne Führung verstärken sich Missverständnisse und Frustration.` });
    items.push({ title: "Langfristige Wirkung (12+ Monate)", text: `Langfristig verändert sich die Teamkultur spürbar. ${compShort(rk)} gewinnt an Gewicht. Wenn bewusst gesteuert, wird das Team leistungsfähiger. Ohne Leitplanken drohen dauerhafte Spannungen.` });
    items.push({ title: "Kritischer Kipppunkt", text: `Die entscheidende Phase liegt zwischen der 4. und 8. Woche. Werden in dieser Phase keine klaren Entscheidungswege, Spielregeln und Prioritäten etabliert, können sich Konfliktmuster verfestigen.` });
  }

  return items;
}

function buildIntegrationPhases(
  cn: string, rk: ComponentKey, tk: ComponentKey,
  teamIstGap: number, sollIstGap: number
): IntegrationPhase[] {
  const phase1: string[] = [
    `Kick-off-Gespräch mit Team und ${cn}.`,
    "Rolle, Spielregeln, Verantwortlichkeiten und Entscheidungsbefugnisse schriftlich klären.",
  ];
  if (rk !== tk) {
    phase1.push("Arbeitslogik transparent machen: Unterschiede benennen, nicht wegmoderieren.");
  }
  phase1.push("Beobachten und zuhören, bevor operative Akzente gesetzt werden.");
  if (teamIstGap > 25) {
    phase1.push(`Buddy benennen: Ein erfahrenes Teammitglied als Ansprechpartner für ${cn}.`);
  }

  const phase2: string[] = [
    `Erste strukturierte Feedbackrunde mit Team und ${cn} durchführen.`,
    "Prioritäten auf Basis des Feedbacks nachjustieren.",
  ];
  if (rk !== tk) {
    phase2.push(`Aufgaben bewusst so verteilen, dass Stärken von ${cn} genutzt und Reibung reduziert werden.`);
  }
  phase2.push("Quick Wins sichtbar machen, damit Akzeptanz entsteht.");
  if (teamIstGap > 30 || sollIstGap > 30) {
    phase2.push("Eskalationsmechanismus klären: Wer moderiert bei Konflikten?");
  }

  return [
    { phase: "Woche 1-2: Orientierung und Erwartungsklärung", bullets: phase1 },
    { phase: "Woche 3-4: Wirkung entfalten und nachsteuern", bullets: phase2 },
  ];
}

function buildSummaryHeadline(status: "gruen" | "gelb" | "rot", sw: SystemwirkungResult): string {
  if (status === "gruen") return "Kompatible Konstellation mit stabilem Fundament";
  if (status === "gelb") return `${sw.label} mit steuerbarem Reibungspotenzial`;
  return "Spannungsfeld mit hohem Reibungspotenzial";
}

function buildFazitMeta(status: "gruen" | "gelb" | "rot", teamIstGap: number, sollIstGap: number): { headline: string; tone: "success" | "warning" | "danger"; empfehlung: string } {
  if (status === "gruen") {
    return { headline: "Integration ohne besondere Steuerung möglich", tone: "success", empfehlung: "Normale Einarbeitung mit Feedbackschleifen" };
  }
  if (status === "gelb") {
    return { headline: "Integration mit gezielter Steuerung möglich", tone: "warning", empfehlung: "Aktive Führungsbegleitung in den ersten 30 Tagen" };
  }
  return { headline: "Integration nur mit aktivem Steuerungskonzept", tone: "danger", empfehlung: "Nur mit enger Führung einsetzen" };
}

function buildTeamNote(team: Triad, tk: ComponentKey): string {
  const wk = weakestKey(team);
  if (team[tk] - team[wk] <= 8) return "Das Team ist relativ ausgeglichen, mit leichtem Schwerpunkt auf " + compShort(tk) + ".";
  return `Das Team arbeitet primär über ${compDesc(tk)} (${team[tk]}%). Der schwächste Bereich liegt bei ${compDesc(wk)}.`;
}

function buildSollNote(soll: Triad, sk: ComponentKey): string {
  if (sk === "analytisch") return "Die Rolle verlangt klaren Strukturfokus, Prüftiefe und verlässliche Planung.";
  if (sk === "impulsiv") return "Die Rolle verlangt Tempo, Umsetzungsstärke und schnelle Entscheidungen.";
  return "Die Rolle verlangt Beziehungsorientierung, Kommunikation und Teamfähigkeit.";
}

function buildIstNote(ist: Triad, rk: ComponentKey, cn: string): string {
  const sorted = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).sort((a, b) => ist[b] - ist[a]);
  return `${cn} bringt vor allem ${compShort(sorted[0])} und ${compShort(sorted[1])} mit.`;
}

function buildStressCallout(cn: string, rk: ComponentKey, tk: ComponentKey, sk2: ComponentKey, teamIstGap: number): string {
  if (rk === tk && teamIstGap <= 15) return `Für das Team bedeutet das: Unter Druck bleibt die Konstellation stabil. ${cn} verstärkt die vorhandene Teamlogik.`;
  if (rk !== tk) return `Für das Team bedeutet das: Unter Druck wird die Abweichung zunächst sichtbarer, weil ${cn} noch stärker auf ${compShort(rk)} setzt. Unter sehr hohem Stress verschiebt sich das Verhalten erneut. Das Team sollte darauf vorbereitet sein.`;
  return `Für das Team bedeutet das: Unter Druck verstärkt ${cn} die vorhandene Logik. Die Intensität steigt, die Richtung bleibt gleich.`;
}

function buildRiskCallout(cn: string, ist: Triad, team: Triad, rk: ComponentKey, tk: ComponentKey): string {
  if (rk === tk) return `Die Profile von ${cn} und dem Team sind in ihrer Grundlogik kompatibel. Die Reibung bleibt gering.`;
  const gaps: [ComponentKey, number][] = [
    ["impulsiv", Math.abs(ist.impulsiv - team.impulsiv)],
    ["intuitiv", Math.abs(ist.intuitiv - team.intuitiv)],
    ["analytisch", Math.abs(ist.analytisch - team.analytisch)],
  ];
  gaps.sort((a, b) => b[1] - a[1]);
  return `Die größte Reibung entsteht im Bereich ${compDesc(gaps[0][0])}. ${cn} und das Team bewerten diesen Bereich grundlegend anders.`;
}
