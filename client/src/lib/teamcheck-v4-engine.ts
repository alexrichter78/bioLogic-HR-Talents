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
  items: string[];
  fokus: { intro: string; bullets: string[] };
}

export interface TeamCheckV4Result {
  roleTitle: string;
  roleType: "leadership" | "member";
  roleLabel: string;
  teamGoal: TeamGoal;
  teamGoalLabel: string;

  gesamteinschaetzung: string;
  passungZumTeam: string;
  beitragZurAufgabe: string;

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

  empfehlungen: V4Block[];

  teamOhnePersonText: string;
  schlussfazit: string;

  teamKontext: string;
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

  const personSorted = Object.entries(input.personProfile)
    .sort(([, a], [, b]) => b - a);
  const personGap = personSorted[0][1] - personSorted[1][1];

  let teamFitRaw: string;
  if (personPrimary === teamPrimary) {
    teamFitRaw = personGap <= 5 ? "mittel" : "hoch";
  } else if (personSecondary === teamPrimary && personGap <= 5) {
    teamFitRaw = "mittel";
  } else {
    teamFitRaw = "gering";
  }

  let funktionsFit: string;
  if (v3.strategicFit === "passend") funktionsFit = "hoch";
  else if (v3.strategicFit === "teilweise") funktionsFit = "mittel";
  else if (v3.strategicFit === "abweichend") funktionsFit = "gering";
  else funktionsFit = "nicht bewertbar";

  const passungZumTeam = teamFitRaw;
  const beitragZurAufgabe = funktionsFit;

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
    gesamteinschaetzung,
    passungZumTeam,
    beitragZurAufgabe,
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
    empfehlungen: buildEmpfehlungen(ctx),
    teamOhnePersonText: buildTeamOhnePerson(ctx),
    schlussfazit: buildSchlussfazit(ctx),
    teamKontext: sameDominance
      ? `Team und Person setzen beide auf ${COMP_SHORT[teamPrimary]}. Ihre Arbeitsweisen liegen nah beieinander.`
      : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}.`,
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

function buildGesamtbewertungText(c: Ctx): string {
  const { isLeader, sameDominance, hasGoal, teamGoalLabel, roleName, gesamteinschaetzung, passungZumTeam, beitragZurAufgabe } = c;
  const paras: string[] = [];

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    paras.push(isLeader
      ? `Die Person fügt sich voraussichtlich gut in das bestehende Team ein. Die Zusammenarbeit dürfte im Führungsalltag reibungsarm verlaufen, weil Person und Team in ihrer Grundausrichtung ähnliche Schwerpunkte setzen. Der Einstieg in die Führungsrolle wird dadurch erleichtert und die Integration in das bestehende Umfeld ist grundsätzlich positiv zu bewerten.`
      : `Die Person fügt sich voraussichtlich gut in das bestehende Team ein. Die Zusammenarbeit dürfte im Alltag reibungsarm verlaufen, weil Person und Team in ihrer Grundausrichtung ähnliche Schwerpunkte setzen. Der Einstieg wird dadurch erleichtert und die Integration in das bestehende Umfeld ist grundsätzlich positiv zu bewerten.`);
    paras.push(hasGoal
      ? `Für die konkreten Anforderungen der Aufgabe bringt die Person jedoch nicht die ideale Stärke mit. Im Funktionsziel ${teamGoalLabel} ist die Passung geringer ausgeprägt. Das ergibt ein gemischtes Bild: Im Team passend, für den Aufgabenkern nur eingeschränkt ideal. Die Besetzung kann funktionieren, sollte fachlich aber nicht sich selbst überlassen werden.`
      : `Für die konkreten Anforderungen der Aufgabe bringt die Person jedoch nicht die ideale Stärke mit. Im eigentlichen Aufgabenkern ist die Passung geringer ausgeprägt. Das ergibt ein gemischtes Bild: Im Team passend, für den Aufgabenkern nur eingeschränkt ideal. Die Besetzung kann funktionieren, sollte fachlich aber nicht sich selbst überlassen werden.`);
  } else if (passungZumTeam === "hoch") {
    paras.push(isLeader
      ? `Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team. Der Einstieg in die Führungsrolle dürfte vergleichsweise reibungsarm verlaufen, weil Führungsstil und Teamkultur ähnliche Schwerpunkte setzen. Das Team wird die Führung voraussichtlich gut annehmen.`
      : `Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team. Der Einstieg dürfte vergleichsweise reibungsarm verlaufen, weil Person und Team ähnliche Schwerpunkte setzen. Die Zusammenarbeit kann sich schnell einspielen.`);
    if (hasGoal && beitragZurAufgabe === "hoch") {
      paras.push(`Auch für das Funktionsziel ${teamGoalLabel} bringt die Person die passende Stärke mit. Das bedeutet, dass sowohl die Integration als auch der fachliche Beitrag gut zusammenpassen. Eine solche Ausgangslage ist in der Praxis nicht selbstverständlich und spricht klar für die Besetzung.`);
    } else if (hasGoal) {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang. Die Zusammenarbeit im Team wird gut funktionieren, im Aufgabenkern braucht es aber bewusste Begleitung.`);
    }
    paras.push(isLeader
      ? `Die Besetzung ist aus unserer Sicht empfehlenswert. Vertrauen kann sich früh aufbauen und die Zusammenarbeit schnell produktiv werden. Auch bei guter Passung lohnt es sich, Erwartungen an die Führungsrolle von Anfang an offen zu besprechen.`
      : `Die Besetzung ist aus unserer Sicht empfehlenswert. Das Team kann sich auf die eigentliche Arbeit konzentrieren, statt Energie in schwierige Integration zu investieren. Auch bei guter Passung lohnt es sich, Erwartungen und Zuständigkeiten von Anfang an offen zu besprechen.`);
  } else if (gesamteinschaetzung === "Für die Aufgabe passend, im Team herausfordernd") {
    paras.push(isLeader
      ? `Die Person erfüllt die fachlichen Anforderungen der Rolle gut und bringt die richtige Stärke für die Aufgabe mit. Die Zusammenarbeit mit dem Team ist jedoch nicht reibungsfrei. Die Person führt ${COMP_ADJ[c.personPrimary]}, als das Team es gewohnt ist.`
      : `Die Person bringt fachlich genau das mit, was die Aufgabe verlangt. Im Team wird es aber Reibung geben, weil sich die Arbeitsweisen spürbar unterscheiden. Die Person arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`);
    paras.push(`Das ergibt eine anspruchsvolle, aber machbare Ausgangslage. Die fachliche Passung ist gegeben, die Integration braucht aber bewusste Führung. Die Besetzung kann gelingen, wenn die Unterschiede früh angesprochen und die Erwartungen klar geregelt werden.${hasGoal ? ` Ob der Beitrag im Bereich ${teamGoalLabel} zum Tragen kommt, hängt davon ab, wie gut die Integration ins Team gelingt.` : ""}`);
  } else if (gesamteinschaetzung === "Eingeschränkt passend") {
    paras.push(isLeader
      ? `Die Person passt nur bedingt zum Team und erfüllt die fachlichen Anforderungen der Rolle ebenfalls nicht ideal. Die Führungskraft arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`
      : `Die Person passt nur bedingt zum Team und bringt für die konkrete Aufgabe nicht die ideale Stärke mit. Die Arbeitsweisen unterscheiden sich spürbar.`);
    paras.push(`Die Besetzung ist nur dann sinnvoll, wenn von Anfang an gezielte Begleitung und klare Rahmensetzung gewährleistet sind. Ohne diese Voraussetzungen ist das Risiko erheblich, dass weder die Zusammenarbeit noch die Ergebnisse stimmen. Die Unterschiede betreffen sowohl die tägliche Zusammenarbeit als auch die inhaltliche Ausrichtung.`);
  } else if (gesamteinschaetzung === "Strategisch sinnvoll, aber anspruchsvoll") {
    paras.push(isLeader
      ? `Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die Stärke mit, die die Abteilung für ihre Aufgabe braucht. Die Person arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`
      : `Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die Stärke mit, die die Abteilung für ihre Aufgabe braucht. Die Arbeitsweisen unterscheiden sich deutlich.`);
    paras.push(`Der Einstieg ist anspruchsvoll, kann mit aktiver Führung aber sehr sinnvoll verlaufen. Die Herausforderung besteht darin, die fachliche Passung zu nutzen und gleichzeitig die Zusammenarbeit im Team tragfähig zu gestalten. Entscheidend wird sein, ob das Team bereit ist, sich auf eine andere Arbeitsweise einzulassen, und ob es die nötige Begleitung dafür erhält.`);
    if (hasGoal) {
      paras.push(`Im Bereich ${teamGoalLabel} kann die Person einen wichtigen Beitrag leisten. Gerade deshalb lohnt sich der Integrationsaufwand, wenn er bewusst begleitet wird.`);
    }
  } else if (gesamteinschaetzung === "Teilweise passend") {
    paras.push(isLeader
      ? `Die Person bringt Stärken mit, arbeitet aber in einigen Punkten anders als das Team es kennt. Ob die Führung gut ankommt, hängt davon ab, wie bewusst die ersten Wochen gestaltet werden.`
      : `Die Person passt in Teilen gut zum Team, weicht in anderen Punkten aber spürbar ab. Das kann neue Impulse bringen, braucht aber klare Absprachen.`);
    paras.push(`Einzelne Unterschiede lassen sich gut überbrücken, wenn Erwartungen früh geklärt und die Zusammenarbeit bewusst gestaltet wird. Ohne diese Klarheit könnten sich Missverständnisse aufbauen. Die Besetzung kann gelingen, ist aber kein Selbstläufer.`);
  } else {
    paras.push(isLeader
      ? `Die Person würde deutlich anders führen, als das Team es kennt. Die Arbeitsweisen unterscheiden sich in wesentlichen Bereichen. Ohne aktive Begleitung ist mit Spannungen und schwächeren Ergebnissen zu rechnen.`
      : `Die Person arbeitet deutlich anders als das Team. Die Unterschiede betreffen grundlegende Arbeitsweisen und Erwartungen. Ohne bewusste Begleitung und enge Abstimmung ist eine produktive Zusammenarbeit kaum zu erwarten.`);
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
    return `deutlich andere Arbeitsweise als das bestehende Team`;
  }
  if (!sameDominance) {
    return `setzt stärker auf ${COMP_SHORT[personPrimary]}, Team auf ${COMP_SHORT[teamPrimary]}`;
  }
  return "ähnliche Stärken wie das bestehende Team, wenig neue Impulse";
}

function buildWarumText(c: Ctx): string {
  const { isLeader, sameDominance, teamPrimary, personPrimary, hasGoal, teamGoalLabel, passungZumTeam, beitragZurAufgabe, roleName, v3 } = c;
  const paras: string[] = [];

  paras.push(`Diese Einschätzung entsteht aus dem Zusammenspiel zwischen Person, Team und ${hasGoal ? "Funktionsziel" : "Aufgabe"}. ${passungZumTeam === "hoch" && beitragZurAufgabe === "gering"
    ? "Dabei zeigt sich ein klares Muster: Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team, trifft aber die zentrale Anforderung der Aufgabe nicht in idealer Weise."
    : passungZumTeam === "hoch"
      ? "Dabei zeigt sich ein stimmiges Bild: Die Person passt in ihrer Arbeitsweise gut zum bestehenden Team."
      : passungZumTeam === "gering" && beitragZurAufgabe !== "gering"
        ? "Dabei zeigt sich eine Spannung: Die Person bringt fachlich Wertvolles mit, passt aber in ihrer Arbeitsweise nicht gut zum bestehenden Team."
        : "Dabei zeigen sich relevante Abweichungen, die im Alltag spürbar sein werden."}`);

  if (sameDominance) {
    paras.push(isLeader
      ? `Person und Team setzen in ihrer Grundausrichtung ähnliche Schwerpunkte. Dadurch ist zu erwarten, dass der Einstieg in die Führungsrolle vergleichsweise leicht gelingt. Zusammenarbeit, Abstimmung und täglicher Austausch dürften ohne grössere Reibung möglich sein. Die Person wird im bestehenden Umfeld voraussichtlich nicht als Fremdkörper wirken, sondern rasch Akzeptanz finden.`
      : `Person und Team setzen in ihrer Grundausrichtung ähnliche Schwerpunkte. Dadurch ist zu erwarten, dass der Einstieg in das Team vergleichsweise leicht gelingt. Zusammenarbeit, Abstimmung und täglicher Austausch dürften ohne grössere Reibung möglich sein. Die Person wird im bestehenden Umfeld voraussichtlich nicht als Fremdkörper wirken, sondern rasch Anschluss finden.`);
  } else {
    paras.push(isLeader
      ? `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}. Dieser Unterschied wird im Führungsalltag vor allem bei Entscheidungen, Priorisierung und im Umgang mit dem Team spürbar sein. Je deutlicher die Abweichung, desto bewusster muss die Zusammenarbeit geführt werden.`
      : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}. Dieser Unterschied wird im Alltag vor allem bei Abstimmungen, Entscheidungen und im Umgang mit Prioritäten spürbar sein. Je deutlicher die Abweichung, desto bewusster muss die Zusammenarbeit geführt werden.`);
  }

  if (hasGoal) {
    const goalKey: ComponentKey = v3.teamGoal === "analyse" ? "analytisch" : v3.teamGoal === "umsetzung" ? "impulsiv" : "intuitiv";
    if (v3.strategicFit === "passend") {
      paras.push(`Das Funktionsziel des Bereichs liegt im Schwerpunkt ${teamGoalLabel}. Die Person bringt genau dort ihre stärkste Seite mit. Das ist ein klarer Pluspunkt, der bei der Gesamtbewertung stark ins Gewicht fällt.`);
    } else if (v3.strategicFit === "abweichend") {
      paras.push(`Das Funktionsziel des Bereichs liegt im Schwerpunkt ${teamGoalLabel}. Genau dort liegt jedoch nicht die stärkste natürliche Seite der Person. Das bedeutet nicht, dass die Aufgabe grundsätzlich nicht erfüllt werden kann. Es bedeutet aber, dass die Rolle an einer Stelle besonders viel verlangt, in der die Person ihre stärkste Wirkung nicht automatisch mitbringt.`);
    } else {
      paras.push(`Das Funktionsziel des Bereichs liegt im Schwerpunkt ${teamGoalLabel}. Die Person bringt einen Teil dessen mit, was dafür gebraucht wird, aber nicht in vollem Umfang. Im Alltag kann das ausreichen, braucht aber bei höheren Anforderungen bewusste Begleitung.`);
    }

    if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
      paras.push(`Für ${roleName} ist das relevant. In diesem Umfeld geht es häufig um ${COMP_NOUN[goalKey]}. Wenn diese Punkte im Arbeitsalltag zentral sind, braucht es eine Person, die sich genau in diesem Bereich besonders natürlich bewegt. Im vorliegenden Fall ist diese Nähe nur eingeschränkt vorhanden.`);
    }
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
      ? `Auch in der Kommunikation sind zunächst keine grösseren Irritationen zu erwarten. Die Person dürfte vom Team eher als passend und verständlich wahrgenommen werden. Gerade in den ersten Wochen ist das ein klarer Vorteil, weil sich weniger Missverständnisse aus der Art der Zusammenarbeit ergeben als bei einer deutlich abweichenden Besetzung.`
      : `Auch in der Kommunikation sind zunächst keine grösseren Irritationen zu erwarten. Die Person dürfte vom Team eher als passend und verständlich wahrgenommen werden. Gerade in den ersten Wochen ist das ein klarer Vorteil, weil sich weniger Missverständnisse aus der Art der Zusammenarbeit ergeben als bei einer deutlich abweichenden Besetzung.`);
  } else if (passungZumTeam === "mittel") {
    paras.push(isLeader
      ? `Im Arbeitsalltag wird spürbar werden, dass die Person in manchen Bereichen etwas anders arbeitet als das Team es gewohnt ist. Sie setzt stärker auf ${COMP_SHORT[personPrimary]}, während das Team stärker über ${COMP_SHORT[teamPrimary]} arbeitet. Das muss kein Nachteil sein, braucht aber bewusste Abstimmung, besonders in den ersten Wochen.`
      : `Im Arbeitsalltag wird spürbar werden, dass die Person in manchen Bereichen etwas anders arbeitet als das Team es gewohnt ist. Sie setzt stärker auf ${COMP_SHORT[personPrimary]}, während das Team stärker über ${COMP_SHORT[teamPrimary]} arbeitet. Das kann das Team sinnvoll ergänzen, braucht aber klare Absprachen.`);
    paras.push(`In der Kommunikation können Unterschiede spürbar werden. ${personPrimary === "impulsiv" ? "Was die Person als klar und effizient erlebt, kann für das Team etwas zu direkt wirken." : personPrimary === "intuitiv" ? "Die Person setzt stärker auf Austausch und Dialog, was teilweise als bereichernd, aber auch als zusätzlicher Aufwand empfunden werden kann." : "Die Person kommuniziert möglicherweise etwas sachlicher als das Team es gewohnt ist, was anfangs als distanziert wirken kann."} Hier lohnt es sich, den Stil früh abzustimmen.`);
  } else {
    paras.push(isLeader
      ? `Im Arbeitsalltag wird schnell sichtbar werden, dass die Person deutlich andere Schwerpunkte setzt als das Team es kennt. Die Zusammenarbeit braucht von Anfang an klare Kommunikation und bewusste Abstimmung. Gerade Entscheidungswege, Priorisierung und der Umgang mit dem Team werden anders sein als gewohnt.`
      : `Im Arbeitsalltag wird schnell sichtbar werden, dass Person und Team nicht automatisch dieselben Schwerpunkte setzen. Die Person arbeitet ${COMP_ADJ[personPrimary]}, während das Team stärker auf ${COMP_SHORT[teamPrimary]} setzt. Das kann das Team sinnvoll ergänzen, braucht aber von Anfang an bewusste Klärung und aktive Begleitung.`);
    paras.push(`Auch in der Kommunikation werden Unterschiede spürbar sein. ${personPrimary === "impulsiv" ? "Die Person entscheidet schneller und handelt direkter als das Team es gewohnt ist. Das kann als klärend erlebt werden, aber auch als zu forsch." : personPrimary === "intuitiv" ? "Die Person setzt stärker auf Austausch und gemeinsames Arbeiten. Das Team empfindet das möglicherweise als bereichernd, aber teilweise auch als zu aufwändig." : "Die Person geht strukturierter und genauer vor als das Team es gewohnt ist. Das kann als verlässlich wahrgenommen werden, aber auch als zu detailliert oder zu langsam."} Gerade in der Anfangsphase braucht es hier klare Absprachen.`);
  }

  if (beitragZurAufgabe === "gering" && hasGoal) {
    const goalKey: ComponentKey = v3.teamGoal === "analyse" ? "analytisch" : v3.teamGoal === "umsetzung" ? "impulsiv" : "intuitiv";
    paras.push(`Im Aufgabenkern zeigt sich jedoch eine zweite Seite. Dort, wo die Rolle vor allem ${COMP_NOUN[goalKey]} verlangt, könnte die Person weniger natürliche Stärke mitbringen, als die Aufgabe eigentlich fordert. Das muss nicht sofort sichtbar werden, weil eine ${passungZumTeam === "hoch" ? "gute" : "annehmbare"} Teamintegration diesen Punkt anfangs leicht überdecken kann. Gerade deshalb ist es wichtig, Alltag und Aufgabenanforderung bewusst auseinanderzuhalten.`);
  }

  paras.push(isLeader
    ? `Für die Führungsrolle bedeutet das konkret: ${passungZumTeam === "hoch" ? "Im Teamgefüge ist die Besetzung wahrscheinlich unkompliziert." : "Im Teamgefüge braucht die Besetzung bewusste Begleitung."} ${beitragZurAufgabe === "gering" ? "Im Aufgabenkern der Rolle kann es aber Situationen geben, in denen mehr verlangt wird, als die Person von sich aus einbringt. Hier braucht es gezielte Führung." : beitragZurAufgabe === "hoch" ? "Fachlich bringt die Person genau das mit, was die Aufgabe erfordert." : "Fachlich bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang."}`
    : `Konkret bedeutet das: ${passungZumTeam === "hoch" ? "Im Teamgefüge ist die Besetzung wahrscheinlich unkompliziert." : "Im Teamgefüge braucht die Besetzung bewusste Begleitung."} ${beitragZurAufgabe === "gering" ? "Im Aufgabenkern kann es aber Situationen geben, in denen die Rolle mehr verlangt, als die Person von sich aus einbringt." : beitragZurAufgabe === "hoch" ? "Fachlich bringt die Person genau das mit, was die Aufgabe erfordert." : "Fachlich bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang."}`);

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
      ? `Die Person kann dem Team eine Qualität geben, die bisher zu wenig vorhanden war. Gerade mehr ${COMP_SHORT[personPrimary]} in der Führung kann hilfreich sein, wenn bisher Klarheit oder Richtung gefehlt haben.`
      : `Die Person kann dem Team Qualitäten bringen, die bisher zu wenig vorhanden waren. Gerade mehr ${COMP_SHORT[personPrimary]} kann hilfreich sein, wenn Themen bislang zu lange offen bleiben oder bestimmte Impulse fehlen.` });
    chancen.push({ title: `Mehr ${COMP_SHORT[personPrimary]}`, text: personPrimary === "analytisch"
      ? "Themen werden sauberer vorbereitet, klarer bearbeitet und verlässlicher nachgehalten."
      : personPrimary === "impulsiv"
        ? "Entscheidungen werden schneller getroffen und konsequenter umgesetzt."
        : "Zusammenarbeit und Austausch werden lebendiger und verbindlicher." });
    if (beitragZurAufgabe === "hoch" && hasGoal) {
      chancen.push({ title: `Passt zum Funktionsziel ${teamGoalLabel}`, text: `Die Stärken der Person liegen genau dort, wo die Abteilung sie am meisten braucht. Das macht den Integrationsaufwand strategisch sinnvoll.` });
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
    risiken.push({ title: "Höheres Integrationsrisiko", text: "Der Unterschied zur bestehenden Teamkultur ist deutlich. Ohne gute Begleitung entstehen daraus schnell Missverständnisse und das Gefühl, nicht richtig zueinander zu passen." });
    risiken.push({ title: "Sinkendes Vertrauen bei fehlender Klärung", text: "Wenn Irritationen nicht früh angesprochen werden, leidet das gegenseitige Vertrauen. Kleine Spannungen können sich schnell aufbauen und zu dauerhaften Problemen werden." });
    risiken.push({ title: "Hoher Führungsaufwand im Einstieg", text: isLeader
      ? "Auch bei fachlicher Passung kann es dauern, bis die Führung im Team wirklich ankommt und akzeptiert wird."
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
    einordnung = "Die Chancen überwiegen bei dieser Besetzung deutlich. Die Risiken sind gering und betreffen eher die langfristige Entwicklung als den kurzfristigen Einstieg. Trotzdem lohnt es sich, die Klärung von Erwartungen nicht zu vernachlässigen.";
  } else if (beitragZurAufgabe === "hoch") {
    einordnung = "Die fachliche Passung ist ein klarer Pluspunkt. Die Risiken liegen in der Teamintegration und im täglichen Miteinander. Genau deshalb ist die Besetzung strategisch sinnvoll, aber im Alltag anspruchsvoll.";
  } else {
    einordnung = "Die Besetzung ist in der Gesamtbetrachtung anspruchsvoll. Sowohl auf der Teamebene als auch im Aufgabenkern sind Herausforderungen zu erwarten. Eine bewusste Begleitung ist die Voraussetzung dafür, dass die Besetzung gelingen kann.";
  }

  return { chancen, risiken, chancenRisikenEinordnung: einordnung };
}

function buildDruckText(c: Ctx): string {
  const { isLeader, sameDominance, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, roleName } = c;
  const paras: string[] = [];

  paras.push("Unter Druck zeigt sich die natürliche Arbeitsweise eines Menschen meist deutlicher als im Normalbetrieb. Was im Alltag noch ausgeglichen oder angepasst wirkt, tritt dann klarer hervor. Stärken werden sichtbarer, aber auch Grenzen.");

  if (passungZumTeam === "hoch") {
    paras.push(isLeader
      ? `Im vorliegenden Fall ist davon auszugehen, dass die Zusammenarbeit im Team auch unter Belastung vergleichsweise stabil bleibt. Da Person und Team in ihrer Grundausrichtung ähnlich arbeiten, ist das Risiko akuter Teamreibung nicht besonders hoch. Gerade in intensiven Phasen kann das ein Vorteil sein, weil Abstimmungswege und gegenseitiges Verständnis nicht erst mühsam hergestellt werden müssen.`
      : `Im vorliegenden Fall ist davon auszugehen, dass die Zusammenarbeit im Team auch unter Belastung vergleichsweise stabil bleibt. Da Person und Team in ihrer Grundausrichtung ähnlich arbeiten, ist das Risiko akuter Teamreibung nicht besonders hoch. Gerade in intensiven Phasen kann das ein Vorteil sein, weil Abstimmungswege und gegenseitiges Verständnis nicht erst mühsam hergestellt werden müssen.`);
  } else if (passungZumTeam === "mittel") {
    paras.push(`Unter Druck können die vorhandenen Unterschiede zwischen Person und Team spürbarer werden. ${personPrimary === "impulsiv" ? "Die Person wird voraussichtlich schneller und direkter handeln, was zu Irritationen führen kann." : personPrimary === "intuitiv" ? "Die Person wird voraussichtlich stärker auf Austausch setzen, was als Verzögerung erlebt werden kann." : "Die Person wird voraussichtlich genauer und vorsichtiger vorgehen, was als Bremsen erlebt werden kann."} Frühe Absprachen helfen, das aufzufangen. Im Kern bleibt die Zusammenarbeit aber tragfähig, wenn die Rollen klar sind.`);
  } else {
    paras.push(`Unter Druck werden die Unterschiede zwischen Person und Team nicht kleiner, sondern grösser. ${personPrimary === "impulsiv" ? "Die Person wird voraussichtlich noch schneller und direkter handeln, was das Team als übergehend erleben kann." : personPrimary === "intuitiv" ? "Die Person wird voraussichtlich noch stärker auf Austausch und Abstimmung setzen, was das Team als verzögernd erleben kann." : "Die Person wird unter Druck voraussichtlich noch genauer und kontrollierter arbeiten. Das kann im Team als bremsend oder zu streng erlebt werden."} Gerade in solchen Momenten entscheidet sich, ob die Zusammenarbeit tragfähig bleibt oder ob sich Spannungen aufbauen.`);
  }

  if (beitragZurAufgabe === "gering") {
    paras.push(`Die anspruchsvollere Seite liegt erneut im Aufgabenkern. Wenn unter Druck nicht nur Tempo, sondern zugleich ${hasGoal ? `${teamGoalLabel}` : "fachliche Sorgfalt und Qualität"} gefragt ${hasGoal ? "ist" : "sind"}, steigt die Anforderung an Führung deutlich. In solchen Situationen reicht gute Teampassung allein nicht aus. Dann braucht es klare Prioritäten, eindeutige Verantwortlichkeiten und eine bewusste Sicherung von Qualität und Struktur.`);
  }

  paras.push(`Für die Praxis bedeutet das: Unter Belastung sollte besonders klar definiert sein, was zuerst erledigt werden muss, wo keine Abkürzungen entstehen dürfen und welche Standards auch unter Zeitdruck gelten. ${beitragZurAufgabe === "gering"
    ? "Gerade im fachlichen Kern der Rolle ist es wichtig, dass Führung nicht nur auf Geschwindigkeit achtet, sondern bewusst auch auf Nachvollziehbarkeit, Vollständigkeit und Qualität."
    : "Klare Entscheidungswege und eindeutige Verantwortung sind dann besonders wichtig."}`);

  if (beitragZurAufgabe === "gering") {
    paras.push("Dort zeigt sich am deutlichsten, ob die Person die Rolle wirklich tragen kann oder ob sie im Aufgabenkern dauerhaft zu viel Führung und Korrektur benötigt.");
  }

  return paras.join("\n\n");
}

function buildFuehrungshinweis(c: Ctx): V4Block[] {
  const { sameDominance, teamPrimary, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;
  const items: V4Block[] = [];

  if (passungZumTeam === "hoch") {
    items.push({ title: "Was das Team von der Führung erwartet", text: `Dieses Team arbeitet bevorzugt über ${COMP_SHORT[teamPrimary]}. Da die Führungskraft ähnlich arbeitet, wird sie voraussichtlich schnell als passend erlebt. Trotzdem muss die Rolle aktiv gestaltet werden. Das Team wird nicht automatisch differenzieren zwischen „passt gut zu uns" und „führt uns gut". Genau das muss die Führungskraft bewusst klären: Wo gehe ich mit dem Team, und wo setze ich eigene Akzente?` });
    items.push({ title: "Worauf die Führungskraft achten sollte", text: "Bei hoher Ähnlichkeit besteht das Risiko, dass die Führung zu wenig Richtung gibt. Das Team fühlt sich wohl, aber es fehlt der Impuls, Dinge anders oder besser zu machen. Die Führungskraft sollte früh klären, wo sie bewusst Orientierung gibt und wo sie dem Team Raum lässt." });
    if (beitragZurAufgabe === "gering") {
      items.push({ title: "Führung im Aufgabenkern absichern", text: hasGoal
        ? `Gerade im Bereich ${teamGoalLabel} sollte die Führungskraft nicht nur delegieren, sondern aktiv Standards setzen. Wenn die eigene Stärke dort nicht liegt, braucht es klare Vorgaben, definierte Prüfpunkte oder jemanden im Team, der diesen Bereich fachlich absichert.`
        : "Gerade im fachlichen Kern der Rolle sollte die Führungskraft nicht nur delegieren, sondern aktiv Standards setzen. Wenn die eigene Stärke dort nicht liegt, braucht es klare Vorgaben, definierte Prüfpunkte oder jemanden im Team, der diesen Bereich fachlich absichert." });
    }
  } else {
    items.push({ title: "Wie das Team auf diese Führung reagieren wird", text: sameDominance
      ? `Das Team teilt mit der Führungskraft eine ähnliche Grundrichtung, erlebt aber in Einzelbereichen eine andere Gewichtung. Anfangs kann das als Bereicherung wahrgenommen werden. Wenn es jedoch zu lange unklar bleibt, wofür die Führung steht, entsteht Verunsicherung. Die Führungskraft sollte deshalb früh klarmachen, was sich ändert und was bleibt.`
      : `Das Team ist stärker auf ${COMP_SHORT[teamPrimary]} ausgerichtet. Die Führungskraft setzt auf ${COMP_SHORT[personPrimary]}. Das Team wird diesen Unterschied spüren, bevor er benannt wird. Manche erleben das als klärend und hilfreich, andere als fremd oder verunsichernd. Genau deshalb ist es wichtig, dass die Führungskraft den eigenen Stil früh erklärt und Brücken baut.` });

    items.push({ title: "Wo die grösste Führungsherausforderung liegt", text: personPrimary === "impulsiv"
      ? "Die Führungskraft entscheidet schneller und direkter als das Team es gewohnt ist. Das kann Tempo bringen, aber auch Widerstand auslösen. Die Herausforderung liegt darin, das Team mitzunehmen, ohne den eigenen Stil aufzugeben. Transparenz bei Entscheidungen ist der Schlüssel."
      : personPrimary === "intuitiv"
        ? "Die Führungskraft setzt stärker auf Dialog und gemeinsame Abstimmung. Das Team, das eher an andere Wege gewohnt ist, kann das anfangs als Umweg erleben. Die Herausforderung liegt darin, den Mehrwert von Austausch sichtbar zu machen, ohne Entscheidungen unnötig zu verzögern."
        : "Die Führungskraft geht strukturierter und gründlicher vor als das Team es kennt. Das kann Klarheit schaffen, aber auch als Kontrolle oder Langsamkeit erlebt werden. Die Herausforderung liegt darin, Struktur einzuführen, ohne das Team zu bremsen." });

    items.push({ title: "Was die Führungskraft in den ersten Wochen tun sollte", text: passungZumTeam === "gering"
      ? "Vor allem: zuhören, beobachten, und dann erst führen. Das Team muss verstehen, wofür die neue Führung steht. Dafür braucht es frühe Einzelgespräche, klare Ansagen zu Entscheidungswegen und sichtbare Präsenz. Erst wenn das Team weiss, woran es ist, kann echte Führung greifen."
      : "In den ersten Wochen sollte die Führungskraft bewusst klären: Wie will ich führen? Was erwarte ich? Was kann das Team von mir erwarten? Dieses Gespräch muss aktiv geführt werden, es findet nicht von alleine statt. Je früher es stattfindet, desto weniger Raum bleibt für Interpretationen und stille Widerstände." });
  }

  if (hasGoal && beitragZurAufgabe !== "gering") {
    items.push({ title: `Führung im Kontext von ${teamGoalLabel}`, text: `Das Funktionsziel ${teamGoalLabel} gibt der Führungsarbeit eine klare Richtung. Die Führungskraft sollte dieses Ziel aktiv nutzen, um Erwartungen zu rahmen, Prioritäten zu setzen und dem Team Orientierung zu geben. Das hilft besonders dann, wenn Unterschiede im Stil auftreten, weil die gemeinsame Aufgabe als verbindende Klammer wirkt.` });
  }

  return items;
}

function buildRisikoprognose(c: Ctx): V4RiskPhase[] {
  const { isLeader, sameDominance, teamPrimary, personPrimary, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, roleName } = c;

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "hoch") {
    return [
      { label: "Kurzfristig", period: "0 – 3 Monate", text: `Der Einstieg als ${roleName} verläuft voraussichtlich reibungsarm. Person und Team arbeiten ähnlich und die fachliche Passung ist gegeben. In dieser Phase sind keine grösseren Risiken zu erwarten.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: "Die Zusammenarbeit stabilisiert sich. Das Risiko besteht darin, dass die hohe Ähnlichkeit zu wenig Entwicklungsimpulse setzt. Führung sollte bewusst darauf achten, ob das Team neue Impulse braucht." },
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
        ? `Die Person bringt fachlich das Richtige mit, wird aber im Team auf Widerstand stossen. Die Arbeitsweise – stärker auf ${personDesc} ausgerichtet – unterscheidet sich spürbar von der Teamkultur. Erste Irritationen entstehen in Abstimmungen und Entscheidungswegen.`
        : `Die Person bringt fachlich das Richtige mit, arbeitet aber anders als das Team. Der Unterschied zwischen ${personDesc} und ${teamDesc} wird in den ersten Wochen spürbar. Missverständnisse und Reibung sind wahrscheinlich.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: `Ohne aktive Begleitung kann die Person fachlich liefern, aber im Team isoliert werden. Die unterschiedlichen Arbeitsweisen verfestigen sich. Das Team entwickelt Workarounds statt echter Zusammenarbeit. Die fachliche Stärke kommt nicht voll zum Tragen.` },
      { label: "Langfristig", period: "12+ Monate", text: `Wenn die Integration nicht gelingt, geht der fachliche Mehrwert verloren. Die Person arbeitet zunehmend neben dem Team statt mit dem Team. Die Besetzung kann dennoch gut funktionieren, wenn Führung die Verbindung zum Team dauerhaft aktiv gestaltet.` },
    ];
  }

  if (passungZumTeam === "mittel") {
    return [
      { label: "Kurzfristig", period: "0 – 3 Monate", text: isLeader
        ? `Die Person wird als ${roleName} teilweise anders arbeiten als das Team es kennt. Der Unterschied zwischen ${personDesc} und ${teamDesc} wird in Abstimmungen sichtbar. Einzelne Irritationen sind wahrscheinlich, aber gut handhabbar.`
        : `Im Einstieg wird spürbar, dass Person und Team nicht automatisch gleich arbeiten. Der Unterschied zwischen ${personDesc} und ${teamDesc} zeigt sich in Abstimmungen und Erwartungen. Mit bewusster Klärung bleibt das Risiko beherrschbar.` },
      { label: "Mittelfristig", period: "3 – 12 Monate", text: `Die Unterschiede in der Arbeitsweise werden Teil des Alltags. Wenn sie nicht aktiv besprochen werden, entstehen stille Missverständnisse.${beitragZurAufgabe === "gering" && hasGoal ? ` Im Bereich ${teamGoalLabel} zeigt sich zusätzlich, dass die Person dort nicht die volle Stärke mitbringt.` : ""} Regelmässige Abstimmung ist nötig.` },
      { label: "Langfristig", period: "12+ Monate", text: `Mit gezielter Führung kann die Besetzung dauerhaft funktionieren. Ohne diese Begleitung besteht das Risiko, dass sich Unterschiede verfestigen und die Zusammenarbeit oberflächlich bleibt. Halbjährliche Überprüfung empfohlen.` },
    ];
  }

  return [
    { label: "Kurzfristig", period: "0 – 3 Monate", text: isLeader
      ? `Die Person wird als ${roleName} deutlich anders arbeiten als das Team es kennt. Die Arbeitsweisen unterscheiden sich in wesentlichen Bereichen. Bereits in den ersten Wochen sind Spannungen und Missverständnisse wahrscheinlich. Ohne enge Begleitung entstehen schnell Konflikte.`
      : `Person und Team setzen grundlegend unterschiedliche Schwerpunkte. Die Person arbeitet über ${personDesc}, das Team über ${teamDesc}. Bereits in den ersten Wochen entstehen Reibungen in Abstimmung, Kommunikation und Erwartungen.` },
    { label: "Mittelfristig", period: "3 – 12 Monate", text: isLeader
      ? `Ohne aktive Begleitung verliert die Führung an Wirkung. Das Team folgt der Führung nicht, weil der Stil als fremd erlebt wird. Entscheidungen werden umgangen oder verzögert. Die Person kann fachlich nicht das einbringen, was sie mitbringt.`
      : `Die Unterschiede verfestigen sich. Die Person wird im Team zunehmend als Fremdkörper erlebt. Workarounds ersetzen echte Zusammenarbeit. Ohne klare Rahmensetzung sinken Motivation und Ergebnisse auf beiden Seiten.` },
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
        num: 1, title: "Orientierung und Erwartungsklärung", period: "Tag 1 – 10",
        ziel: isLeader
          ? `Führungsrolle als ${roleName} im Team verankern und gegenseitige Erwartungen klären.`
          : `Als ${roleName} im Team ankommen und Arbeitsweise abstimmen.`,
        items: [
          "Bestehende Abläufe, Schnittstellen und Entscheidungswege kennenlernen.",
          isLeader ? "Erwartungen des Teams an die Führung aktiv erfragen." : "Erwartungen des Teams an die Zusammenarbeit aktiv erfragen.",
          isLeader ? "Eigene Führungsprioritäten transparent machen." : "Eigene Arbeitsweise und Stärken sichtbar machen.",
          ...(beitragZurAufgabe === "gering" && hasGoal ? [`Anforderungen im Bereich ${teamGoalLabel} gezielt klären.`] : []),
        ],
        fokus: {
          intro: `Die Arbeitsweisen passen gut zusammen. Trotzdem muss in den ersten Tagen geklärt werden:`,
          bullets: [
            "Welche Erwartungen bestehen konkret an diese Rolle?",
            isLeader ? "Wie will die Führungskraft führen und entscheiden?" : "Wie soll die Zusammenarbeit im Alltag aussehen?",
            "Wo liegen die wichtigsten Schnittstellen und Prioritäten?",
          ],
        },
      },
      {
        num: 2, title: "Erste Wirkung und Rückmeldung", period: "Tag 11 – 20",
        ziel: isLeader
          ? `Erste Führungswirkung als ${roleName} zeigen und Rückmeldung einholen.`
          : `Erste Arbeitsergebnisse als ${roleName} liefern und Feedback einholen.`,
        items: [
          isLeader ? "Erste eigene Entscheidungen treffen und transparent kommunizieren." : "Erste Aufgaben eigenständig übernehmen und abschliessen.",
          "Aktiv Rückmeldung zur eigenen Wirkung einholen.",
          ...(beitragZurAufgabe === "gering" ? ["Im fachlichen Kern der Rolle bewusst auf Qualität und Standards achten."] : []),
          isLeader ? "Zusammenarbeit mit dem Team bewusst gestalten." : "Zusammenarbeit mit Teamkollegen aktiv aufbauen.",
        ],
        fokus: {
          intro: `Die Integration verläuft voraussichtlich reibungsarm. Jetzt geht es darum:`,
          bullets: [
            "Erste Ergebnisse sichtbar zu machen",
            "Rückmeldung aktiv einzuholen, bevor sich Gewohnheiten festigen",
            ...(beitragZurAufgabe === "gering" ? [`Fachliche Anforderungen${hasGoal ? ` im Bereich ${teamGoalLabel}` : ""} nicht aus den Augen zu verlieren`] : []),
          ],
        },
      },
      {
        num: 3, title: "Verankerung und Standortbestimmung", period: "Tag 21 – 30",
        ziel: `Arbeitsweise als ${roleName} stabilisieren und erste Standortbestimmung durchführen.`,
        items: [
          "Zusammenfassendes Feedback-Gespräch mit der direkten Führung.",
          isLeader ? "Führungsrhythmus und Entscheidungswege überprüfen." : "Arbeitsrhythmus und Prioritäten überprüfen.",
          "Offene Punkte identifizieren und nächste Schritte vereinbaren.",
          ...(beitragZurAufgabe === "gering" ? ["Bewusste Standortbestimmung im fachlichen Kern der Rolle."] : []),
        ],
        fokus: {
          intro: `Nach 30 Tagen sollte klar sein:`,
          bullets: [
            "Funktioniert die Zusammenarbeit im Alltag wie erwartet?",
            isLeader ? "Wird die Führung vom Team angenommen?" : "Ist die Person im Team angekommen?",
            "Wo braucht es Nachjustierung?",
          ],
        },
      },
    ];
  }

  return [
    {
      num: 1, title: "Orientierung und Brücken bauen", period: "Tag 1 – 10",
      ziel: isLeader
        ? `Als ${roleName} im Team Vertrauen aufbauen und Unterschiede in der Arbeitsweise aktiv ansprechen.`
        : `Als ${roleName} ankommen und die Unterschiede zwischen eigener Arbeitsweise und Teamkultur verstehen.`,
      items: [
        `Bestehende Teamkultur und Arbeitsweise (Schwerpunkt ${teamDesc}) kennenlernen.`,
        isLeader ? "Eigenen Führungsstil erklären und Brücken zur Teamkultur bauen." : "Eigene Arbeitsweise erklären und Gemeinsamkeiten betonen.",
        isLeader ? "Einzelgespräche mit jedem Teammitglied in der ersten Woche." : "Gespräche mit wichtigen Teamkollegen und Schnittstellen suchen.",
        `Unterschiede zwischen ${personDesc} und ${teamDesc} offen ansprechen.`,
        ...(hasGoal ? [`Anforderungen im Bereich ${teamGoalLabel} gezielt klären.`] : []),
      ],
      fokus: {
        intro: `Die Arbeitsweisen unterscheiden sich. Deshalb ist in den ersten Tagen besonders wichtig:`,
        bullets: [
          "Wie arbeitet das Team und warum?",
          isLeader ? "Was erwartet das Team von der Führung?" : "Was erwartet das Team von neuen Teammitgliedern?",
          "Wo entstehen die ersten Reibungspunkte und wie lassen sie sich entschärfen?",
        ],
      },
    },
    {
      num: 2, title: "Unterschiede produktiv machen", period: "Tag 11 – 20",
      ziel: isLeader
        ? `Den eigenen Führungsstil mit der Teamkultur verbinden und erste Ergebnisse erzielen.`
        : `Die eigene Stärke einbringen und gleichzeitig die Teamkultur respektieren.`,
      items: [
        isLeader ? "Erste Führungsentscheidungen treffen und dem Team die Logik dahinter erklären." : "Erste Aufgaben eigenständig umsetzen und Ergebnisse zeigen.",
        `Bewusst Situationen schaffen, in denen ${personDesc} dem Team hilft.`,
        "Aktiv Rückmeldung einholen: Wie wird die eigene Arbeitsweise erlebt?",
        ...(beitragZurAufgabe === "gering" && hasGoal ? [`Im Bereich ${teamGoalLabel} bewusst Standards einhalten und nachfragen.`] : []),
        isLeader ? "Teamregeln und Entscheidungswege gemeinsam vereinbaren." : "Abstimmungsrhythmus mit dem Team finden.",
      ],
      fokus: {
        intro: `Die erste Orientierung ist abgeschlossen. Jetzt muss die Person zeigen:`,
        bullets: [
          "Dass die eigene Stärke dem Team einen Mehrwert bringt",
          "Dass Unterschiede kein Hindernis sind, sondern bewusst genutzt werden",
          isLeader ? "Dass Führung Richtung gibt, ohne die Teamkultur zu überfahren" : "Dass Zusammenarbeit trotz unterschiedlicher Arbeitsweisen funktioniert",
        ],
      },
    },
    {
      num: 3, title: "Standortbestimmung und Weichenstellung", period: "Tag 21 – 30",
      ziel: `Ehrliche Bestandsaufnahme nach 30 Tagen: Funktioniert die Integration?`,
      items: [
        "Strukturiertes Feedback-Gespräch mit der direkten Führung.",
        isLeader ? "Rückmeldung aus dem Team zur Führungswirkung einholen." : "Rückmeldung aus dem Team zur Zusammenarbeit einholen.",
        `Bewerten: Sind die Unterschiede zwischen ${personDesc} und ${teamDesc} produktiv oder belastend?`,
        "Konkrete Massnahmen für die nächsten 60 Tage vereinbaren.",
        ...(beitragZurAufgabe === "gering" ? ["Fachliche Standortbestimmung im Aufgabenkern der Rolle."] : []),
      ],
      fokus: {
        intro: `Nach 30 Tagen muss ehrlich bewertet werden:`,
        bullets: [
          isLeader ? "Akzeptiert das Team die Führung?" : "Ist die Person im Team angekommen?",
          "Werden die Unterschiede als Bereicherung oder als Belastung erlebt?",
          "Welche Massnahmen braucht es für die nächsten Wochen?",
        ],
      },
    },
  ];
}

function buildEmpfehlungen(c: Ctx): V4Block[] {
  const { isLeader, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;

  const item1Title = "Erwartungen in den ersten Tagen klären";
  const item1Text = passungZumTeam === "hoch"
    ? (isLeader
      ? "Die gute Teampassung erleichtert den Einstieg. Trotzdem sollten die konkreten Anforderungen der Führungsrolle von Anfang an klar benannt werden, damit aus einem guten Start auch stabile Ergebnisse entstehen."
      : "Die gute Teampassung erleichtert den Einstieg. Trotzdem sollten die konkreten Anforderungen der Rolle von Anfang an klar benannt werden, damit aus einem guten Start auch stabile Ergebnisse entstehen.")
    : (isLeader
      ? "Die Arbeitsweisen unterscheiden sich. Deshalb sollte in den ersten Tagen offen besprochen werden, wie Führung, Kommunikation und Entscheidungswege im Alltag aussehen sollen."
      : "Die Arbeitsweisen unterscheiden sich. Deshalb sollte in den ersten Tagen offen besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen.");

  let item2Title: string;
  let item2Text: string;
  if (beitragZurAufgabe === "gering" && hasGoal) {
    item2Title = `Fachliche Qualität im Bereich ${teamGoalLabel} sichern`;
    item2Text = `Im Aufgabenkern der Rolle braucht es klare Standards. Die Person sollte wissen, woran gute Arbeit im Bereich ${teamGoalLabel} konkret gemessen wird.`;
  } else if (passungZumTeam !== "hoch") {
    item2Title = "Integration ins Team aktiv gestalten";
    item2Text = "Darauf achten, dass die Person nicht nur Aufgaben bekommt, sondern auch Zugang zum Team findet. Unterschiede in der Arbeitsweise offen ansprechen und Brücken bauen.";
  } else {
    item2Title = "Zusammenarbeit bewusst gestalten";
    item2Text = isLeader
      ? "Auch bei guter Passung sollte die Führungswirkung nach den ersten Wochen bewusst überprüft werden. Gute Integration bedeutet nicht automatisch, dass alle Erwartungen erfüllt sind."
      : "Auch bei guter Passung sollte die Zusammenarbeit nach den ersten Wochen bewusst überprüft werden. Gute Integration bedeutet nicht automatisch, dass alle Erwartungen erfüllt sind.";
  }

  const item3Title = "Standortbestimmung nach 30 Tagen";
  const item3Text = beitragZurAufgabe === "gering"
    ? "Nach 30 Tagen bewusst bewerten: Läuft die Zusammenarbeit? Und stimmt die Leistung im fachlichen Kern der Rolle? Diese beiden Fragen getrennt beantworten."
    : "Nach 30 Tagen bewusst bewerten: Funktioniert die Zusammenarbeit wie erwartet? Wo braucht es Nachjustierung? Eine ehrliche Standortbestimmung sichert den langfristigen Erfolg der Besetzung.";

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
    paras.push(`Ohne diese Besetzung bleibt das Team in seiner bisherigen Ausrichtung stabil. Die Arbeitsweise mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]} wird sich fortsetzen. Das bedeutet Kontinuität, aber auch, dass bestehende blinde Flecken bestehen bleiben.`);
    if (hasGoal && beitragZurAufgabe === "gering") {
      paras.push(`Besonders im Bereich ${teamGoalLabel} fehlt dem Team weiterhin eine natürliche Verstärkung. Die bisherige Lücke wird nicht geschlossen. Ob das kritisch ist, hängt davon ab, wie stark die Anforderungen in diesem Bereich steigen.`);
    } else if (hasGoal && beitragZurAufgabe === "hoch") {
      paras.push(`Im Bereich ${teamGoalLabel} bleibt die aktuelle Stärke erhalten. Allerdings verzichtet das Team auf eine Person, die genau dort einen echten Beitrag hätte leisten können.`);
    }
  } else {
    paras.push(`Ohne diese Besetzung bleibt das Team in seiner bisherigen Form bestehen. Die Arbeitsweise mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]} wird sich nicht verändern. Neue Impulse in Richtung ${COMP_SHORT[personPrimary]} bleiben aus.`);
    if (passungZumTeam !== "hoch") {
      paras.push(`Das hat den Vorteil, dass keine Integrationsarbeit nötig ist. Es gibt keine Reibung durch unterschiedliche Arbeitsweisen, keine aufwändige Einarbeitung und keinen zusätzlichen Führungsaufwand. Die Zusammenarbeit bleibt eingespielt.`);
    }
    if (beitragZurAufgabe === "hoch" && hasGoal) {
      paras.push(`Gleichzeitig verzichtet das Team auf eine Person, die im Bereich ${teamGoalLabel} genau die richtige Stärke mitgebracht hätte. Ob diese fachliche Lücke anderweitig geschlossen werden kann, sollte geprüft werden.`);
    } else if (beitragZurAufgabe === "gering" && hasGoal) {
      paras.push(`Im Bereich ${teamGoalLabel} ändert sich ebenfalls nichts. Allerdings war die fachliche Passung der Person in diesem Bereich ohnehin nicht stark, sodass der Verzicht hier weniger ins Gewicht fällt.`);
    }
  }

  paras.push(isLeader
    ? "Für die Führung bedeutet das: Kein zusätzlicher Aufwand, aber auch keine neue Dynamik. Ob das Team in seiner jetzigen Zusammensetzung langfristig die richtigen Ergebnisse liefert, sollte unabhängig von dieser Besetzungsentscheidung bewertet werden."
    : "Für das Team bedeutet das: Die bisherige Dynamik bleibt erhalten. Ob das ausreicht, um die anstehenden Anforderungen zu bewältigen, sollte unabhängig von dieser Besetzungsentscheidung bewertet werden.");

  return paras.join("\n\n");
}

function buildSchlussfazit(c: Ctx): string {
  const { isLeader, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, gesamteinschaetzung } = c;

  if (gesamteinschaetzung === "Gut passend") {
    return isLeader
      ? "Die Besetzung ist aus unserer Sicht empfehlenswert. Person und Führungsrolle passen gut zusammen, die Teamintegration dürfte reibungsarm verlaufen. Mit klaren Erwartungen von Anfang an kann diese Besetzung schnell produktiv werden."
      : "Die Besetzung ist aus unserer Sicht empfehlenswert. Person und Team passen gut zusammen. Mit klaren Erwartungen und einem bewussten Einstieg kann die Zusammenarbeit schnell produktiv werden.";
  }

  if (passungZumTeam === "hoch" && beitragZurAufgabe === "gering") {
    return `Die Person passt gut ins Team, bringt aber im Aufgabenkern${hasGoal ? ` (${teamGoalLabel})` : ""} nicht die volle Stärke mit. Die Besetzung kann funktionieren, wenn fachliche Erwartungen von Anfang an klar formuliert und regelmässig überprüft werden. Ohne diese Klarheit besteht das Risiko, dass gute Integration über fachliche Lücken hinwegtäuscht.`;
  }

  if (passungZumTeam !== "hoch" && beitragZurAufgabe === "hoch") {
    return `Die Person bringt fachlich genau das Richtige mit${hasGoal ? ` für den Bereich ${teamGoalLabel}` : ""}. Die Integration ins Team ist allerdings anspruchsvoll. Die Besetzung lohnt sich, wenn Führung bereit ist, die ersten Monate aktiv zu begleiten und die Verbindung zwischen Person und Team bewusst zu gestalten.`;
  }

  if (gesamteinschaetzung === "Teilweise passend") {
    return "Die Besetzung ist machbar, aber kein Selbstläufer. Einzelne Unterschiede in der Arbeitsweise sind überbrückbar, wenn Erwartungen früh geklärt werden. Entscheidend ist, ob Führung bereit ist, den Einstieg aktiv zu begleiten.";
  }

  if (gesamteinschaetzung === "Eingeschränkt passend") {
    return "Die Besetzung birgt erhebliche Risiken, sowohl in der Teamintegration als auch im fachlichen Kern der Rolle. Sie ist nur dann sinnvoll, wenn von Anfang an gezielte Begleitung und klare Rahmensetzung gewährleistet sind.";
  }

  if (gesamteinschaetzung === "Kritisch") {
    return isLeader
      ? "Die Besetzung ist in der aktuellen Zusammensetzung kritisch. Die Unterschiede zwischen Führungsstil und Teamkultur sind so gross, dass ohne dauerhaft hohen Führungsaufwand weder die Integration noch die Ergebnisse gesichert sind. Es sollte geprüft werden, ob eine alternative Besetzung sinnvoller wäre."
      : "Die Besetzung ist in der aktuellen Zusammensetzung kritisch. Die Unterschiede zwischen Person und Team sind so gross, dass ohne dauerhaft enge Begleitung weder die Zusammenarbeit noch die Ergebnisse stimmen werden. Eine alternative Besetzung sollte ernsthaft geprüft werden.";
  }

  return isLeader
    ? "Die Besetzung ist unter bestimmten Voraussetzungen tragfähig. Entscheidend ist, ob Führung bereit ist, die Integration aktiv zu begleiten und die fachlichen Anforderungen klar zu formulieren. Ohne diesen Einsatz bleibt das Ergebnis unsicher."
    : "Die Besetzung ist unter bestimmten Voraussetzungen tragfähig. Entscheidend ist, wie bewusst der Einstieg gestaltet wird und ob die Unterschiede in der Arbeitsweise offen besprochen werden. Ohne aktive Begleitung bleibt das Ergebnis unsicher.";
}
