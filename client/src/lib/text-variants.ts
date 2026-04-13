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
