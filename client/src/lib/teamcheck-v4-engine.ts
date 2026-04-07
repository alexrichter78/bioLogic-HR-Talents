import type { Triad, ComponentKey } from "./bio-types";
import { computeTeamCheckV3, type TeamCheckV3Input, type TeamCheckV3Result, type TeamGoal } from "./teamcheck-v3-engine";
import { getPrimaryKey, getSecondaryKey } from "./teamcheck-v2-engine";

export interface V4Block {
  title: string;
  text: string;
}

export interface V4RiskPhase {
  label: string;
  period: string;
  text: string;
}

export interface V4IntegrationPhase {
  num: number;
  title: string;
  period: string;
  ziel: string;
  beschreibung: string;
  praxis: string[];
  signale: string[];
  fuehrungstipp: string;
  fokus: { intro: string; bullets: string[] };
}

export interface TeamCheckV4Result {
  roleTitle: string;
  roleType: "leadership" | "member";
  roleLabel: string;
  teamGoal: TeamGoal;
  teamGoalLabel: string;

  introText: string;

  gesamteinschaetzung: string;
  passungZumTeam: string;
  beitragZurAufgabe: string;
  begleitungsbedarf: string;

  gesamtbewertungText: string;
  hauptstaerke: string;
  hauptabweichung: string;

  warumText: string;

  wirkungAlltagText: string;

  chancen: V4Block[];
  risiken: V4Block[];
  chancenRisikenEinordnung: string;

  druckText: string;

  fuehrungshinweis: V4Block[] | null;

  risikoprognose: V4RiskPhase[];
  integrationsplan: V4IntegrationPhase[];
  intWarnsignale: string[];
  intLeitfragen: string[];
  intVerantwortung: string;

  empfehlungen: V4Block[];

  teamOhnePersonText: string;
  schlussfazit: string;

  teamKontext: string;
  teamPrimary: ComponentKey;
  personPrimary: ComponentKey;
  sameDominance: boolean;
  teamTriad: Triad;
  personTriad: Triad;
  v3: TeamCheckV3Result;
}

const GOAL_LABELS: Record<string, string> = {
  umsetzung: "Umsetzung und Ergebnisse",
  analyse: "Analyse und Struktur",
  zusammenarbeit: "Zusammenarbeit und Kommunikation",
};

const COMP_SHORT: Record<ComponentKey, string> = {
  impulsiv: "Tempo und direkte Umsetzung",
  intuitiv: "Austausch und Miteinander",
  analytisch: "Struktur und Genauigkeit",
};

const COMP_ADJ: Record<ComponentKey, string> = {
  impulsiv: "direkter und schneller",
  intuitiv: "stärker über Austausch und Abstimmung",
  analytisch: "genauer und strukturierter",
};

const COMP_ADJ_AW: Record<ComponentKey, string> = {
  impulsiv: "direktere und schnellere",
  intuitiv: "stärker auf Austausch und Miteinander ausgerichtete",
  analytisch: "genauere und strukturiertere",
};

const COMP_NOUN: Record<ComponentKey, string> = {
  impulsiv: "schnelle Umsetzung und direkte Entscheidungen",
  intuitiv: "Austausch, Abstimmung und Zusammenarbeit",
  analytisch: "Struktur, Analyse und saubere Prüfung",
};

export function computeTeamCheckV4(input: TeamCheckV3Input & { roleType?: string }): TeamCheckV4Result {
  const v3 = computeTeamCheckV3(input);

  const inputRoleType = (input as any).roleType;
  const isLeader = inputRoleType === "fuehrung" ? true : inputRoleType === "teammitglied" ? false : v3.roleType === "leadership";
  const roleLabel = isLeader ? "Führungskraft" : "Teammitglied";

  const teamPrimary = getPrimaryKey(input.teamProfile);
  const personPrimary = getPrimaryKey(input.personProfile);
  const personSecondary = getSecondaryKey(input.personProfile);
  const sameDominance = teamPrimary === personPrimary;

  const teamFitRaw = v3.passung === "Passend" ? "hoch"
    : v3.passung === "Bedingt passend" ? "mittel" : "gering";

  let funktionsFit: string;
  if (v3.strategicFit === "passend") funktionsFit = "hoch";
  else if (v3.strategicFit === "teilweise") funktionsFit = "mittel";
  else if (v3.strategicFit === "abweichend") funktionsFit = "gering";
  else funktionsFit = "nicht bewertbar";

  const passungZumTeam = teamFitRaw;
  const beitragZurAufgabe = funktionsFit;

  let begleitungsbedarf: string;
  if (v3.steuerungsaufwand === "gering") begleitungsbedarf = "gering";
  else if (v3.steuerungsaufwand === "mittel") begleitungsbedarf = "mittel";
  else begleitungsbedarf = "hoch";

  if (v3.integrationsrisiko === "hoch" && begleitungsbedarf !== "hoch") {
    begleitungsbedarf = "hoch";
  } else if (v3.integrationsrisiko === "mittel" && begleitungsbedarf === "gering") {
    begleitungsbedarf = "mittel";
  }

  let gesamteinschaetzung: string;
  if (teamFitRaw === "hoch" && funktionsFit === "gering") {
    gesamteinschaetzung = "Im Team passend, für die Aufgabe weniger geeignet";
  } else if (teamFitRaw === "hoch") {
    gesamteinschaetzung = "Gut passend";
  } else if (teamFitRaw === "mittel" && funktionsFit === "hoch") {
    gesamteinschaetzung = "Für die Aufgabe passend, im Team herausfordernd";
  } else if (teamFitRaw === "mittel" && funktionsFit === "gering") {
    gesamteinschaetzung = "Eingeschränkt passend";
  } else if (teamFitRaw === "gering" && (funktionsFit === "hoch" || funktionsFit === "mittel")) {
    gesamteinschaetzung = "Strategisch sinnvoll, aber anspruchsvoll";
  } else if (teamFitRaw === "mittel") {
    gesamteinschaetzung = "Teilweise passend";
  } else {
    gesamteinschaetzung = "Kritisch";
  }

  const teamGoalLabel = v3.teamGoal ? (GOAL_LABELS[v3.teamGoal] || "") : "";
  const hasGoal = !!v3.teamGoal;
  const roleName = v3.roleTitle || "diese Rolle";

  const ctx = { isLeader, sameDominance, teamPrimary, personPrimary, hasGoal, teamGoalLabel, roleName, gesamteinschaetzung, passungZumTeam, beitragZurAufgabe, v3 };

  return {
    roleTitle: v3.roleTitle,
    roleType: isLeader ? "leadership" : "member",
    roleLabel,
    teamGoal: v3.teamGoal,
    teamGoalLabel,
    introText: buildIntroText(ctx),
    gesamteinschaetzung,
    passungZumTeam,
    beitragZurAufgabe,
    begleitungsbedarf,
    gesamtbewertungText: buildGesamtbewertungText(ctx),
    hauptstaerke: buildHauptstaerke(ctx),
    hauptabweichung: buildHauptabweichung(ctx),
    warumText: buildWarumText(ctx),
    wirkungAlltagText: buildWirkungAlltagText(ctx),
    ...buildChancenRisiken(ctx),
    druckText: buildDruckText(ctx),
    fuehrungshinweis: isLeader ? buildFuehrungshinweis(ctx) : null,
    risikoprognose: buildRisikoprognose(ctx),
    integrationsplan: buildIntegrationsplan(ctx),
    ...buildIntegrationZusatz(ctx),
    empfehlungen: buildEmpfehlungen(ctx),
    teamOhnePersonText: buildTeamOhnePerson(ctx),
    schlussfazit: buildSchlussfazit(ctx),
    teamKontext: sameDominance
      ? `Team und Person setzen beide auf ${COMP_SHORT[teamPrimary]}. Ihre Arbeitsweisen liegen nah beieinander.`
      : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}.`,
    teamPrimary,
    personPrimary,
    sameDominance,
    teamTriad: { ...input.teamProfile },
    personTriad: { ...input.personProfile },
    v3,
  };
}

interface Ctx {
  isLeader: boolean;
  sameDominance: boolean;
  teamPrimary: ComponentKey;
  personPrimary: ComponentKey;
  hasGoal: boolean;
  teamGoalLabel: string;
  roleName: string;
  gesamteinschaetzung: string;
  passungZumTeam: string;
  beitragZurAufgabe: string;
  v3: TeamCheckV3Result;
}

function buildIntroText(c: Ctx): string {
  const { isLeader } = c;
  const p1 = isLeader
    ? "Dieser Bericht zeigt, wie die Person in einer Führungsrolle im bestehenden Team voraussichtlich wirken wird. Er hilft dabei, früh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr Führung, Klarheit oder Begleitung nötig ist."
    : "Dieser Bericht zeigt, wie die Person im bestehenden Team voraussichtlich wirken wird. Er hilft dabei, früh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr Klarheit oder Begleitung nötig ist.";
  const p2 = "Unterschiede sind dabei nicht automatisch negativ. Sie können ein Team sinnvoll ergänzen, brauchen aber klare Erwartungen, gute Abstimmung und bewusste Führung, damit daraus Stärke statt Reibung entsteht.";
  return `${p1}\n\n${p2}`;
}

function buildGesamtbewertungText(c: Ctx): string {
  const { isLeader, sameDominance, hasGoal, teamGoalLabel, roleName, gesamteinschaetzung, passungZumTeam, beitragZurAufgabe } = c;
  const paras: string[] = [];

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    paras.push(isLeader
      ? `Die Person fügt sich voraussichtlich gut in das bestehende Team ein. Die Zusammenarbeit dürfte im Führungsalltag reibungsarm verlaufen, weil Person und Team in ihrer Arbeitsweise ähnliche Schwerpunkte setzen. Der Einstieg in die Führungsrolle wird dadurch erleichtert und die Integration fällt insgesamt positiv aus.`
      : `Die Person fügt sich voraussichtlich gut in das bestehende Team ein. Die Zusammenarbeit dürfte im Alltag reibungsarm verlaufen, weil Person und Team in ihrer Arbeitsweise ähnliche Schwerpunkte setzen. Der Einstieg wird dadurch erleichtert und die Integration fällt insgesamt positiv aus.`);
    paras.push(hasGoal
      ? `Für die konkreten Anforderungen der Aufgabe bringt die Person jedoch nicht die ideale Stärke mit. Im Funktionsziel ${teamGoalLabel} ist die Passung nur begrenzt gegeben. Das ergibt ein gemischtes Bild: Im Team passend, für den Aufgabenkern nicht ideal. Die Besetzung kann funktionieren, sollte fachlich aber nicht sich selbst überlassen werden.`
      : `Für die konkreten Anforderungen der Aufgabe bringt die Person jedoch nicht die ideale Stärke mit. Im eigentlichen Aufgabenkern ist die Passung nur begrenzt gegeben. Das ergibt ein gemischtes Bild: Im Team passend, für den Aufgabenkern nicht ideal. Die Besetzung kann funktionieren, sollte fachlich aber nicht sich selbst überlassen werden.`);
  } else if (passungZumTeam === "hoch") {
    paras.push(isLeader
      ? `Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team. Der Einstieg in die Führungsrolle dürfte vergleichsweise reibungsarm verlaufen, weil Führungsstil und Teamkultur ähnliche Schwerpunkte setzen. Das Team wird die Führung voraussichtlich gut annehmen.`
      : `Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team. Der Einstieg dürfte vergleichsweise reibungsarm verlaufen, weil Person und Team ähnliche Schwerpunkte setzen. Die Zusammenarbeit kann sich schnell einspielen.`);
    if (hasGoal && beitragZurAufgabe === "hoch") {
      paras.push(`Auch für das Funktionsziel ${teamGoalLabel} bringt die Person die passende Stärke mit. Das bedeutet, dass sowohl die Integration als auch der fachliche Beitrag gut zusammenpassen. Eine solche Ausgangslage ist in der Praxis nicht selbstverständlich und spricht klar für die Besetzung.`);
    } else if (hasGoal) {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang. Die Zusammenarbeit im Team wird gut funktionieren, im Aufgabenkern braucht es aber gezielte Begleitung.`);
    }
    paras.push(isLeader
      ? `Die Besetzung ist aus unserer Sicht empfehlenswert. Vertrauen kann sich früh aufbauen und die Zusammenarbeit schnell produktiv werden. Auch bei guter Passung lohnt es sich, Erwartungen an die Führungsrolle von Anfang an offen zu besprechen.`
      : `Die Besetzung ist aus unserer Sicht empfehlenswert. Das Team kann sich auf die eigentliche Arbeit konzentrieren, statt Energie in schwierige Integration zu investieren. Auch bei guter Passung lohnt es sich, Erwartungen und Zuständigkeiten von Anfang an offen zu besprechen.`);
  } else if (gesamteinschaetzung === "Für die Aufgabe passend, im Team herausfordernd") {
    paras.push(isLeader
      ? `Die Person erfüllt die fachlichen Anforderungen der Rolle gut und bringt die richtige Stärke für die Aufgabe mit. Die Zusammenarbeit mit dem Team ist jedoch nicht reibungsfrei. Die Person führt ${COMP_ADJ[c.personPrimary]}, als das Team es gewohnt ist.`
      : `Die Person bringt fachlich genau das mit, was die Aufgabe verlangt. Im Team wird es aber Reibung geben, weil sich die Arbeitsweisen merklich unterscheiden. Die Person arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`);
    paras.push(`Das ergibt eine anspruchsvolle, aber machbare Ausgangslage. Die fachliche Passung ist gegeben, die Integration braucht aber aktive Führung. Die Besetzung kann gelingen, wenn die Unterschiede früh angesprochen und die Erwartungen klar geregelt werden.${hasGoal ? ` Ob der Beitrag im Bereich ${teamGoalLabel} zum Tragen kommt, hängt davon ab, wie gut die Integration ins Team gelingt.` : ""}`);
  } else if (gesamteinschaetzung === "Eingeschränkt passend") {
    paras.push(isLeader
      ? `Die Person passt nur bedingt zum Team und erfüllt die fachlichen Anforderungen der Rolle ebenfalls nicht ideal. Die Führungskraft arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`
      : `Die Person passt nur bedingt zum Team und bringt für die konkrete Aufgabe nicht die ideale Stärke mit. Die Arbeitsweisen weichen merklich voneinander ab.`);
    paras.push(`Die Besetzung ist nur dann sinnvoll, wenn von Anfang an gezielte Begleitung und klare Rahmensetzung sichergestellt sind. Ohne diese Voraussetzungen ist das Risiko erheblich, dass weder die Zusammenarbeit noch die Ergebnisse stimmen. Die Unterschiede betreffen sowohl die tägliche Zusammenarbeit als auch die inhaltliche Ausrichtung.`);
  } else if (gesamteinschaetzung === "Strategisch sinnvoll, aber anspruchsvoll") {
    paras.push(isLeader
      ? `Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die Stärke mit, die die Aufgabe und der Bereich inhaltlich brauchen. Während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} ausgerichtet ist, arbeitet die Person ${COMP_ADJ[c.personPrimary]}.`
      : `Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die Stärke mit, die die Aufgabe und der Bereich inhaltlich brauchen. Die Arbeitsweisen unterscheiden sich erheblich.`);
    paras.push(isLeader
      ? `Der Einstieg in diese Führungsrolle ist deshalb anspruchsvoll, kann mit aktiver Begleitung jedoch sehr sinnvoll verlaufen. Die zentrale Herausforderung besteht darin, die fachliche Stärke der Person wirksam zu nutzen und gleichzeitig die Zusammenarbeit im Team stabil und tragfähig zu gestalten. Entscheidend wird sein, ob das Team bereit ist, sich auf eine andere Art der Führung und Arbeitssteuerung einzulassen, und ob dieser Übergang aktiv begleitet wird.`
      : `Der Einstieg ist deshalb anspruchsvoll, kann mit aktiver Begleitung jedoch sehr sinnvoll verlaufen. Die zentrale Herausforderung besteht darin, die fachliche Stärke der Person wirksam zu nutzen und gleichzeitig die Zusammenarbeit im Team stabil und tragfähig zu gestalten. Entscheidend wird sein, ob das Team bereit ist, sich auf eine andere Arbeitsweise einzulassen, und ob dieser Übergang aktiv begleitet wird.`);
    if (hasGoal) {
      paras.push(`Gerade im Bereich ${teamGoalLabel} kann die Person einen wichtigen Beitrag leisten. Genau deshalb lohnt sich der Integrationsaufwand, wenn er früh erkannt und aktiv geführt wird.`);
    }
  } else if (gesamteinschaetzung === "Teilweise passend") {
    paras.push(isLeader
      ? `Die Person bringt Stärken mit, arbeitet aber in einigen Punkten anders als das Team es kennt. Ob die Führung gut ankommt, hängt davon ab, wie aufmerksam die ersten Wochen gestaltet werden.`
      : `Die Person passt in Teilen gut zum Team, weicht in anderen Punkten aber erkennbar ab. Das kann neue Impulse bringen, braucht aber klare Absprachen.`);
    paras.push(`Einzelne Unterschiede lassen sich gut überbrücken, wenn Erwartungen früh geklärt und die Zusammenarbeit gezielt gestaltet wird. Ohne diese Klarheit könnten sich Missverständnisse aufbauen. Die Besetzung kann gelingen, ist aber kein Selbstläufer.`);
  } else {
    paras.push(isLeader
      ? `Die Person würde wesentlich anders führen, als das Team es kennt. Die Arbeitsweisen unterscheiden sich in wesentlichen Bereichen. Ohne aktive Begleitung ist mit Spannungen und schwächeren Ergebnissen zu rechnen.`
      : `Die Person arbeitet grundlegend anders als das Team. Die Unterschiede betreffen grundlegende Arbeitsweisen und Erwartungen. Ohne aktive Begleitung und enge Abstimmung ist eine produktive Zusammenarbeit kaum zu erwarten.`);
    paras.push(`Die Besetzung ist im aktuellen Umfeld kritisch und nur mit enger Begleitung tragfähig. Ohne aktive Führung und klare Absprachen ist das Risiko hoch, dass die Person weder fachlich noch im Teamalltag wirklich ankommt. Die Unterschiede in Arbeitsweise und Erwartung sind so gross, dass eine erfolgreiche Zusammenarbeit nur mit engmaschiger Begleitung und klarer Rahmensetzung von Beginn an möglich ist.`);
  }

  return paras.join("\n\n");
}

function buildHauptstaerke(c: Ctx): string {
  const { sameDominance, personPrimary, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;
  if (sameDominance) {
    return "gute Passung zum bestehenden Team";
  }
  if (beitragZurAufgabe === "hoch" && hasGoal) {
    return `hohe Passung zum Funktionsziel ${teamGoalLabel}`;
  }
  return `bringt mehr ${COMP_SHORT[personPrimary]} ins Team`;
}

function buildHauptabweichung(c: Ctx): string {
  const { sameDominance, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, personPrimary, teamPrimary } = c;
  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    if (hasGoal) return `geringe natürliche Nähe zum Funktionsziel ${teamGoalLabel}`;
    return "geringe Passung zur eigentlichen Aufgabenanforderung";
  }
  if (passungZumTeam === "gering") {
    return `klar abweichende Arbeitsweise zum bestehenden Team`;
  }
  if (!sameDominance) {
    return `setzt stärker auf ${COMP_SHORT[personPrimary]}, Team auf ${COMP_SHORT[teamPrimary]}`;
  }
  return "ähnliche Stärken wie das bestehende Team, wenig neue Impulse";
}

function buildWarumText(c: Ctx): string {
  const { isLeader, sameDominance, teamPrimary, personPrimary, hasGoal, teamGoalLabel, passungZumTeam, beitragZurAufgabe, roleName, v3 } = c;
  const paras: string[] = [];

  paras.push(`Diese Einschätzung entsteht aus dem Zusammenspiel von Person, Team und ${hasGoal ? "Funktionsziel" : "Aufgabe"}. ${passungZumTeam === "hoch" && beitragZurAufgabe === "gering"
    ? "Dabei zeigt sich ein klares Muster: Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team, trifft aber die zentrale Anforderung der Aufgabe nicht in idealer Weise."
    : passungZumTeam === "hoch"
      ? "Das Bild ist stimmig: Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team."
      : passungZumTeam === "gering" && beitragZurAufgabe !== "gering"
        ? "Dabei entsteht eine klare Spannung: Die Person bringt fachlich genau die Qualität mit, die im Bereich gebraucht wird, weicht in ihrer Arbeitsweise und Führungswirkung jedoch merklich von der bestehenden Teamkultur ab."
        : "Es gibt relevante Unterschiede, die im Alltag bemerkbar sein werden."}`);

  if (sameDominance) {
    paras.push(isLeader
      ? `Person und Team arbeiten grundsätzlich mit ähnlichen Schwerpunkten. Dadurch ist zu erwarten, dass der Einstieg in die Führungsrolle vergleichsweise leicht gelingt. Zusammenarbeit, Abstimmung und täglicher Austausch dürften ohne grössere Reibung möglich sein. Die Person wird im bestehenden Umfeld voraussichtlich nicht als Fremdkörper wirken, sondern rasch Akzeptanz finden.`
      : `Person und Team arbeiten grundsätzlich mit ähnlichen Schwerpunkten. Dadurch ist zu erwarten, dass der Einstieg in das Team vergleichsweise leicht gelingt. Zusammenarbeit, Abstimmung und täglicher Austausch dürften ohne grössere Reibung möglich sein. Die Person wird im bestehenden Umfeld voraussichtlich nicht als Fremdkörper wirken, sondern rasch Anschluss finden.`);
  } else {
    paras.push(isLeader
      ? `Das Team ist stärker auf ${COMP_SHORT[teamPrimary]} ausgerichtet. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}. Dieser Unterschied wird im Führungsalltag vor allem dort wirksam, wo Entscheidungen getroffen, Prioritäten gesetzt, Standards eingehalten und Zusammenarbeit geführt werden müssen. Je grösser dieser Unterschied, desto gezielter muss die Zusammenarbeit gestaltet werden.`
      : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}. Dieser Unterschied wird im Alltag vor allem bei Abstimmungen, Entscheidungen und im Umgang mit Prioritäten bemerkbar sein. Je grösser die Abweichung, desto gezielter muss die Zusammenarbeit gestaltet werden.`);
  }

  if (hasGoal) {
    const goalKey: ComponentKey = v3.teamGoal === "analyse" ? "analytisch" : v3.teamGoal === "umsetzung" ? "impulsiv" : "intuitiv";
    if (v3.strategicFit === "passend") {
      paras.push(`Gleichzeitig liegt das Funktionsziel des Bereichs klar im Schwerpunkt ${teamGoalLabel}. Genau dort bringt die Person ihre stärkste Seite mit. Das ist ein klarer Vorteil und ein wesentlicher Grund dafür, dass die Gesamtbewertung trotz geringer Teampassung nicht negativ, sondern strategisch sinnvoll ausfällt.`);
    } else if (v3.strategicFit === "abweichend") {
      paras.push(`Das Funktionsziel des Bereichs liegt im Schwerpunkt ${teamGoalLabel}. Genau dort liegt jedoch nicht die stärkste natürliche Seite der Person. Die Aufgabe kann durchaus erfüllt werden. Allerdings verlangt die Rolle an einer Stelle besonders viel, an der die Person ihre stärkste Wirkung nicht automatisch mitbringt.`);
    } else {
      paras.push(`Das Funktionsziel des Bereichs liegt im Schwerpunkt ${teamGoalLabel}. Die Person bringt einen Teil dessen mit, was dafür gebraucht wird, aber nicht in vollem Umfang. Im Alltag kann das ausreichen, braucht aber bei höheren Anforderungen gezielte Begleitung.`);
    }

    if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
      paras.push(`Für ${roleName} ist das relevant. In diesem Umfeld geht es häufig um ${COMP_NOUN[goalKey]}. Wenn diese Punkte im Arbeitsalltag zentral sind, braucht es eine Person, die sich genau in diesem Bereich besonders natürlich bewegt. Hier ist diese Nähe nur eingeschränkt vorhanden.`);
    }
  }

  if (passungZumTeam === "gering" && beitragZurAufgabe !== "gering") {
    paras.push("Die Kernaussage lautet deshalb: Für die Aufgabe ist diese Besetzung inhaltlich wertvoll. Für das Team ist sie nicht automatisch leicht. Genau daraus entsteht die Bewertung.");
  }

  return paras.join("\n\n");
}

function buildWirkungAlltagText(c: Ctx): string {
  const { isLeader, sameDominance, teamPrimary, personPrimary, hasGoal, teamGoalLabel, passungZumTeam, beitragZurAufgabe, roleName, v3 } = c;
  const paras: string[] = [];

  if (passungZumTeam === "hoch") {
    paras.push(isLeader
      ? `Im normalen Arbeitsalltag dürfte die Person schnell Anschluss an das bestehende Team finden. Abstimmungen werden voraussichtlich unkompliziert verlaufen, weil Person und Team ähnliche Schwerpunkte setzen und sich im täglichen Miteinander relativ schnell aufeinander einstellen können. Das reduziert Reibung, erleichtert die Zusammenarbeit und macht den Einstieg in die Führungsrolle insgesamt belastbar.`
      : `Im normalen Arbeitsalltag dürfte die Person schnell Anschluss an das bestehende Team finden. Abstimmungen werden voraussichtlich unkompliziert verlaufen, weil Person und Team ähnliche Schwerpunkte setzen und sich im täglichen Miteinander relativ schnell aufeinander einstellen können. Das reduziert Reibung, erleichtert die Zusammenarbeit und macht den Einstieg insgesamt belastbar.`);
    paras.push(isLeader
      ? `Auch in der Kommunikation sind zunächst keine grösseren Irritationen zu erwarten. Die Person dürfte vom Team eher als passend und verständlich wahrgenommen werden. Gerade in den ersten Wochen ist das ein klarer Vorteil, weil sich weniger Missverständnisse aus der Art der Zusammenarbeit ergeben als bei einer stark abweichenden Besetzung.`
      : `Auch in der Kommunikation sind zunächst keine grösseren Irritationen zu erwarten. Die Person dürfte vom Team eher als passend und verständlich wahrgenommen werden. Gerade in den ersten Wochen ist das ein klarer Vorteil, weil sich weniger Missverständnisse aus der Art der Zusammenarbeit ergeben als bei einer stark abweichenden Besetzung.`);
  } else if (passungZumTeam === "mittel") {
    paras.push(isLeader
      ? `Im Arbeitsalltag wird sich zeigen, dass die Person in manchen Bereichen etwas anders arbeitet als das Team es gewohnt ist. Sie setzt stärker auf ${COMP_SHORT[personPrimary]}, während das Team stärker über ${COMP_SHORT[teamPrimary]} arbeitet. Das muss kein Nachteil sein, braucht aber gezielte Abstimmung, besonders in den ersten Wochen.`
      : `Im Arbeitsalltag wird sich zeigen, dass die Person in manchen Bereichen etwas anders arbeitet als das Team es gewohnt ist. Sie setzt stärker auf ${COMP_SHORT[personPrimary]}, während das Team stärker über ${COMP_SHORT[teamPrimary]} arbeitet. Das kann das Team sinnvoll ergänzen, braucht aber klare Absprachen.`);
    paras.push(`In der Kommunikation können Unterschiede auftreten. ${personPrimary === "impulsiv" ? "Was die Person als klar und effizient erlebt, kann für das Team etwas zu direkt wirken." : personPrimary === "intuitiv" ? "Die Person setzt stärker auf Austausch und Dialog, was teilweise als bereichernd, aber auch als zusätzlicher Aufwand empfunden werden kann." : "Die Person kommuniziert möglicherweise etwas sachlicher als das Team es gewohnt ist, was anfangs als distanziert wirken kann."} Hier lohnt es sich, den Stil früh abzustimmen.`);
  } else {
    paras.push(isLeader
      ? `Im Arbeitsalltag wird sich voraussichtlich schnell zeigen, dass die Person andere Schwerpunkte setzt als das Team es bisher kennt. Zusammenarbeit, Führung und Abstimmung werden strukturierter, genauer und verbindlicher erlebt werden. Gerade Entscheidungswege, Prioritätensetzung und der Umgang mit offenen Themen dürften sich dadurch merklich verändern.`
      : `Im Arbeitsalltag wird schnell auffallen, dass Person und Team nicht automatisch dieselben Schwerpunkte setzen. Die Person arbeitet ${COMP_ADJ[personPrimary]}, während das Team stärker auf ${COMP_SHORT[teamPrimary]} setzt. Das kann das Team sinnvoll ergänzen, braucht aber von Anfang an klare Absprachen und aktive Begleitung.`);
    paras.push(`Auch in der Kommunikation werden Unterschiede sichtbar. ${personPrimary === "impulsiv" ? "Die Person entscheidet schneller und handelt direkter als das Team es gewohnt ist. Das kann als klärend erlebt werden, aber auch als zu forsch." : personPrimary === "intuitiv" ? "Die Person setzt stärker auf Austausch und gemeinsames Arbeiten. Das Team empfindet das möglicherweise als bereichernd, aber teilweise auch als zu aufwändig." : "Die Person wird voraussichtlich genauer, systematischer und sorgfältiger vorgehen, als das Team es gewohnt ist. Das kann einerseits als verlässlich, klar und hilfreich erlebt werden, andererseits aber auch als zu detailliert, zu streng oder zu langsam."} Besonders in der Anfangsphase braucht es deshalb klare Absprachen darüber, wie geführt, entschieden und kommuniziert wird.`);
  }

  if (beitragZurAufgabe === "gering" && hasGoal) {
    const goalKey: ComponentKey = v3.teamGoal === "analyse" ? "analytisch" : v3.teamGoal === "umsetzung" ? "impulsiv" : "intuitiv";
    paras.push(`Im Aufgabenkern zeigt sich jedoch eine zweite Seite. Dort, wo die Rolle vor allem ${COMP_NOUN[goalKey]} verlangt, könnte die Person weniger natürliche Stärke mitbringen, als die Aufgabe eigentlich fordert. Das muss nicht sofort sichtbar werden, weil eine ${passungZumTeam === "hoch" ? "gute" : "annehmbare"} Teamintegration diesen Punkt anfangs leicht überdecken kann. Gerade deshalb ist es wichtig, Alltag und Aufgabenanforderung bewusst auseinanderzuhalten.`);
  }

  paras.push(isLeader
    ? `Für die Führungsrolle bedeutet das konkret: ${passungZumTeam === "hoch" ? "Im Teamgefüge ist die Besetzung wahrscheinlich unkompliziert." : passungZumTeam === "gering" ? `Im Teamgefüge braucht diese Besetzung aktive Begleitung und klare Rahmung.` : "Im Teamgefüge braucht die Besetzung aktive Begleitung."} ${beitragZurAufgabe === "gering" ? "Im Aufgabenkern der Rolle kann es aber Situationen geben, in denen mehr verlangt wird, als die Person von sich aus einbringt. Hier braucht es gezielte Führung." : beitragZurAufgabe === "hoch" ? "Fachlich bringt die Person genau das mit, was die Aufgabe erfordert. Im täglichen Miteinander muss diese Stärke jedoch so eingeführt werden, dass daraus Orientierung entsteht und keine unnötige Distanz." : "Fachlich bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang."}`
    : `Konkret bedeutet das: ${passungZumTeam === "hoch" ? "Im Teamgefüge ist die Besetzung wahrscheinlich unkompliziert." : "Im Teamgefüge braucht die Besetzung aktive Begleitung."} ${beitragZurAufgabe === "gering" ? "Im Aufgabenkern kann es aber Situationen geben, in denen die Rolle mehr verlangt, als die Person von sich aus einbringt." : beitragZurAufgabe === "hoch" ? "Fachlich bringt die Person genau das mit, was die Aufgabe erfordert." : "Fachlich bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang."}`);

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    paras.push(`Auch bei Tempo und Prioritäten kann das relevant werden. Wenn Aufgaben unter Zeitdruck erledigt werden müssen, besteht die Gefahr, dass eher auf pragmatische Lösung und zügige Umsetzung gesetzt wird, während die Rolle zugleich ein höheres Mass an ${hasGoal ? teamGoalLabel : "fachlicher Sorgfalt"} verlangt. Genau an dieser Stelle entscheidet sich dann, ob die gute Integration im Team auch zu stabiler Leistung im eigentlichen Aufgabenfokus führt.`);
  }

  return paras.join("\n\n");
}

function buildChancenRisiken(c: Ctx): { chancen: V4Block[]; risiken: V4Block[]; chancenRisikenEinordnung: string } {
  const { isLeader, sameDominance, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;
  const chancen: V4Block[] = [];
  const risiken: V4Block[] = [];

  if (passungZumTeam === "hoch") {
    chancen.push({ title: "Schneller Anschluss an das Team", text: isLeader
      ? "Die Person bringt gute Voraussetzungen mit, um im bestehenden Team rasch anzukommen. Das erleichtert die ersten Wochen und reduziert unnötige Reibung beim Führungseinstieg."
      : "Die Person bringt gute Voraussetzungen mit, um im bestehenden Team rasch anzukommen. Das erleichtert die ersten Wochen und reduziert unnötige Reibung im Einstieg." });
    chancen.push({ title: "Stabile Zusammenarbeit im Alltag", text: "Da Person und Team ähnliche Schwerpunkte setzen, ist die Wahrscheinlichkeit hoch, dass Abstimmung, Miteinander und tägliche Zusammenarbeit tragfähig verlaufen. Das entlastet Führung und Team im Integrationsprozess." });
    chancen.push({ title: "Geringerer sozialer Integrationsaufwand", text: "Die Besetzung braucht voraussichtlich weniger Energie im zwischenmenschlichen Anschluss als eine deutlich abweichende Person. Das schafft Ruhe und Stabilität im Teamgefüge." });
  } else {
    chancen.push({ title: "Neue Impulse für das Team", text: isLeader
      ? `Die Person kann dem Team eine Qualität geben, die bisher zu wenig vorhanden ist. Gerade mehr ${COMP_SHORT[personPrimary]} in der Führung können hilfreich sein, wenn bisher Richtung, Verbindlichkeit oder saubere Steuerung gefehlt haben.`
      : `Die Person kann dem Team Qualitäten bringen, die bisher zu wenig vorhanden waren. Gerade mehr ${COMP_SHORT[personPrimary]} kann hilfreich sein, wenn Themen bislang zu lange offen bleiben oder bestimmte Impulse fehlen.` });
    chancen.push({ title: `Mehr ${COMP_SHORT[personPrimary]}`, text: personPrimary === "analytisch"
      ? "Themen werden voraussichtlich sauberer vorbereitet, klarer bearbeitet und verlässlicher nachgehalten. Das kann die Arbeitsqualität erhöhen und im Alltag für mehr Orientierung sorgen."
      : personPrimary === "impulsiv"
        ? "Entscheidungen werden schneller getroffen und konsequenter umgesetzt."
        : "Zusammenarbeit und Austausch werden lebendiger und verbindlicher." });
    if (beitragZurAufgabe === "hoch" && hasGoal) {
      chancen.push({ title: `Hohe Passung zum Funktionsziel ${teamGoalLabel}`, text: `Die Stärken der Person liegen genau dort, wo die Aufgabe und der Bereich sie besonders brauchen. Das macht den zusätzlichen Integrationsaufwand fachlich sinnvoll und strategisch nachvollziehbar.` });
    } else {
      chancen.push({ title: "Sinnvolle Ergänzung", text: `Was dem Team bisher an ${COMP_SHORT[personPrimary]} gefehlt hat, kann durch die Person gezielt gestärkt werden.` });
    }
  }

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    risiken.push({ title: "Die Hauptanforderung der Aufgabe wird nicht ideal verstärkt", text: hasGoal
      ? `Das Funktionsziel ${teamGoalLabel} wird durch die Besetzung nicht in optimaler Weise unterstützt. Gerade dort, wo die Rolle besondere Sorgfalt verlangt, bleibt eine Lücke möglich.`
      : "Die zentrale Anforderung der Rolle wird nicht in optimaler Weise unterstützt. Gerade dort, wo die Rolle besondere Stärke verlangt, bleibt eine Lücke möglich." });
    risiken.push({ title: "Gute Teamintegration kann fachliche Schwächen verdecken", text: "Weil die Person im Team voraussichtlich gut ankommt, kann leicht übersehen werden, dass die eigentliche Aufgabenpassung nur begrenzt gegeben ist. Das Risiko liegt nicht in der Zusammenarbeit, sondern in einer zu positiven Gesamtwahrnehmung." });
    risiken.push({ title: "Das Team wird eher stabilisiert als gezielt ergänzt", text: "Die Besetzung stärkt eher das, was im Team bereits gut funktioniert. Das bringt Verlässlichkeit, löst aber nicht automatisch die Anforderung, die im Bereich aktuell besonders gebraucht wird." });
  } else if (passungZumTeam === "hoch") {
    risiken.push({ title: "Zu viel Gleichförmigkeit", text: "Ähnlichkeit bringt Stabilität, kann aber Innovation und neue Perspektiven bremsen." });
    risiken.push({ title: "Blinde Flecken bleiben bestehen", text: "Was dem Team bisher fehlt, wird durch eine ähnliche Person nicht automatisch sichtbar oder gelöst." });
    risiken.push({ title: "Erwartungsklärung wird vernachlässigt", text: "Bei guter Passung entsteht schnell der Eindruck, alles laufe von allein. Genau dann werden wichtige Klärungen versäumt." });
  } else if (passungZumTeam === "gering") {
    risiken.push({ title: "Höheres Integrationsrisiko", text: "Der Unterschied zur bestehenden Teamkultur ist erheblich. Ohne gute Begleitung können daraus schnell Missverständnisse, Unsicherheit und das Gefühl entstehen, nicht richtig zusammenzupassen." });
    risiken.push({ title: "Sinkendes Vertrauen bei fehlender Klärung", text: "Wenn Irritationen nicht früh angesprochen und eingeordnet werden, kann das gegenseitige Vertrauen leiden. Kleine Spannungen bauen sich dann oft schrittweise auf und wirken später grösser, als sie anfangs waren." });
    risiken.push({ title: "Hoher Führungsaufwand im Einstieg", text: isLeader
      ? "Auch bei klarer fachlicher Passung kann es Zeit brauchen, bis die Führung im Team wirklich ankommt und akzeptiert wird. Gerade die ersten Wochen und Monate verlangen deshalb mehr Präsenz, Erklärung und aktive Steuerung."
      : "Die Person könnte fachlich gute Arbeit leisten, im Team aber schwerer ankommen als erwartet." });
  } else {
    risiken.push({ title: "Mehr Abstimmungsbedarf als erwartet", text: "In den ersten Monaten braucht es mehr Klärung als bei einer ähnlicheren Besetzung. Was die eine Seite als selbstverständlich sieht, muss für die andere erst besprochen werden." });
    risiken.push({ title: "Unterschiedliche Erwartungen im Alltag", text: "Unterschiede in Tempo, Kommunikation oder Prioritäten können anfangs zu unnötiger Reibung führen, wenn sie nicht frühzeitig angesprochen werden." });
    risiken.push({ title: "Rollen müssen aktiv geklärt werden", text: "Ohne klare Zuständigkeiten entsteht schnell Unsicherheit auf beiden Seiten. Das gilt besonders in der Anfangsphase." });
  }

  let einordnung: string;
  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    einordnung = "Die Chancen dieser Besetzung liegen klar auf der Integrationsseite. Die Risiken liegen stärker auf der Leistungs- und Aufgabenebene. Genau deshalb ist die Besetzung nicht grundsätzlich falsch, aber auch nicht einfach nur unkritisch. Sie braucht eine Führung, die den Unterschied zwischen guter Teamwirkung und voller Aufgabenpassung sauber im Blick behält.";
  } else if (passungZumTeam === "hoch") {
    einordnung = "Die Chancen überwiegen bei dieser Besetzung klar. Die Risiken sind gering und betreffen eher die langfristige Entwicklung als den kurzfristigen Einstieg. Trotzdem lohnt es sich, die Klärung von Erwartungen nicht zu vernachlässigen.";
  } else if (beitragZurAufgabe === "hoch") {
    einordnung = "Die fachliche Passung ist ein klarer Pluspunkt. Die Risiken liegen nicht in der Kompetenz der Person, sondern in der Teamintegration und im täglichen Miteinander. Genau deshalb ist diese Besetzung strategisch sinnvoll, im Alltag aber anspruchsvoll.";
  } else {
    einordnung = "Die Besetzung ist in der Gesamtbetrachtung anspruchsvoll. Sowohl auf der Teamebene als auch im Aufgabenkern sind Herausforderungen zu erwarten. Eine gezielte Begleitung ist die Voraussetzung dafür, dass die Besetzung gelingen kann.";
  }

  return { chancen, risiken, chancenRisikenEinordnung: einordnung };
}

function buildDruckText(c: Ctx): string {
  const { isLeader, sameDominance, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, roleName } = c;
  const paras: string[] = [];

  paras.push("Unter Druck zeigt sich die natürliche Arbeitsweise eines Menschen klarer als im ruhigen Arbeitsalltag. Was im Alltag noch ausgeglichen oder angepasst wirkt, tritt unter Belastung stärker hervor. Stärken werden sichtbarer, aber auch Grenzen treten offener zutage.");

  if (passungZumTeam === "hoch") {
    paras.push(isLeader
      ? `Hier ist davon auszugehen, dass die Zusammenarbeit auch unter Belastung vergleichsweise stabil bleibt. Da Person und Team ähnlich arbeiten, ist das Risiko akuter Teamreibung gering. Gerade in intensiven Phasen kann das ein Vorteil sein, weil Abstimmungswege und gegenseitiges Verständnis bereits vorhanden sind.`
      : `Hier ist davon auszugehen, dass die Zusammenarbeit auch unter Belastung vergleichsweise stabil bleibt. Da Person und Team ähnlich arbeiten, ist das Risiko akuter Teamreibung gering. Gerade in intensiven Phasen kann das ein Vorteil sein, weil Abstimmungswege und gegenseitiges Verständnis bereits vorhanden sind.`);
  } else if (passungZumTeam === "mittel") {
    paras.push(`Unter Druck können die vorhandenen Unterschiede zwischen Person und Team stärker hervortreten. ${personPrimary === "impulsiv" ? "Die Person wird voraussichtlich schneller und direkter handeln, was zu Irritationen führen kann." : personPrimary === "intuitiv" ? "Die Person wird voraussichtlich stärker auf Austausch setzen, was als Verzögerung erlebt werden kann." : "Die Person wird voraussichtlich genauer und vorsichtiger vorgehen, was als Bremsen erlebt werden kann."} Frühe Absprachen helfen, das aufzufangen. Im Kern bleibt die Zusammenarbeit aber tragfähig, wenn die Rollen klar sind.`);
  } else {
    paras.push(`Bei dieser Besetzung werden die Unterschiede zwischen Person und Team unter Druck eher grösser als kleiner. ${personPrimary === "impulsiv" ? "Die Person wird voraussichtlich noch schneller und direkter handeln, was das Team als Übergehen erleben kann." : personPrimary === "intuitiv" ? "Die Person wird voraussichtlich noch stärker auf Austausch und Abstimmung setzen, was das Team als verzögernd erleben kann." : "Die Person wird unter Belastung voraussichtlich noch genauer, kontrollierter und standardsicherer arbeiten. Das kann aus ihrer Sicht notwendig und sinnvoll sein, kann im Team aber auch als bremsend, zu streng oder wenig flexibel erlebt werden."} Gerade in solchen Situationen entscheidet sich, ob die Zusammenarbeit tragfähig bleibt oder ob sich Spannungen verstärken.`);
  }

  if (beitragZurAufgabe === "gering") {
    paras.push(`Die anspruchsvollere Seite liegt erneut im Aufgabenkern. Wenn unter Druck nicht nur Tempo, sondern zugleich ${hasGoal ? `${teamGoalLabel}` : "fachliche Sorgfalt und Qualität"} gefragt ${hasGoal ? "ist" : "sind"}, steigt die Anforderung an Führung erheblich. In solchen Situationen reicht gute Teampassung allein nicht aus. Dann braucht es klare Prioritäten, eindeutige Verantwortlichkeiten und eine gezielte Sicherung von Qualität und Struktur.`);
  }

  paras.push(`Für die Praxis bedeutet das: Unter Belastung sollte besonders klar definiert sein, was zuerst erledigt werden muss, ${beitragZurAufgabe !== "gering" ? "welche Standards nicht aufgeweicht werden dürfen, wo Tempo wichtig ist und wo Genauigkeit Vorrang hat. " : "wo keine Abkürzungen entstehen dürfen und welche Standards auch unter Zeitdruck gelten. "}${beitragZurAufgabe === "gering"
    ? "Gerade im fachlichen Kern der Rolle ist es wichtig, dass Führung nicht nur auf Geschwindigkeit achtet, sondern gezielt auch auf Nachvollziehbarkeit, Vollständigkeit und Qualität."
    : "Klare Entscheidungswege, eindeutige Verantwortung und transparente Prioritäten sind dann besonders wichtig."}`);

  if (beitragZurAufgabe === "gering") {
    paras.push("Dort zeigt sich am deutlichsten, ob die Person die Rolle wirklich tragen kann oder ob sie im Aufgabenkern dauerhaft zu viel Führung und Korrektur benötigt.");
  }

  return paras.join("\n\n");
}

function buildFuehrungshinweis(c: Ctx): V4Block[] {
  const { sameDominance, teamPrimary, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;
  const items: V4Block[] = [];

  if (passungZumTeam === "hoch") {
    items.push({ title: "Was das Team von der Führung erwartet", text: `Dieses Team arbeitet bevorzugt über ${COMP_SHORT[teamPrimary]}. Da die Führungskraft ähnlich arbeitet, wird sie voraussichtlich schnell als passend erlebt. Trotzdem muss die Rolle aktiv gestaltet werden. Das Team wird nicht automatisch differenzieren zwischen „passt gut zu uns" und „führt uns gut". Genau das muss die Führungskraft aktiv klären: Wo gehe ich mit dem Team, und wo setze ich eigene Akzente?` });
    items.push({ title: "Worauf die Führungskraft achten sollte", text: "Bei hoher Ähnlichkeit besteht das Risiko, dass die Führung zu wenig Richtung gibt. Das Team fühlt sich wohl, aber es fehlt der Impuls, Dinge anders oder besser zu machen. Die Führungskraft sollte früh klären, wo sie gezielt Orientierung gibt und wo sie dem Team Raum lässt." });
    if (beitragZurAufgabe === "gering") {
      items.push({ title: "Führung im Aufgabenkern absichern", text: hasGoal
        ? `Gerade im Bereich ${teamGoalLabel} sollte die Führungskraft nicht nur delegieren, sondern aktiv Standards setzen. Wenn die eigene Stärke dort nicht liegt, braucht es klare Vorgaben, definierte Prüfpunkte oder jemanden im Team, der diesen Bereich fachlich absichert.`
        : "Gerade im fachlichen Kern der Rolle sollte die Führungskraft nicht nur delegieren, sondern aktiv Standards setzen. Wenn die eigene Stärke dort nicht liegt, braucht es klare Vorgaben, definierte Prüfpunkte oder jemanden im Team, der diesen Bereich fachlich absichert." });
    }
  } else {
    items.push({ title: "Wie das Team auf diese Führung reagieren wird", text: sameDominance
      ? `Das Team teilt mit der Führungskraft eine ähnliche Grundrichtung, erlebt aber in Einzelbereichen eine andere Gewichtung. Anfangs kann das als Bereicherung wahrgenommen werden. Wenn es jedoch zu lange unklar bleibt, wofür die Führung steht, entsteht Verunsicherung. Die Führungskraft sollte deshalb früh klarmachen, was sich ändert und was bleibt.`
      : `Das Team ist stärker auf ${COMP_SHORT[teamPrimary]} ausgerichtet. Die neue Führung bringt mehr ${COMP_SHORT[personPrimary]} mit. Diesen Unterschied wird das Team meist spüren, bevor er offen benannt wird. Manche werden das als hilfreich und ordnend erleben, andere als fremd, distanziert oder verunsichernd. Genau deshalb ist es wichtig, dass die Führungskraft den eigenen Stil früh erklärt, nachvollziehbar macht und aktiv Brücken zum Team baut.` });

    items.push({ title: "Wo die grösste Führungsherausforderung liegt", text: personPrimary === "impulsiv"
      ? "Die Führungskraft entscheidet schneller und direkter als das Team es gewohnt ist. Das kann Tempo bringen, aber auch Widerstand auslösen. Die Herausforderung liegt darin, das Team mitzunehmen, ohne den eigenen Stil aufzugeben. Transparenz bei Entscheidungen ist der Schlüssel."
      : personPrimary === "intuitiv"
        ? "Die Führungskraft setzt stärker auf Dialog und gemeinsame Abstimmung. Das Team, das andere Arbeitsweisen gewohnt ist, kann das anfangs als Umweg erleben. Die Herausforderung liegt darin, den Mehrwert von Austausch sichtbar zu machen, ohne Entscheidungen unnötig zu verzögern."
        : "Die Führungskraft wird voraussichtlich strukturierter, gründlicher und klarer vorgehen, als das Team es bisher kennt. Das kann Orientierung schaffen, kann aber auch als Kontrolle, Härte oder Verlangsamung erlebt werden. Die zentrale Herausforderung besteht darin, Struktur einzuführen, ohne das Team in seiner Arbeitsfähigkeit und seinem Miteinander unnötig zu bremsen." });

    items.push({ title: "Was die Führungskraft in den ersten Wochen tun sollte", text: passungZumTeam === "gering"
      ? "Wichtig ist vor allem: zuhören, beobachten und dann gezielt führen. Das Team muss verstehen, wofür die neue Führung steht, wie sie Entscheidungen trifft und was ihr wichtig ist. Dafür braucht es frühe Einzelgespräche, sichtbare Präsenz, klare Aussagen zu Entscheidungswegen und einen transparenten Umgang mit Erwartungen. Erst wenn das Team weiss, woran es ist, kann Führung wirksam werden."
      : "In den ersten Wochen sollte die Führungskraft aktiv klären: Wie will ich führen? Was erwarte ich? Was kann das Team von mir erwarten? Dieses Gespräch muss aktiv geführt werden, es findet nicht von alleine statt. Je früher es stattfindet, desto weniger Raum bleibt für Interpretationen und stille Widerstände." });
  }

  if (hasGoal && beitragZurAufgabe !== "gering") {
    items.push({ title: `Führung im Kontext von ${teamGoalLabel}`, text: `Das Funktionsziel ${teamGoalLabel} gibt der Führungsarbeit eine klare Richtung. Die Führungskraft sollte dieses Ziel aktiv nutzen, um Erwartungen zu rahmen, Prioritäten zu setzen, Standards zu begründen und dem Team Orientierung zu geben. Das hilft besonders dann, wenn Unterschiede im Führungsstil spürbar werden, weil die gemeinsame Aufgabe als verbindende Klammer dienen kann.` });
  }

  return items;
}

function buildRisikoprognose(c: Ctx): V4RiskPhase[] {
  const { isLeader, sameDominance, teamPrimary, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, roleName } = c;

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "hoch") {
    return [
      { label: "Kurzfristig", period: "0 – 3 Monate", text: `Der Einstieg als ${roleName} verläuft voraussichtlich reibungsarm. Person und Team arbeiten ähnlich und die fachliche Passung ist gegeben. In dieser Phase sind keine grösseren Risiken zu erwarten.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: "Die Zusammenarbeit stabilisiert sich. Das Risiko besteht darin, dass die hohe Ähnlichkeit zu wenig Entwicklungsimpulse setzt. Führung sollte aktiv darauf achten, ob das Team neue Impulse braucht." },
      { label: "Langfristig", period: "12+ Monate", text: "Die Besetzung ist langfristig tragfähig. Der Führungsaufwand bleibt gering. Halbjährliche Standortgespräche genügen, um die Passung zu überprüfen." },
    ];
  }

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    return [
      { label: "Kurzfristig", period: "0 – 3 Monate", text: `Der Einstieg ins Team verläuft wahrscheinlich gut, weil die Arbeitsweisen ähnlich sind. Das eigentliche Risiko zeigt sich noch nicht, weil die fachlichen Anforderungen${hasGoal ? ` im Bereich ${teamGoalLabel}` : ""} erst nach einigen Wochen sichtbar greifen.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: isLeader
        ? `Die gute Integration täuscht über fachliche Lücken hinweg. Entscheidungen im Aufgabenkern werden zunehmend von der natürlichen Stärke der Person geprägt, nicht von dem, was die Rolle eigentlich verlangt. Ohne aktive Begleitung verschiebt sich die Führungswirkung.`
        : `Die gute Integration täuscht über fachliche Lücken hinweg. Im Aufgabenkern zeigen sich zunehmend Situationen, in denen die Person nicht das einbringt, was die Rolle eigentlich verlangt. Ohne klare Standards erodiert die Qualität schrittweise.` },
      { label: "Langfristig", period: "12+ Monate", text: `Wenn die fachliche Lücke nicht aktiv kompensiert wird, verfestigt sich eine Arbeitsweise, die im Team gut funktioniert, aber die eigentlichen Anforderungen der Rolle dauerhaft verfehlt. Der Führungsaufwand steigt, je länger die Korrektur ausbleibt.` },
    ];
  }

  const personDesc = COMP_SHORT[personPrimary];
  const teamDesc = COMP_SHORT[teamPrimary];

  if (passungZumTeam !== "hoch" && beitragZurAufgabe === "hoch") {
    return [
      { label: "Kurzfristig", period: "0 – 3 Monate", text: isLeader
        ? `Die Person bringt fachlich genau das mit, was die Aufgabe braucht, wird im Team aber voraussichtlich auf Irritationen stossen. Die Arbeitsweise, stärker auf ${personDesc} ausgerichtet, weicht erheblich von der bestehenden Teamkultur ab. Erste Spannungen entstehen meist dort, wo Abstimmung, Prioritätensetzung und Entscheidungswege neu erlebt werden.`
        : `Die Person bringt fachlich das Richtige mit, arbeitet aber anders als das Team. Der Unterschied zwischen ${personDesc} und ${teamDesc} wird in den ersten Wochen bemerkbar. Missverständnisse und Reibung sind wahrscheinlich.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: isLeader
        ? `Ohne aktive Begleitung kann die Person fachlich solide arbeiten, im Team aber an Anschluss verlieren. Unterschiedliche Arbeitsweisen verfestigen sich dann zunehmend. Das Team entwickelt eher Umgehungslösungen und informelle Muster, statt echte Zusammenarbeit mit der Führung aufzubauen. Dadurch kommt die fachliche Stärke der Person nicht voll zur Wirkung.`
        : `Ohne aktive Begleitung kann die Person fachlich liefern, aber im Team isoliert werden. Die unterschiedlichen Arbeitsweisen verfestigen sich. Das Team entwickelt Umgehungslösungen statt echter Zusammenarbeit. Die fachliche Stärke kommt nicht voll zum Tragen.` },
      { label: "Langfristig", period: "12+ Monate", text: isLeader
        ? `Wenn die Integration dauerhaft nicht gelingt, geht der fachliche Mehrwert dieser Besetzung schrittweise verloren. Die Person arbeitet dann zunehmend neben dem Team statt mit dem Team. Die Besetzung kann dennoch gut funktionieren, wenn Führung die Verbindung zwischen Aufgabe, Team und Führungsstil dauerhaft aktiv gestaltet und die Zusammenarbeit gezielt stabilisiert.`
        : `Wenn die Integration nicht gelingt, geht der fachliche Mehrwert verloren. Die Person arbeitet zunehmend neben dem Team statt mit dem Team. Die Besetzung kann dennoch gut funktionieren, wenn Führung die Verbindung zum Team dauerhaft aktiv gestaltet.` },
    ];
  }

  if (passungZumTeam === "mittel") {
    return [
      { label: "Kurzfristig", period: "0 – 3 Monate", text: isLeader
        ? `Die Person wird als ${roleName} teilweise anders arbeiten als das Team es kennt. Der Unterschied zwischen ${personDesc} und ${teamDesc} wird in Abstimmungen sichtbar. Einzelne Irritationen sind wahrscheinlich, aber gut handhabbar.`
        : `Im Einstieg wird sich zeigen, dass Person und Team nicht automatisch gleich arbeiten. Der Unterschied zwischen ${personDesc} und ${teamDesc} zeigt sich in Abstimmungen und Erwartungen. Mit klarer Abstimmung bleibt das Risiko beherrschbar.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: `Die Unterschiede in der Arbeitsweise werden Teil des Alltags. Wenn sie nicht aktiv besprochen werden, entstehen stille Missverständnisse.${beitragZurAufgabe === "gering" && hasGoal ? ` Im Bereich ${teamGoalLabel} zeigt sich zusätzlich, dass die Person dort nicht die volle Stärke mitbringt.` : ""} Regelmässige Abstimmung ist nötig.` },
      { label: "Langfristig", period: "12+ Monate", text: `Mit gezielter Führung kann die Besetzung dauerhaft funktionieren. Ohne diese Begleitung besteht das Risiko, dass sich Unterschiede verfestigen und die Zusammenarbeit oberflächlich bleibt. Halbjährliche Überprüfung empfohlen.` },
    ];
  }

  return [
    { label: "Kurzfristig", period: "0 – 3 Monate", text: isLeader
      ? `Die Person wird als ${roleName} merklich anders arbeiten als das Team es kennt. Die Arbeitsweisen unterscheiden sich in wesentlichen Bereichen. Bereits in den ersten Wochen sind Spannungen und Missverständnisse wahrscheinlich. Ohne enge Begleitung entstehen schnell Konflikte.`
      : `Person und Team setzen grundlegend unterschiedliche Schwerpunkte. Die Person arbeitet über ${personDesc}, das Team über ${teamDesc}. Bereits in den ersten Wochen entstehen Reibungen in Abstimmung, Kommunikation und Erwartungen.` },
    { label: "Mittelfristig", period: "3 – 12 Monate", text: isLeader
      ? `Ohne aktive Begleitung verliert die Führung an Wirkung. Das Team folgt der Führung nicht, weil der Stil als fremd erlebt wird. Entscheidungen werden umgangen oder verzögert. Die Person kann ihr fachliches Potenzial nicht voll entfalten.`
      : `Die Unterschiede verfestigen sich. Die Person wird im Team zunehmend als Fremdkörper erlebt. Umgehungslösungen ersetzen echte Zusammenarbeit. Ohne klare Rahmensetzung sinken Motivation und Ergebnisse auf beiden Seiten.` },
    { label: "Langfristig", period: "12+ Monate", text: `Die Besetzung ist nur mit dauerhaft hohem Führungsaufwand tragfähig. Ohne diesen Aufwand ist das Risiko erheblich, dass weder die Zusammenarbeit noch die Ergebnisse stimmen. Es sollte geprüft werden, ob der Aufwand langfristig gerechtfertigt ist.` },
  ];
}

function buildIntegrationsplan(c: Ctx): V4IntegrationPhase[] {
  const { isLeader, sameDominance, teamPrimary, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, roleName } = c;

  const teamDesc = COMP_SHORT[teamPrimary];
  const personDesc = COMP_SHORT[personPrimary];

  if (passungZumTeam === "hoch") {
    return [
      {
        num: 1, title: "Ankommen und Team verstehen", period: "Tag 1 – 10",
        ziel: isLeader
          ? `Die Führungskraft soll im Team ankommen, die Arbeitsweise verstehen und früh Sicherheit in der Zusammenarbeit aufbauen.`
          : `Die Person soll im Team ankommen, die Arbeitsweise verstehen und erste Sicherheit in der Zusammenarbeit gewinnen.`,
        beschreibung: isLeader
          ? `In den ersten Tagen geht es nicht darum, sofort Führung zu zeigen oder Veränderungen anzustossen. Entscheidend ist zuerst zu verstehen, wie das Team arbeitet, was im Alltag funktioniert und worauf die Teammitglieder Wert legen.\n\nTeam und Führungskraft arbeiten beide stärker über ${teamDesc}. Die Arbeitsweisen liegen nah beieinander. Trotzdem hat jedes Team eigene Gewohnheiten und ungeschriebene Regeln, die erst im Alltag sichtbar werden. Wer zuerst beobachtet, zuhört und versteht, schafft Vertrauen und gewinnt schneller das Team.`
          : `In den ersten Tagen geht es nicht darum, sofort etwas zu verändern. Entscheidend ist zuerst zu verstehen, wie das Team arbeitet, was im Alltag gut funktioniert und worauf Kolleginnen und Kollegen Wert legen.\n\nTeam und Person arbeiten beide stärker über ${teamDesc}. Die Arbeitsweisen liegen nah beieinander. Trotzdem hat jedes Team eigene Gewohnheiten und ungeschriebene Regeln, die erst im Alltag sichtbar werden. Wer zuerst beobachtet, zuhört und versteht, schafft Vertrauen und verhindert unnötige Missverständnisse.`,
        praxis: [
          isLeader ? "Gespräche mit jedem Teammitglied führen" : "Gespräche mit wichtigen Teamkollegen führen",
          "Nachfragen, wie Zusammenarbeit bisher gut funktioniert hat",
          "Beobachten, wie Besprechungen und Abstimmungen ablaufen",
          isLeader ? "Erwartungen an Führung verstehen, bevor etwas verändert wird" : "Unterschiede erst verstehen, bevor etwas verändert wird",
        ],
        signale: [
          isLeader ? "Die Führungskraft findet schnell Zugang zum Team" : "Die Person findet schneller Zugang zum Team",
          "Erste offene Gespräche entstehen",
          "Missverständnisse werden früh vermieden",
          isLeader ? "Das Team erlebt die Führungskraft als interessiert und zugänglich" : "Das Team erlebt die Person als interessiert und anschlussfähig",
        ],
        fuehrungstipp: isLeader
          ? `In dieser Phase sollte die übergeordnete Führung darauf achten, ob die neue Führungskraft erst versteht und dann handelt oder ob sie zu früh eigene Strukturen einführen will. Auch bei guter Passung entstehen sonst schnell Reibungen.`
          : `Die Führungskraft sollte in dieser Phase darauf achten, ob die Person erst versteht und dann handelt oder ob sie zu früh bewertet und verändern will. Auch bei guter Passung braucht es anfangs Begleitung.`,
        fokus: {
          intro: `Die Arbeitsweisen passen gut zusammen. Trotzdem muss in den ersten Tagen geklärt werden:`,
          bullets: [
            isLeader ? "Wie arbeitet das Team und was erwartet es von Führung?" : "Wie arbeitet das Team heute?",
            isLeader ? "Wie will die Führungskraft führen und entscheiden?" : "Was erwartet das Team von neuen Kollegen?",
            "Wo können erste Reibungen entstehen?",
          ],
        },
      },
      {
        num: 2, title: "Eigene Stärken sinnvoll einbringen", period: "Tag 11 – 20",
        ziel: isLeader
          ? `Die Führungskraft soll zeigen, dass sie dem Team Orientierung gibt, verlässlich entscheidet und Führung so gestaltet, dass Zusammenarbeit leichter wird.`
          : `Die Person soll zeigen, dass sie dem Team hilft, verlässlich arbeitet und ihre Stärken so einbringt, dass Zusammenarbeit leichter und nicht schwieriger wird.`,
        beschreibung: isLeader
          ? `Nach der ersten Orientierung reicht reines Kennenlernen nicht mehr aus. Jetzt muss sichtbar werden, dass die Führungskraft einen guten Beitrag leistet. Entscheidend ist dabei nicht nur das Ergebnis, sondern auch die Art, wie geführt wird.\n\nDie Führungskraft sollte erste Entscheidungen treffen und diese so kommunizieren, dass das Team die Logik dahinter versteht. Gleichzeitig sollte sie darauf achten, wie der eigene Führungsstil wirkt.\n\nDeshalb ist es in dieser Phase wichtig, Rückmeldung einzuholen. Nicht nur zur Entscheidungsqualität, sondern auch zur Zusammenarbeit: Ist die Abstimmung klar? Fühlen sich die Teammitglieder mitgenommen? Entsteht Vertrauen?`
          : `Nach der ersten Orientierung reicht reines Kennenlernen nicht mehr aus. Jetzt muss sichtbar werden, dass die Person einen guten Beitrag leistet. Entscheidend ist dabei nicht nur das Ergebnis, sondern auch die Art, wie sie vorgeht.\n\nDie Person sollte erste Aufgaben eigenständig übernehmen und diese so erledigen, dass das Team Sicherheit gewinnt. Gleichzeitig sollte sie darauf achten, wie ihre Arbeitsweise wirkt. Eine Stärke bringt nur dann etwas, wenn sie im Team auch anschlussfähig ist.\n\nDeshalb ist es in dieser Phase wichtig, Rückmeldung einzuholen. Nicht nur zur Leistung, sondern auch zur Zusammenarbeit: Ist die Abstimmung klar? Fühlen sich andere mitgenommen? Entsteht Vertrauen? Wird die Person als zuverlässig erlebt?`,
        praxis: [
          isLeader ? "Erste Führungsentscheidungen treffen und die Begründung transparent machen" : "Eine erste Aufgabe oder ein kleines Projekt verantwortlich übernehmen",
          "Ergebnisse transparent machen, statt still für sich zu arbeiten",
          "Bei wichtigen Themen kurz rückkoppeln, statt einfach durchzuziehen",
          "Im Teamgespräch aktiv nachfragen, ob Abstimmung und Zusammenarbeit passen",
          isLeader ? "Zeigen, dass der eigene Führungsstil dem Team Orientierung gibt" : "Zeigen, dass die eigene Art zu arbeiten dem Team nutzt und nicht gegen das Team läuft",
        ],
        signale: [
          isLeader ? "Die Führungskraft trifft Entscheidungen, die nachvollziehbar sind" : "Die Person liefert erste brauchbare Ergebnisse",
          "Kollegen beziehen sie zunehmend selbstverständlich ein",
          "Die Kommunikation wird klarer und einfacher",
          "Unterschiede in der Arbeitsweise führen nicht zu Reibung",
          "Das Vertrauen wächst sichtbar",
        ],
        fuehrungstipp: isLeader
          ? `In dieser Phase sollte die übergeordnete Führung genau hinschauen, ob die neue Führungskraft zwar Entscheidungen trifft, aber das Team dabei verliert. Häufig wirkt eine Integration von aussen zunächst gut, weil Ergebnisse kommen. In Wirklichkeit gibt es aber schon erste Spannungen in Kommunikation, Tempo oder Erwartungshaltung. Diese Signale sollten jetzt ernst genommen werden.`
          : `Die Führungskraft sollte in dieser Phase genau hinschauen, ob die Person zwar fachlich liefert, aber sozial noch nicht richtig andockt. Häufig wirkt eine Integration von aussen zunächst gut, weil Aufgaben erledigt werden. In Wirklichkeit gibt es aber schon erste Spannungen in Kommunikation, Tempo, Abstimmung oder Erwartungshaltung. Diese Signale sollten jetzt ernst genommen werden.`,
        fokus: {
          intro: `Die Integration verläuft voraussichtlich reibungsarm. Die wichtige Frage ist jetzt:`,
          bullets: [
            isLeader ? "Liefert die Führungskraft nicht nur Entscheidungen, sondern auch Orientierung?" : "Liefert die Person nicht nur Ergebnisse, sondern auch gute Zusammenarbeit?",
            "Wie erlebt das Team die Zusammenarbeit im Alltag?",
            "Wo braucht es Nachjustierung, bevor sich Muster verfestigen?",
          ],
        },
      },
      {
        num: 3, title: "Nach 30 Tagen klar prüfen", period: "Tag 21 – 30",
        ziel: `Nach 30 Tagen soll klar sein, ob die Integration im Alltag tragfähig ist und welche nächsten Schritte notwendig sind.`,
        beschreibung: `Nach einem Monat sollte nicht nur ein allgemeines Gefühl bewertet werden, sondern möglichst konkret geschaut werden, was gut funktioniert und was noch nicht stabil ist.\n\nDazu braucht es ein offenes Gespräch zwischen Führungskraft und ${isLeader ? "der übergeordneten Leitung" : "Person"}. Zusätzlich sollte auch die Wahrnehmung aus dem Team einbezogen werden. Wichtig ist dabei, nicht nur nach Sympathie zu fragen, sondern nach konkreten Punkten: Zusammenarbeit, Kommunikation, Verlässlichkeit, Umgang mit Abstimmung, Tempo und Erwartungen.\n\nWenn es Unterschiede in der Arbeitsweise gibt, ist jetzt der richtige Zeitpunkt zu prüfen, ob diese Unterschiede schon gut genutzt werden oder ob sie im Alltag eher Kraft kosten.`,
        praxis: [
          "Ein strukturiertes 30-Tage-Gespräch mit klaren Fragen führen",
          "Rückmeldungen aus dem Team sammeln, nicht nur Einzelmeinungen",
          "Gemeinsam besprechen, wo es schon gut läuft und wo noch Unsicherheit besteht",
          "Für die nächsten 30 bis 60 Tage klare Ziele festlegen",
          isLeader ? "Vereinbaren, was die Führungskraft selbst ändern soll und wo Unterstützung nötig ist" : "Vereinbaren, was die Person selbst ändern soll und wo die Führung unterstützen muss",
        ],
        signale: [
          isLeader ? "Die Führungskraft wird zunehmend als Teil des Teams akzeptiert" : "Die Person wird zunehmend als Teil des Teams gesehen",
          "Die Zusammenarbeit wird berechenbarer",
          "Es gibt weniger Missverständnisse",
          "Unterschiede werden nicht mehr als Störung erlebt",
          "Die nächsten Schritte sind klar und verbindlich vereinbart",
        ],
        fuehrungstipp: `Wenn nach 30 Tagen immer noch unklar ist, wie die Zusammenarbeit eigentlich läuft, wurde meist zu wenig offen angesprochen. Dann braucht es mehr Führung, mehr Klarheit und oft auch konkretere Erwartungen. Je früher das benannt wird, desto besser lässt sich die Integration stabilisieren.`,
        fokus: {
          intro: `Nach 30 Tagen sollte ehrlich bewertet werden:`,
          bullets: [
            isLeader ? "Wird die Führung vom Team angenommen?" : "Ist die Person im Team angekommen?",
            "Funktioniert die Zusammenarbeit im Alltag wie erwartet?",
            "Welche konkreten Massnahmen sind nötig, damit die Integration stabil weitergeht?",
          ],
        },
      },
    ];
  }

  return [
    {
      num: 1, title: "Ankommen und Team verstehen", period: "Tag 1 – 10",
      ziel: isLeader
        ? `Die Führungskraft soll im Team ankommen, die Arbeitsweise verstehen und Unterschiede früh erkennen, ohne vorschnell zu bewerten.`
        : `Die Person soll im Team ankommen, die Arbeitsweise verstehen und erste Sicherheit in der Zusammenarbeit gewinnen.`,
      beschreibung: isLeader
        ? `In den ersten Tagen geht es nicht darum, sofort Führung zu zeigen oder Veränderungen anzustossen. Entscheidend ist zuerst zu verstehen, wie das Team arbeitet, was im Alltag funktioniert und worauf die Teammitglieder Wert legen.\n\nDas Team arbeitet stärker über ${teamDesc}. Die Führungskraft bringt eher eine ${COMP_ADJ_AW[personPrimary]} Arbeitsweise mit. Deshalb ist es wichtig, Unterschiede früh zu erkennen, ohne sie vorschnell zu bewerten. Wer zuerst beobachtet, zuhört und versteht, schafft Vertrauen und verhindert unnötige Missverständnisse.`
        : `In den ersten Tagen geht es nicht darum, sofort etwas zu verändern. Entscheidend ist zuerst zu verstehen, wie das Team arbeitet, was im Alltag gut funktioniert und worauf Kolleginnen und Kollegen Wert legen.\n\nDas Team arbeitet stärker über ${teamDesc}. Die Person bringt eher eine ${COMP_ADJ_AW[personPrimary]} Arbeitsweise mit. Deshalb ist es wichtig, Unterschiede früh zu erkennen, ohne sie vorschnell zu bewerten. Wer zuerst beobachtet, zuhört und versteht, schafft Vertrauen und verhindert unnötige Missverständnisse.`,
      praxis: [
        isLeader ? "Gespräche mit jedem Teammitglied führen" : "Gespräche mit wichtigen Teamkollegen führen",
        "Nachfragen, wie Zusammenarbeit bisher gut funktioniert hat",
        hasGoal ? `Anforderungen im Bereich ${teamGoalLabel} gezielt erfragen und verstehen` : "Beobachten, wie Besprechungen und Abstimmungen ablaufen",
        isLeader ? "Unterschiede in der Führung erst verstehen, bevor etwas verändert wird" : "Unterschiede erst verstehen, bevor etwas verändert wird",
      ],
      signale: [
        isLeader ? "Die Führungskraft findet schneller Zugang zum Team" : "Die Person findet schneller Zugang zum Team",
        "Erste offene Gespräche entstehen",
        "Missverständnisse werden früh vermieden",
        isLeader ? "Das Team erlebt die Führungskraft als interessiert und nicht als bewertend" : "Das Team erlebt die Person als interessiert und anschlussfähig",
      ],
      fuehrungstipp: isLeader
        ? `Die übergeordnete Führung sollte in dieser Phase darauf achten, ob die neue Führungskraft erst versteht und dann handelt oder ob sie zu früh mit Veränderung oder Tempo einsteigt. Gerade hier entstehen sonst schnell Reibungen.`
        : `Die Führungskraft sollte in dieser Phase darauf achten, ob die Person erst versteht und dann handelt oder ob sie zu früh bewertet und verändern will. Gerade hier entstehen sonst schnell Reibungen.`,
      fokus: {
        intro: `Die Arbeitsweisen unterscheiden sich. Deshalb ist in den ersten Tagen besonders wichtig:`,
        bullets: [
          "Wie arbeitet das Team heute?",
          isLeader ? "Was erwartet das Team von Führung?" : "Was erwartet das Team von neuen Kollegen?",
          "Wo können erste Reibungen entstehen?",
        ],
      },
    },
    {
      num: 2, title: "Eigene Stärken sinnvoll einbringen", period: "Tag 11 – 20",
      ziel: isLeader
        ? `Die Führungskraft soll zeigen, dass sie dem Team Orientierung gibt und die Unterschiede in der Arbeitsweise nicht als Hindernis, sondern als Chance nutzt.`
        : `Die Person soll zeigen, dass sie dem Team hilft, verlässlich arbeitet und ihre Stärken so einbringt, dass Zusammenarbeit leichter und nicht schwieriger wird.`,
      beschreibung: isLeader
        ? `Nach der ersten Orientierung reicht reines Kennenlernen nicht mehr aus. Jetzt muss sichtbar werden, dass die Führungskraft einen guten Beitrag leistet. Entscheidend ist dabei nicht nur die Entscheidungsqualität, sondern auch die Art, wie geführt wird.\n\nDie Führungskraft sollte erste Entscheidungen treffen und diese so kommunizieren, dass das Team die Logik dahinter versteht. Dabei sollte sie darauf achten, dass der eigene Stil auf ${personDesc} das Team nicht überfordert, das stärker auf ${teamDesc} ausgerichtet ist.\n\nDeshalb ist es in dieser Phase wichtig, Rückmeldung einzuholen. Nicht nur zur Führungswirkung, sondern auch zur Zusammenarbeit: Fühlen sich die Teammitglieder mitgenommen? Passt das Tempo? Entsteht Vertrauen oder eher Unsicherheit?`
        : `Nach der ersten Orientierung reicht reines Kennenlernen nicht mehr aus. Jetzt muss sichtbar werden, dass die Person einen guten Beitrag leistet. Entscheidend ist dabei nicht nur das Ergebnis, sondern auch die Art, wie sie vorgeht.\n\nDie Person sollte erste Aufgaben eigenständig übernehmen und diese so erledigen, dass das Team Sicherheit gewinnt. Gleichzeitig sollte sie darauf achten, wie ihre Arbeitsweise wirkt. Die Stärke im Bereich ${personDesc} bringt nur dann etwas, wenn sie im Team, das auf ${teamDesc} setzt, auch anschlussfähig ist.\n\nDeshalb ist es in dieser Phase wichtig, Rückmeldung einzuholen. Nicht nur zur Leistung, sondern auch zur Zusammenarbeit: Ist die Abstimmung klar? Fühlen sich andere mitgenommen? Entsteht Vertrauen? Wird die Person als zuverlässig erlebt?`,
      praxis: [
        isLeader ? "Erste Führungsentscheidungen treffen und die Begründung transparent machen" : "Eine erste Aufgabe oder ein kleines Projekt verantwortlich übernehmen",
        "Ergebnisse transparent machen, statt still für sich zu arbeiten",
        "Bei wichtigen Themen kurz rückkoppeln, statt einfach durchzuziehen",
        "Im Teamgespräch aktiv nachfragen, ob Abstimmung und Zusammenarbeit passen",
        isLeader ? "Zeigen, dass Führung Orientierung gibt, ohne die bestehende Teamkultur zu überfahren" : "Zeigen, dass die eigene Art zu arbeiten dem Team nutzt und nicht gegen das Team läuft",
      ],
      signale: [
        isLeader ? "Die Führungskraft trifft nachvollziehbare Entscheidungen" : "Die Person liefert erste brauchbare Ergebnisse",
        "Kollegen beziehen sie zunehmend selbstverständlich ein",
        "Die Kommunikation wird klarer und einfacher",
        "Unterschiede in der Arbeitsweise führen nicht sofort zu Reibung",
        "Das Vertrauen wächst sichtbar",
      ],
      fuehrungstipp: isLeader
        ? `Hier sollte die übergeordnete Führung genau hinschauen, ob die neue Führungskraft zwar Entscheidungen trifft, aber das Team dabei verliert. Häufig wirkt eine Integration von aussen zunächst gut, weil Ergebnisse kommen. In Wirklichkeit gibt es aber schon erste Spannungen in Kommunikation, Tempo oder Erwartungshaltung. Diese Signale sollten jetzt ernst genommen werden.`
        : `Die Führungskraft sollte in dieser Phase genau hinschauen, ob die Person zwar fachlich liefert, aber sozial noch nicht richtig andockt. Häufig wirkt eine Integration von aussen zunächst gut, weil Aufgaben erledigt werden. In Wirklichkeit gibt es aber schon erste Spannungen in Kommunikation, Tempo, Abstimmung oder Erwartungshaltung. Diese Signale sollten jetzt ernst genommen werden.`,
      fokus: {
        intro: `Die erste Orientierung ist abgeschlossen. Die wichtige Frage ist jetzt:`,
        bullets: [
          isLeader ? "Liefert die Führungskraft Ergebnisse und nimmt das Team dabei mit?" : "Liefert die Person Ergebnisse und kommt gleichzeitig im Team an?",
          "Wie erlebt das Team die Zusammenarbeit im Alltag wirklich?",
          isLeader ? "Wo braucht es mehr Erklärung, mehr Geduld oder mehr Brücken?" : "Wo braucht es Nachjustierung, damit Unterschiede produktiv werden?",
        ],
      },
    },
    {
      num: 3, title: "Nach 30 Tagen klar prüfen", period: "Tag 21 – 30",
      ziel: `Nach 30 Tagen soll klar sein, ob die Integration im Alltag tragfähig ist und welche nächsten Schritte notwendig sind.`,
      beschreibung: `Nach einem Monat sollte nicht nur ein allgemeines Gefühl bewertet werden, sondern möglichst konkret geschaut werden, was gut funktioniert und was noch nicht stabil ist.\n\nDazu braucht es ein offenes Gespräch zwischen Führungskraft und ${isLeader ? "der übergeordneten Leitung" : "Person"}. Zusätzlich sollte auch die Wahrnehmung aus dem Team einbezogen werden. Wichtig ist dabei, nicht nur nach Sympathie zu fragen, sondern nach konkreten Punkten: Zusammenarbeit, Kommunikation, Verlässlichkeit, Umgang mit Abstimmung, Tempo und Erwartungen.\n\nDie Unterschiede zwischen ${personDesc} und ${teamDesc} sind in diesem Fall erheblich. Jetzt ist der richtige Zeitpunkt zu prüfen, ob diese Unterschiede schon produktiv genutzt werden oder ob sie im Alltag eher Kraft kosten.`,
      praxis: [
        "Ein strukturiertes 30-Tage-Gespräch mit klaren Fragen führen",
        "Rückmeldungen aus dem Team sammeln, nicht nur Einzelmeinungen",
        "Gemeinsam besprechen, wo es schon gut läuft und wo noch Unsicherheit besteht",
        `Bewerten, ob die Unterschiede zwischen ${personDesc} und ${teamDesc} bereits produktiv wirken oder eher belasten`,
        "Für die nächsten 30 bis 60 Tage klare Ziele festlegen",
        isLeader ? "Vereinbaren, wo die Führungskraft nachsteuern muss und wo Unterstützung nötig ist" : "Vereinbaren, was die Person selbst ändern soll und wo die Führung unterstützen muss",
      ],
      signale: [
        isLeader ? "Die Führungskraft wird zunehmend als Teil des Teams akzeptiert" : "Die Person wird zunehmend als Teil des Teams gesehen",
        "Die Zusammenarbeit wird berechenbarer",
        "Es gibt weniger Missverständnisse",
        "Unterschiede werden nicht mehr als Störung erlebt",
        "Die nächsten Schritte sind klar und verbindlich vereinbart",
      ],
      fuehrungstipp: `Wenn nach 30 Tagen immer noch unklar ist, wie die Zusammenarbeit eigentlich läuft, wurde meist zu wenig offen angesprochen. Dann braucht es mehr Führung, mehr Klarheit und oft auch konkretere Erwartungen. Je früher das benannt wird, desto besser lässt sich die Integration stabilisieren.`,
      fokus: {
        intro: `Nach 30 Tagen sollte ehrlich bewertet werden:`,
        bullets: [
          isLeader ? "Akzeptiert das Team die Führung?" : "Ist die Person im Team angekommen?",
          "Werden die Unterschiede eher als Bereicherung oder als Belastung erlebt?",
          "Welche Massnahmen sind nötig, damit die Integration in den nächsten Wochen stabil weitergeht?",
        ],
      },
    },
  ];
}

function buildIntegrationZusatz(c: Ctx): { intWarnsignale: string[]; intLeitfragen: string[]; intVerantwortung: string } {
  const { isLeader, passungZumTeam } = c;

  const warnsignale = passungZumTeam === "hoch"
    ? [
        isLeader ? "Die Führungskraft trifft Entscheidungen, ohne das Team einzubeziehen" : "Die Person arbeitet für sich, aber findet keinen echten Anschluss ans Team",
        "Kollegen reagieren höflich, aber zurückhaltend",
        "Absprachen werden unterschiedlich verstanden",
        isLeader ? "Das Team wartet ab, statt aktiv mitzuarbeiten" : "Tempo, Kommunikationsstil oder Entscheidungsverhalten führen zu Irritationen",
        "Rückmeldungen werden vermieden statt offen angesprochen",
        isLeader ? "Die übergeordnete Führung hat das Gefühl, vermitteln zu müssen" : "Die Führungskraft hat das Gefühl, ständig vermitteln zu müssen",
      ]
    : [
        isLeader ? "Die Führungskraft führt an der Teamkultur vorbei" : "Die Person arbeitet für sich, aber findet keinen echten Anschluss ans Team",
        "Kollegen reagieren höflich, aber zurückhaltend",
        "Absprachen werden unterschiedlich verstanden",
        "Tempo, Kommunikationsstil oder Entscheidungsverhalten führen zu Irritationen",
        "Rückmeldungen werden vermieden statt offen angesprochen",
        isLeader ? "Die übergeordnete Führung hat das Gefühl, ständig zwischen Team und Führungskraft vermitteln zu müssen" : "Die Führungskraft hat das Gefühl, ständig vermitteln zu müssen",
      ];

  const leitfragen = [
    "Was ist in der Zusammenarbeit bisher gut gelungen?",
    "Wo gab es Unsicherheiten oder Missverständnisse?",
    isLeader ? "Wie erlebt das Team die neue Führungskraft im Alltag?" : "Wie erlebt das Team die neue Person im Alltag?",
    "Wo passt die Arbeitsweise bereits gut, wo noch nicht?",
    isLeader ? "Welche Unterstützung braucht die Führungskraft jetzt?" : "Welche Unterstützung braucht die Person jetzt?",
    "Was soll in den nächsten 30 Tagen gezielt besser werden?",
  ];

  const verantwortung = isLeader
    ? `Integration ist nicht nur Aufgabe der neuen Führungskraft. Auch die übergeordnete Leitung muss in den ersten 30 Tagen Orientierung geben, Erwartungen klären, Rückmeldung einholen und bei ersten Spannungen früh steuern. Je klarer diese Begleitung ist, desto stabiler gelingt der Einstieg in die Führungsrolle.`
    : `Integration ist nicht nur Aufgabe der neuen Person. Auch die direkte Führungskraft muss in den ersten 30 Tagen Orientierung geben, Erwartungen klären, Rückmeldung einholen und bei ersten Spannungen früh steuern. Je klarer diese Begleitung ist, desto stabiler gelingt die Zusammenarbeit.`;

  return { intWarnsignale: warnsignale, intLeitfragen: leitfragen, intVerantwortung: verantwortung };
}

function buildEmpfehlungen(c: Ctx): V4Block[] {
  const { isLeader, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;

  const item1Title = "Erwartungen in den ersten Tagen klären";
  const item1Text = passungZumTeam === "hoch"
    ? (isLeader
      ? "Die gute Teampassung erleichtert den Einstieg. Trotzdem sollten die konkreten Anforderungen der Führungsrolle von Anfang an klar benannt werden, damit aus einem guten Start auch stabile Ergebnisse entstehen."
      : "Die gute Teampassung erleichtert den Einstieg. Trotzdem sollten die konkreten Anforderungen der Rolle von Anfang an klar benannt werden, damit aus einem guten Start auch stabile Ergebnisse entstehen.")
    : (isLeader
      ? "Die Arbeitsweisen unterscheiden sich erheblich. Deshalb sollte in den ersten Tagen offen besprochen werden, wie Führung, Kommunikation, Entscheidungswege und Zusammenarbeit im Alltag konkret aussehen sollen."
      : "Die Arbeitsweisen unterscheiden sich. Deshalb sollte in den ersten Tagen offen besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen.");

  let item2Title: string;
  let item2Text: string;
  if (beitragZurAufgabe === "gering" && hasGoal) {
    item2Title = `Fachliche Qualität im Bereich ${teamGoalLabel} sichern`;
    item2Text = `Im Aufgabenkern der Rolle braucht es klare Standards. Die Person sollte wissen, woran gute Arbeit im Bereich ${teamGoalLabel} konkret gemessen wird.`;
  } else if (passungZumTeam !== "hoch") {
    item2Title = "Integration ins Team aktiv gestalten";
    item2Text = "Es sollte gezielt darauf geachtet werden, dass die Person nicht nur Aufgaben übernimmt, sondern auch im Team Anschluss findet. Unterschiede in der Arbeitsweise sollten offen benannt, erklärt und aktiv überbrückt werden.";
  } else {
    item2Title = "Zusammenarbeit aktiv gestalten";
    item2Text = isLeader
      ? "Auch bei guter Passung sollte die Führungswirkung nach den ersten Wochen gezielt überprüft werden. Gute Integration bedeutet nicht automatisch, dass alle Erwartungen erfüllt sind."
      : "Auch bei guter Passung sollte die Zusammenarbeit nach den ersten Wochen gezielt überprüft werden. Gute Integration bedeutet nicht automatisch, dass alle Erwartungen erfüllt sind.";
  }

  const item3Title = "Standortbestimmung nach 30 Tagen";
  const item3Text = beitragZurAufgabe === "gering"
    ? "Nach 30 Tagen ehrlich bewerten: Läuft die Zusammenarbeit? Und stimmt die Leistung im fachlichen Kern der Rolle? Diese beiden Fragen getrennt beantworten."
    : "Nach 30 Tagen ehrlich bewerten: Funktioniert die Zusammenarbeit wie erwartet? Wo braucht es Nachjustierung? Eine offene Standortbestimmung sichert den langfristigen Erfolg der Besetzung.";

  return [
    { title: item1Title, text: item1Text },
    { title: item2Title, text: item2Text },
    { title: item3Title, text: item3Text },
  ];
}

function buildTeamOhnePerson(c: Ctx): string {
  const { isLeader, sameDominance, teamPrimary, personPrimary, hasGoal, teamGoalLabel, passungZumTeam, beitragZurAufgabe } = c;
  const paras: string[] = [];

  if (sameDominance) {
    paras.push(`Ohne diese Besetzung bleibt das Team in seiner bisherigen Ausrichtung stabil. Die Arbeitsweise mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]} wird sich fortsetzen. Das bedeutet Kontinuität, aber auch, dass vorhandene blinde Flecken bestehen bleiben.`);
    if (hasGoal && beitragZurAufgabe === "gering") {
      paras.push(`Besonders im Bereich ${teamGoalLabel} fehlt dem Team weiterhin eine natürliche Verstärkung. Die bisherige Lücke wird nicht geschlossen. Ob das kritisch ist, hängt davon ab, wie stark die Anforderungen in diesem Bereich steigen.`);
    } else if (hasGoal && beitragZurAufgabe === "hoch") {
      paras.push(`Im Bereich ${teamGoalLabel} bleibt die aktuelle Stärke erhalten. Allerdings verzichtet das Team auf eine Person, die genau dort einen echten Beitrag hätte leisten können.`);
    }
  } else {
    paras.push(`Ohne diese Besetzung bleibt das Team in seiner bisherigen Form bestehen. Die bestehende Arbeitsweise mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]} wird sich voraussichtlich nicht wesentlich verändern. Neue Impulse in Richtung ${COMP_SHORT[personPrimary]} und stärkere ${isLeader ? `${personPrimary === "analytisch" ? "analytische" : personPrimary === "impulsiv" ? "umsetzungsorientierte" : "dialogorientierte"} Führung` : `${personPrimary === "analytisch" ? "analytische" : personPrimary === "impulsiv" ? "umsetzungsorientierte" : "dialogorientierte"} Impulse`} bleiben damit aus.`);
    if (passungZumTeam !== "hoch") {
      paras.push(`Das hat den Vorteil, dass keine zusätzliche Integrationsarbeit nötig ist. Es entsteht keine Reibung durch eine merklich andere Arbeitsweise, keine aufwendige Einführung einer neuen Führungswirkung und kein zusätzlicher Steuerungsaufwand in der Anfangsphase. Die Zusammenarbeit bleibt vertraut und eingespielt.`);
    }
    if (beitragZurAufgabe === "hoch" && hasGoal) {
      paras.push(`Gleichzeitig verzichtet das Team damit auf eine Person, die im Bereich ${teamGoalLabel} genau die Stärke mitgebracht hätte, die für Aufgabe und Bereich fachlich wertvoll wäre. Ob diese Lücke anderweitig geschlossen werden kann oder ob sie bestehen bleibt, sollte gezielt geprüft werden.`);
    } else if (beitragZurAufgabe === "gering" && hasGoal) {
      paras.push(`Im Bereich ${teamGoalLabel} ändert sich ebenfalls nichts. Allerdings war die fachliche Passung der Person in diesem Bereich ohnehin nicht stark, sodass der Verzicht hier weniger ins Gewicht fällt.`);
    }
  }

  paras.push(isLeader
    ? "Für die Führung bedeutet das: kurzfristig weniger Aufwand, aber auch kein zusätzlicher Entwicklungsimpuls. Ob das Team in seiner jetzigen Zusammensetzung langfristig die richtigen Ergebnisse liefert, sollte deshalb unabhängig von dieser konkreten Besetzungsentscheidung bewertet werden."
    : "Für das Team bedeutet das: Die bisherige Dynamik bleibt erhalten. Ob das ausreicht, um die anstehenden Anforderungen zu bewältigen, sollte unabhängig von dieser Besetzungsentscheidung bewertet werden.");

  return paras.join("\n\n");
}

function buildSchlussfazit(c: Ctx): string {
  const { isLeader, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, gesamteinschaetzung } = c;

  if (gesamteinschaetzung === "Gut passend") {
    return isLeader
      ? "Die Besetzung ist aus unserer Sicht empfehlenswert. Person und Führungsrolle passen gut zusammen, die Teamintegration dürfte reibungsarm verlaufen. Mit klaren Erwartungen von Anfang an kann diese Besetzung schnell produktiv werden."
      : "Die Besetzung ist aus unserer Sicht empfehlenswert. Person und Team passen gut zusammen. Mit klaren Erwartungen und einem guten Einstieg kann die Zusammenarbeit schnell produktiv werden.";
  }

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    return `Die Person passt gut ins Team, bringt aber im Aufgabenkern${hasGoal ? ` (${teamGoalLabel})` : ""} nicht die volle Stärke mit. Die Besetzung kann funktionieren, wenn fachliche Erwartungen von Anfang an klar formuliert und regelmässig überprüft werden. Ohne diese Klarheit besteht das Risiko, dass gute Integration über fachliche Lücken hinwegtäuscht.`;
  }

  if (passungZumTeam !== "hoch" && beitragZurAufgabe === "hoch") {
    return isLeader
      ? `Die Person bringt fachlich genau die Stärke mit, die ${hasGoal ? `für den Bereich ${teamGoalLabel}` : "für die Aufgabe"} gebraucht wird. Die Integration in das bestehende Team ist jedoch anspruchsvoll, weil die Arbeitsweise und Führungswirkung erheblich von der bisherigen Teamkultur abweichen.\n\nDie Besetzung ist deshalb dann sinnvoll, wenn Führung bereit ist, die ersten Monate aktiv zu begleiten, Unterschiede früh zu erklären und die Verbindung zwischen Person, Aufgabe und Team gezielt zu gestalten. Dann kann aus einer zunächst anspruchsvollen Ausgangslage eine fachlich wertvolle und langfristig wirksame Lösung entstehen.`
      : `Die Person bringt fachlich genau das Richtige mit${hasGoal ? ` für den Bereich ${teamGoalLabel}` : ""}. Die Integration ins Team ist allerdings anspruchsvoll. Die Besetzung lohnt sich, wenn Führung bereit ist, die ersten Monate aktiv zu begleiten und die Verbindung zwischen Person und Team gezielt zu gestalten.`;
  }

  if (gesamteinschaetzung === "Teilweise passend") {
    return "Die Besetzung ist machbar, aber kein Selbstläufer. Einzelne Unterschiede in der Arbeitsweise sind überbrückbar, wenn Erwartungen früh geklärt werden. Entscheidend ist, ob Führung bereit ist, den Einstieg aktiv zu begleiten.";
  }

  if (gesamteinschaetzung === "Eingeschränkt passend") {
    return "Die Besetzung birgt erhebliche Risiken, sowohl in der Teamintegration als auch im fachlichen Kern der Rolle. Sie ist nur dann sinnvoll, wenn von Anfang an gezielte Begleitung und klare Rahmensetzung sichergestellt sind.";
  }

  if (gesamteinschaetzung === "Kritisch") {
    return isLeader
      ? "Die Besetzung ist in der aktuellen Zusammensetzung kritisch. Die Unterschiede zwischen Führungsstil und Teamkultur sind so gross, dass ohne dauerhaft hohen Führungsaufwand weder die Integration noch die Ergebnisse gesichert sind. Es sollte geprüft werden, ob eine alternative Besetzung sinnvoller wäre."
      : "Die Besetzung ist in der aktuellen Zusammensetzung kritisch. Die Unterschiede zwischen Person und Team sind so gross, dass ohne dauerhaft enge Begleitung weder die Zusammenarbeit noch die Ergebnisse stimmen werden. Eine alternative Besetzung sollte ernsthaft geprüft werden.";
  }

  return isLeader
    ? "Die Besetzung ist unter bestimmten Voraussetzungen tragfähig. Entscheidend ist, ob Führung bereit ist, die Integration aktiv zu begleiten und die fachlichen Anforderungen klar zu formulieren. Ohne diesen Einsatz bleibt das Ergebnis unsicher."
    : "Die Besetzung ist unter bestimmten Voraussetzungen tragfähig. Entscheidend ist, wie sorgfältig der Einstieg gestaltet wird und ob die Unterschiede in der Arbeitsweise offen besprochen werden. Ohne aktive Begleitung bleibt das Ergebnis unsicher.";
}
