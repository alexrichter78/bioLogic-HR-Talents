type VariantLevel = 'PERFECT' | 'EXACT_YELLOW' | 'SOFT_YELLOW' | 'MISMATCH';

function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickVariant(
  variants: string[],
  seed: string,
): string {
  const index = stableHash(seed) % variants.length;
  return variants[index];
}

export function pickVariantSet(
  variantSets: string[][],
  seed: string,
): string[] {
  const index = stableHash(seed) % variantSets.length;
  return variantSets[index];
}

export const textVariants = {
  overall: {
    PERFECT: [
      'Die Person passt gut zur Rolle. Arbeitsweise und Anforderung greifen stimmig ineinander.',
      'Für die Rolle ergibt sich eine klare Passung. Die Person bringt die geforderte Arbeitslogik in tragfähiger Form mit.',
      'Die Besetzung wirkt insgesamt stimmig. Die Person arbeitet in der Logik, die die Stelle verlangt.',
      'Die Passung ist hoch. Die Rolle kann voraussichtlich ohne erhöhten Steuerungsaufwand ausgefüllt werden.',
    ],
    EXACT_YELLOW: [
      'Die Person passt grundsätzlich zur Rolle. In der Gewichtung einzelner Bereiche arbeitet sie jedoch anders, als die Stelle es verlangt.',
      'Die Grundrichtung stimmt. Im Alltag setzt die Person jedoch andere Akzente als die Rolle vorgibt.',
      'Die Passung ist vorhanden, aber nicht ganz sauber. Die Arbeitslogik stimmt im Kern, die Gewichtung weicht jedoch ab.',
      'Die Person bringt die richtige Richtung mit. Gleichzeitig zeigt sich, dass einzelne Schwerpunkte anders gesetzt werden als in der Rolle vorgesehen.',
    ],
    SOFT_YELLOW: [
      'Die Person ist in wesentlichen Teilen anschlussfähig, bildet die Rolle aber nicht durchgehend stabil ab.',
      'Es gibt eine erkennbare Grundlage für die Rolle. Gleichzeitig entstehen in einem wichtigen Punkt Abweichungen.',
      'Die Person passt in Teilen zur Stelle, arbeitet jedoch nicht durchgehend in der geforderten Form.',
      'Die Passung ist möglich, aber nicht stabil von selbst. Im Alltag braucht es bewusste Führung.',
    ],
    MISMATCH: [
      'Die Person arbeitet anders, als die Rolle es verlangt.',
      'Die Stelle verlangt eine andere Art zu arbeiten, als die Person sie mitbringt.',
      'Die Unterschiede sind zu groß, um von einer tragfähigen Passung zu sprechen.',
      'Im Alltag würde die Rolle voraussichtlich anders gelebt als vorgesehen.',
    ],
  } satisfies Record<VariantLevel, string[]>,

  management: {
    PERFECT: [
      'Führung dient hier vor allem der Priorisierung, nicht dem Ausgleich struktureller Unterschiede.',
      'Die Person braucht vor allem Orientierung und Feinabstimmung, nicht dauerhafte Korrektur.',
      'Im Führungsalltag geht es eher um Steuerung im Detail als um Kompensation von Abweichungen.',
    ],
    EXACT_YELLOW: [
      'Führung sollte hier vor allem auf Gewichtung und Priorisierung achten.',
      'Die Person arbeitet in die richtige Richtung, setzt aber andere Schwerpunkte. Genau dort sollte Führung ansetzen.',
      'Entscheidend ist hier nicht die Grundausrichtung, sondern die konsequente Ausrichtung an der Rolle.',
    ],
    SOFT_YELLOW: [
      'Ohne klare Führung droht die Rolle schrittweise anders ausgeübt zu werden.',
      'Die Person braucht einen klaren Rahmen, damit sich die Abweichung nicht im Alltag verfestigt.',
      'Führung muss hier nicht nur steuern, sondern auch Richtung halten.',
    ],
    MISMATCH: [
      'Führung müsste dauerhaft ausgleichen statt gezielt steuern.',
      'Der Führungsaufwand würde hier vor allem aus Korrektur bestehen.',
      'Die Rolle müsste im Alltag ständig nachgeschärft werden, damit sie nicht in eine andere Richtung kippt.',
    ],
  } satisfies Record<VariantLevel, string[]>,

  why: {
    PERFECT: [
      [
        'Struktur und Gewichtung stimmen überein. Unterschiede liegen nur im normalen Toleranzbereich.',
        'Im Alltag entsteht dadurch ein konsistentes Arbeitsverhalten, das gut zur Rolle passt.',
      ],
      [
        'Die Person bringt die geforderte Logik in stabiler Form mit. Größere Verschiebungen sind nicht erkennbar.',
        'Die Arbeitsweise passt sowohl in der Reihenfolge als auch in der Gewichtung zur Stelle.',
      ],
      [
        'Die Arbeitslogik entspricht in Struktur und Gewichtung der Stellenanforderung.',
        'Unterschiede in den einzelnen Bereichen sind gering und liegen innerhalb eines stabilen Rahmens.',
      ],
    ],
    EXACT_YELLOW: [
      [
        'Die Struktur stimmt, die Gewichtung einzelner Bereiche weicht jedoch ab.',
        'Dadurch bleibt die Richtung gleich, die Umsetzung im Alltag kann sich jedoch spürbar verschieben.',
      ],
      [
        'Die Person arbeitet in derselben Grundlogik, setzt aber andere Akzente.',
        'Richtung und Aufbau passen, die Intensität einzelner Schwerpunkte liegt jedoch nicht ganz auf dem Niveau der Rolle.',
      ],
      [
        'Die grundlegende Arbeitslogik entspricht der Struktur der Stelle.',
        'Die größten Abweichungen liegen in der Gewichtung einzelner Bereiche.',
      ],
    ],
    SOFT_YELLOW: [
      [
        'Ein zentraler Strukturpunkt kippt gegenüber der Rolle.',
        'Dadurch entstehen im Alltag unterschiedliche Prioritäten und Entscheidungslogiken.',
      ],
      [
        'Die Person trifft die Logik der Stelle in einem wichtigen Vergleichspunkt nicht vollständig.',
        'Die Abweichung liegt nicht nur in der Stärke, sondern in der Anordnung der Schwerpunkte.',
      ],
      [
        'Die Arbeitslogik stimmt in Teilen mit der Stellenanforderung überein, weicht jedoch in einem zentralen Strukturpunkt ab.',
        'Diese Abweichung wirkt sich direkt auf die Art der Aufgabenumsetzung aus.',
      ],
    ],
    MISMATCH: [
      [
        'Struktur und Prioritätslogik weichen deutlich von der Rolle ab.',
        'Die Unterschiede betreffen nicht nur Nuancen, sondern die Grundrichtung der Rollenausübung.',
      ],
      [
        'Die Person setzt andere Schwerpunkte und folgt einer anderen Arbeitsreihenfolge.',
        'Im Alltag würde daraus ein anderes Arbeits- und Entscheidungsverhalten entstehen als vorgesehen.',
      ],
      [
        'Die Arbeitslogik unterscheidet sich in zentralen Punkten von der Stellenanforderung.',
        'Sowohl Struktur als auch Gewichtung weichen deutlich voneinander ab.',
      ],
    ],
  } satisfies Record<VariantLevel, string[][]>,

  risks: {
    PERFECT: [
      [
        'Risiken liegen eher in Überlastung oder operativer Streuung als in der Grundpassung.',
        'Die Zusammenarbeit ist voraussichtlich stabil. Risiken entstehen eher durch Rahmenbedingungen als durch die Person-Rolle-Passung.',
        'Ohne klare Priorisierung kann es punktuell zu Überlastung oder unnötiger Streuung kommen.',
      ],
      [
        'Im Alltag entstehen nur geringe Reibungsverluste, da Arbeitsweise und Rolle gut zusammenpassen.',
        'Mögliche Spannungen betreffen eher Tempo und Ressourcen als die Passung selbst.',
        'Risiken liegen vor allem in der operativen Umsetzung, nicht in der grundsätzlichen Passung.',
      ],
    ],
    EXACT_YELLOW: [
      [
        'Im Alltag können sich Prioritäten leicht verschieben.',
        'Aufgaben werden tendenziell anders gewichtet, als die Rolle es vorsieht.',
        'Ohne klare Ausrichtung verfestigt sich diese Verschiebung mit der Zeit.',
      ],
      [
        'Die Person setzt im Alltag andere Schwerpunkte, als die Rolle vorgibt.',
        'Dadurch kann sich die Gewichtung der Aufgaben schrittweise verschieben.',
        'Ohne klare Ausrichtung verfestigt sich diese Verschiebung mit der Zeit.',
      ],
    ],
    SOFT_YELLOW: [
      [
        'Entscheidungen können je nach Situation uneinheitlich ausfallen.',
        'Die Rolle wirkt im Alltag nicht immer in derselben Richtung.',
        'Daraus entstehen Abstimmungsaufwand und Reibung im Team.',
      ],
      [
        'In einzelnen Situationen entstehen unterschiedliche Prioritäten zwischen Person und Rolle.',
        'Entscheidungen und Vorgehensweisen können dadurch uneinheitlich werden.',
        'Diese Abweichungen führen im Alltag zu Reibung und Abstimmungsaufwand.',
      ],
    ],
    MISMATCH: [
      [
        'Erwartungen und tatsächliches Verhalten laufen dauerhaft auseinander.',
        'Entscheidungen, Kommunikation und Arbeitsweise würden sich spürbar von der Rolle entfernen.',
        'Daraus entstehen wiederkehrende Konflikte und Korrekturschleifen.',
      ],
      [
        'Die Rolle wird im Alltag voraussichtlich anders ausgefüllt als vorgesehen.',
        'Erwartungen und tatsächliches Verhalten laufen dauerhaft auseinander.',
        'Daraus entstehen wiederkehrende Konflikte, Korrekturschleifen und erhöhter Führungsaufwand.',
      ],
    ],
  } satisfies Record<VariantLevel, string[][]>,

  impact: {
    decision: {
      PERFECT: [
        'Das Entscheidungsverhalten ist stimmig und entspricht der Rolle.',
        'Entscheidungen werden in der Form getroffen, die die Stelle verlangt.',
        'Die Entscheidungslogik passt zur Rolle und wirkt im Alltag tragfähig.',
      ],
      EXACT_YELLOW: [
        'Das Entscheidungsverhalten ist in der Grundrichtung stimmig, wird aber anders gewichtet.',
        'Die Person entscheidet grundsätzlich passend, setzt dabei jedoch andere Akzente als die Rolle.',
        'Die Logik der Entscheidungen stimmt im Kern, ist aber nicht vollständig deckungsgleich.',
      ],
      SOFT_YELLOW: [
        'Das Entscheidungsverhalten ist teilweise anschlussfähig, aber nicht durchgehend rollengerecht.',
        'In Entscheidungen zeigen sich relevante Unterschiede zur Rollenlogik.',
        'Die Person trifft Entscheidungen in Teilen passend, aber in der Umsetzung aber nicht stabil in der geforderten Form.',
      ],
      MISMATCH: [
        'Die Person trifft Entscheidungen anders, als die Stelle es verlangt.',
        'Entscheidungen würden im Alltag anders getroffen, als die Stelle es verlangt.',
        'Die Art zu entscheiden passt nicht zur Aufgabenlogik der Rolle.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    workstyle: {
      PERFECT: [
        'Die Arbeitsweise ist stimmig und gut anschlussfähig.',
        'Aufgaben werden in der Form bearbeitet, die die Rolle verlangt.',
        'Das Vorgehen passt zur Struktur und zum Rhythmus der Stelle.',
      ],
      EXACT_YELLOW: [
        'Die Arbeitsweise ist im Kern passend, aber anders gewichtet.',
        'Die Person arbeitet in die richtige Richtung, setzt jedoch andere Schwerpunkte in der Umsetzung.',
        'Das Vorgehen stimmt grundsätzlich, wirkt im Alltag aber nicht ganz so, wie es die Rolle vorsieht.',
      ],
      SOFT_YELLOW: [
        'Die Arbeitsweise ist grundsätzlich anschlussfähig, aber nicht durchgehend deckungsgleich.',
        'In der Umsetzung zeigen sich Unterschiede, die für die Rolle relevant sind.',
        'Das Vorgehen passt in Teilen, bleibt aber nicht stabil in der geforderten Form.',
      ],
      MISMATCH: [
        'Die Arbeitsweise liegt spürbar neben der Stellenanforderung.',
        'Aufgaben werden anders angegangen, als die Rolle es verlangt.',
        'Die Umsetzungslogik der Person passt nicht zur Rolle.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    communication: {
      PERFECT: [
        'Die Kommunikation ist stimmig und gut anschlussfähig.',
        'Austausch und Abstimmung erfolgen in der Form, die die Rolle verlangt.',
        'Der Kommunikationsstil unterstützt die Anforderungen der Stelle.',
      ],
      EXACT_YELLOW: [
        'Die Kommunikation ist in der Grundrichtung passend, aber anders dosiert.',
        'Der Stil der Abstimmung stimmt im Kern, weicht jedoch in der Gewichtung ab.',
        'Die Person kommuniziert grundsätzlich passend, setzt dabei aber andere Akzente.',
      ],
      SOFT_YELLOW: [
        'Die Kommunikation ist teilweise passend, trifft die erwartete Form jedoch nicht durchgehend.',
        'Im Austausch zeigen sich Unterschiede, die im Alltag spürbar werden.',
        'Die Kommunikation ist anschlussfähig, aber nicht stabil in der erwarteten Form.',
      ],
      MISMATCH: [
        'Die Person kommuniziert anders, als die Stelle es erwartet.',
        'Austausch und Abstimmung verlaufen anders, als die Stelle es verlangt.',
        'Der Kommunikationsstil passt nicht zur erwarteten Form der Rolle.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    culture: {
      PERFECT: [
        'Die kulturelle Wirkung unterstützt die gewünschte Richtung der Rolle.',
        'Zusammenarbeit und Dynamik entwickeln sich in die passende Richtung.',
        'Die Person stärkt die Teamlogik, die für die Rolle vorgesehen ist.',
      ],
      EXACT_YELLOW: [
        'Die kulturelle Grundrichtung ist stimmig, wird im Alltag jedoch anders dosiert.',
        'Die Wirkung auf das Team passt im Kern, setzt aber andere Akzente.',
        'Die Person unterstützt die Grundrichtung, verschiebt jedoch die Gewichtung im Alltag leicht.',
      ],
      SOFT_YELLOW: [
        'Die Wirkung auf Zusammenarbeit und Teamkultur ist grundsätzlich tragfähig, bleibt aber nicht deckungsgleich.',
        'Im Alltag entstehen andere Dynamiken, als die Rolle eigentlich verlangt.',
        'Die Teamwirkung passt in Teilen, bleibt aber nicht stabil in derselben Richtung.',
      ],
      MISMATCH: [
        'Die Person würde das Team in eine andere Richtung entwickeln als die Stelle es vorsieht.',
        'Zusammenarbeit entwickelt sich anders, als die Rolle es vorsieht.',
        'Die Person setzt im Team eine andere Richtung als die Stelle verlangt.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    leadership: {
      PERFECT: [
        'Die Führungswirkung ist stimmig und gut anschlussfähig.',
        'Die Führung wirkt in die Richtung, die die Rolle verlangt.',
      ],
      EXACT_YELLOW: [
        'Die Führungswirkung ist grundsätzlich stimmig, wird im Alltag aber anders gewichtet.',
        'Die Führung setzt die richtigen Akzente, dosiert sie jedoch anders als die Rolle es vorsieht.',
      ],
      SOFT_YELLOW: [
        'Die Führungswirkung ist grundsätzlich anschlussfähig, aber nicht durchgehend in der geforderten Form.',
        'Die Führung passt in Teilen zur Rolle, passt in Teilen, bleibt aber nicht stabil in der erwarteten Form.',
      ],
      MISMATCH: [
        'Die Führungswirkung entspricht nicht dem, was die Stelle braucht.',
        'Die Art zu führen passt nicht zu den Anforderungen der Stelle.',
      ],
    } satisfies Record<VariantLevel, string[]>,
  },
};

export const textVariantsEN = {
  overall: {
    PERFECT: [
      'The person is a good fit for the role. Working style and requirements align well.',
      'The role shows a clear fit. The person brings the required work logic in a solid form.',
      'The placement looks consistent overall. The person works in the logic the role demands.',
      'Fit is high. The role can likely be filled without increased management effort.',
    ],
    EXACT_YELLOW: [
      'The person basically fits the role. However, the weighting of certain areas differs from what the role requires.',
      'The basic direction is aligned. In practice, the person sets different priorities than the role specifies.',
      'Fit is present but not fully precise. The work logic matches at its core, but the weighting deviates.',
      'The person brings the right direction. At the same time, some areas are weighted differently than the role calls for.',
    ],
    SOFT_YELLOW: [
      'The person is compatible in important ways, but does not consistently reflect the role.',
      'There is a recognisable foundation for the role. At the same time, deviations appear in one important area.',
      'The person fits parts of the role, but does not consistently work in the required form.',
      'Fit is possible, but not stable on its own. Conscious leadership is required in practice.',
    ],
    MISMATCH: [
      'The person works differently than the role requires.',
      'The role calls for a different way of working than the person brings.',
      'The differences are too large to speak of a viable fit.',
      'In practice, the role would likely be fulfilled differently than intended.',
    ],
  } satisfies Record<VariantLevel, string[]>,

  management: {
    PERFECT: [
      'Leadership here serves mainly to prioritise, not to compensate for structural differences.',
      'The person needs orientation and fine-tuning, not ongoing correction.',
      'Day-to-day management focuses on detail steering rather than compensating for deviations.',
    ],
    EXACT_YELLOW: [
      'Leadership should focus primarily on weighting and prioritisation.',
      'The person works in the right direction but sets different priorities. That is exactly where leadership should engage.',
      'What matters here is not the basic direction, but consistent alignment to the role.',
    ],
    SOFT_YELLOW: [
      'Without clear leadership, the role risks gradually being fulfilled in a different way.',
      'The person needs a clear framework so that the deviation does not become entrenched in practice.',
      'Leadership here must not only steer but also maintain direction.',
    ],
    MISMATCH: [
      'Leadership would permanently be compensating rather than steering.',
      'Management effort here would consist primarily of correction.',
      'The role would constantly need to be re-calibrated to prevent it from drifting in a different direction.',
    ],
  } satisfies Record<VariantLevel, string[]>,

  why: {
    PERFECT: [
      [
        'Structure and weighting are aligned. Differences lie only within the normal tolerance range.',
        'This creates consistent working behaviour in practice that fits the role well.',
      ],
      [
        'The person brings the required logic in stable form. No major shifts are apparent.',
        'Working style fits both in sequence and in weighting.',
      ],
      [
        'Work logic corresponds to the role requirement in structure and weighting.',
        'Differences in individual areas are minor and lie within a stable range.',
      ],
    ],
    EXACT_YELLOW: [
      [
        'Structure is aligned, but the weighting of individual areas deviates.',
        'Direction stays the same, but day-to-day execution can shift noticeably.',
      ],
      [
        'The person works in the same basic logic but sets different priorities.',
        'Direction and setup match; the intensity of individual priorities is slightly off.',
      ],
      [
        'The basic work logic corresponds to the structure of the role.',
        'The largest deviations lie in the weighting of individual areas.',
      ],
    ],
    SOFT_YELLOW: [
      [
        'One central structural point flips compared to the role.',
        'This creates different priorities and decision logics in practice.',
      ],
      [
        'The person does not fully match the role logic in one important comparison point.',
        'The deviation is not just in intensity but in the arrangement of priorities.',
      ],
      [
        'Work logic partially aligns with role requirements but deviates in one central structural point.',
        'This deviation directly affects how tasks are carried out.',
      ],
    ],
    MISMATCH: [
      [
        'Structure and priority logic deviate significantly from the role.',
        'Differences affect not just nuances but the fundamental direction of role fulfilment.',
      ],
      [
        'The person sets different priorities and follows a different work sequence.',
        'In practice this would result in different working and decision behaviour than intended.',
      ],
      [
        'Work logic differs from the role requirement in central points.',
        'Both structure and weighting deviate significantly.',
      ],
    ],
  } satisfies Record<VariantLevel, string[][]>,

  risks: {
    PERFECT: [
      [
        'Risks lie more in overload or operational scatter than in the fundamental fit.',
        'Collaboration is expected to be stable. Risks arise more from external conditions than from person-role fit.',
        'Without clear prioritisation, occasional overload or unnecessary scatter can occur.',
      ],
      [
        'Only minor friction arises in practice, as working style and role fit well.',
        'Possible tensions concern pace and resources rather than fit itself.',
        'Risks lie primarily in operational execution, not in the fundamental fit.',
      ],
    ],
    EXACT_YELLOW: [
      [
        'In practice, priorities can shift slightly.',
        'Tasks tend to be weighted differently than the role foresees.',
        'Without clear direction, this shift becomes entrenched over time.',
      ],
      [
        'The person sets different priorities in practice than the role specifies.',
        'This can cause the weighting of tasks to shift gradually.',
        'Without clear direction, this shift becomes entrenched over time.',
      ],
    ],
    SOFT_YELLOW: [
      [
        'Decisions can be inconsistent depending on the situation.',
        'The role does not always act in the same direction in practice.',
        'This creates coordination effort and friction in the team.',
      ],
      [
        'Different priorities between person and role arise in individual situations.',
        'Decisions and approaches can become inconsistent as a result.',
        'These deviations create friction and coordination effort in practice.',
      ],
    ],
    MISMATCH: [
      [
        'Expectations and actual behaviour diverge permanently.',
        'Decisions, communication, and working style would noticeably drift from the role.',
        'This generates recurring conflicts and correction loops.',
      ],
      [
        'The role will likely be fulfilled differently than intended in practice.',
        'Expectations and actual behaviour diverge permanently.',
        'This generates recurring conflicts, correction loops, and increased management effort.',
      ],
    ],
  } satisfies Record<VariantLevel, string[][]>,

  impact: {
    decision: {
      PERFECT: [
        'Decision-making is consistent and matches the role.',
        'Decisions are made in the form the role requires.',
        'Decision logic fits the role and is viable in practice.',
      ],
      EXACT_YELLOW: [
        'Decision-making is basically aligned but weighted differently.',
        'The person decides broadly in line with the role but sets different accents.',
        'Decision logic matches at its core but is not fully congruent.',
      ],
      SOFT_YELLOW: [
        'Decision-making is partly compatible but not consistently role-appropriate.',
        'Relevant differences from the role logic appear in decisions.',
        'The person makes decisions partly in line but not consistently in the required form.',
      ],
      MISMATCH: [
        'The person makes decisions differently than the role requires.',
        'Decisions would be made differently in practice than the role demands.',
        'The way of deciding does not fit the task logic of the role.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    workstyle: {
      PERFECT: [
        'Working style is consistent and well compatible.',
        'Tasks are approached in the form the role requires.',
        'Approach matches the structure and rhythm of the role.',
      ],
      EXACT_YELLOW: [
        'Working style is basically right but weighted differently.',
        'The person works in the right direction but sets different priorities in execution.',
        'Approach is broadly right but not quite what the role calls for in practice.',
      ],
      SOFT_YELLOW: [
        'Working style is generally compatible but not consistently congruent.',
        'Differences appear in execution that are relevant for the role.',
        'Approach fits in parts but does not remain stable in the required form.',
      ],
      MISMATCH: [
        'Working style lies noticeably outside the role requirement.',
        'Tasks are approached differently than the role demands.',
        'The execution logic of the person does not fit the role.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    communication: {
      PERFECT: [
        'Communication is consistent and well compatible.',
        'Exchange and coordination happen in the form the role requires.',
        'Communication style supports the requirements of the role.',
      ],
      EXACT_YELLOW: [
        'Communication is basically aligned but dosed differently.',
        'The style of coordination is basically right but deviates in weighting.',
        'The person communicates broadly in line but sets different accents.',
      ],
      SOFT_YELLOW: [
        'Communication is partly fitting but does not consistently match the expected form.',
        'Differences appear in exchange that become noticeable in practice.',
        'Communication is compatible but not stable in the expected form.',
      ],
      MISMATCH: [
        'The person communicates differently than the role expects.',
        'Exchange and coordination happen differently than the role demands.',
        'Communication style does not fit the expected form of the role.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    culture: {
      PERFECT: [
        'Cultural impact supports the desired direction of the role.',
        'Collaboration and dynamics develop in the right direction.',
        'The person strengthens the team logic the role calls for.',
      ],
      EXACT_YELLOW: [
        'Cultural basic direction is right but dosed differently in practice.',
        'Team impact is basically right but sets different accents.',
        'The person supports the basic direction but slightly shifts the weighting in practice.',
      ],
      SOFT_YELLOW: [
        'Impact on collaboration and team culture is broadly viable but not fully congruent.',
        'Different dynamics emerge in practice than the role actually requires.',
        'Team impact fits in parts but does not remain consistently in the same direction.',
      ],
      MISMATCH: [
        'The person would develop the team in a different direction than the role intends.',
        'Collaboration develops differently than the role foresees.',
        'The person sets a different direction in the team than the role requires.',
      ],
    } satisfies Record<VariantLevel, string[]>,
    leadership: {
      PERFECT: [
        'Leadership impact is consistent and well compatible.',
        'Leadership operates in the direction the role requires.',
      ],
      EXACT_YELLOW: [
        'Leadership impact is basically right but weighted differently in practice.',
        'Leadership sets the right accents but doses them differently than the role foresees.',
      ],
      SOFT_YELLOW: [
        'Leadership impact is generally compatible but not consistently in the required form.',
        'Leadership fits parts of the role but does not remain stable in the expected form.',
      ],
      MISMATCH: [
        'Leadership impact does not correspond to what the role needs.',
        'The way of leading does not fit the requirements of the role.',
      ],
    } satisfies Record<VariantLevel, string[]>,
  },
};

export type FitSubtypeForVariant = 'PERFECT' | 'STRUCTURE_MATCH_INTENSITY_OFF' | 'PARTIAL_MATCH' | 'MISMATCH';

export function mapToVariantLevel(fitSubtype: FitSubtypeForVariant, fitLabel?: string): VariantLevel {
  if (fitSubtype === 'PERFECT') return 'PERFECT';
  if (fitSubtype === 'STRUCTURE_MATCH_INTENSITY_OFF') return 'EXACT_YELLOW';
  if (fitSubtype === 'PARTIAL_MATCH') {
    if (fitLabel === 'Nicht geeignet') return 'MISMATCH';
    return 'SOFT_YELLOW';
  }
  return 'MISMATCH';
}
