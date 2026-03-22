import type { Triad, ComponentKey } from "./bio-types";
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
  passungZumTeam: string;
  beitragZurAufgabe: string;
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

export function computeTeamCheckV4(input: TeamCheckV3Input & { roleType?: string }): TeamCheckV4Result {
  const v3 = computeTeamCheckV3(input);

  const inputRoleType = (input as any).roleType;
  const isLeader = inputRoleType === "fuehrung" ? true : inputRoleType === "teammitglied" ? false : v3.roleType === "leadership";
  const roleLabel = isLeader ? "Führungskraft" : "Teammitglied";

  const teamPrimary = getPrimaryKey(input.teamProfile);
  const personPrimary = getPrimaryKey(input.personProfile);
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

  let gesamteinschaetzung: string;
  if (teamFitRaw === "hoch") {
    gesamteinschaetzung = "Gut passend";
  } else if (teamFitRaw === "gering" && (funktionsFit === "hoch" || funktionsFit === "mittel")) {
    gesamteinschaetzung = "Strategisch sinnvoll, aber anspruchsvoll";
  } else if (teamFitRaw === "mittel") {
    gesamteinschaetzung = "Teilweise passend";
  } else {
    gesamteinschaetzung = "Kritisch";
  }

  const bewForLogic = gesamteinschaetzung === "Strategisch sinnvoll, aber anspruchsvoll" ? "Kritisch" : gesamteinschaetzung;

  let wirkungAufUmfeld: string;
  if (bewForLogic === "Gut passend") {
    wirkungAufUmfeld = sameDominance ? "eher stabilisierend" : "eher erg\u00E4nzend";
  } else if (bewForLogic === "Teilweise passend") {
    wirkungAufUmfeld = sameDominance ? "eher erg\u00E4nzend" : "eher ver\u00E4ndernd";
  } else {
    wirkungAufUmfeld = "eher spannungsanf\u00E4llig";
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
    passungZumTeam,
    beitragZurAufgabe,
    wirkungAufUmfeld,
    begleitungsbedarf,
    risikoImAlltag,
    kurzfazit: buildKurzfazit(gesamteinschaetzung, bewForLogic, isLeader),
    ersteEmpfehlung: buildErsteEmpfehlung(bewForLogic, isLeader),
    managementEinschaetzung: buildManagementEinschaetzung(gesamteinschaetzung, bewForLogic, isLeader, hasGoal),
    hauptrisiko: buildHauptrisiko(bewForLogic, isLeader),
    hauptchance: buildHauptchance(bewForLogic, isLeader, personPrimary),
    integrationsprognose: buildIntegrationsprognose(gesamteinschaetzung, bewForLogic, isLeader),
    teamProfile: v3.teamProfile,
    personProfile: v3.personProfile,
    teamLabel: v3.teamLabel,
    personLabel: v3.personLabel,
    teamPersonAbweichung: v3.teamPersonAbweichung,
    teamGoalAbweichung: v3.teamGoalAbweichung,
    personGoalAbweichung: v3.personGoalAbweichung,
    ...buildWarum(v3, isLeader, bewForLogic, sameDominance, teamPrimary, personPrimary),
    ...buildWirkung(isLeader, bewForLogic, sameDominance, teamPrimary, personPrimary),
    ...buildChancenRisiken(v3, isLeader, bewForLogic, sameDominance, personPrimary),
    ...buildOhne(isLeader, bewForLogic, sameDominance, personPrimary),
    ...buildAlltag(isLeader, bewForLogic, sameDominance, teamPrimary, personPrimary),
    ...buildLeistung(bewForLogic, isLeader, hasGoal),
    ...buildDruck(bewForLogic, isLeader, personPrimary),
    empfehlungen: buildEmpfehlungen(isLeader, bewForLogic),
    teamKontext: sameDominance
      ? `Team und Person setzen beide auf ${COMP_SHORT[teamPrimary]}. Ihre Arbeitsweisen liegen nah beieinander.`
      : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt st\u00E4rker auf ${COMP_SHORT[personPrimary]}.`,
    v3,
  };
}

function buildKurzfazit(gesamt: string, bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Die Person bringt eine Arbeitsweise mit, die gut zum bestehenden Team passt. Der Einstieg in die F\u00FChrungsrolle d\u00FCrfte vergleichsweise reibungsarm verlaufen."
      : "Die Person passt gut zum bestehenden Team. Der Einstieg d\u00FCrfte reibungsarm verlaufen und die Zusammenarbeit kann sich schnell einspielen.";
  }
  if (bew === "Teilweise passend") {
    return isLeader
      ? "Die Person bringt St\u00E4rken mit, arbeitet aber in einigen Punkten anders als das Team es kennt. Ob die F\u00FChrung gut ankommt, h\u00E4ngt davon ab, wie bewusst die ersten Wochen gestaltet werden."
      : "Die Person passt in Teilen gut zum Team, weicht in anderen Punkten aber sp\u00FCrbar ab. Das kann neue Impulse bringen, braucht aber klare Absprachen.";
  }
  if (gesamt === "Strategisch sinnvoll, aber anspruchsvoll") {
    return isLeader
      ? "Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die St\u00E4rke mit, die die Abteilung f\u00FCr ihre Aufgabe braucht. Der Einstieg ist anspruchsvoll, kann aber bei aktiver F\u00FChrung sehr sinnvoll sein."
      : "Die Person passt nur begrenzt zur bisherigen Teamkultur, bringt aber genau die St\u00E4rke mit, die die Abteilung f\u00FCr ihre Aufgabe braucht. Die Besetzung ist deshalb nicht leicht, kann aber strategisch sinnvoll sein.";
  }
  return isLeader
    ? "Die Person w\u00FCrde deutlich anders f\u00FChren, als das Team es kennt. Ohne aktive Begleitung ist mit Spannungen und schw\u00E4cheren Ergebnissen zu rechnen."
    : "Die Person arbeitet deutlich anders als das Team. Ohne Begleitung ist mit Reibung und Missverst\u00E4ndnissen zu rechnen.";
}

function buildErsteEmpfehlung(bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Die ersten Wochen sollten genutzt werden, um Rolle, Erwartungen und Zusammenarbeit sauber zu kl\u00E4ren. Das schafft eine stabile Grundlage."
      : "Auch bei guter Passung lohnt es sich, Erwartungen und Zust\u00E4ndigkeiten in den ersten Wochen offen zu besprechen.";
  }
  if (bew === "Teilweise passend") {
    return isLeader
      ? "Die ersten Wochen sollten bewusst gef\u00FChrt werden. F\u00FChrungsrolle, Entscheidungswege und die Zusammenarbeit mit dem Team m\u00FCssen fr\u00FCh und klar benannt werden."
      : "Die ersten Wochen sollten bewusst begleitet werden. Rolle, Erwartungen und Zust\u00E4ndigkeiten m\u00FCssen von Anfang an klar benannt werden.";
  }
  return isLeader
    ? "Die ersten Wochen brauchen enge Begleitung von oben. Rolle, Erwartungen und Entscheidungswege m\u00FCssen sofort offen geregelt werden, damit die F\u00FChrung im Team ankommen kann."
    : "Die ersten Wochen brauchen enge Begleitung. Rolle, Erwartungen und Kommunikation m\u00FCssen sofort offen geregelt werden, damit die Person im Team ankommen kann.";
}

function buildManagementEinschaetzung(gesamt: string, bew: string, isLeader: boolean, hasGoal: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Diese Besetzung ist aus unserer Sicht empfehlenswert. Die Arbeitsweisen von Person und Team passen gut zusammen. Der Einstieg in die Rolle sollte vergleichsweise reibungsarm gelingen."
      : "Diese Besetzung ist aus unserer Sicht empfehlenswert. Person und Team arbeiten auf eine vergleichbare Art, was den Einstieg erleichtert und die Zusammenarbeit schnell tragf\u00E4hig macht.";
  }
  if (bew === "Teilweise passend") {
    const goalHint = !hasGoal ? " Da kein klares Funktionsziel hinterlegt ist, kommt der bewussten Rollenkl\u00E4rung hier noch mehr Bedeutung zu." : "";
    return isLeader
      ? `Diese Besetzung ist m\u00F6glich, aber anspruchsvoll. Sie sollte nur dann erfolgen, wenn der Einstieg bewusst gef\u00FChrt und die Zusammenarbeit aktiv begleitet wird.${goalHint}`
      : `Diese Besetzung kann gelingen, ist aber kein Selbstl\u00E4ufer. Sie braucht von Anfang an klare Erwartungen und gute Begleitung.${goalHint}`;
  }
  if (gesamt === "Strategisch sinnvoll, aber anspruchsvoll") {
    const goalHint = !hasGoal ? " Da kein klares Funktionsziel hinterlegt ist, l\u00E4sst sich der funktionale Beitrag nicht abschliessend bewerten." : "";
    return isLeader
      ? `Diese Besetzung ist im bestehenden Team nicht leicht, kann f\u00FCr die Aufgabe der Abteilung aber sehr sinnvoll sein. Die Person bringt genau die St\u00E4rke mit, die bisher gefehlt hat. Entscheidend ist, dass die Integration in den ersten Wochen aktiv gef\u00FChrt wird.${goalHint} Ohne klare F\u00FChrung \u00FCberwiegen die Reibungen. Mit guter Begleitung kann die Besetzung dem Team jedoch genau die Qualit\u00E4t geben, die es braucht.`
      : `Diese Besetzung ist im bestehenden Team nicht leicht, kann f\u00FCr die Aufgabe der Abteilung aber sehr sinnvoll sein. Die Person bringt genau die St\u00E4rke mit, die bisher gefehlt hat. Entscheidend ist, dass die Integration aktiv gef\u00FChrt wird.${goalHint} Ohne Begleitung \u00FCberwiegen die Reibungen. Mit guter F\u00FChrung kann die Besetzung dem Team jedoch genau die Qualit\u00E4t geben, die es braucht.`;
  }
  const goalHint = !hasGoal ? " Da zudem kein klares Funktionsziel vorliegt, fehlt eine zus\u00E4tzliche Orientierung, die den Einstieg erleichtern k\u00F6nnte." : "";
  return isLeader
    ? `Diese Besetzung ist im aktuellen Umfeld kritisch. Sie ist nur dann vertretbar, wenn der Einstieg eng begleitet wird und das Team klare F\u00FChrung von oben erh\u00E4lt.${goalHint} Ohne diese Voraussetzungen ist das Risiko hoch, dass die Zusammenarbeit dauerhaft schwierig bleibt.`
    : `Diese Besetzung ist im aktuellen Umfeld kritisch und nur mit enger Begleitung tragf\u00E4hig.${goalHint} Ohne aktive F\u00FChrung und klare Absprachen ist das Risiko hoch, dass die Person im Team nicht wirklich ankommt.`;
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
    ? "Das gr\u00F6sste Risiko liegt darin, dass die Person im Team zu wenig Vertrauen aufbauen kann und F\u00FChrung deshalb nicht wirksam wird. Ohne aktive Begleitung besteht hier nicht nur ein Startproblem, sondern das Risiko einer dauerhaften Fehlpassung."
    : "Das gr\u00F6sste Risiko liegt nicht in der Leistung der Person, sondern darin, dass sie im Team zu wenig Anschluss findet. Ohne aktive Begleitung besteht hier nicht nur ein Startproblem, sondern das Risiko einer dauerhaften Fehlpassung im Teamalltag.";
}

function buildHauptchance(bew: string, isLeader: boolean, personPrim: ComponentKey): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Die grösste Chance liegt in einem schnellen, stabilen Führungseinstieg, der dem Team Sicherheit gibt und bestehende Stärken absichert."
      : "Die grösste Chance liegt darin, dass die Person schnell produktiv wird und das Team ohne grössere Umstellungen stärkt.";
  }
  const chanceSatz = isLeader
    ? `Die gr\u00F6sste Chance liegt darin, dem Team eine klarere Richtung zu geben und Entscheidungen zu beschleunigen, wenn genau das bisher gefehlt hat.`
    : `Die gr\u00F6sste Chance liegt darin, dem Team mehr ${COMP_SHORT[personPrim]} zu geben, wenn genau das bisher zu kurz gekommen ist.`;
  if (bew === "Kritisch") {
    return chanceSatz + " Diese Chance wird aber nur dann wirksam, wenn die Integration aktiv gef\u00FChrt wird. Ohne Begleitung \u00FCberwiegen die Risiken klar.";
  }
  return chanceSatz;
}

function buildIntegrationsprognose(gesamt: string, bew: string, isLeader: boolean): string {
  if (bew === "Gut passend") {
    return isLeader
      ? "Eine stabile Integration ist wahrscheinlich. Die F\u00FChrungskraft arbeitet \u00E4hnlich wie das Team, was einen schnellen und belastbaren Einstieg in die Rolle erm\u00F6glicht."
      : "Eine stabile Integration ist wahrscheinlich. Person und Team passen in ihrer Arbeitsweise gut zusammen, was einen schnellen und belastbaren Einstieg erm\u00F6glicht.";
  }
  if (bew === "Teilweise passend") {
    return isLeader
      ? "Eine stabile Integration ist m\u00F6glich, aber nicht von selbst zu erwarten. Vor allem in den ersten Wochen ist aktive F\u00FChrung von oben entscheidend. Erst wenn die F\u00FChrungsrolle klar ist und das Team die neue Leitung akzeptiert, kann daraus eine dauerhaft tragf\u00E4hige Zusammenarbeit entstehen."
      : "Eine stabile Integration ist m\u00F6glich, aber nicht von selbst zu erwarten. Vor allem in den ersten Wochen ist aktive Begleitung entscheidend. Erst wenn Zusammenarbeit, Erwartungen und Rollen klar sind, kann daraus eine dauerhaft tragf\u00E4hige Zusammenarbeit entstehen.";
  }
  if (gesamt === "Strategisch sinnvoll, aber anspruchsvoll") {
    return isLeader
      ? "Die Integration wird anspruchsvoll, ist aber bei aktiver F\u00FChrung realistisch. Die Person bringt funktional genau das mit, was gebraucht wird. Vor allem in den ersten Wochen ist enge Begleitung entscheidend. Gelingt der Einstieg, kann daraus eine produktive und stabile Zusammenarbeit werden."
      : "Die Integration wird anspruchsvoll, ist aber bei guter Begleitung realistisch. Die Person bringt funktional genau das mit, was gebraucht wird. Vor allem in den ersten Wochen braucht es klare Erwartungen und aktive Einbindung. Gelingt der Einstieg, kann daraus eine wertvolle Erg\u00E4nzung werden.";
  }
  return isLeader
    ? "Eine stabile Integration ist nur mit enger Begleitung realistisch. Vor allem in den ersten Wochen ist aktive F\u00FChrung von oben entscheidend. Ohne diese Begleitung besteht nicht nur das Risiko eines schwierigen Starts, sondern einer dauerhaften Fehlpassung im Teamalltag."
    : "Eine stabile Integration ist nur mit bewusster Begleitung realistisch. Vor allem in den ersten Wochen braucht es klare Erwartungen und aktive Teameinbindung. Ohne diese Begleitung besteht nicht nur das Risiko eines schwierigen Starts, sondern einer dauerhaften Fehlpassung im Teamalltag.";
}

function buildWarum(v3: TeamCheckV3Result, isLeader: boolean, bew: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  let einleitung: string;
  if (bew === "Gut passend") {
    einleitung = isLeader
      ? `Diese Einsch\u00E4tzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen F\u00FChrungskraft und Team. Im vorliegenden Fall passt die Person in ihrer Art gut zum Team. Beide setzen \u00E4hnliche Schwerpunkte, was den Einstieg in die F\u00FChrungsrolle erleichtert und schnell Akzeptanz schaffen d\u00FCrfte.`
      : `Diese Einsch\u00E4tzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen Person und Team. Im vorliegenden Fall passen Person und Team in ihrer Arbeitsweise gut zusammen. Beide setzen \u00E4hnliche Schwerpunkte, was den Einstieg erleichtert und die Zusammenarbeit schnell tragf\u00E4hig macht.`;
  } else if (bew === "Teilweise passend") {
    einleitung = isLeader
      ? `Diese Einsch\u00E4tzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen F\u00FChrungskraft und Team. Im vorliegenden Fall f\u00FChrt die Person ${COMP_ADJ[personPrim]} als das Team es gewohnt ist. Das muss nicht gegen die Besetzung sprechen, wird aber im F\u00FChrungsalltag sp\u00FCrbar sein.`
      : `Diese Einsch\u00E4tzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen Person und Team. Im vorliegenden Fall arbeitet die Person in mehreren Bereichen ${COMP_ADJ[personPrim]} als das Team. Das muss nicht gegen die Besetzung sprechen, wird aber im Alltag sp\u00FCrbar sein.`;
  } else {
    einleitung = isLeader
      ? `Diese Einsch\u00E4tzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen F\u00FChrungskraft und Team. Im vorliegenden Fall w\u00FCrde die Person deutlich ${COMP_ADJ[personPrim]} f\u00FChren, als das Team es kennt. Das Team ist st\u00E4rker auf ${COMP_SHORT[teamPrim]} ausgerichtet. Genau darin liegt der zentrale Unterschied, der im F\u00FChrungsalltag deutlich sp\u00FCrbar sein wird.`
      : `Diese Einsch\u00E4tzung entsteht nicht aus einem einzelnen Punkt, sondern aus dem Zusammenspiel zwischen Person und Team. Im vorliegenden Fall arbeitet die Person deutlich ${COMP_ADJ[personPrim]} als das bestehende Team. Das Team ist st\u00E4rker auf ${COMP_SHORT[teamPrim]} ausgerichtet. Genau darin liegt der zentrale Unterschied, der im Alltag deutlich sp\u00FCrbar sein wird und von Anfang an klare F\u00FChrung braucht.`;
  }

  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Was gut zusammenpasst", text: isLeader
      ? `F\u00FChrungskraft und Team setzen im Alltag \u00E4hnliche Schwerpunkte. Die Art der F\u00FChrung passt zur Arbeitsweise des Teams, was den Einstieg in die Rolle erleichtert und schnell Vertrauen schaffen d\u00FCrfte. Gr\u00F6ssere Umstellungen oder Irritationen sind nicht zu erwarten.`
      : `Person und Team setzen im Alltag \u00E4hnliche Schwerpunkte. Beide legen Wert auf einen vergleichbaren Arbeitsstil, was den Einstieg erleichtert und die Zusammenarbeit von Beginn an tragf\u00E4hig macht. Gr\u00F6ssere Umstellungen oder Irritationen sind nicht zu erwarten.` });
    blocks.push({ title: "Wo kleine Unterschiede liegen", text: isLeader
      ? `Auch bei guter Passung gibt es Nuancen im F\u00FChrungsstil. Diese sind aber im normalen Bereich und d\u00FCrften sich in den ersten Wochen schnell einspielen. Wichtig ist trotzdem, Erwartungen an die F\u00FChrungsrolle offen zu besprechen.`
      : `Auch bei guter Passung gibt es Nuancen im Stil. Diese sind aber im normalen Bereich und d\u00FCrften sich in den ersten Wochen schnell einspielen. Wichtig ist trotzdem, Erwartungen offen zu besprechen, damit stille Missverst\u00E4ndnisse gar nicht erst entstehen.` });
  } else {
    blocks.push({ title: "Was trotzdem gut zusammenpasst", text: sameDom
      ? (isLeader
        ? `F\u00FChrungskraft und Team teilen eine \u00E4hnliche Grundausrichtung. Das bildet eine solide Basis f\u00FCr die F\u00FChrungsarbeit, auch wenn es in einzelnen Bereichen Abweichungen gibt.`
        : `Person und Team teilen eine \u00E4hnliche Grundausrichtung. Das bildet eine solide Basis, auch wenn es in einzelnen Bereichen Abweichungen gibt. Gerade dort, wo beide \u00E4hnlich arbeiten, d\u00FCrfte die Zusammenarbeit schnell funktionieren.`)
      : (isLeader
        ? `Trotz unterschiedlicher Schwerpunkte bringt die F\u00FChrungskraft Qualit\u00E4ten mit, die dem Team bisher gefehlt haben. Gerade im Bereich ${COMP_SHORT[personPrim]} kann sie eine L\u00FCcke schliessen. Ob daraus eine St\u00E4rke wird, h\u00E4ngt davon ab, wie gut der F\u00FChrungseinstieg begleitet wird.`
        : `Trotz unterschiedlicher Schwerpunkte bringt die Person Qualit\u00E4ten mit, die das Team erg\u00E4nzen k\u00F6nnen. Gerade im Bereich ${COMP_SHORT[personPrim]} kann sie eine L\u00FCcke schliessen, die bisher offengeblieben ist. Ob daraus eine St\u00E4rke wird, h\u00E4ngt davon ab, wie gut der Einstieg begleitet wird.`) });
    blocks.push({ title: "Wo der gr\u00F6sste Unterschied liegt", text: isLeader
      ? `Das Team legt mehr Wert auf ${COMP_SHORT[teamPrim]}. Die F\u00FChrungskraft setzt st\u00E4rker auf ${COMP_SHORT[personPrim]}. Das wird im F\u00FChrungsalltag vor allem bei Entscheidungen, Priorisierung und im Umgang mit dem Team sp\u00FCrbar sein.`
      : `Das Team legt mehr Wert auf ${COMP_SHORT[teamPrim]}. Die Person setzt st\u00E4rker auf ${COMP_SHORT[personPrim]}. Das wird im Alltag vor allem bei Abstimmungen, Entscheidungen und im Umgang mit Priorit\u00E4ten sp\u00FCrbar sein. Genau dort braucht es fr\u00FCh Klarheit.` });
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
    chancenPunkte.push({ point: `Mehr ${COMP_SHORT[personPrim]}`, detail: personPrim === "analytisch"
      ? "Themen werden sauberer vorbereitet, klarer bearbeitet und verl\u00E4sslicher nachgehalten."
      : personPrim === "impulsiv"
        ? "Entscheidungen werden schneller getroffen und konsequenter umgesetzt."
        : "Zusammenarbeit und Austausch werden lebendiger und verbindlicher." });
    chancenPunkte.push({ point: "Sinnvolle Erg\u00E4nzung", detail: `Was dem Team bisher an ${COMP_SHORT[personPrim]} gefehlt hat, kann durch die Person gezielt gest\u00E4rkt werden.` });
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

function buildOhne(isLeader: boolean, bew: string, sameDom: boolean, personPrim: ComponentKey) {
  const erhalten: string[] = [];
  const ungeloest: string[] = [];

  if (bew === "Gut passend") {
    erhalten.push("Keine Ver\u00E4nderung im Teamgef\u00FCge");
    erhalten.push("Vertraute Abl\u00E4ufe bleiben bestehen");
    erhalten.push("Kein zus\u00E4tzlicher Einarbeitungsaufwand");
  } else {
    erhalten.push("Mehr Ruhe im Team");
    erhalten.push("Weniger direkte Reibung");
    erhalten.push("Vertraute Abl\u00E4ufe bleiben bestehen");
  }

  if (isLeader) {
    ungeloest.push("Fehlende F\u00FChrungsklarheit bleibt bestehen");
    ungeloest.push("Langsame oder unklare Entscheidungen \u00E4ndern sich nicht");
    ungeloest.push("Bestehende Entwicklungsdefizite im Team bleiben");
    ungeloest.push("Unklare Zust\u00E4ndigkeiten l\u00F6sen sich nicht von selbst");
  } else {
    if (!sameDom) {
      ungeloest.push(`L\u00FCcke im Bereich ${COMP_SHORT[personPrim]} bleibt offen`);
    }
    ungeloest.push("Fehlende Impulse bleiben aus");
    ungeloest.push("Bekannte Schw\u00E4chen im Alltag bleiben bestehen");
    ungeloest.push("Keine echte Ver\u00E4nderung oder Weiterentwicklung");
  }

  return {
    ohneErhalten: erhalten,
    ohneUngeloest: ungeloest,
    ohneKernaussage: isLeader
      ? "Die Frage ist nicht nur, ob diese F\u00FChrungskraft ideal passt. Genauso wichtig ist, was es f\u00FCr das Team bedeutet, wenn die F\u00FChrungsrolle unbesetzt oder unver\u00E4ndert bleibt."
      : "Die Frage ist nicht nur, ob diese Person ideal passt. Genauso wichtig ist, was es f\u00FCr Team und Abteilung bedeutet, wenn nichts ver\u00E4ndert wird.",
  };
}

function buildAlltag(isLeader: boolean, bew: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Zusammenarbeit", text: isLeader
      ? `Im F\u00FChrungsalltag d\u00FCrfte die Zusammenarbeit von Beginn an gut funktionieren. Die F\u00FChrungskraft setzt \u00E4hnliche Schwerpunkte wie das Team, was Abstimmungen erleichtert und die F\u00FChrung schnell akzeptiert werden l\u00E4sst.`
      : `Im Alltag d\u00FCrfte die Zusammenarbeit von Beginn an gut funktionieren. Person und Team setzen \u00E4hnliche Schwerpunkte, was Abstimmungen erleichtert und das Miteinander schnell eingespielt wirken l\u00E4sst.` });
    blocks.push({ title: "Kommunikation", text: isLeader
      ? `Auch in der Kommunikation sind wenig Irritationen zu erwarten. Die F\u00FChrungskraft d\u00FCrfte den Ton des Teams schnell treffen. Kleinere Unterschiede in Stil oder Ausf\u00FChrlichkeit sind normal und d\u00FCrften sich rasch einspielen.`
      : `Auch in der Kommunikation sind wenig Irritationen zu erwarten. Beide Seiten d\u00FCrften sich schnell auf einen gemeinsamen Stil einstellen. Kleinere Unterschiede in Tonalit\u00E4t oder Ausf\u00FChrlichkeit sind normal und d\u00FCrften sich rasch einspielen.` });
    blocks.push({ title: "Tempo und Priorit\u00E4ten", text: isLeader
      ? `Tempo und Priorit\u00E4ten liegen voraussichtlich nah beieinander. Das macht den F\u00FChrungsalltag einfacher, weil Entscheidungen \u00E4hnlich vorbereitet und getragen werden.`
      : `Tempo und Priorit\u00E4ten liegen voraussichtlich nah beieinander. Das macht den Alltag einfacher, weil weniger Kl\u00E4rungsbedarf entsteht und Entscheidungen \u00E4hnlich vorbereitet werden.` });
    blocks.push({ title: "Verantwortung", text: isLeader
      ? `Auch bei guter Passung sollten F\u00FChrungsverantwortung, Entscheidungswege und Zust\u00E4ndigkeiten klar benannt werden. So wird verhindert, dass stille Annahmen irgendwann zu Missverst\u00E4ndnissen werden.`
      : `Zust\u00E4ndigkeiten sollten trotzdem klar benannt werden, auch wenn die Passung gut ist. So wird verhindert, dass stille Annahmen irgendwann zu Missverst\u00E4ndnissen werden.` });
  } else {
    blocks.push({ title: "Zusammenarbeit", text: isLeader
      ? `Im F\u00FChrungsalltag wird schnell sichtbar werden, dass die F\u00FChrungskraft andere Schwerpunkte setzt als das Team es gewohnt ist. W\u00E4hrend das Team st\u00E4rker \u00FCber ${COMP_SHORT[teamPrim]} arbeitet, f\u00FChrt die Person eher in Richtung ${COMP_SHORT[personPrim]}. Das braucht von Anfang an klare Kommunikation.`
      : `Im Alltag wird schnell sichtbar werden, dass Person und Team nicht automatisch dieselben Schwerpunkte setzen. W\u00E4hrend das Team st\u00E4rker \u00FCber ${COMP_SHORT[teamPrim]} arbeitet, geht die Person eher in Richtung ${COMP_SHORT[personPrim]}. Dadurch braucht Zusammenarbeit am Anfang mehr bewusste Kl\u00E4rung.` });
    blocks.push({ title: "Kommunikation", text: isLeader
      ? (personPrim === "impulsiv"
        ? `Die F\u00FChrungskraft kommuniziert voraussichtlich direkter und knapper als das Team es kennt. Das kann als kl\u00E4rend erlebt werden, aber auch als zu schnell oder zu wenig einbindend.`
        : personPrim === "intuitiv"
          ? `Die F\u00FChrungskraft setzt st\u00E4rker auf Austausch und Dialog. Das Team empfindet das m\u00F6glicherweise als bereichernd, teilweise aber auch als zus\u00E4tzlichen Aufwand in der Abstimmung.`
          : `Die F\u00FChrungskraft kommuniziert m\u00F6glicherweise sachlicher und strukturierter als das Team es gewohnt ist. Das kann als klar und verl\u00E4sslich wahrgenommen werden, aber auch als distanziert.`)
      : (personPrim === "impulsiv"
        ? `Auch in der Kommunikation k\u00F6nnen Unterschiede sp\u00FCrbar werden. Was die Person als klar und effizient erlebt, kann f\u00FCr das Team zu direkt oder zu knapp wirken. Umgekehrt kann der Person manches zu ausf\u00FChrlich oder zu langsam erscheinen.`
        : personPrim === "intuitiv"
          ? `In der Kommunikation setzt die Person st\u00E4rker auf Austausch und Dialog. Das Team empfindet das m\u00F6glicherweise als bereichernd, teilweise aber auch als zus\u00E4tzlichen Aufwand. Hier braucht es eine gemeinsame Ebene.`
          : `Die Person kommuniziert m\u00F6glicherweise sachlicher und strukturierter als das Team es gewohnt ist. Das kann als klar und verl\u00E4sslich wahrgenommen werden, aber auch als distanziert. Hier lohnt es sich, den Stil fr\u00FCh abzustimmen.`) });
    blocks.push({ title: "Tempo und Priorit\u00E4ten", text: isLeader
      ? `Die F\u00FChrungskraft wird voraussichtlich andere Priorit\u00E4ten setzen als das Team es kennt. Das kann das Team weiterbringen, braucht aber transparente Entscheidungswege, damit der Unterschied nicht als Willk\u00FCr erlebt wird.`
      : `Wahrscheinlich werden Themen unterschiedlich gewichtet. Die Person wird andere Schwerpunkte setzen als das Team. Daraus k\u00F6nnen Spannungen entstehen, wenn Priorit\u00E4ten nicht gemeinsam gekl\u00E4rt und Entscheidungen nicht transparent vorbereitet werden.` });
    blocks.push({ title: "Verantwortung", text: isLeader
      ? `Besonders wichtig ist Klarheit bei Entscheidungswegen und F\u00FChrungsverantwortung. Wenn nicht eindeutig ist, welche Entscheidungen die F\u00FChrungskraft allein trifft und wo Abstimmung n\u00F6tig ist, w\u00E4chst die Unsicherheit im Team schnell.`
      : `Besonders wichtig ist Klarheit bei Zust\u00E4ndigkeiten. Wenn nicht eindeutig ist, wer entscheidet, wer abstimmt und wo Eigenst\u00E4ndigkeit gew\u00FCnscht ist, w\u00E4chst die Unsicherheit schnell. Das ist gerade in der Anfangsphase einer der h\u00E4ufigsten Ausl\u00F6ser f\u00FCr unn\u00F6tige Reibung.` });
  }

  const warnzeichen: string[] = [];
  const positivzeichen: string[] = [];
  if (bew !== "Gut passend") {
    if (isLeader) {
      warnzeichen.push("Die F\u00FChrung wird vom Team nicht als hilfreich erlebt");
      warnzeichen.push("Entscheidungen der F\u00FChrungskraft werden umgangen oder verz\u00F6gert");
      warnzeichen.push("Spannungen werden nicht offen angesprochen");
      warnzeichen.push("Verantwortung bleibt trotz Kl\u00E4rungsversuchen unklar");
      positivzeichen.push("Das Team akzeptiert die F\u00FChrung aktiv");
      positivzeichen.push("Entscheidungen werden getragen statt hinterfragt");
      positivzeichen.push("Rollen werden klarer statt unklarer");
      positivzeichen.push("Die F\u00FChrungskraft wird in Abstimmungen einbezogen und ernst genommen");
    } else {
      warnzeichen.push("Missverst\u00E4ndnisse wiederholen sich");
      warnzeichen.push("Abstimmungen stocken regelm\u00E4ssig");
      warnzeichen.push("Spannungen werden nicht offen angesprochen");
      warnzeichen.push("Verantwortung bleibt trotz Kl\u00E4rungsversuchen unklar");
      positivzeichen.push("Die Person wird aktiv in Abstimmungen einbezogen");
      positivzeichen.push("Missverst\u00E4ndnisse nehmen ab statt zu");
      positivzeichen.push("Rollen werden klarer statt unklarer");
      positivzeichen.push("Zusammenarbeit wird leichter statt anstrengender");
    }
  }

  const alltagEinleitung = bew === "Gut passend"
    ? (isLeader
      ? `Hier zeigt sich, wie die F\u00FChrungskraft und das Team im Arbeitsalltag zusammenwirken. Bei guter Passung ist der \u00DCbergang in der Regel unkompliziert.`
      : `Hier zeigt sich, wie Person und Team im Arbeitsalltag zusammenwirken. Bei guter Passung ist der \u00DCbergang in der Regel unkompliziert.`)
    : (isLeader
      ? `Hier wird sichtbar, wo die F\u00FChrung im Alltag gut ankommt und wo es mehr Aufmerksamkeit braucht. Gerade die ersten Wochen sind entscheidend.`
      : `Hier wird sichtbar, wo Zusammenarbeit leicht l\u00E4uft und wo es im Alltag mehr Aufmerksamkeit braucht. Gerade die ersten Wochen sind entscheidend.`);

  return {
    alltagEinleitung,
    alltagBlocks: blocks,
    alltagWarnzeichen: warnzeichen,
    alltagPositivzeichen: positivzeichen,
    alltagKernaussage: bew === "Gut passend"
      ? (isLeader
        ? `Im F\u00FChrungsalltag sollte die Zusammenarbeit reibungsarm laufen. Kleinere Unterschiede spielen sich schnell ein.`
        : `Im Alltag sollte die Zusammenarbeit reibungsarm laufen. Kleinere Unterschiede spielen sich schnell ein.`)
      : `Werden diese Signale fr\u00FCh erkannt, l\u00E4sst sich gut gegensteuern. Werden sie \u00FCbersehen, verfestigen sie sich meist.`
  };
}

function buildLeistung(bew: string, isLeader: boolean, hasGoal: boolean) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Am Anfang", text: isLeader
      ? `Die F\u00FChrungskraft kann sich voraussichtlich rasch in die Rolle einfinden und das Team produktiv f\u00FChren. Da F\u00FChrungsstil und Team\u00E4hnlich ausgerichtet sind, entsteht wenig unn\u00F6tiger Kl\u00E4rungsbedarf. Die ersten Wochen d\u00FCrften vergleichsweise reibungslos verlaufen.`
      : `Die Person kann sich voraussichtlich rasch einarbeiten und produktiv beitragen. Da Person und Team \u00E4hnlich arbeiten, entsteht wenig unn\u00F6tiger Kl\u00E4rungsbedarf. Die ersten Wochen d\u00FCrften vergleichsweise reibungslos verlaufen.` });
    blocks.push({ title: "Sp\u00E4ter", text: isLeader
      ? `Mittelfristig stabilisiert die F\u00FChrungskraft das Team und tr\u00E4gt verl\u00E4sslich zu guten Ergebnissen bei. Entscheidungen werden getragen und das Team arbeitet unter klarer F\u00FChrung stabil.`
      : `Mittelfristig stabilisiert die Person das bestehende Umfeld und tr\u00E4gt verl\u00E4sslich zu guten Ergebnissen bei. Qualit\u00E4t und Tempo bleiben auf einem gleichm\u00E4ssig hohen Niveau.` });
    blocks.push({ title: "Worauf es ankommt", text: isLeader
      ? `Auch bei guter Passung sollten Erwartungen an die F\u00FChrungsrolle und R\u00FCckmeldungen regelm\u00E4ssig stattfinden. Das sichert ab, dass die gute Ausgangslage auch langfristig genutzt wird.`
      : `Auch bei guter Passung sollten Erwartungen und R\u00FCckmeldungen regelm\u00E4ssig stattfinden. Das sichert ab, dass die gute Ausgangslage auch langfristig genutzt wird und sich keine stillen Missverst\u00E4ndnisse einschleichen.` });
  } else {
    blocks.push({ title: "Am Anfang", text: isLeader
      ? `Kurzfristig ist mit mehr Kl\u00E4rung und Abstimmung zu rechnen. Die ersten Wochen sind st\u00E4rker davon gepr\u00E4gt, ob die F\u00FChrung im Team ankommt, als von sofortiger Produktivit\u00E4t. Das sollte bewusst eingeplant werden.`
      : `Kurzfristig ist mit mehr Kl\u00E4rung und Abstimmung zu rechnen. Die ersten Wochen sind st\u00E4rker von Beobachtung und gegenseitigem Einordnen gepr\u00E4gt als von reibungsloser Leistung. Das ist bei sp\u00FCrbaren Unterschieden nicht ungew\u00F6hnlich, sollte aber bewusst eingeplant werden.` });
    blocks.push({ title: "Sp\u00E4ter", text: isLeader
      ? `Wenn die F\u00FChrungsrolle klar ist und Entscheidungswege sauber benannt werden, kann aus der Besetzung eine produktive und stabile F\u00FChrungssituation werden. Die F\u00FChrungskraft bringt dann etwas ein, das dem Team bisher gefehlt hat. Bleibt die Rollenklarheit dagegen aus, fliesst Energie nicht in gute Ergebnisse, sondern in Unsicherheit und Widerstand.`
      : `Wenn Erwartungen klar sind, Rollen sauber benannt werden und R\u00FCckmeldungen fr\u00FCh stattfinden, kann aus der Besetzung eine produktive Erg\u00E4nzung werden. Die Person bringt dann etwas ein, das dem Umfeld bisher gefehlt hat. Bleiben Zusammenarbeit und Verantwortung dagegen unklar, fliesst Energie nicht in gute Ergebnisse, sondern in Missverst\u00E4ndnisse und unn\u00F6tige Abstimmung.` });
    blocks.push({ title: isLeader ? "F\u00FChrungswirkung vs. Teamakzeptanz" : "Fachliche Leistung vs. Teamintegration", text: isLeader
      ? `Die Herausforderung liegt hier voraussichtlich weniger in der fachlichen Kompetenz der F\u00FChrungskraft als darin, ob ihre F\u00FChrung im Team wirklich akzeptiert wird. Gute F\u00FChrungsarbeit reicht allein nicht aus, wenn das Team die Leitung nicht als hilfreich erlebt.`
      : `Die Herausforderung liegt hier voraussichtlich weniger in der Leistungsf\u00E4higkeit der Person als darin, ob sie im Team wirklich gut ankommt. Fachlich gute Arbeit reicht allein nicht aus, wenn die Zusammenarbeit nicht funktioniert.` });
  }

  const leistungEinleitung = bew === "Gut passend"
    ? (isLeader
      ? `Was bedeutet diese Besetzung konkret f\u00FCr die F\u00FChrung und die Ergebnisse des Teams?`
      : `Was bedeutet diese Besetzung konkret f\u00FCr Ergebnisse und Produktivit\u00E4t?`)
    : (isLeader
      ? `Die entscheidende Frage ist nicht nur, ob die F\u00FChrungskraft fachlich gut arbeiten kann, sondern ob ihre F\u00FChrung im bestehenden Team auch wirklich ankommt.`
      : `Die entscheidende Frage ist nicht nur, ob die Person fachlich gut arbeiten kann, sondern ob ihre Leistung im bestehenden Umfeld auch wirklich zur Geltung kommt.`);

  return {
    leistungEinleitung,
    leistungBlocks: blocks,
    leistungKernaussage: bew === "Gut passend"
      ? (isLeader
        ? `F\u00FChrung und Ergebnisse d\u00FCrften sich schnell und stabil einstellen.`
        : `Leistung und Ergebnisse d\u00FCrften sich schnell und stabil einstellen.`)
      : (isLeader
        ? `Ob aus der Besetzung eine St\u00E4rke oder ein Problem wird, h\u00E4ngt vor allem davon ab, ob die F\u00FChrung im Team ankommt.`
        : `Ob aus der Besetzung eine St\u00E4rke oder ein Problem wird, h\u00E4ngt vor allem von der Begleitung in den ersten Wochen ab.`)
  };
}

function buildDruck(bew: string, isLeader: boolean, personPrim: ComponentKey) {
  const blocks: V4Block[] = [
    { title: "Was unter Druck typischerweise passiert", text: isLeader
      ? `Unter Druck zeigt sich der nat\u00FCrliche F\u00FChrungsstil einer Person meist deutlicher als im Normalbetrieb. Die F\u00FChrungskraft greift st\u00E4rker auf ihre gewohnte Art zur\u00FCck und zeigt ihre St\u00E4rken, aber auch ihre Grenzen deutlicher.`
      : `Unter Druck zeigt sich die nat\u00FCrliche Arbeitsweise eines Menschen meist deutlicher als im Normalbetrieb. Was sonst noch ausgeglichen oder angepasst wird, tritt dann klarer hervor. Die Person greift st\u00E4rker auf ihre gewohnte Art zur\u00FCck und zeigt ihre St\u00E4rken, aber auch ihre Grenzen deutlicher.` },
    { title: "Was das f\u00FCr das Umfeld bedeutet", text: bew === "Gut passend"
      ? (isLeader
        ? `Da F\u00FChrungskraft und Team \u00E4hnlich arbeiten, ist das Risiko unter Druck gering. Die F\u00FChrung d\u00FCrfte auch in intensiven Phasen stabil bleiben und das Team st\u00FCtzen k\u00F6nnen.`
        : `Da Person und Team \u00E4hnlich arbeiten, ist das Risiko unter Druck gering. Die Zusammenarbeit d\u00FCrfte auch in intensiven Phasen stabil bleiben, weil beide Seiten \u00E4hnlich reagieren und sich gegenseitig st\u00FCtzen k\u00F6nnen.`)
      : (isLeader
        ? `Unter Druck werden Unterschiede im F\u00FChrungsstil meist nicht kleiner, sondern gr\u00F6sser. ${personPrim === "impulsiv" ? "Die F\u00FChrungskraft wird voraussichtlich noch direkter und schneller entscheiden, was das Team als \u00FCbergehend erleben kann." : personPrim === "intuitiv" ? "Die F\u00FChrungskraft wird voraussichtlich noch st\u00E4rker auf Austausch und Abstimmung setzen, was das Team als verz\u00F6gernd erleben kann." : "Die F\u00FChrungskraft wird voraussichtlich noch genauer und kontrollierter arbeiten, was das Team als bremsend erleben kann."}`
        : `Unter Druck werden Unterschiede meist nicht kleiner, sondern gr\u00F6sser. ${personPrim === "impulsiv" ? "Die Person wird voraussichtlich noch schneller und direkter handeln, was zu Irritationen f\u00FChren kann." : personPrim === "intuitiv" ? "Die Person wird voraussichtlich noch st\u00E4rker auf Austausch setzen, was als Verz\u00F6gerung erlebt werden kann." : "Die Person wird voraussichtlich noch genauer und vorsichtiger vorgehen, was als Bremsen erlebt werden kann."}`) },
    { title: "Was dann besonders wichtig ist", text: isLeader
      ? `Klare Entscheidungswege, kurze Kommunikationswege und eindeutige F\u00FChrungsverantwortung. In belasteten Phasen muss das Team wissen, wer entscheidet und wie informiert wird.`
      : `Klare Absprachen, kurze Wege und eindeutige Verantwortung. Gerade in belasteten Phasen braucht es Klarheit statt zus\u00E4tzlicher Abstimmung. Wer in solchen Momenten weiss, wer entscheidet und wer informiert werden muss, reduziert unn\u00F6tige Reibung erheblich.` },
  ];

  return {
    druckBlocks: blocks,
    druckKernaussage: bew === "Gut passend"
      ? (isLeader
        ? `Auch unter Druck d\u00FCrfte die F\u00FChrung stabil bleiben und das Team st\u00FCtzen.`
        : `Auch unter Druck d\u00FCrfte die Zusammenarbeit stabil bleiben.`)
      : (isLeader
        ? `Unter Druck werden Unterschiede im F\u00FChrungsstil sichtbarer. Klare Entscheidungswege sind dann besonders wichtig.`
        : `Unter Druck werden Unterschiede sichtbarer. Klare Absprachen sind dann besonders wichtig.`)
  };
}

function buildEmpfehlungen(isLeader: boolean, bew: string): V4Block[] {
  const items: V4Block[] = [];

  if (isLeader) {
    items.push({ title: "F\u00FChrungsrolle und Erwartungen fr\u00FCh kl\u00E4ren", text: bew === "Gut passend"
      ? "Von Anfang an sollte klar sein, welche Erwartungen an die F\u00FChrung bestehen, woran Erfolg gemessen wird und welche Entscheidungsfreiheit die F\u00FChrungskraft hat. Auch bei guter Passung verhindert das stille Missverst\u00E4ndnisse."
      : "Von Anfang an muss klar sein, welche Erwartungen an die F\u00FChrung bestehen, woran Erfolg gemessen wird und welche Entscheidungsfreiheit die F\u00FChrungskraft hat. Unklare Rollen sind einer der h\u00E4ufigsten Gr\u00FCnde f\u00FCr sp\u00E4tere Spannungen." });
  } else {
    items.push({ title: "Rolle und Erwartungen fr\u00FCh kl\u00E4ren", text: bew === "Gut passend"
      ? "Von Anfang an sollte klar sein, was genau von der Person erwartet wird und welche Verantwortung bei ihr liegt. Auch bei guter Passung verhindert das stille Missverst\u00E4ndnisse."
      : "Von Anfang an muss klar sein, was genau von der Person erwartet wird, woran Erfolg gemessen wird und welche Verantwortung tats\u00E4chlich bei ihr liegt. Unklare Rollen sind einer der h\u00E4ufigsten Gr\u00FCnde f\u00FCr sp\u00E4tere Spannungen." });
  }

  items.push({ title: "Zusammenarbeit nicht dem Zufall \u00FCberlassen", text: isLeader
    ? (bew === "Gut passend"
      ? "Gerade in den ersten Wochen sollte besprochen werden, wie F\u00FChrung, Kommunikation und Entscheidungswege im Alltag aussehen sollen. Das schafft Klarheit f\u00FCr alle Beteiligten."
      : "Gerade in den ersten Wochen muss bewusst besprochen werden, wie F\u00FChrung, Kommunikation und Entscheidungswege im Alltag aussehen sollen. Was nicht offen gekl\u00E4rt wird, wird meist still interpretiert und f\u00FChrt zu Widerstand.")
    : (bew === "Gut passend"
      ? "Gerade in den ersten Wochen sollte besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen. Das schafft Klarheit und beugt Missverst\u00E4ndnissen vor."
      : "Gerade in den ersten Wochen muss bewusst besprochen werden, wie Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen sollen. Was nicht offen besprochen wird, wird meist still interpretiert.") });

  items.push({ title: "Fr\u00FCh R\u00FCckmeldung geben", text: isLeader
    ? (bew === "Gut passend"
      ? "Die Wirkung einer F\u00FChrungskraft zeigt sich oft fr\u00FCher als ihre Ergebnisse. Fr\u00FChe, offene R\u00FCckmeldungen helfen, den guten Start abzusichern."
      : "Die Wirkung einer F\u00FChrungskraft zeigt sich oft fr\u00FCher als ihre Ergebnisse. Fr\u00FChe, offene R\u00FCckmeldungen sind besonders wichtig, damit Spannungen nicht fest werden.")
    : (bew === "Gut passend"
      ? "Die Wirkung einer Person zeigt sich oft fr\u00FCher als ihre Ergebnisse. Fr\u00FChe R\u00FCckmeldungen helfen, den guten Start abzusichern."
      : "Die Wirkung einer Person zeigt sich oft fr\u00FCher als ihre Ergebnisse. Fr\u00FChe, offene R\u00FCckmeldungen sind besonders wichtig. Nicht erst warten, bis Spannungen fest sitzen.") });

  items.push({ title: "Nach den ersten Wochen bewusst pr\u00FCfen", text: bew === "Gut passend"
    ? "Nach 30 bis 60 Tagen sollte kurz geschaut werden: L\u00E4uft alles wie erwartet? Gibt es stille Irritationen? Eine kurze Reflexion sichert die gute Ausgangslage ab."
    : "Nach 30 bis 60 Tagen sollte gezielt geschaut werden: Was l\u00E4uft gut? Wo gibt es Reibung? Was muss angepasst werden? Diese Reflexion verhindert, dass aus einem schwierigen Start ein dauerhaftes Problem wird." });

  if (isLeader) {
    items.push({ title: "Auf Vertrauen und Akzeptanz achten", text: bew === "Gut passend"
      ? "Auch bei guter Passung lohnt es sich, fr\u00FCh darauf zu achten, ob die F\u00FChrung im Team wirklich ankommt und ob Vertrauen entsteht."
      : "Bei einer F\u00FChrungsrolle reicht es nicht, nur auf Ziele und Aufgaben zu schauen. Ebenso wichtig ist die Frage, ob die F\u00FChrung im Team wirklich ankommt, ob Vertrauen entsteht und ob die Person in der Rolle ankommen kann." });
  } else {
    items.push({ title: "Anschluss ans Team aktiv begleiten", text: bew === "Gut passend"
      ? "Auch bei guter Passung sollte darauf geachtet werden, dass die Person nicht nur Aufgaben bekommt, sondern auch Zugang zum Team findet."
      : "Gerade bei einem neuen Teammitglied sollte darauf geachtet werden, dass die Person nicht nur Aufgaben bekommt, sondern auch Zugang zum Team findet. Teamregeln und Schnittstellen sollten offen benannt werden." });
  }

  items.push({ title: "Verantwortung klar benennen", text: "Diese Begleitung sollte nicht dem Zufall \u00FCberlassen werden, sondern klar durch die direkte F\u00FChrungskraft verantwortet sein. Sie sollte die Integration in den ersten Wochen aktiv steuern und sichtbar \u00FCbernehmen." });

  return items;
}
