import type { Triad, ComponentKey } from "./bio-types";
import { computeTeamCheckV3, type TeamCheckV3Input, type TeamCheckV3Result, type TeamGoal } from "./teamcheck-v3-engine";
import { getPrimaryKey, getSecondaryKey } from "./teamcheck-v2-engine";

export interface V4Block {
  title: string;
  text: string;
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

  empfehlungen: V4Block[];

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
    empfehlungen: buildEmpfehlungen(ctx),
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
    if (hasGoal) {
      paras.push(`Für die konkreten Anforderungen der Aufgabe bringt die Person jedoch nicht die ideale Stärke mit. Das Team profitiert von der Besetzung vor allem in der Zusammenarbeit und im Anschluss an bestehende Abläufe. Im eigentlichen Funktionsziel des Bereichs, hier mit dem Schwerpunkt ${teamGoalLabel}, ist die Passung dagegen geringer ausgeprägt.`);
      paras.push(`Damit ergibt sich ein gemischtes, aber gut einordbares Bild: Im Team passend, für die zentrale Aufgabenanforderung nur eingeschränkt ideal. Die Besetzung kann funktionieren, sollte fachlich aber nicht sich selbst überlassen werden. Gerade dort, wo ${COMP_NOUN[c.v3.teamGoal === "analyse" ? "analytisch" : c.v3.teamGoal === "umsetzung" ? "impulsiv" : "intuitiv"]} wichtig ${c.v3.teamGoal === "analyse" ? "sind" : "ist"}, braucht es bewusste Führung und klare Erwartungen.`);
    } else {
      paras.push(`Für die konkreten Anforderungen der Aufgabe bringt die Person jedoch nicht die ideale Stärke mit. Das Team profitiert von der Besetzung vor allem in der Zusammenarbeit und im Anschluss an bestehende Abläufe. Im eigentlichen Aufgabenkern ist die Passung dagegen geringer ausgeprägt.`);
      paras.push(`Damit ergibt sich ein gemischtes, aber gut einordbares Bild: Im Team passend, für die zentrale Aufgabenanforderung nur eingeschränkt ideal. Die Besetzung kann funktionieren, sollte fachlich aber nicht sich selbst überlassen werden. Gerade dort, wo die eigentliche Kernanforderung der Rolle liegt, braucht es bewusste Führung und klare Erwartungen.`);
    }
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
    paras.push(`Das ergibt eine anspruchsvolle, aber nicht hoffnungslose Ausgangslage. Die fachliche Passung ist gegeben, die Integration braucht aber bewusste Führung. Die Besetzung kann gelingen, wenn die Unterschiede früh angesprochen und die Erwartungen klar geregelt werden.`);
    if (hasGoal) {
      paras.push(`Im Bereich ${teamGoalLabel} kann die Person einen echten Beitrag leisten. Ob dieser Beitrag zum Tragen kommt, hängt aber davon ab, wie gut die Integration ins Team gelingt.`);
    }
  } else if (gesamteinschaetzung === "Eingeschränkt passend") {
    paras.push(isLeader
      ? `Die Person passt nur bedingt zum Team und erfüllt die fachlichen Anforderungen der Rolle ebenfalls nicht ideal. Die Führungskraft arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`
      : `Die Person passt nur bedingt zum Team und bringt für die konkrete Aufgabe nicht die ideale Stärke mit. Die Arbeitsweisen unterscheiden sich spürbar.`);
    paras.push(`Die Besetzung ist nur dann sinnvoll, wenn von Anfang an gezielte Begleitung und klare Rahmensetzung gewährleistet sind. Ohne diese Voraussetzungen ist das Risiko erheblich, dass weder die Zusammenarbeit noch die Ergebnisse stimmen. Die Unterschiede betreffen sowohl die tägliche Zusammenarbeit als auch die inhaltliche Ausrichtung.`);
  } else if (gesamteinschaetzung === "Strategisch sinnvoll, aber anspruchsvoll") {
    paras.push(isLeader
      ? `Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die Stärke mit, die die Abteilung für ihre Aufgabe braucht. Die Person arbeitet ${COMP_ADJ[c.personPrimary]}, während das Team stärker auf ${COMP_SHORT[c.teamPrimary]} setzt.`
      : `Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die Stärke mit, die die Abteilung für ihre Aufgabe braucht. Die Arbeitsweisen unterscheiden sich deutlich.`);
    paras.push(`Der Einstieg ist anspruchsvoll, kann aber bei aktiver Führung sehr sinnvoll sein. Die Herausforderung besteht darin, die fachliche Passung zu nutzen und gleichzeitig die Zusammenarbeit im Team tragfähig zu gestalten. Entscheidend wird sein, ob das Team bereit ist, sich auf eine andere Arbeitsweise einzulassen, und ob es die nötige Begleitung dafür erhält.`);
    if (hasGoal) {
      paras.push(`Im Bereich ${teamGoalLabel} kann die Person einen wichtigen Beitrag leisten. Gerade deshalb lohnt sich der Integrationsaufwand, wenn er bewusst gesteuert wird.`);
    }
  } else if (gesamteinschaetzung === "Teilweise passend") {
    paras.push(isLeader
      ? `Die Person bringt Stärken mit, arbeitet aber in einigen Punkten anders als das Team es kennt. Ob die Führung gut ankommt, hängt davon ab, wie bewusst die ersten Wochen gestaltet werden.`
      : `Die Person passt in Teilen gut zum Team, weicht in anderen Punkten aber spürbar ab. Das kann neue Impulse bringen, braucht aber klare Absprachen.`);
    paras.push(`Einzelne Unterschiede lassen sich gut überbrücken, wenn Erwartungen früh geklärt und die Zusammenarbeit aktiv gesteuert wird. Ohne diese Klarheit könnten sich Missverständnisse aufbauen. Die Besetzung kann gelingen, ist aber kein Selbstläufer.`);
  } else {
    paras.push(isLeader
      ? `Die Person würde deutlich anders führen, als das Team es kennt. Die Arbeitsweisen unterscheiden sich in wesentlichen Bereichen. Ohne aktive Begleitung ist mit Spannungen und schwächeren Ergebnissen zu rechnen.`
      : `Die Person arbeitet deutlich anders als das Team. Die Unterschiede betreffen grundlegende Arbeitsweisen und Erwartungen. Ohne bewusste Steuerung und enge Abstimmung ist eine produktive Zusammenarbeit kaum zu erwarten.`);
    paras.push(`Die Besetzung ist im aktuellen Umfeld kritisch und nur mit enger Begleitung tragfähig. Ohne aktive Führung und klare Absprachen ist das Risiko hoch, dass die Person weder fachlich noch im Teamalltag wirklich ankommt. Die Unterschiede in Arbeitsweise und Erwartung sind so gross, dass eine erfolgreiche Zusammenarbeit nur mit engmaschiger Steuerung und klarer Rahmensetzung von Beginn an möglich ist.`);
  }

  return paras.join("\n\n");
}

function buildHauptstaerke(c: Ctx): string {
  const { sameDominance, personPrimary, beitragZurAufgabe, hasGoal, teamGoalLabel } = c;
  if (sameDominance) {
    return "gute Anschlussfähigkeit im bestehenden Team";
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
      ? `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}. Dieser Unterschied wird im Führungsalltag vor allem bei Entscheidungen, Priorisierung und im Umgang mit dem Team spürbar sein. Je grösser die Abweichung, desto mehr bewusste Abstimmung ist nötig.`
      : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}. Dieser Unterschied wird im Alltag vor allem bei Abstimmungen, Entscheidungen und im Umgang mit Prioritäten spürbar sein. Je grösser die Abweichung, desto mehr bewusste Abstimmung ist nötig.`);
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

  if (passungZumTeam !== beitragZurAufgabe && passungZumTeam !== "nicht bewertbar" && beitragZurAufgabe !== "nicht bewertbar") {
    paras.push(`Genau daraus ergibt sich die Gesamteinschätzung. ${passungZumTeam === "hoch"
      ? "Die Person kann im Team gut funktionieren und dennoch nicht ideal zur eigentlichen Kernanforderung der Aufgabe passen. Das ist kein Widerspruch, sondern ein häufiger Fall in der Praxis. Sozial und strukturell im Team kann die Besetzung passend sein. Fachlich kann dennoch ein Schwerpunkt fehlen."
      : beitragZurAufgabe === "hoch"
        ? "Die Person bringt fachlich genau das mit, was die Aufgabe erfordert. Im Team braucht sie aber mehr Begleitung, weil die Arbeitsweisen deutlich voneinander abweichen."
        : "Die Abweichungen betreffen sowohl die Zusammenarbeit als auch die inhaltliche Ausrichtung. Das macht eine bewusste Begleitung umso wichtiger."}`);
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
      : `Auch in der Kommunikation sind zunächst keine grösseren Irritationen zu erwarten. Die Person dürfte vom Team eher als passend, verständlich und anschlussfähig wahrgenommen werden. Gerade in den ersten Wochen ist das ein klarer Vorteil, weil sich weniger Missverständnisse aus der Art der Zusammenarbeit ergeben als bei einer deutlich abweichenden Besetzung.`);
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
    ? `Für die Rolle als ${roleName} heisst das konkret: ${passungZumTeam === "hoch" ? "Im Teamgefüge ist die Besetzung wahrscheinlich unkompliziert." : "Im Teamgefüge braucht die Besetzung bewusste Begleitung."} ${beitragZurAufgabe === "gering" ? "Im fachlichen Alltag kann es jedoch Situationen geben, in denen die Anforderungen der Rolle mehr verlangen, als die Person von sich aus einbringt. Besonders bei höheren Anforderungen sollte Führung deshalb bewusst hinschauen." : beitragZurAufgabe === "hoch" ? "Fachlich bringt die Person genau das mit, was die Aufgabe erfordert." : "Fachlich bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang."}`
    : `Für die Rolle als ${roleName} heisst das konkret: ${passungZumTeam === "hoch" ? "Im Teamgefüge ist die Besetzung wahrscheinlich unkompliziert." : "Im Teamgefüge braucht die Besetzung bewusste Begleitung."} ${beitragZurAufgabe === "gering" ? "Im fachlichen Alltag kann es jedoch Situationen geben, in denen die Anforderungen der Rolle mehr verlangen, als die Person von sich aus einbringt. Besonders bei höheren Anforderungen sollte Führung deshalb bewusst hinschauen." : beitragZurAufgabe === "hoch" ? "Fachlich bringt die Person genau das mit, was die Aufgabe erfordert." : "Fachlich bringt die Person einen Teil der geforderten Stärke mit, aber nicht in vollem Umfang."}`);

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
    paras.push(`Unter Druck werden die Unterschiede zwischen Person und Team nicht kleiner, sondern grösser. ${personPrimary === "impulsiv" ? "Die Person wird voraussichtlich noch schneller und direkter handeln, was das Team als übergehend erleben kann." : personPrimary === "intuitiv" ? "Die Person wird voraussichtlich noch stärker auf Austausch und Abstimmung setzen, was das Team als verzögernd erleben kann." : "Die Person wird voraussichtlich noch genauer und kontrollierter arbeiten, was das Team als bremsend erleben kann."} Gerade in solchen Momenten entscheidet sich, ob die Zusammenarbeit tragfähig bleibt oder ob sich Spannungen aufbauen.`);
  }

  if (beitragZurAufgabe === "gering") {
    paras.push(`Die anspruchsvollere Seite liegt erneut im Aufgabenkern. Wenn unter Druck nicht nur Tempo, sondern zugleich ${hasGoal ? `${teamGoalLabel}` : "fachliche Sorgfalt und Qualität"} gefragt ${hasGoal ? "ist" : "sind"}, steigt die Anforderung an Führung deutlich. In solchen Situationen reicht gute Teamanschlussfähigkeit allein nicht aus. Dann braucht es klare Prioritäten, eindeutige Verantwortlichkeiten und eine bewusste Sicherung von Qualität und Struktur.`);
  }

  paras.push(`Für die Praxis bedeutet das: Unter Belastung sollte besonders klar definiert sein, was zuerst erledigt werden muss, wo keine Abkürzungen entstehen dürfen und welche Standards auch unter Zeitdruck gelten. ${beitragZurAufgabe === "gering"
    ? "Gerade im fachlichen Kern der Rolle ist es wichtig, dass Führung nicht nur auf Geschwindigkeit achtet, sondern bewusst auch auf Nachvollziehbarkeit, Vollständigkeit und Qualität."
    : "Klare Entscheidungswege und eindeutige Verantwortung sind dann besonders wichtig."}`);

  if (beitragZurAufgabe === "gering") {
    paras.push("Dort zeigt sich am deutlichsten, ob die Person die Rolle wirklich tragen kann oder ob sie im Aufgabenkern dauerhaft zu viel Führung und Nachsteuerung benötigt.");
  }

  return paras.join("\n\n");
}

function buildEmpfehlungen(c: Ctx): V4Block[] {
  const { isLeader, passungZumTeam, beitragZurAufgabe, hasGoal, teamGoalLabel, roleName } = c;
  const items: V4Block[] = [];

  items.push({ title: "Erwartungen an die Rolle früh klären", text: isLeader
    ? "Von Beginn an sollte klar besprochen werden, was in der Führungsrolle fachlich besonders wichtig ist. Nicht nur Zusammenarbeit und Teamanschluss, sondern vor allem auch die konkreten Anforderungen der Rolle müssen klar benannt werden."
    : "Von Beginn an sollte klar besprochen werden, was in der Rolle fachlich besonders wichtig ist. Nicht nur Zusammenarbeit und Teamanschluss, sondern vor allem auch die konkreten Anforderungen der Aufgabe müssen klar benannt werden." });

  if (beitragZurAufgabe === "gering" && hasGoal) {
    items.push({ title: `${teamGoalLabel} bewusst absichern`, text: `Dort, wo die Rolle eine hohe Qualität im Bereich ${teamGoalLabel} verlangt, sollten klare Standards gesetzt werden. Die Person sollte wissen, woran gute Arbeit in diesem Bereich konkret gemessen wird.` });
  } else if (beitragZurAufgabe === "gering") {
    items.push({ title: "Fachliche Anforderungen bewusst absichern", text: "Dort, wo die Rolle fachliche Tiefe oder besondere Sorgfalt verlangt, sollten klare Standards gesetzt werden. Die Person sollte wissen, woran gute Arbeit konkret gemessen wird." });
  } else {
    items.push({ title: "Zusammenarbeit nicht dem Zufall überlassen", text: isLeader
      ? "Gerade in den ersten Wochen muss bewusst besprochen werden, wie Führung, Kommunikation und Entscheidungswege im Alltag aussehen sollen."
      : "Gerade in den ersten Wochen muss bewusst besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen." });
  }

  if (passungZumTeam === "hoch" && beitragZurAufgabe !== "hoch") {
    items.push({ title: "Gute Integration nicht mit voller Eignung gleichsetzen", text: "Wenn der Einstieg im Team gut läuft, entsteht schnell der Eindruck, die Besetzung passe insgesamt vollständig. Genau hier sollte Führung bewusst unterscheiden: soziale Integration ist ein Vorteil, ersetzt aber nicht automatisch die Passung zum eigentlichen Aufgabenkern." });
  } else if (passungZumTeam !== "hoch") {
    items.push({ title: "Anschluss ans Team aktiv begleiten", text: "Gerade wenn die Arbeitsweisen sich unterscheiden, sollte darauf geachtet werden, dass die Person nicht nur Aufgaben bekommt, sondern auch Zugang zum Team findet. Teamregeln und Schnittstellen sollten offen benannt werden." });
  } else {
    items.push({ title: "Rückmeldungen einplanen", text: "Die Wirkung einer Person zeigt sich oft früher als ihre Ergebnisse. Frühe Rückmeldungen helfen, den guten Start abzusichern und stille Missverständnisse zu vermeiden." });
  }

  items.push({ title: "Früh Rückmeldung geben", text: "Nach etwa 30 bis 45 Tagen sollte nicht nur gefragt werden, ob die Zusammenarbeit gut läuft, sondern auch, wie sich die Person im fachlichen Kern der Rolle zeigt. Gerade dort ist eine frühe Standortbestimmung wichtig." });

  items.push({ title: isLeader ? "Qualität und Führung aktiv steuern" : "Qualität und Struktur aktiv führen", text: isLeader
    ? "Wenn die Rolle fachliche Sorgfalt verlangt, sollte Führung diesen Bereich aktiv begleiten. Das kann durch klare Vorgaben, definierte Entscheidungswege oder engere Rückkopplung geschehen."
    : "Wenn die Rolle fachliche Sorgfalt verlangt, sollte Führung diesen Bereich aktiv begleiten. Das kann durch klare Vorgaben, definierte Prüfschritte, verbindliche Standards oder engere Rückkopplung geschehen." });

  items.push({ title: "Entwicklung realistisch einschätzen", text: "Die Besetzung kann im Team gut funktionieren und trotzdem im Aufgabenkern länger brauchen oder bewusste Unterstützung benötigen. Diese Einschätzung sollte weder zu kritisch noch zu optimistisch sein, sondern nüchtern geführt werden." });

  return items;
}
