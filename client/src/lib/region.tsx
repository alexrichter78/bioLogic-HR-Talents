import { createContext, useContext, useState, type ReactNode } from "react";

export type Region = "DE" | "CH" | "AT" | "EN" | "FR" | "IT";

interface RegionContextType {
  region: Region;
  setRegion: (r: Region) => void;
  locale: string;
  regionLabel: string;
}

const REGION_MAP: Record<Region, { locale: string; label: string }> = {
  DE: { locale: "de-DE", label: "Deutschland" },
  CH: { locale: "de-CH", label: "Schweiz" },
  AT: { locale: "de-AT", label: "Österreich" },
  EN: { locale: "en-US", label: "English" },
  FR: { locale: "fr-FR", label: "Français" },
  IT: { locale: "it-IT", label: "Italiano" },
};

const RegionContext = createContext<RegionContextType | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>(() => {
    const stored = localStorage.getItem("appRegion");
    if (stored === "DE" || stored === "CH" || stored === "AT" || stored === "EN" || stored === "FR" || stored === "IT") return stored;
    return "DE";
  });

  const setRegion = (r: Region) => {
    setRegionState(r);
    localStorage.setItem("appRegion", r);
  };

  const info = REGION_MAP[region];

  return (
    <RegionContext.Provider value={{ region, setRegion, locale: info.locale, regionLabel: info.label }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}

type Replacer = string | ((...args: string[]) => string);
const SS_RULES: [RegExp, Replacer][] = [
  [/[Gg]rösst/g, (m) => m[0] === "G" ? "Größt" : "größt"],
  [/[Gg]rösser/g, (m) => m[0] === "G" ? "Größer" : "größer"],
  [/[Gg]rössen/g, (m) => m[0] === "G" ? "Größen" : "größen"],
  [/[Gg]ross/g, (m) => m[0] === "G" ? "Groß" : "groß"],
  [/[Mm]ässig/g, (m) => m[0] === "M" ? "Mäßig" : "mäßig"],
  [/[Mm]assnahm/g, (m) => m[0] === "M" ? "Maßnahm" : "maßnahm"],
  [/[Mm]assgeblich/g, (m) => m[0] === "M" ? "Maßgeblich" : "maßgeblich"],
  [/[Mm]assgeschneidert/g, (m) => m[0] === "M" ? "Maßgeschneidert" : "maßgeschneidert"],
  [/[Mm]assstäb/g, (m) => m[0] === "M" ? "Maßstäb" : "maßstäb"],
  [/[Mm]assstab/g, (m) => m[0] === "M" ? "Maßstab" : "maßstab"],
  [/\bMass\b/g, "Maß"],
  [/[Aa]usser/g, (m) => m[0] === "A" ? "Außer" : "außer"],
  [/[Aa]ussen\b/g, (m) => m[0] === "A" ? "Außen" : "außen"],
  [/[Gg]emäss/g, (m) => m[0] === "G" ? "Gemäß" : "gemäß"],
  [/[Ss]chliess/g, (m) => m[0] === "S" ? "Schließ" : "schließ"],
  [/[Ss]toss/g, (m) => m[0] === "S" ? "Stoß" : "stoß"],
  [/[Ss]trass/g, (m) => m[0] === "S" ? "Straß" : "straß"],
  [/[Hh]eisst/g, (m) => m[0] === "H" ? "Heißt" : "heißt"],
  [/\b[Ww]eiss\b/g, (m) => m[0] === "W" ? "Weiß" : "weiß"],
  [/\b[Ww]eiss([,.])/g, (m, p) => (m[0] === "W" ? "Weiß" : "weiß") + p],
  [/[Rr]eiss/g, (m) => m[0] === "R" ? "Reiß" : "reiß"],
  [/[Gg]iess/g, (m) => m[0] === "G" ? "Gieß" : "gieß"],
  [/[Ff]liess/g, (m) => m[0] === "F" ? "Fließ" : "fließ"],
  [/[Ss]chiess/g, (m) => m[0] === "S" ? "Schieß" : "schieß"],
  [/[Ss]chweiss/g, (m) => m[0] === "S" ? "Schweiß" : "schweiß"],
  [/[Vv]erstoss/g, (m) => m[0] === "V" ? "Verstoß" : "verstoß"],
  [/[Ee]rschliess/g, (m) => m[0] === "E" ? "Erschließ" : "erschließ"],
  [/[Gg]leichermassen/g, (m) => m[0] === "G" ? "Gleichermaßen" : "gleichermaßen"],
];

function ssToSz(text: string): string {
  let result = text;
  for (const [pattern, replacement] of SS_RULES) {
    result = result.replace(pattern, replacement as any);
  }
  return result;
}

export function useLocalizedText() {
  const { region } = useRegion();
  return (text: string) => {
    if (region === "CH" || region === "EN" || region === "FR" || region === "IT") return text;
    return ssToSz(text);
  };
}

export function localizeStr(text: string, region: Region): string {
  if (region === "CH" || region === "EN" || region === "FR" || region === "IT") return text;
  return ssToSz(text);
}

const ENGINE_VALUE_MAP_EN: Record<string, string> = {
  "Verstärkung": "Reinforcement",
  "Spannung": "Tension",
  "Transformation": "Transformation",
  "Ergänzung": "Complement",
  "Korrekturimpuls": "Corrective impulse",
  "Spannungsreiche Ergänzung": "Tension-rich complement",
  "Kritische Spannung": "Critical tension",
  "Spannungsreiche Abweichung": "Tension-rich deviation",
  "Stabile Passung": "Stable fit",
  "Anpassungsleistung": "Adaptive performance",
  "Hoch": "High",
  "hoch": "high",
  "Mittel": "Moderate",
  "mittel": "moderate",
  "Gering": "Low",
  "gering": "low",
  "Niedrig": "Low",
  "niedrig": "low",
  "Geeignet": "Suitable",
  "Bedingt geeignet": "Conditionally suitable",
  "Nicht geeignet": "Not suitable",
  "Gesamtpassung": "Overall fit",
  "Systemwirkung": "System impact",
  "Teamprofil": "Team profile",
  "Personenprofil": "Person profile",
  "Intensität": "Intensity",
  "Steuerungsaufwand": "Management effort",
  "Passend": "Suitable",
  "Teilweise passend": "Partially suitable",
  "Kritisch": "Critical",
  "Kein Ziel gewählt": "No goal selected",
  "Stabile Ergänzung": "Stable complement",
  "Ergänzung mit Spannung": "Complement under tension",
  "nicht bewertet": "not assessed",

  // ── Leadership levers (titles + descriptions) ──
  "Beziehungsrituale einführen": "Establish relational rituals",
  "Wöchentliche Teamrunde mit persönlichem Check-in. Das Team braucht Beziehungszeit, die die Führungskraft von sich aus nicht priorisiert.": "Hold a weekly team round with a personal check-in. The team needs time for personal connection that the leader doesn't naturally prioritise.",
  "Entscheidungstempo regulieren": "Regulate the pace of decisions",
  "Für Kernentscheidungen bewusst 24h Reflexionszeit einplanen. Das Team muss Tempo akzeptieren, aber die Führungskraft muss Dialog zulassen.": "Build in a deliberate 24-hour reflection window for core decisions. The team must accept the pace, but the leader must make room for dialogue.",
  "Delegationsklarheit schaffen": "Create clarity in delegation",
  "Entscheidungsbefugnisse schriftlich definieren: Was entscheidet die Führungskraft allein, was im Team? Reduziert stille Frustration.": "Define decision authority in writing: what does the leader decide alone, what is decided as a team? Reduces silent frustration.",
  "Feedback-Asymmetrie ausgleichen": "Balance the feedback asymmetry",
  "Aktiv nach emotionaler Stimmung fragen, nicht nur nach Ergebnissen. Das Team kommuniziert Belastung über Beziehungssignale.": "Actively ask about emotional climate, not just about results. The team signals strain through relational cues.",
  "80/20-Qualitätsstandard definieren": "Define an 80/20 quality standard",
  "Gemeinsam festlegen, welche Prozesse 100% Qualität brauchen und wo 80% reichen. Verhindert Überkontrolle und Tempoverlust.": "Jointly determine which processes require 100% quality and where 80% is enough. Prevents over-control and loss of pace.",
  "Entscheidungszeitfenster setzen": "Set decision time windows",
  "Maximale Entscheidungsdauer pro Thema definieren. Das Team braucht Analysezeit, die Führungskraft will Geschwindigkeit.": "Define a maximum decision duration per topic. The team needs analysis time, the leader wants speed.",
  "Priorisierung visualisieren": "Make priorities visible",
  "Kanban oder ähnliches Tool einführen: Das Team sieht Prioritäten, die Führungskraft sieht Fortschritt. Reduziert Nachfragen.": "Introduce Kanban or a similar tool: the team sees priorities, the leader sees progress. Reduces follow-up questions.",
  "Review-Rhythmus mit Zeitlimit": "Time-boxed review rhythm",
  "Feste Review-Termine mit klarem Zeitrahmen. Das Team bekommt Qualitätsraum, die Führungskraft behält das Tempo.": "Fixed review meetings within a clear time frame. The team gets room for quality, the leader keeps the pace.",
  "Entscheidungsfristen verbindlich machen": "Make decision deadlines binding",
  "Das Team erwartet schnelle Ansagen. Konsenssuche als Führungsstil wird als Zögern interpretiert. Klare Deadlines setzen.": "The team expects quick calls. Seeking consensus as a leadership style is read as hesitation. Set clear deadlines.",
  "Ergebnisorientierung sichtbar integrieren": "Make results-orientation visible",
  "Jedes Meeting mit konkretem Ergebnis beenden. Das Team misst Führung an Output, nicht an Prozessqualität.": "End every meeting with a concrete outcome. The team measures leadership by output, not by process quality.",
  "Eskalationswege definieren": "Define escalation paths",
  "Wann wird diskutiert, wann entscheidet die Führungskraft allein? Klare Regeln verhindern Blockaden und Frust.": "When is something discussed, when does the leader decide alone? Clear rules prevent gridlock and frustration.",
  "Erfolge sichtbar machen": "Make successes visible",
  "Quick Wins dokumentieren und kommunizieren. Stärkt die Akzeptanz der Führungskraft im ergebnisorientierten Team.": "Document and communicate quick wins. Strengthens the leader's standing in a results-driven team.",
  "Prozess-Standards definieren": "Define process standards",
  "Das Team erwartet klare Vorgaben, nicht Gesprächsangebote. Verbindliche Prozesse für Kernthemen etablieren.": "The team expects clear specifications, not conversational openings. Establish binding processes for core topics.",
  "Entscheidungslogik klären": "Clarify the decision logic",
  "Wann wird im Konsens entschieden, wann per Vorgabe? Das Team braucht Vorhersehbarkeit, die Führungskraft Flexibilität.": "When is something decided by consensus, when by directive? The team needs predictability, the leader flexibility.",
  "Review-Format standardisieren": "Standardise the review format",
  "Feste Struktur für Rückmeldungen: Kennzahlen + Feedback. Das Team will Daten, die Führungskraft will Dialog.": "Fixed structure for feedback: metrics plus qualitative input. The team wants data, the leader wants dialogue.",
  "Beziehung über Kompetenz aufbauen": "Build relationship through proven competence",
  "Im analytischen Team entsteht Vertrauen über fachliche Qualität. Beziehungsangebote erst nach bewiesener Kompetenz.": "In an analytical team, trust grows through professional quality. Personal rapport-building only after competence has been demonstrated.",
  "Tempo-Standards balancieren": "Balance pace and quality standards",
  "Nicht alles absichern – klare Bereiche definieren, wo Geschwindigkeit vor Qualität geht. Das Team erwartet Bewegung.": "Don't hedge everything – define clear areas where speed comes before perfection. The team expects momentum.",
  "Kontrollmechanismen reduzieren": "Reduce control mechanisms",
  "Mikromanagement wird als Misstrauen gewertet. Ergebniskontrolle statt Prozesskontrolle einführen.": "Micromanagement is read as distrust. Move from process control to outcome control.",
  "Entscheidungsgeschwindigkeit erhöhen": "Increase decision speed",
  "Bei 80% Datenlage entscheiden. Das Team verliert Respekt bei zu langer Analyse. Nachsteuern ist erlaubt.": "Decide with 80% of the data in hand. The team loses respect under prolonged analysis. Course corrections are allowed.",
  "Innovation zulassen": "Allow space for innovation",
  "Strukturierte Freiräume für Experimente schaffen. Das Team braucht Raum für schnelle Tests ohne Genehmigungsschleifen.": "Create structured room for experimentation. The team needs space for quick tests without approval loops.",
  "Beziehungsebene ritualisieren": "Ritualise the relational dimension",
  "Wöchentliches persönliches Gespräch, nicht nur Sachthemen. Das Team braucht emotionale Anschlussfähigkeit.": "Weekly personal conversation, not just on factual topics. The team needs emotional connection.",
  "Feedback mit Wärme verbinden": "Combine feedback with warmth",
  "Sachliche Rückmeldung wird als Kälte empfunden. Feedback immer mit persönlicher Wertschätzung rahmen.": "Purely factual feedback is perceived as cold. Always frame feedback with personal appreciation.",
  "Emotionale Signale lesen lernen": "Learn to read emotional signals",
  "Das Team kommuniziert Probleme über Stimmungsschwankungen, nicht über Berichte. Achtsame Beobachtung schulen.": "The team communicates problems through mood shifts, not reports. Train mindful observation.",
  "Teamevents nicht streichen": "Don't cut team events",
  "Informelle Teamzeit ist kein Luxus, sondern Arbeitsinfrastruktur in beziehungsorientierten Teams.": "Informal team time isn't a luxury – it's work infrastructure in relationship-oriented teams.",
  "Diversität bewusst einbauen": "Deliberately build in diversity",
  "Gleiche Dominanz verstärkt sich. Bewusst Gegenperspektiven einholen, z.B. durch externe Sparringspartner oder Rollen-Rotation.": "Identical dominance reinforces itself. Deliberately bring in opposing perspectives, e.g. via external sparring partners or role rotation.",
  "Blinde Flecken identifizieren": "Identify blind spots",
  "Gemeinsam benennen, welche Kompetenzen im System fehlen. Entwicklungsmassnahmen gezielt auf schwächere Bereiche ausrichten.": "Name jointly which competencies are missing in the system. Direct development measures specifically at the weaker areas.",
  "Korrektiv-Rolle definieren": "Define a corrective role",
  "Eine Person im Team als bewusstes Korrektiv benennen, die andere Perspektiven einbringt.": "Designate one person in the team as a deliberate corrective who brings in alternative perspectives.",
  "Regelmässige Systemreflexion": "Regular system reflection",
  "Quartalsweise prüfen, ob einseitige Verstärkung zu Fehlentwicklungen führt.": "Review quarterly whether one-sided reinforcement is producing imbalances.",
  "Erwartungen explizit klären": "Make expectations explicit",
  "Unterschiedliche Arbeitslogiken brauchen explizite Kommunikation über Prioritäten und Entscheidungswege.": "Different working logics require explicit communication about priorities and decision paths.",
  "Erste 30 Tage strukturieren": "Structure the first 30 days",
  "Klare Meilensteine für die Integration definieren. Ohne Struktur entsteht Unsicherheit auf beiden Seiten.": "Define clear milestones for integration. Without structure, uncertainty arises on both sides.",
  "Kommunikationsrhythmus festlegen": "Set a communication rhythm",
  "Feste Formate für Update, Feedback und Eskalation vereinbaren.": "Agree on fixed formats for updates, feedback and escalation.",
  "Erfolgsmetriken gemeinsam definieren": "Define success metrics together",
  "Was bedeutet Erfolg für die Führungskraft und was für das Team? Alignment herstellen.": "What does success mean for the leader, and what for the team? Create alignment.",
  "Change-Kommunikation etablieren": "Establish change communication",
  "Bei hoher Systemveränderung: Regelmässig den Stand kommunizieren, Unsicherheiten adressieren, Widerstände ernst nehmen.": "Under significant system change: communicate the status regularly, address uncertainties, take resistance seriously.",
};

const ENGINE_VALUE_MAP_FR: Record<string, string> = {
  "Verstärkung": "Renforcement",
  "Spannung": "Tension",
  "Transformation": "Transformation",
  "Ergänzung": "Complémentarité",
  "Korrekturimpuls": "Impulsion correctrice",
  "Spannungsreiche Ergänzung": "Complémentarité sous tension",
  "Kritische Spannung": "Tension critique",
  "Spannungsreiche Abweichung": "Écart sous tension",
  "Stabile Passung": "Adéquation stable",
  "Anpassungsleistung": "Capacité d'adaptation",
  "Hoch": "Élevé",
  "hoch": "élevé",
  "Mittel": "Moyen",
  "mittel": "moyen",
  "Gering": "Faible",
  "gering": "faible",
  "Niedrig": "Bas",
  "niedrig": "bas",
  "Geeignet": "Adapté",
  "Bedingt geeignet": "Partiellement adapté",
  "Nicht geeignet": "Non adapté",
  "Gesamtpassung": "Adéquation globale",
  "Systemwirkung": "Impact systémique",
  "Teamprofil": "Profil d'équipe",
  "Personenprofil": "Profil personnel",
  "Intensität": "Intensité",
  "Steuerungsaufwand": "Effort de pilotage",
  "Passend": "Adapté",
  "Teilweise passend": "Partiellement adapté",
  "Kritisch": "Critique",
  "Kein Ziel gewählt": "Aucun objectif sélectionné",
  "Stabile Ergänzung": "Complémentarité stable",
  "Ergänzung mit Spannung": "Complémentarité sous tension",
  "nicht bewertet": "non évalué",

  // ── Leviers de leadership (titres + descriptions) ──
  "Beziehungsrituale einführen": "Instaurer des rituels relationnels",
  "Wöchentliche Teamrunde mit persönlichem Check-in. Das Team braucht Beziehungszeit, die die Führungskraft von sich aus nicht priorisiert.": "Réunion d'équipe hebdomadaire avec un check-in personnel. L'équipe a besoin de temps relationnel que le manager ne priorise pas spontanément.",
  "Entscheidungstempo regulieren": "Réguler le rythme des décisions",
  "Für Kernentscheidungen bewusst 24h Reflexionszeit einplanen. Das Team muss Tempo akzeptieren, aber die Führungskraft muss Dialog zulassen.": "Prévoir délibérément 24 h de réflexion pour les décisions clés. L'équipe doit accepter le rythme, mais le manager doit laisser place au dialogue.",
  "Delegationsklarheit schaffen": "Clarifier la délégation",
  "Entscheidungsbefugnisse schriftlich definieren: Was entscheidet die Führungskraft allein, was im Team? Reduziert stille Frustration.": "Définir par écrit les pouvoirs de décision : qu'est-ce que le manager tranche seul, qu'est-ce qui se décide en équipe ? Réduit les frustrations tacites.",
  "Feedback-Asymmetrie ausgleichen": "Équilibrer l'asymétrie du feedback",
  "Aktiv nach emotionaler Stimmung fragen, nicht nur nach Ergebnissen. Das Team kommuniziert Belastung über Beziehungssignale.": "Interroger activement le climat émotionnel, pas seulement les résultats. L'équipe exprime ses tensions par des signaux relationnels.",
  "80/20-Qualitätsstandard definieren": "Définir un standard qualité 80/20",
  "Gemeinsam festlegen, welche Prozesse 100% Qualität brauchen und wo 80% reichen. Verhindert Überkontrolle und Tempoverlust.": "Déterminer ensemble quels processus exigent 100 % de qualité et où 80 % suffisent. Évite le sur-contrôle et la perte de rythme.",
  "Entscheidungszeitfenster setzen": "Fixer des fenêtres de décision",
  "Maximale Entscheidungsdauer pro Thema definieren. Das Team braucht Analysezeit, die Führungskraft will Geschwindigkeit.": "Définir une durée maximale de décision par sujet. L'équipe a besoin de temps d'analyse, le manager veut de la vitesse.",
  "Priorisierung visualisieren": "Rendre les priorités visibles",
  "Kanban oder ähnliches Tool einführen: Das Team sieht Prioritäten, die Führungskraft sieht Fortschritt. Reduziert Nachfragen.": "Introduire Kanban ou un outil équivalent : l'équipe voit les priorités, le manager voit l'avancement. Réduit les relances.",
  "Review-Rhythmus mit Zeitlimit": "Cadence de revue avec limite de temps",
  "Feste Review-Termine mit klarem Zeitrahmen. Das Team bekommt Qualitätsraum, die Führungskraft behält das Tempo.": "Réunions de revue fixes avec un cadre temporel clair. L'équipe dispose d'un espace qualité, le manager garde le rythme.",
  "Entscheidungsfristen verbindlich machen": "Rendre les échéances de décision contraignantes",
  "Das Team erwartet schnelle Ansagen. Konsenssuche als Führungsstil wird als Zögern interpretiert. Klare Deadlines setzen.": "L'équipe attend des décisions rapides. La recherche de consensus est perçue comme de l'hésitation. Fixer des échéances claires.",
  "Ergebnisorientierung sichtbar integrieren": "Intégrer visiblement l'orientation résultats",
  "Jedes Meeting mit konkretem Ergebnis beenden. Das Team misst Führung an Output, nicht an Prozessqualität.": "Conclure chaque réunion par un résultat concret. L'équipe juge le leadership aux livrables, pas à la qualité du processus.",
  "Eskalationswege definieren": "Définir les voies d'escalade",
  "Wann wird diskutiert, wann entscheidet die Führungskraft allein? Klare Regeln verhindern Blockaden und Frust.": "Quand débat-on, quand le manager décide-t-il seul ? Des règles claires évitent blocages et frustration.",
  "Erfolge sichtbar machen": "Rendre les succès visibles",
  "Quick Wins dokumentieren und kommunizieren. Stärkt die Akzeptanz der Führungskraft im ergebnisorientierten Team.": "Documenter et communiquer les quick wins. Renforce la légitimité du manager dans une équipe orientée résultats.",
  "Prozess-Standards definieren": "Définir des standards de processus",
  "Das Team erwartet klare Vorgaben, nicht Gesprächsangebote. Verbindliche Prozesse für Kernthemen etablieren.": "L'équipe attend des consignes claires, pas des invitations à discuter. Établir des processus contraignants pour les sujets clés.",
  "Entscheidungslogik klären": "Clarifier la logique de décision",
  "Wann wird im Konsens entschieden, wann per Vorgabe? Das Team braucht Vorhersehbarkeit, die Führungskraft Flexibilität.": "Quand décide-t-on par consensus, quand par directive ? L'équipe a besoin de prévisibilité, le manager de flexibilité.",
  "Review-Format standardisieren": "Standardiser le format de revue",
  "Feste Struktur für Rückmeldungen: Kennzahlen + Feedback. Das Team will Daten, die Führungskraft will Dialog.": "Structure fixe pour les retours : indicateurs + feedback. L'équipe veut des données, le manager veut du dialogue.",
  "Beziehung über Kompetenz aufbauen": "Construire la relation par la compétence démontrée",
  "Im analytischen Team entsteht Vertrauen über fachliche Qualität. Beziehungsangebote erst nach bewiesener Kompetenz.": "Dans une équipe analytique, la confiance naît de la qualité professionnelle. Les ouvertures relationnelles viennent après la compétence démontrée.",
  "Tempo-Standards balancieren": "Équilibrer rythme et standards de qualité",
  "Nicht alles absichern – klare Bereiche definieren, wo Geschwindigkeit vor Qualität geht. Das Team erwartet Bewegung.": "Ne pas tout sécuriser – définir clairement les domaines où la vitesse prime sur la perfection. L'équipe attend du mouvement.",
  "Kontrollmechanismen reduzieren": "Réduire les mécanismes de contrôle",
  "Mikromanagement wird als Misstrauen gewertet. Ergebniskontrolle statt Prozesskontrolle einführen.": "Le micromanagement est perçu comme de la défiance. Passer du contrôle du processus au contrôle des résultats.",
  "Entscheidungsgeschwindigkeit erhöhen": "Accélérer la prise de décision",
  "Bei 80% Datenlage entscheiden. Das Team verliert Respekt bei zu langer Analyse. Nachsteuern ist erlaubt.": "Décider avec 80 % des données en main. L'équipe perd le respect en cas d'analyse trop longue. Les ajustements sont permis.",
  "Innovation zulassen": "Laisser place à l'innovation",
  "Strukturierte Freiräume für Experimente schaffen. Das Team braucht Raum für schnelle Tests ohne Genehmigungsschleifen.": "Créer des espaces structurés pour l'expérimentation. L'équipe a besoin de place pour des tests rapides sans boucles de validation.",
  "Beziehungsebene ritualisieren": "Ritualiser la dimension relationnelle",
  "Wöchentliches persönliches Gespräch, nicht nur Sachthemen. Das Team braucht emotionale Anschlussfähigkeit.": "Entretien personnel hebdomadaire, pas uniquement sur les sujets factuels. L'équipe a besoin d'un lien émotionnel.",
  "Feedback mit Wärme verbinden": "Associer le feedback à de la chaleur",
  "Sachliche Rückmeldung wird als Kälte empfunden. Feedback immer mit persönlicher Wertschätzung rahmen.": "Un retour purement factuel est perçu comme froid. Encadrer toujours le feedback par une marque d'estime personnelle.",
  "Emotionale Signale lesen lernen": "Apprendre à lire les signaux émotionnels",
  "Das Team kommuniziert Probleme über Stimmungsschwankungen, nicht über Berichte. Achtsame Beobachtung schulen.": "L'équipe exprime ses problèmes par les variations d'humeur, pas par des rapports. Former une observation attentive.",
  "Teamevents nicht streichen": "Ne pas supprimer les événements d'équipe",
  "Informelle Teamzeit ist kein Luxus, sondern Arbeitsinfrastruktur in beziehungsorientierten Teams.": "Le temps d'équipe informel n'est pas un luxe : c'est une infrastructure de travail dans les équipes orientées relation.",
  "Diversität bewusst einbauen": "Intégrer délibérément de la diversité",
  "Gleiche Dominanz verstärkt sich. Bewusst Gegenperspektiven einholen, z.B. durch externe Sparringspartner oder Rollen-Rotation.": "Une dominance identique se renforce d'elle-même. Solliciter délibérément des perspectives contraires, par ex. via des sparring-partners externes ou la rotation des rôles.",
  "Blinde Flecken identifizieren": "Identifier les angles morts",
  "Gemeinsam benennen, welche Kompetenzen im System fehlen. Entwicklungsmassnahmen gezielt auf schwächere Bereiche ausrichten.": "Nommer ensemble les compétences absentes du système. Cibler les mesures de développement sur les zones les plus faibles.",
  "Korrektiv-Rolle definieren": "Définir un rôle de contrepoids",
  "Eine Person im Team als bewusstes Korrektiv benennen, die andere Perspektiven einbringt.": "Désigner une personne de l'équipe comme contrepoids délibéré, chargée d'apporter d'autres perspectives.",
  "Regelmässige Systemreflexion": "Réflexion systémique régulière",
  "Quartalsweise prüfen, ob einseitige Verstärkung zu Fehlentwicklungen führt.": "Vérifier chaque trimestre si un renforcement unilatéral conduit à des dérives.",
  "Erwartungen explizit klären": "Expliciter les attentes",
  "Unterschiedliche Arbeitslogiken brauchen explizite Kommunikation über Prioritäten und Entscheidungswege.": "Des logiques de travail différentes exigent une communication explicite sur les priorités et les voies de décision.",
  "Erste 30 Tage strukturieren": "Structurer les 30 premiers jours",
  "Klare Meilensteine für die Integration definieren. Ohne Struktur entsteht Unsicherheit auf beiden Seiten.": "Définir des jalons clairs pour l'intégration. Sans structure, l'incertitude s'installe des deux côtés.",
  "Kommunikationsrhythmus festlegen": "Établir un rythme de communication",
  "Feste Formate für Update, Feedback und Eskalation vereinbaren.": "Convenir de formats fixes pour les points d'avancement, le feedback et l'escalade.",
  "Erfolgsmetriken gemeinsam definieren": "Définir ensemble les indicateurs de succès",
  "Was bedeutet Erfolg für die Führungskraft und was für das Team? Alignment herstellen.": "Que signifie le succès pour le manager et pour l'équipe ? Créer l'alignement.",
  "Change-Kommunikation etablieren": "Mettre en place une communication de changement",
  "Bei hoher Systemveränderung: Regelmässig den Stand kommunizieren, Unsicherheiten adressieren, Widerstände ernst nehmen.": "En cas de fort changement systémique : communiquer régulièrement l'état d'avancement, traiter les incertitudes, prendre les résistances au sérieux.",
};

const ENGINE_VALUE_MAP_IT: Record<string, string> = {
  "Verstärkung": "Potenziamento",
  "Spannung": "Tensione",
  "Transformation": "Trasformazione",
  "Ergänzung": "Complementarità",
  "Korrekturimpuls": "Impulso correttivo",
  "Spannungsreiche Ergänzung": "Complementarità sotto tensione",
  "Kritische Spannung": "Tensione critica",
  "Spannungsreiche Abweichung": "Scarto sotto tensione",
  "Stabile Passung": "Adeguatezza stabile",
  "Anpassungsleistung": "Capacità di adattamento",
  "Hoch": "Elevato",
  "hoch": "elevato",
  "Mittel": "Moderato",
  "mittel": "moderato",
  "Gering": "Basso",
  "gering": "basso",
  "Niedrig": "Basso",
  "niedrig": "basso",
  "Geeignet": "Adatto",
  "Bedingt geeignet": "Parzialmente adatto",
  "Nicht geeignet": "Non adatto",
  "Gesamtpassung": "Adeguatezza globale",
  "Systemwirkung": "Impatto sistemico",
  "Teamprofil": "Profilo del team",
  "Personenprofil": "Profilo della persona",
  "Intensität": "Intensità",
  "Steuerungsaufwand": "Sforzo di gestione",
  "Passend": "Adatto",
  "Bedingt passend": "Parzialmente adatto",
  "Nicht passend": "Non adatto",
  "Teilweise passend": "Parzialmente adatto",
  "Kritisch": "Critico",
  "Kein Ziel gewählt": "Nessun obiettivo selezionato",
  "Stabile Ergänzung": "Complementarità stabile",
  "Ergänzung mit Spannung": "Complementarità sotto tensione",
  "nicht bewertet": "non valutato",
  "Integrationsaufwand": "Sforzo di integrazione",

  // ── Leve di leadership (titoli + descrizioni) ──
  "Beziehungsrituale einführen": "Introdurre rituali relazionali",
  "Wöchentliche Teamrunde mit persönlichem Check-in. Das Team braucht Beziehungszeit, die die Führungskraft von sich aus nicht priorisiert.": "Riunione settimanale con check-in personale. Il team ha bisogno di tempo relazionale che il responsabile non privilegia spontaneamente.",
  "Entscheidungstempo regulieren": "Regolare il ritmo delle decisioni",
  "Für Kernentscheidungen bewusst 24h Reflexionszeit einplanen. Das Team muss Tempo akzeptieren, aber die Führungskraft muss Dialog zulassen.": "Prevedere intenzionalmente 24 ore di riflessione per le decisioni chiave. Il team deve accettare il ritmo, ma il responsabile deve lasciare spazio al dialogo.",
  "Delegationsklarheit schaffen": "Chiarire la delega",
  "Entscheidungsbefugnisse schriftlich definieren: Was entscheidet die Führungskraft allein, was im Team? Reduziert stille Frustration.": "Definire per iscritto le competenze decisionali: cosa decide il responsabile da solo, cosa il team? Riduce le frustrazioni silenziose.",
  "Feedback-Asymmetrie ausgleichen": "Riequilibrare l'asimmetria del feedback",
  "Aktiv nach emotionaler Stimmung fragen, nicht nur nach Ergebnissen. Das Team kommuniziert Belastung über Beziehungssignale.": "Chiedere attivamente del clima emotivo, non solo dei risultati. Il team comunica il disagio attraverso segnali relazionali.",
  "80/20-Qualitätsstandard definieren": "Definire uno standard qualitativo 80/20",
  "Gemeinsam festlegen, welche Prozesse 100% Qualität brauchen und wo 80% reichen. Verhindert Überkontrolle und Tempoverlust.": "Stabilire insieme quali processi richiedono il 100 % di qualità e dove basta l'80 %. Evita il controllo eccessivo e la perdita di ritmo.",
  "Entscheidungszeitfenster setzen": "Stabilire finestre temporali per le decisioni",
  "Maximale Entscheidungsdauer pro Thema definieren. Das Team braucht Analysezeit, die Führungskraft will Geschwindigkeit.": "Definire una durata massima di decisione per argomento. Il team ha bisogno di tempo per analizzare, il responsabile vuole velocità.",
  "Priorisierung visualisieren": "Rendere visibili le priorità",
  "Kanban oder ähnliches Tool einführen: Das Team sieht Prioritäten, die Führungskraft sieht Fortschritt. Reduziert Nachfragen.": "Introdurre Kanban o uno strumento analogo: il team vede le priorità, il responsabile vede l'avanzamento. Riduce le richieste di aggiornamento.",
  "Review-Rhythmus mit Zeitlimit": "Ritmo di revisione con limite temporale",
  "Feste Review-Termine mit klarem Zeitrahmen. Das Team bekommt Qualitätsraum, die Führungskraft behält das Tempo.": "Riunioni di revisione fisse con un quadro temporale chiaro. Il team ottiene spazio qualitativo, il responsabile mantiene il ritmo.",
  "Entscheidungsfristen verbindlich machen": "Rendere vincolanti le scadenze decisionali",
  "Das Team erwartet schnelle Ansagen. Konsenssuche als Führungsstil wird als Zögern interpretiert. Klare Deadlines setzen.": "Il team si aspetta decisioni rapide. La ricerca del consenso come stile di guida viene letta come esitazione. Fissare scadenze chiare.",
  "Ergebnisorientierung sichtbar integrieren": "Integrare visibilmente l'orientamento ai risultati",
  "Jedes Meeting mit konkretem Ergebnis beenden. Das Team misst Führung an Output, nicht an Prozessqualität.": "Concludere ogni riunione con un risultato concreto. Il team valuta la leadership dai risultati, non dalla qualità del processo.",
  "Eskalationswege definieren": "Definire i percorsi di escalation",
  "Wann wird diskutiert, wann entscheidet die Führungskraft allein? Klare Regeln verhindern Blockaden und Frust.": "Quando si discute, quando decide il responsabile da solo? Regole chiare evitano blocchi e frustrazione.",
  "Erfolge sichtbar machen": "Rendere visibili i successi",
  "Quick Wins dokumentieren und kommunizieren. Stärkt die Akzeptanz der Führungskraft im ergebnisorientierten Team.": "Documentare e comunicare i quick win. Rafforza la credibilità del responsabile in un team orientato ai risultati.",
  "Prozess-Standards definieren": "Definire standard di processo",
  "Das Team erwartet klare Vorgaben, nicht Gesprächsangebote. Verbindliche Prozesse für Kernthemen etablieren.": "Il team si aspetta indicazioni chiare, non inviti al dialogo. Stabilire processi vincolanti per i temi centrali.",
  "Entscheidungslogik klären": "Chiarire la logica decisionale",
  "Wann wird im Konsens entschieden, wann per Vorgabe? Das Team braucht Vorhersehbarkeit, die Führungskraft Flexibilität.": "Quando si decide per consenso, quando per direttiva? Il team ha bisogno di prevedibilità, il responsabile di flessibilità.",
  "Review-Format standardisieren": "Standardizzare il formato della revisione",
  "Feste Struktur für Rückmeldungen: Kennzahlen + Feedback. Das Team will Daten, die Führungskraft will Dialog.": "Struttura fissa per i ritorni: indicatori + feedback. Il team vuole dati, il responsabile vuole dialogo.",
  "Beziehung über Kompetenz aufbauen": "Costruire la relazione attraverso la competenza dimostrata",
  "Im analytischen Team entsteht Vertrauen über fachliche Qualität. Beziehungsangebote erst nach bewiesener Kompetenz.": "In un team analitico la fiducia nasce dalla qualità professionale. Gli inviti relazionali solo dopo aver dimostrato la competenza.",
  "Tempo-Standards balancieren": "Bilanciare ritmo e standard qualitativi",
  "Nicht alles absichern – klare Bereiche definieren, wo Geschwindigkeit vor Qualität geht. Das Team erwartet Bewegung.": "Non blindare tutto – definire chiaramente le aree in cui la velocità conta più della perfezione. Il team si aspetta movimento.",
  "Kontrollmechanismen reduzieren": "Ridurre i meccanismi di controllo",
  "Mikromanagement wird als Misstrauen gewertet. Ergebniskontrolle statt Prozesskontrolle einführen.": "Il micromanagement viene percepito come sfiducia. Passare dal controllo di processo al controllo dei risultati.",
  "Entscheidungsgeschwindigkeit erhöhen": "Aumentare la velocità decisionale",
  "Bei 80% Datenlage entscheiden. Das Team verliert Respekt bei zu langer Analyse. Nachsteuern ist erlaubt.": "Decidere con l'80 % dei dati disponibili. Il team perde rispetto se l'analisi si prolunga troppo. Le correzioni di rotta sono ammesse.",
  "Innovation zulassen": "Lasciare spazio all'innovazione",
  "Strukturierte Freiräume für Experimente schaffen. Das Team braucht Raum für schnelle Tests ohne Genehmigungsschleifen.": "Creare spazi strutturati per la sperimentazione. Il team ha bisogno di margine per test rapidi senza cicli di approvazione.",
  "Beziehungsebene ritualisieren": "Ritualizzare la dimensione relazionale",
  "Wöchentliches persönliches Gespräch, nicht nur Sachthemen. Das Team braucht emotionale Anschlussfähigkeit.": "Conversazione personale settimanale, non solo sui temi di lavoro. Il team ha bisogno di connessione emotiva.",
  "Feedback mit Wärme verbinden": "Unire il feedback al calore",
  "Sachliche Rückmeldung wird als Kälte empfunden. Feedback immer mit persönlicher Wertschätzung rahmen.": "Un feedback puramente fattuale viene percepito come freddo. Inquadrare sempre il feedback con apprezzamento personale.",
  "Emotionale Signale lesen lernen": "Imparare a leggere i segnali emotivi",
  "Das Team kommuniziert Probleme über Stimmungsschwankungen, nicht über Berichte. Achtsame Beobachtung schulen.": "Il team comunica i problemi attraverso oscillazioni d'umore, non con report. Allenare l'osservazione consapevole.",
  "Teamevents nicht streichen": "Non eliminare gli eventi di team",
  "Informelle Teamzeit ist kein Luxus, sondern Arbeitsinfrastruktur in beziehungsorientierten Teams.": "Il tempo informale di team non è un lusso, ma un'infrastruttura di lavoro nei team orientati alla relazione.",
  "Diversität bewusst einbauen": "Integrare consapevolmente la diversità",
  "Gleiche Dominanz verstärkt sich. Bewusst Gegenperspektiven einholen, z.B. durch externe Sparringspartner oder Rollen-Rotation.": "La stessa dominanza si rafforza da sola. Cercare consapevolmente prospettive contrarie, ad es. tramite sparring partner esterni o rotazione dei ruoli.",
  "Blinde Flecken identifizieren": "Individuare i punti ciechi",
  "Gemeinsam benennen, welche Kompetenzen im System fehlen. Entwicklungsmassnahmen gezielt auf schwächere Bereiche ausrichten.": "Identificare insieme quali competenze mancano nel sistema. Orientare le misure di sviluppo specificamente sulle aree più deboli.",
  "Korrektiv-Rolle definieren": "Definire un ruolo di contrappeso",
  "Eine Person im Team als bewusstes Korrektiv benennen, die andere Perspektiven einbringt.": "Designare una persona del team come contrappeso consapevole, incaricata di portare prospettive alternative.",
  "Regelmässige Systemreflexion": "Riflessione sistemica regolare",
  "Quartalsweise prüfen, ob einseitige Verstärkung zu Fehlentwicklungen führt.": "Verificare trimestralmente se un rafforzamento unilaterale sta producendo derive.",
  "Erwartungen explizit klären": "Esplicitare le aspettative",
  "Unterschiedliche Arbeitslogiken brauchen explizite Kommunikation über Prioritäten und Entscheidungswege.": "Logiche di lavoro diverse richiedono una comunicazione esplicita su priorità e percorsi decisionali.",
  "Erste 30 Tage strukturieren": "Strutturare i primi 30 giorni",
  "Klare Meilensteine für die Integration definieren. Ohne Struktur entsteht Unsicherheit auf beiden Seiten.": "Definire chiari traguardi per l'integrazione. Senza struttura nasce incertezza da entrambe le parti.",
  "Kommunikationsrhythmus festlegen": "Definire un ritmo di comunicazione",
  "Feste Formate für Update, Feedback und Eskalation vereinbaren.": "Concordare formati fissi per aggiornamenti, feedback ed escalation.",
  "Erfolgsmetriken gemeinsam definieren": "Definire insieme gli indicatori di successo",
  "Was bedeutet Erfolg für die Führungskraft und was für das Team? Alignment herstellen.": "Cosa significa successo per il responsabile e cosa per il team? Creare allineamento.",
  "Change-Kommunikation etablieren": "Istituire una comunicazione del cambiamento",
  "Bei hoher Systemveränderung: Regelmässig den Stand kommunizieren, Unsicherheiten adressieren, Widerstände ernst nehmen.": "In caso di forte cambiamento sistemico: comunicare regolarmente lo stato, affrontare le incertezze, prendere sul serio le resistenze.",
};

export function translateEngineValue(value: string | null | undefined, region: Region): string {
  if (!value) return value ?? "";
  if (region === "EN") return ENGINE_VALUE_MAP_EN[value] ?? value;
  if (region === "FR") return ENGINE_VALUE_MAP_FR[value] ?? value;
  if (region === "IT") return ENGINE_VALUE_MAP_IT[value] ?? value;
  return value;
}

export function localizeDeep<T>(obj: T, region: Region): T {
  if (typeof obj === "string") {
    const s = localizeStr(obj, region);
    if (region === "FR" || region === "EN" || region === "IT") return translateEngineValue(s, region) as unknown as T;
    return s as unknown as T;
  }
  if (Array.isArray(obj)) return obj.map(item => localizeDeep(item, region)) as unknown as T;
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = localizeDeep(v, region);
    }
    return out as T;
  }
  return obj;
}
