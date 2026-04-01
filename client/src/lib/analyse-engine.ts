type Taetigkeit = {
  name: string;
  kategorie: string;
  kompetenz: string;
  niveau: string;
};

type AnalyseResult = {
  bereich1: string;
  bereich2: string;
  bereich3: string;
};

function countByKompetenz(items: Taetigkeit[]): { imp: number; int: number; ana: number } {
  let imp = 0, int = 0, ana = 0;
  for (const t of items) {
    if (t.kompetenz === "Impulsiv") imp++;
    else if (t.kompetenz === "Intuitiv") int++;
    else ana++;
  }
  return { imp, int, ana };
}

function dominantLabel(counts: { imp: number; int: number; ana: number }): string {
  const { imp, int, ana } = counts;
  if (imp > int && imp > ana) return "Handlungs- und Umsetzungskompetenz (Impulsiv)";
  if (int > imp && int > ana) return "Sozial- und Beziehungskompetenz (Intuitiv)";
  if (ana > imp && ana > int) return "Fach- und Methodenkompetenz (Analytisch)";
  if (imp === int && imp > ana) return "Handlungs- und Beziehungskompetenz (Impulsiv-Intuitiv)";
  if (imp === ana && imp > int) return "Handlungs- und Fachkompetenz (Impulsiv-Analytisch)";
  if (int === ana && int > imp) return "Beziehungs- und Fachkompetenz (Intuitiv-Analytisch)";
  return "allen drei Kompetenzbereichen gleichmässig";
}

function shortLabel(k: string): string {
  if (k === "Impulsiv") return "Umsetzungsstärke";
  if (k === "Intuitiv") return "Beziehungsfähigkeit";
  return "Strukturkompetenz";
}

export function generateAnalyseLocal(params: {
  beruf: string;
  fuehrung: string;
  erfolgsfokus: string;
  aufgabencharakter: string;
  arbeitslogik: string;
  taetigkeiten: Taetigkeit[];
}): AnalyseResult {
  const { beruf, fuehrung, erfolgsfokus, aufgabencharakter, arbeitslogik, taetigkeiten } = params;
  const haupt = taetigkeiten.filter(t => t.kategorie === "haupt");
  const neben = taetigkeiten.filter(t => t.kategorie === "neben");
  const fuehrungItems = taetigkeiten.filter(t => t.kategorie === "fuehrung");
  const isLeadership = fuehrung && fuehrung !== "Keine";

  const hauptCounts = countByKompetenz(haupt);
  const nebenCounts = countByKompetenz(neben);
  const allCounts = countByKompetenz(taetigkeiten);
  const hochItems = taetigkeiten.filter(t => t.niveau === "Hoch");
  const hochHaupt = haupt.filter(t => t.niveau === "Hoch");
  const hochNeben = neben.filter(t => t.niveau === "Hoch");

  const domAll = dominantLabel(allCounts);
  const domHaupt = dominantLabel(hauptCounts);

  const total = allCounts.imp + allCounts.int + allCounts.ana;
  const impPct = total > 0 ? Math.round((allCounts.imp / total) * 100) : 33;
  const intPct = total > 0 ? Math.round((allCounts.int / total) * 100) : 33;
  const anaPct = total > 0 ? 100 - impPct - intPct : 34;

  const isBalanced = Math.abs(impPct - intPct) <= 10 && Math.abs(impPct - anaPct) <= 10;

  let bereich1: string;
  if (isBalanced) {
    bereich1 = `Die Kompetenzverteilung der Rolle ${beruf} zeigt ein ausgeglichenes Profil. Alle drei Kompetenzbereiche sind nahezu gleichmässig vertreten (Impulsiv ${impPct}%, Intuitiv ${intPct}%, Analytisch ${anaPct}%). Dies deutet auf eine vielseitige Rolle hin, die keine einzelne Arbeitslogik klar dominiert. `;
    bereich1 += aufgabencharakter ? `Der Aufgabencharakter ist ${aufgabencharakter.toLowerCase()}, ` : "";
    bereich1 += arbeitslogik ? `die Arbeitslogik ${arbeitslogik.toLowerCase()}. ` : "";
    bereich1 += `Für die Besetzung bedeutet das: Gesucht wird eine Persönlichkeit mit breiter Kompetenz, die situativ zwischen verschiedenen Arbeitslogiken wechseln kann. Einseitige Spezialisierung wäre für diese Rolle problematisch.`;
  } else {
    bereich1 = `Die Kompetenzverteilung der Rolle ${beruf} ist geprägt durch ${domAll}. Mit einer Verteilung von Impulsiv ${impPct}%, Intuitiv ${intPct}% und Analytisch ${anaPct}% zeigt sich eine erkennbare Schwerpunktsetzung. `;
    bereich1 += aufgabencharakter ? `Der Aufgabencharakter ist ${aufgabencharakter.toLowerCase()}. ` : "";
    bereich1 += arbeitslogik ? `Die Arbeitslogik ist ${arbeitslogik.toLowerCase()}. ` : "";
    bereich1 += `Diese Verteilung passt zu einer Rolle, die primär ${allCounts.imp >= allCounts.int && allCounts.imp >= allCounts.ana ? "über Umsetzung und Entscheidungsstärke" : allCounts.int >= allCounts.imp && allCounts.int >= allCounts.ana ? "über Beziehungsgestaltung und Teamarbeit" : "über fachliche Tiefe und strukturiertes Vorgehen"} wirksam wird. `;
    if (isLeadership) {
      bereich1 += `Als ${fuehrung} verstärkt sich die Bedeutung der dominanten Kompetenz, da sie den Führungsstil und die Teamsteuerung direkt beeinflusst.`;
    } else {
      bereich1 += `Das Gesamtanforderungsniveau ist ${hochItems.length >= 4 ? "hoch" : hochItems.length >= 2 ? "mittel" : "moderat"}, gemessen an der Anzahl der hochpriorisierten Tätigkeiten.`;
    }
  }

  let bereich2: string;
  if (hochItems.length > 0) {
    const hochNamen = hochItems.slice(0, 4).map(t => t.name).join(", ");
    const hochKompetenz = countByKompetenz(hochItems);
    const hochDom = dominantLabel(hochKompetenz);
    bereich2 = `Die kritischen Anforderungen der Rolle konzentrieren sich auf: ${hochNamen}. Diese Tätigkeiten wurden als besonders erfolgskritisch eingestuft und erfordern eine individuelle Eignungsprüfung. `;
    bereich2 += `Die hochpriorisierten Anforderungen liegen schwerpunktmässig im Bereich ${hochDom}. `;
    if (hochItems.length >= 3) {
      bereich2 += `Die Kombination von ${hochItems.length} hochkritischen Tätigkeiten macht das Anforderungsprofil besonders anspruchsvoll. `;
    }
    if (erfolgsfokus) {
      bereich2 += `Im Kontext des Erfolgsfokus (${erfolgsfokus}) wird deutlich, dass vor allem ${hochItems[0].name} (${shortLabel(hochItems[0].kompetenz)}) und ${hochItems.length > 1 ? hochItems[1].name : "die weiteren Kernkompetenzen"} die entscheidenden Leistungshebel sind. `;
    }
    bereich2 += `Für die Besetzung sind diese Kompetenzen nicht verhandelbar. Fehlende Passung in einem dieser Bereiche wirkt sich unmittelbar auf die Rollenleistung aus.`;
  } else {
    bereich2 = `Die Tätigkeitsanforderungen der Rolle ${beruf} verteilen sich auf Standardniveau. Keine einzelne Tätigkeit wurde als besonders kritisch eingestuft, was auf ein breites, aber nicht hochspezialisiertes Anforderungsprofil hinweist. `;
    bereich2 += `Die Haupttätigkeiten sind geprägt durch ${domHaupt}. `;
    if (erfolgsfokus) {
      bereich2 += `Der Erfolgsfokus liegt auf ${erfolgsfokus}. `;
    }
    bereich2 += `Für die Besetzung bedeutet das: Die Rolle verlangt solide Grundkompetenzen in allen relevanten Bereichen, aber keine extreme Spezialisierung.`;
  }

  let bereich3: string;
  const schwachBereich = allCounts.imp <= allCounts.int && allCounts.imp <= allCounts.ana ? "Umsetzungsstärke (Impulsiv)" : allCounts.int <= allCounts.imp && allCounts.int <= allCounts.ana ? "Beziehungskompetenz (Intuitiv)" : "Strukturkompetenz (Analytisch)";
  bereich3 = `Bei der Besetzung der Rolle ${beruf} sollte besonders auf die ${isBalanced ? "Vielseitigkeit der Personen" : `Passung im dominanten Kompetenzbereich ${domAll}`} geachtet werden. `;

  if (hochHaupt.length > 0) {
    bereich3 += `Die hochpriorisierten Tätigkeiten (${hochHaupt.map(t => t.name).join(", ")}) erfordern eine gezielte Eignungsprüfung. `;
  }
  if (hochNeben.length > 0) {
    bereich3 += `Im Bereich der Humankompetenzen sind ${hochNeben.map(t => t.name).join(", ")} besonders kritisch und sollten im Auswahlprozess gezielt geprüft werden. `;
  }

  bereich3 += `Eine potenzielle Lücke könnte im Bereich ${schwachBereich} entstehen, da dieser im Profil am schwächsten vertreten ist. `;

  if (isLeadership) {
    bereich3 += `Als ${fuehrung} sollte die Besetzung auch die Führungswirkung berücksichtigen: Passt der natürliche Führungsstil zur Teamkultur? Kann die Person sowohl steuern als auch das Team mitnehmen? `;
  }

  bereich3 += `Empfehlung: Neben der fachlichen Eignung sollte die strukturelle Passung der Arbeitslogik geprüft werden. Eine Person, deren natürliche Stärke im ${schwachBereich.split(" (")[0]}-Bereich liegt, könnte die Rolle ergänzen, aber die Kernaufgaben nicht optimal abdecken.`;

  return { bereich1, bereich2, bereich3 };
}
