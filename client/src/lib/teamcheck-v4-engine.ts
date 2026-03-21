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

  warumBlocks: V4Block[];
  warumKernaussage: string;

  wirkungTitle: string;
  wirkungBlocks: V4Block[];
  wirkungKernaussage: string;

  chancenPunkte: string[];
  risikenPunkte: string[];
  chancenEinleitung: string;
  risikenEinleitung: string;

  ohneErhalten: string[];
  ohneUngeloest: string[];
  ohneKernaussage: string;

  alltagBlocks: V4Block[];
  alltagWarnzeichen: string[];
  alltagKernaussage: string;

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
    teamProfile: v3.teamProfile,
    personProfile: v3.personProfile,
    teamLabel: v3.teamLabel,
    personLabel: v3.personLabel,
    teamPersonAbweichung: v3.teamPersonAbweichung,
    teamGoalAbweichung: v3.teamGoalAbweichung,
    personGoalAbweichung: v3.personGoalAbweichung,
    ...buildWarum(v3, isLeader, gesamteinschaetzung, sameDominance, teamPrimary, personPrimary),
    ...buildWirkung(isLeader, gesamteinschaetzung, sameDominance, personPrimary),
    ...buildChancenRisiken(v3, isLeader, gesamteinschaetzung, sameDominance, personPrimary),
    ...buildOhne(isLeader, sameDominance, personPrimary),
    ...buildAlltag(isLeader, gesamteinschaetzung, sameDominance),
    ...buildLeistung(gesamteinschaetzung),
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
      ? "Die ersten Wochen sollten genutzt werden, um Rolle, Erwartungen und Zusammenarbeit sauber zu klären."
      : "Auch bei guter Passung lohnt es sich, Erwartungen und Zuständigkeiten in den ersten Wochen offen zu besprechen.";
  }
  if (bew === "Teilweise passend") {
    return "Die ersten Wochen sollten bewusst begleitet werden. Rolle, Erwartungen und Entscheidungswege müssen von Anfang an klar benannt werden.";
  }
  return "Die ersten Wochen brauchen enge Begleitung. Rolle, Erwartungen und Kommunikation müssen sofort offen geregelt werden.";
}

function buildWarum(v3: TeamCheckV3Result, isLeader: boolean, bew: string, sameDom: boolean, teamPrim: ComponentKey, personPrim: ComponentKey) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Was gut zusammenpasst", text: "Person und Team setzen im Alltag ähnliche Schwerpunkte. Beide legen Wert auf einen vergleichbaren Arbeitsstil, was den Einstieg erleichtert und die Zusammenarbeit schnell tragfähig macht." });
    blocks.push({ title: "Wo kleine Unterschiede liegen", text: "Auch bei guter Passung gibt es Nuancen im Stil. Diese sind aber im normalen Bereich und dürften sich schnell einspielen." });
  } else {
    blocks.push({ title: "Was gut zusammenpasst", text: sameDom
      ? "Person und Team teilen eine ähnliche Grundausrichtung. Das bildet eine solide Basis, auch wenn es in einzelnen Bereichen Abweichungen gibt."
      : `Trotz unterschiedlicher Schwerpunkte bringt die Person Qualitäten mit, die das Team ergänzen können. Gerade im Bereich ${COMP_SHORT[personPrim]} kann sie einen Beitrag leisten.` });
    blocks.push({ title: "Wo der grösste Unterschied liegt", text: `Das Team legt mehr Wert auf ${COMP_SHORT[teamPrim]}. Die Person setzt stärker auf ${COMP_SHORT[personPrim]}. Das wird im Alltag spürbar sein.` });
  }

  if (v3.teamGoal) {
    let goalText = "Entscheidend ist nicht nur, ob Unterschiede vorhanden sind, sondern ob sie zu den Anforderungen des Bereichs passen.";
    if (v3.strategicFit === "passend") {
      goalText += " Die Person bringt genau die Stärken mit, die die Abteilung besonders braucht. Das ist ein klarer Pluspunkt.";
    } else if (v3.strategicFit === "teilweise") {
      goalText += " Die Person bringt einen Teil dessen mit, was die Abteilung braucht. Dieser Bereich gehört aber nicht zu ihren stärksten Seiten.";
    } else if (v3.strategicFit === "abweichend") {
      goalText += " Die stärkste Seite der Person liegt nicht in dem Bereich, den die Abteilung am meisten braucht. Das verstärkt die Abweichung.";
    }
    blocks.push({ title: "Was das Ziel der Abteilung bedeutet", text: goalText });
  } else {
    blocks.push({ title: "Warum das wichtig ist", text: "Je klarer Erwartungen, Rolle und Zusammenarbeit von Anfang an geregelt sind, desto eher kann aus dem Unterschied eine Stärke werden." });
  }

  let kern: string;
  if (bew === "Gut passend") {
    kern = "Person und Team passen in ihrer Arbeitsweise gut zusammen. Das ist eine gute Ausgangslage.";
  } else if (bew === "Teilweise passend") {
    kern = v3.teamGoal && v3.strategicFit === "passend"
      ? "Die Person passt gut zum Ziel der Abteilung, aber nicht automatisch zur gewohnten Teamkultur."
      : "Die Person bringt Stärken mit, arbeitet aber in wichtigen Punkten anders als das Team.";
  } else {
    kern = "Der Unterschied zwischen Person und Team ist deutlich. Ohne klare Führung und Begleitung wird das im Alltag schwierig.";
  }

  return { warumBlocks: blocks, warumKernaussage: kern };
}

function buildWirkung(isLeader: boolean, bew: string, sameDom: boolean, personPrim: ComponentKey) {
  const blocks: V4Block[] = [];

  if (isLeader) {
    if (bew === "Gut passend") {
      blocks.push({ title: "Was die Person positiv einbringen kann", text: "Die Führungskraft arbeitet ähnlich wie das Team. Ihre Art wird im Umfeld schnell akzeptiert, was Vertrauen schafft und den Einstieg erleichtert." });
      blocks.push({ title: "Was das Team daran erleben wird", text: "Das Team dürfte die neue Führung als passend und vertraut empfinden. Grössere Umstellungen sind nicht zu erwarten." });
      blocks.push({ title: "Worauf es in den ersten Wochen ankommt", text: "Auch bei guter Passung müssen Erwartungen, Zuständigkeiten und Entscheidungswege früh geklärt werden. Das sichert den guten Start ab." });
      blocks.push({ title: "Wann daraus Stabilität entsteht", text: "Wenn die ersten Wochen sauber begleitet werden, kann sich die Führung schnell etablieren und das Team stabil weiterarbeiten." });
    } else {
      blocks.push({ title: "Was die Person positiv einbringen kann", text: "Eine neue Führungskraft kann Klarheit schaffen, Entscheidungen beschleunigen und dem Team neue Richtung geben. Gerade wenn bisher etwas gefehlt hat, kann eine andere Führungsart wertvoll sein." });
      blocks.push({ title: "Was das Team daran als schwierig erleben könnte", text: "Wenn das Team eine andere Art der Führung gewohnt ist, wird der Unterschied schnell spürbar. Manche erleben das als klärend, andere als zu direkt oder zu wenig einbindend." });
      blocks.push({ title: "Worauf es in den ersten Wochen ankommt", text: "Die Führungskraft braucht nicht nur Aufgaben und Ziele, sondern einen sauberen Einstieg ins Team. Erwartungen, Zuständigkeiten und Kommunikation müssen früh geklärt werden." });
      blocks.push({ title: "Wann daraus Stabilität entstehen kann", text: "Je klarer die ersten Wochen gestaltet werden, desto grösser ist die Chance, dass aus anfänglicher Unsicherheit mit der Zeit Vertrauen und Stabilität werden." });
    }
    return {
      wirkungTitle: "So würde die Person als Führungskraft wirken",
      wirkungBlocks: blocks,
      wirkungKernaussage: bew === "Gut passend"
        ? "Die Führungsart passt zum Team. Der Einstieg dürfte reibungsarm verlaufen."
        : "Die Person würde anders führen, als das Team es kennt. Das kann Chance und Risiko gleichzeitig sein."
    };
  }

  if (bew === "Gut passend") {
    blocks.push({ title: "Was die Person positiv einbringen kann", text: "Person und Team arbeiten ähnlich. Die Person versteht die Erwartungen schnell und kann sich rasch einbringen." });
    blocks.push({ title: "Was das Team daran erleben wird", text: "Der Einstieg dürfte reibungsarm verlaufen. Grössere Umstellungen oder Irritationen sind nicht zu erwarten." });
    blocks.push({ title: "Worauf es in den ersten Wochen ankommt", text: "Auch bei guter Passung lohnt es sich, Zuständigkeiten und Zusammenarbeit offen zu besprechen. Das verhindert stille Missverständnisse." });
    blocks.push({ title: "Wann daraus echte Stärke wird", text: "Wenn die Person gut aufgenommen wird und früh Verantwortung übernehmen kann, wird aus der guten Passung schnell eine produktive Zusammenarbeit." });
  } else {
    blocks.push({ title: "Was die Person positiv einbringen kann", text: `Die Person kann neue Impulse bringen, andere Blickwinkel einbringen oder Lücken schliessen, die bisher nicht bewusst wahrgenommen wurden. Besonders im Bereich ${COMP_SHORT[personPrim]} kann sie das Team ergänzen.` });
    blocks.push({ title: "Was für andere spürbar werden könnte", text: personPrim === "impulsiv"
      ? "Die Person entscheidet schneller und handelt direkter als das Team es gewohnt ist. Das kann als erfrischend, aber auch als zu forsch wahrgenommen werden."
      : personPrim === "intuitiv"
        ? "Die Person setzt stärker auf Austausch und Abstimmung. Das kann als bereichernd, aber auch als zu aufwändig empfunden werden."
        : "Die Person geht strukturierter und genauer vor. Das kann als hilfreich, aber auch als zu langsam wahrgenommen werden." });
    blocks.push({ title: "Wo es schwierig werden könnte", text: "Dort, wo das Team einen anderen Stil gewohnt ist, entstehen leicht kleine Irritationen: unterschiedliche Erwartungen, unausgesprochene Unzufriedenheit oder das Gefühl, nicht richtig zueinander zu finden." });
    blocks.push({ title: "Was es braucht, damit es funktioniert", text: "Wenn früh geklärt wird, wie Zusammenarbeit und Verantwortung aussehen sollen, kann aus dem Unterschied eine echte Ergänzung werden. Bleibt das offen, entsteht unnötige Reibung." });
  }

  return {
    wirkungTitle: "So würde die Person im Team wirken",
    wirkungBlocks: blocks,
    wirkungKernaussage: bew === "Gut passend"
      ? "Die Person passt gut ins Team und wird sich schnell einfinden."
      : "Die Person bringt andere Stärken mit als das Team. Das kann bereichern, braucht aber Begleitung."
  };
}

function buildChancenRisiken(v3: TeamCheckV3Result, isLeader: boolean, bew: string, sameDom: boolean, personPrim: ComponentKey) {
  let chancenEinleitung: string;
  const chancenPunkte: string[] = [];

  if (sameDom) {
    chancenEinleitung = "Die Person verstärkt, was das Team bereits gut kann. Das bringt Verlässlichkeit und Stabilität.";
    chancenPunkte.push("Schneller Anschluss durch ähnliche Arbeitsweise");
    chancenPunkte.push("Stärkung der bestehenden Teamstärken");
    chancenPunkte.push("Weniger Einarbeitungsaufwand");
  } else {
    chancenEinleitung = `Die Person kann etwas einbringen, das dem Team bisher gefehlt hat: mehr ${COMP_SHORT[personPrim]}.`;
    chancenPunkte.push("Neue Impulse und andere Blickwinkel");
    chancenPunkte.push(`Ergänzung durch ${COMP_SHORT[personPrim]}`);
    chancenPunkte.push("Blinde Flecken können sichtbar werden");
  }
  if (v3.strategicFit === "passend") {
    chancenPunkte.push("Stärken passen zum Ziel der Abteilung");
  }

  let risikenEinleitung: string;
  const risikenPunkte: string[] = [];

  if (bew === "Kritisch") {
    risikenEinleitung = "Der Unterschied ist deutlich. Ohne gute Begleitung entstehen schnell Missverständnisse und Frust.";
    risikenPunkte.push("Wiederkehrende Missverständnisse wahrscheinlich");
    risikenPunkte.push("Frust und sinkendes Vertrauen möglich");
    risikenPunkte.push("Spannungen können sich schnell verfestigen");
  } else if (bew === "Teilweise passend") {
    risikenEinleitung = "Der Unterschied ist spürbar. Wenn er nicht aufgefangen wird, entstehen unnötige Reibung und Abstimmungsprobleme.";
    risikenPunkte.push("Mehr Abstimmung in den ersten Monaten nötig");
    risikenPunkte.push("Unterschiedliche Erwartungen können frustrieren");
    risikenPunkte.push("Rollen müssen aktiv geklärt werden");
  } else {
    risikenEinleitung = "Bei guter Passung sind die Risiken gering. Trotzdem sollten Erwartungen früh besprochen werden.";
    risikenPunkte.push("Zu viel Gleichförmigkeit kann Innovation bremsen");
    risikenPunkte.push("Blinde Flecken werden nicht automatisch sichtbar");
  }

  if (isLeader) {
    risikenPunkte.push("Führung kommt möglicherweise nicht im Team an");
  } else {
    risikenPunkte.push("Person findet möglicherweise schwer Anschluss");
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
    ohneKernaussage: "Die Frage ist nicht nur, ob diese Person ideal passt. Genauso wichtig ist, was es kostet, wenn nichts verändert wird.",
  };
}

function buildAlltag(isLeader: boolean, bew: string, sameDom: boolean) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Zusammenarbeit", text: "Dürfte von Beginn an gut funktionieren. Person und Team setzen ähnliche Schwerpunkte." });
    blocks.push({ title: "Kommunikation", text: "Wenig Reibung zu erwarten. Der Kommunikationsstil passt zum Team." });
    blocks.push({ title: "Tempo und Prioritäten", text: "Ähnliches Tempo und ähnliche Prioritäten erleichtern den Alltag." });
    blocks.push({ title: "Verantwortung", text: "Zuständigkeiten sollten trotzdem klar benannt werden, auch wenn die Passung gut ist." });
  } else {
    blocks.push({ title: "Zusammenarbeit", text: "Person und Team setzen nicht automatisch dieselben Schwerpunkte. Abstimmung wird anfangs mehr Zeit brauchen." });
    blocks.push({ title: "Kommunikation", text: "Erwartungen an Kommunikation können unterschiedlich sein. Was für die eine Seite reicht, kann der anderen zu wenig oder zu viel sein." });
    blocks.push({ title: "Tempo und Prioritäten", text: "Entscheidungen werden möglicherweise unterschiedlich vorbereitet, Prioritäten verschieden eingeschätzt." });
    blocks.push({ title: "Verantwortung", text: "Wenn nicht klar ist, wer entscheidet und wie viel Eigenständigkeit gewünscht ist, entsteht schnell Unsicherheit." });
  }

  const warnzeichen: string[] = [];
  if (bew !== "Gut passend") {
    warnzeichen.push("Missverständnisse wiederholen sich");
    warnzeichen.push("Abstimmungen stocken regelmässig");
    warnzeichen.push("Spannungen werden nicht offen angesprochen");
    warnzeichen.push("Verantwortung bleibt unklar");
  }

  return {
    alltagBlocks: blocks,
    alltagWarnzeichen: warnzeichen,
    alltagKernaussage: bew === "Gut passend"
      ? "Im Alltag sollte die Zusammenarbeit reibungsarm laufen. Kleinere Unterschiede spielen sich schnell ein."
      : "Werden Warnsignale früh erkannt, lässt sich gut gegensteuern. Werden sie übersehen, verfestigen sie sich meist."
  };
}

function buildLeistung(bew: string) {
  const blocks: V4Block[] = [];

  if (bew === "Gut passend") {
    blocks.push({ title: "Am Anfang", text: "Die Person kann sich rasch einarbeiten und produktiv beitragen. Es entsteht wenig unnötiger Klärungsbedarf." });
    blocks.push({ title: "Später", text: "Mittelfristig stabilisiert die Person das Umfeld und trägt verlässlich zu guten Ergebnissen bei." });
    blocks.push({ title: "Worauf es ankommt", text: "Auch bei guter Passung sollten Erwartungen und Rückmeldungen regelmässig stattfinden." });
  } else {
    blocks.push({ title: "Am Anfang", text: "Es ist mit mehr Klärung und Abstimmung zu rechnen. Die ersten Wochen sind stärker von gegenseitigem Einordnen geprägt als von reibungsloser Leistung. Das ist normal, sollte aber eingeplant werden." });
    blocks.push({ title: "Später", text: "Wenn Erwartungen klar sind und Rückmeldungen früh stattfinden, kann aus der Besetzung eine produktive Ergänzung werden. Bleibt das offen, leidet die Leistung." });
    blocks.push({ title: "Worauf es ankommt", text: "Nicht nur die Unterschiede entscheiden, sondern der Umgang damit. Energie muss in gute Ergebnisse fliessen, nicht in Absicherung und unnötige Abstimmung." });
  }

  return {
    leistungBlocks: blocks,
    leistungKernaussage: bew === "Gut passend"
      ? "Leistung und Ergebnisse dürften sich schnell einstellen."
      : "Ob aus der Besetzung eine Stärke oder ein Problem wird, hängt von der Begleitung ab."
  };
}

function buildDruck(bew: string) {
  const blocks: V4Block[] = [
    { title: "Was unter Druck typischerweise passiert", text: "Die Person greift noch stärker auf ihre gewohnte Arbeitsweise zurück. Was sonst noch ausgeglichen wird, tritt dann klarer hervor." },
    { title: "Was das für das Umfeld bedeutet", text: bew === "Gut passend"
      ? "Da Person und Team ähnlich arbeiten, ist das Risiko unter Druck gering. Die Zusammenarbeit dürfte auch in intensiven Phasen stabil bleiben."
      : "Unter Druck werden Unterschiede meist nicht kleiner, sondern grösser. Was im Alltag noch tragbar ist, kann in intensiven Phasen schneller zu Reibung führen." },
    { title: "Was dann besonders wichtig ist", text: "Klare Absprachen, kurze Wege und eindeutige Verantwortung. Gerade in belasteten Phasen braucht es Klarheit, nicht zusätzliche Abstimmung." },
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
    { title: "Rolle und Erwartungen früh klären", text: "Was wird erwartet, woran wird Erfolg gemessen und welche Verantwortung liegt tatsächlich bei der Person?" },
    { title: "Zusammenarbeit nicht dem Zufall überlassen", text: "Wie sollen Kommunikation, Abstimmung und Zusammenarbeit im Alltag aussehen? Was nicht besprochen wird, wird still interpretiert." },
    { title: "Früh Rückmeldung geben", text: "Die Wirkung einer Person zeigt sich oft früher als ihre Ergebnisse. Beobachtungen früh und klar ansprechen." },
    { title: "Nach den ersten Wochen bewusst prüfen", text: "Nach 30 bis 60 Tagen gezielt schauen: Was läuft gut? Wo gibt es Reibung? Was muss angepasst werden?" },
  ];

  if (isLeader) {
    items.push({ title: "Auf Vertrauen und Akzeptanz achten", text: "Kommt die Führung im Team an? Entsteht Vertrauen? Kann die Person in der Rolle ankommen?" });
  } else {
    items.push({ title: "Anschluss ans Team aktiv begleiten", text: "Nicht nur Aufgaben zuweisen, sondern auch den Zugang zum Team aktiv fördern. Teamregeln und Schnittstellen offen benennen." });
  }

  return items;
}
