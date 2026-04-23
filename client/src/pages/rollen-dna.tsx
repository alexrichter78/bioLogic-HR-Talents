import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft, Save, FolderOpen, Check, ChevronDown, ArrowRight, Users, Target, Layers, Activity, CheckCircle2, MoreHorizontal, X, ChevronRight, Info, RefreshCw, Briefcase, Heart, Settings, Shield, BarChart3, Lightbulb, FileText, MessageSquare, LayoutGrid, Wrench, UserCheck, Hash, ClipboardList, Pencil } from "lucide-react";
import logoSrc from "@assets/1_1773849007741.png";
import GlobalNav from "@/components/global-nav";
import { BERUFE, type BerufLand } from "@/data/berufe";
import { useRegion, localizeStr } from "@/lib/region";
import { useIsMobile } from "@/hooks/use-mobile";

type KompetenzTyp = "Impulsiv" | "Intuitiv" | "Analytisch";
type Niveau = "Niedrig" | "Mittel" | "Hoch";
type TaetigkeitKategorie = "haupt" | "neben" | "fuehrung";

interface Taetigkeit {
  id: number;
  name: string;
  kategorie: TaetigkeitKategorie;
  kompetenz: KompetenzTyp;
  niveau: Niveau;
  confidence?: number;
}

const KOMPETENZ_COLORS: Record<KompetenzTyp, string> = {
  Impulsiv: "#C41E3A",
  Intuitiv: "#F39200",
  Analytisch: "#1A5DAB",
};

const KOMPETENZ_OPTIONS: KompetenzTyp[] = ["Impulsiv", "Intuitiv", "Analytisch"];
const NIVEAU_OPTIONS: Niveau[] = ["Niedrig", "Mittel", "Hoch"];

const LEVEL_MULTIPLIER: Record<Niveau, number> = { Niedrig: 0.6, Mittel: 1.0, Hoch: 1.8 };

interface BioGram { imp: number; int: number; ana: number; }

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

function calcBioGram(items: Taetigkeit[]): BioGram {
  if (items.length === 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  let sImp = 0, sInt = 0, sAna = 0;
  for (const t of items) {
    const w = LEVEL_MULTIPLIER[t.niveau] ?? 1.0;
    if (t.kompetenz === "Impulsiv") sImp += w;
    else if (t.kompetenz === "Intuitiv") sInt += w;
    else if (t.kompetenz === "Analytisch") sAna += w;
  }
  const total = sImp + sInt + sAna;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sImp / total) * 100, (sInt / total) * 100, (sAna / total) * 100);
  return { imp, int, ana };
}

type ResultKey =
  | "IMP_INT_ANA" | "IMP_ANA_INT" | "INT_IMP_ANA" | "INT_ANA_IMP" | "ANA_IMP_INT" | "ANA_INT_IMP"
  | "IMP_INT__ANA" | "IMP_ANA__INT" | "INT_IMP__ANA" | "INT_ANA__IMP" | "ANA_IMP__INT" | "ANA_INT__IMP"
  | "BD_IMP" | "BD_INT" | "BD_ANA"
  | "BALANCED";

type RoleResultEntry = { headline: string; body: string[]; leadership: string };

const DUAL_THRESHOLD = 4;
const DUAL_GAP2_MIN = 6;
const BALANCED_THRESHOLD = 5;

const DIMENSION_LABELS: Record<string, string> = { IMP: "Impulsiv", INT: "Intuitiv", ANA: "Analytisch" };
const DIMENSION_PLAIN: Record<string, string> = {
  IMP: "Umsetzung und Entscheidungskraft",
  INT: "Zusammenarbeit und Kommunikation",
  ANA: "Struktur und Planung",
};

type RoleAnalysis = {
  resultKey: ResultKey;
  dominanceType: "single" | "dual" | "balanced";
  sorted: { key: string; value: number }[];
  topGap: number;
  bottomGap: number;
  bottomTwoClose: boolean;
  intensityLabel: string;
};

function getRoleAnalysis(imp: number, int: number, ana: number): RoleAnalysis {
  const vals = [
    { key: "IMP", value: imp },
    { key: "INT", value: int },
    { key: "ANA", value: ana },
  ].sort((a, b) => b.value - a.value);
  const maxV = vals[0].value, midV = vals[1].value, minV = vals[2].value;
  const topGap = maxV - midV;
  const bottomGap = midV - minV;
  const bottomTwoClose = bottomGap <= DUAL_THRESHOLD;

  let resultKey: ResultKey;
  let dominanceType: "single" | "dual" | "balanced";

  if (topGap <= BALANCED_THRESHOLD && bottomGap <= BALANCED_THRESHOLD) {
    resultKey = "BALANCED";
    dominanceType = "balanced";
  } else if (topGap <= DUAL_THRESHOLD && bottomGap >= DUAL_GAP2_MIN) {
    resultKey = `${vals[0].key}_${vals[1].key}__${vals[2].key}` as ResultKey;
    dominanceType = "dual";
  } else if (bottomGap <= DUAL_THRESHOLD && topGap >= DUAL_GAP2_MIN) {
    resultKey = `BD_${vals[0].key}` as ResultKey;
    dominanceType = "dual";
  } else {
    resultKey = `${vals[0].key}_${vals[1].key}_${vals[2].key}` as ResultKey;
    dominanceType = "single";
  }

  let intensityLabel = "";
  if (dominanceType === "single") {
    if (topGap >= 15) intensityLabel = "sehr deutlich";
    else if (topGap >= 10) intensityLabel = "deutlich";
    else if (topGap >= 6) intensityLabel = "erkennbar";
  }

  return { resultKey, dominanceType, sorted: vals, topGap, bottomGap, bottomTwoClose, intensityLabel };
}

function getContextLines(analysis: RoleAnalysis): string[] {
  const s = analysis.sorted;
  const d0 = DIMENSION_PLAIN[s[0].key], l0 = DIMENSION_LABELS[s[0].key];
  const d1 = DIMENSION_PLAIN[s[1].key], l1 = DIMENSION_LABELS[s[1].key];
  const d2 = DIMENSION_PLAIN[s[2].key], l2 = DIMENSION_LABELS[s[2].key];

  if (analysis.dominanceType === "balanced") {
    return [
      "Alle drei Bereiche liegen auf einem ähnlichen Niveau. Es gibt keinen klaren Schwerpunkt.",
    ];
  }

  if (analysis.dominanceType === "dual") {
    return [
      `${d0} (${l0}) und ${d1} (${l1}) sind hier gleich stark ausgeprägt.`,
      `${d2} (${l2}) tritt dagegen in den Hintergrund.`,
    ];
  }

  const lines: string[] = [];
  if (analysis.intensityLabel) {
    lines.push(`Der Schwerpunkt liegt ${analysis.intensityLabel} auf ${d0} (${l0}).`);
  } else {
    lines.push(`Der Schwerpunkt liegt auf ${d0} (${l0}).`);
  }

  if (analysis.bottomTwoClose) {
    lines.push(`${d1} (${l1}) und ${d2} (${l2}) liegen nah beieinander und bilden gemeinsam den Hintergrund.`);
  } else {
    lines.push(`${d1} (${l1}) spielt die zweite Rolle. ${d2} (${l2}) hat das geringste Gewicht.`);
  }

  return lines;
}

function getRoleResultKey(imp: number, int: number, ana: number): ResultKey {
  return getRoleAnalysis(imp, int, ana).resultKey;
}

const roleResultTexts: Record<ResultKey, RoleResultEntry> = {
  IMP_INT_ANA: {
    headline: "Aktives Handeln pr\u00e4gt den Alltag \u2013 unter Druck mehr Austausch mit anderen",
    body: [
      "Im Arbeitsalltag wird diese Stelle vor allem durch eine aktive und entscheidungsorientierte Arbeitsweise geprägt. Themen werden früh aufgegriffen, Verantwortung wird übernommen und Entscheidungen werden vergleichsweise zügig getroffen. Die Stelle wirkt dadurch dynamisch und handlungsstark.",
      "Wenn der Druck steigt, r\u00fcckt st\u00e4rker der Austausch mit anderen in den Vordergrund. Gespr\u00e4che, Abstimmung und das Einbeziehen verschiedener Perspektiven helfen dabei, Entscheidungen abzusichern und L\u00f6sungen gemeinsam zu entwickeln.",
      "Diese Kombination sorgt daf\u00fcr, dass Themen nicht nur schnell in Bewegung kommen, sondern auch im Dialog mit anderen weiterentwickelt werden. Entscheidungen werden dadurch sowohl getragen als auch umgesetzt.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Entscheidungen, sichtbare Verantwortung und eine offene Kommunikation mit dem Umfeld.",
  },
  IMP_ANA_INT: {
    headline: "Entscheidungen und Umsetzung pr\u00e4gen den Alltag \u2013 unter Druck mehr Struktur und Kontrolle",
    body: [
      "Im Arbeitsalltag wird diese Stelle vor allem durch Entscheidungsstärke und Umsetzungsorientierung geprägt. Themen werden aktiv aufgegriffen, Verantwortung wird übernommen und Entscheidungen werden vergleichsweise zügig getroffen.",
      "Wenn der Druck steigt, w\u00e4chst h\u00e4ufig das Bed\u00fcrfnis nach Struktur, Planung und Kontrolle. Themen werden genauer gepr\u00fcft, Abl\u00e4ufe werden klarer geordnet und Entscheidungen st\u00e4rker \u00fcber Analyse abgesichert.",
      "Diese Kombination sorgt daf\u00fcr, dass Entscheidungen nicht nur getroffen, sondern auch strukturiert umgesetzt werden. Dynamik wird durch Ordnung erg\u00e4nzt.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Zielorientierung, strukturierte Steuerung und verbindliche Entscheidungen.",
  },
  INT_IMP_ANA: {
    headline: "Zusammenarbeit pr\u00e4gt den Alltag \u2013 unter Druck schnelleres Entscheiden und Handeln",
    body: [
      "Im Arbeitsalltag steht vor allem Zusammenarbeit und Austausch mit anderen im Mittelpunkt. Gespr\u00e4che, Abstimmung und ein gutes Gesp\u00fcr f\u00fcr Situationen pr\u00e4gen die Arbeitsweise.",
      "Wenn der Druck steigt, k\u00f6nnen Entscheidungen direkter und schneller getroffen werden. Themen werden aktiver vorangebracht, um Bewegung in Situationen zu bringen.",
      "Diese Kombination sorgt daf\u00fcr, dass Zusammenarbeit nicht nur \u00fcber Gespr\u00e4che l\u00e4uft, sondern auch in konkrete Schritte \u00fcberf\u00fchrt wird.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch offene Kommunikation, hohe Pr\u00e4senz im Team und die F\u00e4higkeit, Themen gemeinsam voranzubringen.",
  },
  INT_ANA_IMP: {
    headline: "Zusammenarbeit pr\u00e4gt den Alltag \u2013 unter Druck mehr Struktur und Klarheit",
    body: [
      "Im Arbeitsalltag prägt vor allem Zusammenarbeit und Abstimmung diese Stelle. Austausch, Gespräche und ein gutes Gespür für Menschen stehen im Mittelpunkt.",
      "Wenn der Druck steigt, w\u00e4chst h\u00e4ufig das Bed\u00fcrfnis nach Struktur, Planung und klaren Abl\u00e4ufen. Entscheidungen werden st\u00e4rker \u00fcber Analyse und Ordnung abgesichert.",
      "Diese Kombination sorgt daf\u00fcr, dass Zusammenarbeit nicht nur \u00fcber Gespr\u00e4che funktioniert, sondern auch durch klare Strukturen stabilisiert wird.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch dialogorientierte F\u00fchrung, nachvollziehbare Entscheidungen und eine strukturierte Organisation der Zusammenarbeit.",
  },
  ANA_IMP_INT: {
    headline: "Struktur und Planung pr\u00e4gen den Alltag \u2013 unter Druck schnellere Entscheidungen",
    body: [
      "Im Arbeitsalltag pr\u00e4gen vor allem Struktur, Planung und fachliche Klarheit die Arbeitsweise. Themen werden sorgf\u00e4ltig analysiert und vorbereitet, bevor Entscheidungen getroffen werden.",
      "Wenn der Druck steigt, k\u00f6nnen Entscheidungen schneller und direkter getroffen werden, um Themen voranzubringen.",
      "Diese Kombination verbindet sorgf\u00e4ltige Planung mit klarer Umsetzungskraft.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Strukturen, sachliche Entscheidungen und konsequente Umsetzung.",
  },
  ANA_INT_IMP: {
    headline: "Struktur und Planung pr\u00e4gen den Alltag \u2013 unter Druck mehr Austausch und Abstimmung",
    body: [
      "Im Arbeitsalltag stehen Struktur, Planung und fachliche Klarheit im Mittelpunkt. Themen werden systematisch vorbereitet und sorgf\u00e4ltig durchdacht.",
      "Wenn der Druck steigt, gewinnt der Austausch mit anderen st\u00e4rker an Bedeutung. Gespr\u00e4che und Abstimmung helfen dabei, Entscheidungen gemeinsam zu tragen.",
      "Diese Kombination sorgt daf\u00fcr, dass Entscheidungen sowohl durchdacht als auch abgestimmt getroffen werden.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Strukturen, nachvollziehbare Entscheidungen und eine offene Abstimmung im Team.",
  },
  IMP_INT__ANA: {
    headline: "Aktives Handeln und Zusammenarbeit pr\u00e4gen den Alltag \u2013 unter Druck mehr Struktur",
    body: [
      "Im Arbeitsalltag wirken Handlungsorientierung und Zusammenarbeit besonders eng zusammen. Themen werden aktiv vorangebracht und gleichzeitig im Austausch mit anderen abgestimmt.",
      "Wenn der Druck steigt, w\u00e4chst h\u00e4ufig der Wunsch nach mehr Struktur und Orientierung, um Themen klarer zu ordnen und Entscheidungen abzusichern.",
      "Diese Kombination verbindet Dynamik mit gemeinsamer Abstimmung und sorgt daf\u00fcr, dass Bewegung und Zusammenarbeit gleichzeitig m\u00f6glich sind.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch aktive Kommunikation, klare Entscheidungen und eine hohe Pr\u00e4senz im Team.",
  },
  IMP_ANA__INT: {
    headline: "Entscheidungen und Struktur pr\u00e4gen den Alltag \u2013 unter Druck mehr Austausch",
    body: [
      "Im Arbeitsalltag verbinden sich Entscheidungsst\u00e4rke und strukturierte Arbeitsweise besonders eng. Themen werden aktiv vorangebracht und gleichzeitig sorgf\u00e4ltig geplant.",
      "Wenn der Druck steigt, gewinnt der Austausch mit anderen st\u00e4rker an Bedeutung. Gespr\u00e4che helfen dabei, Entscheidungen zu reflektieren und Perspektiven einzubeziehen.",
      "Diese Kombination sorgt daf\u00fcr, dass Entscheidungen sowohl konsequent als auch nachvollziehbar umgesetzt werden.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Orientierung, strukturierte Steuerung und offenen Dialog.",
  },
  INT_IMP__ANA: {
    headline: "Zusammenarbeit und Aktivit\u00e4t pr\u00e4gen den Alltag \u2013 unter Druck mehr Struktur",
    body: [
      "Im Arbeitsalltag wirken Zusammenarbeit und Aktivit\u00e4t besonders eng zusammen. Themen werden im Austausch mit anderen entwickelt und gleichzeitig aktiv vorangebracht.",
      "Wenn der Druck steigt, w\u00e4chst h\u00e4ufig das Bed\u00fcrfnis nach mehr Struktur und Ordnung, um Entscheidungen abzusichern.",
      "Diese Kombination verbindet Dynamik mit gemeinsamer Abstimmung und sorgt daf\u00fcr, dass Zusammenarbeit handlungsf\u00e4hig bleibt.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch offene Kommunikation, hohe Pr\u00e4senz im Team und klare Entscheidungen.",
  },
  INT_ANA__IMP: {
    headline: "Zusammenarbeit und Struktur pr\u00e4gen den Alltag \u2013 unter Druck schnellere Entscheidungen",
    body: [
      "Im Arbeitsalltag verbinden sich Zusammenarbeit und strukturierte Arbeitsweise besonders eng. Austausch und klare Abl\u00e4ufe pr\u00e4gen die t\u00e4gliche Arbeit.",
      "Wenn der Druck steigt, k\u00f6nnen Entscheidungen direkter und schneller getroffen werden, um Themen voranzubringen.",
      "Diese Kombination sorgt daf\u00fcr, dass Zusammenarbeit durch klare Strukturen und konkrete Schritte unterst\u00fctzt wird.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch offene Kommunikation, strukturierte Planung und klare Orientierung f\u00fcr das Team.",
  },
  ANA_IMP__INT: {
    headline: "Struktur und Umsetzung pr\u00e4gen den Alltag \u2013 unter Druck mehr Austausch",
    body: [
      "Im Arbeitsalltag verbinden sich Entscheidungsst\u00e4rke und strukturierte Arbeitsweise besonders eng. Themen werden aktiv vorangebracht und gleichzeitig sorgf\u00e4ltig geplant.",
      "Wenn der Druck steigt, gewinnt der Austausch mit anderen st\u00e4rker an Bedeutung. Gespr\u00e4che helfen dabei, Entscheidungen zu reflektieren und Perspektiven einzubeziehen.",
      "Diese Kombination sorgt daf\u00fcr, dass Entscheidungen sowohl konsequent als auch nachvollziehbar umgesetzt werden.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Orientierung, strukturierte Steuerung und offenen Dialog.",
  },
  ANA_INT__IMP: {
    headline: "Struktur und Zusammenarbeit pr\u00e4gen den Alltag \u2013 unter Druck schnellere Entscheidungen",
    body: [
      "Im Arbeitsalltag verbinden sich Zusammenarbeit und strukturierte Arbeitsweise besonders eng. Austausch und klare Abl\u00e4ufe pr\u00e4gen die t\u00e4gliche Arbeit.",
      "Wenn der Druck steigt, k\u00f6nnen Entscheidungen direkter und schneller getroffen werden, um Themen voranzubringen.",
      "Diese Kombination sorgt daf\u00fcr, dass Zusammenarbeit durch klare Strukturen und konkrete Schritte unterst\u00fctzt wird.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch offene Kommunikation, strukturierte Planung und klare Orientierung f\u00fcr das Team.",
  },
  BD_IMP: {
    headline: "Schnelle Entscheidungen pr\u00e4gen den Alltag \u2013 unter Druck mehr Austausch oder Struktur",
    body: [
      "Im Arbeitsalltag pr\u00e4gt vor allem Entscheidungs- und Handlungsorientierung die Arbeitsweise. Themen werden aktiv aufgegriffen und vorangebracht.",
      "Neben dieser klaren Ausrichtung wirken jedoch zwei nahezu gleich starke Erg\u00e4nzungsrichtungen: der Wunsch nach Austausch mit anderen sowie das Bed\u00fcrfnis nach Struktur und Planung.",
      "Diese beiden Seiten konkurrieren dauerhaft miteinander. Je nach Situation kann daher entweder mehr Abstimmung oder mehr Struktur sichtbar werden.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Entscheidungen, kombiniert mit situativer Anpassung zwischen Dialog und Struktur.",
  },
  BD_INT: {
    headline: "Zusammenarbeit pr\u00e4gt den Alltag \u2013 unter Druck mehr Struktur oder schnellere Entscheidungen",
    body: [
      "Im Arbeitsalltag pr\u00e4gt vor allem Zusammenarbeit und Abstimmung die Arbeitsweise. Gespr\u00e4che, Austausch und ein gutes Gesp\u00fcr f\u00fcr Menschen stehen im Mittelpunkt.",
      "Gleichzeitig wirken im Hintergrund zwei nahezu gleich starke Erg\u00e4nzungsrichtungen: der Wunsch nach Struktur und Planung einerseits sowie der Impuls zu schneller Entscheidung und direkter Umsetzung andererseits.",
      "Diese beiden Tendenzen konkurrieren fortlaufend miteinander und k\u00f6nnen je nach Situation unterschiedlich sichtbar werden.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch dialogorientierte F\u00fchrung mit einer inneren Spannung zwischen sorgf\u00e4ltiger Steuerung und z\u00fcgiger Umsetzung.",
  },
  BD_ANA: {
    headline: "Struktur pr\u00e4gt den Alltag \u2013 unter Druck schnellere Entscheidungen oder mehr Austausch",
    body: [
      "Im Arbeitsalltag pr\u00e4gen Struktur, Planung und fachliche Klarheit die Arbeitsweise. Themen werden sorgf\u00e4ltig gepr\u00fcft und vorbereitet.",
      "Gleichzeitig wirken im Hintergrund zwei nahezu gleich starke Erg\u00e4nzungsrichtungen: der Impuls zu schneller Umsetzung sowie der Wunsch nach Austausch und Abstimmung mit anderen.",
      "Diese beiden Richtungen konkurrieren miteinander und k\u00f6nnen je nach Situation unterschiedlich stark zum Vorschein kommen.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch klare Strukturen, kombiniert mit situativer Anpassung zwischen Entscheidung und Dialog.",
  },
  BALANCED: {
    headline: "Ausgeglichenes Profil",
    body: [
      "In diesem Profil sind verschiedene Herangehensweisen ähnlich stark ausgeprägt. Die Stelle ist dadurch nicht einseitig festgelegt, sondern kann sich flexibel an unterschiedliche Anforderungen anpassen.",
      "Je nach Situation kann zwischen Umsetzung, Zusammenarbeit und strukturierter Analyse gewechselt werden. Welche Seite st\u00e4rker sichtbar wird, h\u00e4ngt h\u00e4ufig von Aufgabe, Umfeld und Drucksituation ab.",
      "Diese Breite sorgt dafür, dass die Stelle besonders dort stark wirkt, wo Flexibilität, Überblick und ein variables Vorgehen gefragt sind.",
    ],
    leadership: "In der F\u00fchrungsarbeit zeigt sich das durch eine situationsabh\u00e4ngige Steuerung und die F\u00e4higkeit, je nach Bedarf zwischen Klarheit, Dialog und Umsetzung zu wechseln.",
  },
};

const analysisPrincipleText = {
  title: "Grundprinzip der Analyse",
  body: [
    "Jeder Mensch verfügt über die drei grundlegenden Denk- und Handlungsweisen Impulsiv, Intuitiv und Analytisch.",
    "Alle drei Anteile sind immer vorhanden. Der Unterschied liegt in ihrer Reihenfolge und Gewichtung.",
    "Diese Struktur prägt, wie Menschen im Alltag entscheiden, kommunizieren und handeln.",
    "Je nach Situation kann sich die sichtbare Wirkung verändern: im Arbeitsalltag, unter Stress oder in entspannten Situationen.",
  ],
};

const analysisPrincipleText_EN = {
  title: "Underlying principle of the analysis",
  body: [
    "Every person draws on the three basic ways of thinking and acting: Action-oriented, Relational and Analytical.",
    "All three parts are always present. The difference lies in their order and weighting.",
    "This structure shapes how people decide, communicate and act in daily life.",
    "Depending on the situation, the visible effect can shift: in everyday work, under stress or in relaxed situations.",
  ],
};

const roleRequirementText = {
  intro: [
    "Diese Auswertung beschreibt die Wirklogik der Stelle.",
    "Die Anforderungen werden den drei Dimensionen Impulsiv, Intuitiv und Analytisch zugeordnet.",
    "Dadurch wird sichtbar, welche Form der Wirksamkeit im Arbeitsalltag dieser Stelle im Mittelpunkt steht.",
  ],
  outro: "",
};

const roleRequirementText_EN = {
  intro: [
    "This evaluation describes the working logic of the role.",
    "The requirements are mapped to the three dimensions Action-oriented, Relational and Analytical.",
    "This makes visible which form of effectiveness is central in the daily work of this position.",
  ],
  outro: "",
};

const analysisPrincipleText_FR = {
  title: "Principe fondamental de l'analyse",
  body: [
    "Chaque personne dispose des trois modes fondamentaux de pensée et d'action : Orienté action, Relationnel et Analytique.",
    "Ces trois composantes sont toujours présentes. La différence réside dans leur ordre et leur pondération.",
    "Cette structure détermine la façon dont les personnes décident, communiquent et agissent au quotidien.",
    "Selon la situation, l'effet visible peut varier : dans le travail quotidien, sous pression ou dans des situations détendues.",
  ],
};

const roleRequirementText_FR = {
  intro: [
    "Cette évaluation décrit la logique de travail du poste.",
    "Les exigences sont réparties selon les trois dimensions Orienté action, Relationnel et Analytique.",
    "Cela permet d'identifier quelle forme d'efficacité est au centre du quotidien professionnel de ce poste.",
  ],
  outro: "",
};

const analysisPrincipleText_IT = {
    title: "Principio fondamentale dell'analisi",
    body: [
      "Ogni persona dispone dei tre modi fondamentali di pensiero e azione: Orientato all'azione, Relazionale e Analitico.",
      "Tutte e tre le componenti sono sempre presenti. La differenza sta nel loro ordine e nella loro ponderazione.",
      "Questa struttura determina il modo in cui le persone decidono, comunicano e agiscono nel quotidiano.",
      "A seconda della situazione, l'effetto visibile puo' variare: nel lavoro quotidiano, sotto pressione o in situazioni rilassate.",
    ],
  };

  const roleRequirementText_IT = {
    intro: [
      "Questa valutazione descrive la logica lavorativa del ruolo.",
      "I requisiti vengono attribuiti alle tre dimensioni Orientato all'azione, Relazionale e Analitico.",
      "Cio' rende visibile quale forma di efficacia e' al centro del lavoro quotidiano di questa posizione.",
    ],
    outro: "",
  };

  const roleResultTextsFR: Record<ResultKey, RoleResultEntry> = {
  IMP_INT_ANA: {
    headline: "L'action active marque le quotidien, sous pression davantage d'échange avec les autres",
    body: [
      "Dans le travail quotidien, ce poste est avant tout marqué par une manière de travailler active et orientée vers les décisions. Les sujets sont pris en charge tôt, les responsabilités assumées et les décisions prises comparativement rapidement. Le poste dégage ainsi une dynamique forte et orientée vers l'action.",
      "Lorsque la pression monte, l'échange avec les autres devient plus important. Les entretiens, la coordination et la prise en compte de différentes perspectives contribuent à consolider les décisions et à développer des solutions ensemble.",
      "Cette combinaison fait en sorte que les sujets ne se mettent pas seulement rapidement en mouvement, mais sont également développés en dialogue avec les autres. Les décisions sont ainsi portées et mises en oeuvre.",
    ],
    leadership: "Dans le travail de management, cela se traduit par des décisions claires, une responsabilité visible et une communication ouverte avec l'environnement.",
  },
  IMP_ANA_INT: {
    headline: "Décisions et mise en oeuvre marquent le quotidien, sous pression davantage de structure et de contrôle",
    body: [
      "Dans le travail quotidien, ce poste est avant tout marqué par la capacité décisionnelle et l'orientation vers la mise en oeuvre. Les sujets sont pris en charge activement, les responsabilités assumées et les décisions prises comparativement rapidement.",
      "Lorsque la pression monte, le besoin de structure, de planification et de contrôle augmente souvent. Les sujets sont examinés plus attentivement, les processus mieux organisés et les décisions davantage étayées par l'analyse.",
      "Cette combinaison fait en sorte que les décisions ne sont pas seulement prises, mais aussi structurées et mises en oeuvre. Le dynamisme est complété par l'ordre.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une orientation claire vers les objectifs, un pilotage structuré et des décisions engageantes.",
  },
  INT_IMP_ANA: {
    headline: "La collaboration marque le quotidien, sous pression des décisions et actions plus rapides",
    body: [
      "Dans le travail quotidien, la collaboration et l'échange avec les autres sont au premier plan. Les entretiens, la coordination et un bon sens des situations caractérisent la manière de travailler.",
      "Lorsque la pression monte, les décisions peuvent être prises de manière plus directe et plus rapide, afin de faire avancer les sujets.",
      "Cette combinaison fait en sorte que la collaboration ne passe pas seulement par les échanges, mais se traduit aussi en actions concrètes.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une communication ouverte, une forte présence dans l'équipe et la capacité à faire avancer les sujets ensemble.",
  },
  INT_ANA_IMP: {
    headline: "La collaboration marque le quotidien, sous pression davantage de structure et de clarté",
    body: [
      "Dans le travail quotidien, la collaboration et la coordination caractérisent avant tout ce poste. L'échange, les entretiens et un bon sens des personnes sont au coeur de la pratique.",
      "Lorsque la pression monte, le besoin de structure, de planification et de processus clairs augmente souvent. Les décisions sont davantage étayées par l'analyse et l'organisation.",
      "Cette combinaison fait en sorte que la collaboration ne fonctionne pas seulement par les échanges, mais est aussi stabilisée par des structures claires.",
    ],
    leadership: "Dans le travail de management, cela se traduit par un management orienté vers le dialogue, des décisions compréhensibles et une organisation structurée de la collaboration.",
  },
  ANA_IMP_INT: {
    headline: "Structure et planification marquent le quotidien, sous pression des décisions plus rapides",
    body: [
      "Dans le travail quotidien, la structure, la planification et la clarté professionnelle caractérisent avant tout la manière de travailler. Les sujets sont analysés et préparés avec soin avant que des décisions soient prises.",
      "Lorsque la pression monte, les décisions peuvent être prises plus rapidement et de manière plus directe afin de faire avancer les sujets.",
      "Cette combinaison associe une planification soignée à une capacité de mise en oeuvre claire.",
    ],
    leadership: "Dans le travail de management, cela se traduit par des structures claires, des décisions fondées et une mise en oeuvre cohérente.",
  },
  ANA_INT_IMP: {
    headline: "Structure et planification marquent le quotidien, sous pression davantage d'échange et de coordination",
    body: [
      "Dans le travail quotidien, la structure, la planification et la clarté professionnelle sont au centre. Les sujets sont préparés systématiquement et réfléchis avec soin.",
      "Lorsque la pression monte, l'échange avec les autres prend de l'importance. Les entretiens et la coordination contribuent à partager les décisions.",
      "Cette combinaison fait en sorte que les décisions sont à la fois réfléchies et coordonnées.",
    ],
    leadership: "Dans le travail de management, cela se traduit par des structures claires, des décisions compréhensibles et une coordination ouverte au sein de l'équipe.",
  },
  IMP_INT__ANA: {
    headline: "Action active et collaboration marquent le quotidien, sous pression davantage de structure",
    body: [
      "Dans le travail quotidien, l'orientation vers l'action et la collaboration fonctionnent de façon particulièrement étroite. Les sujets sont activement portés en avant et coordonnés simultanément avec les autres.",
      "Lorsque la pression monte, le besoin de davantage de structure et d'orientation augmente souvent, afin de mieux organiser les sujets et de consolider les décisions.",
      "Cette combinaison associe la dynamique à la coordination commune et fait en sorte que le mouvement et la collaboration sont possibles simultanément.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une communication active, des décisions claires et une forte présence dans l'équipe.",
  },
  IMP_ANA__INT: {
    headline: "Décisions et structure marquent le quotidien, sous pression davantage d'échange",
    body: [
      "Dans le travail quotidien, la capacité décisionnelle et la manière de travailler structurée se combinent de façon particulièrement étroite. Les sujets sont portés activement en avant et simultanément planifiés avec soin.",
      "Lorsque la pression monte, l'échange avec les autres prend davantage d'importance. Les entretiens aident à réfléchir aux décisions et à intégrer différentes perspectives.",
      "Cette combinaison fait en sorte que les décisions sont mises en oeuvre de manière à la fois cohérente et compréhensible.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une orientation claire, un pilotage structuré et un dialogue ouvert.",
  },
  INT_IMP__ANA: {
    headline: "Collaboration et activité marquent le quotidien, sous pression davantage de structure",
    body: [
      "Dans le travail quotidien, la collaboration et l'activité fonctionnent de façon particulièrement étroite. Les sujets sont développés en échange avec les autres et en même temps portés activement en avant.",
      "Lorsque la pression monte, le besoin de davantage de structure et d'ordre augmente souvent, afin de consolider les décisions.",
      "Cette combinaison associe la dynamique à la coordination commune et fait en sorte que la collaboration reste opérationnelle.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une communication ouverte, une forte présence dans l'équipe et des décisions claires.",
  },
  INT_ANA__IMP: {
    headline: "Collaboration et structure marquent le quotidien, sous pression des décisions plus rapides",
    body: [
      "Dans le travail quotidien, la collaboration et la manière de travailler structurée se combinent de façon particulièrement étroite. L'échange et des processus clairs caractérisent le travail quotidien.",
      "Lorsque la pression monte, les décisions peuvent être prises de manière plus directe et plus rapide afin de faire avancer les sujets.",
      "Cette combinaison fait en sorte que la collaboration est soutenue par des structures claires et des étapes concrètes.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une communication ouverte, une planification structurée et une orientation claire pour l'équipe.",
  },
  ANA_IMP__INT: {
    headline: "Structure et mise en oeuvre marquent le quotidien, sous pression davantage d'échange",
    body: [
      "Dans le travail quotidien, la capacité décisionnelle et la manière de travailler structurée se combinent de façon particulièrement étroite. Les sujets sont portés activement en avant et simultanément planifiés avec soin.",
      "Lorsque la pression monte, l'échange avec les autres prend davantage d'importance. Les entretiens aident à réfléchir aux décisions et à intégrer différentes perspectives.",
      "Cette combinaison fait en sorte que les décisions sont mises en oeuvre de manière à la fois cohérente et compréhensible.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une orientation claire, un pilotage structuré et un dialogue ouvert.",
  },
  ANA_INT__IMP: {
    headline: "Structure et collaboration marquent le quotidien, sous pression des décisions plus rapides",
    body: [
      "Dans le travail quotidien, la collaboration et la manière de travailler structurée se combinent de façon particulièrement étroite. L'échange et des processus clairs caractérisent le travail quotidien.",
      "Lorsque la pression monte, les décisions peuvent être prises de manière plus directe et plus rapide afin de faire avancer les sujets.",
      "Cette combinaison fait en sorte que la collaboration est soutenue par des structures claires et des étapes concrètes.",
    ],
    leadership: "Dans le travail de management, cela se traduit par une communication ouverte, une planification structurée et une orientation claire pour l'équipe.",
  },
  BD_IMP: {
    headline: "Les décisions rapides marquent le quotidien, sous pression davantage d'échange ou de structure",
    body: [
      "Dans le travail quotidien, l'orientation vers la décision et l'action caractérise avant tout la manière de travailler. Les sujets sont pris en charge activement et portés en avant.",
      "A côté de cette orientation claire, deux directions complémentaires de force quasi égale se manifestent cependant : le souhait d'échange avec les autres ainsi que le besoin de structure et de planification.",
      "Ces deux aspects sont en concurrence permanente. Selon la situation, davantage de coordination ou davantage de structure peut donc être visible.",
    ],
    leadership: "Dans le travail de management, cela se traduit par des décisions claires, combinées à une adaptation situationnelle entre dialogue et structure.",
  },
  BD_INT: {
    headline: "La collaboration marque le quotidien, sous pression davantage de structure ou des décisions plus rapides",
    body: [
      "Dans le travail quotidien, la collaboration et la coordination caractérisent avant tout la manière de travailler. Les entretiens, l'échange et un bon sens des personnes sont au premier plan.",
      "Dans le même temps, deux directions complémentaires de force quasi égale agissent en arrière-plan : le souhait de structure et de planification d'une part, et l'impulsion vers une décision rapide et une mise en oeuvre directe d'autre part.",
      "Ces deux tendances sont en concurrence permanente et peuvent être plus ou moins visibles selon la situation.",
    ],
    leadership: "Dans le travail de management, cela se traduit par un management orienté vers le dialogue avec une tension interne entre pilotage soigneux et mise en oeuvre rapide.",
  },
  BD_ANA: {
    headline: "La structure marque le quotidien, sous pression des décisions plus rapides ou davantage d'échange",
    body: [
      "Dans le travail quotidien, la structure, la planification et la clarté professionnelle caractérisent la manière de travailler. Les sujets sont examinés et préparés avec soin.",
      "Dans le même temps, deux directions complémentaires de force quasi égale agissent en arrière-plan : l'impulsion vers une mise en oeuvre rapide ainsi que le souhait d'échange et de coordination avec les autres.",
      "Ces deux directions sont en concurrence l'une avec l'autre et peuvent apparaître plus ou moins fortement selon la situation.",
    ],
    leadership: "Dans le travail de management, cela se traduit par des structures claires, combinées à une adaptation situationnelle entre décision et dialogue.",
  },
  BALANCED: {
    headline: "Profil équilibré",
    body: [
      "Dans ce profil, différentes approches sont de force similaire. Le poste n'est ainsi pas orienté unilatéralement, mais peut s'adapter de manière flexible à des exigences variées.",
      "Selon la situation, il est possible de passer de la mise en oeuvre à la collaboration et à l'analyse structurée. Quelle composante est la plus visible dépend souvent de la tâche, de l'environnement et de la situation de pression.",
      "Cette polyvalence fait en sorte que le poste est particulièrement efficace là où la flexibilité, la vue d'ensemble et une approche variable sont demandées.",
    ],
    leadership: "Dans le travail de management, cela se traduit par un pilotage adapté à la situation et la capacité de passer selon les besoins entre clarté, dialogue et mise en oeuvre.",
  },
};

const roleResultTextsIT: Record<ResultKey, RoleResultEntry> = {
    IMP_INT_ANA: {
      headline: "L'azione attiva caratterizza il quotidiano, sotto pressione maggiore scambio con gli altri",
      body: [
        "Nel lavoro quotidiano, questo ruolo e' caratterizzato soprattutto da uno stile lavorativo attivo e orientato alle decisioni. I temi vengono affrontati tempestivamente, le responsabilita' vengono assunte e le decisioni vengono prese in tempi relativamente rapidi. Il ruolo esprime dinamismo e capacita' di azione.",
        "Quando la pressione aumenta, lo scambio con gli altri acquista maggiore importanza. Conversazioni, coordinamento e il coinvolgimento di diverse prospettive aiutano a consolidare le decisioni e a sviluppare soluzioni insieme.",
        "Questa combinazione fa si che i temi non solo vengano messi in moto rapidamente, ma vengano anche sviluppati nel dialogo con gli altri. Le decisioni vengono cosi' sia condivise che attuate.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in decisioni chiare, responsabilita' visibile e una comunicazione aperta con l'ambiente.",
    },
    IMP_ANA_INT: {
      headline: "Decisioni e attuazione caratterizzano il quotidiano, sotto pressione maggiore struttura e controllo",
      body: [
        "Nel lavoro quotidiano, questo ruolo e' caratterizzato soprattutto dalla capacita' decisionale e dall'orientamento all'attuazione. I temi vengono affrontati attivamente, le responsabilita' assunte e le decisioni prese in tempi relativamente rapidi.",
        "Quando la pressione aumenta, cresce spesso il bisogno di struttura, pianificazione e controllo. I temi vengono esaminati piu' attentamente, i processi vengono meglio organizzati e le decisioni vengono maggiormente supportate dall'analisi.",
        "Questa combinazione fa si che le decisioni non vengano solo prese, ma anche attuate in modo strutturato. Il dinamismo viene completato dall'ordine.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in un chiaro orientamento agli obiettivi, una gestione strutturata e decisioni vincolanti.",
    },
    INT_IMP_ANA: {
      headline: "La collaborazione caratterizza il quotidiano, sotto pressione decisioni e azioni piu' rapide",
      body: [
        "Nel lavoro quotidiano, la collaborazione e lo scambio con gli altri sono al primo posto. Conversazioni, coordinamento e un buon senso delle situazioni caratterizzano lo stile lavorativo.",
        "Quando la pressione aumenta, le decisioni possono essere prese in modo piu' diretto e rapido per far avanzare i temi.",
        "Questa combinazione fa si che la collaborazione non passi solo attraverso le conversazioni, ma si traduca anche in passi concreti.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una comunicazione aperta, un'alta presenza nel team e la capacita' di far avanzare i temi insieme.",
    },
    INT_ANA_IMP: {
      headline: "La collaborazione caratterizza il quotidiano, sotto pressione maggiore struttura e chiarezza",
      body: [
        "Nel lavoro quotidiano, la collaborazione e il coordinamento caratterizzano soprattutto questo ruolo. Lo scambio, le conversazioni e un buon senso per le persone sono al centro.",
        "Quando la pressione aumenta, cresce spesso il bisogno di struttura, pianificazione e processi chiari. Le decisioni vengono maggiormente supportate dall'analisi e dall'organizzazione.",
        "Questa combinazione fa si che la collaborazione non funzioni solo attraverso le conversazioni, ma venga anche stabilizzata da strutture chiare.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una guida orientata al dialogo, decisioni comprensibili e un'organizzazione strutturata della collaborazione.",
    },
    ANA_IMP_INT: {
      headline: "Struttura e pianificazione caratterizzano il quotidiano, sotto pressione decisioni piu' rapide",
      body: [
        "Nel lavoro quotidiano, struttura, pianificazione e chiarezza tecnica caratterizzano soprattutto lo stile lavorativo. I temi vengono analizzati e preparati con cura prima che vengano prese le decisioni.",
        "Quando la pressione aumenta, le decisioni possono essere prese in modo piu' rapido e diretto per far avanzare i temi.",
        "Questa combinazione unisce una pianificazione accurata a una chiara capacita' di attuazione.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in strutture chiare, decisioni fondate e un'attuazione coerente.",
    },
    ANA_INT_IMP: {
      headline: "Struttura e pianificazione caratterizzano il quotidiano, sotto pressione maggiore scambio e coordinamento",
      body: [
        "Nel lavoro quotidiano, struttura, pianificazione e chiarezza tecnica sono al centro. I temi vengono preparati sistematicamente e riflettuti con cura.",
        "Quando la pressione aumenta, lo scambio con gli altri acquista maggiore importanza. Conversazioni e coordinamento aiutano a condividere le decisioni.",
        "Questa combinazione fa si che le decisioni vengano prese in modo sia ponderato che coordinato.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in strutture chiare, decisioni comprensibili e un coordinamento aperto nel team.",
    },
    IMP_INT__ANA: {
      headline: "Azione attiva e collaborazione caratterizzano il quotidiano, sotto pressione maggiore struttura",
      body: [
        "Nel lavoro quotidiano, l'orientamento all'azione e la collaborazione interagiscono in modo particolarmente stretto. I temi vengono portati avanti attivamente e allo stesso tempo coordinati con gli altri.",
        "Quando la pressione aumenta, cresce spesso il desiderio di maggiore struttura e orientamento per organizzare meglio i temi e consolidare le decisioni.",
        "Questa combinazione unisce il dinamismo al coordinamento comune e fa si che movimento e collaborazione siano possibili simultaneamente.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una comunicazione attiva, decisioni chiare e un'alta presenza nel team.",
    },
    IMP_ANA__INT: {
      headline: "Decisioni e struttura caratterizzano il quotidiano, sotto pressione maggiore scambio",
      body: [
        "Nel lavoro quotidiano, la capacita' decisionale e lo stile lavorativo strutturato si combinano in modo particolarmente stretto. I temi vengono portati avanti attivamente e allo stesso tempo pianificati con cura.",
        "Quando la pressione aumenta, lo scambio con gli altri acquista maggiore importanza. Le conversazioni aiutano a riflettere sulle decisioni e a includere diverse prospettive.",
        "Questa combinazione fa si che le decisioni vengano attuate in modo sia coerente che comprensibile.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in un chiaro orientamento, una gestione strutturata e un dialogo aperto.",
    },
    INT_IMP__ANA: {
      headline: "Collaborazione e attivita' caratterizzano il quotidiano, sotto pressione maggiore struttura",
      body: [
        "Nel lavoro quotidiano, collaborazione e attivita' interagiscono in modo particolarmente stretto. I temi vengono sviluppati nello scambio con gli altri e allo stesso tempo portati avanti attivamente.",
        "Quando la pressione aumenta, cresce spesso il bisogno di maggiore struttura e ordine per consolidare le decisioni.",
        "Questa combinazione unisce il dinamismo al coordinamento comune e fa si che la collaborazione rimanga operativa.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una comunicazione aperta, un'alta presenza nel team e decisioni chiare.",
    },
    INT_ANA__IMP: {
      headline: "Collaborazione e struttura caratterizzano il quotidiano, sotto pressione decisioni piu' rapide",
      body: [
        "Nel lavoro quotidiano, collaborazione e stile lavorativo strutturato si combinano in modo particolarmente stretto. Scambio e processi chiari caratterizzano il lavoro quotidiano.",
        "Quando la pressione aumenta, le decisioni possono essere prese in modo piu' diretto e rapido per far avanzare i temi.",
        "Questa combinazione fa si che la collaborazione venga supportata da strutture chiare e passi concreti.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una comunicazione aperta, una pianificazione strutturata e un chiaro orientamento per il team.",
    },
    ANA_IMP__INT: {
      headline: "Struttura e attuazione caratterizzano il quotidiano, sotto pressione maggiore scambio",
      body: [
        "Nel lavoro quotidiano, la capacita' decisionale e lo stile lavorativo strutturato si combinano in modo particolarmente stretto. I temi vengono portati avanti attivamente e allo stesso tempo pianificati con cura.",
        "Quando la pressione aumenta, lo scambio con gli altri acquista maggiore importanza. Le conversazioni aiutano a riflettere sulle decisioni e a includere diverse prospettive.",
        "Questa combinazione fa si che le decisioni vengano attuate in modo sia coerente che comprensibile.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in un chiaro orientamento, una gestione strutturata e un dialogo aperto.",
    },
    ANA_INT__IMP: {
      headline: "Struttura e collaborazione caratterizzano il quotidiano, sotto pressione decisioni piu' rapide",
      body: [
        "Nel lavoro quotidiano, collaborazione e stile lavorativo strutturato si combinano in modo particolarmente stretto. Scambio e processi chiari caratterizzano il lavoro quotidiano.",
        "Quando la pressione aumenta, le decisioni possono essere prese in modo piu' diretto e rapido per far avanzare i temi.",
        "Questa combinazione fa si che la collaborazione venga supportata da strutture chiare e passi concreti.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una comunicazione aperta, una pianificazione strutturata e un chiaro orientamento per il team.",
    },
    BD_IMP: {
      headline: "Decisioni rapide caratterizzano il quotidiano, sotto pressione maggiore scambio o struttura",
      body: [
        "Nel lavoro quotidiano, l'orientamento alla decisione e all'azione caratterizza soprattutto lo stile lavorativo. I temi vengono affrontati attivamente e portati avanti.",
        "Accanto a questo chiaro orientamento, agiscono tuttavia due direzioni complementari di forza quasi uguale: il desiderio di scambio con gli altri e il bisogno di struttura e pianificazione.",
        "Questi due aspetti sono in competizione permanente. A seconda della situazione, puo' essere piu' visibile una maggiore coordinazione o una maggiore struttura.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in decisioni chiare, combinate a un adattamento situazionale tra dialogo e struttura.",
    },
    BD_INT: {
      headline: "La collaborazione caratterizza il quotidiano, sotto pressione maggiore struttura o decisioni piu' rapide",
      body: [
        "Nel lavoro quotidiano, la collaborazione e il coordinamento caratterizzano soprattutto lo stile lavorativo. Conversazioni, scambio e un buon senso per le persone sono in primo piano.",
        "Allo stesso tempo, in secondo piano agiscono due direzioni complementari di forza quasi uguale: il desiderio di struttura e pianificazione da un lato, e l'impulso verso una decisione rapida e un'attuazione diretta dall'altro.",
        "Queste due tendenze sono in competizione permanente e possono essere piu' o meno visibili a seconda della situazione.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una guida orientata al dialogo con una tensione interna tra gestione attenta e attuazione rapida.",
    },
    BD_ANA: {
      headline: "La struttura caratterizza il quotidiano, sotto pressione decisioni piu' rapide o maggiore scambio",
      body: [
        "Nel lavoro quotidiano, struttura, pianificazione e chiarezza tecnica caratterizzano lo stile lavorativo. I temi vengono esaminati e preparati con cura.",
        "Allo stesso tempo, in secondo piano agiscono due direzioni complementari di forza quasi uguale: l'impulso verso un'attuazione rapida e il desiderio di scambio e coordinamento con gli altri.",
        "Queste due direzioni sono in competizione tra loro e possono emergere in modo piu' o meno forte a seconda della situazione.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in strutture chiare, combinate a un adattamento situazionale tra decisione e dialogo.",
    },
    BALANCED: {
      headline: "Profilo equilibrato",
      body: [
        "In questo profilo, diversi approcci sono di forza simile. Il ruolo non e' quindi orientato unilateralmente, ma puo' adattarsi in modo flessibile a requisiti diversi.",
        "A seconda della situazione, e' possibile passare tra attuazione, collaborazione e analisi strutturata. Quale aspetto risulti piu' visibile dipende spesso dal compito, dall'ambiente e dalla situazione di pressione.",
        "Questa ampiezza fa si che il ruolo sia particolarmente efficace dove sono richieste flessibilita', visione d'insieme e un approccio variabile.",
      ],
      leadership: "Nell'attivita' di leadership, cio' si manifesta in una gestione adattata alla situazione e nella capacita' di passare secondo le necessita' tra chiarezza, dialogo e attuazione.",
    },
  };

  const roleResultTextsEN: Record<ResultKey, RoleResultEntry> = {
  IMP_INT_ANA: {
    headline: "Active action shapes daily work \u2014 under pressure, more exchange with others",
    body: [
      "In daily work, this role is primarily shaped by an active and decision-oriented working style. Topics are picked up early, responsibility is taken on and decisions are made comparatively quickly. The role therefore has a dynamic, action-driven character.",
      "When pressure increases, exchange with others becomes more prominent. Conversations, coordination and involving different perspectives help to validate decisions and develop solutions together.",
      "This combination ensures that topics not only get moving quickly, but are also developed further in dialogue with others. Decisions are both supported and implemented.",
    ],
    leadership: "In leadership work this shows through clear decisions, visible responsibility and open communication with the environment.",
  },
  IMP_ANA_INT: {
    headline: "Decisions and execution shape daily work \u2014 under pressure, more structure and control",
    body: [
      "In daily work, this role is shaped primarily by decision-making strength and an execution-oriented approach. Topics are actively picked up, responsibility is taken on and decisions are made comparatively quickly.",
      "When pressure increases, the need for structure, planning and control often grows. Topics are examined more carefully, processes are organised more clearly and decisions are backed more strongly by analysis.",
      "This combination ensures that decisions are not only made but also structured and implemented. Dynamism is complemented by order.",
    ],
    leadership: "In leadership work this shows through clear goal orientation, structured steering and binding decisions.",
  },
  INT_IMP_ANA: {
    headline: "Collaboration shapes daily work \u2014 under pressure, faster decisions and action",
    body: [
      "In daily work, collaboration and exchange with others are central. Conversations, coordination and a good feel for situations shape the working style.",
      "When pressure increases, decisions can be made more directly and quickly. Topics are pushed forward more actively to bring momentum to situations.",
      "This combination ensures that collaboration does not only flow through conversations but is also translated into concrete steps.",
    ],
    leadership: "In leadership work this shows through open communication, high presence in the team and the ability to move topics forward together.",
  },
  INT_ANA_IMP: {
    headline: "Collaboration shapes daily work \u2014 under pressure, more structure and clarity",
    body: [
      "In daily work, collaboration and coordination primarily shape this role. Exchange, conversations and a good sense for people are central.",
      "When pressure increases, the need for structure, planning and clear processes often grows. Decisions are backed more strongly by analysis and order.",
      "This combination ensures that collaboration functions not only through conversations but is also stabilised by clear structures.",
    ],
    leadership: "In leadership work this shows through dialogue-oriented leadership, traceable decisions and structured organisation of collaboration.",
  },
  ANA_IMP_INT: {
    headline: "Structure and planning shape daily work \u2014 under pressure, faster decisions",
    body: [
      "In daily work, structure, planning and professional clarity shape the working style. Topics are carefully analysed and prepared before decisions are made.",
      "When pressure increases, decisions can be made faster and more directly to move topics forward.",
      "This combination connects careful planning with clear execution strength.",
    ],
    leadership: "In leadership work this shows through clear structures, factual decisions and consistent implementation.",
  },
  ANA_INT_IMP: {
    headline: "Structure and planning shape daily work \u2014 under pressure, more exchange and coordination",
    body: [
      "In daily work, structure, planning and professional clarity are central. Topics are systematically prepared and carefully thought through.",
      "When pressure increases, exchange with others gains greater importance. Conversations and coordination help to carry decisions together.",
      "This combination ensures that decisions are made both thoughtfully and in coordination.",
    ],
    leadership: "In leadership work this shows through clear structures, traceable decisions and open coordination within the team.",
  },
  IMP_INT__ANA: {
    headline: "Active action and collaboration shape daily work \u2014 under pressure, more structure",
    body: [
      "In daily work, action orientation and collaboration work particularly closely together. Topics are actively pushed forward and simultaneously coordinated in exchange with others.",
      "When pressure increases, the desire for more structure and orientation often grows, to organise topics more clearly and to validate decisions.",
      "This combination connects dynamism with joint coordination and ensures that movement and collaboration are possible simultaneously.",
    ],
    leadership: "In leadership work this shows through active communication, clear decisions and high presence in the team.",
  },
  IMP_ANA__INT: {
    headline: "Decisions and structure shape daily work \u2014 under pressure, more exchange",
    body: [
      "In daily work, decision-making strength and a structured working style are particularly closely combined. Topics are actively pushed forward and simultaneously carefully planned.",
      "When pressure increases, exchange with others gains greater importance. Conversations help to reflect on decisions and include different perspectives.",
      "This combination ensures that decisions are implemented both consistently and traceably.",
    ],
    leadership: "In leadership work this shows through clear orientation, structured steering and open dialogue.",
  },
  INT_IMP__ANA: {
    headline: "Collaboration and activity shape daily work \u2014 under pressure, more structure",
    body: [
      "In daily work, collaboration and activity work particularly closely together. Topics are developed in exchange with others and simultaneously actively moved forward.",
      "When pressure increases, the need for more structure and order often grows, to validate decisions.",
      "This combination connects dynamism with joint coordination and ensures that collaboration remains capable of action.",
    ],
    leadership: "In leadership work this shows through open communication, high presence in the team and clear decisions.",
  },
  INT_ANA__IMP: {
    headline: "Collaboration and structure shape daily work \u2014 under pressure, faster decisions",
    body: [
      "In daily work, collaboration and a structured working style are particularly closely combined. Exchange and clear processes shape the daily work.",
      "When pressure increases, decisions can be made more directly and quickly to move topics forward.",
      "This combination ensures that collaboration is supported by clear structures and concrete steps.",
    ],
    leadership: "In leadership work this shows through open communication, structured planning and clear orientation for the team.",
  },
  ANA_IMP__INT: {
    headline: "Structure and execution shape daily work \u2014 under pressure, more exchange",
    body: [
      "In daily work, decision-making strength and a structured working style are particularly closely combined. Topics are actively pushed forward and simultaneously carefully planned.",
      "When pressure increases, exchange with others gains greater importance. Conversations help to reflect on decisions and include different perspectives.",
      "This combination ensures that decisions are implemented both consistently and traceably.",
    ],
    leadership: "In leadership work this shows through clear orientation, structured steering and open dialogue.",
  },
  ANA_INT__IMP: {
    headline: "Structure and collaboration shape daily work \u2014 under pressure, faster decisions",
    body: [
      "In daily work, collaboration and a structured working style are particularly closely combined. Exchange and clear processes shape the daily work.",
      "When pressure increases, decisions can be made more directly and quickly to move topics forward.",
      "This combination ensures that collaboration is supported by clear structures and concrete steps.",
    ],
    leadership: "In leadership work this shows through open communication, structured planning and clear orientation for the team.",
  },
  BD_IMP: {
    headline: "Fast decisions shape daily work \u2014 under pressure, more exchange or structure",
    body: [
      "In daily work, decision and action orientation primarily shape the working style. Topics are actively picked up and pushed forward.",
      "Alongside this clear direction, two nearly equally strong complementary tendencies also operate: the desire for exchange with others, and the need for structure and planning.",
      "These two sides continuously compete with each other. Depending on the situation, either more coordination or more structure may become visible.",
    ],
    leadership: "In leadership work this shows through clear decisions, combined with situational adaptation between dialogue and structure.",
  },
  BD_INT: {
    headline: "Collaboration shapes daily work \u2014 under pressure, more structure or faster decisions",
    body: [
      "In daily work, collaboration and coordination primarily shape the working style. Conversations, exchange and a good sense for people are central.",
      "At the same time, two nearly equally strong complementary tendencies operate in the background: the desire for structure and planning on one hand, and the impulse toward quick decisions and direct execution on the other.",
      "These two tendencies continuously compete with each other and may become visible in different degrees depending on the situation.",
    ],
    leadership: "In leadership work this shows through dialogue-oriented leadership with an inner tension between careful steering and swift execution.",
  },
  BD_ANA: {
    headline: "Structure shapes daily work \u2014 under pressure, faster decisions or more exchange",
    body: [
      "In daily work, structure, planning and professional clarity shape the working style. Topics are carefully reviewed and prepared.",
      "At the same time, two nearly equally strong complementary tendencies operate in the background: the impulse toward quick execution, and the desire for exchange and coordination with others.",
      "These two directions compete with each other and may appear with varying intensity depending on the situation.",
    ],
    leadership: "In leadership work this shows through clear structures, combined with situational adaptation between decision and dialogue.",
  },
  BALANCED: {
    headline: "Balanced profile",
    body: [
      "In this profile, different approaches are similarly strong. The role is therefore not one-sided, but can adapt flexibly to different requirements.",
      "Depending on the situation, it is possible to switch between execution, collaboration and structured analysis. Which side becomes more visible often depends on the task, environment and pressure situation.",
      "This breadth ensures that the role is particularly effective where flexibility, overview and a variable approach are required.",
    ],
    leadership: "In leadership work this shows through situation-dependent steering and the ability to switch between clarity, dialogue and execution as needed.",
  },
};

function getRoleResultEntry(key: ResultKey, region: string): RoleResultEntry {
  if (region === "EN") return roleResultTextsEN[key];
  if (region === "FR") return roleResultTextsFR[key];
  if (region === "IT") return roleResultTextsIT[key];
  return roleResultTexts[key];
}

function generateBioCheckText(bg: BioGram, isLeadership: boolean, region?: string, _fuehrungsBg?: BioGram): string {
  const key = getRoleResultKey(bg.imp, bg.int, bg.ana);
  const t = getRoleResultEntry(key, region ?? "DE");
  let text = `${t.headline}\n${t.body.join("\n")}`;
  if (isLeadership) text += `\n${t.leadership}`;
  return text;
}

const ERFOLGSFOKUS_LABELS = [
  "Ergebnisse und\nZielerreichung",
  "Zusammenarbeit\nund Netzwerk",
  "Innovation und\nVeränderung",
  "Prozesse und\nEffizienz",
  "Fachliche Qualität\nund Expertise",
  "Kommunikation\nund Einfluss",
];

const ERFOLGSFOKUS_DISPLAY = [
  { label: "Ergebnisse und Zielerreichung", desc: "Erfolg zeigt sich in konkreten Ergebnissen, Zielerreichung und messbarer Leistung." },
  { label: "Zusammenarbeit und Netzwerk", desc: "Erfolg entsteht durch stabile Beziehungen, gute Abstimmung und ein funktionierendes Miteinander." },
  { label: "Innovation und Veränderung", desc: "Erfolg entsteht durch neue Ideen, mutige Ansätze und die aktive Umsetzung von Veränderungen." },
  { label: "Prozesse und Effizienz", desc: "Erfolg wird über klare Abläufe, Struktur und ein systematisches Vorgehen erreicht." },
  { label: "Fachliche Qualität und Expertise", desc: "Erfolg basiert auf präziser Arbeit, fachlicher Tiefe und hoher Genauigkeit." },
  { label: "Kommunikation und Einfluss", desc: "Erfolg zeigt sich darin, Menschen zu erreichen, zu überzeugen und gemeinsame Lösungen voranzubringen." },
];

type DescOption = { value: string; label: string; desc: string };

const AUFGABENCHARAKTER_OPTIONS: DescOption[] = [
  { value: "überwiegend operativ", label: "Praktische Umsetzung im Tagesgeschäft", desc: "Der Schwerpunkt liegt auf direkter Umsetzung und schneller Bearbeitung von Aufgaben im operativen Alltag. Ergebnisse entstehen vor allem durch aktives Handeln." },
  { value: "überwiegend systemisch", label: "Abstimmung und Umsetzung im Arbeitsablauf", desc: "Der Fokus liegt auf Abstimmung, Koordination und einem funktionierenden Zusammenspiel im Alltag. Aufgaben werden im Austausch geplant und gemeinsam vorangebracht." },
  { value: "überwiegend strategisch", label: "Analyse, Planung und strategische Steuerung", desc: "Der Schwerpunkt liegt auf strukturierter Planung, fundierter Analyse und klarer Bewertung. Entscheidungen werden vorbereitet und systematisch gesteuert." },
  { value: "Gemischt", label: "Ausgewogene Mischung", desc: "Die Stelle verbindet operative Umsetzung, Analyse und Abstimmung." },
];

const ARBEITSLOGIK_OPTIONS: DescOption[] = [
  { value: "Umsetzungsorientiert", label: "Umsetzung und Ergebnisse", desc: "Der Fokus liegt auf direkter Umsetzung und sichtbaren Ergebnissen. Aufgaben werden zügig angegangen und konsequent zu Ende gebracht." },
  { value: "Daten-/prozessorientiert", label: "Analyse und Struktur", desc: "Der Schwerpunkt liegt auf durchdachter Planung, klarer Struktur und einem systematischen Vorgehen. Entscheidungen entstehen auf Basis von Daten und Bewertung." },
  { value: "Menschenorientiert", label: "Zusammenarbeit und Kommunikation", desc: "Im Mittelpunkt stehen Abstimmung, Austausch und ein funktionierendes Miteinander. Ergebnisse entstehen durch gute Zusammenarbeit und klare Kommunikation." },
  { value: "Ausgewogen", label: "Ausgewogene Mischung", desc: "Keine Arbeitsweise steht klar im Vordergrund." },
];

const FUEHRUNG_OPTIONS: DescOption[] = [
  { value: "Keine", label: "Keine Führungsverantwortung", desc: "Die Stelle arbeitet ohne Verantwortung für andere Personen und ist auf die eigene Aufgabenbearbeitung fokussiert." },
  { value: "Projekt-/Teamkoordination", label: "Projekt- oder Teamkoordination", desc: "Die Stelle koordiniert Aufgaben, Abläufe oder Projekte und sorgt für Abstimmung im Team – ohne direkte Personalverantwortung." },
  { value: "Fachliche Führung", label: "Fachliche Führung", desc: "Die Stelle steuert Inhalte, gibt fachliche Orientierung vor und stellt die Qualität der Arbeit im Team sicher." },
  { value: "Disziplinarische Führung mit Ergebnisverantwortung", label: "Führung mit Personalverantwortung", desc: "Die Stelle führt Mitarbeitende, trägt Verantwortung für Ergebnisse und entwickelt das Team gezielt weiter." },
];

const SECTION_SUBTITLES: Record<string, string> = {
  aufgabencharakter: "Welche Art von Aufgaben prägt diese Stelle hauptsächlich?",
  arbeitslogik: "Was prägt die tägliche Arbeit dieser Stelle am stärksten?",
  erfolgsfokus: "Woran wird der Erfolg dieser Stelle hauptsächlich gemessen?",
  fuehrung: "Welche Führungsrolle gehört zu dieser Stelle?",
};

const SECTION_SUBTITLES_EN: Record<string, string> = {
  aufgabencharakter: "What kind of tasks mainly characterise this role?",
  arbeitslogik: "What shapes the daily work of this role most?",
  erfolgsfokus: "How is the success of this role mainly measured?",
  fuehrung: "What leadership role belongs to this position?",
};

const ERFOLGSFOKUS_DISPLAY_EN = [
  { label: "Results and goal achievement", desc: "Success shows in concrete results, goal achievement and measurable performance." },
  { label: "Collaboration and network", desc: "Success arises from stable relationships, good coordination and a working partnership." },
  { label: "Innovation and change", desc: "Success arises through new ideas, bold approaches and the active implementation of change." },
  { label: "Processes and efficiency", desc: "Success is achieved via clear workflows, structure and a systematic approach." },
  { label: "Technical quality and expertise", desc: "Success is based on precise work, technical depth and high accuracy." },
  { label: "Communication and influence", desc: "Success shows in reaching, convincing people and advancing shared solutions." },
];

const AUFGABENCHARAKTER_OPTIONS_EN: DescOption[] = [
  { value: "überwiegend operativ", label: "Practical execution in day-to-day work", desc: "The focus is on direct execution and rapid handling of tasks in operational daily work. Results arise primarily through active doing." },
  { value: "überwiegend systemisch", label: "Coordination and execution within workflows", desc: "The focus is on coordination, alignment and a working interplay in daily work. Tasks are planned in dialogue and advanced together." },
  { value: "überwiegend strategisch", label: "Analysis, planning and strategic steering", desc: "The focus is on structured planning, well-founded analysis and clear evaluation. Decisions are prepared and systematically steered." },
  { value: "Gemischt", label: "Balanced mix", desc: "The role combines operational execution, analysis and coordination." },
];

const ARBEITSLOGIK_OPTIONS_EN: DescOption[] = [
  { value: "Umsetzungsorientiert", label: "Execution and results", desc: "The focus is on direct execution and visible results. Tasks are tackled quickly and consistently brought to completion." },
  { value: "Daten-/prozessorientiert", label: "Analysis and structure", desc: "The focus is on thorough planning, clear structure and a systematic approach. Decisions emerge based on data and evaluation." },
  { value: "Menschenorientiert", label: "Collaboration and communication", desc: "Coordination, exchange and a working partnership are central. Results arise through good collaboration and clear communication." },
  { value: "Ausgewogen", label: "Balanced mix", desc: "No working style clearly dominates." },
];

const FUEHRUNG_OPTIONS_EN: DescOption[] = [
  { value: "Keine", label: "No leadership responsibility", desc: "The role works without responsibility for other people and is focused on its own task delivery." },
  { value: "Projekt-/Teamkoordination", label: "Project or team coordination", desc: "The role coordinates tasks, processes or projects and ensures alignment within the team — without direct personnel responsibility." },
  { value: "Fachliche Führung", label: "Technical leadership", desc: "The role steers content, provides technical orientation and ensures the quality of the work within the team." },
  { value: "Disziplinarische Führung mit Ergebnisverantwortung", label: "Leadership with personnel responsibility", desc: "The role leads employees, carries responsibility for results and develops the team in a targeted way." },
];

const SECTION_SUBTITLES_FR: Record<string, string> = {
  aufgabencharakter: "Quel type de tâches caractérise principalement ce poste ?",
  arbeitslogik: "Qu'est-ce qui marque le plus le travail quotidien de ce poste ?",
  erfolgsfokus: "Sur quoi repose principalement le succès de ce poste ?",
  fuehrung: "Quel rôle de management est associé à ce poste ?",
};

const ERFOLGSFOKUS_DISPLAY_FR = [
  { label: "Résultats et atteinte des objectifs", desc: "Le succès se manifeste dans des résultats concrets, l'atteinte des objectifs et une performance mesurable." },
  { label: "Collaboration et réseau", desc: "Le succès naît de relations stables, d'une bonne coordination et d'une collaboration efficace." },
  { label: "Innovation et changement", desc: "Le succès naît de nouvelles idées, d'approches audacieuses et d'une mise en oeuvre active du changement." },
  { label: "Processus et efficacité", desc: "Le succès passe par des processus clairs, une structure et une approche systématique." },
  { label: "Qualité professionnelle et expertise", desc: "Le succès repose sur un travail précis, une profondeur technique et une grande rigueur." },
  { label: "Communication et influence", desc: "Le succès se manifeste dans la capacité à atteindre les personnes, à les convaincre et à faire avancer des solutions communes." },
];

const AUFGABENCHARAKTER_OPTIONS_FR: DescOption[] = [
  { value: "überwiegend operativ", label: "Mise en oeuvre pratique au quotidien", desc: "L'accent est mis sur l'exécution directe et le traitement rapide des tâches dans le travail opérationnel quotidien. Les résultats découlent avant tout d'une action concrète." },
  { value: "überwiegend systemisch", label: "Coordination et mise en oeuvre dans les processus", desc: "L'accent est mis sur la coordination, la concertation et une collaboration fluide au quotidien. Les tâches sont planifiées en échange et avancées conjointement." },
  { value: "überwiegend strategisch", label: "Analyse, planification et pilotage stratégique", desc: "L'accent est mis sur la planification structurée, l'analyse approfondie et une évaluation claire. Les décisions sont préparées et pilotées de manière systématique." },
  { value: "Gemischt", label: "Combinaison équilibrée", desc: "Le poste associe mise en oeuvre opérationnelle, analyse et coordination." },
];

const ARBEITSLOGIK_OPTIONS_FR: DescOption[] = [
  { value: "Umsetzungsorientiert", label: "Mise en oeuvre et résultats", desc: "L'accent est mis sur l'exécution directe et les résultats visibles. Les tâches sont abordées rapidement et menées à terme de manière cohérente." },
  { value: "Daten-/prozessorientiert", label: "Analyse et structure", desc: "L'accent est mis sur une planification réfléchie, une structure claire et une approche systématique. Les décisions reposent sur des données et une évaluation." },
  { value: "Menschenorientiert", label: "Collaboration et communication", desc: "La coordination, les échanges et une collaboration fonctionnelle sont au centre. Les résultats découlent d'une bonne collaboration et d'une communication claire." },
  { value: "Ausgewogen", label: "Combinaison équilibrée", desc: "Aucun style de travail ne se démarque clairement." },
];

const FUEHRUNG_OPTIONS_FR: DescOption[] = [
  { value: "Keine", label: "Aucune responsabilité de management", desc: "Le poste travaille sans responsabilité envers d'autres personnes et se concentre sur ses propres tâches." },
  { value: "Projekt-/Teamkoordination", label: "Coordination de projet ou d'équipe", desc: "Le poste coordonne les tâches, les processus ou les projets et assure la concertation dans l'équipe, sans responsabilité directe du personnel." },
  { value: "Fachliche Führung", label: "Management technique", desc: "Le poste pilote les contenus, donne une orientation professionnelle et garantit la qualité du travail dans l'équipe." },
  { value: "Disziplinarische Führung mit Ergebnisverantwortung", label: "Management avec responsabilité du personnel", desc: "Le poste dirige des collaborateurs, porte la responsabilité des résultats et développe l'équipe de manière ciblée." },
];


  const SECTION_SUBTITLES_IT: Record<string, string> = {
    aufgabencharakter: "Che tipo di compiti caratterizza principalmente questo ruolo?",
    arbeitslogik: "Cosa influenza maggiormente il lavoro quotidiano di questo ruolo?",
    erfolgsfokus: "In base a cosa viene misurato principalmente il successo di questo ruolo?",
    fuehrung: "Quale ruolo di leadership appartiene a questa posizione?",
  };

  const ERFOLGSFOKUS_DISPLAY_IT = [
    { label: "Risultati e raggiungimento degli obiettivi", desc: "Il successo si manifesta in risultati concreti, nel raggiungimento degli obiettivi e in performance misurabili." },
    { label: "Collaborazione e reti", desc: "Il successo nasce da relazioni stabili, buona coordinazione e una partnership funzionante." },
    { label: "Innovazione e cambiamento", desc: "Il successo deriva da idee nuove, approcci audaci e dall'implementazione attiva del cambiamento." },
    { label: "Processi ed efficienza", desc: "Il successo si raggiunge attraverso processi chiari, struttura e un approccio sistematico." },
    { label: "Qualita' tecnica ed expertise", desc: "Il successo si basa su un lavoro preciso, profondita' tecnica e alta accuratezza." },
    { label: "Comunicazione e influenza", desc: "Il successo si manifesta nel raggiungere le persone, convincerle e promuovere soluzioni comuni." },
  ];

  const AUFGABENCHARAKTER_OPTIONS_IT: DescOption[] = [
    { value: "überwiegend operativ", label: "Attuazione pratica nell'operativita' quotidiana", desc: "Il focus e' sull'esecuzione diretta e sulla gestione rapida dei compiti nel lavoro operativo quotidiano. I risultati nascono soprattutto dall'azione concreta." },
    { value: "überwiegend systemisch", label: "Coordinamento e attuazione nei processi di lavoro", desc: "Il focus e' sul coordinamento, la concertazione e un'interazione funzionante nel quotidiano. I compiti vengono pianificati in modo collaborativo e portati avanti insieme." },
    { value: "überwiegend strategisch", label: "Analisi, pianificazione e gestione strategica", desc: "Il focus e' sulla pianificazione strutturata, l'analisi approfondita e la valutazione chiara. Le decisioni vengono preparate e gestite sistematicamente." },
    { value: "Gemischt", label: "Mix equilibrato", desc: "Il ruolo combina attuazione operativa, analisi e coordinamento." },
  ];

  const ARBEITSLOGIK_OPTIONS_IT: DescOption[] = [
    { value: "Umsetzungsorientiert", label: "Attuazione e risultati", desc: "Il focus e' sull'esecuzione diretta e sui risultati visibili. I compiti vengono affrontati rapidamente e portati a termine con coerenza." },
    { value: "Daten-/prozessorientiert", label: "Analisi e struttura", desc: "Il focus e' su una pianificazione accurata, una struttura chiara e un approccio sistematico. Le decisioni nascono sulla base di dati e valutazioni." },
    { value: "Menschenorientiert", label: "Collaborazione e comunicazione", desc: "Al centro ci sono il coordinamento, lo scambio e una partnership funzionante. I risultati nascono da una buona collaborazione e da una comunicazione chiara." },
    { value: "Ausgewogen", label: "Mix equilibrato", desc: "Nessuno stile lavorativo prevale chiaramente." },
  ];

  const FUEHRUNG_OPTIONS_IT: DescOption[] = [
    { value: "Keine", label: "Nessuna responsabilita' di management", desc: "Il ruolo opera senza responsabilita' verso altre persone ed e' focalizzato sulla propria gestione dei compiti." },
    { value: "Projekt-/Teamkoordination", label: "Coordinamento di progetto o team", desc: "Il ruolo coordina compiti, processi o progetti e garantisce l'allineamento nel team, senza responsabilita' diretta sul personale." },
    { value: "Fachliche Führung", label: "Leadership tecnica", desc: "Il ruolo gestisce i contenuti, fornisce orientamento tecnico e garantisce la qualita' del lavoro nel team." },
    { value: "Disziplinarische Führung mit Ergebnisverantwortung", label: "Leadership con responsabilita' sul personale", desc: "Il ruolo guida i collaboratori, porta la responsabilita' dei risultati e sviluppa il team in modo mirato." },
  ];
  
function getRegionOptions(region: string) {
  const isEn = region === "EN";
  const isFr = region === "FR";
  const isIt = region === "IT";
  return {
    aufgaben: isEn ? AUFGABENCHARAKTER_OPTIONS_EN : isFr ? AUFGABENCHARAKTER_OPTIONS_FR : isIt ? AUFGABENCHARAKTER_OPTIONS_IT : AUFGABENCHARAKTER_OPTIONS,
    arbeit: isEn ? ARBEITSLOGIK_OPTIONS_EN : isFr ? ARBEITSLOGIK_OPTIONS_FR : isIt ? ARBEITSLOGIK_OPTIONS_IT : ARBEITSLOGIK_OPTIONS,
    fuehrung: isEn ? FUEHRUNG_OPTIONS_EN : isFr ? FUEHRUNG_OPTIONS_FR : isIt ? FUEHRUNG_OPTIONS_IT : FUEHRUNG_OPTIONS,
    erfolg: isEn ? ERFOLGSFOKUS_DISPLAY_EN : isFr ? ERFOLGSFOKUS_DISPLAY_FR : isIt ? ERFOLGSFOKUS_DISPLAY_IT : ERFOLGSFOKUS_DISPLAY,
    subtitles: isEn ? SECTION_SUBTITLES_EN : isFr ? SECTION_SUBTITLES_FR : isIt ? SECTION_SUBTITLES_IT : SECTION_SUBTITLES,
  };
}

function Header({ onSave, onLoad }: { onSave: () => void; onLoad: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-rollen-dna">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <img src={logoSrc} alt="bioLogic Logo" className="h-20 w-auto" data-testid="logo-rollen-dna" />
        <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">RoleDynamics</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-laden" onClick={onLoad}>
          <FolderOpen className="w-3.5 h-3.5" />
          Laden
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-speichern" onClick={onSave}>
          <Save className="w-3.5 h-3.5" />
          Speichern
        </Button>
      </div>
    </header>
  );
}

function StepProgress({ currentStep, completedSteps }: { currentStep: number; completedSteps: number[] }) {
  const steps = [
    { num: 1, label: "Rolle auswählen" },
    { num: 2, label: "Rahmenbedingungen" },
    { num: 3, label: "Tätigkeiten" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-lg mx-auto" data-testid="step-progress">
      {steps.map((step, idx) => {
        const isDone = completedSteps.includes(step.num);
        const isCurrent = step.num === currentStep;
        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                isDone
                  ? "bg-green-500 text-white"
                  : isCurrent
                    ? "bg-green-500 text-white shadow-md shadow-green-500/25"
                    : "bg-green-50 dark:bg-green-900/20 text-green-300 dark:text-green-400/50"
              }`} data-testid={`step-num-${step.num}`}>
                {isDone ? <Check className="w-4 h-4" strokeWidth={2.5} /> : step.num}
              </span>
              <span className={`text-xs transition-colors duration-300 whitespace-nowrap ${
                isDone
                  ? "font-medium text-green-600 dark:text-green-400"
                  : isCurrent
                    ? "font-semibold text-green-700 dark:text-green-400"
                    : "text-green-300/60 dark:text-green-400/40"
              }`} data-testid={`step-label-${step.num}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 mt-[-18px] rounded-full overflow-hidden bg-muted/30">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  isDone ? "bg-green-400 w-full" : "bg-transparent w-0"
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CollapsedStep({
  step,
  title,
  summary,
  onEdit,
  icon: Icon,
}: {
  step: number;
  title: string;
  summary: string;
  onEdit: () => void;
  icon?: React.ComponentType<{ style?: React.CSSProperties; strokeWidth?: number }>;
}) {
  const { region } = useRegion();
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/40 dark:bg-card/40 backdrop-blur-sm border border-card-border cursor-pointer hover:bg-white/60 dark:hover:bg-card/50 transition-all duration-200"
      onClick={onEdit}
      data-testid={`collapsed-step-${step}`}
    >
      <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
        {Icon ? <Icon style={{ width: 16, height: 16, color: "#FFF" }} strokeWidth={2.2} /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
      </span>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 14, color: "#48484A", margin: 0 }} className="truncate">{summary}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 13, fontWeight: 500, color: "#0071E3",
          background: "transparent", border: "none", cursor: "pointer",
          padding: "4px 8px", borderRadius: 8, flexShrink: 0,
          transition: "background 200ms ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.06)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        data-testid={`button-edit-step-${step}`}
      >
        <Pencil style={{ width: 13, height: 13 }} />
        {region === "IT" ? "Modifica" : region === "FR" ? "Modifier" : region === "EN" ? "Edit" : "Bearbeiten"}
      </button>
      <ChevronDown className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
    </div>
  );
}

function LockedStep({ step, title }: { step: number; title: string }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl bg-muted/20 dark:bg-muted/10 border border-border/20 opacity-50"
      style={{ position: "relative", zIndex: 1 }}
      data-testid={`locked-step-${step}`}
    >
      <span className="w-8 h-8 rounded-full bg-muted/50 dark:bg-muted/30 text-muted-foreground/40 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
        {step}
      </span>
      <p className="text-sm font-medium text-muted-foreground/40">{title}</p>
    </div>
  );
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

function SectionDivider() {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 48, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "40%", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
    </div>
  );
}

function PillGroup({
  options,
  selected,
  onSelect,
  multi = false,
  max,
  wrap = false,
  columns,
}: {
  options: string[];
  selected: string[];
  onSelect: (val: string) => void;
  multi?: boolean;
  max?: number;
  wrap?: boolean;
  columns?: number;
}) {
  return (
    <div className={columns ? "" : `flex ${wrap ? "flex-col gap-3" : "items-stretch gap-2"} p-1.5`}
      style={columns ? { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10, padding: 6 } : undefined}
    >
      {options.map((opt, idx) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={`${opt}-${idx}`}
            onClick={() => onSelect(opt)}
            className={`${wrap ? "" : "flex-1"} rounded-full font-medium select-none ${wrap ? "text-left" : "text-center"} min-w-0`}
            style={{
              minHeight: 48,
              paddingLeft: wrap ? 20 : 16,
              paddingRight: wrap ? 20 : 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: wrap ? 14 : 15,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
              fontWeight: 500,
              border: isSelected ? "2px solid transparent" : "2px solid rgba(0,0,0,0.10)",
              cursor: "pointer",
              transition: "background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
              background: isSelected ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#6E6E73",
              boxShadow: isSelected ? "0 4px 12px rgba(0,113,227,0.25)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`pill-${opt.toLowerCase().replace(/[\s\/-]+/g, "-")}-${idx}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PillGroupIndexed({
  options,
  selectedIndices,
  onSelectIndex,
  indexOffset = 0,
}: {
  options: string[];
  selectedIndices: number[];
  onSelectIndex: (globalIdx: number) => void;
  indexOffset?: number;
}) {
  return (
    <div className="flex items-stretch gap-2 p-1.5">
      {options.map((opt, idx) => {
        const globalIdx = indexOffset + idx;
        const isSelected = selectedIndices.includes(globalIdx);
        return (
          <button
            key={`${opt}-${globalIdx}`}
            onClick={() => onSelectIndex(globalIdx)}
            className="flex-1 rounded-full font-medium select-none text-center min-w-0"
            style={{
              minHeight: 48,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 15,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
              fontWeight: 500,
              border: isSelected ? "2px solid transparent" : "2px solid rgba(0,0,0,0.10)",
              cursor: "pointer",
              transition: "background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
              background: isSelected ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#6E6E73",
              boxShadow: isSelected ? "0 4px 12px rgba(0,113,227,0.25)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`pill-erfolgsfokus-${globalIdx}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function DescriptiveOptionGroup({
  options,
  selectedValue,
  onSelect,
  accentColor = "#0071E3",
}: {
  options: DescOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  accentColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
      {options.map((opt, idx) => {
        const isSelected = selectedValue === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              padding: "14px 18px",
              borderRadius: 14,
              border: isSelected ? "2px solid rgba(0,0,0,0.35)" : "2px solid rgba(0,0,0,0.08)",
              background: isSelected ? "rgba(0,0,0,0.03)" : "transparent",
              cursor: "pointer",
              transition: "background 180ms ease, border-color 180ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.03)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`option-${opt.value.toLowerCase().replace(/[\s\/-]+/g, "-")}-${idx}`}
          >
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1D1D1F",
              lineHeight: 1.3,
            }}>{opt.label}</span>
            <span style={{
              fontSize: 13,
              color: "#6E6E73",
              lineHeight: 1.5,
              marginTop: 3,
            }}>{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function DescriptiveOptionGroupIndexed({
  options,
  selectedIndices,
  onSelectIndex,
  accentColor = "#0071E3",
}: {
  options: { label: string; desc: string }[];
  selectedIndices: number[];
  onSelectIndex: (idx: number) => void;
  accentColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
      {options.map((opt, idx) => {
        const isSelected = selectedIndices.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => onSelectIndex(idx)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              padding: "14px 18px",
              borderRadius: 14,
              border: isSelected ? "2px solid rgba(0,0,0,0.35)" : "2px solid rgba(0,0,0,0.08)",
              background: isSelected ? "rgba(0,0,0,0.03)" : "transparent",
              cursor: "pointer",
              transition: "background 180ms ease, border-color 180ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.03)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`option-erfolgsfokus-${idx}`}
          >
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1D1D1F",
              lineHeight: 1.3,
            }}>{opt.label}</span>
            <span style={{
              fontSize: 13,
              color: "#6E6E73",
              lineHeight: 1.5,
              marginTop: 3,
            }}>{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function SectionNumber({ num, isComplete }: { num: number; isComplete: boolean }) {
  return (
    <div style={{
      position: "absolute",
      top: -8,
      right: 8,
      fontSize: 64,
      fontWeight: 800,
      lineHeight: 1,
      pointerEvents: "none",
      userSelect: "none",
      transition: "color 500ms ease",
      color: isComplete ? "rgba(52,199,89,0.08)" : "rgba(0,0,0,0.03)",
    }}>
      {num}
    </div>
  );
}

function MiniProgressBar({ filled, total, region }: { filled: number; total: number; region?: string }) {
  const pct = (filled / total) * 100;
  const ofWord = region === "EN" ? "of" : region === "IT" ? "di" : region === "FR" ? "sur" : "von";
  return (
    <div data-testid="mini-progress" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
      <div style={{
        flex: 1,
        height: 3,
        borderRadius: 2,
        background: "rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 2,
          background: "linear-gradient(90deg, #34C759, #30D158)",
          transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#6E6E73", whiteSpace: "nowrap" }}>
        {filled} {ofWord} {total}
      </span>
    </div>
  );
}

function SummaryBar({ beruf, fuehrung, erfolgsfokusIndices, aufgabencharakter, arbeitslogik, region }: {
  beruf: string;
  fuehrung: string;
  erfolgsfokusIndices: number[];
  aufgabencharakter: string;
  arbeitslogik: string;
  region: string;
}) {
  const localizeText = (text: string) => localizeStr(text, region as any);
  const isEN = region === "EN";
  const isIT = region === "IT";
  const isFR = region === "FR";
  const _ro = getRegionOptions(region);
  const arbeitsOpt = _ro.arbeit.find(o => o.value === arbeitslogik);
  const fuehrungOpt = _ro.fuehrung.find(o => o.value === fuehrung);
  const fokusLabels = erfolgsfokusIndices.map(i => _ro.erfolg[i]?.label).filter(Boolean);
  const rollenName = beruf || (isEN ? "this role" : isIT ? "questo ruolo" : isFR ? "ce poste" : "diese Stelle");

  const aufgabenSatz: Record<string, string> = isEN ? {
    "überwiegend operativ": `combines practical work with direct execution in day-to-day business`,
    "überwiegend systemisch": `combines practical work with structured planning and steering`,
    "überwiegend strategisch": `is shaped by analysis, planning and strategic decisions`,
    "Gemischt": `combines practical work with analysis and coordination within the team`,
  } : isIT ? {
    "überwiegend operativ": `unisce lavoro pratico ed esecuzione diretta nel business quotidiano`,
    "überwiegend systemisch": `unisce lavoro pratico a pianificazione strutturata e gestione`,
    "überwiegend strategisch": `e' caratterizzato da analisi, pianificazione e decisioni strategiche`,
    "Gemischt": `unisce lavoro pratico, analisi e coordinamento nel team`,
  } : isFR ? {
    "überwiegend operativ": `associe travail pratique et mise en oeuvre directe au quotidien`,
    "überwiegend systemisch": `associe travail pratique à une planification et un pilotage structurés`,
    "überwiegend strategisch": `est marqué par l'analyse, la planification et les décisions stratégiques`,
    "Gemischt": `associe travail pratique, analyse et coordination dans l'équipe`,
  } : {
    "überwiegend operativ": `verbindet praktische Arbeit mit direkter Umsetzung im Tagesgeschäft`,
    "überwiegend systemisch": `verbindet praktische Arbeit mit strukturierter Planung und Steuerung`,
    "überwiegend strategisch": `ist geprägt durch Analyse, Planung und strategische Entscheidungen`,
    "Gemischt": `verbindet praktische Arbeit mit Analyse und Abstimmung im Team`,
  };

  const arbeitsSatz: Record<string, string> = isEN ? {
    "Umsetzungsorientiert": `delivering tasks and achieving concrete results`,
    "Daten-/prozessorientiert": `evaluating data, planning workflows and proceeding systematically`,
    "Menschenorientiert": `coordination, collaboration and communication within the team`,
    "Ausgewogen": `a balanced combination of different working styles is at the centre`,
  } : isIT ? {
    "Umsetzungsorientiert": `realizzare compiti e raggiungere risultati concreti`,
    "Daten-/prozessorientiert": `analizzare dati, pianificare processi e procedere sistematicamente`,
    "Menschenorientiert": `coordinamento, collaborazione e comunicazione nel team`,
    "Ausgewogen": `una combinazione equilibrata di diversi stili lavorativi e' al centro`,
  } : isFR ? {
    "Umsetzungsorientiert": `l'exécution des tâches et l'atteinte de résultats concrets`,
    "Daten-/prozessorientiert": `l'analyse des données, la planification des processus et une approche systématique`,
    "Menschenorientiert": `la coordination, la collaboration et la communication dans l'équipe`,
    "Ausgewogen": `une combinaison équilibrée de différents styles de travail est au centre`,
  } : {
    "Umsetzungsorientiert": `Aufgaben umzusetzen und konkrete Ergebnisse zu erreichen`,
    "Daten-/prozessorientiert": `Daten auszuwerten, Abläufe zu planen und systematisch vorzugehen`,
    "Menschenorientiert": `Abstimmung, Zusammenarbeit und Kommunikation im Team`,
    "Ausgewogen": `eine ausgewogene Kombination verschiedener Arbeitsweisen im Vordergrund steht`,
  };

  const arbeitsDetail: Record<string, [string, string]> = isEN ? {
    "Umsetzungsorientiert": [
      "The role works in a strongly practical and solution-oriented way.",
      "Tasks are tackled directly and translated into concrete results.",
    ],
    "Daten-/prozessorientiert": [
      "The work is based on data, clear structures and systematic procedures.",
      "Decisions are prepared analytically and implemented in a comprehensible way.",
    ],
    "Menschenorientiert": [
      "Communication and relationship building are at the centre of daily work.",
      "Results emerge through coordination, trust and collaboration.",
    ],
    "Ausgewogen": [
      "The working style combines execution, analysis and communication.",
      "Flexibility in approach is decisive for success.",
    ],
  } : isIT ? {
    "Umsetzungsorientiert": [
      "Il ruolo lavora in modo fortemente pratico e orientato alle soluzioni.",
      "I compiti vengono affrontati direttamente e tradotti in risultati concreti.",
    ],
    "Daten-/prozessorientiert": [
      "Il lavoro si basa su dati, strutture chiare e procedure sistematiche.",
      "Le decisioni vengono preparate analiticamente e attuate in modo comprensibile.",
    ],
    "Menschenorientiert": [
      "La comunicazione e la cura delle relazioni sono al centro del lavoro quotidiano.",
      "I risultati nascono dal coordinamento, dalla fiducia e dalla collaborazione.",
    ],
    "Ausgewogen": [
      "Lo stile lavorativo unisce esecuzione, analisi e comunicazione.",
      "La flessibilita' nell'approccio e' decisiva per il successo.",
    ],
  } : isFR ? {
    "Umsetzungsorientiert": [
      "Le poste travaille de manière très pratique et orientée vers les solutions.",
      "Les tâches sont abordées directement et transformées en résultats concrets.",
    ],
    "Daten-/prozessorientiert": [
      "Le travail repose sur des données, des structures claires et une approche systématique.",
      "Les décisions sont préparées analytiquement et mises en oeuvre de manière compréhensible.",
    ],
    "Menschenorientiert": [
      "La communication et l'entretien des relations sont au centre du travail quotidien.",
      "Les résultats naissent de la coordination, de la confiance et de la collaboration.",
    ],
    "Ausgewogen": [
      "Le style de travail associe mise en oeuvre, analyse et communication.",
      "La flexibilité dans l'approche est décisive pour le succès.",
    ],
  } : {
    "Umsetzungsorientiert": [
      "Die Stelle arbeitet stark praktisch und lösungsorientiert.",
      "Aufgaben werden direkt angegangen und in konkrete Ergebnisse überführt.",
    ],
    "Daten-/prozessorientiert": [
      "Die Arbeit basiert auf Daten, klaren Strukturen und systematischem Vorgehen.",
      "Entscheidungen werden analytisch vorbereitet und nachvollziehbar umgesetzt.",
    ],
    "Menschenorientiert": [
      "Kommunikation und Beziehungspflege stehen im Mittelpunkt der täglichen Arbeit.",
      "Ergebnisse entstehen durch Abstimmung, Vertrauen und Zusammenarbeit.",
    ],
    "Ausgewogen": [
      "Die Arbeitsweise verbindet Umsetzung, Analyse und Kommunikation.",
      "Flexibilität im Vorgehen ist entscheidend für den Erfolg.",
    ],
  };

  const fuehrungDetail: Record<string, string> = isEN ? {
    "Keine": "The role works independently without directly leading other employees.",
    "Projekt-/Teamkoordination": "The role coordinates tasks and projects and ensures smooth collaboration within the team.",
    "Fachliche Führung": "The role takes technical responsibility within the team and ensures that work and quality are reliably delivered.",
    "Disziplinarische Führung mit Ergebnisverantwortung": "The role carries responsibility for employees, their development and the achievement of concrete results.",
  } : isIT ? {
    "Keine": "Il ruolo lavora in modo autonomo senza guidare direttamente altri collaboratori.",
    "Projekt-/Teamkoordination": "Il ruolo coordina compiti e progetti e garantisce una collaborazione fluida nel team.",
    "Fachliche Führung": "Il ruolo assume responsabilita' tecnica nel team e assicura che il lavoro e la qualita' vengano garantiti in modo affidabile.",
    "Disziplinarische Führung mit Ergebnisverantwortung": "Il ruolo porta la responsabilita' dei collaboratori, del loro sviluppo e del raggiungimento di risultati concreti.",
  } : isFR ? {
    "Keine": "Le poste travaille de manière autonome sans diriger directement d'autres collaborateurs.",
    "Projekt-/Teamkoordination": "Le poste coordonne les tâches et projets et assure une collaboration fluide dans l'équipe.",
    "Fachliche Führung": "Le poste prend en charge la responsabilité professionnelle dans l'équipe et veille à ce que le travail et la qualité soient assurés de manière fiable.",
    "Disziplinarische Führung mit Ergebnisverantwortung": "Le poste porte la responsabilité des collaborateurs, de leur développement et de l'atteinte de résultats concrets.",
  } : {
    "Keine": "Die Stelle arbeitet eigenverantwortlich ohne direkte Führung von Mitarbeitenden.",
    "Projekt-/Teamkoordination": "Die Stelle koordiniert Aufgaben und Projekte und sorgt für eine reibungslose Zusammenarbeit im Team.",
    "Fachliche Führung": "Die Stelle übernimmt fachliche Verantwortung im Team und stellt sicher, dass Arbeit und Qualität zuverlässig umgesetzt werden.",
    "Disziplinarische Führung mit Ergebnisverantwortung": "Die Stelle trägt Verantwortung für Mitarbeitende, deren Entwicklung und die Erreichung konkreter Ergebnisse.",
  };

  const fokusKurz: Record<string, string> = isEN ? {
    "Ergebnisse und Zielerreichung": "concrete results and measurable performance",
    "Zusammenarbeit und Netzwerk": "stable collaboration and reliable relationships",
    "Innovation und Veränderung": "new ideas and the active implementation of change",
    "Prozesse und Effizienz": "reliable workflows and efficient ways of working",
    "Fachliche Qualität und Expertise": "high technical quality and expertise",
    "Kommunikation und Einfluss": "convincing communication and reaching people",
    "Results and goal achievement": "concrete results and measurable performance",
    "Collaboration and network": "stable collaboration and reliable relationships",
    "Innovation and change": "new ideas and the active implementation of change",
    "Processes and efficiency": "reliable workflows and efficient ways of working",
    "Technical quality and expertise": "high technical quality and expertise",
    "Communication and influence": "convincing communication and reaching people",
  } : isIT ? {
    "Ergebnisse und Zielerreichung": "risultati concreti e prestazioni misurabili",
    "Zusammenarbeit und Netzwerk": "collaborazione stabile e relazioni affidabili",
    "Innovation und Veränderung": "idee nuove e attuazione attiva del cambiamento",
    "Prozesse und Effizienz": "processi affidabili e modalita' di lavoro efficienti",
    "Fachliche Qualität und Expertise": "alta qualita' tecnica ed expertise",
    "Kommunikation und Einfluss": "comunicazione convincente e capacita' di raggiungere le persone",
  } : isFR ? {
    "Résultats et atteinte des objectifs": "des résultats concrets et d'une performance mesurable",
    "Collaboration et réseau": "d'une collaboration stable et de relations fiables",
    "Innovation et changement": "de nouvelles idées et d'une mise en oeuvre active du changement",
    "Processus et efficacité": "de processus fiables et d'une manière de travailler efficace",
    "Qualité professionnelle et expertise": "d'une haute qualité professionnelle et d'une expertise",
    "Communication et influence": "d'une communication convaincante et de la capacité à atteindre les personnes",
  } : {
    "Ergebnisse und Zielerreichung": "konkreten Resultaten und messbarer Leistung",
    "Zusammenarbeit und Netzwerk": "stabiler Zusammenarbeit und verlässlichen Beziehungen",
    "Innovation und Veränderung": "neuen Ideen und der aktiven Umsetzung von Veränderungen",
    "Prozesse und Effizienz": "verlässlichen Abläufen und effizienter Arbeitsweise",
    "Fachliche Qualität und Expertise": "hoher fachlicher Qualität und Expertise",
    "Kommunikation und Einfluss": "überzeugender Kommunikation und dem Erreichen von Menschen",
  };

  const aufgText = aufgabenSatz[aufgabencharakter] || (isEN ? "combines various task areas" : isIT ? "unisce diversi settori di compiti" : isFR ? "associe différents domaines de tâches" : "verbindet verschiedene Aufgabenbereiche");
  const arbText = arbeitsSatz[arbeitslogik] || (isEN ? "different working styles" : isIT ? "una combinazione di diversi stili lavorativi" : isFR ? "une combinaison de différents styles de travail" : "unterschiedliche Arbeitsweisen");
  const fokusTeile = (fokusLabels as string[]).map(l => fokusKurz[l] || l.toLowerCase()).filter(Boolean);
  let fokusSatz = "";
  if (isEN) {
    if (fokusTeile.length === 1) fokusSatz = `The success of this role shows above all in ${fokusTeile[0]}.`;
    else if (fokusTeile.length === 2) fokusSatz = `The success of this role shows above all in ${fokusTeile[0]} and ${fokusTeile[1]}.`;
    else if (fokusTeile.length > 2) fokusSatz = `The success of this role shows above all in ${fokusTeile.slice(0, -1).join(", ")} and ${fokusTeile[fokusTeile.length - 1]}.`;
  } else if (isIT) {
    if (fokusTeile.length === 1) fokusSatz = `Il successo di questo ruolo si manifesta soprattutto in ${fokusTeile[0]}.`;
    else if (fokusTeile.length === 2) fokusSatz = `Il successo di questo ruolo si manifesta soprattutto in ${fokusTeile[0]} e ${fokusTeile[1]}.`;
    else if (fokusTeile.length > 2) fokusSatz = `Il successo di questo ruolo si manifesta soprattutto in ${fokusTeile.slice(0, -1).join(", ")} e ${fokusTeile[fokusTeile.length - 1]}.`;
  } else if (isFR) {
    if (fokusTeile.length === 1) fokusSatz = `Le succès de ce poste se manifeste avant tout dans ${fokusTeile[0]}.`;
    else if (fokusTeile.length === 2) fokusSatz = `Le succès de ce poste se manifeste avant tout dans ${fokusTeile[0]} et ${fokusTeile[1]}.`;
    else if (fokusTeile.length > 2) fokusSatz = `Le succès de ce poste se manifeste avant tout dans ${fokusTeile.slice(0, -1).join(", ")} et ${fokusTeile[fokusTeile.length - 1]}.`;
  } else {
    if (fokusTeile.length === 1) fokusSatz = `Der Erfolg dieser Stelle zeigt sich vor allem in ${fokusTeile[0]}.`;
    else if (fokusTeile.length === 2) fokusSatz = `Der Erfolg dieser Stelle zeigt sich vor allem in ${fokusTeile[0]} und ${fokusTeile[1]}.`;
    else if (fokusTeile.length > 2) fokusSatz = `Der Erfolg dieser Stelle zeigt sich vor allem in ${fokusTeile.slice(0, -1).join(", ")} und ${fokusTeile[fokusTeile.length - 1]}.`;
  }

  const arbDetail = arbeitsDetail[arbeitslogik] || (isEN ? ["The working style is versatile and situation-dependent.", ""] as [string, string] : isIT ? ["Lo stile lavorativo e' versatile e dipendente dalla situazione.", ""] as [string, string] : isFR ? ["Le style de travail est polyvalent et adapté à la situation.", ""] as [string, string] : ["Die Arbeitsweise ist vielseitig und situationsabhängig.", ""]);
  const fuehDetail = fuehrungDetail[fuehrung] || fuehrungOpt?.desc || "";

  return (
    <div
      data-testid="summary-bar"
      style={{
        background: "rgba(245,247,250,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 18,
        padding: "28px 28px 24px",
        marginTop: 32,
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #34C759, #30B350)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(52,199,89,0.3)",
        }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#fff", strokeWidth: 2.5 }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
          {isEN ? "Summary" : isIT ? "Sintesi" : isFR ? "Résumé" : "Zusammenfassung"}
        </span>
      </div>

      <p lang={isEN ? "en" : isIT ? "it" : isFR ? "fr" : "de"} style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: "0 0 4px", ...reportTextStyle }}>
        {isEN
          ? `The role ${rollenName} ${aufgText}. Day-to-day, the focus is above all on ${arbText}.`
          : isIT
          ? `Il ruolo ${rollenName} ${aufgText}. Nella pratica quotidiana, l'attenzione si concentra soprattutto su ${arbText}.`
          : isFR
          ? `Le poste ${rollenName} ${aufgText}. Au quotidien, l'accent est avant tout mis sur ${arbText}.`
          : localizeText(`Die Stelle ${rollenName} ${aufgText}. Im Alltag geht es vor allem darum, ${arbText}.`)}
      </p>
      {fokusSatz && (
        <p lang={isEN ? "en" : isIT ? "it" : isFR ? "fr" : "de"} style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: "8px 0 0", ...reportTextStyle }}>
          {isIT ? fokusSatz : isFR ? fokusSatz : isEN ? fokusSatz : localizeText(fokusSatz)}
        </p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
        marginTop: 22,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 14,
          padding: "18px 20px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(0,113,227,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity style={{ width: 17, height: 17, color: "#0071E3", strokeWidth: 2 }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{isEN ? "Working style" : isIT ? "Stile lavorativo" : isFR ? "Style de travail" : "Arbeitsweise"}</span>
          </div>
          <p style={{
            fontSize: 14, fontWeight: 600, color: "#1D1D1F",
            lineHeight: 1.4, margin: "0 0 6px",
          }}>
            {arbeitsOpt?.label}
          </p>
          <p lang="de" style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.6, margin: 0, ...reportTextStyle }}>
            {localizeText(arbDetail[0])}
          </p>
        </div>

        <div style={{
          background: "#fff",
          borderRadius: 14,
          padding: "18px 20px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(52,199,89,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users style={{ width: 17, height: 17, color: "#34C759", strokeWidth: 2 }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{isEN ? "Leadership role" : isIT ? "Ruolo di leadership" : isFR ? "Rôle de management" : localizeText("Führungsrolle")}</span>
          </div>
          <p style={{
            fontSize: 14, fontWeight: 600, color: "#1D1D1F",
            lineHeight: 1.4, margin: "0 0 6px",
          }}>
            {localizeText(fuehrungOpt?.label || "")}
          </p>
          <p lang="de" style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.6, margin: 0, ...reportTextStyle }}>
            {localizeText(fuehDetail)}
          </p>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TAETIGKEITEN: Taetigkeit[] = [
  { id: 1, name: "Kundenberatung und persönliche Bedarfsanalyse, um massgeschneiderte Lösungen vorzuschlagen", kategorie: "haupt", kompetenz: "Intuitiv", niveau: "Mittel" },
  { id: 2, name: "Unabhängige Bewertung und Vergleich von Produkten verschiedener Anbieter für Kunden", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 3, name: "Erstellung detaillierter Angebote und Erläuterung der Konditionen und Leistungen", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 4, name: "Unterstützung von Kunden bei Vertragsabschlüssen und Dokumentation aller relevanten Daten", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 5, name: "Regelmässige Überprüfung bestehender Verträge und Anpassung an veränderte Lebensumstände", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 6, name: "Beratung zu Schadensfällen und Hilfestellung bei der Schadensabwicklung", kategorie: "neben", kompetenz: "Intuitiv", niveau: "Mittel" },
  { id: 7, name: "Schulung und Aufklärung von Kunden über Risiken und notwendige Absicherungen", kategorie: "neben", kompetenz: "Intuitiv", niveau: "Mittel" },
  { id: 8, name: "Mitarbeiter entwickeln und fördern", kategorie: "fuehrung", kompetenz: "Intuitiv", niveau: "Hoch" },
];

function loadSavedState() {
  try {
    const resetFlag = localStorage.getItem("rollenDnaReset");
    if (resetFlag) {
      localStorage.removeItem("rollenDnaReset");
      localStorage.removeItem("rollenDnaState");
      localStorage.removeItem("rollenDnaCompleted");
      localStorage.removeItem("kompetenzenCache");
      localStorage.removeItem("berichtCache");
      localStorage.removeItem("bioCheckTextOverride");
      localStorage.removeItem("bioCheckIntroOverride");
      localStorage.removeItem("bioCheckTextGenerated");
      localStorage.removeItem("analyseTexte");
      return null;
    }
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      const state = JSON.parse(raw);
      if ((!state.taetigkeiten || state.taetigkeiten.length === 0) && state.beruf) {
        try {
          const cached = localStorage.getItem("kompetenzenCache");
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (cacheData.taetigkeiten && cacheData.taetigkeiten.length > 0) {
              state.taetigkeiten = cacheData.taetigkeiten;
              state.nextId = Math.max(...cacheData.taetigkeiten.map((t: any) => t.id)) + 1;
            }
          }
        } catch {}
      }
      if (state.taetigkeiten && state.taetigkeiten.length > 0) {
        state.allCollapsed = true;
        state.currentStep = 3;
      } else if (state.beruf && state.fuehrung && state.erfolgsfokusIndices?.length > 0 && state.aufgabencharakter && state.arbeitslogik) {
        state.currentStep = 3;
      }
      return state;
    }
  } catch {}
  return null;
}

const reportTextStyle: React.CSSProperties = {
  textAlign: "justify",
  hyphens: "auto",
  WebkitHyphens: "auto",
  wordBreak: "break-word",
};

export default function RollenDNA() {
  const [, setLocation] = useLocation();
  const { region } = useRegion();
  const localizeText = (text: string) => localizeStr(text, region);
  const isMobile = useIsMobile();
  const saved = useRef(loadSavedState());

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [currentStep, setCurrentStep] = useState(saved.current?.currentStep ?? 1);
  const [allCollapsed, setAllCollapsed] = useState(saved.current?.allCollapsed ?? false);
  const [beruf, setBeruf] = useState(saved.current?.beruf ?? "");
  const [fuehrung, setFuehrung] = useState(saved.current?.fuehrung ?? "");
  const [erfolgsfokusIndices, setErfolgsfokusIndices] = useState<number[]>(saved.current?.erfolgsfokusIndices ?? []);
  const [showFuehrungInfo, setShowFuehrungInfo] = useState(false);
  const [aufgabencharakter, setAufgabencharakter] = useState(saved.current?.aufgabencharakter ?? "");
  const [arbeitslogik, setArbeitslogik] = useState(saved.current?.arbeitslogik ?? "");
  const [zusatzInfo, setZusatzInfo] = useState(saved.current?.zusatzInfo ?? "");

  const [activeTab, setActiveTab] = useState<TaetigkeitKategorie>(saved.current?.activeTab ?? "haupt");
  const [taetigkeiten, setTaetigkeiten] = useState<Taetigkeit[]>(saved.current?.taetigkeiten ?? []);
  const [nextId, setNextId] = useState(saved.current?.nextId ?? 1);
  const [generatedRegion, setGeneratedRegion] = useState<string>(saved.current?.generatedRegion ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalNames = useRef<Map<number, string>>(
    new Map(saved.current?.taetigkeiten?.map((t: Taetigkeit) => [t.id, t.name]) ?? [])
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [bioCheckOpen, setBioCheckOpen] = useState(false);
  const [bioCheckTextOverride, setBioCheckTextOverride] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem("bioCheckTextOverride");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const bioCheckIntroOverride = (() => {
    try {
      const raw = localStorage.getItem("bioCheckIntroOverride");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedLaender, setSelectedLaender] = useState<Set<BerufLand>>(new Set(["DE", "CH", "AT"]));
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (taetigkeiten.length > 0 && originalNames.current.size === 0) {
      originalNames.current = new Map(taetigkeiten.map(t => [t.id, t.name]));
    }
  }, []);

  useEffect(() => {
    const checkReset = () => {
      const resetFlag = localStorage.getItem("rollenDnaReset");
      if (resetFlag) {
        localStorage.removeItem("rollenDnaReset");
        localStorage.removeItem("rollenDnaState");
        localStorage.removeItem("rollenDnaCompleted");
        localStorage.removeItem("kompetenzenCache");
        localStorage.removeItem("berichtCache");
        localStorage.removeItem("bioCheckTextOverride");
        localStorage.removeItem("bioCheckIntroOverride");
        localStorage.removeItem("bioCheckTextGenerated");
        localStorage.removeItem("analyseTexte");
        setCurrentStep(1);
        setAllCollapsed(false);
        setBeruf("");
        setFuehrung("");
        setErfolgsfokusIndices([]);
        setAufgabencharakter("");
        setArbeitslogik("");
        setZusatzInfo("");
        setActiveTab("haupt");
        setTaetigkeiten([]);
        setNextId(1);
        setBioCheckTextOverride(null);
        originalNames.current = new Map();
        window.scrollTo(0, 0);
      }
    };
    checkReset();
    window.addEventListener("rollenDnaResetTriggered", checkReset);
    return () => window.removeEventListener("rollenDnaResetTriggered", checkReset);
  }, []);

  const toggleLand = (land: BerufLand) => {
    setSelectedLaender(prev => {
      const next = new Set(prev);
      if (next.has(land)) {
        if (next.size > 1) next.delete(land);
      } else {
        next.add(land);
      }
      return next;
    });
    setHighlightedIndex(-1);
  };

  const filteredBerufe = (() => {
    const q = beruf.trim().toLowerCase();
    if (q.length === 0) return [];
    const matches = BERUFE.filter(b => b.name.toLowerCase().includes(q) && selectedLaender.has(b.land));
    matches.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aExact = aLower === q;
      const bExact = bLower === q;
      if (aExact !== bExact) return aExact ? -1 : 1;
      const aStarts = aLower.startsWith(q);
      const bStarts = bLower.startsWith(q);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      const aIdx = aLower.indexOf(q);
      const bIdx = bLower.indexOf(q);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.length - b.name.length;
    });
    return matches.slice(0, 20);
  })();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    let candidateData = null;
    let teamData = null;
    try { const c = localStorage.getItem("jobcheckCandProfile"); if (c) candidateData = JSON.parse(c); } catch {}
    try { const cs = localStorage.getItem("jobcheckCandSliders"); if (cs) candidateData = { ...candidateData, sliders: JSON.parse(cs) }; } catch {}
    try { const t = localStorage.getItem("teamProfile"); if (t) teamData = JSON.parse(t); } catch {}
    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      beruf,
      fuehrung,
      erfolgsfokus: erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i].replace(/\n/g, " ")),
      erfolgsfokusIndices,
      aufgabencharakter,
      arbeitslogik,
      zusatzInfo,
      taetigkeiten,
      nextId,
      matchCheck: candidateData,
      teamCheck: teamData,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = beruf ? beruf.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_ ]/g, "").trim().replace(/\s+/g, "_") : "Rollenprofil";
    a.download = `${safeName}_bioLogic.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.beruf !== undefined) setBeruf(data.beruf);
        if (data.fuehrung !== undefined) setFuehrung(data.fuehrung);
        if (data.erfolgsfokusIndices !== undefined) setErfolgsfokusIndices(data.erfolgsfokusIndices);
        if (data.aufgabencharakter !== undefined) setAufgabencharakter(data.aufgabencharakter);
        if (data.arbeitslogik !== undefined) setArbeitslogik(data.arbeitslogik);
        if (data.zusatzInfo !== undefined) setZusatzInfo(data.zusatzInfo);
        if (data.taetigkeiten !== undefined) setTaetigkeiten(data.taetigkeiten);
        if (data.nextId !== undefined) setNextId(data.nextId);
        if (data.taetigkeiten && data.taetigkeiten.length > 0) {
          setGeneratedRegion(data.generatedRegion || "DE");
        }
        setCurrentStep(3);
        setAllCollapsed(true);
        const loadedBeruf = data.beruf ?? beruf;
        const loadedFuehrung = data.fuehrung ?? fuehrung;
        const loadedErfolgsfokus = data.erfolgsfokusIndices ?? erfolgsfokusIndices;
        const loadedAufgaben = data.aufgabencharakter ?? aufgabencharakter;
        const loadedArbeits = data.arbeitslogik ?? arbeitslogik;
        const loadedZusatz = data.zusatzInfo ?? "";
        const loadedTaetigkeiten = data.taetigkeiten ?? taetigkeiten;
        originalNames.current = new Map(loadedTaetigkeiten.map((t: Taetigkeit) => [t.id, t.name]));
        const isComplete = !!(loadedBeruf && loadedFuehrung && loadedErfolgsfokus.length > 0 && loadedAufgaben && loadedArbeits && loadedTaetigkeiten.length > 0);
        if (isComplete) {
          localStorage.setItem("rollenDnaCompleted", "true");
        } else {
          localStorage.removeItem("rollenDnaCompleted");
        }

        if (loadedTaetigkeiten.length > 0) {
          const erfText = loadedErfolgsfokus
            .map((i: number) => ERFOLGSFOKUS_LABELS[i]?.replace(/\n/g, " "))
            .filter(Boolean)
            .join(", ");
          const fileRegion = data.generatedRegion || "DE";
          const cacheKey = JSON.stringify({
            beruf: loadedBeruf,
            fuehrung: loadedFuehrung,
            erfolgsfokus: erfText,
            aufgabencharakter: loadedAufgaben,
            arbeitslogik: loadedArbeits,
            zusatzInfo: loadedZusatz,
            region: fileRegion,
          });
          localStorage.setItem("kompetenzenCache", JSON.stringify({ key: cacheKey, taetigkeiten: loadedTaetigkeiten, generatedRegion: fileRegion }));
        }

        if (data.matchCheck) {
          const mc = data.matchCheck;
          if (mc.sliders) {
            localStorage.setItem("jobcheckCandSliders", JSON.stringify(mc.sliders));
          }
          const { sliders, ...profileData } = mc;
          if (Object.keys(profileData).length > 0) {
            localStorage.setItem("jobcheckCandProfile", JSON.stringify(profileData));
          }
        }
        if (data.teamCheck) {
          localStorage.setItem("teamProfile", JSON.stringify(data.teamCheck));
        }
      } catch {
        alert("Die Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredTaetigkeiten = taetigkeiten.filter(t => t.kategorie === activeTab);
  const hauptCount = taetigkeiten.filter(t => t.kategorie === "haupt").length;
  const nebenCount = taetigkeiten.filter(t => t.kategorie === "neben").length;
  const fuehrungCount = taetigkeiten.filter(t => t.kategorie === "fuehrung").length;
  const highCount = taetigkeiten.filter(t => t.niveau === "Hoch").length;

  const bioGramHaupt = calcBioGram(taetigkeiten.filter(t => t.kategorie === "haupt"));
  const bioGramNeben = calcBioGram(taetigkeiten.filter(t => t.kategorie === "neben"));
  const bioGramFuehrung = calcBioGram(taetigkeiten.filter(t => t.kategorie === "fuehrung"));

  const bioGramRahmen = (() => {
    let sImp = 0, sInt = 0, sAna = 0;

    if (fuehrung === "Fachliche Führung") sAna += 1.0;
    else if (fuehrung === "Projekt-/Teamkoordination") sInt += 1.0;
    else if (fuehrung.startsWith("Disziplinarische")) sImp += 1.0;

    for (const idx of erfolgsfokusIndices) {
      if (idx === 0 || idx === 2) sImp += 1.0;
      else if (idx === 1 || idx === 5) sInt += 1.0;
      else if (idx === 3 || idx === 4) sAna += 1.0;
    }

    if (aufgabencharakter === "überwiegend operativ") sImp += 1.0;
    else if (aufgabencharakter === "überwiegend systemisch") sInt += 1.0;
    else if (aufgabencharakter === "überwiegend strategisch") sAna += 1.0;
    else if (aufgabencharakter === "Gemischt") { sImp += 1.0; sInt += 1.0; sAna += 1.0; }

    if (arbeitslogik === "Umsetzungsorientiert") sImp += 1.0;
    else if (arbeitslogik === "Menschenorientiert") sInt += 1.0;
    else if (arbeitslogik === "Daten-/prozessorientiert") sAna += 1.0;
    else if (arbeitslogik === "Ausgewogen") { sImp += 1.0; sInt += 1.0; sAna += 1.0; }

    const total = sImp + sInt + sAna;
    if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 } as BioGram;
    const [imp, int, ana] = roundPercentages((sImp / total) * 100, (sInt / total) * 100, (sAna / total) * 100);
    return { imp, int, ana } as BioGram;
  })();

  const bioGramGesamt = (() => {
    const all = [bioGramHaupt, bioGramNeben, bioGramFuehrung, bioGramRahmen];
    let vals = [
      all.reduce((s, g) => s + g.imp, 0) / all.length,
      all.reduce((s, g) => s + g.int, 0) / all.length,
      all.reduce((s, g) => s + g.ana, 0) / all.length,
    ];
    const MAX = 67;
    const peak = Math.max(...vals);
    if (peak > MAX) {
      const scale = MAX / peak;
      vals = vals.map(v => v * scale);
    }
    const [imp, int, ana] = roundPercentages(vals[0], vals[1], vals[2]);
    return { imp, int, ana } as BioGram;
  })();

  useEffect(() => {
    const state = {
      currentStep, allCollapsed, beruf, fuehrung, erfolgsfokusIndices,
      aufgabencharakter, arbeitslogik, zusatzInfo, activeTab, taetigkeiten, nextId, generatedRegion,
      bioGramGesamt: { imp: bioGramGesamt.imp, int: bioGramGesamt.int, ana: bioGramGesamt.ana },
      bioGramHaupt: { imp: bioGramHaupt.imp, int: bioGramHaupt.int, ana: bioGramHaupt.ana },
      bioGramNeben: { imp: bioGramNeben.imp, int: bioGramNeben.int, ana: bioGramNeben.ana },
      bioGramFuehrung: { imp: bioGramFuehrung.imp, int: bioGramFuehrung.int, ana: bioGramFuehrung.ana },
      bioGramRahmen: { imp: bioGramRahmen.imp, int: bioGramRahmen.int, ana: bioGramRahmen.ana },
    };
    localStorage.setItem("rollenDnaState", JSON.stringify(state));
  }, [currentStep, allCollapsed, beruf, fuehrung, erfolgsfokusIndices, aufgabencharakter, arbeitslogik, zusatzInfo, activeTab, taetigkeiten, nextId, generatedRegion, bioGramGesamt, bioGramHaupt, bioGramNeben, bioGramFuehrung, bioGramRahmen]);

  const isLeadershipRole = fuehrung !== "Keine";
  const bioCheckTextGenerated = generateBioCheckText(bioGramGesamt, isLeadershipRole, region, isLeadershipRole ? bioGramFuehrung : undefined);
  const bioCheckText = bioCheckTextOverride ?? bioCheckTextGenerated;

  useEffect(() => {
    localStorage.setItem("bioCheckTextGenerated", JSON.stringify(bioCheckTextGenerated));
  }, [bioCheckTextGenerated]);

  const MAX_ITEMS: Record<TaetigkeitKategorie, number> = { haupt: 15, neben: 10, fuehrung: 10 };
  const currentTabCount = filteredTaetigkeiten.length;
  const currentTabMax = MAX_ITEMS[activeTab];
  const canAddMore = currentTabCount < currentTabMax;

  const hauptHighCount = taetigkeiten.filter(t => t.kategorie === "haupt" && t.niveau === "Hoch").length;
  const nebenHighCount = taetigkeiten.filter(t => t.kategorie === "neben" && t.niveau === "Hoch").length;
  const fuehrungHighCount = taetigkeiten.filter(t => t.kategorie === "fuehrung" && t.niveau === "Hoch").length;
  const MAX_HIGH = 5;
  const currentTabHighCount = activeTab === "haupt" ? hauptHighCount : activeTab === "neben" ? nebenHighCount : fuehrungHighCount;

  const handleNiveauChange = (id: number, niveau: Niveau) => {
    setTaetigkeiten(prev => prev.map(t => t.id === id ? { ...t, niveau } : t));
  };

  const handleKompetenzChange = (id: number, kompetenz: KompetenzTyp) => {
    setTaetigkeiten(prev => prev.map(t => t.id === id ? { ...t, kompetenz } : t));
  };

  const handleRemoveTaetigkeit = (id: number) => {
    setTaetigkeiten(prev => prev.filter(t => t.id !== id));
  };

  const handleRenameTaetigkeit = (id: number, newName: string) => {
    setTaetigkeiten(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const changedIds = taetigkeiten.filter(t => {
    const orig = originalNames.current.get(t.id);
    return orig !== undefined && orig !== t.name;
  }).map(t => t.id);

  const handleReclassify = async () => {
    const changed = taetigkeiten.filter(t => changedIds.includes(t.id));
    if (changed.length === 0) return;
    setIsReclassifying(true);
    try {
      const resp = await fetch("/api/reclassify-kompetenzen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beruf,
          fuehrung,
          aufgabencharakter,
          arbeitslogik,
          items: changed.map(t => ({ name: t.name, kategorie: t.kategorie })),
          region,
        }),
      });
      if (!resp.ok) throw new Error("Reclassify failed");
      const data = await resp.json();
      const results: { kompetenz?: KompetenzTyp; confidence?: number }[] = data.results || [];
      setTaetigkeiten(prev => {
        const updated = [...prev];
        const validValues = ["Impulsiv", "Intuitiv", "Analytisch"];
        changed.forEach((t, i) => {
          let raw = results[i]?.kompetenz;
          if (!raw) return;
          let resolved: string | undefined;
          if (validValues.includes(raw)) {
            resolved = raw;
          } else if (raw.includes("|")) {
            resolved = raw.split("|").map((s: string) => s.trim()).find((s: string) => validValues.includes(s));
          }
          if (resolved) {
            const idx = updated.findIndex(u => u.id === t.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], kompetenz: resolved as KompetenzTyp, confidence: results[i]?.confidence };
            }
            originalNames.current.set(t.id, t.name);
          }
        });
        return updated;
      });
    } catch (err) {
      console.error("Neubewertung fehlgeschlagen:", err);
    } finally {
      setIsReclassifying(false);
    }
  };

  const handleAddTaetigkeit = () => {
    const newT: Taetigkeit = {
      id: nextId,
      name: "Neue Tätigkeit",
      kategorie: activeTab,
      kompetenz: "Analytisch",
      niveau: "Mittel",
    };
    originalNames.current.set(nextId, "Neue Tätigkeit");
    setTaetigkeiten(prev => [...prev, newT]);
    setNextId(prev => prev + 1);
  };

  const handleFuehrung = (val: string) => {
    setFuehrung(val);
    if (val === "Keine" && activeTab === "fuehrung") {
      setActiveTab("haupt");
    }
  };

  const handleErfolgsfokus = (globalIdx: number) => {
    setErfolgsfokusIndices((prev) => {
      if (prev.includes(globalIdx)) return prev.filter((i) => i !== globalIdx);
      if (prev.length >= 2) return [...prev.slice(1), globalIdx];
      return [...prev, globalIdx];
    });
  };

  const handleAufgabencharakter = (val: string) => {
    setAufgabencharakter(val);
  };

  const handleArbeitslogik = (val: string) => {
    setArbeitslogik(val);
  };

  const step1Valid = beruf.trim().length > 0;
  const step2Valid = fuehrung.length > 0;

  const completedSteps: number[] = [];
  if (currentStep > 1) completedSteps.push(1);
  if (currentStep > 2) completedSteps.push(2);

  const buildCacheKey = () => {
    const erfolgsfokusText = erfolgsfokusIndices
      .map(i => ERFOLGSFOKUS_LABELS[i]?.replace(/\n/g, " "))
      .filter(Boolean)
      .join(", ");
    return JSON.stringify({ beruf, fuehrung, erfolgsfokus: erfolgsfokusText, aufgabencharakter, arbeitslogik, zusatzInfo, region });
  };

  const generateKompetenzen = async (forceRegenerate = false) => {
    if (!beruf) return;

    const cacheKey = buildCacheKey();

    if (!forceRegenerate) {
      try {
        const cached = localStorage.getItem("kompetenzenCache");
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (cacheData.key === cacheKey && cacheData.taetigkeiten && cacheData.taetigkeiten.length > 0) {
            setTaetigkeiten(cacheData.taetigkeiten);
            setNextId(Math.max(...cacheData.taetigkeiten.map((t: Taetigkeit) => t.id)) + 1);
            originalNames.current = new Map(cacheData.taetigkeiten.map((t: Taetigkeit) => [t.id, t.name]));
            if (cacheData.generatedRegion) setGeneratedRegion(cacheData.generatedRegion);
            return;
          }
        }
      } catch {}
    }

    setIsGenerating(true);
    setGeneratingStep(0);
    try {
      const erfolgsfokusText = erfolgsfokusIndices
        .map(i => ERFOLGSFOKUS_LABELS[i]?.replace(/\n/g, " "))
        .filter(Boolean)
        .join(", ");
      let analyseTexte: { bereich1?: string; bereich2?: string; bereich3?: string } = {};
      try {
        const raw = localStorage.getItem("analyseTexte");
        if (raw) analyseTexte = JSON.parse(raw);
      } catch {}

      const stepTimer1 = setTimeout(() => setGeneratingStep(1), 2500);
      const stepTimer2 = setTimeout(() => setGeneratingStep(2), 5500);

      const resp = await fetch("/api/generate-kompetenzen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beruf, fuehrung, erfolgsfokus: erfolgsfokusText, aufgabencharakter, arbeitslogik, zusatzInfo, analyseTexte, region }),
      });
      if (!resp.ok) throw new Error("Fehler bei der Generierung");
      const data = await resp.json();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setGeneratingStep(3);

      await new Promise(resolve => setTimeout(resolve, 600));

      let id = nextId;
      const generated: Taetigkeit[] = [];
      for (const item of data.haupt || []) {
        generated.push({ id: id++, name: item.name, kategorie: "haupt", kompetenz: item.kompetenz, niveau: item.niveau, confidence: item.confidence });
      }
      for (const item of data.neben || []) {
        generated.push({ id: id++, name: item.name, kategorie: "neben", kompetenz: item.kompetenz, niveau: item.niveau, confidence: item.confidence });
      }
      for (const item of data.fuehrung || []) {
        generated.push({ id: id++, name: item.name, kategorie: "fuehrung", kompetenz: item.kompetenz, niveau: item.niveau, confidence: item.confidence });
      }
      setTaetigkeiten(generated);
      setNextId(id);
      setGeneratedRegion(region);
      originalNames.current = new Map(generated.map(t => [t.id, t.name]));

      localStorage.setItem("kompetenzenCache", JSON.stringify({ key: cacheKey, taetigkeiten: generated, generatedRegion: region }));
    } catch (err) {
      console.error("KI-Generierung fehlgeschlagen:", err);
    } finally {
      setIsGenerating(false);
      setGeneratingStep(0);
    }
  };

  const didAutoGenerate = useRef(false);
  useEffect(() => {
    if (!didAutoGenerate.current && currentStep === 3 && taetigkeiten.length === 0 && beruf && !isGenerating) {
      didAutoGenerate.current = true;
      generateKompetenzen();
    }
  });

  const [editingFromOverview, setEditingFromOverview] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "/rollen-dna" && beruf.trim().length > 0) {
        setAllCollapsed(true);
        setCurrentStep(4);
        setEditingFromOverview(false);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("nav-reclick", handler);
    return () => window.removeEventListener("nav-reclick", handler);
  });

  const goToStep = (step: number) => {
    if (allCollapsed) {
      setEditingFromOverview(true);
    }
    setAllCollapsed(false);
    setCurrentStep(step);
    if (step === 3 && currentStep === 2) {
      generateKompetenzen();
    }
  };

  const returnToOverview = () => {
    setEditingFromOverview(false);
    setAllCollapsed(true);
    setCurrentStep(4);
  };

  const sectionsFilled = [
    fuehrung.length > 0,
    erfolgsfokusIndices.length > 0,
    aufgabencharakter.length > 0,
    arbeitslogik.length > 0,
  ].filter(Boolean).length;

  const allSectionsFilled = sectionsFilled === 4;

  return (
    <>
    {showFuehrungInfo && (
      <>
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.15)" }}
          onClick={() => setShowFuehrungInfo(false)}
        />
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 440,
            maxHeight: "80vh",
            overflowY: "auto",
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
            zIndex: 9999,
          }}
          data-testid="popup-fuehrung-info"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>
              {region === "IT" ? "Definizione della responsabilita' di management" : region === "FR" ? "Définition de la responsabilité de management" : region === "EN" ? "Definition: Leadership responsibility" : "Definition Führungsverantwortung"}
            </h4>
            <button
              onClick={() => setShowFuehrungInfo(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8E8E93", padding: 2 }}
              data-testid="button-close-fuehrung-info"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, marginBottom: 16 }}>
            {region === "IT"
              ? "Classifica il ruolo in base alla responsabilita' gerarchica e sul personale reale, non in base al titolo. Cio' che conta e' il potere decisionale formale e la responsabilita' dei risultati associati al ruolo."
              : region === "FR"
              ? "Classe ce poste selon la responsabilité hiérarchique et du personnel réelle, et non selon le titre. Ce qui compte, c'est le pouvoir décisionnel formel et la responsabilité des résultats associés au poste."
              : region === "EN"
              ? "Please classify the role according to actual reporting authority and personnel responsibility, not the job title. What matters is the formal decision-making authority and accountability for results associated with the role."
              : "Bitte ordne die Stelle nach der tatsächlichen Weisungs- und Personalverantwortung ein, nicht nach dem Jobtitel. Entscheidend ist, welche formale Entscheidungsmacht und Ergebnisverantwortung mit der Stelle verbunden sind."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(region === "IT" ? [
              { label: "Nessuna", desc: "Nessuna responsabilita' gerarchica o di coordinamento." },
              { label: "Coordinamento", desc: "Coordina la collaborazione senza responsabilita' gerarchica o sul personale formale." },
              { label: "Leadership tecnica", desc: "Guida sul piano professionale (qualita', standard, priorita') senza decisioni sul personale." },
              { label: "Management con responsabilita' sul personale", desc: "Responsabilita' per i collaboratori, inclusi obiettivi, sviluppo, decisioni e KPI di risultato." },
            ] : region === "FR" ? [
              { label: "Aucune", desc: "Aucune responsabilité hiérarchique ou de pilotage." },
              { label: "Coordination", desc: "Pilote la collaboration, sans responsabilité hiérarchique ou du personnel formelle." },
              { label: "Management technique", desc: "Dirige sur le plan professionnel (qualité, standards, priorités), sans décisions de personnel." },
              { label: "Management avec responsabilité du personnel", desc: "Responsabilité pour les collaborateurs, y compris objectifs, développement, décisions et KPIs de résultats." },
            ] : region === "EN" ? [
              { label: "None", desc: "No reporting or steering responsibility." },
              { label: "Coordination", desc: "Steers collaboration without formal reporting or personnel authority." },
              { label: "Technical leadership", desc: "Leads on technical matters (quality, standards, priorities) without personnel decisions." },
              { label: "Leadership with personnel responsibility", desc: "Responsible for employees including goals, development, decisions and performance KPIs." },
            ] : [
              { label: "Keine", desc: "Keine Weisungs- oder Steuerungsverantwortung." },
              { label: "Koordination", desc: "Steuert Zusammenarbeit, aber ohne formale Weisungs- oder Personalverantwortung." },
              { label: "Fachliche Führung", desc: "Führt fachlich (Qualität, Standards, Prioritäten), aber ohne Personalentscheidungen." },
              { label: "Führung mit Personalverantwortung", desc: "Verantwortung für Mitarbeitende inkl. Ziele, Entwicklung, Entscheidungen und Ergebnis-KPIs." },
            ]).map(item => (
              <div key={item.label}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{item.label}: </span>
                <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.5 }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.6 }}>
              {region === "IT" ? (
                <>
                  In caso di dubbio, poniti la seguente domanda guida:<br />
                  Il ruolo ha responsabilita' formale di fissazione degli obiettivi e valutazione per i collaboratori?<br />
                  Se si', si tratta in linea di principio di management con responsabilita' sul personale.
                </>
              ) : region === "FR" ? (
                <>
                  En cas de doute, pose-toi la question suivante :<br />
                  Ce poste a-t-il une responsabilité formelle d'entretien d'évaluation et de fixation d'objectifs pour des collaborateurs ?<br />
                  Si oui, il s'agit en principe d'un management avec responsabilité du personnel.
                </>
              ) : region === "EN" ? (
                <>
                  If in doubt, use the following guiding question:<br />
                  Does the role have formal target-setting and appraisal responsibility for employees?<br />
                  If yes, it is generally leadership with personnel responsibility.
                </>
              ) : (
                <>
                  Im Zweifel orientiere dich bitte an folgender Leitfrage:<br />
                  Hat die Stelle formale Zielvereinbarungs- und Beurteilungsverantwortung für Mitarbeitende?<br />
                  Wenn ja, liegt in der Regel Führung mit Personalverantwortung vor.
                </>
              )}
            </p>
          </div>
        </div>
      </>
    )}
    <div className="page-gradient-bg">
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 4px 12px rgba(0,113,227,0.25); }
          50% { box-shadow: 0 4px 20px rgba(0,113,227,0.4); }
          100% { box-shadow: 0 4px 12px rgba(0,113,227,0.25); }
        }
      `}</style>

      <div className="flex flex-col min-h-screen">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileChange}
          data-testid="input-file-load"
        />
        <GlobalNav />
        <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999 }}>
          <div className="dark:!bg-background" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px", minHeight: isMobile ? 48 : 62 }}>
            <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
              <div className="text-center">
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-rollen-dna-title">
                  {region === "IT" ? "Definisci il profilo del ruolo" : region === "FR" ? "Définir le profil du poste" : region === "EN" ? "Define role profile" : "Stellenprofil definieren"}
                </h1>
                <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="text-rollen-dna-subtitle">
                  {region === "IT" ? "Acquisisci i requisiti e la logica lavorativa del ruolo come base per il rapporto decisionale, l'analisi di compatibilita' e il TeamCheck." : region === "FR" ? "Capturez les exigences et la logique de travail du poste pour servir de base au rapport de décision, à l'analyse d'adéquation et au TeamCheck." : region === "EN" ? "Capture the requirements and working logic of the position as a basis for the decision report, fit analysis and TeamCheck." : "Erfasse die Anforderungen und Arbeitslogik der Stelle als Grundlage für den Entscheidungsbericht, die Passungsanalyse sowie den TeamCheck."}
                </p>
              </div>

            </div>
          </div>
        </div>

        <main className="flex-1 w-full mx-auto pb-20" style={{ maxWidth: 1100, paddingTop: isMobile ? 110 : 135, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24, paddingBottom: isMobile ? 100 : 80 }}>
          <div className="space-y-5">

            {allCollapsed ? null : currentStep === 1 ? (
              <Card className="bg-white dark:bg-card border-card-border animate-in fade-in slide-in-from-bottom-2 duration-400" style={{ overflow: "visible", position: "relative", zIndex: 100 }} data-testid="card-step-1">
                <div style={{ padding: isMobile ? "16px 14px 14px" : "32px 32px 28px", overflow: "visible" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#34C759", color: "#fff" }}>1</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>2</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>3</div>
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: "#34C759", letterSpacing: "-0.02em", margin: "0 0 8px" }} data-testid="text-step-1-title">
                    {region === "IT" ? "Quale ruolo vuoi analizzare?" : region === "FR" ? "Quel poste souhaites-tu analyser ?" : region === "EN" ? "Which role do you want to analyse?" : "Welche Stelle möchtest du analysieren?"}
                  </h2>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, margin: "0 0 28px" }}>
                    {region === "IT"
                      ? "Inserisci il titolo o la denominazione del ruolo, es. Direttore Vendite, HR Business Partner o Project Manager IT."
                      : region === "FR"
                      ? "Indique le titre ou la désignation du poste, p.ex. « Directeur commercial », « HR Business Partner » ou « Chef de projet IT »."
                      : region === "EN"
                        ? `Enter the job title or role name, e.g. "Sales Director", "HR Business Partner" or "IT Project Manager".`
                        : "Gib die Berufsbezeichnung oder Stellenbezeichnung ein, z.B. Vertriebsleiter, HR Business Partner oder Projektmanager IT."}
                    <br />
                    {region === "IT"
                      ? "Nessun suggerimento? Scrivi semplicemente il ruolo e lo riconosceremo automaticamente."
                      : region === "FR"
                      ? "Aucune suggestion ? Tu peux simplement décrire le poste et nous le reconnaissons automatiquement."
                      : region === "EN"
                        ? "No matching suggestion? Simply type the role and we will recognise it automatically."
                        : "Kein passender Vorschlag? Einfach ausschreiben – wir erkennen die Stelle automatisch."}
                  </p>

                  <div className="mb-0" style={{ zIndex: 100 }} data-testid="input-beruf-wrapper">
                    <div className="relative" style={{ zIndex: 100 }}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 z-10" />
                      <Input
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        placeholder={region === "IT" ? "es. Key Account Manager, Responsabile Produzione, ..." : region === "FR" ? "p.ex. Responsable grands comptes, Chef d'équipe production, ..." : region === "EN" ? "e.g. Key Account Manager, Production Team Lead, ..." : "z.B. Key Account Manager, Teamleiter Produktion, ..."}
                        value={beruf}
                        onChange={(e) => {
                          setBeruf(e.target.value);
                          setShowSuggestions(true);
                          setHighlightedIndex(-1);
                        }}
                        onFocus={() => { if (beruf.trim().length > 0) setShowSuggestions(true); }}
                        onKeyDown={(e) => {
                          if (!showSuggestions || filteredBerufe.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlightedIndex(prev => Math.min(prev + 1, filteredBerufe.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlightedIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === "Enter" && highlightedIndex >= 0) {
                            e.preventDefault();
                            setBeruf(filteredBerufe[highlightedIndex].name);
                            setShowSuggestions(false);
                            setHighlightedIndex(-1);
                          } else if (e.key === "Escape") {
                            setShowSuggestions(false);
                          }
                        }}
                        className="pl-10 border-border/40 focus:border-primary/40 h-11 text-sm placeholder:text-muted-foreground/40"
                        style={{ background: "rgba(255, 248, 225, 0.5)" }}
                        data-testid="input-beruf"
                      />

                      {showSuggestions && filteredBerufe.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          data-testid="beruf-suggestions"
                          className="bg-white dark:bg-card border border-border/20"
                          style={{
                            position: "absolute",
                            top: 52,
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            borderRadius: 14,
                            boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ maxHeight: 480, overflowY: "auto" }}>
                            {filteredBerufe.map((b, idx) => {
                              const matchStart = b.name.toLowerCase().indexOf(beruf.toLowerCase());
                              const matchEnd = matchStart + beruf.length;
                              const katParts = b.kategorie ? b.kategorie.split(" > ") : [];
                              return (
                                <div
                                  key={b.name}
                                  data-testid={`suggestion-${idx}`}
                                  onClick={() => {
                                    setBeruf(b.name);
                                    setShowSuggestions(false);
                                    setHighlightedIndex(-1);
                                  }}
                                  onMouseEnter={() => setHighlightedIndex(idx)}
                                  style={{
                                    padding: "16px 20px",
                                    cursor: "pointer",
                                    background: idx === highlightedIndex ? "rgba(0,113,227,0.05)" : "transparent",
                                    borderBottom: idx < filteredBerufe.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                                    transition: "background 0.15s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                  }}
                                >
                                  <div style={{
                                    width: 42, height: 42, borderRadius: 10,
                                    background: "rgba(0,0,0,0.035)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                  }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                      <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.35, color: "#1D1D1F" }}>
                                      {matchStart >= 0 ? (
                                        <>
                                          {b.name.slice(0, matchStart)}
                                          <span style={{ color: "#0071E3" }}>{b.name.slice(matchStart, matchEnd)}</span>
                                          {b.name.slice(matchEnd)}
                                        </>
                                      ) : b.name}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#6E6E73", marginTop: 4, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 4 }}>
                                      {katParts.length > 1 ? (
                                        <>
                                          <span>{katParts[0]}</span>
                                          <span style={{ color: "#CACACA" }}>›</span>
                                          <span>{katParts.slice(1).join(" › ")}</span>
                                        </>
                                      ) : b.kategorie}
                                    </div>
                                  </div>
                                  <div style={{ color: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>


                    <div style={{ marginTop: 28 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 6px" }}>{region === "IT" ? "Informazioni aggiuntive (opzionale)" : region === "FR" ? "Informations complémentaires (optionnel)" : region === "EN" ? "Optional additions" : "Optionale Ergänzungen"}</p>
                      <p style={{ fontSize: 13, color: "#6E6E73", margin: "0 0 12px" }}>
                        {region === "IT" ? "Cosa rende questo ruolo speciale nella tua azienda? Piu' e' specifico, piu' l'analisi sara' precisa." : region === "FR" ? "Qu'est-ce qui rend ce poste particulier dans ton entreprise ? Plus c'est concret, plus l'analyse est précise." : region === "EN" ? "What makes this role special in your organisation? The more specific, the more accurate the analysis." : "Was macht diese Stelle in deinem Unternehmen besonders? Je konkreter, desto genauer die Analyse."}
                      </p>
                      <textarea
                        value={zusatzInfo}
                        onChange={(e) => setZusatzInfo(e.target.value)}
                        placeholder={region === "IT" ? "es. Focus Key Account, alta quota trasferte, modello a turni, settore pharma, ..." : region === "FR" ? "p.ex. Accent Key Account, déplacements fréquents, travail posté, secteur pharma, ..." : region === "EN" ? "e.g. Key Account focus, high travel share, shift model, pharma industry, ..." : "z.B. Schwerpunkt Key Account, hoher Reiseanteil, Schichtmodell, Branche Pharma, ..."}
                        className="w-full border border-border/40 focus:border-primary/40 rounded-lg px-3 py-2 text-sm resize-none placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                        style={{ background: "rgba(255, 248, 225, 0.5)" }}
                        rows={2}
                        data-testid="input-zusatzinfo"
                      />
                    </div>

                    <div style={{ marginTop: 32, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 24 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 2px" }}>{region === "IT" ? "Mercato del lavoro" : region === "FR" ? "Marché de l'emploi" : region === "EN" ? "Job market" : "Arbeitsmarkt"}</p>
                      <p style={{ fontSize: 13, color: "#6E6E73", margin: "0 0 8px" }}>
                        {region === "IT" ? "I suggerimenti vengono mostrati per i paesi attivi. Clicca per attivare o disattivare." : region === "FR" ? "Les suggestions s'affichent pour les pays actifs. Clique pour activer ou désactiver." : region === "EN" ? "Suggestions are shown for the active countries. Click to enable or disable." : "Vorschläge werden für die aktiven Länder angezeigt. Zum Ein- oder Ausschalten einfach klicken."}
                      </p>
                      <div className="flex items-center gap-2" data-testid="land-filter">
                        {([
                          { land: "DE" as BerufLand, label: "DE", flag: (<svg viewBox="0 0 20 14" className="w-4 h-3 rounded-[2px] overflow-hidden"><rect y="0" width="20" height="4.67" fill="#000"/><rect y="4.67" width="20" height="4.67" fill="#D00"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/></svg>) },
                          { land: "CH" as BerufLand, label: "CH", flag: (<svg viewBox="0 0 20 14" className="w-4 h-3 rounded-[2px] overflow-hidden"><rect width="20" height="14" fill="#D52B1E"/><rect x="8" y="2.5" width="4" height="9" fill="#FFF"/><rect x="5.5" y="5" width="9" height="4" fill="#FFF"/></svg>) },
                          { land: "AT" as BerufLand, label: "AT", flag: (<svg viewBox="0 0 20 14" className="w-4 h-3 rounded-[2px] overflow-hidden"><rect y="0" width="20" height="4.67" fill="#ED2939"/><rect y="4.67" width="20" height="4.67" fill="#FFF"/><rect y="9.33" width="20" height="4.67" fill="#ED2939"/></svg>) },
                        ]).map(({ land, label, flag }) => {
                          const active = selectedLaender.has(land);
                          return (
                            <button
                              key={land}
                              type="button"
                              data-testid={`filter-${land.toLowerCase()}`}
                              onClick={() => toggleLand(land)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", transition: "all 200ms ease",
                                border: active ? "2px solid #0071E3" : "1.5px solid rgba(0,0,0,0.08)",
                                background: active ? "rgba(0,113,227,0.10)" : "rgba(0,0,0,0.02)",
                                color: active ? "#0071E3" : "#AEAEB2",
                                boxShadow: active ? "0 2px 8px rgba(0,113,227,0.15)" : "none",
                              }}
                            >
                              <span style={{ opacity: active ? 1 : 0.35, transition: "opacity 200ms ease" }}>{flag}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end" style={{ marginTop: 24 }}>
                    <Button
                      disabled={!step1Valid}
                      onClick={() => editingFromOverview ? returnToOverview() : goToStep(2)}
                      className="gap-2"
                      style={{
                        height: 48,
                        paddingLeft: 28,
                        paddingRight: 28,
                        fontSize: 15,
                        fontWeight: 600,
                        borderRadius: 14,
                        background: step1Valid ? "linear-gradient(135deg, #0071E3, #34AADC)" : undefined,
                        border: "none",
                        boxShadow: step1Valid ? "0 4px 16px rgba(0,113,227,0.3)" : undefined,
                      }}
                      data-testid="button-step-1-weiter"
                    >
                      {editingFromOverview ? (region === "IT" ? "Applica" : region === "FR" ? "Appliquer" : region === "EN" ? "Apply" : "Übernehmen") : (region === "IT" ? "Analizza il ruolo" : region === "FR" ? "Analyser le poste" : region === "EN" ? "Analyse role" : "Stelle analysieren")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <CollapsedStep
                step={1}
                title={region === "IT" ? "Ruolo / Titolo selezionato" : region === "FR" ? "Poste / Titre sélectionné" : region === "EN" ? "Selected role / title" : "Ausgewählte Stelle / Bezeichnung"}
                summary={beruf}
                onEdit={() => goToStep(1)}
                icon={Briefcase}
              />
            )}

            {allCollapsed ? null : currentStep === 2 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-2">
                <div className="mb-6">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>✓</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#34C759", color: "#fff" }}>2</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>3</div>
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: "#34C759", letterSpacing: "-0.02em" }} className="dark:text-foreground/90" data-testid="text-step-2-title">
                    {region === "IT" ? "Condizioni quadro del ruolo" : region === "FR" ? "Conditions-cadres du poste" : region === "EN" ? "Role framework conditions" : "Rahmenbedingungen der Stelle"}
                  </h2>
                  <p style={{ fontSize: 14, color: "#48484A", marginTop: 6 }}>
                    {region === "IT" ? "Definisci le caratteristiche di base di questo ruolo. I dati aiutano a determinare la logica strutturale del ruolo." : region === "FR" ? "Définissez les caractéristiques de base de ce poste. Les informations aident à déterminer la logique structurelle du rôle." : region === "EN" ? "Define the basic characteristics of this role. The details help determine the structural role logic." : "Definiere die grundlegenden Merkmale dieser Stelle. Die Angaben helfen dabei, die strukturelle Stellenlogik zu bestimmen."}
                  </p>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    padding: isMobile ? "16px 14px" : "28px 32px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                  className="dark:bg-card/40"
                >
                  <MiniProgressBar filled={sectionsFilled} total={4} region={region} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                    <FadeInSection delay={0}>
                      <div data-testid="section-aufgabencharakter" className="relative">
                        <SectionNumber num={1} isComplete={aufgabencharakter.length > 0} />
                        <div className="flex items-center gap-3">
                          <Layers style={{ width: 20, height: 20, color: "#34C759", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#34C759" }} className="dark:text-foreground/90">
                            {region === "IT" ? "Tipo di compiti" : region === "FR" ? "Type de tâches" : region === "EN" ? "Type of tasks" : "Art der Aufgaben"}
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6, paddingLeft: 32 }}>
                          {getRegionOptions(region).subtitles.aufgabencharakter}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginTop: 4, paddingLeft: 32 }}>
                          {region === "IT" ? "(Seleziona un'opzione)" : region === "FR" ? "(Sélectionnez une option)" : region === "EN" ? "(Please select one option)" : "(Bitte ein Feld auswählen)"}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroup
                            options={getRegionOptions(region).aufgaben}
                            selectedValue={aufgabencharakter}
                            onSelect={handleAufgabencharakter}
                            accentColor="#34C759"
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={100}>
                      <div data-testid="section-arbeitslogik" className="relative">
                        <SectionNumber num={2} isComplete={arbeitslogik.length > 0} />
                        <div className="flex items-center gap-3">
                          <Activity style={{ width: 20, height: 20, color: "#34C759", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#34C759" }} className="dark:text-foreground/90">
                            {region === "IT" ? "Stile lavorativo del ruolo" : region === "FR" ? "Style de travail du poste" : region === "EN" ? "Working style of the role" : "Arbeitsweise der Stelle"}
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6, paddingLeft: 32 }}>
                          {getRegionOptions(region).subtitles.arbeitslogik}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginTop: 4, paddingLeft: 32 }}>
                          {region === "IT" ? "(Seleziona un'opzione)" : region === "FR" ? "(Sélectionnez une option)" : region === "EN" ? "(Please select one option)" : "(Bitte ein Feld auswählen)"}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroup
                            options={getRegionOptions(region).arbeit}
                            selectedValue={arbeitslogik}
                            onSelect={handleArbeitslogik}
                            accentColor="#34C759"
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={200}>
                      <div data-testid="section-erfolgsfokus" className="relative">
                        <SectionNumber num={3} isComplete={erfolgsfokusIndices.length > 0} />
                        <div className="flex items-center gap-3">
                          <Target style={{ width: 20, height: 20, color: "#34C759", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#34C759" }} className="dark:text-foreground/90">
                            {region === "IT" ? "Focus di successo" : region === "FR" ? "Priorité de réussite" : region === "EN" ? "Success focus" : "Erfolgsfokus"}
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6, paddingLeft: 32 }}>
                          {getRegionOptions(region).subtitles.erfolgsfokus}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginTop: 4, paddingLeft: 32 }}>
                          {region === "IT" ? "(Seleziona due opzioni)" : region === "FR" ? "(Sélectionnez deux options)" : region === "EN" ? "(Please select two options)" : "(Bitte zwei Felder auswählen)"}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroupIndexed
                            options={getRegionOptions(region).erfolg}
                            selectedIndices={erfolgsfokusIndices}
                            onSelectIndex={handleErfolgsfokus}
                            accentColor="#34C759"
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={300}>
                      <div data-testid="section-fuehrung" className="relative">
                        <SectionNumber num={4} isComplete={fuehrung.length > 0} />
                        <div className="flex items-center gap-3">
                          <Users style={{ width: 20, height: 20, color: "#34C759", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#34C759" }} className="dark:text-foreground/90">
                            {region === "IT" ? "Responsabilita' di management" : region === "FR" ? "Responsabilité de management" : region === "EN" ? "Leadership responsibility" : "Führungsverantwortung"}
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6, paddingLeft: 32 }}>
                          {getRegionOptions(region).subtitles.fuehrung}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginTop: 4, paddingLeft: 32 }}>
                          {region === "IT" ? "(Seleziona un'opzione)" : region === "FR" ? "(Sélectionnez une option)" : region === "EN" ? "(Please select one option)" : "(Bitte ein Feld auswählen)"}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroup
                            options={getRegionOptions(region).fuehrung}
                            selectedValue={fuehrung}
                            onSelect={handleFuehrung}
                            accentColor="#34C759"
                          />
                        </div>
                      </div>
                    </FadeInSection>

                  </div>

                  {allSectionsFilled && (
                    <div style={{
                      opacity: 1,
                      animation: "fadeSlideUp 400ms ease-out",
                    }}>
                      <style>{`
                        @keyframes fadeSlideUp {
                          from { opacity: 0; transform: translateY(8px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      <SummaryBar
                        beruf={beruf}
                        fuehrung={fuehrung}
                        erfolgsfokusIndices={erfolgsfokusIndices}
                        aufgabencharakter={aufgabencharakter}
                        arbeitslogik={arbeitslogik}
                        region={region}
                      />
                    </div>
                  )}

                  <div className="flex justify-between" style={{ marginTop: 40 }}>
                    <Button
                      variant="outline"
                      onClick={() => goToStep(1)}
                      style={{
                        height: 52,
                        paddingLeft: 28,
                        paddingRight: 28,
                        fontSize: 16,
                        fontWeight: 600,
                        borderRadius: 14,
                        border: "1.5px solid #D1D1D6",
                        color: "#1D1D1F",
                        background: "#fff",
                      }}
                      className="gap-2"
                      data-testid="button-step-2-zurueck"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      {region === "IT" ? "Indietro" : region === "FR" ? "Retour" : region === "EN" ? "Back" : "Zurück"}
                    </Button>
                    <Button
                      disabled={!step2Valid}
                      onClick={() => editingFromOverview ? returnToOverview() : goToStep(3)}
                      style={{
                        height: 52,
                        paddingLeft: 32,
                        paddingRight: 32,
                        fontSize: 16,
                        fontWeight: 600,
                        borderRadius: 14,
                        background: step2Valid ? "linear-gradient(135deg, #0071E3, #34AADC)" : undefined,
                        border: "none",
                        boxShadow: step2Valid ? "0 4px 16px rgba(0,113,227,0.3)" : undefined,
                      }}
                      className="gap-2"
                      data-testid="button-step-2-weiter"
                    >
                      {editingFromOverview ? (region === "IT" ? "Applica" : region === "FR" ? "Appliquer" : region === "EN" ? "Apply" : "Übernehmen") : (region === "IT" ? "Avanti" : region === "FR" ? "Suivant" : region === "EN" ? "Next" : "Weiter")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : !allCollapsed && currentStep > 2 ? (
              <CollapsedStep
                step={2}
                title={region === "IT" ? "Condizioni quadro del ruolo" : region === "FR" ? "Conditions-cadres du poste" : region === "EN" ? "Role framework conditions" : "Rahmenbedingungen der Stelle"}
                summary={region === "IT" ? "Caratteristiche di base di questo ruolo / titolo." : region === "FR" ? "Caractéristiques de base de ce poste / titre." : region === "EN" ? "Basic characteristics of this role / title." : "Grundlegende Merkmale dieser Stelle / Bezeichnung."}
                onEdit={() => goToStep(2)}
                icon={Settings}
              />
            ) : (
              <LockedStep step={2} title={region === "IT" ? "Condizioni quadro del ruolo" : region === "FR" ? "Conditions-cadres du poste" : region === "EN" ? "Role framework conditions" : "Rahmenbedingungen der Stelle"} />
            )}

            {allCollapsed ? null : currentStep >= 4 && taetigkeiten.length > 0 ? (
              <CollapsedStep
                step={3}
                title={region === "IT" ? "Compiti e competenze" : region === "FR" ? "Tâches et compétences" : region === "EN" ? "Tasks & competencies" : "Tätigkeiten & Kompetenzen"}
                summary={region === "IT"
                  ? `${taetigkeiten.filter(t => t.kategorie === "haupt").length} compiti · ${taetigkeiten.filter(t => t.kategorie === "neben").length} competenze umane${taetigkeiten.filter(t => t.kategorie === "fuehrung").length > 0 ? ` · ${taetigkeiten.filter(t => t.kategorie === "fuehrung").length} management` : ""}`
                  : region === "FR"
                  ? `${taetigkeiten.filter(t => t.kategorie === "haupt").length} activités · ${taetigkeiten.filter(t => t.kategorie === "neben").length} compétences humaines${taetigkeiten.filter(t => t.kategorie === "fuehrung").length > 0 ? ` · ${taetigkeiten.filter(t => t.kategorie === "fuehrung").length} management` : ""}`
                  : region === "EN"
                    ? `${taetigkeiten.filter(t => t.kategorie === "haupt").length} tasks · ${taetigkeiten.filter(t => t.kategorie === "neben").length} human skills${taetigkeiten.filter(t => t.kategorie === "fuehrung").length > 0 ? ` · ${taetigkeiten.filter(t => t.kategorie === "fuehrung").length} leadership` : ""}`
                    : `${taetigkeiten.filter(t => t.kategorie === "haupt").length} Tätigkeiten · ${taetigkeiten.filter(t => t.kategorie === "neben").length} Humankompetenzen${taetigkeiten.filter(t => t.kategorie === "fuehrung").length > 0 ? ` · ${taetigkeiten.filter(t => t.kategorie === "fuehrung").length} Führung` : ""}`}
                onEdit={() => goToStep(3)}
                icon={Layers}
              />
            ) : currentStep === 3 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>✓</div>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>✓</div>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#34C759", color: "#fff" }}>3</div>
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: "#34C759", letterSpacing: "-0.02em" }} className="dark:text-foreground/90" data-testid="text-step-3-title">
                      {region === "IT" ? "Compiti e competenze" : region === "FR" ? "Tâches et compétences" : region === "EN" ? "Tasks & competencies" : "Tätigkeiten & Kompetenzen"}
                    </h2>
                    <p style={{ fontSize: 14, color: "#48484A", marginTop: 4 }}>
                      {region === "IT" ? "Definisci la struttura concreta di questo ruolo." : region === "FR" ? "Définissez la structure concrète de ce poste." : region === "EN" ? "Shape the concrete structure of this role." : "Forme die konkrete Struktur dieser Stelle."}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 14, color: "#48484A", lineHeight: 1.8 }}>
                    <div>{region === "IT" ? "Compiti" : region === "FR" ? "Tâches" : region === "EN" ? "Tasks" : "Tätigkeiten"} <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{hauptCount} / 15</span></div>
                    <div>{region === "IT" ? "Competenze umane" : region === "FR" ? "Compétences humaines" : region === "EN" ? "Human competences" : "Humankompetenzen"} <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{nebenCount} / 10</span></div>
                    {fuehrung !== "Keine" && (
                      <div>{region === "IT" ? "Competenze di management" : region === "FR" ? "Compétences de management" : region === "EN" ? "Leadership competences" : "Führungskompetenzen"} <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{fuehrungCount} / 10</span></div>
                    )}
                  </div>
                </div>

                {taetigkeiten.length > 0 && generatedRegion && generatedRegion !== region && !isGenerating && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: region === "FR" || region === "EN" || region === "IT" ? "rgba(52,199,89,0.08)" : "rgba(0,122,255,0.08)",
                      border: `1px solid ${region === "FR" || region === "EN" || region === "IT" ? "rgba(52,199,89,0.25)" : "rgba(0,122,255,0.25)"}`,
                      borderRadius: 14,
                      padding: "12px 18px",
                      marginBottom: 16,
                    }}
                    data-testid="banner-regenerate-region"
                  >
                    <span style={{ fontSize: 20 }}>🌐</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }} className="dark:text-foreground">
                        {region === "IT"
                          ? "I compiti sono stati generati in un'altra lingua"
                          : region === "FR"
                          ? "Les tâches ont été générées dans une autre langue"
                          : region === "EN"
                          ? "Tasks were generated in a different language"
                          : "Tätigkeiten wurden in einer anderen Sprache generiert"}
                      </div>
                      <div style={{ fontSize: 13, color: "#48484A" }} className="dark:text-muted-foreground">
                        {region === "IT"
                          ? "Rigenera tramite IA per ottenere denominazioni italiane semanticamente corrette, non una semplice traduzione."
                          : region === "FR"
                          ? "Régénérer via l'IA pour obtenir des intitulés en français sémantiquement corrects — pas une simple traduction."
                          : region === "EN"
                          ? "Regenerate via AI to get semantically correct English task names — not just a translation."
                          : "Über KI neu generieren für inhaltlich korrekte Bezeichnungen — keine reine Übersetzung."}
                      </div>
                    </div>
                    <button
                      onClick={() => generateKompetenzen(true)}
                      data-testid="button-regenerate-region"
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: region === "FR" || region === "EN" || region === "IT" ? "#34C759" : "#007AFF",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {region === "IT" ? "Rigenera in italiano" : region === "FR" ? "Régénérer en français" : region === "EN" ? "Regenerate in English" : "Neu generieren auf Deutsch"}
                    </button>
                  </div>
                )}

                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    padding: isMobile ? "16px 14px" : "28px 32px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                  className="dark:bg-card/40"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: 12,
                      padding: 3,
                      marginBottom: 28,
                    }}
                    data-testid="tabs-taetigkeiten"
                  >
                    {([
                      { key: "haupt" as TaetigkeitKategorie, label: region === "IT" ? "Compiti" : region === "FR" ? "Tâches" : region === "EN" ? "Tasks" : "Tätigkeiten", count: hauptCount },
                      { key: "neben" as TaetigkeitKategorie, label: region === "IT" ? "Competenze umane" : region === "FR" ? "Compétences humaines" : region === "EN" ? "Human competences" : "Humankompetenzen", count: nebenCount },
                      ...(fuehrung !== "Keine" ? [{ key: "fuehrung" as TaetigkeitKategorie, label: region === "IT" ? "Competenze di management" : region === "FR" ? "Compétences de management" : region === "EN" ? "Leadership competences" : "Führungskompetenzen", count: fuehrungCount }] : []),
                    ]).map(tab => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          style={{
                            flex: 1,
                            height: 38,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 14,
                            fontWeight: isActive ? 650 : 500,
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            transition: "background 200ms ease, color 200ms ease",
                            background: isActive ? "rgba(0,113,227,0.08)" : "transparent",
                            color: isActive ? "#0071E3" : "#6E6E73",
                            boxShadow: "none",
                          }}
                          data-testid={`tab-${tab.key}`}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              minWidth: 20,
                              height: 20,
                              borderRadius: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 5px",
                              background: isActive ? "rgba(0,113,227,0.12)" : "rgba(0,0,0,0.06)",
                              color: isActive ? "#0071E3" : "#AEAEB2",
                            }}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    {isGenerating ? (
                      <div className="text-center py-16" data-testid="loading-ki">
                        <div style={{
                          width: 40,
                          height: 40,
                          border: "3px solid rgba(0,113,227,0.15)",
                          borderTopColor: "#0071E3",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          margin: "0 auto 16px",
                        }} />
                        <p style={{ fontSize: 15, color: "#0071E3", fontWeight: 500 }}>
                          {region === "IT" ? `L'IA sta creando il profilo del ruolo per "${beruf}"` : region === "FR" ? `L'IA crée le profil de poste pour « ${beruf} »` : region === "EN" ? `AI is creating role profile for "${beruf}"` : `KI erstellt Stellenprofil für „${beruf}"`}
                        </p>
                        <p style={{ fontSize: 13, color: "#6E6E73", marginTop: 4, marginBottom: 20 }}>
                          {region === "IT" ? "Potrebbero volerci alcuni secondi." : region === "FR" ? "Cela peut prendre quelques secondes." : region === "EN" ? "This may take a few seconds." : "Das kann einige Sekunden dauern."}
                        </p>
                        <div style={{ display: "inline-flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                          {[
                            { label: region === "IT" ? "I compiti vengono creati" : region === "FR" ? "Les tâches sont en cours de création" : region === "EN" ? "Tasks are being created" : "Tätigkeiten werden erstellt", step: 0 },
                            { label: region === "IT" ? "Le competenze umane vengono identificate" : region === "FR" ? "Les compétences humaines sont en cours d'identification" : region === "EN" ? "Human competences are being identified" : "Humankompetenzen werden ermittelt", step: 1 },
                            { label: region === "IT" ? "Le competenze di management vengono analizzate" : region === "FR" ? "Les compétences de management sont en cours d'analyse" : region === "EN" ? "Leadership competences are being analysed" : "Führungskompetenzen werden analysiert", step: 2 },
                          ].map((item) => {
                            const done = generatingStep > item.step;
                            const active = generatingStep === item.step;
                            return (
                              <div
                                key={item.step}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  opacity: active || done ? 1 : 0.35,
                                  transition: "opacity 400ms ease",
                                }}
                                data-testid={`loading-step-${item.step}`}
                              >
                                <div style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: done ? "#34C759" : "transparent",
                                  border: done ? "none" : active ? "2px solid #0071E3" : "2px solid #D1D1D6",
                                  transition: "all 300ms ease",
                                  flexShrink: 0,
                                }}>
                                  {done ? (
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                      <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : active ? (
                                    <div style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      border: "2px solid #0071E3",
                                      borderTopColor: "transparent",
                                      animation: "spin 0.7s linear infinite",
                                    }} />
                                  ) : null}
                                </div>
                                <span style={{
                                  fontSize: 14,
                                  fontWeight: active ? 500 : 400,
                                  color: done ? "#34C759" : active ? "#1D1D1F" : "#8E8E93",
                                  transition: "color 300ms ease",
                                }}>
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </div>
                    ) : filteredTaetigkeiten.length === 0 ? (
                      <div className="text-center py-12">
                        <p style={{ fontSize: 15, color: "#6E6E73" }}>
                          {region === "IT" ? <>Nessun {activeTab === "haupt" ? "compito" : activeTab === "neben" ? "competenza umana" : "competenza di management"} aggiunto per ora.</> : region === "FR" ? <>Aucune {activeTab === "haupt" ? "tâche" : activeTab === "neben" ? "compétence humaine" : "compétence de management"} ajoutée pour l'instant.</> : region === "EN" ? <>No {activeTab === "haupt" ? "tasks" : activeTab === "neben" ? "human competences" : "leadership competences"} added yet.</> : <>Noch keine {activeTab === "haupt" ? "Tätigkeiten" : activeTab === "neben" ? "Humankompetenzen" : "Führungskompetenzen"} hinzugefügt.</>}
                        </p>
                      </div>
                    ) : (
                      filteredTaetigkeiten.map((t, idx) => (
                        <div key={t.id} data-testid={`taetigkeit-${t.id}`}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 16,
                              padding: "20px 0",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 24, gap: 4 }}>
                              <span style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: changedIds.includes(t.id) ? "#D97706" : "#AEAEB2",
                                paddingTop: 2,
                              }}>
                                {idx + 1}.
                              </span>
                              {t.confidence != null && t.confidence < 55 && (
                                <span style={{ color: "#FF3B30", fontSize: 18, fontWeight: 700, lineHeight: 1 }} title={`KI-Konfidenz: ${t.confidence}%`} data-testid={`confidence-warning-${t.id}`}>!</span>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-start justify-between gap-3">
                                <textarea
                                  value={t.name}
                                  onChange={(e) => handleRenameTaetigkeit(t.id, e.target.value)}
                                  rows={2}
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#1D1D1F",
                                    lineHeight: 1.5,
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    padding: 0,
                                    borderBottom: "1px solid transparent",
                                    transition: "border-color 150ms ease",
                                    width: "100%",
                                    resize: "none",
                                    fontFamily: "inherit",
                                  }}
                                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "rgba(0,113,227,0.3)"; }}
                                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
                                  data-testid={`input-taetigkeit-name-${t.id}`}
                                />
                                <button
                                  onClick={() => handleRemoveTaetigkeit(t.id)}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#AEAEB2",
                                    transition: "all 150ms ease",
                                    flexShrink: 0,
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.color = "#FF3B30";
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,48,0.06)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.color = "#AEAEB2";
                                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  }}
                                  data-testid={`remove-taetigkeit-${t.id}`}
                                >
                                  <X style={{ width: 14, height: 14 }} />
                                </button>
                              </div>

                              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "max-content auto", rowGap: 10, columnGap: 8, alignItems: "center" }}>
                                  <span style={{ fontSize: 12, fontWeight: 500, color: "#48484A", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{region === "IT" ? "Ponderazione" : region === "FR" ? "Pondération" : region === "EN" ? "Weighting" : "Gewichtung"}</span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {NIVEAU_OPTIONS.map(n => (
                                      <button
                                        key={n}
                                        onClick={() => handleNiveauChange(t.id, n)}
                                        style={{
                                          height: 28,
                                          paddingLeft: 10,
                                          paddingRight: 10,
                                          fontSize: 12,
                                          fontWeight: 500,
                                          borderRadius: 999,
                                          border: t.niveau === n ? "1.5px solid transparent" : "1px solid rgba(0,0,0,0.15)",
                                          cursor: "pointer",
                                          transition: "all 150ms ease",
                                          background: t.niveau === n ? "linear-gradient(135deg, #6B7280, #9CA3AF)" : "rgba(0,0,0,0.03)",
                                          color: t.niveau === n ? "#FFFFFF" : "#3A3A3C",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                        className={t.niveau !== n ? "hover:bg-muted/40" : ""}
                                        data-testid={`niveau-${t.id}-${n.toLowerCase()}`}
                                      >
                                        {t.niveau === n && <Check style={{ width: 10, height: 10 }} />}
                                        {region === "IT" ? { Niedrig: "Basso", Mittel: "Medio", Hoch: "Alto" }[n] ?? n : region === "FR" ? { Niedrig: "Bas", Mittel: "Moyen", Hoch: "Élevé" }[n] ?? n : region === "EN" ? { Niedrig: "Low", Mittel: "Medium", Hoch: "High" }[n] : n}
                                      </button>
                                    ))}
                                  </div>

                                  <span style={{ fontSize: 12, fontWeight: 500, color: "#48484A", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{region === "IT" ? "Focus" : region === "FR" ? "Priorité" : region === "EN" ? "Focus" : "Schwerpunkt"}</span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {KOMPETENZ_OPTIONS.map(k => (
                                      <button
                                        key={k}
                                        onClick={() => handleKompetenzChange(t.id, k)}
                                        style={{
                                          height: 28,
                                          paddingLeft: 10,
                                          paddingRight: 10,
                                          fontSize: 12,
                                          fontWeight: 600,
                                          borderRadius: 999,
                                          border: t.kompetenz === k ? "1.5px solid transparent" : "1px solid rgba(0,0,0,0.1)",
                                          cursor: "pointer",
                                          transition: "all 150ms ease",
                                          background: t.kompetenz === k ? KOMPETENZ_COLORS[k] : "transparent",
                                          color: t.kompetenz === k ? "#FFFFFF" : KOMPETENZ_COLORS[k],
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                        data-testid={`kompetenz-${t.id}-${k.toLowerCase()}`}
                                      >
                                        {region === "IT" ? { Impulsiv: "Orientato all'azione", Intuitiv: "Relazionale", Analytisch: "Analitico" }[k] ?? k : region === "FR" ? { Impulsiv: "Orienté action", Intuitiv: "Relationnel", Analytisch: "Analytique" }[k] ?? k : region === "EN" ? { Impulsiv: "Action-oriented", Intuitiv: "Relational", Analytisch: "Analytical" }[k] : k}
                                      </button>
                                    ))}
                                  </div>
                              </div>
                            </div>
                          </div>
                          {idx < filteredTaetigkeiten.length - 1 && (
                            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {canAddMore && !isGenerating ? (
                    <div style={{
                      marginTop: 24,
                      paddingTop: 24,
                      borderTop: "1px dashed rgba(0,0,0,0.08)",
                      display: "flex",
                      justifyContent: "center",
                    }}>
                      <button
                        onClick={handleAddTaetigkeit}
                        style={{
                          height: 44,
                          paddingLeft: 24,
                          paddingRight: 24,
                          fontSize: 14,
                          fontWeight: 600,
                          borderRadius: 999,
                          border: "1.5px solid rgba(0,113,227,0.3)",
                          cursor: "pointer",
                          background: "transparent",
                          color: "#0071E3",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 200ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                        data-testid="button-taetigkeit-hinzufuegen"
                      >
                        <Plus style={{ width: 16, height: 16 }} />
                        Neue Tätigkeit hinzufügen
                      </button>
                    </div>
                  ) : null}

                  {!isGenerating && (
                    <p style={{ fontSize: 12, color: "#AEAEB2", textAlign: "center", marginTop: 16 }}>
                      {currentTabCount >= currentTabMax
                        ? region === "IT" ? `Massimo di ${currentTabMax} raggiunto` : region === "FR" ? `Maximum de ${currentTabMax} atteint` : region === "EN" ? `Maximum of ${currentTabMax} reached` : `Maximum von ${currentTabMax} erreicht`
                        : region === "IT" ? `Max. ${currentTabMax} ${activeTab === "haupt" ? "compiti" : activeTab === "neben" ? "competenze umane" : "competenze di management"}` : region === "FR" ? `Max. ${currentTabMax} ${activeTab === "haupt" ? "tâches" : activeTab === "neben" ? "compétences humaines" : "compétences de management"}` : region === "EN" ? `Max. ${currentTabMax} ${activeTab === "haupt" ? "tasks" : activeTab === "neben" ? "human competences" : "leadership competences"}` : `Maximal ${currentTabMax} ${activeTab === "haupt" ? "Tätigkeiten" : activeTab === "neben" ? "Humankompetenzen" : "Führungskompetenzen"}`
                      }
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
                  <div>
                    {changedIds.length > 0 && (
                      <button
                        onClick={handleReclassify}
                        disabled={isReclassifying}
                        className="flex items-center gap-2 text-sm font-medium transition-all"
                        style={{
                          height: 44,
                          paddingLeft: 20,
                          paddingRight: 20,
                          borderRadius: 12,
                          border: "1.5px solid rgba(243,146,0,0.4)",
                          background: "rgba(243,146,0,0.06)",
                          color: "#D97706",
                          cursor: isReclassifying ? "wait" : "pointer",
                          opacity: isReclassifying ? 0.7 : 1,
                        }}
                        data-testid="button-reclassify"
                      >
                        <RefreshCw className={`w-4 h-4 ${isReclassifying ? "animate-spin" : ""}`} />
                        {isReclassifying
                          ? "Wird bewertet..."
                          : `Änderungen neu bewerten (${changedIds.length})`
                        }
                      </button>
                    )}
                  </div>
                  {(() => {
                    const isIncomplete = !beruf || !fuehrung || erfolgsfokusIndices.length === 0 || !aufgabencharakter || !arbeitslogik || taetigkeiten.length === 0;
                    return (
                      <Button
                        className="gap-2"
                        disabled={isIncomplete}
                        style={{
                          height: 52,
                          paddingLeft: 32,
                          paddingRight: 32,
                          fontSize: 16,
                          fontWeight: 600,
                          borderRadius: 14,
                          background: isIncomplete ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, #0071E3, #34AADC)",
                          border: "none",
                          boxShadow: isIncomplete ? "none" : "0 4px 16px rgba(0,113,227,0.3)",
                          color: isIncomplete ? "rgba(0,0,0,0.25)" : "#fff",
                          cursor: isIncomplete ? "not-allowed" : "pointer",
                        }}
                        data-testid="button-step-3-fertig"
                        onClick={() => {
                          setAllCollapsed(true);
                          setEditingFromOverview(false);
                          localStorage.setItem("rollenDnaCompleted", "true");
                        }}
                      >
                        {region === "IT" ? "Alla definizione del ruolo" : region === "FR" ? "Vers la définition du poste" : region === "EN" ? "To role definition" : "zur Stellendefinition"}
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    );
                  })()}
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    padding: isMobile ? "16px 14px" : "28px 32px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    marginTop: 28,
                  }}
                  data-testid="card-biocheck"
                >
                  <button
                    onClick={() => setBioCheckOpen(!bioCheckOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    data-testid="button-biocheck-toggle"
                  >
                    <div className="flex items-center gap-2.5">
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #34C759, #30B350)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <FileText style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                      </div>
                      <span style={{ color: "#1D1D1F", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, flexShrink: 0, color: "#34C759" }}>{region === "IT" ? "Profilo del ruolo:" : region === "FR" ? "Profil du poste :" : region === "EN" ? "Job profile:" : "Kurzprofil der Stelle:"}</span>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{beruf}{fuehrung && fuehrung !== "Keine" ? "" + (region === "IT" ? " con responsabilita' di management" : region === "FR" ? " avec responsabilité de management" : region === "EN" ? " with leadership responsibility" : " mit Führungsverantwortung") : ""}</span>
                      </span>
                    </div>
                    <ChevronDown style={{
                      width: 18,
                      height: 18,
                      color: "#8E8E93",
                      transform: bioCheckOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 300ms ease",
                    }} />
                  </button>

                  {bioCheckOpen && (<>
                    {bioCheckIntroOverride ? (
                      <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginTop: 14, whiteSpace: "pre-line", ...reportTextStyle }} data-testid="text-biocheck-intro">
                        {localizeText(bioCheckIntroOverride)}
                      </p>
                    ) : (<>
                      <div style={{
                        marginTop: 16,
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }} data-testid="card-grundprinzip">
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}><Info style={{ width: 15, height: 15, color: "#1D1D1F", flexShrink: 0 }} />{(region === "IT" ? analysisPrincipleText_IT : region === "FR" ? analysisPrincipleText_FR : region === "EN" ? analysisPrincipleText_EN : analysisPrincipleText).title}</h3>
                        <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, ...reportTextStyle }}>{localizeText((region === "IT" ? analysisPrincipleText_IT : region === "FR" ? analysisPrincipleText_FR : region === "EN" ? analysisPrincipleText_EN : analysisPrincipleText).body.join(" "))}</p>
                      </div>

                      <div style={{
                        marginTop: 14,
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }} data-testid="card-anforderungsprofil">
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}><ClipboardList style={{ width: 15, height: 15, color: "#1D1D1F", flexShrink: 0 }} />{region === "IT" ? "Profilo dei requisiti del ruolo" : region === "FR" ? "Profil d'exigences du poste" : region === "EN" ? "Requirements profile of the role" : "Anforderungsprofil der Stelle"}</h3>
                        <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: "0 0 14px 0", ...reportTextStyle }}>
                          {localizeText((region === "IT" ? roleRequirementText_IT : region === "FR" ? roleRequirementText_FR : region === "EN" ? roleRequirementText_EN : roleRequirementText).intro.join(" "))}
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
                          {[
                            { label: region === "IT" ? "Orientato all'azione" : region === "FR" ? "Orienté action" : region === "EN" ? "Action-oriented" : "Impulsiv", color: "#C41E3A", bg: "rgba(196,30,58,0.05)", border: "rgba(196,30,58,0.12)", desc: region === "IT" ? "Attuazione, decisione e responsabilita' dei risultati" : region === "FR" ? "Exécution, décisions et responsabilité des résultats" : region === "EN" ? "Execution, decisions and accountability for results" : "Umsetzung, Entscheidung und Ergebnisverantwortung" },
                            { label: region === "IT" ? "Relazionale" : region === "FR" ? "Relationnel" : region === "EN" ? "Relational" : "Intuitiv", color: "#F39200", bg: "rgba(243,146,0,0.05)", border: "rgba(243,146,0,0.12)", desc: region === "IT" ? "Collaborazione e azione contestualizzata" : region === "FR" ? "Collaboration et action adaptée au contexte" : region === "EN" ? "Collaboration and context-aware action" : "Zusammenarbeit und kontextbezogenes Handeln" },
                            { label: region === "IT" ? "Analitico" : region === "FR" ? "Analytique" : region === "EN" ? "Analytical" : "Analytisch", color: "#1A5DAB", bg: "rgba(26,93,171,0.05)", border: "rgba(26,93,171,0.12)", desc: region === "IT" ? "Struttura, pianificazione e precisione tecnica" : region === "FR" ? "Structure, planification et précision technique" : region === "EN" ? "Structure, planning and technical precision" : "Struktur, Planung und fachliche Präzision" },
                          ].map(d => (
                            <div key={d.label} style={{
                              background: d.bg,
                              border: `1px solid ${d.border}`,
                              borderRadius: 10,
                              padding: "10px 12px",
                            }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: d.color, margin: "0 0 4px 0" }}>{d.label}</p>
                              <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.5, margin: 0, hyphens: "auto", WebkitHyphens: "auto", wordBreak: "break-word" }}>{localizeText(d.desc)}</p>
                            </div>
                          ))}
                        </div>

                      </div>
                    </>)}

                    {(() => {
                      const analysis = getRoleAnalysis(bioGramGesamt.imp, bioGramGesamt.int, bioGramGesamt.ana);
                      const rt = getRoleResultEntry(analysis.resultKey, region);
                      return (
                        <div style={{
                          marginTop: 14,
                          padding: "16px 18px",
                          borderRadius: 14,
                          background: "#FFFFFF",
                          border: "1px solid rgba(0,0,0,0.06)",
                        }} data-testid="box-biocheck-description">
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}><Lightbulb style={{ width: 15, height: 15, color: "#1D1D1F", flexShrink: 0 }} />{region === "IT" ? "Risultato dell'analisi" : region === "FR" ? "Résultat de l'analyse" : region === "EN" ? "Result of the analysis" : "Ergebnis der Analyse"}</h3>
                          <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, ...reportTextStyle }} data-testid="text-biocheck-body">
                            {localizeText([...rt.body, ...(isLeadershipRole ? [rt.leadership] : [])].join(" "))}
                          </p>
                        </div>
                      );
                    })()}

                    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 16 }}>
                      {[
                        { title: region === "IT" ? "Attivita'" : region === "FR" ? "Activités" : region === "EN" ? "Activities" : "Tätigkeiten", key: "haupttaetigkeiten", data: bioGramHaupt, icon: Briefcase },
                        { title: region === "IT" ? "Competenze umane" : region === "FR" ? "Compétences humaines" : region === "EN" ? "Human competences" : "Humankompetenzen", key: "humankompetenzen", data: bioGramNeben, icon: Heart },
                        { title: region === "IT" ? "Condizioni quadro del ruolo" : region === "FR" ? "Conditions-cadres du poste" : region === "EN" ? "Role framework conditions" : "Rahmenbedingungen der Stelle", key: "rahmenbedingungen", data: bioGramRahmen, icon: Settings },
                        ...(isLeadershipRole ? [{ title: region === "IT" ? "Competenze di management" : region === "FR" ? "Compétences de management" : region === "EN" ? "Leadership competences" : "Führungskompetenzen", key: "fuehrungskompetenzen", data: bioGramFuehrung, icon: Shield }] : []),
                      ].map((section) => (
                        <div
                          key={section.key}
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            borderRadius: 14,
                            padding: "16px 18px",
                            border: "1px solid rgba(0,0,0,0.04)",
                          }}
                          data-testid={`biocheck-section-${section.key}`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <section.icon style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                              {section.title}
                            </p>
                          </div>
                          {[
                            { label: region === "IT" ? "Orientato all'azione" : region === "FR" ? "Orienté action" : region === "EN" ? "Action-oriented" : "Impulsiv", color: "#C41E3A", value: section.data.imp },
                            { label: region === "IT" ? "Relazionale" : region === "FR" ? "Relationnel" : region === "EN" ? "Relational" : "Intuitiv", color: "#F39200", value: section.data.int },
                            { label: region === "IT" ? "Analitico" : region === "FR" ? "Analytique" : region === "EN" ? "Analytical" : "Analytisch", color: "#1A5DAB", value: section.data.ana },
                          ].map((bar) => (
                            <div
                              key={bar.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <span style={{
                                fontSize: 12,
                                color: "#48484A",
                                width: 62,
                                flexShrink: 0,
                              }}>
                                {bar.label}
                              </span>
                              <div style={{
                                flex: 1,
                                height: 24,
                                borderRadius: 12,
                                background: "rgba(0,0,0,0.04)",
                                position: "relative",
                                overflow: "visible",
                              }}>
                                <div style={{
                                  position: "absolute", left: 0, top: 0, bottom: 0,
                                  width: bar.value === 0 ? "0%" : `${Math.max(bar.value, 4)}%`,
                                  borderRadius: 12,
                                  background: bar.color,
                                  transition: "width 600ms ease",
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 8,
                                  minWidth: bar.value === 0 ? 0 : (bar.value < 13 ? 8 : 44),
                                }}>
                                  {bar.value >= 13 && <span style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {Math.round(bar.value)}%
                                  </span>}
                                </div>
                                {bar.value < 13 && <span style={{
                                  position: "absolute",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  left: bar.value === 0 ? 12 : `calc(${Math.max(bar.value, 4)}% + 8px)`,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#48484A",
                                  whiteSpace: "nowrap",
                                }}>
                                  {Math.round(bar.value)}%
                                </span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.02)",
                        borderRadius: 14,
                        padding: "16px 18px",
                        border: "1px solid rgba(0,0,0,0.04)",
                        marginTop: 16,
                      }}
                      data-testid="biocheck-section-gesamt"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <BarChart3 style={{ width: 16, height: 16, color: "#6E6E73", strokeWidth: 1.8 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                          {region === "IT" ? "Profilo complessivo dei requisiti del ruolo" : region === "FR" ? "Profil global des exigences du poste" : region === "EN" ? "Overall role requirements profile" : "Gesamtprofil der Stellenanforderung"}
                        </p>
                      </div>
                      {(() => {
                        const bars = [
                          { label: region === "IT" ? "Orientato all'azione" : region === "FR" ? "Orienté action" : region === "EN" ? "Action-oriented" : "Impulsiv", color: "#C41E3A", value: bioGramGesamt.imp },
                          { label: region === "IT" ? "Relazionale" : region === "FR" ? "Relationnel" : region === "EN" ? "Relational" : "Intuitiv", color: "#F39200", value: bioGramGesamt.int },
                          { label: region === "IT" ? "Analitico" : region === "FR" ? "Analytique" : region === "EN" ? "Analytical" : "Analytisch", color: "#1A5DAB", value: bioGramGesamt.ana },
                        ];
                        return (
                          <div style={{ background: "#F0F0F2", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                            {bars.map((bar) => {
                              const widthPct = (bar.value / 67) * 100;
                              return (
                                <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>
                                    {bar.label}
                                  </span>
                                  <div style={{ flex: 1, position: "relative", height: 26 }}>
                                    <div style={{ position: "absolute", inset: 0, borderRadius: 13, background: "rgba(0,0,0,0.06)" }} />
                                    <div style={{
                                      position: "absolute", left: 0, top: 0, bottom: 0,
                                      width: bar.value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 4), 100)}%`,
                                      borderRadius: 13, background: bar.color,
                                      transition: "width 600ms ease",
                                      display: "flex", alignItems: "center", paddingLeft: 10,
                                      minWidth: bar.value === 0 ? 0 : (bar.value < 13 ? 8 : 50),
                                    }}>
                                      {bar.value > 0 && bar.value >= 13 && <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{Math.round(bar.value)} %</span>}
                                    </div>
                                    {bar.value < 13 && <span style={{ position: "absolute", left: `calc(${bar.value === 0 ? 0 : Math.min(Math.max(widthPct, 4), 100)}% + 8px)`, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#48484A", whiteSpace: "nowrap" }}>{Math.round(bar.value)} %</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </>)}
                </div>
              </div>
            ) : (
              <LockedStep step={3} title={region === "IT" ? "Compiti e competenze" : region === "FR" ? "Tâches et compétences" : region === "EN" ? "Tasks & competencies" : "Tätigkeiten & Kompetenzen"} />
            )}

            {allCollapsed && (
              <>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 20,
                  padding: "20px 32px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
                className="dark:bg-card/40"
              >
                <button
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: summaryOpen ? 16 : 0,
                  }}
                  data-testid="button-summary-toggle"
                >
                  <div className="flex items-center gap-2.5">
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "linear-gradient(135deg, #34C759, #30D158)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Briefcase style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                    </div>
                    <span style={{ color: "#1D1D1F", display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, flexShrink: 0, color: "#34C759" }}>{region === "IT" ? "Definizione del ruolo:" : region === "FR" ? "Définition du poste :" : region === "EN" ? "Role definition:" : "Stellendefinition:"}</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{beruf}{fuehrung && fuehrung !== "Keine" ? (region === "IT" ? " con responsabilita' di management" : region === "FR" ? " avec responsabilité de management" : region === "EN" ? " with leadership responsibility" : " mit Führungsverantwortung") : ""}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setAllCollapsed(false);
                        setCurrentStep(4);
                        setSummaryOpen(false);
                        localStorage.removeItem("rollenDnaCompleted");
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        color: "#007AFF", fontSize: 14, fontWeight: 500,
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}
                      data-testid="button-summary-edit"
                    >
                      <Pencil style={{ width: 14, height: 14 }} />
                      {region === "IT" ? "Modifica" : region === "FR" ? "Modifier" : region === "EN" ? "Edit" : "Bearbeiten"}
                    </span>
                    <ChevronDown style={{
                      width: 18,
                      height: 18,
                      color: "#8E8E93",
                      transform: summaryOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 300ms ease",
                    }} />
                  </div>
                </button>

                {summaryOpen && (
                  <>
                
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }} data-testid="dna-summary-grid">
                  {(() => { const _ro = getRegionOptions(region); return [
                    { icon: Briefcase, label: region === "IT" ? "Ruolo / Titolo" : region === "FR" ? "Poste / Titre" : region === "EN" ? "Role / title" : "Stelle / Bezeichnung", value: beruf },
                    { icon: LayoutGrid, label: region === "IT" ? "Struttura dei compiti" : region === "FR" ? "Structure des tâches" : region === "EN" ? "Task structure" : "Aufgabenstruktur", value: _ro.aufgaben.find(o => o.value === aufgabencharakter)?.label || aufgabencharakter },
                    { icon: Wrench, label: region === "IT" ? "Stile lavorativo" : region === "FR" ? "Style de travail" : region === "EN" ? "Working style" : "Arbeitsweise", value: _ro.arbeit.find(o => o.value === arbeitslogik)?.label || arbeitslogik },
                    { icon: Target, label: region === "IT" ? "Focus di successo" : region === "FR" ? "Priorité de réussite" : region === "EN" ? "Success focus" : "Erfolgsfokus", value: erfolgsfokusIndices.map(i => _ro.erfolg[i]?.label).filter(Boolean).join(", ") },
                    { icon: UserCheck, label: region === "IT" ? "Management" : region === "FR" ? "Management" : region === "EN" ? "Leadership" : "Führung", value: _ro.fuehrung.find(o => o.value === fuehrung)?.label || fuehrung },
                  ]; })().map(card => (
                    <div
                      key={card.label}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }}
                      data-testid={`summary-${card.label.toLowerCase()}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        <card.icon style={{ width: 14, height: 14, color: "#8E8E93", flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>{card.label}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.5, paddingLeft: 21 }}>{card.value}</p>
                    </div>
                  ))}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid rgba(0,0,0,0.04)",
                    }}
                    data-testid="summary-kompetenzanzahl"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <Hash style={{ width: 14, height: 14, color: "#8E8E93", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>{region === "IT" ? "Numero di compiti e competenze" : region === "FR" ? "Nombre de tâches et compétences" : region === "EN" ? "Tasks / competency count" : "Tätigkeits-/Kompetenzanzahl"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, paddingLeft: 21, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, color: "#48484A" }}><strong style={{ color: "#1D1D1F" }}>{hauptCount}</strong> {region === "IT" ? "compiti" : region === "FR" ? "tâches" : region === "EN" ? "tasks" : "Tätigkeiten"}</span>
                      <span style={{ fontSize: 14, color: "#48484A" }}><strong style={{ color: "#1D1D1F" }}>{nebenCount}</strong> {region === "IT" ? "competenze umane" : region === "FR" ? "compétences humaines" : region === "EN" ? "human skills" : "Humankompetenzen"}</span>
                      {fuehrung !== "Keine" && <span style={{ fontSize: 14, color: "#48484A" }}><strong style={{ color: "#1D1D1F" }}>{fuehrungCount}</strong> {region === "IT" ? "management" : region === "FR" ? "management" : region === "EN" ? "leadership" : "Führung"}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
                  <button
                    onClick={() => {
                      setAllCollapsed(false);
                      setCurrentStep(4);
                      localStorage.removeItem("rollenDnaCompleted");
                    }}
                    style={{
                      height: 48,
                      paddingLeft: 24,
                      paddingRight: 24,
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 14,
                      border: "1.5px solid #0071E3",
                      cursor: "pointer",
                      background: "transparent",
                      color: "#0071E3",
                      transition: "all 200ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      justifyContent: "center",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                    data-testid="button-rolle-bearbeiten"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {region === "IT" ? "Modifica il profilo del ruolo" : region === "FR" ? "Modifier le profil du poste" : region === "EN" ? "Edit role profile" : "Stellenprofil ändern"}
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      height: 48,
                      paddingLeft: 24,
                      paddingRight: 24,
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 14,
                      border: "1.5px solid #0071E3",
                      cursor: "pointer",
                      background: "transparent",
                      color: "#0071E3",
                      transition: "all 200ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      justifyContent: "center",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                    data-testid="button-profil-speichern"
                  >
                    <Save className="w-4 h-4" />
                    {region === "IT" ? "Salva il profilo del ruolo" : region === "FR" ? "Enregistrer le profil du poste" : region === "EN" ? "Save role profile" : "Stellenprofil speichern"}
                  </button>
                  <button
                    onClick={() => setLocation("/bericht")}
                    style={{
                      height: 48,
                      paddingLeft: 28,
                      paddingRight: 28,
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 14,
                      border: "none",
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #0071E3, #34AADC)",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
                      transition: "all 200ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      justifyContent: "center",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)";
                    }}
                    data-testid="button-entscheidungsbericht"
                  >
                    <FileText className="w-4 h-4" />
                    {region === "IT" ? "Genera il rapporto decisionale" : region === "FR" ? "Générer le rapport de décision" : region === "EN" ? "Generate decision report" : "Entscheidungsbericht erstellen"}
                  </button>
                </div>
                  </>
                )}
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 20,
                  padding: "20px 32px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  marginTop: 24,
                }}
                data-testid="card-biocheck-collapsed"
              >
                <button
                  onClick={() => setBioCheckOpen(!bioCheckOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  data-testid="button-biocheck-collapsed-toggle"
                >
                  <div className="flex items-center gap-2.5">
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #34C759, #30D158)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Lightbulb style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                    </div>
                    <span style={{ color: "#1D1D1F", display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, flexShrink: 0, color: "#34C759" }}>{region === "IT" ? "Profilo del ruolo:" : region === "FR" ? "Profil du poste :" : region === "EN" ? "Job profile:" : "Kurzprofil der Stelle:"}</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{beruf}{fuehrung && fuehrung !== "Keine" ? "" + (region === "IT" ? " con responsabilita' di management" : region === "FR" ? " avec responsabilité de management" : region === "EN" ? " with leadership responsibility" : " mit Führungsverantwortung") : ""}</span>
                    </span>
                  </div>
                  <ChevronDown style={{
                    width: 18,
                    height: 18,
                    color: "#8E8E93",
                    transform: bioCheckOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 300ms ease",
                  }} />
                </button>

                {bioCheckOpen && (<>
                  {bioCheckIntroOverride ? (
                    <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.8, marginTop: 14, whiteSpace: "pre-line", ...reportTextStyle }} data-testid="text-biocheck-intro-collapsed">
                      {localizeText(bioCheckIntroOverride)}
                    </p>
                  ) : (<>
                    <div style={{
                      marginTop: 16,
                      padding: "16px 18px",
                      borderRadius: 14,
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }} data-testid="card-grundprinzip-collapsed">
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}><Info style={{ width: 15, height: 15, color: "#1D1D1F", flexShrink: 0 }} />{(region === "IT" ? analysisPrincipleText_IT : region === "FR" ? analysisPrincipleText_FR : region === "EN" ? analysisPrincipleText_EN : analysisPrincipleText).title}</h3>
                      <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, ...reportTextStyle }}>{localizeText((region === "IT" ? analysisPrincipleText_IT : region === "FR" ? analysisPrincipleText_FR : region === "EN" ? analysisPrincipleText_EN : analysisPrincipleText).body.join(" "))}</p>
                    </div>

                    <div style={{
                      marginTop: 14,
                      padding: "16px 18px",
                      borderRadius: 14,
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }} data-testid="card-anforderungsprofil-collapsed">
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}><ClipboardList style={{ width: 15, height: 15, color: "#1D1D1F", flexShrink: 0 }} />{region === "IT" ? "Profilo dei requisiti del ruolo" : region === "FR" ? "Profil d'exigences du poste" : region === "EN" ? "Requirements profile of the role" : "Anforderungsprofil der Stelle"}</h3>
                      <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: "0 0 14px 0", ...reportTextStyle }}>
                        {localizeText((region === "IT" ? roleRequirementText_IT : region === "FR" ? roleRequirementText_FR : region === "EN" ? roleRequirementText_EN : roleRequirementText).intro.join(" "))}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
                        {[
                          { label: region === "IT" ? "Orientato all'azione" : region === "FR" ? "Orienté action" : region === "EN" ? "Action-oriented" : "Impulsiv", color: "#C41E3A", bg: "rgba(196,30,58,0.05)", border: "rgba(196,30,58,0.12)", desc: region === "IT" ? "Attuazione, decisione e responsabilita' dei risultati" : region === "FR" ? "Exécution, décisions et responsabilité des résultats" : region === "EN" ? "Execution, decisions and accountability for results" : "Umsetzung, Entscheidung und Ergebnisverantwortung" },
                          { label: region === "IT" ? "Relazionale" : region === "FR" ? "Relationnel" : region === "EN" ? "Relational" : "Intuitiv", color: "#F39200", bg: "rgba(243,146,0,0.05)", border: "rgba(243,146,0,0.12)", desc: region === "IT" ? "Collaborazione e azione contestualizzata" : region === "FR" ? "Collaboration et action adaptée au contexte" : region === "EN" ? "Collaboration and context-aware action" : "Zusammenarbeit und kontextbezogenes Handeln" },
                          { label: region === "IT" ? "Analitico" : region === "FR" ? "Analytique" : region === "EN" ? "Analytical" : "Analytisch", color: "#1A5DAB", bg: "rgba(26,93,171,0.05)", border: "rgba(26,93,171,0.12)", desc: region === "IT" ? "Struttura, pianificazione e precisione tecnica" : region === "FR" ? "Structure, planification et précision technique" : region === "EN" ? "Structure, planning and technical precision" : "Struktur, Planung und fachliche Präzision" },
                        ].map(d => (
                          <div key={d.label} style={{
                            background: d.bg,
                            border: `1px solid ${d.border}`,
                            borderRadius: 10,
                            padding: "10px 12px",
                          }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: d.color, margin: "0 0 4px 0" }}>{d.label}</p>
                            <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.5, margin: 0, hyphens: "auto", WebkitHyphens: "auto", wordBreak: "break-word" }}>{localizeText(d.desc)}</p>
                          </div>
                        ))}
                      </div>

                      <p lang="de" style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, margin: "12px 0 0 0", ...reportTextStyle }}>{localizeText((region === "IT" ? roleRequirementText_IT : region === "FR" ? roleRequirementText_FR : region === "EN" ? roleRequirementText_EN : roleRequirementText).outro)}</p>
                    </div>
                  </>)}

                  {(() => {
                    const analysis = getRoleAnalysis(bioGramGesamt.imp, bioGramGesamt.int, bioGramGesamt.ana);
                    const rt = getRoleResultEntry(analysis.resultKey, region);
                    return (
                      <div style={{
                        marginTop: 14,
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }} data-testid="box-biocheck-description-collapsed">
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}><Lightbulb style={{ width: 15, height: 15, color: "#1D1D1F", flexShrink: 0 }} />{region === "IT" ? "Risultato dell'analisi" : region === "FR" ? "Résultat de l'analyse" : region === "EN" ? "Result of the analysis" : "Ergebnis der Analyse"}</h3>
                        <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, ...reportTextStyle }} data-testid="text-biocheck-collapsed-body">
                          {localizeText([...rt.body, ...(isLeadershipRole ? [rt.leadership] : [])].join(" "))}
                        </p>
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 16 }}>
                      {[
                        { title: region === "IT" ? "Attivita'" : region === "FR" ? "Activités" : region === "EN" ? "Activities" : "Tätigkeiten", key: "haupttaetigkeiten", data: bioGramHaupt, icon: Briefcase },
                        { title: region === "IT" ? "Competenze umane" : region === "FR" ? "Compétences humaines" : region === "EN" ? "Human competences" : "Humankompetenzen", key: "humankompetenzen", data: bioGramNeben, icon: Heart },
                        { title: region === "IT" ? "Condizioni quadro del ruolo" : region === "FR" ? "Conditions-cadres du poste" : region === "EN" ? "Role framework conditions" : "Rahmenbedingungen der Stelle", key: "rahmenbedingungen", data: bioGramRahmen, icon: Settings },
                        ...(isLeadershipRole ? [{ title: region === "IT" ? "Competenze di management" : region === "FR" ? "Compétences de management" : region === "EN" ? "Leadership competences" : "Führungskompetenzen", key: "fuehrungskompetenzen", data: bioGramFuehrung, icon: Shield }] : []),
                      ].map((section) => (
                        <div
                          key={section.key}
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            borderRadius: 14,
                            padding: "16px 18px",
                            border: "1px solid rgba(0,0,0,0.04)",
                          }}
                          data-testid={`biocheck-collapsed-${section.key}`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <section.icon style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                              {section.title}
                            </p>
                          </div>
                          {[
                            { label: region === "IT" ? "Orientato all'azione" : region === "FR" ? "Orienté action" : region === "EN" ? "Action-oriented" : "Impulsiv", color: "#C41E3A", value: section.data.imp },
                            { label: region === "IT" ? "Relazionale" : region === "FR" ? "Relationnel" : region === "EN" ? "Relational" : "Intuitiv", color: "#F39200", value: section.data.int },
                            { label: region === "IT" ? "Analitico" : region === "FR" ? "Analytique" : region === "EN" ? "Analytical" : "Analytisch", color: "#1A5DAB", value: section.data.ana },
                          ].map((bar) => (
                            <div
                              key={bar.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <span style={{
                                fontSize: 12,
                                color: "#48484A",
                                width: 62,
                                flexShrink: 0,
                              }}>
                                {bar.label}
                              </span>
                              <div style={{
                                flex: 1,
                                height: 24,
                                borderRadius: 12,
                                background: "rgba(0,0,0,0.04)",
                                position: "relative",
                                overflow: "visible",
                              }}>
                                <div style={{
                                  position: "absolute", left: 0, top: 0, bottom: 0,
                                  width: bar.value === 0 ? "0%" : `${Math.max(bar.value, 4)}%`,
                                  borderRadius: 12,
                                  background: bar.color,
                                  transition: "width 600ms ease",
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 8,
                                  minWidth: bar.value === 0 ? 0 : (bar.value < 13 ? 8 : 44),
                                }}>
                                  {bar.value >= 13 && <span style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {Math.round(bar.value)}%
                                  </span>}
                                </div>
                                {bar.value < 13 && <span style={{
                                  position: "absolute",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  left: bar.value === 0 ? 12 : `calc(${Math.max(bar.value, 4)}% + 8px)`,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#48484A",
                                  whiteSpace: "nowrap",
                                }}>
                                  {Math.round(bar.value)}%
                                </span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.02)",
                        borderRadius: 14,
                        padding: "16px 18px",
                        border: "1px solid rgba(0,0,0,0.04)",
                        marginTop: 16,
                      }}
                      data-testid="biocheck-collapsed-gesamt"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <BarChart3 style={{ width: 16, height: 16, color: "#6E6E73", strokeWidth: 1.8 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                          {region === "IT" ? "Profilo complessivo dei requisiti del ruolo" : region === "FR" ? "Profil global des exigences du poste" : region === "EN" ? "Overall role requirements profile" : "Gesamtprofil der Stellenanforderung"}
                        </p>
                      </div>
                      {(() => {
                        const bars = [
                          { label: region === "IT" ? "Orientato all'azione" : region === "FR" ? "Orienté action" : region === "EN" ? "Action-oriented" : "Impulsiv", color: "#C41E3A", value: bioGramGesamt.imp },
                          { label: region === "IT" ? "Relazionale" : region === "FR" ? "Relationnel" : region === "EN" ? "Relational" : "Intuitiv", color: "#F39200", value: bioGramGesamt.int },
                          { label: region === "IT" ? "Analitico" : region === "FR" ? "Analytique" : region === "EN" ? "Analytical" : "Analytisch", color: "#1A5DAB", value: bioGramGesamt.ana },
                        ];
                        return (
                          <div style={{ background: "#F0F0F2", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                            {bars.map((bar) => {
                              const widthPct = (bar.value / 67) * 100;
                              return (
                                <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0 }}>
                                    {bar.label}
                                  </span>
                                  <div style={{ flex: 1, position: "relative", height: 26 }}>
                                    <div style={{ position: "absolute", inset: 0, borderRadius: 13, background: "rgba(0,0,0,0.06)" }} />
                                    <div style={{
                                      position: "absolute", left: 0, top: 0, bottom: 0,
                                      width: bar.value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 4), 100)}%`,
                                      borderRadius: 13, background: bar.color,
                                      transition: "width 600ms ease",
                                      display: "flex", alignItems: "center", paddingLeft: 10,
                                      minWidth: bar.value === 0 ? 0 : (bar.value < 13 ? 8 : 50),
                                    }}>
                                      {bar.value > 0 && bar.value >= 13 && <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{Math.round(bar.value)} %</span>}
                                    </div>
                                    {bar.value < 13 && <span style={{ position: "absolute", left: `calc(${bar.value === 0 ? 0 : Math.min(Math.max(widthPct, 4), 100)}% + 8px)`, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "#48484A", whiteSpace: "nowrap" }}>{Math.round(bar.value)} %</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </>)}
              </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
    </>
  );
}
