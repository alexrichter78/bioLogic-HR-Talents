export type ComponentKey = "imp" | "int" | "ana";

export type Triad = {
  imp: number;
  int: number;
  ana: number;
};

export type VariantType =
  | "ALL_EQUAL"
  | "TOP_PAIR_imp_int"
  | "TOP_PAIR_imp_ana"
  | "TOP_PAIR_int_ana"
  | "BOTTOM_PAIR_imp_int"
  | "BOTTOM_PAIR_imp_ana"
  | "BOTTOM_PAIR_int_ana"
  | "ORDER_imp_int_ana"
  | "ORDER_imp_ana_int"
  | "ORDER_int_imp_ana"
  | "ORDER_int_ana_imp"
  | "ORDER_ana_imp_int"
  | "ORDER_ana_int_imp";

export type TextProfileClass =
  | "BAL_FULL"
  | "DUAL_TOP"
  | "CLEAR_TOP"
  | "ORDER";

export type SuccessFocusKey = "imp" | "int" | "ana" | null;

export type JobCheckTextInput = {
  jobTitle: string;
  tasks?: string[];
  triad: Triad;
  successFocus?: SuccessFocusKey;
  environment?: {
    taskCharacter?: string | null;
    workLogic?: string | null;
    leadershipType?: string | null;
  };
};

export type JobCheckReportTexts = {
  meta: {
    variant: VariantType;
    profileClass: TextProfileClass;
    top1: ComponentKey;
    top2: ComponentKey;
    top3: ComponentKey;
    gap1: number;
    gap2: number;
  };
  intro: string;
  shortDescription: string;
  structureProfile: string;
  componentMeaning: Array<{
    component: ComponentKey;
    title: string;
    text: string;
  }>;
  workLogic: string;
  framework: string;
  successFocus: string;
  behaviourDaily: string;
  behaviourPressure: string;
  behaviourStress: string;
  teamImpact: string;
  tensionFields: string[];
  miscastRisks: Array<{
    label: string;
    bullets: string[];
  }>;
  typicalPerson: string;
  finalDecision: string;
};

const EQ_TOL = 5;

const componentLabel: Record<ComponentKey, string> = {
  imp: "Impulsiv",
  int: "Intuitiv",
  ana: "Analytisch",
};

const componentDomain: Record<ComponentKey, string> = {
  imp: "Handlung und Umsetzung",
  int: "Kommunikation und Abstimmung",
  ana: "Struktur und Analyse",
};

const componentFocus: Record<ComponentKey, string> = {
  imp: "Umsetzungsstärke und Tempo",
  int: "Abstimmung und Einbindung",
  ana: "Sorgfalt und Verlässlichkeit",
};

const componentShort: Record<ComponentKey, string> = {
  imp: "Handlungsorientierung",
  int: "Kommunikationsfähigkeit",
  ana: "Strukturklarheit",
};

const componentEveryday: Record<ComponentKey, string> = {
  imp: "zügiges Handeln, klare Priorisierung und direkte Umsetzung",
  int: "Abstimmung, Beziehungsgestaltung und Gespür für Dynamiken",
  ana: "sorgfältige Prüfung, fachliche Absicherung und nachvollziehbare Abläufe",
};

const componentMainSentence: Record<ComponentKey, string> = {
  imp: "schnell priorisiert, Entscheidungen zügig trifft und Themen aktiv vorantreibt",
  int: "Zusammenarbeit aktiv gestaltet, Bedürfnisse erkennt und Kommunikation tragfähig hält",
  ana: "strukturiert prüft, Qualität absichert und Entscheidungen fachlich sauber vorbereitet",
};

const componentSupportSentence: Record<ComponentKey, string> = {
  imp: "bei Bedarf Tempo aufnimmt und in konkrete Umsetzung kommt",
  int: "sich mit anderen gut abstimmt und Wirkung auf Menschen mitdenkt",
  ana: "Abläufe sauber strukturiert und fachliche Nachvollziehbarkeit sicherstellt",
};

const componentLowRiskSentence: Record<ComponentKey, string> = {
  imp: "Entscheidungen zu lange vorbereitet und Umsetzungsdynamik gebremst werden",
  int: "Abstimmung an Qualität verliert und Zusammenarbeit unnötig belastet wird",
  ana: "Qualität, Sorgfalt und Stabilität zu wenig abgesichert werden",
};

const componentTopMeaning: Record<ComponentKey, string> = {
  imp: "gibt dieser Rolle ihre Richtung. Themen werden zügig aufgegriffen, klar priorisiert und in die Umsetzung gebracht.",
  int: "steht im Mittelpunkt dieser Rolle. Zusammenarbeit, Kommunikation und die Wirkung auf andere Menschen sind hier zentral.",
  ana: "trägt diese Rolle wesentlich. Fachliche Absicherung, saubere Abläufe und nachvollziehbare Entscheidungen stehen im Vordergrund.",
};

const componentMidMeaning: Record<ComponentKey, string> = {
  imp: "kommt unterstützend dazu. Sie sorgt dafür, dass Entscheidungen nicht zu lange offen bleiben und Themen in die Umsetzung kommen.",
  int: "kommt unterstützend dazu. Sie sorgt für Anschlussfähigkeit im Miteinander und hilft, Abstimmung verlässlich zu halten.",
  ana: "kommt unterstützend dazu. Sie bringt Struktur, Übersicht und fachliche Nachvollziehbarkeit in die Arbeit.",
};

const componentLowMeaning: Record<ComponentKey, string> = {
  imp: "ist in dieser Rolle relevant, aber nicht führend. Sie wird vor allem dann wichtig, wenn rasche Entscheidungen und direkte Umsetzung gefragt sind.",
  int: "ist in dieser Rolle relevant, aber nicht führend. Sie wird vor allem dann wichtig, wenn gute Abstimmung und Beziehungssicherheit nötig sind.",
  ana: "ist in dieser Rolle relevant, aber nicht führend. Sie wird vor allem dann wichtig, wenn Details geprüft und Risiken sauber abgesichert werden müssen.",
};

function roundPct(n: number): number {
  return Math.round(n);
}

function normalizeTriad(triad: Triad): Triad {
  const sum = triad.imp + triad.int + triad.ana;
  if (sum === 100) return triad;
  if (sum <= 0) return { imp: 33, int: 33, ana: 34 };

  const imp = roundPct((triad.imp / sum) * 100);
  const int = roundPct((triad.int / sum) * 100);
  let ana = 100 - imp - int;

  if (ana < 0) ana = 0;

  return { imp, int, ana };
}

function getSorted(triadInput: Triad): Array<{ key: ComponentKey; value: number }> {
  const triad = normalizeTriad(triadInput);
  return [
    { key: "imp", value: triad.imp },
    { key: "int", value: triad.int },
    { key: "ana", value: triad.ana },
  ].sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.key.localeCompare(b.key);
  });
}

function getVariantMeta(triadInput: Triad): {
  variant: VariantType;
  profileClass: TextProfileClass;
  top1: ComponentKey;
  top2: ComponentKey;
  top3: ComponentKey;
  gap1: number;
  gap2: number;
} {
  const sorted = getSorted(triadInput);
  const [a, b, c] = sorted;
  const gap1 = a.value - b.value;
  const gap2 = b.value - c.value;

  const top1 = a.key;
  const top2 = b.key;
  const top3 = c.key;

  if (gap1 <= EQ_TOL && gap2 <= EQ_TOL) {
    return {
      variant: "ALL_EQUAL",
      profileClass: "BAL_FULL",
      top1,
      top2,
      top3,
      gap1,
      gap2,
    };
  }

  if (gap1 <= EQ_TOL && gap2 > EQ_TOL) {
    const pair = [top1, top2].sort().join("_");
    const map: Record<string, VariantType> = {
      "imp_int": "TOP_PAIR_imp_int",
      "ana_imp": "TOP_PAIR_imp_ana",
      "ana_int": "TOP_PAIR_int_ana",
    };

    return {
      variant: map[pair],
      profileClass: "DUAL_TOP",
      top1,
      top2,
      top3,
      gap1,
      gap2,
    };
  }

  if (gap2 <= EQ_TOL && gap1 > EQ_TOL) {
    const pair = [top2, top3].sort().join("_");
    const map: Record<string, VariantType> = {
      "imp_int": "BOTTOM_PAIR_imp_int",
      "ana_imp": "BOTTOM_PAIR_imp_ana",
      "ana_int": "BOTTOM_PAIR_int_ana",
    };

    return {
      variant: map[pair],
      profileClass: "CLEAR_TOP",
      top1,
      top2,
      top3,
      gap1,
      gap2,
    };
  }

  const orderVariant = `ORDER_${top1}_${top2}_${top3}` as VariantType;

  return {
    variant: orderVariant,
    profileClass: "ORDER",
    top1,
    top2,
    top3,
    gap1,
    gap2,
  };
}

function joinTasks(tasks: string[] = []): string {
  const clean = tasks.map((t) => t.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} und ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} und ${clean[clean.length - 1]}`;
}

function buildIntro(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;

  if (profileClass === "BAL_FULL") {
    return [
      `Dieser Bericht zeigt, welche Persönlichkeitsstruktur für die Stelle ${input.jobTitle} besonders passend und wirksam ist.`,
      `Die Rolle ist durch eine gleichgewichtige Kombination aus ${componentDomain.imp}, ${componentDomain.int} und ${componentDomain.ana} geprägt. Es gibt keine eindeutige Schwerpunktsetzung. Die Wirksamkeit entsteht daraus, situativ den passenden Fokus zu setzen und auch bei wechselnden Anforderungen eine konsistente Linie zu halten.`,
      `Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.`,
    ].join("\n\n");
  }

  if (profileClass === "DUAL_TOP") {
    return [
      `Dieser Bericht zeigt, welche Persönlichkeitsstruktur für die Stelle ${input.jobTitle} besonders passend und wirksam ist.`,
      `Die Rolle wird vor allem durch zwei gleich starke Anforderungen bestimmt: ${componentDomain[top1]} und ${componentDomain[top2]}. Beide stehen im Mittelpunkt der Arbeitsweise. ${componentShort[top3]} ist ebenfalls wichtig, steht aber klar im Hintergrund.`,
      `Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.`,
    ].join("\n\n");
  }

  if (profileClass === "CLEAR_TOP") {
    return [
      `Dieser Bericht zeigt, welche Persönlichkeitsstruktur für die Stelle ${input.jobTitle} besonders passend und wirksam ist.`,
      `Die Rolle ist klar durch ${componentDomain[top1]} geprägt. ${componentDomain[top2]} und ${componentDomain[top3]} sind ebenfalls relevant, unterstützen die Hauptlogik jedoch nur ergänzend. Die Wirksamkeit entsteht aus einer deutlich priorisierten Arbeitsweise.`,
      `Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.`,
    ].join("\n\n");
  }

  return [
    `Dieser Bericht zeigt, welche Persönlichkeitsstruktur für die Stelle ${input.jobTitle} besonders passend und wirksam ist.`,
    `Die Rolle ist im Kern durch ${componentDomain[top1]} geprägt. ${componentFocus[top2]} kommt in vielen Situationen dazu und ist nicht zu unterschätzen. ${componentShort[top3]} spielt eine ergänzende Rolle und tritt vor allem in bestimmten Situationen in den Vordergrund.`,
    `Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.`,
  ].join("\n\n");
}

function buildShortDescription(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;
  const taskText = joinTasks(input.tasks);

  const taskIntro = taskText
    ? `Die zentralen Aufgaben dieser Stelle umfassen ${taskText}.`
    : `Die zentralen Aufgaben dieser Stelle verlangen eine stimmige Verbindung aus Anforderung, Arbeitsweise und Wirkung im Alltag.`;

  if (profileClass === "BAL_FULL") {
    return [
      taskIntro,
      `Diese Anforderungen verlangen eine vielseitige Person, die zwischen ${componentEveryday.imp}, ${componentEveryday.int} und ${componentEveryday.ana} situativ passend wechseln kann.`,
      `Entscheidend ist die Fähigkeit, trotz unterschiedlicher Anforderungen verbindlich, verlässlich und konsistent zu bleiben.`,
    ].join(" ");
  }

  if (profileClass === "DUAL_TOP") {
    return [
      taskIntro,
      `Diese Anforderungen verlangen vor allem eine Person, die ${componentMainSentence[top1]} und zugleich ${componentSupportSentence[top2]}.`,
      `${componentDomain[top3]} ist ebenfalls nötig, steht im Vergleich aber nicht im Vordergrund.`,
    ].join(" ");
  }

  if (profileClass === "CLEAR_TOP") {
    return [
      taskIntro,
      `Diese Anforderungen verlangen vor allem eine Person, die ${componentMainSentence[top1]}.`,
      `${componentFocus[top2]} und ${componentShort[top3]} unterstützen die Hauptanforderung, geben aber nicht die Richtung vor.`,
    ].join(" ");
  }

  return [
    taskIntro,
    `Diese Anforderungen verlangen vor allem eine Person, die ${componentMainSentence[top1]}.`,
    `Unterstützend wichtig ist zudem, dass sie ${componentSupportSentence[top2]}. ${componentDomain[top3]} bleibt relevant, ist jedoch nachrangig.`,
  ].join(" ");
}

function buildStructureProfile(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;

  if (profileClass === "BAL_FULL") {
    return [
      `Diese Stelle verlangt keine eindeutige Spezialisierung.`,
      `Alle drei Denk- und Handlungsweisen sind annähernd gleich wichtig.`,
      `Die Person muss situativ zwischen ${componentDomain.imp}, ${componentDomain.int} und ${componentDomain.ana} wechseln können, ohne dabei an Verlässlichkeit und Orientierung zu verlieren.`,
    ].join(" ");
  }

  if (profileClass === "DUAL_TOP") {
    return [
      `Diese Stelle erfordert eine Doppelstruktur aus ${componentDomain[top1]} und ${componentDomain[top2]}.`,
      `Beide Komponenten sind für die Wirksamkeit zentral.`,
      `${componentDomain[top3]} ist vorhanden, aber nicht prägend.`,
    ].join(" ");
  }

  if (profileClass === "CLEAR_TOP") {
    return [
      `Diese Stelle hat eine klare Hauptausrichtung in ${componentDomain[top1]}.`,
      `Die beiden anderen Komponenten sind untergeordnet und unterstützen die Hauptlogik.`,
      `Die Arbeitsweise folgt damit einer deutlichen Schwerpunktsetzung.`,
    ].join(" ");
  }

  return [
    `Diese Stelle hat eine klare Gewichtung.`,
    `Im Vordergrund steht ${componentDomain[top1]}.`,
    `${componentFocus[top2]} kommt in vielen Situationen dazu und ist nicht zu unterschätzen.`,
    `${componentShort[top3]} bleibt relevant, wirkt aber vor allem unterstützend.`,
  ].join(" ");
}

function buildComponentMeaning(input: JobCheckTextInput): Array<{
  component: ComponentKey;
  title: string;
  text: string;
}> {
  const meta = getVariantMeta(input.triad);
  const { top1, top2, top3 } = meta;

  return [
    {
      component: top1,
      title: componentLabel[top1],
      text: `${componentLabel[top1]} ${componentTopMeaning[top1]}`,
    },
    {
      component: top2,
      title: componentLabel[top2],
      text: `${componentLabel[top2]} ${componentMidMeaning[top2]}`,
    },
    {
      component: top3,
      title: componentLabel[top3],
      text: `${componentLabel[top3]} ${componentLowMeaning[top3]}`,
    },
  ];
}

function buildWorkLogic(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;

  if (profileClass === "BAL_FULL") {
    return `Die Wirksamkeit dieser Stelle entsteht aus der Fähigkeit, je nach Situation den passenden Schwerpunkt zwischen ${componentDomain.imp}, ${componentDomain.int} und ${componentDomain.ana} zu setzen.`;
  }

  if (profileClass === "DUAL_TOP") {
    return `Die Wirksamkeit dieser Stelle entsteht aus dem Zusammenspiel von ${componentDomain[top1]} und ${componentDomain[top2]}. ${componentShort[top3]} ist vorhanden, steht aber nicht im Zentrum der Rolle.`;
  }

  if (profileClass === "CLEAR_TOP") {
    return `Die Wirksamkeit dieser Stelle entsteht vor allem über ${componentDomain[top1]}. ${componentFocus[top2]} und ${componentShort[top3]} stützen die Hauptrichtung, ohne sie zu ersetzen.`;
  }

  return `Die Wirksamkeit dieser Stelle entsteht primär über ${componentDomain[top1]}. ${componentFocus[top2]} unterstützt die Umsetzung im Alltag. ${componentShort[top3]} wird vor allem in spezifischen Situationen wichtig.`;
}

function buildFramework(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { top1, top2, top3, profileClass } = meta;

  const taskCharacter = input.environment?.taskCharacter?.trim();
  const workLogic = input.environment?.workLogic?.trim();
  const leadershipType = input.environment?.leadershipType?.trim();

  const parts: string[] = [];

  if (taskCharacter) {
    parts.push(`Der Aufgabencharakter ist als "${taskCharacter}" beschrieben.`);
  }

  if (workLogic) {
    parts.push(`Die Arbeitslogik wird als "${workLogic}" eingeordnet.`);
  }

  if (leadershipType) {
    parts.push(`Der Führungskontext ist als "${leadershipType}" beschrieben.`);
  }

  if (profileClass === "BAL_FULL") {
    parts.push(
      `Diese Rahmenbedingungen passen zu einer Rolle, die mehrere Anforderungen gleichzeitig tragen muss und keine eindeutige Einseitigkeit verlangt.`
    );
  } else {
    parts.push(
      `Die Rahmenbedingungen sollten die Hauptlogik in ${componentDomain[top1]} stützen. ${componentFocus[top2]} wirkt sinnvoll ergänzend. ${componentShort[top3]} bleibt relevant, sollte aber nicht versehentlich zur Führungslogik der Rolle werden.`
    );
  }

  return parts.join(" ");
}

function buildSuccessFocus(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;
  const focus = input.successFocus ?? null;

  if (!focus) {
    return `Für die Stelle ist kein gesonderter Erfolgsfokus hinterlegt. Maßgeblich bleibt daher die Grundlogik der Rolle.`;
  }

  if (profileClass === "BAL_FULL") {
    return `Der Erfolgsfokus liegt auf ${componentDomain[focus]}. In einer ausgewogenen Rolle ist das ein sinnvoller Schwerpunkt, der situativ stärker betont werden kann, ohne die Gesamtstruktur zu verzerren.`;
  }

  if (focus === top1) {
    return `Der Erfolgsfokus liegt auf ${componentDomain[focus]}. Das passt direkt zur Grundlogik der Stelle und verstärkt die natürliche Wirksamkeit des Profils.`;
  }

  if (focus === top2) {
    return `Der Erfolgsfokus liegt auf ${componentDomain[focus]}. Dieser Bereich ist im Profil unterstützend angelegt. Im Alltag braucht er etwas mehr Aufmerksamkeit, damit er nicht zu kurz kommt.`;
  }

  if (focus === top3) {
    return `Der Erfolgsfokus liegt auf ${componentDomain[focus]}. Dieser Bereich steht im Stellenprofil nicht im Vordergrund. Dadurch entsteht zusätzlicher Steuerungsbedarf, damit dieser Aspekt im Alltag nicht zu wenig Gewicht erhält.`;
  }

  return `Der Erfolgsfokus ergänzt die Struktur der Rolle. Entscheidend bleibt, dass die Hauptlogik der Stelle nicht verwässert wird.`;
}

function buildBehaviourDaily(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;

  if (profileClass === "BAL_FULL") {
    return `Im regulären Arbeitsalltag zeigt sich bei dieser Stelle keine eindeutige Handlungsrichtung. Die Rolle wechselt je nach Situation zwischen ${componentEveryday.imp}, ${componentEveryday.int} und ${componentEveryday.ana}.`;
  }

  if (profileClass === "DUAL_TOP") {
    return `Im regulären Arbeitsalltag zeigt sich die Stelle vor allem über ${componentEveryday[top1]} und ${componentEveryday[top2]}. ${componentShort[top3]} ist ebenfalls vorhanden, tritt aber im Vergleich deutlich seltener in den Vordergrund.`;
  }

  return `Im regulären Arbeitsalltag zeigt sich die Stelle vor allem über ${componentEveryday[top1]}. ${componentFocus[top2]} kommt ergänzend dazu. ${componentShort[top3]} bleibt eher nachgeordnet.`;
}

function buildBehaviourPressure(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1 } = meta;

  if (profileClass === "BAL_FULL") {
    return `Unter zunehmendem Arbeitsdruck zeigt sich bei dieser ausgeglichenen Rolle keine eindeutige Verschiebung. Stattdessen kann sich je nach Situation eine der drei Komponenten stärker in den Vordergrund schieben – ob Handlungsdruck, Absicherungsbedürfnis oder verstärkte Abstimmung. Welche Reaktion dominiert, hängt von der Person und der konkreten Belastung ab.`;
  }

  if (top1 === "ana") {
    return `Unter zunehmendem Arbeitsdruck verstärkt sich die Tendenz zu genauer Prüfung, stärkerer Absicherung und kontrolliertem Vorgehen. Das erhöht die Nachvollziehbarkeit, kann Entscheidungen aber verlangsamen.`;
  }

  if (top1 === "int") {
    return `Unter zunehmendem Arbeitsdruck verstärkt sich die Tendenz, Rückmeldung, Abstimmung und Wirkung auf andere stärker mitzudenken. Das stabilisiert Beziehungen, kann Entscheidungen aber weicher machen.`;
  }

  return `Unter zunehmendem Arbeitsdruck verstärkt sich die Tendenz, schneller zu entscheiden, klarer zu priorisieren und stärker auf Umsetzung zu drängen. Das erhöht die Dynamik, kann aber Absicherung und Abstimmung verkürzen.`;
}

function buildBehaviourStress(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2 } = meta;

  if (profileClass === "BAL_FULL") {
    return `In nicht mehr kontrollierbaren Situationen fehlt bei dieser ausgeglichenen Rolle ein klarer Automatismus. Die Reaktion ist weniger vorhersagbar als bei spezialisierten Profilen. Es kann zu einem wechselnden Verhalten kommen – zwischen verstärkter Kontrolle, direkterem Handeln und intensiverer Abstimmung. Gerade dieses Schwanken macht die Stressreaktion schwerer einschätzbar.`;
  }

  if (top1 === "ana" && top2 === "int") {
    return `In nicht mehr kontrollierbaren Situationen rückt zusätzlich die Wirkung auf andere stärker in den Vordergrund. Dann werden neben Fakten auch Abstimmung und zwischenmenschliche Folgen intensiver berücksichtigt.`;
  }

  if (top1 === "ana" && top2 === "imp") {
    return `In nicht mehr kontrollierbaren Situationen kann das Verhalten direkter und schneller werden. Dann wächst der Druck, offene Punkte rasch zu klären und Entscheidungen zügig zu treffen.`;
  }

  if (top1 === "int" && top2 === "ana") {
    return `In nicht mehr kontrollierbaren Situationen wächst das Bedürfnis nach Struktur, Klarheit und fachlicher Absicherung. Die Rolle sucht dann stärker Halt in nachvollziehbaren Abläufen.`;
  }

  if (top1 === "int" && top2 === "imp") {
    return `In nicht mehr kontrollierbaren Situationen kann das Verhalten direkter und entschlossener werden. Dann rücken Tempo und klare Entscheidungen stärker in den Vordergrund.`;
  }

  if (top1 === "imp" && top2 === "ana") {
    return `In nicht mehr kontrollierbaren Situationen steigt das Bedürfnis, sich über Fakten, Kontrolle und Struktur abzusichern. Das Verhalten wird dann oft prüfender und sachorientierter.`;
  }

  if (top1 === "imp" && top2 === "int") {
    return `In nicht mehr kontrollierbaren Situationen rückt stärker in den Vordergrund, wie Entscheidungen auf andere wirken. Abstimmung und Beziehungssicherheit gewinnen dann an Bedeutung.`;
  }

  return `In nicht mehr kontrollierbaren Situationen wird die Zweitlogik der Rolle stärker sichtbar. Dadurch verschiebt sich der Schwerpunkt vorübergehend von ${componentDomain[top1]} in Richtung ${componentDomain[top2]}.`;
}

function buildTeamImpact(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2 } = meta;

  if (profileClass === "BAL_FULL") {
    return `Im Team entsteht Wirkung vor allem über Vielseitigkeit und Anpassungsfähigkeit. Die Rolle kann je nach Situation unterschiedlich auftreten. Die Herausforderung besteht darin, dabei dennoch berechenbar und verlässlich zu bleiben.`;
  }

  return `Im Team entsteht Wirkung vor allem über ${componentDomain[top1]}. Das merkt man vor allem daran, dass ${componentFocus[top1]} im Alltag deutlich spürbar ist. ${componentFocus[top2]} kommt ergänzend dazu und macht die Rolle für das Umfeld zugänglich.`;
}

function buildTensionFields(input: JobCheckTextInput): string[] {
  const meta = getVariantMeta(input.triad);
  const { variant, profileClass, top1, top2, top3 } = meta;

  if (profileClass === "BAL_FULL") {
    return [
      "Vielseitigkeit vs. klare Schwerpunktsetzung",
      "situatives Reagieren vs. konsistente Linie",
      "Anpassungsfähigkeit vs. Berechenbarkeit",
      "breite Einsetzbarkeit vs. eindeutige Rollenwirkung",
    ];
  }

  const map: Record<VariantType, string[]> = {
    ALL_EQUAL: [
      "Vielseitigkeit vs. klare Schwerpunktsetzung",
      "situatives Reagieren vs. konsistente Linie",
      "Anpassungsfähigkeit vs. Berechenbarkeit",
      "breite Einsetzbarkeit vs. eindeutige Rollenwirkung",
    ],
    TOP_PAIR_imp_int: [
      "Tempo und Umsetzung vs. fachliche Absicherung",
      "direktes Handeln vs. tragfähige Abstimmung",
      "Bewegung im Alltag vs. stabile Linie",
      "Nähe zum Menschen vs. Konsequenz in Entscheidungen",
    ],
    TOP_PAIR_imp_ana: [
      "Tempo vs. Sorgfalt",
      "direkte Umsetzung vs. gründliche Prüfung",
      "Handlungsdruck vs. methodische Stabilität",
      "schnelle Entscheidungen vs. nachhaltige Absicherung",
    ],
    TOP_PAIR_int_ana: [
      "Abstimmung vs. Entscheidungstempo",
      "Beziehungssicherheit vs. sachliche Konsequenz",
      "Rücksichtnahme vs. klare Priorisierung",
      "Gründlichkeit vs. operative Dynamik",
    ],
    BOTTOM_PAIR_imp_int: [
      `${componentDomain[top1]} vs. fehlende klare Absicherung`,
      "Hauptlogik vs. situative Nebenanforderungen",
      "klare Schwerpunktsetzung vs. breite Anschlussfähigkeit",
      "Kernwirkung vs. ergänzende Flexibilität",
    ],
    BOTTOM_PAIR_imp_ana: [
      `${componentDomain[top1]} vs. Balance zwischen Tempo und Struktur`,
      "klare Schwerpunktsetzung vs. ergänzende Absicherung",
      "Hauptwirkung vs. situative Abstimmung",
      "Dominanz in der Rolle vs. Anschlussfähigkeit im Alltag",
    ],
    BOTTOM_PAIR_int_ana: [
      `${componentDomain[top1]} vs. Balance zwischen Abstimmung und Analyse`,
      "klare Schwerpunktsetzung vs. direkte Umsetzung",
      "Hauptwirkung vs. operative Dynamik",
      "Rollenklarheit vs. ergänzende Vielseitigkeit",
    ],
    ORDER_imp_int_ana: [
      "Tempo vs. Sorgfalt",
      "direkte Umsetzung vs. fachliche Absicherung",
      "klare Entscheidungen vs. ausführliche Abstimmung",
      "Dynamik vs. nachhaltige Stabilität",
    ],
    ORDER_imp_ana_int: [
      "Tempo vs. Einbindung anderer",
      "direkte Umsetzung vs. Beziehungssicherheit",
      "Ergebnisdruck vs. tragfähige Kommunikation",
      "Struktur im Handeln vs. Rücksichtnahme",
    ],
    ORDER_int_imp_ana: [
      "Abstimmung vs. Qualitätssicherung",
      "Beziehungssicherheit vs. fachliche Konsequenz",
      "Nähe und Anschlussfähigkeit vs. klare Priorisierung",
      "Miteinander vs. methodische Strenge",
    ],
    ORDER_int_ana_imp: [
      "Abstimmung vs. Entscheidungstempo",
      "Rücksichtnahme vs. direkte Konsequenz",
      "Beziehungssicherheit vs. Handlungsdruck",
      "Gründlichkeit im Miteinander vs. schnelle Umsetzung",
    ],
    ORDER_ana_imp_int: [
      "Sorgfalt vs. Einbindung anderer",
      "Analyse vs. Beziehungssicherheit",
      "fachliche Absicherung vs. weiche Abstimmung",
      "klare Struktur vs. zwischenmenschliche Elastizität",
    ],
    ORDER_ana_int_imp: [
      "Sorgfalt vs. Geschwindigkeit",
      "Absicherung vs. pragmatisches Entscheiden",
      "Abstimmung vs. klare Priorisierung",
      "Qualität vs. operative Dynamik",
    ],
  };

  return map[variant] ?? [
    `${componentDomain[top1]} vs. ${componentDomain[top3]}`,
    `${componentDomain[top1]} vs. ${componentDomain[top2]}`,
    "Hauptlogik vs. Nebenanforderungen",
    "Wirksamkeit vs. Übersteuerung",
  ];
}

function buildMiscastRisks(input: JobCheckTextInput): Array<{
  label: string;
  bullets: string[];
}> {
  const meta = getVariantMeta(input.triad);
  const { top1, top2, top3 } = meta;

  return [
    {
      label: `Wenn ${componentLabel[top1]} zu stark wird`,
      bullets: [
        `Die Hauptlogik der Rolle übersteuert und andere Anforderungen treten zu stark in den Hintergrund.`,
        `Es entsteht die Gefahr, dass die Rolle einseitig wirkt und ihre Anschlussfähigkeit verliert.`,
        `Unter Druck wird die dominante Stärke überbetont, statt situativ passend eingesetzt zu werden.`,
        `Die Wirksamkeit sinkt, wenn ${componentDomain[top2]} und ${componentDomain[top3]} nicht mehr ausreichend mitgetragen werden.`,
      ],
    },
    {
      label: `Wenn ${componentLabel[top2]} die Führung übernimmt`,
      bullets: [
        `Die unterstützende Komponente verdrängt die eigentliche Hauptlogik der Rolle.`,
        `Die Stelle wirkt dann weniger klar und verliert ihre natürliche Gewichtung.`,
        `Entscheidungen und Verhalten verschieben sich spürbar von der Kernanforderung weg.`,
        `Dadurch wird die Rolle anschlussfähig, aber nicht mehr konsequent in ihrer eigentlichen Wirkung.`,
      ],
    },
    {
      label: `Wenn ${componentLabel[top3]} zu stark wird`,
      bullets: [
        `Die schwächste Komponente übernimmt zu viel Raum und verändert die Grundlogik der Stelle deutlich.`,
        `Dadurch entstehen typische Fehlsteuerungen, weil Anforderungen in den Vordergrund rücken, die strukturell nicht führend angelegt sind.`,
        `Im Alltag kommt es dann eher zu Reibung, Unklarheit oder falscher Priorisierung.`,
        `Die Wirksamkeit der Rolle sinkt deutlich, wenn ${componentDomain[top3]} wichtiger wird als ${componentDomain[top1]}.`,
      ],
    },
  ];
}

function buildTypicalPerson(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { top1, top2, top3, profileClass } = meta;

  if (profileClass === "BAL_FULL") {
    return `Typisch passend sind Personen aus Rollen, in denen mehrere gleich wichtige Anforderungen parallel getragen werden müssen. Sie bringen keine starke Einseitigkeit mit, sondern können zwischen ${componentDomain.imp}, ${componentDomain.int} und ${componentDomain.ana} situativ passend wechseln.`;
  }

  if (profileClass === "DUAL_TOP") {
    return `Typisch passend sind Personen aus Rollen, in denen ${componentDomain[top1]} und ${componentDomain[top2]} gemeinsam gefordert sind. Sie bringen meist eine Doppelstruktur mit, die beide Bereiche natürlich verbindet. ${componentDomain[top3]} ist vorhanden, steht aber eher im Hintergrund.`;
  }

  return `Typisch passend sind Personen aus Rollen, in denen ${componentDomain[top1]} mit ${componentDomain[top2]} verbunden werden muss. Sie arbeiten häufig in Umfeldern, in denen die Hauptanforderung klar ist, zugleich aber ${componentDomain[top2]} im Alltag nicht fehlen darf. ${componentDomain[top3]} bleibt eher ergänzend.`;
}

function buildFinalDecision(input: JobCheckTextInput): string {
  const meta = getVariantMeta(input.triad);
  const { profileClass, top1, top2, top3 } = meta;

  if (profileClass === "BAL_FULL") {
    return `Entscheidend für die Besetzung ist eine Person, die flexibel zwischen ${componentDomain.imp}, ${componentDomain.int} und ${componentDomain.ana} wechseln kann, ohne dabei an Klarheit, Verlässlichkeit und Konsistenz zu verlieren.`;
  }

  if (profileClass === "DUAL_TOP") {
    return `Entscheidend für die Besetzung ist eine Person, die ${componentDomain[top1]} und ${componentDomain[top2]} selbstverständlich miteinander verbindet. ${componentDomain[top3]} sollte vorhanden sein, muss aber nicht führend ausgeprägt sein.`;
  }

  if (profileClass === "CLEAR_TOP") {
    return `Entscheidend für die Besetzung ist eine Person, die klar auf ${componentDomain[top1]} ausgerichtet ist. ${componentDomain[top2]} und ${componentDomain[top3]} sollten die Hauptlogik sinnvoll ergänzen, ohne sie zu verwässern.`;
  }

  return `Entscheidend für die Besetzung ist eine Person, die im Kern ${componentDomain[top1]} mitbringt. Unterstützend wichtig ist ${componentDomain[top2]}. ${componentDomain[top3]} sollte vorhanden sein, darf die Hauptlogik der Rolle aber nicht überlagern.`;
}

export function generateJobCheckRoleReport(
  input: JobCheckTextInput
): JobCheckReportTexts {
  const meta = getVariantMeta(input.triad);

  return {
    meta,
    intro: buildIntro(input),
    shortDescription: buildShortDescription(input),
    structureProfile: buildStructureProfile(input),
    componentMeaning: buildComponentMeaning(input),
    workLogic: buildWorkLogic(input),
    framework: buildFramework(input),
    successFocus: buildSuccessFocus(input),
    behaviourDaily: buildBehaviourDaily(input),
    behaviourPressure: buildBehaviourPressure(input),
    behaviourStress: buildBehaviourStress(input),
    teamImpact: buildTeamImpact(input),
    tensionFields: buildTensionFields(input),
    miscastRisks: buildMiscastRisks(input),
    typicalPerson: buildTypicalPerson(input),
    finalDecision: buildFinalDecision(input),
  };
}

export function debugVariant(triad: Triad) {
  const meta = getVariantMeta(triad);
  return {
    input: normalizeTriad(triad),
    variant: meta.variant,
    profileClass: meta.profileClass,
    top1: meta.top1,
    top2: meta.top2,
    top3: meta.top3,
    gap1: meta.gap1,
    gap2: meta.gap2,
  };
}

export function getForbiddenPhrases(profileClass: TextProfileClass): string[] {
  switch (profileClass) {
    case "BAL_FULL":
      return [];

    case "DUAL_TOP":
      return [
        "gleichgewichtet in allen drei Bereichen",
        "keine klare Richtung",
        "voll ausgeglichen",
      ];

    case "CLEAR_TOP":
      return [
        "gleichgewichtet",
        "keine eindeutige Spezialisierung",
        "situativ frei zwischen allen drei",
        "ausgewogene Arbeitslogik",
      ];

    case "ORDER":
      return [
        "gleichgewichtet",
        "keine klare Richtung",
        "keine eindeutige Spezialisierung",
        "ausgewogene Arbeitslogik",
        "situativ frei zwischen allen drei Bereichen",
      ];
  }
}