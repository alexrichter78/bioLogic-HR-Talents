type KompetenzTyp = "Impulsiv" | "Intuitiv" | "Analytisch";
type Niveau = "Niedrig" | "Mittel" | "Hoch";
type KompetenzItem = { name: string; kompetenz: KompetenzTyp; niveau: Niveau };
type KompetenzResult = { haupt: KompetenzItem[]; neben: KompetenzItem[]; fuehrung?: KompetenzItem[] };

const BERUFS_PROFILE: Record<string, {
  haupt: [string, KompetenzTyp, Niveau][];
  bias?: { imp: number; int: number; ana: number };
}> = {
  "projektleiter": {
    haupt: [
      ["Planung und Steuerung von Projektphasen inkl. Meilenstein-Tracking und Ressourcenallokation", "Analytisch", "Hoch"],
      ["Erstellung und Pflege von Projektplänen, Gantt-Charts und Arbeitspaketen im PM-Tool", "Analytisch", "Hoch"],
      ["Durchführung von Risikoanalysen und Ableitung präventiver Maßnahmen zur Projektsicherung", "Analytisch", "Hoch"],
      ["Steuerung des Projektbudgets inkl. Soll-Ist-Vergleich und Kostenprognosen", "Analytisch", "Mittel"],
      ["Erstellung von Status-Reports und Management-Summaries für Auftraggeber und Stakeholder", "Analytisch", "Mittel"],
      ["Moderation von Projektmeetings und Workshops zur Abstimmung von Arbeitsergebnissen", "Intuitiv", "Hoch"],
      ["Stakeholder-Management und regelmäßige Kommunikation mit Auftraggebern und Fachbereichen", "Intuitiv", "Hoch"],
      ["Führung und Koordination des Projektteams über Fachbereiche und Standorte hinweg", "Impulsiv", "Hoch"],
      ["Eskalation kritischer Themen und Herbeiführung von Entscheidungen bei Zielkonflikten", "Impulsiv", "Hoch"],
      ["Steuerung externer Dienstleister und Verhandlung von Leistungsumfängen und Terminen", "Impulsiv", "Mittel"],
      ["Definition und Abstimmung von Projektzielen, Scope und Erfolgskriterien", "Analytisch", "Mittel"],
      ["Koordination von Abhängigkeiten zwischen Teilprojekten und Arbeitspaketen", "Analytisch", "Mittel"],
      ["Durchführung von Lessons-Learned-Workshops und Dokumentation für künftige Projekte", "Intuitiv", "Niedrig"],
      ["Qualitätssicherung der Projektergebnisse anhand definierter Abnahmekriterien", "Analytisch", "Mittel"],
      ["Identifikation und Umsetzung von Change Requests inkl. Auswirkungsanalyse", "Impulsiv", "Mittel"],
    ],
    bias: { imp: 30, int: 25, ana: 45 },
  },
  "softwareentwickler": {
    haupt: [
      ["Entwicklung und Implementierung von Softwarekomponenten nach technischer Spezifikation", "Analytisch", "Hoch"],
      ["Code-Reviews durchführen und Qualitätsstandards im Team sicherstellen", "Analytisch", "Hoch"],
      ["Design und Umsetzung von Datenbank-Schemas und API-Schnittstellen", "Analytisch", "Hoch"],
      ["Analyse und Behebung von Software-Fehlern durch systematisches Debugging", "Analytisch", "Hoch"],
      ["Erstellung und Pflege von Unit-Tests und Integrationstests zur Qualitätssicherung", "Analytisch", "Hoch"],
      ["Technische Dokumentation von Architekturentscheidungen und Schnittstellen", "Analytisch", "Mittel"],
      ["Bewertung und Auswahl geeigneter Technologien und Frameworks für Projektanforderungen", "Analytisch", "Hoch"],
      ["Durchführung von Performance-Analysen und Optimierung kritischer Systemkomponenten", "Analytisch", "Mittel"],
      ["Abstimmung technischer Anforderungen mit Product Ownern und Fachbereichen", "Intuitiv", "Mittel"],
      ["Pair-Programming und Wissenstransfer im Entwicklungsteam", "Intuitiv", "Mittel"],
      ["Teilnahme an agilen Zeremonien wie Sprint Planning, Daily und Retrospektiven", "Intuitiv", "Niedrig"],
      ["Umsetzung von CI/CD-Pipelines und Automatisierung von Build- und Deployment-Prozessen", "Analytisch", "Mittel"],
      ["Refactoring bestehender Codebasen zur Verbesserung von Wartbarkeit und Lesbarkeit", "Analytisch", "Mittel"],
      ["Eigenständige Recherche und Prototyping neuer technischer Lösungsansätze", "Impulsiv", "Niedrig"],
      ["Monitoring und Analyse von Produktionssystemen zur Fehlervermeidung", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 10, int: 15, ana: 75 },
  },
  "vertriebsleiter": {
    haupt: [
      ["Entwicklung und Umsetzung der Vertriebsstrategie zur Erreichung der Umsatzziele", "Impulsiv", "Hoch"],
      ["Führung und Steuerung des Vertriebsteams inkl. Zielvereinbarung und Performance-Tracking", "Impulsiv", "Hoch"],
      ["Verhandlung und Abschluss strategischer Kundenverträge und Rahmenvereinbarungen", "Impulsiv", "Hoch"],
      ["Aufbau und Pflege von Schlüsselkundenbeziehungen auf Entscheiderebene", "Intuitiv", "Hoch"],
      ["Analyse von Markt- und Wettbewerbsdaten zur Identifikation von Wachstumschancen", "Analytisch", "Hoch"],
      ["Steuerung der Vertriebspipeline und Forecast-Erstellung für die Geschäftsführung", "Analytisch", "Hoch"],
      ["Coaching und Entwicklung der Vertriebsmitarbeiter in Verkaufstechniken und Kundenansprache", "Intuitiv", "Mittel"],
      ["Planung und Durchführung von Vertriebskampagnen und Markteinführungsaktivitäten", "Impulsiv", "Mittel"],
      ["Preisgestaltung und Konditionsverhandlung unter Berücksichtigung von Deckungsbeiträgen", "Analytisch", "Mittel"],
      ["Reporting der Vertriebskennzahlen und Ableitung operativer Maßnahmen", "Analytisch", "Mittel"],
      ["Koordination mit Marketing, Produktmanagement und Innendienst zur Kundenzufriedenheit", "Intuitiv", "Mittel"],
      ["Erschließung neuer Märkte und Vertriebskanäle im In- und Ausland", "Impulsiv", "Mittel"],
      ["Durchsetzung von Preiserhöhungen und Konditionsanpassungen bei Bestandskunden", "Impulsiv", "Mittel"],
      ["Teilnahme an Messen und Branchenevents zur Netzwerkpflege und Neukundengewinnung", "Intuitiv", "Niedrig"],
      ["Budgetplanung und Kostensteuerung der Vertriebsorganisation", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 45, int: 25, ana: 30 },
  },
  "controller": {
    haupt: [
      ["Erstellung von Monats-, Quartals- und Jahresabschlussberichten inkl. Abweichungsanalysen", "Analytisch", "Hoch"],
      ["Aufbau und Pflege von Planungs- und Forecast-Modellen für Umsatz und Kosten", "Analytisch", "Hoch"],
      ["Durchführung von Soll-Ist-Vergleichen und Identifikation von Ergebnisabweichungen", "Analytisch", "Hoch"],
      ["Entwicklung und Monitoring von KPI-Systemen zur Unternehmenssteuerung", "Analytisch", "Hoch"],
      ["Erstellung von Business Cases und Wirtschaftlichkeitsrechnungen für Investitionsentscheidungen", "Analytisch", "Hoch"],
      ["Kostenstellenrechnung und Gemeinkostenverteilung nach betriebswirtschaftlichen Grundsätzen", "Analytisch", "Hoch"],
      ["Vorbereitung von Management-Präsentationen mit entscheidungsrelevanten Finanzkennzahlen", "Analytisch", "Mittel"],
      ["Analyse und Optimierung der Kostenstrukturen in Zusammenarbeit mit den Fachbereichen", "Analytisch", "Mittel"],
      ["Beratung der Geschäftsführung bei strategischen Finanzfragen und Szenarien", "Intuitiv", "Mittel"],
      ["Weiterentwicklung der Controlling-Instrumente und Reporting-Tools", "Analytisch", "Mittel"],
      ["Durchführung von Ad-hoc-Analysen zu aktuellen betriebswirtschaftlichen Fragestellungen", "Analytisch", "Mittel"],
      ["Abstimmung mit Buchhaltung und Wirtschaftsprüfung zur Sicherstellung der Datenqualität", "Analytisch", "Mittel"],
      ["Budgetplanung und -konsolidierung über alle Unternehmensbereiche hinweg", "Analytisch", "Mittel"],
      ["Liquiditätsplanung und Working-Capital-Management zur Sicherung der Zahlungsfähigkeit", "Analytisch", "Niedrig"],
      ["Bewertung von M&A-Targets und Due-Diligence-Unterstützung bei Transaktionen", "Impulsiv", "Niedrig"],
    ],
    bias: { imp: 10, int: 10, ana: 80 },
  },
  "personalleiter": {
    haupt: [
      ["Entwicklung und Umsetzung der HR-Strategie in Abstimmung mit der Geschäftsführung", "Impulsiv", "Hoch"],
      ["Steuerung des gesamten Recruiting-Prozesses von der Anforderung bis zum Onboarding", "Intuitiv", "Hoch"],
      ["Beratung der Führungskräfte in personalrechtlichen und arbeitsrechtlichen Fragestellungen", "Analytisch", "Hoch"],
      ["Konzeption und Durchführung von Personalentwicklungsmaßnahmen und Talentprogrammen", "Intuitiv", "Hoch"],
      ["Verhandlung und Gestaltung von Betriebsvereinbarungen mit dem Betriebsrat", "Impulsiv", "Hoch"],
      ["Führung und Entwicklung des HR-Teams inkl. Zielvereinbarung und Feedback", "Intuitiv", "Mittel"],
      ["Steuerung der Gehalts- und Vergütungssysteme inkl. Benchmarking und Budgetplanung", "Analytisch", "Hoch"],
      ["Begleitung von Veränderungsprozessen und Organisationsentwicklungsprojekten", "Intuitiv", "Mittel"],
      ["Einführung und Optimierung von HR-Prozessen und digitalem Personalmanagement", "Analytisch", "Mittel"],
      ["Sicherstellung der Einhaltung arbeitsrechtlicher Vorschriften und Compliance-Anforderungen", "Analytisch", "Mittel"],
      ["Aufbau einer attraktiven Arbeitgebermarke und Employer-Branding-Maßnahmen", "Intuitiv", "Mittel"],
      ["Durchführung von Mitarbeitergesprächen bei Konflikten, Trennungen und Disziplinarfällen", "Impulsiv", "Mittel"],
      ["HR-Reporting und Personalcontrolling mit Kennzahlen wie Fluktuation und Krankenstand", "Analytisch", "Mittel"],
      ["Gestaltung von Onboarding-Programmen und Einarbeitung neuer Mitarbeiter", "Intuitiv", "Niedrig"],
      ["Planung und Steuerung des Personalbudgets über alle Organisationseinheiten", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 30, int: 40, ana: 30 },
  },
  "produktionsleiter": {
    haupt: [
      ["Planung und Steuerung der gesamten Produktionsabläufe zur termingerechten Auftragserfüllung", "Impulsiv", "Hoch"],
      ["Führung und Einsatzplanung der Produktionsmitarbeiter über alle Schichten hinweg", "Impulsiv", "Hoch"],
      ["Sicherstellung der Produktqualität durch Überwachung von Prüfprozessen und Standards", "Analytisch", "Hoch"],
      ["Optimierung der Fertigungsprozesse hinsichtlich Durchlaufzeit, Kosten und Ausschussquote", "Analytisch", "Hoch"],
      ["Koordination von Wartung und Instandhaltung zur Maximierung der Anlagenverfügbarkeit", "Analytisch", "Mittel"],
      ["Umsetzung von Lean-Methoden und kontinuierlichen Verbesserungsprozessen in der Fertigung", "Analytisch", "Mittel"],
      ["Einhaltung und Durchsetzung von Arbeitsschutz- und Sicherheitsvorschriften", "Impulsiv", "Hoch"],
      ["Kapazitätsplanung und Abstimmung mit Logistik und Einkauf zur Materialversorgung", "Analytisch", "Mittel"],
      ["Einführung neuer Produkte in die Serienfertigung inkl. Anlaufmanagement", "Impulsiv", "Mittel"],
      ["Reporting der Produktionskennzahlen wie OEE, Ausschuss und Stückkosten", "Analytisch", "Mittel"],
      ["Motivation und Entwicklung der Produktionsmitarbeiter in fachlichen und sozialen Kompetenzen", "Intuitiv", "Mittel"],
      ["Schnelle Entscheidungsfindung bei Maschinenstillständen und Produktionsstörungen", "Impulsiv", "Mittel"],
      ["Abstimmung mit Qualitätsmanagement bei Reklamationen und Korrekturmaßnahmen", "Analytisch", "Niedrig"],
      ["Investitionsplanung für Maschinen und Anlagen in Zusammenarbeit mit der Geschäftsführung", "Analytisch", "Niedrig"],
      ["Zusammenarbeit mit Betriebsrat bei Arbeitszeitmodellen und Personalfragen", "Intuitiv", "Niedrig"],
    ],
    bias: { imp: 40, int: 15, ana: 45 },
  },
  "key account manager": {
    haupt: [
      ["Strategische Betreuung und Entwicklung der wichtigsten Kundenbeziehungen auf Entscheiderebene", "Intuitiv", "Hoch"],
      ["Erstellung und Umsetzung von Account-Plänen mit klaren Wachstumszielen je Schlüsselkunde", "Impulsiv", "Hoch"],
      ["Verhandlung komplexer Verträge und Rahmenvereinbarungen mit Großkunden", "Impulsiv", "Hoch"],
      ["Analyse der Kundenbedürfnisse und Identifikation von Cross- und Upselling-Potenzialen", "Analytisch", "Hoch"],
      ["Koordination interner Ressourcen und Fachabteilungen zur Erfüllung der Kundenanforderungen", "Intuitiv", "Hoch"],
      ["Durchführung regelmäßiger Business Reviews und Präsentationen beim Kunden", "Intuitiv", "Mittel"],
      ["Wettbewerbsanalyse und Erarbeitung differenzierender Wertversprechen für Schlüsselkunden", "Analytisch", "Hoch"],
      ["Erreichung der Umsatz- und Deckungsbeitragsziele pro Kundenportfolio", "Impulsiv", "Mittel"],
      ["Frühzeitige Erkennung und Management von Kundenrisiken und Abwanderungssignalen", "Intuitiv", "Mittel"],
      ["Aufbau und Pflege eines Entscheidernetzwerks beim Kunden über alle Hierarchieebenen", "Intuitiv", "Mittel"],
      ["Erstellung von Angeboten und Kalkulationen unter Berücksichtigung von Margen und Konditionen", "Analytisch", "Mittel"],
      ["Pipeline-Management und Forecast-Erstellung für das eigene Kundenportfolio", "Analytisch", "Mittel"],
      ["Lösung von Eskalationen und Reklamationen durch schnelle Entscheidungen und Maßnahmen", "Impulsiv", "Mittel"],
      ["Teilnahme an Branchenevents und Kundenveranstaltungen zur Beziehungspflege", "Intuitiv", "Niedrig"],
      ["Dokumentation der Kundenentwicklung und Reporting an die Vertriebsleitung", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 35, int: 35, ana: 30 },
  },
  "marketing manager": {
    haupt: [
      ["Entwicklung und Umsetzung von Marketingstrategien zur Steigerung der Markenbekanntheit", "Impulsiv", "Hoch"],
      ["Planung und Steuerung von Kampagnen über digitale und klassische Kanäle", "Analytisch", "Hoch"],
      ["Analyse von Markt- und Wettbewerbsdaten zur Identifikation relevanter Trends und Chancen", "Analytisch", "Hoch"],
      ["Steuerung des Marketingbudgets und Allokation auf Kanäle nach ROI-Bewertung", "Analytisch", "Hoch"],
      ["Content-Strategie und Erstellung von Kommunikationsmaterialien für Zielgruppen", "Intuitiv", "Hoch"],
      ["Steuerung externer Agenturen und Dienstleister für Kreativ- und Medialeistungen", "Impulsiv", "Mittel"],
      ["Performance-Marketing mit KPI-Tracking und datenbasierter Kampagnenoptimierung", "Analytisch", "Hoch"],
      ["Markenführung und Sicherstellung einer konsistenten Corporate Identity", "Intuitiv", "Mittel"],
      ["Planung und Durchführung von Events, Messen und Produktlaunches", "Impulsiv", "Mittel"],
      ["Social-Media-Strategie und Community-Management über relevante Plattformen", "Intuitiv", "Mittel"],
      ["Lead-Generierung und Zusammenarbeit mit dem Vertrieb zur Conversion-Optimierung", "Analytisch", "Mittel"],
      ["Erstellung von Marktforschungsbriefings und Auswertung qualitativer und quantitativer Studien", "Analytisch", "Mittel"],
      ["Entwicklung von Kundensegmentierungen und Buyer Personas für gezielte Ansprache", "Analytisch", "Mittel"],
      ["Koordination von PR-Aktivitäten und Pressekommunikation", "Intuitiv", "Niedrig"],
      ["Website-Optimierung und SEO/SEA-Management zur Steigerung der Online-Sichtbarkeit", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 25, int: 30, ana: 45 },
  },
  "geschäftsführer": {
    haupt: [
      ["Entwicklung und Umsetzung der Unternehmensstrategie mit klarer Wachstumsorientierung", "Impulsiv", "Hoch"],
      ["Steuerung der Gesamtorganisation und Sicherstellung der Ergebnisverantwortung", "Impulsiv", "Hoch"],
      ["Verhandlung strategischer Partnerschaften, Kundenverträge und Akquisitionen", "Impulsiv", "Hoch"],
      ["Führung und Entwicklung des Managementteams mit klarer Zielausrichtung", "Impulsiv", "Hoch"],
      ["Repräsentation des Unternehmens gegenüber Gesellschaftern, Investoren und Aufsichtsgremien", "Intuitiv", "Hoch"],
      ["Budgetierung und Finanzplanung zur Sicherstellung der Liquidität und Profitabilität", "Analytisch", "Hoch"],
      ["Analyse der Marktposition und Ableitung wettbewerbsfähiger Maßnahmen", "Analytisch", "Mittel"],
      ["Aufbau und Pflege eines Netzwerks aus Branchenpartnern und Entscheidern", "Intuitiv", "Mittel"],
      ["Entscheidung bei Ressourcenkonflikten und Priorisierung unternehmenskritischer Initiativen", "Impulsiv", "Mittel"],
      ["Gestaltung der Unternehmenskultur und Vorleben der Unternehmenswerte", "Intuitiv", "Mittel"],
      ["Risikomanagement und Compliance-Sicherstellung auf Gesamtunternehmensebene", "Analytisch", "Mittel"],
      ["Steuerung von Transformations- und Digitalisierungsprojekten", "Impulsiv", "Mittel"],
      ["Kommunikation strategischer Veränderungen an Führungskräfte und Belegschaft", "Intuitiv", "Mittel"],
      ["Monitoring der Unternehmenskennzahlen und Einleitung korrektiver Maßnahmen", "Analytisch", "Mittel"],
      ["Personalentscheidungen auf Managementebene inkl. Nachfolgeplanung", "Impulsiv", "Niedrig"],
    ],
    bias: { imp: 50, int: 25, ana: 25 },
  },
  "buchhalter": {
    haupt: [
      ["Kontierung und Verbuchung laufender Geschäftsvorfälle in der Finanz- und Anlagenbuchhaltung", "Analytisch", "Hoch"],
      ["Abstimmung und Pflege der Debitoren-, Kreditoren- und Sachkonten", "Analytisch", "Hoch"],
      ["Erstellung von Monats- und Jahresabschlüssen nach HGB oder IFRS", "Analytisch", "Hoch"],
      ["Durchführung der Umsatzsteuer-Voranmeldung und Überprüfung steuerlicher Sachverhalte", "Analytisch", "Hoch"],
      ["Abwicklung des Zahlungsverkehrs und Überwachung der Bankkonten", "Analytisch", "Hoch"],
      ["Verwaltung des Mahnwesens und Überwachung offener Forderungen", "Analytisch", "Mittel"],
      ["Anlagenbuchhaltung mit Erfassung, Bewertung und Abschreibung von Vermögenswerten", "Analytisch", "Mittel"],
      ["Rechnungsprüfung und Freigabe von Eingangsrechnungen nach internen Richtlinien", "Analytisch", "Mittel"],
      ["Zusammenarbeit mit Steuerberatern und Wirtschaftsprüfern bei Jahresabschlussprüfungen", "Intuitiv", "Mittel"],
      ["Erstellung betriebswirtschaftlicher Auswertungen und Kostenstellen-Reports", "Analytisch", "Mittel"],
      ["Pflege und Optimierung der Buchungsprozesse in der ERP-Software", "Analytisch", "Mittel"],
      ["Intercompany-Abstimmung und Konsolidierung bei Konzernstrukturen", "Analytisch", "Mittel"],
      ["Abgrenzung und Bildung von Rückstellungen zum Bilanzstichtag", "Analytisch", "Niedrig"],
      ["Reisekostenabrechnung und Prüfung der Belege auf Richtigkeit", "Analytisch", "Niedrig"],
      ["Unterstützung bei der Budgetplanung und Liquiditätsvorschau", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 5, int: 10, ana: 85 },
  },
  "einkäufer": {
    haupt: [
      ["Verhandlung von Preisen, Lieferkonditionen und Rahmenverträgen mit Lieferanten", "Impulsiv", "Hoch"],
      ["Identifikation und Qualifizierung neuer Lieferanten durch Marktrecherche und Ausschreibungen", "Analytisch", "Hoch"],
      ["Bestellabwicklung und Auftragsüberwachung im ERP-System", "Analytisch", "Hoch"],
      ["Analyse und Optimierung der Beschaffungskosten und Materialpreise", "Analytisch", "Hoch"],
      ["Lieferantenbewertung anhand definierter Kriterien wie Qualität, Liefertreue und Preis", "Analytisch", "Hoch"],
      ["Durchsetzung von Kostensenkungszielen und Einsparmaßnahmen im Einkaufsvolumen", "Impulsiv", "Hoch"],
      ["Abstimmung mit Produktion und Logistik zur bedarfsgerechten Materialversorgung", "Intuitiv", "Mittel"],
      ["Reklamationsmanagement und Durchsetzung von Qualitätsanforderungen bei Lieferanten", "Impulsiv", "Mittel"],
      ["Bedarfsplanung und Disposition unter Berücksichtigung von Beständen und Lieferzeiten", "Analytisch", "Mittel"],
      ["Aufbau strategischer Lieferantenpartnerschaften zur langfristigen Versorgungssicherung", "Intuitiv", "Mittel"],
      ["Beobachtung von Rohstoffmärkten und Einleitung von Preisabsicherungsmaßnahmen", "Analytisch", "Mittel"],
      ["Erstellung von Einkaufs-Reports und Kennzahlenanalysen für das Management", "Analytisch", "Mittel"],
      ["Verhandlung von Zahlungszielen und Skonto-Konditionen zur Liquiditätsoptimierung", "Impulsiv", "Mittel"],
      ["Pflege der Stammdaten und Artikelinformationen im Warenwirtschaftssystem", "Analytisch", "Niedrig"],
      ["Teilnahme an Fachmessen zur Identifikation neuer Produkte und Technologien", "Intuitiv", "Niedrig"],
    ],
    bias: { imp: 35, int: 15, ana: 50 },
  },
  "teamleiter": {
    haupt: [
      ["Fachliche und disziplinarische Führung des Teams inkl. Aufgabenverteilung und Priorisierung", "Impulsiv", "Hoch"],
      ["Durchführung regelmäßiger Mitarbeitergespräche und Vereinbarung individueller Ziele", "Intuitiv", "Hoch"],
      ["Sicherstellung der Zielerreichung und Performance-Steuerung im Verantwortungsbereich", "Impulsiv", "Hoch"],
      ["Planung und Koordination der täglichen Arbeitsabläufe und Ressourcenverteilung", "Analytisch", "Hoch"],
      ["Förderung der Zusammenarbeit im Team und Lösung von zwischenmenschlichen Konflikten", "Intuitiv", "Hoch"],
      ["Onboarding und Einarbeitung neuer Teammitglieder in Prozesse und Strukturen", "Intuitiv", "Mittel"],
      ["Identifikation von Entwicklungspotenzialen und Ableitung geeigneter Qualifizierungsmaßnahmen", "Intuitiv", "Mittel"],
      ["Reporting der Teamleistung an die nächste Führungsebene mit konkreten Kennzahlen", "Analytisch", "Mittel"],
      ["Schnelle Entscheidungsfindung bei operativen Problemen und Engpässen", "Impulsiv", "Mittel"],
      ["Moderation von Teammeetings und Workshops zur Ergebnissicherung", "Intuitiv", "Mittel"],
      ["Umsetzung strategischer Vorgaben in operative Maßnahmen für das Team", "Impulsiv", "Mittel"],
      ["Prozessoptimierung und kontinuierliche Verbesserung der Arbeitsabläufe", "Analytisch", "Mittel"],
      ["Vertretung der Teaminteressen gegenüber anderen Abteilungen und der Geschäftsleitung", "Impulsiv", "Mittel"],
      ["Dokumentation und Pflege teamrelevanter Daten und Prozessbeschreibungen", "Analytisch", "Niedrig"],
      ["Urlaubsplanung und Arbeitszeitmanagement unter Berücksichtigung betrieblicher Erfordernisse", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 35, int: 35, ana: 30 },
  },
  "ingenieur": {
    haupt: [
      ["Planung und Auslegung technischer Systeme und Komponenten nach Spezifikation", "Analytisch", "Hoch"],
      ["Erstellung technischer Berechnungen, Simulationen und Dimensionierungen", "Analytisch", "Hoch"],
      ["Durchführung von Machbarkeitsstudien und technischen Bewertungen für Neuprojekte", "Analytisch", "Hoch"],
      ["Konstruktion und Detaillierung von Bauteilen und Baugruppen in CAD-Systemen", "Analytisch", "Hoch"],
      ["Technische Dokumentation inkl. Zeichnungserstellung, Stücklisten und Spezifikationen", "Analytisch", "Hoch"],
      ["Begleitung von Prototypenbau und Versuchsreihen bis zur Serienfreigabe", "Analytisch", "Mittel"],
      ["Analyse und Behebung technischer Probleme in der Produktion oder beim Kunden", "Analytisch", "Hoch"],
      ["Abstimmung technischer Anforderungen mit Kunden, Lieferanten und internen Fachabteilungen", "Intuitiv", "Mittel"],
      ["Bewertung und Auswahl von Werkstoffen und Fertigungsverfahren", "Analytisch", "Mittel"],
      ["Durchführung von FMEA und Risikoanalysen für neue Produkte und Prozesse", "Analytisch", "Mittel"],
      ["Erstellung von Prüfplänen und Definition von Qualitätskriterien für Abnahmen", "Analytisch", "Mittel"],
      ["Projektbezogene Kostenabschätzung und technische Angebotsunterstützung", "Analytisch", "Mittel"],
      ["Einhaltung und Anwendung von Normen, Vorschriften und Richtlinien", "Analytisch", "Mittel"],
      ["Patentrecherche und Bewertung des Stands der Technik für Entwicklungsprojekte", "Analytisch", "Niedrig"],
      ["Wissenstransfer und technische Schulung von Kollegen und Nachwuchskräften", "Intuitiv", "Niedrig"],
    ],
    bias: { imp: 10, int: 10, ana: 80 },
  },
  "koch": {
    haupt: [
      ["Zubereitung von Speisen nach Rezepten und kreativen Eigenkreationen in hoher Qualität", "Impulsiv", "Hoch"],
      ["Bestellung und Kontrolle von Waren sowie Überwachung des Wareneinsatzes und der Kosten", "Analytisch", "Hoch"],
      ["Organisation und Koordination der Arbeitsabläufe in der Küche während des Service", "Impulsiv", "Hoch"],
      ["Entwicklung saisonaler Menüs und Speisekarten unter Berücksichtigung von Trends", "Intuitiv", "Hoch"],
      ["Einhaltung und Umsetzung von Hygienevorschriften nach HACCP-Standards", "Analytisch", "Hoch"],
      ["Anleitung und Einarbeitung von Küchenpersonal und Auszubildenden", "Intuitiv", "Mittel"],
      ["Mise en Place und Vorbereitung aller Komponenten für den laufenden Küchenbetrieb", "Impulsiv", "Mittel"],
      ["Kalkulation von Rezepturen und Portionsgrößen zur Einhaltung der Zielkosten", "Analytisch", "Mittel"],
      ["Qualitätskontrolle aller ausgehenden Gerichte hinsichtlich Geschmack und Präsentation", "Analytisch", "Mittel"],
      ["Lagerorganisation und Kontrolle der Mindesthaltbarkeit aller Lebensmittel", "Analytisch", "Mittel"],
      ["Abstimmung mit dem Servicebereich zu Tagesangeboten und Allergiker-Informationen", "Intuitiv", "Mittel"],
      ["Planung des Personaleinsatzes und Schichtverteilung in der Küche", "Impulsiv", "Mittel"],
      ["Reinigung und Pflege der Küchengeräte und Arbeitsflächen nach Betriebsende", "Analytisch", "Niedrig"],
      ["Zusammenarbeit mit Lieferanten bei Sonderwünschen und Produktverfügbarkeit", "Intuitiv", "Niedrig"],
      ["Anpassung der Speisenzubereitung an Unverträglichkeiten und Diätvorgaben", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 40, int: 20, ana: 40 },
  },
  "sachbearbeiter": {
    haupt: [
      ["Bearbeitung eingehender Vorgänge und Aufträge nach definierten Prozessstandards", "Analytisch", "Hoch"],
      ["Pflege und Aktualisierung von Stammdaten und Datensätzen im Fachsystem", "Analytisch", "Hoch"],
      ["Erstellung und Prüfung von Dokumenten, Bescheiden und Korrespondenz", "Analytisch", "Hoch"],
      ["Terminüberwachung und Nachverfolgung offener Vorgänge und Fristen", "Analytisch", "Hoch"],
      ["Bearbeitung von Anfragen per Telefon, E-Mail und Post in angemessener Qualität", "Intuitiv", "Hoch"],
      ["Prüfung und Erfassung von Rechnungen und Belegen nach internen Richtlinien", "Analytisch", "Mittel"],
      ["Archivierung und Dokumentenmanagement nach den geltenden Aufbewahrungsvorschriften", "Analytisch", "Mittel"],
      ["Erstellung von Auswertungen, Listen und Übersichten aus den vorhandenen Datenbeständen", "Analytisch", "Mittel"],
      ["Koordination und Abstimmung mit anderen Fachabteilungen bei bereichsübergreifenden Vorgängen", "Intuitiv", "Mittel"],
      ["Vorbereitung von Unterlagen und Entscheidungsvorlagen für die Abteilungsleitung", "Analytisch", "Mittel"],
      ["Unterstützung bei der Einarbeitung neuer Kolleginnen und Kollegen in Arbeitsprozesse", "Intuitiv", "Mittel"],
      ["Mitarbeit bei der Optimierung von Abläufen und der Einführung neuer Software", "Analytisch", "Mittel"],
      ["Bearbeitung von Reklamationen und Kundenanliegen mit Lösungsorientierung", "Intuitiv", "Niedrig"],
      ["Posteingang und -ausgang sowie Verteilung interner Korrespondenz", "Analytisch", "Niedrig"],
      ["Organisation von Büromaterial und Bestellungen für den Abteilungsbedarf", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 10, int: 20, ana: 70 },
  },
  "it-leiter": {
    haupt: [
      ["Entwicklung und Umsetzung der IT-Strategie in Abstimmung mit der Geschäftsführung", "Impulsiv", "Hoch"],
      ["Führung und Steuerung des IT-Teams inkl. Zielvereinbarung und Kompetenzentwicklung", "Impulsiv", "Hoch"],
      ["Planung und Steuerung des IT-Budgets und Investitionsplanung für Infrastruktur", "Analytisch", "Hoch"],
      ["Sicherstellung der IT-Sicherheit und Umsetzung von Datenschutzanforderungen", "Analytisch", "Hoch"],
      ["Auswahl und Steuerung externer IT-Dienstleister und Systemintegratoren", "Impulsiv", "Hoch"],
      ["Management der IT-Infrastruktur inkl. Netzwerk, Server und Cloud-Services", "Analytisch", "Hoch"],
      ["Steuerung von IT-Projekten und Digitalisierungsinitiativen", "Impulsiv", "Mittel"],
      ["Anforderungsmanagement und Priorisierung von Business-Anforderungen an die IT", "Analytisch", "Mittel"],
      ["Verhandlung von Software-Lizenzen, SLAs und Wartungsverträgen", "Impulsiv", "Mittel"],
      ["Sicherstellung des IT-Service-Managements und Incident-Response-Prozesse", "Analytisch", "Mittel"],
      ["Beratung der Fachbereiche bei der Auswahl und Einführung neuer Systeme", "Intuitiv", "Mittel"],
      ["Entwicklung und Überwachung von IT-Governance-Richtlinien und Standards", "Analytisch", "Mittel"],
      ["Kapazitätsplanung und Skalierung der IT-Ressourcen bei Unternehmenswachstum", "Analytisch", "Mittel"],
      ["Risikomanagement und Business-Continuity-Planung für kritische IT-Systeme", "Analytisch", "Niedrig"],
      ["Reporting der IT-Kennzahlen und Projekte an Geschäftsführung und Stakeholder", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 35, int: 15, ana: 50 },
  },
  "logistikleiter": {
    haupt: [
      ["Planung und Steuerung der gesamten Warenflüsse vom Wareneingang bis zur Auslieferung", "Analytisch", "Hoch"],
      ["Führung und Einsatzplanung des Logistikteams über alle Schichten und Standorte", "Impulsiv", "Hoch"],
      ["Optimierung der Lagerorganisation und Stellplatzstruktur zur Effizienzsteigerung", "Analytisch", "Hoch"],
      ["Verhandlung von Frachtkonditionen und Rahmenverträgen mit Speditionen", "Impulsiv", "Hoch"],
      ["Sicherstellung der termingerechten Belieferung aller Kunden und Standorte", "Impulsiv", "Hoch"],
      ["Implementierung und Betrieb von Lagerverwaltungssystemen und Transportmanagementsoftware", "Analytisch", "Mittel"],
      ["Analyse und Reporting der Logistikkennzahlen wie Liefertreue, Durchlaufzeit und Kosten", "Analytisch", "Mittel"],
      ["Koordination mit Produktion, Einkauf und Vertrieb zur bedarfsgerechten Disposition", "Intuitiv", "Mittel"],
      ["Einhaltung von Gefahrgut-, Zoll- und Transportvorschriften im Logistikbereich", "Analytisch", "Mittel"],
      ["Kapazitätsplanung und Steuerung bei saisonalen Auftragsspitzen", "Impulsiv", "Mittel"],
      ["Einführung von Lean-Logistik-Methoden und Prozessverbesserungen", "Analytisch", "Mittel"],
      ["Inventurplanung und -durchführung mit Bestandsabgleich und Differenzklärung", "Analytisch", "Mittel"],
      ["Bearbeitung von Transportschäden und Reklamationen mit Speditionen und Versicherungen", "Impulsiv", "Niedrig"],
      ["Sicherstellung von Arbeitsschutz und Unfallverhütung im Lager- und Transportbereich", "Impulsiv", "Niedrig"],
      ["Mitarbeiterschulung zu neuen Prozessen, Systemen und Sicherheitsvorschriften", "Intuitiv", "Niedrig"],
    ],
    bias: { imp: 35, int: 15, ana: 50 },
  },
  "qualitätsmanager": {
    haupt: [
      ["Aufbau und Weiterentwicklung des Qualitätsmanagementsystems nach ISO 9001 oder branchenspezifischen Normen", "Analytisch", "Hoch"],
      ["Planung und Durchführung interner Audits zur Überprüfung der Prozesskonformität", "Analytisch", "Hoch"],
      ["Analyse von Fehler- und Reklamationsdaten zur Ableitung systematischer Verbesserungsmaßnahmen", "Analytisch", "Hoch"],
      ["Erstellung und Pflege von Prozessdokumentationen, Arbeitsanweisungen und Verfahrensanweisungen", "Analytisch", "Hoch"],
      ["Begleitung externer Zertifizierungsaudits und Kundenaudits als QM-Verantwortlicher", "Analytisch", "Hoch"],
      ["Durchführung von FMEA-Workshops und Risikoanalysen für Produkte und Prozesse", "Analytisch", "Mittel"],
      ["Schulung der Mitarbeiter in Qualitätsbewusstsein und Anwendung von QM-Methoden", "Intuitiv", "Mittel"],
      ["Festlegung und Überwachung von Qualitätskennzahlen und Lieferantenqualitätsbewertungen", "Analytisch", "Mittel"],
      ["Koordination von Korrektur- und Vorbeugemaßnahmen über Fachbereiche hinweg", "Intuitiv", "Mittel"],
      ["Wareneingangsprüfung und Erstbemusterung neuer Bauteile und Materialien", "Analytisch", "Mittel"],
      ["Mitwirkung bei der Produktentwicklung zur frühzeitigen Qualitätssicherung (Quality Gate)", "Analytisch", "Mittel"],
      ["Bewertung und Entwicklung von Lieferanten hinsichtlich Qualitätsperformance", "Analytisch", "Mittel"],
      ["Bearbeitung von Kundenreklamationen inkl. 8D-Reports und Ursachenanalyse", "Analytisch", "Mittel"],
      ["Statistische Prozesskontrolle und Auswertung von Messdaten zur Prozessstabilisierung", "Analytisch", "Niedrig"],
      ["Pflege und Administration des Dokumentenmanagementsystems für QM-Dokumente", "Analytisch", "Niedrig"],
    ],
    bias: { imp: 10, int: 15, ana: 75 },
  },
};

const NEBEN_POOL: Record<KompetenzTyp, [string, Niveau][]> = {
  "Impulsiv": [
    ["Eigenverantwortliches Handeln und Übernahme von Verantwortung für Ergebnisse", "Hoch"],
    ["Belastbarkeit und Leistungsbereitschaft auch unter hohem Zeitdruck", "Hoch"],
    ["Entscheidungsfreude und Bereitschaft, Verantwortung für Konsequenzen zu tragen", "Hoch"],
    ["Durchsetzungsvermögen bei Interessenkonflikten und konträren Positionen", "Mittel"],
    ["Ergebnisorientierung mit klarem Fokus auf messbare Zielerreichung", "Mittel"],
    ["Pragmatismus und lösungsorientiertes Handeln statt Perfektionismus", "Mittel"],
    ["Risikobereitschaft und souveräner Umgang mit Unsicherheit", "Niedrig"],
    ["Selbstdisziplin und konsequente Umsetzung vereinbarter Maßnahmen", "Niedrig"],
  ],
  "Intuitiv": [
    ["Teamfähigkeit und konstruktive Zusammenarbeit über Hierarchien hinweg", "Hoch"],
    ["Kommunikationsstärke in der mündlichen und schriftlichen Ausdrucksweise", "Hoch"],
    ["Empathie und Fähigkeit, sich in unterschiedliche Perspektiven hineinzuversetzen", "Hoch"],
    ["Konfliktfähigkeit und Bereitschaft, schwierige Gespräche lösungsorientiert zu führen", "Mittel"],
    ["Feedbackkultur: Konstruktives Geben und Annehmen von Rückmeldungen", "Mittel"],
    ["Interkulturelle Kompetenz und Sensibilität für diverse Arbeitsumgebungen", "Mittel"],
    ["Netzwerkfähigkeit und Aufbau vertrauensvoller Beziehungen", "Niedrig"],
    ["Moderationsfähigkeit und Strukturierung von Gruppendiskussionen", "Niedrig"],
  ],
  "Analytisch": [
    ["Strukturiertes und systematisches Vorgehen bei komplexen Aufgabenstellungen", "Hoch"],
    ["Sorgfalt und Genauigkeit in der Arbeit mit Daten, Dokumenten und Prozessen", "Hoch"],
    ["Lernbereitschaft und Offenheit für neue Methoden und Technologien", "Mittel"],
    ["Selbstorganisation und eigenständige Priorisierung von Aufgaben", "Mittel"],
    ["Kritisches Denken und Hinterfragen bestehender Annahmen und Prozesse", "Mittel"],
    ["Analytisches Denkvermögen zur Erkennung von Mustern und Zusammenhängen", "Mittel"],
    ["Zuverlässigkeit und termingetreue Erledigung übertragener Aufgaben", "Niedrig"],
    ["Digitale Kompetenz im Umgang mit branchenüblichen IT-Systemen und Tools", "Niedrig"],
  ],
};

const FUEHRUNG_TEMPLATES: Record<string, [string, KompetenzTyp, Niveau][]> = {
  "Projekt-/Teamkoordination": [
    ["Koordination und Priorisierung der Teamaufgaben mit klarer Zuständigkeitsverteilung", "Impulsiv", "Hoch"],
    ["Moderation von Teammeetings mit Ergebnissicherung und Maßnahmenverfolgung", "Intuitiv", "Hoch"],
    ["Förderung der Zusammenarbeit im Team und Abbau von Silodenken", "Intuitiv", "Hoch"],
    ["Delegation von Aufgaben unter Berücksichtigung individueller Stärken und Entwicklungsziele", "Intuitiv", "Mittel"],
    ["Schnelle Reaktion auf Engpässe und Umpriorisierung bei veränderten Rahmenbedingungen", "Impulsiv", "Mittel"],
    ["Sicherstellung des Informationsflusses innerhalb des Teams und zu Stakeholdern", "Intuitiv", "Mittel"],
    ["Reporting des Arbeitsfortschritts und Eskalation von Risiken an die Leitung", "Analytisch", "Mittel"],
    ["Onboarding neuer Teammitglieder und Sicherstellung eines strukturierten Wissenstransfers", "Intuitiv", "Niedrig"],
    ["Methodische Retrospektiven und Lessons Learned zur kontinuierlichen Verbesserung", "Analytisch", "Niedrig"],
    ["Vertretung der Teaminteressen gegenüber Projektleitung und angrenzenden Bereichen", "Impulsiv", "Niedrig"],
  ],
  "Fachliche Führung": [
    ["Fachliche Steuerung und Qualitätssicherung der Arbeitsergebnisse im Verantwortungsbereich", "Analytisch", "Hoch"],
    ["Aufbau und Weitergabe von Fach- und Methodenwissen im Team", "Analytisch", "Hoch"],
    ["Entscheidung bei fachlichen Fragestellungen und Festlegung von Standards", "Impulsiv", "Hoch"],
    ["Identifikation von Kompetenzlücken und Initiierung gezielter Weiterbildungsmaßnahmen", "Intuitiv", "Mittel"],
    ["Coaching und Sparring für Teammitglieder bei komplexen fachlichen Herausforderungen", "Intuitiv", "Mittel"],
    ["Bewertung und Einführung neuer Methoden, Tools und Best Practices", "Analytisch", "Mittel"],
    ["Vertretung des Fachbereichs in bereichsübergreifenden Gremien und Projektteams", "Impulsiv", "Mittel"],
    ["Review und Freigabe fachlicher Arbeitsergebnisse vor der Auslieferung", "Analytisch", "Mittel"],
    ["Sicherstellung der Einhaltung von Normen, Richtlinien und Compliance-Vorgaben", "Analytisch", "Niedrig"],
    ["Einbindung des Teams in Innovationsprozesse und Ideenentwicklung", "Intuitiv", "Niedrig"],
  ],
  "Disziplinarische Führung mit Ergebnisverantwortung": [
    ["Disziplinarische Führung der Mitarbeiter inkl. Zielvereinbarung und Leistungsbewertung", "Impulsiv", "Hoch"],
    ["Personalentscheidungen wie Einstellung, Beförderung und Trennung im Verantwortungsbereich", "Impulsiv", "Hoch"],
    ["Steuerung der Bereichsergebnisse und Verantwortung für Budget und Zielerreichung", "Impulsiv", "Hoch"],
    ["Führung von Jahres-, Feedback- und Entwicklungsgesprächen mit jedem Mitarbeiter", "Intuitiv", "Hoch"],
    ["Aufbau einer leistungsfördernden Teamkultur mit klaren Werten und Erwartungen", "Intuitiv", "Mittel"],
    ["Identifikation und Förderung von High Potentials und Nachfolgekandidaten", "Intuitiv", "Mittel"],
    ["Durchsetzung notwendiger Veränderungen auch gegen Widerstände im Team", "Impulsiv", "Mittel"],
    ["Konfliktlösung bei interpersonellen Spannungen mit fairer und klarer Kommunikation", "Intuitiv", "Mittel"],
    ["Strategische Personalplanung und Kapazitätsmanagement für den Verantwortungsbereich", "Analytisch", "Mittel"],
    ["Vertretung des Bereichs in der Führungsrunde und Mitgestaltung der Unternehmensstrategie", "Impulsiv", "Niedrig"],
  ],
};

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[-_\/\\().,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type StammdatenTexte = { bereich1?: string; bereich2?: string; bereich3?: string };

const STAMMDATEN_DEFAULTS: StammdatenTexte = {
  bereich1: `IMPULSIV = Handlungs- und Umsetzungskompetenz (MACHEN & DURCHSETZEN)
Entscheidungen treffen Verantwortung Konsequenzen Verhandlungen führen Ergebnisse durchsetzen Zielvorgaben einfordern kontrollieren Eskalation Zielkonflikten Blockaden Priorisierung Zeitdruck Ressourcenknappheit Steuerung Dienstleister Durchsetzung Leistungsanforderungen Budget Ergebnisverantwortung Personalentscheidungen Einstellung Trennung Beförderung Pragmatismus Krisenmanagement`,
  bereich2: `INTUITIV = Sozial- und Beziehungskompetenz (FÜHLEN & VERBINDEN)
Zwischenmenschliche Interaktion Empathie Zuhören Verständnis Menschen Teamführung Mitarbeiterentwicklung persönlicher Ebene Moderation Gruppendiskussionen Workshops Konfliktlösung Gespräch Beziehungsarbeit Coaching Mentoring persönliche Begleitung Netzwerken Vertrauensbeziehungen Kundenbetreuung persönlichem Kontakt Feedbackgespräche Mitarbeitergespräche interkulturelle Sensibilität Zusammenarbeit`,
  bereich3: `ANALYTISCH = Fach- und Methodenkompetenz (DENKEN & VERSTEHEN)
Systematisches Arbeiten Systemen Datenbanken Bewerten Abwägen Daten Zahlen Termine Prozesse Dokumentation Reporting Monitoring Fachwissen vermitteln erklären Qualitätskontrolle Einhaltung Standards Planung Strukturierung Organisation Abläufe Reinigung Instandhaltung Wartung Pflege Sorgfalt Einkauf Bestellung Lagerverwaltung Inventur Rezepturentwicklung Speiseplanung Kalkulation Hygienevorschriften Sicherheitsstandards technische Prüfung Fehlerbehebung`,
};

function loadStammdaten(): StammdatenTexte {
  try {
    const raw = localStorage.getItem("analyseTexte");
    if (raw) {
      const parsed = JSON.parse(raw);
      const hasContent = (v: string | undefined) => v && !v.startsWith("Noch keine Analyse");
      if (hasContent(parsed.bereich1) || hasContent(parsed.bereich2) || hasContent(parsed.bereich3)) {
        return {
          bereich1: hasContent(parsed.bereich1) ? parsed.bereich1 : STAMMDATEN_DEFAULTS.bereich1,
          bereich2: hasContent(parsed.bereich2) ? parsed.bereich2 : STAMMDATEN_DEFAULTS.bereich2,
          bereich3: hasContent(parsed.bereich3) ? parsed.bereich3 : STAMMDATEN_DEFAULTS.bereich3,
        };
      }
    }
  } catch {}
  return STAMMDATEN_DEFAULTS;
}

function extractKeywords(text: string): string[] {
  if (!text || text.startsWith("Noch keine Analyse")) return [];
  return text
    .toLowerCase()
    .replace(/[.,;:!?()\[\]{}""„"»«\-–—]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

function scoreAgainstStammdaten(
  taetigkeitText: string,
  stammdaten: StammdatenTexte,
): KompetenzTyp | null {
  const impKeywords = extractKeywords(stammdaten.bereich1 || "");
  const intKeywords = extractKeywords(stammdaten.bereich2 || "");
  const anaKeywords = extractKeywords(stammdaten.bereich3 || "");

  if (impKeywords.length === 0 && intKeywords.length === 0 && anaKeywords.length === 0) {
    return null;
  }

  const lower = taetigkeitText.toLowerCase();
  const words = lower.replace(/[.,;:!?()\[\]{}""„"»«\-–—]/g, " ").split(/\s+/).filter(w => w.length >= 4);

  let impScore = 0;
  let intScore = 0;
  let anaScore = 0;

  for (const word of words) {
    if (impKeywords.includes(word)) impScore++;
    if (intKeywords.includes(word)) intScore++;
    if (anaKeywords.includes(word)) anaScore++;
  }

  const maxScore = Math.max(impScore, intScore, anaScore);
  if (maxScore === 0) return null;

  if (impScore === maxScore && impScore > intScore && impScore > anaScore) return "Impulsiv";
  if (intScore === maxScore && intScore > impScore && intScore > anaScore) return "Intuitiv";
  if (anaScore === maxScore && anaScore > impScore && anaScore > intScore) return "Analytisch";

  return null;
}

function applyStammdaten(items: KompetenzItem[], stammdaten: StammdatenTexte): KompetenzItem[] {
  return items.map(item => {
    const matched = scoreAgainstStammdaten(item.name, stammdaten);
    if (matched && matched !== item.kompetenz) {
      return { ...item, kompetenz: matched };
    }
    return item;
  });
}

function findProfile(beruf: string): typeof BERUFS_PROFILE[string] | null {
  const n = normalize(beruf);
  for (const [key, profile] of Object.entries(BERUFS_PROFILE)) {
    if (n === normalize(key)) return profile;
    if (n.includes(normalize(key)) || normalize(key).includes(n)) return profile;
  }
  const words = n.split(" ");
  for (const [key, profile] of Object.entries(BERUFS_PROFILE)) {
    const keyNorm = normalize(key);
    for (const word of words) {
      if (word.length >= 5 && keyNorm.includes(word)) return profile;
    }
  }
  return null;
}

function pickNeben(bias: { imp: number; int: number; ana: number }): KompetenzItem[] {
  const result: KompetenzItem[] = [];
  const total = bias.imp + bias.int + bias.ana;
  const impCount = Math.round((bias.imp / total) * 10);
  const intCount = Math.round((bias.int / total) * 10);
  const anaCount = 10 - impCount - intCount;

  const pickFromPool = (typ: KompetenzTyp, count: number) => {
    const pool = [...NEBEN_POOL[typ]];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const [name, niveau] = pool[i];
      result.push({ name, kompetenz: typ, niveau });
    }
  };

  pickFromPool("Impulsiv", Math.max(1, impCount));
  pickFromPool("Intuitiv", Math.max(2, intCount));
  pickFromPool("Analytisch", Math.max(1, anaCount));

  while (result.length > 10) result.pop();
  while (result.length < 10) {
    const extras: [string, KompetenzTyp, Niveau][] = [
      ["Anpassungsfähigkeit und konstruktiver Umgang mit Veränderungen", "Intuitiv", "Mittel"],
      ["Verantwortungsbewusstsein gegenüber Aufgaben und dem Arbeitsumfeld", "Impulsiv", "Mittel"],
      ["Kreativität und Ideenreichtum bei der Entwicklung neuer Lösungsansätze", "Intuitiv", "Niedrig"],
      ["Stressresistenz und Aufrechterhaltung der Arbeitsqualität unter Belastung", "Impulsiv", "Niedrig"],
    ];
    const extra = extras[result.length - 10] || extras[0];
    result.push({ name: extra[0], kompetenz: extra[1], niveau: extra[2] });
  }

  return result;
}

export function generateKompetenzenLokal(
  beruf: string,
  fuehrung: string,
): KompetenzResult | null {
  const profile = findProfile(beruf);
  if (!profile) return null;

  const stammdaten = loadStammdaten();

  let haupt: KompetenzItem[] = profile.haupt.map(([name, kompetenz, niveau]) => ({
    name, kompetenz, niveau,
  }));
  haupt = applyStammdaten(haupt, stammdaten);

  const bias = profile.bias || { imp: 33, int: 33, ana: 34 };
  let neben = pickNeben(bias);
  neben = applyStammdaten(neben, stammdaten);

  const result: KompetenzResult = { haupt, neben };

  const hasFuehrung = fuehrung && fuehrung !== "Keine" && fuehrung !== "";
  if (hasFuehrung && FUEHRUNG_TEMPLATES[fuehrung]) {
    let fuehrungItems = FUEHRUNG_TEMPLATES[fuehrung].map(([name, kompetenz, niveau]) => ({
      name, kompetenz, niveau,
    }));
    fuehrungItems = applyStammdaten(fuehrungItems, stammdaten);
    result.fuehrung = fuehrungItems;
  }

  return result;
}

export function canGenerateLokal(beruf: string): boolean {
  return findProfile(beruf) !== null;
}
