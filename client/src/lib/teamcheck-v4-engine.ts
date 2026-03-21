import type { Triad, ComponentKey } from "./jobcheck-engine";
import { computeTeamCheckV3, type TeamCheckV3Input, type TeamCheckV3Result, type TeamGoal } from "./teamcheck-v3-engine";
import { getPrimaryKey, getSecondaryKey } from "./teamcheck-v2-engine";

export interface V4Block {
  title: string;
  text: string;
}

export interface V4Bullet {
  point: string;
  detail: string;
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
  managementEinschaetzung: string;
  hauptrisiko: string;
  hauptchance: string;
  integrationsprognose: string;

  teamProfile: Triad;
  personProfile: Triad;
  teamLabel: string;
  personLabel: string;
  teamPersonAbweichung: number;
  teamGoalAbweichung: number | null;
  personGoalAbweichung: number | null;

  warumEinleitung: string;
  warumBlocks: V4Block[];
  warumKernaussage: string;

  wirkungTitle: string;
  wirkungEinleitung: string;
  wirkungBlocks: V4Block[];
  wirkungKernaussage: string;

  chancenEinleitung: string;
  chancenPunkte: V4Bullet[];
  risikenEinleitung: string;
  risikenPunkte: V4Bullet[];

  ohneErhalten: string[];
  ohneUngeloest: string[];
  ohneKernaussage: string;

  alltagEinleitung: string;
  alltagBlocks: V4Block[];
  alltagWarnzeichen: string[];
  alltagPositivzeichen: string[];
  alltagKernaussage: string;

  leistungEinleitung: string;
  leistungBlocks: V4Block[];
  leistungKernaussage: string;

  druckBlocks: V4Block[];
  druckKernaussage: string;

  empfehlungen: V4Block[];

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

export function computeTeamCheckV4(input: TeamCheckV3Input & { roleType?: string }): TeamCheckV4Result {
  const v3 = computeTeamCheckV3(input);

  const inputRoleType = (input as any).roleType;
  const isLeader = inputRoleType === "fuehrung" ? true : inputRoleType === "teammitglied" ? false : v3.roleType === "leadership";
  const roleLabel = isLeader ? "Führungskraft" : "Teammitglied";

  const teamPrimary = getPrimaryKey(input.teamProfile);
  const personPrimary = getPrimaryKey(input.personProfile);
  const sameDominance = teamPrimary === personPrimary;

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

  const hasGoal = !!v3.teamGoal;

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
    kurzfazit: buildKurzfazit(gesamteinschaetzung, isLeader),
    ersteEmpfehlung: buildErsteEmpfehlung(gesamteinschaetzung, isLeader),
    managementEinschaetzung: buildManagementEinschaetzung(gesamteinschaetzung, isLeader, hasGoal),
    hauptrisiko: buildHauptrisiko(gesamteinschaetzung, isLeader),
    hauptchance: buildHauptchance(gesamteinschaetzung, isLeader, personPrimary),
    integrationsprognose: buildIntegrationsprognose(gesamteinschaetzung, isLeader),
    teamProfile: v3.teamProfile,
    personProfile: v3.personProfile,
    teamLabel: v3.teamLabel,
    personLabel: v3.personLabel,
    teamPersonAbweichung: v3.teamPersonAbweichung,
    teamGoalAbweichung: v3.teamGoalAbweichung,
    personGoalAbweichung: v3.personGoalAbweichung,
    ...buildWarum(v3, isLeader, gesamteinschaetzung, sameDominance, teamPrimary, personPrimary),
    ...buildWirkung(isLeader, gesamteinschaetzung, sameDominance, teamPrimary, personPrimary),
    ...buildChancenRisiken(v3, isLeader, gesamteinschaetzung, sameDominance, personPrimary),
    ...buildOhne(isLeader, sameDominance, personPrimary),
    ...buildAlltag(isLeader, gesamteinschaetzung, sameDominance, teamPrimary, personPrimary),
    ...buildLeistung(gesamteinschaetzung, isLeader, hasGoal),
    ...buildDruck(gesamteinschaetzung),
    empfehlungen: buildEmpfehlungen(isLeader),
    v3,
  };
}

function buildKurzfazit(bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Die Person bringt eine Arbeitsweise mit, die gut zum bestehenden Team passt. Der Einstieg in die Führungsrolle dürfte vergleichsweise reibungsarm verlaufen."
      : "Die Person passt gut zum bestehenden Team. Der Einstieg dürfte reibungsarm verlaufen und die Zusammenarbeit kann sich schnell einspielen.";
  }
  if (bew === "Teilweise passend") {
    return isLeader
      ? "Die Person bringt Stärken mit, arbeitet aber in einigen Punkten anders als das Team es kennt. Ob die Führung gut ankommt, hängt davon ab, wie bewusst die ersten Wochen gestaltet werden."
      : "Die Person passt in Teilen gut zum Team, weicht in anderen Punkten aber spürbar ab. Das kann neue Impulse bringen, braucht aber klare Absprachen.";
  }
  return isLeader
    ? "Die Person würde deutlich anders führen, als das Team es braucht. Ohne aktive Begleitung ist mit Spannungen und schwächeren Ergebnissen zu rechnen."
    : "Die Person arbeitet deutlich anders als das Team. Ohne Begleitung ist mit Reibung und Missverständnissen zu rechnen.";
}

function buildErsteEmpfehlung(bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Die ersten Wochen sollten genutzt werden, um Rolle, Erwartungen und Zusammenarbeit sauber zu klären. Das schafft eine stabile Grundlage."
      : "Auch bei guter Passung lohnt es sich, Erwartungen und Zuständigkeiten in den ersten Wochen offen zu besprechen.";
  }
  if (bew === "Teilweise passend") {
    return "Die ersten Wochen sollten bewusst begleitet werden. Rolle, Erwartungen und Entscheidungswege müssen von Anfang an klar benannt werden.";
  }
  return "Die ersten Wochen brauchen enge Begleitung. Rolle, Erwartungen und Kommunikation müssen sofort offen geregelt werden.";
}

function buildManagementEinschaetzung(bew: string, isLeader: boolean, hasGoal: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Diese Besetzung ist aus unserer Sicht empfehlenswert. Die Arbeitsweisen von Person und Team passen gut zusammen. Der Einstieg in die Rolle sollte vergleichsweise reibungsarm gelingen."
      : "Diese Besetzung ist aus unserer Sicht empfehlenswert. Person und Team arbeiten auf eine vergleichbare Art, was den Einstieg erleichtert und die Zusammenarbeit schnell tragfähig macht.";
  }
  if (bew === "Teilweise passend") {
    const goalHint = !hasGoal ? " Da kein klares Funktionsziel hinterlegt ist, kommt der bewussten Rollenklärung hier noch mehr Bedeutung zu." : "";
    return isLeader
      ? `Diese Besetzung ist möglich, aber anspruchsvoll. Sie sollte nur dann erfolgen, wenn der Einstieg bewusst geführt und die Zusammenarbeit aktiv begleitet wird.${goalHint}`
      : `Diese Besetzung kann gelingen, ist aber kein Selbstläufer. Sie braucht von Anfang an klare Erwartungen und gute Begleitung.${goalHint}`;
  }
  const goalHint = !hasGoal ? " Da zudem kein klares Funktionsziel vorliegt, fehlt eine zusätzliche Orientierung, die den Einstieg erleichtern könnte." : "";
  return isLeader
    ? `Diese Besetzung ist im aktuellen Umfeld kritisch. Sie ist nur dann vertretbar, wenn der Einstieg eng begleitet wird und das Team klare Führung von oben erhält.${goalHint} Ohne diese Voraussetzungen ist das Risiko hoch, dass die Zusammenarbeit dauerhaft schwierig bleibt.`
    : `Diese Besetzung ist im aktuellen Umfeld kritisch und nur mit enger Begleitung tragfähig.${goalHint} Ohne aktive Führung und klare Absprachen ist das Risiko hoch, dass die Person im Team nicht wirklich ankommt.`;
}

function buildHauptrisiko(bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Das grösste Risiko liegt darin, dass bei guter Passung zu wenig aktiv in den Einstieg investiert wird und stille Annahmen über Erwartungen entstehen."
      : "Das grösste Risiko ist, dass bei guter Passung die Klärung von Rollen und Erwartungen versäumt wird, weil alles ohnehin gut zu laufen scheint.";
  }
  if (bew === "Teilweise passend") {
    return isLeader
      ? "Das grösste Risiko liegt darin, dass die Führung im Team nicht richtig ankommt und Unterschiede im Stil als dauerhafter Störfaktor erlebt werden."
      : "Das grösste Risiko liegt nicht in der fachlichen Arbeit der Person, sondern darin, ob sie im Team wirklich gut ankommt.";
  }
  return isLeader
    ? "Das grösste Risiko liegt darin, dass die Person im Team zu wenig Vertrauen aufbauen kann und Führung deshalb nicht wirksam wird. Dann entsteht dauerhaft Reibung statt Stabilität."
    : "Das grösste Risiko liegt nicht in der Leistung der Person, sondern darin, dass sie im Team zu wenig Anschluss findet und dadurch dauerhaft Reibung entsteht.";
}

function buildHauptchance(bew: string, isLeader: boolean, personPrim: ComponentKey): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Die grösste Chance liegt in einem schnellen, stabilen Führungseinstieg, der dem Team Sicherheit gibt und bestehende Stärken absichert."
      : "Die grösste Chance liegt darin, dass die Person schnell produktiv wird und das Team ohne grössere Umstellungen stärkt.";
  }
  return isLeader
    ? `Die grösste Chance liegt darin, dem Team eine klarere Richtung zu geben und Entscheidungen zu beschleunigen, wenn genau das bisher gefehlt hat.`
    : `Die grösste Chance liegt darin, dem Team mehr ${COMP_SHORT[personPrim]} zu geben, wenn genau das bisher zu kurz gekommen ist.`;
}

function buildIntegrationsprognose(bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return "Eine stabile Integration ist wahrscheinlich. Person und Team passen in ihrer Arbeitsweise gut zusammen, was einen schnellen und belastbaren Einstieg ermöglicht.";
  }
  if (bew === "Teilweise passend") {
    return "Eine stabile Integration ist möglich, aber nicht von selbst zu erwarten. Sie hängt in diesem Fall davon ab, wie früh Zusammenarbeit, Erwartungen und Rollenklärung aktiv begleitet werden.";
  }
  return isLeader
    ? "Eine stabile Integration ist nur mit enger Begleitung realistisch. Ohne aktive Führung von oben und klare Rollenklärung besteht ein hohes Risiko, dass die Zusammenarbeit dauerhaft angespannt bleibt."
    : "Eine stabile Integration ist nur mit bewusster Begleitung realistisch. Ohne klare Erwartungen und aktive Teameinbindung besteht das Risiko, dass die Person fachlich funktioniert, aber im Team dauerhaft fremd bleibt.";
}

function buildWarum(v3: TeamCheckV3Result, isLeader: boolean, bew: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  let einleitung: string;
  if (bew === "Gut passend") {
    einleitung = "Diese Einschätzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen Person und Team. Entscheidend ist, wie stark sich beide in ihrer Arbeitsweise ähneln. Im vorliegenden Fall passen Person und Team in ihrer Arbeitsweise gut zusammen. Beide setzen ähnliche Schwerpunkte, was den Einstieg erleichtert und die Zusammenarbeit schnell tragfähig macht.";
  } else if (bew === "Teilweise passend") {
    einleitung = `Diese Einschätzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen Person und Team. Entscheidend ist, wie stark sich beide in ihrer Arbeitsweise ähneln oder unterscheiden und wie gut diese Unterschiede im Alltag aufgefangen werden können. Im vorliegenden Fall arbeitet die Person in mehreren Bereichen ${COMP_ADJ[personPrim]} als das Team. Das muss nicht gegen die Besetzung sprechen, wird aber im Alltag spürbar sein.`;
  } else {
    einleitung = `Diese Einschätzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen Person und Team. Im vorliegenden Fall arbeitet die Person deutlich ${COMP_ADJ[personPrim]} als das bestehende Team. Das Team ist stärker auf ${COMP_SHORT[teamPrim]} ausgerichtet. Genau darin liegt der zentrale Unterschied. Dieser muss nicht automatisch negativ sein, wird aber im Alltag deutlich spürbar sein und braucht von Anfang an klare Führung.`;
  }

  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Was gut zusammenpasst", text: "Person und Team setzen im Alltag ähnliche Schwerpunkte. Beide legen Wert auf einen vergleichbaren Arbeitsstil, was den Einstieg erleichtert und die Zusammenarbeit von Beginn an tragfähig macht. Grössere Umstellungen oder Irritationen sind nicht zu erwarten." });
    blocks.push({ title: "Wo kleine Unterschiede liegen", text: "Auch bei guter Passung gibt es Nuancen im Stil. Diese sind aber im normalen Bereich und dürften sich in den ersten Wochen schnell einspielen. Wichtig ist trotzdem, Erwartungen offen zu besprechen, damit stille Missverständnisse gar nicht erst entstehen." });
  } else {
    blocks.push({ title: "Was trotzdem gut zusammenpasst", text: sameDom
      ? `Person und Team teilen eine ähnliche Grundausrichtung. Das bildet eine solide Basis, auch wenn es in einzelnen Bereichen Abweichungen gibt. Gerade dort, wo beide ähnlich arbeiten, dürfte die Zusammenarbeit schnell funktionieren.`
      : `Trotz unterschiedlicher Schwerpunkte bringt die Person Qualitäten mit, die das Team ergänzen können. Gerade im Bereich ${COMP_SHORT[personPrim]} kann sie eine Lücke schliessen, die bisher offengeblieben ist. Ob daraus eine Stärke wird, hängt davon ab, wie gut der Einstieg begleitet wird.` });
    blocks.push({ title: "Wo der grösste Unterschied liegt", text: `Das Team legt mehr Wert auf ${COMP_SHORT[teamPrim]}. Die Person setzt stärker auf ${COMP_SHORT[personPrim]}. Das wird im Alltag vor allem bei Abstimmungen, Entscheidungen und im Umgang mit Prioritäten spürbar sein. Genau dort braucht es früh Klarheit.` });
  }

  if (v3.teamGoal) {
    let goalText = "Entscheidend ist nicht nur, ob Unterschiede zwischen Person und Team vorhanden sind, sondern ob diese Unterschiede zu den Aufgaben und Anforderungen des Bereichs passen.";
    if (v3.strategicFit === "passend") {
      goalText += " In diesem Fall bringt die Person genau die Stärken mit, die die Abteilung besonders braucht. Das ist ein klarer Pluspunkt, der bei der Gesamtbewertung stark ins Gewicht fällt.";
    } else if (v3.strategicFit === "teilweise") {
      goalText += " Die Person bringt einen Teil dessen mit, was die Abteilung braucht. Dieser Bereich gehört aber nicht zu ihren stärksten Seiten, was die Wirkung im Alltag etwas abschwächt.";
    } else if (v3.strategicFit === "abweichend") {
      goalText += " Die stärkste Seite der Person liegt allerdings nicht in dem Bereich, den die Abteilung am meisten braucht. Das verstärkt die Abweichung zusätzlich und macht eine gute Begleitung umso wichtiger.";
    }
    blocks.push({ title: "Was das Ziel der Abteilung bedeutet", text: goalText });
  } else {
    blocks.push({ title: "Warum das wichtig ist", text: bew === "Gut passend"
      ? "Je klarer Erwartungen, Rolle und Zusammenarbeit von Anfang an geregelt sind, desto stabiler wird der Einstieg. Das gilt auch bei guter Passung."
      : "Da für die Abteilung kein klares Funktionsziel hinterlegt ist, kommt der Führung und der bewussten Rollenklärung hier noch mehr Bedeutung zu. Ohne diese Orientierung steigt das Risiko, dass Unterschiede im Arbeitsstil eher als Störung statt als Ergänzung erlebt werden." });
  }

  let kern: string;
  if (bew === "Gut passend") {
    kern = "Person und Team passen in ihrer Arbeitsweise gut zusammen. Das ist eine gute Ausgangslage für eine schnelle und stabile Integration.";
  } else if (bew === "Teilweise passend") {
    kern = v3.teamGoal && v3.strategicFit === "passend"
      ? "Die Person passt gut zum Ziel der Abteilung, aber nicht automatisch zur gewohnten Teamkultur. Genau das macht gute Begleitung so wichtig."
      : "Die Person bringt Stärken mit, arbeitet aber in wichtigen Punkten anders als das Team. Daraus kann eine Ergänzung werden, wenn der Einstieg gut begleitet wird.";
  } else {
    kern = "Der Unterschied zwischen Person und Team ist deutlich. Ohne klare Führung und enge Begleitung wird das im Alltag zu spürbarer Reibung führen.";
  }

  return { warumEinleitung: einleitung, warumBlocks: blocks, warumKernaussage: kern };
}

function buildWirkung(isLeader: boolean, bew: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  let einleitung: string;
  const blocks: V4Block[] = [];

  if (isLeader) {
    if (bew === "Gut passend") {
      einleitung = "Die Führungskraft arbeitet ähnlich wie das Team und bringt eine Art mit, die im bestehenden Umfeld schnell akzeptiert werden dürfte. Das schafft Vertrauen und erleichtert den Einstieg in die Rolle.";
    } else {
      einleitung = `Die Person würde voraussichtlich anders führen, als das Team es bisher kennt. Sie arbeitet ${COMP_ADJ[personPrim]}, während das Team stärker auf ${COMP_SHORT[teamPrim]} ausgerichtet ist. Genau darin liegt sowohl die Chance als auch das Risiko dieser Besetzung.`;
    }

    blocks.push({ title: "Was die Person positiv einbringen kann", text: bew === "Gut passend"
      ? "Die Führungskraft bringt einen Stil mit, der gut zum Team passt. Dadurch kann sie sich schnell in die Rolle einfinden und Vertrauen aufbauen. Das Team wird die Führung voraussichtlich als stimmig und unterstützend erleben."
      : "Eine neue Führungskraft kann Klarheit schaffen, Entscheidungen beschleunigen, Verantwortung ordnen und dem Team neue Richtung geben. Gerade dann, wenn bisher etwas gefehlt hat, kann eine andere Führungsart wertvoll sein und das Team weiterbringen." });

    blocks.push({ title: "Was das Team daran als schwierig erleben könnte", text: bew === "Gut passend"
      ? "Bei guter Passung ist mit wenig Widerstand zu rechnen. Trotzdem braucht jede neue Führungskraft eine gewisse Eingewöhnungszeit, in der das Team beobachtet, wie sie Entscheidungen trifft und Verantwortung verteilt."
      : "Wenn das Team eine andere Art der Führung gewohnt ist, wird der Unterschied schnell spürbar. Manche Mitarbeitende erleben das als klärend und hilfreich, andere als zu direkt, zu schnell oder zu wenig einbindend. Dann geht es nicht mehr nur um Aufgaben, sondern auch um Vertrauen und Akzeptanz." });

    blocks.push({ title: "Worauf es in den ersten Wochen ankommt", text: "Die Führungskraft braucht nicht nur Aufgaben und Ziele, sondern einen sauberen Einstieg in das Team. Erwartungen, Zuständigkeiten, Entscheidungswege und Kommunikation müssen früh geklärt werden. Je klarer das geschieht, desto grösser ist die Chance, dass aus anfänglicher Unsicherheit mit der Zeit echte Stabilität entsteht." });

    return {
      wirkungTitle: "So würde die Person als Führungskraft wirken",
      wirkungEinleitung: einleitung,
      wirkungBlocks: blocks,
      wirkungKernaussage: bew === "Gut passend"
        ? "Die Führungsart passt zum Team. Der Einstieg dürfte reibungsarm verlaufen."
        : "Die Person kann dem Team wichtige Impulse geben, braucht aber einen klar begleiteten Einstieg."
    };
  }

  if (bew === "Gut passend") {
    einleitung = "Die Person bringt eine Arbeitsweise mit, die gut zum bestehenden Team passt. Sie setzt ähnliche Schwerpunkte und dürfte sich rasch einfinden. Das Team wird den Einstieg voraussichtlich als unkompliziert und passend erleben.";
  } else {
    einleitung = `Die Person bringt eine Arbeitsweise mit, die im Team deutlich spürbar sein wird. Sie arbeitet ${COMP_ADJ[personPrim]}, während das Team stärker auf ${COMP_SHORT[teamPrim]} setzt. Das kann das Team sinnvoll ergänzen, gleichzeitig aber auch Abläufe und Erwartungen verändern.`;
  }

  blocks.push({ title: "Was die Person positiv einbringen kann", text: bew === "Gut passend"
    ? "Person und Team arbeiten ähnlich, was den Alltag von Beginn an erleichtert. Die Person versteht die Erwartungen des Teams schnell und kann sich rasch einbringen. Grössere Umstellungen sind nicht nötig."
    : `Die Person kann neue Impulse bringen, andere Blickwinkel einbringen oder Lücken schliessen, die bisher nicht bewusst wahrgenommen wurden. Besonders im Bereich ${COMP_SHORT[personPrim]} kann sie das Team ergänzen. Das ist vor allem dann wertvoll, wenn genau diese Qualität bisher zu kurz gekommen ist.` });

  blocks.push({ title: "Was für andere spürbar werden könnte", text: bew === "Gut passend"
    ? "Das Team wird die Person voraussichtlich als passend und unkompliziert erleben. Kleinere Unterschiede im Stil sind normal und spielen sich in der Regel schnell ein."
    : personPrim === "impulsiv"
      ? "Die Person entscheidet schneller und handelt direkter als das Team es gewohnt ist. Das kann als erfrischend und klärend wahrgenommen werden, aber auch als ungeduldig oder zu forsch. Gerade in der Anfangsphase kann das zu Irritationen führen, die sich bei guter Klärung aber auflösen lassen."
      : personPrim === "intuitiv"
        ? "Die Person setzt stärker auf Austausch, Abstimmung und gemeinsames Arbeiten. Das kann als bereichernd und verbindend erlebt werden, aber auch als zu aufwändig oder zu langsam. Gerade dort, wo das Team eher schnell entscheidet, braucht es Klärung."
        : "Die Person geht strukturierter und genauer vor als das Team es gewohnt ist. Das kann als hilfreich und verlässlich wahrgenommen werden, aber auch als zu detailliert oder zu langsam. Gerade bei zeitkritischen Themen braucht es klare Absprachen." });

  blocks.push({ title: "Worauf es ankommt, damit es funktioniert", text: 'Darum kommt es weniger darauf an, ob die Person \u201Erichtig\u201C oder \u201Efalsch\u201C ist, sondern darauf, wie gut die Zusammenarbeit von Anfang an gekl\u00E4rt wird. Wenn Erwartungen, Rollen und Zust\u00E4ndigkeiten offen besprochen werden, kann aus dem Unterschied eine Erg\u00E4nzung werden. Bleibt das offen, steigt die Reibung im Alltag schnell an.' });

  return {
    wirkungTitle: "So würde die Person im Team wirken",
    wirkungEinleitung: einleitung,
    wirkungBlocks: blocks,
    wirkungKernaussage: bew === "Gut passend"
      ? "Die Person passt gut ins Team und wird sich schnell einfinden."
      : "Die Person kann dem Team wichtige Impulse geben, braucht aber einen klar begleiteten Einstieg."
  };
}

function buildChancenRisiken(v3: TeamCheckV3Result, isLeader: boolean, bew: string, sameDom: boolean, personPrim: ComponentKey) {
  let chancenEinleitung: string;
  const chancenPunkte: V4Bullet[] = [];

  if (sameDom) {
    chancenEinleitung = "Die Person verstärkt, was das Team bereits gut kann. Das bringt mehr Verlässlichkeit und Stabilität in den Alltag. Gerade dort, wo das Team seine Stärken hat, wird die Person schnell produktiv beitragen können.";
    chancenPunkte.push({ point: "Schneller Anschluss", detail: "Die ähnliche Arbeitsweise erleichtert den Einstieg und reduziert Reibung." });
    chancenPunkte.push({ point: "Mehr Stabilität", detail: "Die bestehenden Teamstärken werden verstärkt und abgesichert." });
    chancenPunkte.push({ point: "Weniger Einarbeitungsaufwand", detail: "Das Team muss sich weniger umstellen, was Zeit und Energie spart." });
  } else {
    chancenEinleitung = `Die Person kann dem Team Qualitäten bringen, die bisher zu wenig vorhanden waren. Gerade mehr ${COMP_SHORT[personPrim]} kann hilfreich sein, wenn Themen bislang zu lange offen bleiben oder bestimmte Impulse fehlen.`;
    chancenPunkte.push({ point: "Neue Impulse", detail: "Die Person kann eingefahrene Muster aufbrechen und andere Blickwinkel einbringen." });
    chancenPunkte.push({ point: `Mehr ${COMP_SHORT[personPrim]}`, detail: "Themen, die bisher zu kurz kamen, werden stärker berücksichtigt." });
    chancenPunkte.push({ point: "Sinnvolle Ergänzung", detail: "Fehlende Dynamik oder Klarheit im Team kann ausgeglichen werden." });
  }
  if (v3.strategicFit === "passend") {
    chancenPunkte.push({ point: "Passt zum Ziel der Abteilung", detail: "Die Stärken der Person liegen genau dort, wo die Abteilung sie am meisten braucht." });
  }

  let risikenEinleitung: string;
  const risikenPunkte: V4Bullet[] = [];

  if (bew === "Kritisch") {
    risikenEinleitung = "Der Unterschied zur bestehenden Teamkultur ist deutlich. Ohne gute Begleitung entstehen daraus schnell Missverständnisse, Frust und das Gefühl, nicht richtig zueinander zu passen.";
    risikenPunkte.push({ point: "Missverständnisse im Alltag", detail: "Erwartungen an Abstimmung und Kommunikation gehen deutlich auseinander." });
    risikenPunkte.push({ point: "Sinkendes Vertrauen", detail: "Wenn Irritationen nicht früh angesprochen werden, leidet das gegenseitige Vertrauen." });
    risikenPunkte.push({ point: "Verfestigte Spannungen", detail: "Kleine Irritationen können sich schnell aufbauen und zu dauerhaften Problemen werden." });
  } else if (bew === "Teilweise passend") {
    risikenEinleitung = "Der Unterschied ist spürbar, aber nicht unlösbar. Wenn er im Alltag nicht gut aufgefangen wird, entstehen allerdings unnötige Reibung und Abstimmungsprobleme.";
    risikenPunkte.push({ point: "Mehr Abstimmungsbedarf", detail: "In den ersten Monaten braucht es mehr Klärung als bei einer ähnlicheren Besetzung." });
    risikenPunkte.push({ point: "Unterschiedliche Erwartungen", detail: "Was die eine Seite als selbstverständlich sieht, muss für die andere erst besprochen werden." });
    risikenPunkte.push({ point: "Rollen müssen aktiv geklärt werden", detail: "Ohne klare Zuständigkeiten entsteht schnell Unsicherheit auf beiden Seiten." });
  } else {
    risikenEinleitung = "Bei guter Passung sind die Risiken gering. Trotzdem sollten Erwartungen und Zusammenarbeit von Anfang an bewusst besprochen werden.";
    risikenPunkte.push({ point: "Zu viel Gleichförmigkeit", detail: "Ähnlichkeit bringt Stabilität, kann aber Innovation und neue Perspektiven bremsen." });
    risikenPunkte.push({ point: "Blinde Flecken", detail: "Was dem Team bisher fehlt, wird durch eine ähnliche Person nicht automatisch sichtbar." });
  }

  if (isLeader) {
    risikenPunkte.push({ point: "Schwieriger Führungseinstieg", detail: "Auch bei fachlicher Passung kann es dauern, bis die Führung im Team wirklich ankommt." });
  } else {
    risikenPunkte.push({ point: "Schwieriger Anschluss", detail: "Die Person könnte fachlich gute Arbeit leisten, im Team aber schwerer ankommen." });
  }

  return { chancenEinleitung, chancenPunkte, risikenEinleitung, risikenPunkte };
}

function buildOhne(isLeader: boolean, sameDom: boolean, personPrim: ComponentKey) {
  const erhalten: string[] = [];
  const ungeloest: string[] = [];

  erhalten.push("Mehr Ruhe im Team");
  erhalten.push("Weniger direkte Reibung");
  erhalten.push("Vertraute Abläufe bleiben bestehen");

  if (isLeader) {
    ungeloest.push("Fehlende Führungsklarheit bleibt bestehen");
    ungeloest.push("Langsame oder unklare Entscheidungen ändern sich nicht");
    ungeloest.push("Bestehende Entwicklungsdefizite im Team bleiben");
    ungeloest.push("Unklare Zuständigkeiten lösen sich nicht von selbst");
  } else {
    if (!sameDom) {
      ungeloest.push(`Lücke im Bereich ${COMP_SHORT[personPrim]} bleibt offen`);
    }
    ungeloest.push("Fehlende Impulse bleiben aus");
    ungeloest.push("Bekannte Schwächen im Alltag bleiben bestehen");
    ungeloest.push("Keine echte Veränderung oder Weiterentwicklung");
  }

  return {
    ohneErhalten: erhalten,
    ohneUngeloest: ungeloest,
    ohneKernaussage: "Die Frage ist nicht nur, ob diese Person ideal passt. Genauso wichtig ist, was es für Team und Abteilung bedeutet, wenn nichts verändert wird.",
  };
}

function buildAlltag(isLeader: boolean, bew: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Zusammenarbeit", text: "Im Alltag dürfte die Zusammenarbeit von Beginn an gut funktionieren. Person und Team setzen ähnliche Schwerpunkte, was Abstimmungen erleichtert und das Miteinander schnell eingespielt wirken lässt. Grössere Anpassungen sind wahrscheinlich nicht nötig." });
    blocks.push({ title: "Kommunikation", text: "Auch in der Kommunikation sind wenig Irritationen zu erwarten. Beide Seiten dürften sich schnell auf einen gemeinsamen Stil einstellen. Kleinere Unterschiede in Tonalität oder Ausführlichkeit sind normal und dürften sich rasch einspielen." });
    blocks.push({ title: "Tempo und Prioritäten", text: "Tempo und Prioritäten liegen voraussichtlich nah beieinander. Das macht den Alltag einfacher, weil weniger Klärungsbedarf entsteht und Entscheidungen ähnlich vorbereitet werden." });
    blocks.push({ title: "Verantwortung", text: "Zuständigkeiten sollten trotzdem klar benannt werden, auch wenn die Passung gut ist. So wird verhindert, dass stille Annahmen irgendwann zu Missverständnissen werden." });
  } else {
    blocks.push({ title: "Zusammenarbeit", text: `Im Alltag wird schnell sichtbar werden, dass Person und Team nicht automatisch dieselben Schwerpunkte setzen. Während das Team stärker über ${COMP_SHORT[teamPrim]} arbeitet, geht die Person eher in Richtung ${COMP_SHORT[personPrim]}. Dadurch braucht Zusammenarbeit am Anfang mehr bewusste Klärung.` });
    blocks.push({ title: "Kommunikation", text: personPrim === "impulsiv"
      ? "Auch in der Kommunikation können Unterschiede spürbar werden. Was die Person als klar und effizient erlebt, kann für das Team zu direkt oder zu knapp wirken. Umgekehrt kann der Person manches zu ausführlich oder zu langsam erscheinen."
      : personPrim === "intuitiv"
        ? "In der Kommunikation setzt die Person stärker auf Austausch und Dialog. Das Team empfindet das möglicherweise als bereichernd, teilweise aber auch als zusätzlichen Aufwand. Hier braucht es eine gemeinsame Ebene."
        : "Die Person kommuniziert möglicherweise sachlicher und strukturierter als das Team es gewohnt ist. Das kann als klar und verlässlich wahrgenommen werden, aber auch als distanziert. Hier lohnt es sich, den Stil früh abzustimmen." });
    blocks.push({ title: "Tempo und Prioritäten", text: "Wahrscheinlich werden Themen unterschiedlich gewichtet. Die Person wird andere Schwerpunkte setzen als das Team. Daraus können Spannungen entstehen, wenn Prioritäten nicht gemeinsam geklärt und Entscheidungen nicht transparent vorbereitet werden." });
    blocks.push({ title: "Verantwortung", text: "Besonders wichtig ist Klarheit bei Zuständigkeiten. Wenn nicht eindeutig ist, wer entscheidet, wer abstimmt und wo Eigenständigkeit gewünscht ist, wächst die Unsicherheit schnell. Das ist gerade in der Anfangsphase einer der häufigsten Auslöser für unnötige Reibung." });
  }

  const warnzeichen: string[] = [];
  const positivzeichen: string[] = [];
  if (bew !== "Gut passend") {
    warnzeichen.push("Missverständnisse wiederholen sich");
    warnzeichen.push("Abstimmungen stocken regelmässig");
    warnzeichen.push("Spannungen werden nicht offen angesprochen");
    warnzeichen.push("Verantwortung bleibt trotz Klärungsversuchen unklar");
    positivzeichen.push("Die Person wird aktiv in Abstimmungen einbezogen");
    positivzeichen.push("Missverständnisse nehmen ab statt zu");
    positivzeichen.push("Rollen werden klarer statt unklarer");
    positivzeichen.push("Zusammenarbeit wird leichter statt anstrengender");
  }

  const alltagEinleitung = bew === "Gut passend"
    ? "Hier zeigt sich, wie Person und Team im Arbeitsalltag zusammenwirken. Bei guter Passung ist der Übergang in der Regel unkompliziert."
    : "Hier wird sichtbar, wo Zusammenarbeit leicht läuft und wo es im Alltag mehr Aufmerksamkeit braucht. Gerade die ersten Wochen sind entscheidend.";

  return {
    alltagEinleitung,
    alltagBlocks: blocks,
    alltagWarnzeichen: warnzeichen,
    alltagPositivzeichen: positivzeichen,
    alltagKernaussage: bew === "Gut passend"
      ? "Im Alltag sollte die Zusammenarbeit reibungsarm laufen. Kleinere Unterschiede spielen sich schnell ein."
      : "Werden diese Signale früh erkannt, lässt sich gut gegensteuern. Werden sie übersehen, verfestigen sie sich meist."
  };
}

function buildLeistung(bew: string, isLeader: boolean, hasGoal: boolean) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Am Anfang", text: "Die Person kann sich voraussichtlich rasch einarbeiten und produktiv beitragen. Da Person und Team ähnlich arbeiten, entsteht wenig unnötiger Klärungsbedarf. Die ersten Wochen dürften vergleichsweise reibungslos verlaufen." });
    blocks.push({ title: "Später", text: "Mittelfristig stabilisiert die Person das bestehende Umfeld und trägt verlässlich zu guten Ergebnissen bei. Qualität und Tempo bleiben auf einem gleichmässig hohen Niveau. Auch unter wechselnden Anforderungen dürfte die Zusammenarbeit stabil bleiben." });
    blocks.push({ title: "Worauf es ankommt", text: "Auch bei guter Passung sollten Erwartungen und Rückmeldungen regelmässig stattfinden. Das sichert ab, dass die gute Ausgangslage auch langfristig genutzt wird und sich keine stillen Missverständnisse einschleichen." });
  } else {
    blocks.push({ title: "Am Anfang", text: "Kurzfristig ist mit mehr Klärung und Abstimmung zu rechnen. Die ersten Wochen sind stärker von Beobachtung und gegenseitigem Einordnen geprägt als von reibungsloser Leistung. Das ist bei spürbaren Unterschieden nicht ungewöhnlich, sollte aber bewusst eingeplant werden." });
    blocks.push({ title: "Später", text: `Wenn Erwartungen klar sind, Rollen sauber benannt werden und Rückmeldungen früh stattfinden, kann aus der Besetzung eine produktive Ergänzung werden. Die Person bringt dann etwas ein, das dem ${isLeader ? "Team" : "Umfeld"} bisher gefehlt hat. Bleiben Zusammenarbeit und Verantwortung dagegen unklar, fliesst Energie nicht in gute Ergebnisse, sondern in Missverständnisse und unnötige Abstimmung.` });
    blocks.push({ title: "Fachliche Leistung vs. Teamintegration", text: "Die Herausforderung liegt hier voraussichtlich weniger in der Leistungsfähigkeit der Person als darin, ob sie im Team wirklich gut ankommt. Fachlich gute Arbeit reicht allein nicht aus, wenn die Zusammenarbeit nicht funktioniert." });
  }

  const leistungEinleitung = bew === "Gut passend"
    ? "Was bedeutet diese Besetzung konkret für Ergebnisse und Produktivität?"
    : "Die entscheidende Frage ist nicht nur, ob die Person fachlich gut arbeiten kann, sondern ob ihre Leistung im bestehenden Umfeld auch wirklich zur Geltung kommt.";

  return {
    leistungEinleitung,
    leistungBlocks: blocks,
    leistungKernaussage: bew === "Gut passend"
      ? "Leistung und Ergebnisse dürften sich schnell und stabil einstellen."
      : "Ob aus der Besetzung eine Stärke oder ein Problem wird, hängt vor allem von der Begleitung in den ersten Wochen ab."
  };
}

function buildDruck(bew: string) {
  const blocks: V4Block[] = [
    { title: "Was unter Druck typischerweise passiert", text: "Unter Druck zeigt sich die natürliche Arbeitsweise eines Menschen meist deutlicher als im Normalbetrieb. Was sonst noch ausgeglichen oder angepasst wird, tritt dann klarer hervor. Die Person greift stärker auf ihre gewohnte Art zurück und zeigt ihre Stärken, aber auch ihre Grenzen deutlicher." },
    { title: "Was das für das Umfeld bedeutet", text: bew === "Gut passend"
      ? "Da Person und Team ähnlich arbeiten, ist das Risiko unter Druck gering. Die Zusammenarbeit dürfte auch in intensiven Phasen stabil bleiben, weil beide Seiten ähnlich reagieren und sich gegenseitig stützen können."
      : "Unter Druck werden Unterschiede meist nicht kleiner, sondern grösser. Was im Alltag noch tragbar erscheint, kann in intensiven Phasen schneller zu Reibung, Unsicherheit oder Missverständnissen führen. Das Team und die Person reagieren dann unterschiedlich, was die Abstimmung erschwert." },
    { title: "Was dann besonders wichtig ist", text: "Klare Absprachen, kurze Wege und eindeutige Verantwortung. Gerade in belasteten Phasen braucht es Klarheit statt zusätzlicher Abstimmung. Wer in solchen Momenten weiss, wer entscheidet und wer informiert werden muss, reduziert unnötige Reibung erheblich." },
  ];

  return {
    druckBlocks: blocks,
    druckKernaussage: bew === "Gut passend"
      ? "Auch unter Druck dürfte die Zusammenarbeit stabil bleiben."
      : "Unter Druck werden Unterschiede sichtbarer. Klare Absprachen sind dann besonders wichtig."
  };
}

function buildEmpfehlungen(isLeader: boolean): V4Block[] {
  const items: V4Block[] = [
    { title: "Rolle und Erwartungen früh klären", text: "Von Anfang an sollte klar sein, was genau von der Person erwartet wird, woran Erfolg gemessen wird und welche Verantwortung tatsächlich bei ihr liegt. Unklare Rollen sind einer der häufigsten Gründe für spätere Spannungen." },
    { title: "Zusammenarbeit nicht dem Zufall überlassen", text: "Gerade in den ersten Wochen sollte bewusst besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen. Was nicht offen besprochen wird, wird meist still interpretiert." },
    { title: "Früh Rückmeldung geben", text: "Die Wirkung einer Person zeigt sich oft früher als ihre Ergebnisse. Deshalb sind frühe, offene Rückmeldungen besonders wichtig. Nicht erst warten, bis Spannungen fest sitzen." },
    { title: "Nach den ersten Wochen bewusst prüfen", text: "Nach 30 bis 60 Tagen sollte gezielt geschaut werden: Was läuft gut? Wo gibt es Reibung? Was muss angepasst werden? Diese Reflexion verhindert, dass aus einem schwierigen Start ein dauerhaftes Problem wird." },
  ];

  if (isLeader) {
    items.push({ title: "Auf Vertrauen und Akzeptanz achten", text: "Bei einer Führungsrolle reicht es nicht, nur auf Ziele und Aufgaben zu schauen. Ebenso wichtig ist die Frage, ob die Führung im Team wirklich ankommt, ob Vertrauen entsteht und ob die Person in der Rolle ankommen kann." });
  } else {
    items.push({ title: "Anschluss ans Team aktiv begleiten", text: "Gerade bei einem neuen Teammitglied sollte darauf geachtet werden, dass die Person nicht nur Aufgaben bekommt, sondern auch Zugang zum Team findet. Teamregeln und Schnittstellen sollten offen benannt werden." });
  }

  return items;
}
