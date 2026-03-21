import type { Triad, ComponentKey } from "./jobcheck-engine";
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
  wirkungAufUmfeld: string;
  begleitungsbedarf: string;
  risikoImAlltag: string;
  kurzfazit: string;
  ersteEmpfehlung: string;

  teamProfile: Triad;
  personProfile: Triad;
  teamLabel: string;
  personLabel: string;
  teamPersonAbweichung: number;
  teamGoalAbweichung: number | null;
  personGoalAbweichung: number | null;

  warumText: string;

  wirkungTitle: string;
  wirkungText: string;

  chancenText: string;
  risikenText: string;
  chancenPunkte: string[];
  risikenPunkte: string[];

  ohneBesetzungText: string;

  alltagText: string;

  leistungText: string;

  druckText: string;

  empfehlungen: V4Block[];

  v3: TeamCheckV3Result;
}

const GOAL_LABELS: Record<string, string> = {
  umsetzung: "Umsetzung und Ergebnisse",
  analyse: "Analyse und Struktur",
  zusammenarbeit: "Zusammenarbeit und Kommunikation",
};

const COMP_PLAIN: Record<ComponentKey, string> = {
  impulsiv: "schnelle Umsetzung und direktes Handeln",
  intuitiv: "Austausch, Zusammenarbeit und gute Kommunikation",
  analytisch: "sorgfältige Analyse, Struktur und klare Abläufe",
};

const COMP_SHORT: Record<ComponentKey, string> = {
  impulsiv: "Tempo und direkte Umsetzung",
  intuitiv: "Austausch und Miteinander",
  analytisch: "Struktur und Genauigkeit",
};

export function computeTeamCheckV4(input: TeamCheckV3Input & { roleType?: string }): TeamCheckV4Result {
  const v3 = computeTeamCheckV3(input);

  const inputRoleType = (input as any).roleType;
  const isLeader = inputRoleType === "fuehrung" ? true : inputRoleType === "teammitglied" ? false : v3.roleType === "leadership";
  const roleLabel = isLeader ? "Führungskraft" : "Teammitglied";

  const teamPrimary = getPrimaryKey(input.teamProfile);
  const personPrimary = getPrimaryKey(input.personProfile);
  const sameDominance = teamPrimary === personPrimary;
  const gap = v3.teamPersonAbweichung;

  const gesamteinschaetzung = v3.passung === "Passend" ? "Gut passend"
    : v3.passung === "Bedingt passend" ? "Teilweise passend" : "Kritisch";

  let wirkungAufUmfeld: string;
  if (gesamteinschaetzung === "Gut passend") {
    wirkungAufUmfeld = sameDominance ? "eher stabilisierend" : "eher ergänzend";
  } else if (gesamteinschaetzung === "Teilweise passend") {
    wirkungAufUmfeld = sameDominance ? "eher ergänzend" : "eher verändernd";
  } else {
    wirkungAufUmfeld = "eher spannungsanfällig";
  }

  let begleitungsbedarf: string;
  if (v3.steuerungsaufwand === "gering") begleitungsbedarf = "gering";
  else if (v3.steuerungsaufwand === "mittel") begleitungsbedarf = "mittel";
  else begleitungsbedarf = "hoch";

  let risikoImAlltag: string;
  if (v3.integrationsrisiko === "gering") risikoImAlltag = "niedrig";
  else if (v3.integrationsrisiko === "mittel") risikoImAlltag = "erhöht";
  else risikoImAlltag = "hoch";

  const teamGoalLabel = v3.teamGoal ? (GOAL_LABELS[v3.teamGoal] || "") : "Kein festgelegtes Funktionsziel";

  const kurzfazit = buildKurzfazit(gesamteinschaetzung, isLeader, sameDominance, teamPrimary, personPrimary);
  const ersteEmpfehlung = buildErsteEmpfehlung(gesamteinschaetzung, isLeader);
  const warumText = buildWarumText(v3, isLeader, gesamteinschaetzung, sameDominance, teamPrimary, personPrimary);
  const { wirkungTitle, wirkungText } = buildWirkungText(v3, isLeader, sameDominance, gesamteinschaetzung, teamPrimary, personPrimary);
  const { chancenText, risikenText, chancenPunkte, risikenPunkte } = buildChancenRisiken(v3, isLeader, gesamteinschaetzung, sameDominance, teamPrimary, personPrimary);
  const ohneBesetzungText = buildOhneBesetzung(v3, isLeader, sameDominance, personPrimary);
  const alltagText = buildAlltag(v3, isLeader, gesamteinschaetzung, sameDominance);
  const leistungText = buildLeistung(gesamteinschaetzung, isLeader);
  const druckText = buildDruck(isLeader, gesamteinschaetzung);
  const empfehlungen = buildEmpfehlungen(isLeader, gesamteinschaetzung);

  return {
    roleTitle: v3.roleTitle,
    roleType: isLeader ? "leadership" : "member",
    roleLabel,
    teamGoal: v3.teamGoal,
    teamGoalLabel,
    gesamteinschaetzung,
    wirkungAufUmfeld,
    begleitungsbedarf,
    risikoImAlltag,
    kurzfazit,
    ersteEmpfehlung,
    teamProfile: v3.teamProfile,
    personProfile: v3.personProfile,
    teamLabel: v3.teamLabel,
    personLabel: v3.personLabel,
    teamPersonAbweichung: v3.teamPersonAbweichung,
    teamGoalAbweichung: v3.teamGoalAbweichung,
    personGoalAbweichung: v3.personGoalAbweichung,
    warumText,
    wirkungTitle,
    wirkungText,
    chancenText,
    risikenText,
    chancenPunkte,
    risikenPunkte,
    ohneBesetzungText,
    alltagText,
    leistungText,
    druckText,
    empfehlungen,
    v3,
  };
}

function buildKurzfazit(bewertung: string, isLeader: boolean, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey): string {
  if (bewertung === "Gut passend") {
    return isLeader
      ? "Die Person bringt eine Arbeitsweise mit, die gut zum bestehenden Team passt. Der Einstieg in die Führungsrolle dürfte vergleichsweise reibungsarm verlaufen. Die Voraussetzungen für eine gute Zusammenarbeit sind gegeben."
      : "Die Person bringt eine Arbeitsweise mit, die gut zum bestehenden Team passt. Der Einstieg dürfte reibungsarm verlaufen und die Zusammenarbeit kann sich schnell einspielen.";
  }
  if (bewertung === "Teilweise passend") {
    return isLeader
      ? "Die Person bringt Stärken mit, die zum Team passen, arbeitet aber in einigen Punkten deutlich anders. Ob die Führung gut ankommt, hängt davon ab, wie bewusst die ersten Wochen gestaltet werden."
      : "Die Person bringt eine Arbeitsweise mit, die in Teilen gut zum Team passt, in anderen Punkten aber spürbar abweicht. Das kann neue Impulse bringen, braucht aber von Anfang an klare Absprachen und Begleitung.";
  }
  return isLeader
    ? "Die Person würde deutlich anders führen, als das Team es bisher kennt und braucht. Ohne aktive Begleitung ist mit Spannungen, Unsicherheit und schwächeren Ergebnissen zu rechnen."
    : "Die Person arbeitet deutlich anders als das bestehende Team. Ohne aktive Begleitung ist mit Reibung, Missverständnissen und unnötigem Abstimmungsaufwand zu rechnen.";
}

function buildErsteEmpfehlung(bewertung: string, isLeader: boolean): string {
  if (bewertung === "Gut passend") {
    return isLeader
      ? "Die ersten Wochen sollten genutzt werden, um Rolle, Erwartungen und Zusammenarbeit sauber zu klären. Das schafft eine stabile Grundlage."
      : "Auch bei guter Passung lohnt es sich, Erwartungen und Zuständigkeiten in den ersten Wochen offen zu besprechen.";
  }
  if (bewertung === "Teilweise passend") {
    return "Die ersten Wochen sollten bewusst begleitet werden. Wichtig ist, dass Rolle, Erwartungen, Zusammenarbeit und Entscheidungswege von Anfang an klar benannt werden.";
  }
  return "Die ersten Wochen brauchen enge Begleitung. Rolle, Erwartungen, Zuständigkeiten und Kommunikation müssen von Anfang an offen und klar geregelt werden.";
}

function buildWarumText(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey): string {
  let text = "Dieses Ergebnis entsteht nicht nur aus der Person allein. Entscheidend ist immer das Zusammenspiel aus drei Punkten: wie die Person arbeitet, wie das bestehende Team arbeitet und was die Abteilung im Alltag besonders braucht.";

  text += "\n\nJe besser diese drei Ebenen zueinander passen, desto leichter entsteht gute Zusammenarbeit. Dann gibt es weniger Reibung, weniger Missverständnisse und weniger zusätzlichen Klärungsbedarf. Je deutlicher die Unterschiede sind, desto stärker hängt der Erfolg davon ab, wie gut geführt, begleitet und abgestimmt wird.";

  if (bewertung === "Gut passend") {
    text += "\n\nIm vorliegenden Fall passen Person und Team in ihrer Arbeitsweise gut zusammen. Beide setzen ähnliche Schwerpunkte, was den Einstieg erleichtert und die Zusammenarbeit von Beginn an tragfähig macht.";
  } else if (bewertung === "Teilweise passend") {
    text += `\n\nIm vorliegenden Fall zeigt sich, dass die Person in mehreren Punkten anders arbeitet als das bestehende Umfeld. Das muss nicht gegen die Besetzung sprechen. Es bedeutet aber, dass die Person das ${isLeader ? "Team spürbar prägen" : "Umfeld spürbar beeinflussen"} wird. Genau daraus entstehen sowohl Chancen als auch Risiken.`;
  } else {
    text += `\n\nIm vorliegenden Fall arbeitet die Person deutlich anders als das bestehende Team. Der grösste Unterschied liegt im Arbeitsstil: Das Team legt mehr Wert auf ${COMP_SHORT[teamPrim]}, die Person mehr auf ${COMP_SHORT[personPrim]}. Das wird im Alltag spürbar sein und braucht von Anfang an klare Führung.`;
  }

  if (v3.teamGoal) {
    text += "\n\nWichtig ist ausserdem das Ziel der Abteilung. Eine Person kann in einem Umfeld schwierig wirken und in einem anderen genau richtig sein. Entscheidend ist deshalb nicht nur, ob Unterschiede vorhanden sind, sondern ob diese Unterschiede zu den Aufgaben und Anforderungen des Bereichs passen.";
    if (v3.strategicFit === "passend") {
      text += " In diesem Fall bringt die Person genau die Stärken mit, die die Abteilung besonders braucht. Das ist ein wichtiger Pluspunkt.";
    } else if (v3.strategicFit === "teilweise") {
      text += " Die Person bringt einen Teil dessen mit, was die Abteilung braucht. Dieser Bereich gehört aber nicht zu ihren stärksten Seiten.";
    } else if (v3.strategicFit === "abweichend") {
      text += " In diesem Fall liegt die stärkste Seite der Person nicht in dem Bereich, den die Abteilung am meisten braucht. Das verstärkt die Abweichung zusätzlich.";
    }
  }

  return text;
}

function buildWirkungText(v3: TeamCheckV3Result, isLeader: boolean, sameDom: boolean, bewertung: string, teamPrim: ComponentKey, personPrim: ComponentKey): { wirkungTitle: string; wirkungText: string } {
  if (isLeader) {
    let text = "Die Person würde voraussichtlich anders führen, als das Team es bisher kennt oder erwartet. Genau darin liegt die eigentliche Wirkung dieser Besetzung. Es geht nicht nur darum, ob die Person fachlich in die Rolle passt, sondern vor allem darum, wie ihre Art zu führen auf das bestehende Team trifft.";

    if (bewertung === "Gut passend") {
      text += "\n\nDas kann hier gut gelingen. Die Führungskraft arbeitet ähnlich wie das Team und bringt eine Art mit, die im bestehenden Umfeld schnell akzeptiert werden dürfte. Das schafft Vertrauen und erleichtert den Einstieg.";
    } else {
      text += "\n\nDas kann eine Chance sein. Eine neue Führungskraft kann Klarheit schaffen, Entscheidungen beschleunigen, Verantwortung ordnen und dem Team neue Richtung geben. Gerade dann, wenn bisher etwas gefehlt hat, kann eine andere Führungsart sehr wertvoll sein.";
      text += "\n\nGleichzeitig liegt genau hier auch das grösste Risiko. Wenn das Team eine andere Art der Führung gewohnt ist, wird der Unterschied schnell spürbar. Manche Mitarbeitende erleben das als hilfreich und klärend, andere als zu direkt, zu schnell oder zu wenig einbindend. Dann geht es nicht mehr nur um Aufgaben, sondern auch um Vertrauen, Akzeptanz und Sicherheit im Miteinander.";
    }

    text += "\n\nEntscheidend wird deshalb sein, wie die ersten Wochen gestaltet werden. Eine neue Führungskraft braucht nicht nur Aufgaben und Ziele, sondern auch einen sauberen Einstieg in das Team. Erwartungen, Zuständigkeiten, Entscheidungswege und Kommunikation müssen früh geklärt werden. Je klarer das geschieht, desto grösser ist die Chance, dass aus anfänglicher Unsicherheit mit der Zeit Stabilität wird.";

    return { wirkungTitle: "So würde die Person als Führungskraft wirken", wirkungText: text };
  }

  let text = "Die Person wird im Team voraussichtlich nicht unbemerkt bleiben. Ihre Art zu arbeiten setzt andere Schwerpunkte als die bestehende Gruppe. Dadurch kann sie das Team sinnvoll ergänzen, gleichzeitig aber auch Abläufe, Erwartungen und das Miteinander verändern.";

  if (bewertung === "Gut passend") {
    text += "\n\nPositiv ist, dass Person und Team in ihrer Arbeitsweise gut zusammenpassen. Der Einstieg dürfte reibungsarm verlaufen und die Zusammenarbeit kann sich schnell einspielen. Die Person versteht die Erwartungen des Teams intuitiv und kann sich rasch einbringen.";
  } else {
    text += "\n\nPositiv ist, dass neue Impulse entstehen können. Die Person kann Bewegung in bestehende Abläufe bringen, andere Blickwinkel einbringen oder Lücken schliessen, die bisher nicht bewusst wahrgenommen wurden.";
    text += `\n\nSchwieriger wird es dort, wo das Team einen anderen Stil gewohnt ist. Wenn die Person ${personPrimary(personPrim)} als das übrige Team, entstehen im Alltag leicht Missverständnisse. Oft zeigt sich das zuerst nicht in offenen Konflikten, sondern in kleinen Irritationen: unausgesprochene Unzufriedenheit, unterschiedliche Erwartungen oder das Gefühl, nicht richtig zueinander zu finden.`;
  }

  text += "\n\nOb die Integration gut gelingt, hängt deshalb stark davon ab, wie bewusst der Einstieg begleitet wird. Wenn früh geklärt wird, wie Zusammenarbeit, Verantwortung und Kommunikation im Alltag aussehen sollen, kann aus dem Unterschied eine echte Ergänzung werden. Bleibt das offen, entsteht unnötige Reibung.";

  return { wirkungTitle: "So würde die Person im Team wirken", wirkungText: text };
}

function personPrimary(key: ComponentKey): string {
  if (key === "impulsiv") return "schneller entscheidet und direkter handelt";
  if (key === "intuitiv") return "stärker auf Austausch und Abstimmung setzt";
  return "genauer analysiert und strukturierter vorgeht";
}

function buildChancenRisiken(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  let chancenText = "Diese Besetzung kann eine sinnvolle Ergänzung sein, wenn das Team oder die Abteilung genau die Stärken braucht, die die Person mitbringt. Unterschiede können helfen, blinde Flecken sichtbar zu machen, festgefahrene Muster zu verändern oder mehr Klarheit in Aufgaben und Verantwortung zu bringen.";

  if (sameDom) {
    chancenText += `\n\nDie Person verstärkt, was das Team bereits gut kann. Das bringt mehr Verlässlichkeit und Stabilität in den Alltag.`;
  } else {
    chancenText += `\n\nDie Person kann etwas einbringen, das dem Team bisher gefehlt hat: mehr ${COMP_SHORT[personPrim]}. Das ist besonders dann wertvoll, wenn genau diese Qualität bisher zu kurz kam.`;
  }

  chancenText += "\n\nAuch für die Weiterentwicklung des Teams kann eine andere Arbeitsweise hilfreich sein. Teams profitieren nicht nur von Ähnlichkeit, sondern oft auch von guter Ergänzung.";

  const chancenPunkte: string[] = [];
  if (sameDom) {
    chancenPunkte.push("Schneller Anschluss durch ähnliche Arbeitsweise");
    chancenPunkte.push("Stärkung der bestehenden Teamstärken");
    chancenPunkte.push("Weniger Einarbeitungsaufwand");
  } else {
    chancenPunkte.push("Neue Impulse und andere Blickwinkel");
    chancenPunkte.push(`Ergänzung durch ${COMP_SHORT[personPrim]}`);
    chancenPunkte.push("Möglichkeit, blinde Flecken sichtbar zu machen");
  }
  if (v3.strategicFit === "passend") {
    chancenPunkte.push("Stärken passen zum Ziel der Abteilung");
  }

  let risikenText = "Das grösste Risiko liegt nicht im Unterschied selbst, sondern darin, dass dieser Unterschied im Alltag nicht gut aufgefangen wird. Dann entstehen schnell Missverständnisse, Frust und unnötige Reibung. Erwartungen bleiben unausgesprochen, Zusammenarbeit wird anstrengender und kleine Spannungen ziehen sich zu lange.";

  if (isLeader) {
    risikenText += "\n\nBei einer Führungsrolle kann zusätzlich das Risiko entstehen, dass die Person zwar formell führt, im Team aber nicht wirklich ankommt. Wenn Vertrauen und Akzeptanz fehlen, leidet die gesamte Zusammenarbeit.";
  } else {
    risikenText += "\n\nBei einem neuen Teammitglied kann die Leistung der Person durchaus vorhanden sein, ohne dass die Zusammenarbeit stabil wird. Dann leidet weniger die einzelne Leistung als vielmehr das Miteinander im Gesamtbild.";
  }

  risikenText += "\n\nDeshalb gilt: Unterschiede können eine Stärke sein. Sie werden aber nur dann produktiv, wenn sie bewusst begleitet werden.";

  const risikenPunkte: string[] = [];
  if (bewertung === "Kritisch") {
    risikenPunkte.push("Wiederkehrende Missverständnisse wahrscheinlich");
    risikenPunkte.push("Risiko für Frust und sinkendes Vertrauen");
    risikenPunkte.push("Spannungen können sich schnell verfestigen");
  } else if (bewertung === "Teilweise passend") {
    risikenPunkte.push("Mehr Abstimmung in den ersten Monaten nötig");
    risikenPunkte.push("Unterschiedliche Erwartungen können frustrieren");
  } else {
    risikenPunkte.push("Zu viel Gleichförmigkeit kann Innovation bremsen");
  }
  if (isLeader) {
    risikenPunkte.push("Führung kommt im Team möglicherweise nicht an");
  } else {
    risikenPunkte.push("Person findet möglicherweise schwer Anschluss");
  }

  return { chancenText, risikenText, chancenPunkte, risikenPunkte };
}

function buildOhneBesetzung(v3: TeamCheckV3Result, isLeader: boolean, sameDom: boolean, personPrim: ComponentKey): string {
  let text = "Nicht zu besetzen ist keine neutrale Entscheidung.";

  if (isLeader) {
    text += " Wenn die Person die Führungsrolle nicht übernimmt, bleibt die bestehende Struktur zunächst oft ruhiger. Gleichzeitig bleibt aber meist auch das bestehen, was bisher gefehlt hat.";
    text += "\n\nOhne neue Besetzung verschwinden unklare Zuständigkeiten, fehlende Richtung oder langsame Entscheidungen nicht von selbst. Die Situation bleibt vielleicht zunächst vertraut, wird dadurch aber nicht automatisch besser.";
  } else {
    text += " Wenn die Person nicht in das Team kommt, bleibt die bestehende Struktur zunächst stabiler. Das kann kurzfristig für Ruhe sorgen. Gleichzeitig bleibt aber auch das bestehen, was bisher gefehlt hat.";
    if (!sameDom) {
      text += ` Eine Lücke im Bereich ${COMP_SHORT[personPrim]} wird nicht geschlossen, bestimmte Impulse fehlen weiterhin und bekannte Schwächen im Alltag bleiben wahrscheinlich bestehen.`;
    } else {
      text += " Das Team bleibt zwar ruhiger, aber auch unvollständiger. Einseitigkeiten im Arbeitsstil werden nicht korrigiert.";
    }
  }

  text += "\n\nDeshalb sollte die Frage nicht nur lauten, ob diese Person ideal passt. Genauso wichtig ist die Frage, was es für Team und Abteilung bedeutet, wenn nichts verändert wird.";

  return text;
}

function buildAlltag(v3: TeamCheckV3Result, isLeader: boolean, bewertung: string, sameDom: boolean): string {
  let text = "Im Alltag zeigt sich Passung selten in grossen Worten, sondern in kleinen, wiederkehrenden Situationen. Genau dort wird schnell sichtbar, ob Zusammenarbeit leicht entsteht oder ob sie unnötig Kraft kostet.";

  if (bewertung === "Gut passend") {
    text += "\n\nBei dieser Besetzung ist damit zu rechnen, dass die Zusammenarbeit von Beginn an gut laufen kann. Person und Team setzen ähnliche Schwerpunkte, was den Alltag erleichtert. Kleinere Unterschiede in Tempo oder Kommunikation sind normal und dürften sich schnell einspielen.";
  } else {
    text += "\n\nBei dieser Besetzung ist damit zu rechnen, dass Kommunikation und Abstimmung eine wichtige Rolle spielen werden. Person und Umfeld setzen nicht automatisch dieselben Schwerpunkte. Dadurch kann es vorkommen, dass Entscheidungen unterschiedlich vorbereitet werden, Prioritäten verschieden eingeschätzt werden oder die Erwartungen an Tempo und Zusammenarbeit auseinanderlaufen.";
    text += "\n\nAuch bei Verantwortung und Zuständigkeiten braucht es wahrscheinlich frühe Klarheit. Wenn nicht eindeutig ist, wer entscheidet, wer abstimmt und wie viel Eigenständigkeit gewünscht ist, entstehen schnell Unsicherheit und vermeidbare Reibung.";
  }

  if (bewertung === "Kritisch") {
    text += "\n\nTypische Warnzeichen wären wiederkehrende Missverständnisse, stockende Zusammenarbeit, unausgesprochene Spannungen oder das Gefühl, dass zwar viel gesprochen wird, aber zu wenig wirklich zusammenläuft. Werden solche Signale früh erkannt, lässt sich gut gegensteuern. Werden sie übersehen, verfestigen sie sich meist.";
  } else if (bewertung === "Teilweise passend") {
    text += "\n\nWichtig ist, im Alltag nicht nur auf Ergebnisse zu schauen, sondern auch darauf, wie diese Ergebnisse zustande kommen. Wenn Absprachen häufiger nötig werden oder das Gefühl entsteht, dass man aneinander vorbeiredet, ist das ein Zeichen, dass Rollen und Erwartungen nachgeschärft werden sollten.";
  }

  return text;
}

function buildLeistung(bewertung: string, isLeader: boolean): string {
  let text = "";

  if (bewertung === "Gut passend") {
    text = "Bei dieser Besetzung ist eine schnelle Wirksamkeit zu erwarten. Die Person kann sich rasch einarbeiten und produktiv beitragen. Da Person und Team ähnlich arbeiten, entsteht wenig unnötiger Klärungsbedarf.";
    text += "\n\nMittelfristig stabilisiert die Person das bestehende Umfeld und trägt verlässlich zu guten Ergebnissen bei. Qualität und Tempo bleiben auf einem hohen Niveau.";
  } else {
    text = "Kurzfristig ist bei einer spürbaren Abweichung fast immer mit mehr Klärungsbedarf zu rechnen. Die ersten Wochen sind dann weniger von reibungsloser Leistung geprägt, sondern stärker von Abstimmung, Beobachtung und gegenseitigem Einordnen. Das ist nicht ungewöhnlich, sollte aber eingeplant werden.";
    text += "\n\nOb daraus später eine Stärke oder ein Problem wird, hängt vor allem davon ab, wie gut die Zusammenarbeit geführt wird. Wenn Erwartungen klar sind, Rollen sauber benannt werden und Rückmeldungen früh stattfinden, kann aus einer zunächst anspruchsvollen Situation eine produktive Ergänzung werden.";
    text += "\n\nBleiben Rolle, Zusammenarbeit und Verantwortung dagegen unklar, wirkt sich das meist direkt auf die Leistung aus. Energie fliesst dann nicht in gute Ergebnisse, sondern in Missverständnisse, Absicherung und unnötige Abstimmung. Qualität leidet, Tempo wird uneinheitlich und die Verlässlichkeit im Alltag sinkt.";
  }

  text += "\n\nEntscheidend ist deshalb nicht nur, ob Unterschiede vorhanden sind, sondern ob das Umfeld gut mit ihnen arbeiten kann.";

  return text;
}

function buildDruck(isLeader: boolean, bewertung: string): string {
  let text = "Unter Druck zeigt sich die natürliche Arbeitsweise eines Menschen meist deutlicher als im Normalbetrieb. Was sonst noch ausgeglichen oder angepasst wird, tritt dann klarer hervor. Genau deshalb ist dieser Punkt besonders wichtig.";

  text += "\n\nIn dieser Besetzung ist davon auszugehen, dass die Person unter Belastung noch stärker auf ihre gewohnte Art zurückgreift. Das kann positiv sein, wenn genau diese Stärke in schwierigen Situationen gebraucht wird. Es kann aber auch dazu führen, dass der Unterschied zum Team noch deutlicher spürbar wird.";

  text += "\n\nFür das Umfeld bedeutet das: Unter Druck werden Unterschiede meist nicht kleiner, sondern grösser. Was im Alltag noch tragbar erscheint, kann in intensiven Phasen schneller zu Reibung, Unsicherheit oder Missverständnissen führen. Deshalb braucht es gerade in belasteten Phasen klare Absprachen, kurze Wege und eindeutige Verantwortung.";

  if (bewertung === "Gut passend") {
    text += "\n\nBei dieser Besetzung ist das Risiko gering, da Person und Team ähnlich arbeiten. Auch unter Druck dürfte die Zusammenarbeit stabil bleiben.";
  } else {
    text += "\n\nWenn das gelingt, kann die Besetzung auch unter Druck stabil bleiben. Wenn nicht, entstehen schnell unnötige Spannungen, die dann nicht mehr nur die Zusammenarbeit, sondern auch Leistung und Vertrauen belasten.";
  }

  return text;
}

function buildEmpfehlungen(isLeader: boolean, bewertung: string): V4Block[] {
  const items: V4Block[] = [];

  items.push({
    title: "Rolle und Erwartungen früh klären",
    text: "Von Anfang an sollte klar sein, was genau von der Person erwartet wird, woran Erfolg gemessen wird und welche Verantwortung tatsächlich bei ihr liegt. Unklare Rollen sind einer der häufigsten Gründe für spätere Spannungen.",
  });

  items.push({
    title: "Zusammenarbeit nicht dem Zufall überlassen",
    text: "Gerade in den ersten Wochen sollte bewusst besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen. Was nicht offen besprochen wird, wird meist still interpretiert.",
  });

  items.push({
    title: "Früh Rückmeldung geben",
    text: "Die Wirkung einer Person zeigt sich oft früher als ihre Ergebnisse. Deshalb sind frühe, offene Rückmeldungen besonders wichtig. Nicht erst warten, bis Spannungen fest sitzen, sondern Beobachtungen früh und klar ansprechen.",
  });

  items.push({
    title: "Nach den ersten Wochen bewusst prüfen",
    text: "Nach 30 bis 60 Tagen sollte gezielt geschaut werden, wie die Besetzung im Alltag wirklich wirkt. Was läuft gut? Wo gibt es Reibung? Was muss angepasst werden? Diese Reflexion ist wichtig, damit aus einem schwierigen Start kein dauerhaftes Problem wird.",
  });

  if (isLeader) {
    items.push({
      title: "Auf Vertrauen und Akzeptanz achten",
      text: "Bei einer Führungsrolle reicht es nicht, nur auf Ziele und Aufgaben zu schauen. Ebenso wichtig ist die Frage, ob die Führung im Team wirklich ankommt, ob Vertrauen entsteht und ob die Person in der Rolle ankommen kann.",
    });
  } else {
    items.push({
      title: "Anschluss an das Team aktiv begleiten",
      text: "Gerade bei einem neuen Teammitglied sollte darauf geachtet werden, dass die Person nicht nur Aufgaben bekommt, sondern auch Zugang zum Team findet. Teamregeln und Schnittstellen sollten offen benannt werden.",
    });
  }

  return items;
}
