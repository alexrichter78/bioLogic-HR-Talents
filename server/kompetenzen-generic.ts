type KompetenzTyp = "Impulsiv" | "Intuitiv" | "Analytisch";
type Niveau = "Niedrig" | "Mittel" | "Hoch";
type Item = { name: string; kompetenz: KompetenzTyp; niveau: Niveau };
type Result = { haupt: Item[]; neben: Item[] };

type RoleCategory = "FUEHRUNG" | "TECHNIK" | "VERTRIEB" | "VERWALTUNG" | "SOZIAL" | "KREATIV" | "HANDWERK" | "MEDIZIN" | "FINANZEN" | "LOGISTIK" | "IT" | "RECHT" | "BILDUNG" | "GENERISCH";

const CAT_KEYWORDS: Record<RoleCategory, string[]> = {
  FUEHRUNG: ["leiter","leiterin","manager","managerin","direktor","direktorin","vorstand","geschäftsführ","head of","vp ","chief ","ceo","cfo","coo","cto","cio","führung","abteilungsleiter","bereichsleiter","gruppenleiter","teamleiter","filialleiter","werkstattleiter","schichtleiter","stationsleitung","schulleiter","prokurist"],
  IT: ["software","entwickler","programmierer","it-","informatik","data ","daten","devops","cloud","cyber","system","netzwerk","frontend","backend","fullstack","architect","engineer","admin","ki-","machine learning","blockchain","scrum","agile","sap","web"],
  TECHNIK: ["ingenieur","techniker","konstrukteur","mechaniker","mechatronik","elektro","monteur","schweißer","schlosser","dreher","fräser","cnc","robotik","automatisierung","wartung","instandhalt","prüf","mess","labor","verfahren","werkzeug","anlagen","maschinen"],
  VERTRIEB: ["vertrieb","verkauf","verkäufer","sales","account","akquise","außendienst","innendienst","handel","key account","business develop","kundenber","customer"],
  FINANZEN: ["finanz","controller","controlling","buchhalter","buchhalt","steuer","wirtschaftsprüf","treasury","revision","bilanz","rechnungswesen","aktuar","credit","investment","portfolio","fond","bank","versicherung"],
  VERWALTUNG: ["sachbearbeiter","büro","verwaltung","assistenz","sekretär","office","koordinator","referent","disponent","disponentin","kaufmann","kauffrau","fachkraft für"],
  SOZIAL: ["sozial","pädagog","erzieher","pflege","pfleger","betreu","therapeut","psycho","coach","trainer","berater","personal","hr ","human","onboarding","talent","recruiting"],
  KREATIV: ["design","grafik","kreativ","redakt","journalist","medien","content","marketing","werbung","fotograf","kamera","animation","video","audio","musik","kultur","kunst"],
  MEDIZIN: ["arzt","ärztin","medizin","pflege","krank","sanitäter","pharma","apothek","labor","patho","radio","chirurg","anästhes","augen","hno","zahn","physio","ergo","logo","heilpraktik","hebamme","tierarzt","veterinär"],
  LOGISTIK: ["logistik","lager","transport","spedition","fahr","dispon","kurier","zustell","versand","warenein","fleet","supply chain","einkauf","einkäufer","beschaffung"],
  RECHT: ["anwalt","jurist","notar","richter","rechts","syndikus","compliance","patent","datenschutz"],
  BILDUNG: ["lehrer","dozent","professor","wissenschaft","forsch","akadem","bildung","schulung","ausbilder","lehrgang"],
  HANDWERK: ["bäcker","koch","konditor","maler","tischler","schreiner","zimmerer","dachdecker","maurer","klempner","installateur","gärtner","florist","friseur","schneider","glaser","fleischer","optiker","uhrmacher","goldschmied","polsterer","bodenleger"],
  GENERISCH: [],
};

const HAUPT_POOLS: Record<RoleCategory, [string, KompetenzTyp, Niveau][]> = {
  FUEHRUNG: [
    ["Entwicklung und Umsetzung der Bereichsstrategie in Abstimmung mit der Geschäftsleitung", "Impulsiv", "Hoch"],
    ["Führung und Entwicklung des Teams inkl. Zielvereinbarung und Leistungsbewertung", "Impulsiv", "Hoch"],
    ["Steuerung der Budgetplanung und Sicherstellung der wirtschaftlichen Zielerreichung", "Analytisch", "Hoch"],
    ["Entscheidungsfindung bei Zielkonflikten und Priorisierung kritischer Initiativen", "Impulsiv", "Hoch"],
    ["Reporting der Bereichskennzahlen und Ableitung operativer Maßnahmen", "Analytisch", "Hoch"],
    ["Aufbau und Pflege strategischer Netzwerke und Stakeholder-Beziehungen", "Intuitiv", "Hoch"],
    ["Moderation von Meetings und Workshops zur Abstimmung von Ergebnissen und Zielen", "Intuitiv", "Mittel"],
    ["Verhandlung von Verträgen und Konditionen mit internen und externen Partnern", "Impulsiv", "Mittel"],
    ["Steuerung von Veränderungsprozessen und Sicherstellung der Umsetzung im Team", "Impulsiv", "Mittel"],
    ["Identifikation und Förderung von Talenten und Nachfolgekandidaten im Verantwortungsbereich", "Intuitiv", "Mittel"],
    ["Analyse und Optimierung bestehender Prozesse zur Effizienzsteigerung", "Analytisch", "Mittel"],
    ["Sicherstellung der Einhaltung von Compliance-Vorgaben und Qualitätsstandards", "Analytisch", "Mittel"],
    ["Kommunikation strategischer Entscheidungen an Mitarbeiter und Führungskräfte", "Intuitiv", "Mittel"],
    ["Koordination bereichsübergreifender Projekte und Abstimmung mit Fachabteilungen", "Intuitiv", "Niedrig"],
    ["Personalplanung und Kapazitätssteuerung unter Berücksichtigung betrieblicher Erfordernisse", "Analytisch", "Niedrig"],
  ],
  IT: [
    ["Entwicklung und Implementierung von Softwarekomponenten nach technischer Spezifikation", "Analytisch", "Hoch"],
    ["Analyse und Behebung von Systemfehlern durch strukturiertes Debugging und Logging", "Analytisch", "Hoch"],
    ["Design und Umsetzung von Datenbankstrukturen und Schnittstellen", "Analytisch", "Hoch"],
    ["Erstellung und Pflege automatisierter Tests zur Sicherstellung der Softwarequalität", "Analytisch", "Hoch"],
    ["Bewertung und Auswahl geeigneter Technologien und Frameworks für Projektanforderungen", "Analytisch", "Hoch"],
    ["Technische Dokumentation von Architekturen, Schnittstellen und Entscheidungen", "Analytisch", "Mittel"],
    ["Code-Reviews und Sicherstellung von Qualitätsstandards im Entwicklungsteam", "Analytisch", "Hoch"],
    ["Abstimmung technischer Anforderungen mit Fachbereichen und Product Ownern", "Intuitiv", "Mittel"],
    ["Performance-Analyse und Optimierung kritischer Systemkomponenten", "Analytisch", "Mittel"],
    ["Umsetzung von CI/CD-Pipelines und Automatisierung von Deployment-Prozessen", "Analytisch", "Mittel"],
    ["Monitoring und Analyse von Produktionssystemen zur Fehlervermeidung", "Analytisch", "Mittel"],
    ["Teilnahme an agilen Zeremonien und aktive Mitgestaltung der Teamarbeit", "Intuitiv", "Niedrig"],
    ["Wissenstransfer und Pair-Programming zur Stärkung der Teamkompetenz", "Intuitiv", "Mittel"],
    ["Eigenständige Recherche und Prototyping neuer technischer Lösungsansätze", "Impulsiv", "Niedrig"],
    ["Sicherstellung der IT-Sicherheit und Umsetzung von Datenschutzanforderungen", "Analytisch", "Niedrig"],
  ],
  TECHNIK: [
    ["Planung und Auslegung technischer Systeme nach Spezifikation und Normen", "Analytisch", "Hoch"],
    ["Erstellung technischer Berechnungen, Simulationen und Dimensionierungen", "Analytisch", "Hoch"],
    ["Konstruktion und Detaillierung von Bauteilen und Baugruppen im CAD-System", "Analytisch", "Hoch"],
    ["Durchführung von Qualitätsprüfungen und Dokumentation der Messergebnisse", "Analytisch", "Hoch"],
    ["Analyse und Behebung technischer Störungen in Fertigung oder Betrieb", "Analytisch", "Hoch"],
    ["Technische Dokumentation inkl. Zeichnungen, Stücklisten und Prüfprotokolle", "Analytisch", "Mittel"],
    ["Bewertung und Auswahl von Werkstoffen und Fertigungsverfahren", "Analytisch", "Hoch"],
    ["Durchführung von FMEA und Risikoanalysen für Produkte und Prozesse", "Analytisch", "Mittel"],
    ["Begleitung von Prototypenbau und Versuchsreihen bis zur Freigabe", "Analytisch", "Mittel"],
    ["Wartung und Instandhaltung von Maschinen und Anlagen nach Wartungsplan", "Analytisch", "Mittel"],
    ["Abstimmung technischer Anforderungen mit Kunden und internen Fachabteilungen", "Intuitiv", "Mittel"],
    ["Einhaltung von Normen, Vorschriften und Sicherheitsrichtlinien im Arbeitsbereich", "Analytisch", "Mittel"],
    ["Erstellung von Prüfplänen und Definition von Abnahmekriterien", "Analytisch", "Mittel"],
    ["Kostenabschätzung und technische Angebotsunterstützung für Kundenprojekte", "Analytisch", "Niedrig"],
    ["Schulung und Einweisung von Kollegen in technische Verfahren und Anlagen", "Intuitiv", "Niedrig"],
  ],
  VERTRIEB: [
    ["Aktive Kundenakquise und systematische Erschließung neuer Marktpotenziale", "Impulsiv", "Hoch"],
    ["Verhandlung und Abschluss von Verträgen und Rahmenvereinbarungen", "Impulsiv", "Hoch"],
    ["Aufbau und Pflege langfristiger Kundenbeziehungen auf Entscheiderebene", "Intuitiv", "Hoch"],
    ["Analyse von Kundenbedürfnissen und Entwicklung passender Lösungsangebote", "Analytisch", "Hoch"],
    ["Steuerung der Vertriebspipeline und Erstellung zuverlässiger Forecasts", "Analytisch", "Hoch"],
    ["Erreichung der Umsatz- und Deckungsbeitragsziele im eigenen Verantwortungsbereich", "Impulsiv", "Hoch"],
    ["Erstellung von Angeboten und Kalkulationen unter Berücksichtigung von Margen", "Analytisch", "Mittel"],
    ["Wettbewerbsanalyse und Erarbeitung differenzierender Verkaufsargumente", "Analytisch", "Mittel"],
    ["Durchführung von Produktpräsentationen und Verkaufsgesprächen beim Kunden", "Intuitiv", "Mittel"],
    ["Cross- und Upselling bestehender Kundenbeziehungen zur Umsatzsteigerung", "Impulsiv", "Mittel"],
    ["CRM-Pflege und Dokumentation aller vertriebsrelevanten Aktivitäten", "Analytisch", "Mittel"],
    ["Teilnahme an Messen und Branchenevents zur Netzwerkpflege und Leadgenerierung", "Intuitiv", "Mittel"],
    ["Bearbeitung von Reklamationen und Sicherstellung der Kundenzufriedenheit", "Intuitiv", "Niedrig"],
    ["Koordination mit Innendienst und Logistik zur termingerechten Auftragsabwicklung", "Analytisch", "Niedrig"],
    ["Reporting der Vertriebskennzahlen und Ableitung operativer Maßnahmen", "Analytisch", "Niedrig"],
  ],
  FINANZEN: [
    ["Erstellung von Monats-, Quartals- und Jahresabschlüssen nach geltenden Standards", "Analytisch", "Hoch"],
    ["Aufbau und Pflege von Planungs- und Forecast-Modellen für Umsatz und Kosten", "Analytisch", "Hoch"],
    ["Durchführung von Soll-Ist-Vergleichen und Analyse von Ergebnisabweichungen", "Analytisch", "Hoch"],
    ["Entwicklung und Monitoring von KPI-Systemen zur Unternehmenssteuerung", "Analytisch", "Hoch"],
    ["Kontierung und Verbuchung laufender Geschäftsvorfälle im Buchungssystem", "Analytisch", "Hoch"],
    ["Erstellung von Business Cases und Wirtschaftlichkeitsrechnungen", "Analytisch", "Hoch"],
    ["Kostenstellenrechnung und Gemeinkostenverteilung nach betriebswirtschaftlichen Grundsätzen", "Analytisch", "Mittel"],
    ["Abstimmung und Pflege der Debitoren-, Kreditoren- und Sachkonten", "Analytisch", "Mittel"],
    ["Liquiditätsplanung und Working-Capital-Management", "Analytisch", "Mittel"],
    ["Zusammenarbeit mit Wirtschaftsprüfern und Steuerberatern bei Prüfungen", "Intuitiv", "Mittel"],
    ["Vorbereitung von Entscheidungsvorlagen mit relevanten Finanzkennzahlen", "Analytisch", "Mittel"],
    ["Steuerliche Sachverhalte prüfen und Umsatzsteuer-Voranmeldungen erstellen", "Analytisch", "Mittel"],
    ["Ad-hoc-Analysen zu betriebswirtschaftlichen Fragestellungen durchführen", "Analytisch", "Mittel"],
    ["Budgetplanung und -konsolidierung über Unternehmensbereiche hinweg", "Analytisch", "Niedrig"],
    ["Optimierung der Finanzprozesse und Reporting-Tools", "Analytisch", "Niedrig"],
  ],
  VERWALTUNG: [
    ["Bearbeitung eingehender Vorgänge und Aufträge nach definierten Prozessstandards", "Analytisch", "Hoch"],
    ["Pflege und Aktualisierung von Stammdaten und Datensätzen im Fachsystem", "Analytisch", "Hoch"],
    ["Erstellung und Prüfung von Dokumenten, Bescheiden und Korrespondenz", "Analytisch", "Hoch"],
    ["Terminüberwachung und Nachverfolgung offener Vorgänge und Fristen", "Analytisch", "Hoch"],
    ["Bearbeitung von Anfragen per Telefon, E-Mail und Post", "Intuitiv", "Hoch"],
    ["Prüfung und Erfassung von Rechnungen und Belegen nach internen Richtlinien", "Analytisch", "Mittel"],
    ["Archivierung und Dokumentenmanagement nach geltenden Aufbewahrungsvorschriften", "Analytisch", "Mittel"],
    ["Erstellung von Auswertungen und Übersichten aus vorhandenen Datenbeständen", "Analytisch", "Mittel"],
    ["Koordination mit anderen Fachabteilungen bei bereichsübergreifenden Vorgängen", "Intuitiv", "Mittel"],
    ["Vorbereitung von Unterlagen und Entscheidungsvorlagen für die Leitung", "Analytisch", "Mittel"],
    ["Organisation von Terminen, Besprechungen und Reisen", "Analytisch", "Mittel"],
    ["Unterstützung bei der Einarbeitung neuer Mitarbeiter in Arbeitsprozesse", "Intuitiv", "Mittel"],
    ["Bearbeitung von Kundenanliegen und Reklamationen mit Lösungsorientierung", "Intuitiv", "Niedrig"],
    ["Mitarbeit bei der Optimierung von Abläufen und Einführung neuer Software", "Analytisch", "Niedrig"],
    ["Bestellwesen und Materialverwaltung für den Abteilungsbedarf", "Analytisch", "Niedrig"],
  ],
  SOZIAL: [
    ["Beratung und Begleitung von Menschen in schwierigen Lebens- und Arbeitssituationen", "Intuitiv", "Hoch"],
    ["Durchführung von Einzel- und Gruppengesprächen zur Klärung individueller Bedarfe", "Intuitiv", "Hoch"],
    ["Planung und Umsetzung pädagogischer oder therapeutischer Maßnahmen", "Intuitiv", "Hoch"],
    ["Beobachtung und Dokumentation von Entwicklungsverläufen und Fortschritten", "Analytisch", "Hoch"],
    ["Aufbau vertrauensvoller Beziehungen als Basis für nachhaltige Zusammenarbeit", "Intuitiv", "Hoch"],
    ["Kooperation mit Familien, Behörden und anderen Institutionen im Hilfenetzwerk", "Intuitiv", "Mittel"],
    ["Erstellung von Berichten, Entwicklungsplänen und Fördergutachten", "Analytisch", "Hoch"],
    ["Moderation von Konfliktgesprächen und Vermittlung bei Interessengegensätzen", "Intuitiv", "Mittel"],
    ["Durchführung von Gruppenangeboten, Projekten und Freizeitaktivitäten", "Intuitiv", "Mittel"],
    ["Krisenintervention und schnelle Einschätzung von Gefährdungssituationen", "Impulsiv", "Mittel"],
    ["Teilnahme an Fallbesprechungen und interdisziplinären Teamkonferenzen", "Intuitiv", "Mittel"],
    ["Weiterentwicklung der eigenen Fachkompetenz durch Supervision und Fortbildung", "Analytisch", "Mittel"],
    ["Netzwerkarbeit und Aufbau von Kooperationen mit regionalen Partnern", "Intuitiv", "Niedrig"],
    ["Administrative Aufgaben wie Aktenführung, Antragsstellung und Abrechnung", "Analytisch", "Niedrig"],
    ["Mitwirkung an der Konzeptentwicklung und Qualitätssicherung der Einrichtung", "Analytisch", "Niedrig"],
  ],
  KREATIV: [
    ["Konzeption und Gestaltung kreativer Inhalte für verschiedene Medien und Kanäle", "Intuitiv", "Hoch"],
    ["Entwicklung von Kommunikationsstrategien und Kampagnenkonzepten", "Analytisch", "Hoch"],
    ["Erstellung und Aufbereitung von Texten, Grafiken oder audiovisuellen Medien", "Intuitiv", "Hoch"],
    ["Analyse von Zielgruppen und Markttrends zur Optimierung der Ansprache", "Analytisch", "Hoch"],
    ["Steuerung externer Dienstleister und Agenturen für kreative Umsetzungen", "Impulsiv", "Mittel"],
    ["Sicherstellung einer konsistenten Markenidentität über alle Touchpoints", "Intuitiv", "Hoch"],
    ["Planung und Umsetzung von Social-Media-Aktivitäten und Community-Management", "Intuitiv", "Hoch"],
    ["Performance-Messung und datenbasierte Optimierung von Kampagnen", "Analytisch", "Mittel"],
    ["Recherche und Aufbereitung von Themen für redaktionelle Beiträge", "Analytisch", "Mittel"],
    ["Planung und Durchführung von Events, Shootings oder Produktionen", "Impulsiv", "Mittel"],
    ["Abstimmung mit Fachabteilungen zu Kommunikationsbedarfen und Briefings", "Intuitiv", "Mittel"],
    ["Entwicklung von Styleguides und Gestaltungsrichtlinien", "Analytisch", "Mittel"],
    ["Qualitätskontrolle und Freigabe von Kommunikationsmaterialien", "Analytisch", "Mittel"],
    ["Budgetplanung und Kostenkontrolle für Kreativprojekte", "Analytisch", "Niedrig"],
    ["Beobachtung von Branchentrends und Integration neuer Formate", "Intuitiv", "Niedrig"],
  ],
  MEDIZIN: [
    ["Durchführung von Untersuchungen, Diagnostik und Befunderhebung am Patienten", "Analytisch", "Hoch"],
    ["Planung und Umsetzung therapeutischer oder pflegerischer Maßnahmen", "Analytisch", "Hoch"],
    ["Dokumentation von Behandlungsverläufen, Befunden und Pflegeberichten", "Analytisch", "Hoch"],
    ["Beratung und Aufklärung von Patienten und Angehörigen über Behandlungsoptionen", "Intuitiv", "Hoch"],
    ["Einhaltung und Umsetzung von Hygienevorschriften und Qualitätsstandards", "Analytisch", "Hoch"],
    ["Verabreichung von Medikamenten und Überwachung der Medikamentenwirkung", "Analytisch", "Mittel"],
    ["Interdisziplinäre Abstimmung mit Ärzten, Therapeuten und Pflegepersonal", "Intuitiv", "Hoch"],
    ["Erkennung und sofortige Reaktion auf Notfallsituationen und Komplikationen", "Impulsiv", "Mittel"],
    ["Assistenz bei medizinischen Eingriffen und Behandlungen", "Analytisch", "Mittel"],
    ["Betreuung und emotionale Unterstützung von Patienten in schwierigen Situationen", "Intuitiv", "Mittel"],
    ["Verwaltung und Pflege medizinischer Geräte und Materialien", "Analytisch", "Mittel"],
    ["Terminorganisation und Koordination von Untersuchungs- und Behandlungsabläufen", "Analytisch", "Mittel"],
    ["Teilnahme an Visiten, Fallbesprechungen und Qualitätszirkeln", "Intuitiv", "Niedrig"],
    ["Weiterbildung und Aneignung aktueller medizinischer Erkenntnisse und Leitlinien", "Analytisch", "Niedrig"],
    ["Abrechnung und Dokumentation nach kassenärztlichen oder klinikinternen Vorgaben", "Analytisch", "Niedrig"],
  ],
  LOGISTIK: [
    ["Planung und Steuerung der Warenflüsse vom Eingang bis zur Auslieferung", "Analytisch", "Hoch"],
    ["Kommissionierung und Verpackung von Waren nach Kundenaufträgen", "Analytisch", "Hoch"],
    ["Bestandskontrolle und Bedarfsermittlung zur Sicherstellung der Materialverfügbarkeit", "Analytisch", "Hoch"],
    ["Disposition und Tourenplanung unter Berücksichtigung von Lieferfristen und Kosten", "Analytisch", "Hoch"],
    ["Verhandlung von Frachtkonditionen und Rahmenverträgen mit Speditionen", "Impulsiv", "Hoch"],
    ["Warenannahme mit Mengen- und Qualitätskontrolle sowie Einlagerung", "Analytisch", "Mittel"],
    ["Bedienung von Flurförderzeugen und Lagertechnik nach Sicherheitsvorschriften", "Analytisch", "Hoch"],
    ["Pflege der Lagerverwaltungssoftware und Buchung von Warenbewegungen", "Analytisch", "Mittel"],
    ["Koordination mit Produktion, Einkauf und Vertrieb zur bedarfsgerechten Versorgung", "Intuitiv", "Mittel"],
    ["Inventurdurchführung mit Bestandsabgleich und Differenzklärung", "Analytisch", "Mittel"],
    ["Einhaltung von Gefahrgut-, Zoll- und Transportvorschriften", "Analytisch", "Mittel"],
    ["Optimierung der Lagerorganisation und Stellplatzstruktur", "Analytisch", "Mittel"],
    ["Bearbeitung von Transportschäden und Reklamationen", "Impulsiv", "Niedrig"],
    ["Sicherstellung von Arbeitsschutz und Ordnung im Lagerbereich", "Analytisch", "Niedrig"],
    ["Reporting von Logistikkennzahlen wie Liefertreue und Durchlaufzeit", "Analytisch", "Niedrig"],
  ],
  RECHT: [
    ["Prüfung und Bewertung rechtlicher Sachverhalte und Vertragsentwürfe", "Analytisch", "Hoch"],
    ["Erstellung von Schriftsätzen, Gutachten und juristischen Stellungnahmen", "Analytisch", "Hoch"],
    ["Beratung der Geschäftsleitung und Fachabteilungen in rechtlichen Fragestellungen", "Analytisch", "Hoch"],
    ["Verhandlung und Gestaltung von Verträgen mit Geschäftspartnern und Lieferanten", "Impulsiv", "Hoch"],
    ["Überwachung der Einhaltung regulatorischer Anforderungen und Compliance-Vorgaben", "Analytisch", "Hoch"],
    ["Vertretung des Unternehmens in Rechtsstreitigkeiten und vor Behörden", "Impulsiv", "Hoch"],
    ["Recherche aktueller Gesetzgebung und Rechtsprechung im Fachgebiet", "Analytisch", "Mittel"],
    ["Entwicklung und Pflege von Vertragsvorlagen und Standardklauseln", "Analytisch", "Mittel"],
    ["Koordination und Steuerung externer Rechtsanwälte und Kanzleien", "Impulsiv", "Mittel"],
    ["Schulung von Mitarbeitern in rechtlichen Themen und Compliance-Anforderungen", "Intuitiv", "Mittel"],
    ["Durchführung interner Untersuchungen bei Regelverstößen", "Analytisch", "Mittel"],
    ["Risikobewertung und Ableitung von Handlungsempfehlungen bei Rechtsänderungen", "Analytisch", "Mittel"],
    ["Abstimmung mit der Geschäftsleitung bei strategischen Rechtsentscheidungen", "Intuitiv", "Niedrig"],
    ["Verwaltung von Fristen, Terminen und Akten im juristischen Bereich", "Analytisch", "Niedrig"],
    ["Dokumentation und Archivierung rechtlicher Vorgänge und Verträge", "Analytisch", "Niedrig"],
  ],
  BILDUNG: [
    ["Planung und Durchführung von Unterrichtseinheiten und Seminaren nach Lehrplan", "Analytisch", "Hoch"],
    ["Didaktische Aufbereitung von Lerninhalten für verschiedene Zielgruppen", "Intuitiv", "Hoch"],
    ["Individuelle Förderung und Begleitung von Lernenden bei Lernprozessen", "Intuitiv", "Hoch"],
    ["Leistungsbewertung und Erstellung von Zeugnissen und Beurteilungen", "Analytisch", "Hoch"],
    ["Entwicklung und Aktualisierung von Curricula und Lehrmaterialien", "Analytisch", "Hoch"],
    ["Beratung von Lernenden und Eltern in Bildungs- und Entwicklungsfragen", "Intuitiv", "Mittel"],
    ["Durchführung von Prüfungen und Lernstandserhebungen", "Analytisch", "Hoch"],
    ["Moderation von Diskussionen und Förderung kritischen Denkens", "Intuitiv", "Mittel"],
    ["Einsatz digitaler Medien und E-Learning-Formate im Unterricht", "Analytisch", "Mittel"],
    ["Teilnahme an Konferenzen und Fachgremien zur Abstimmung pädagogischer Konzepte", "Intuitiv", "Mittel"],
    ["Durchführung von Forschungsprojekten und Veröffentlichung wissenschaftlicher Ergebnisse", "Analytisch", "Mittel"],
    ["Betreuung von Abschlussarbeiten und Praktika", "Intuitiv", "Mittel"],
    ["Organisation und Begleitung von Exkursionen und Projekttagen", "Intuitiv", "Niedrig"],
    ["Weiterbildung und Reflexion der eigenen Lehrmethoden und -kompetenzen", "Analytisch", "Niedrig"],
    ["Administrative Aufgaben wie Klassenbuchführung und Notenverwaltung", "Analytisch", "Niedrig"],
  ],
  HANDWERK: [
    ["Fachgerechte Ausführung handwerklicher Arbeiten nach Kundenauftrag und Spezifikation", "Analytisch", "Hoch"],
    ["Materialauswahl und -vorbereitung unter Berücksichtigung von Qualität und Kosten", "Analytisch", "Hoch"],
    ["Lesen und Umsetzen von technischen Zeichnungen, Plänen und Arbeitsanweisungen", "Analytisch", "Hoch"],
    ["Bedienung und Pflege von Maschinen, Werkzeugen und Spezialgeräten", "Analytisch", "Hoch"],
    ["Qualitätskontrolle der eigenen Arbeitsergebnisse nach definierten Standards", "Analytisch", "Hoch"],
    ["Einhaltung von Sicherheitsvorschriften und Arbeitsschutzrichtlinien", "Analytisch", "Mittel"],
    ["Kundenberatung und Besprechung von Wünschen, Möglichkeiten und Kosten", "Intuitiv", "Hoch"],
    ["Organisation des eigenen Arbeitsplatzes und effiziente Arbeitsplanung", "Analytisch", "Mittel"],
    ["Bestellwesen und Lagerhaltung von Materialien und Verbrauchsgütern", "Analytisch", "Mittel"],
    ["Anleitung und Einweisung von Lehrlingen und Hilfskräften", "Intuitiv", "Mittel"],
    ["Fehlersuche und Reparatur bei Mängeln oder Reklamationen", "Analytisch", "Mittel"],
    ["Erstellung von Aufmaßen, Kostenvoranschlägen und Abrechnungen", "Analytisch", "Mittel"],
    ["Koordination mit anderen Gewerken und Projektbeteiligten auf der Baustelle", "Intuitiv", "Niedrig"],
    ["Dokumentation der durchgeführten Arbeiten und verwendeten Materialien", "Analytisch", "Niedrig"],
    ["Weiterbildung zu neuen Materialien, Techniken und Vorschriften", "Analytisch", "Niedrig"],
  ],
  GENERISCH: [
    ["Eigenständige Planung und Organisation der täglichen Arbeitsaufgaben", "Analytisch", "Hoch"],
    ["Fachgerechte Ausführung der Kernaufgaben im eigenen Verantwortungsbereich", "Analytisch", "Hoch"],
    ["Sicherstellung der Qualität aller Arbeitsergebnisse nach internen Standards", "Analytisch", "Hoch"],
    ["Abstimmung und Zusammenarbeit mit Kollegen und angrenzenden Fachbereichen", "Intuitiv", "Hoch"],
    ["Dokumentation und Reporting relevanter Kennzahlen und Arbeitsergebnisse", "Analytisch", "Mittel"],
    ["Kommunikation mit internen und externen Ansprechpartnern", "Intuitiv", "Hoch"],
    ["Mitwirkung an der Optimierung bestehender Prozesse und Arbeitsabläufe", "Analytisch", "Hoch"],
    ["Einhaltung von Vorschriften, Richtlinien und Qualitätsstandards", "Analytisch", "Mittel"],
    ["Termingerechte Bearbeitung und Priorisierung eingehender Aufgaben", "Impulsiv", "Mittel"],
    ["Pflege und Aktualisierung von Daten und Informationen in Fachsystemen", "Analytisch", "Mittel"],
    ["Unterstützung bei Projekten und bereichsübergreifenden Initiativen", "Intuitiv", "Mittel"],
    ["Eigenständige Problemlösung und Entscheidungsfindung im Tagesgeschäft", "Impulsiv", "Mittel"],
    ["Vorbereitung und Teilnahme an Team- und Abteilungsbesprechungen", "Intuitiv", "Niedrig"],
    ["Weiterentwicklung der eigenen fachlichen und methodischen Kompetenzen", "Analytisch", "Niedrig"],
    ["Weitergabe von Wissen und Erfahrung an neue Teammitglieder", "Intuitiv", "Niedrig"],
  ],
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

const CAT_BIASES: Record<RoleCategory, { imp: number; int: number; ana: number }> = {
  FUEHRUNG: { imp: 40, int: 30, ana: 30 },
  IT: { imp: 10, int: 15, ana: 75 },
  TECHNIK: { imp: 10, int: 10, ana: 80 },
  VERTRIEB: { imp: 45, int: 25, ana: 30 },
  FINANZEN: { imp: 10, int: 10, ana: 80 },
  VERWALTUNG: { imp: 10, int: 20, ana: 70 },
  SOZIAL: { imp: 15, int: 55, ana: 30 },
  KREATIV: { imp: 20, int: 35, ana: 45 },
  MEDIZIN: { imp: 15, int: 30, ana: 55 },
  LOGISTIK: { imp: 25, int: 15, ana: 60 },
  RECHT: { imp: 20, int: 15, ana: 65 },
  BILDUNG: { imp: 10, int: 40, ana: 50 },
  HANDWERK: { imp: 15, int: 15, ana: 70 },
  GENERISCH: { imp: 25, int: 30, ana: 45 },
};

function detectCategory(beruf: string): RoleCategory {
  const lower = beruf.toLowerCase();
  const ordered: RoleCategory[] = ["FUEHRUNG","IT","TECHNIK","VERTRIEB","FINANZEN","MEDIZIN","LOGISTIK","RECHT","BILDUNG","SOZIAL","KREATIV","HANDWERK","VERWALTUNG"];
  let bestCat: RoleCategory = "GENERISCH";
  let bestScore = 0;
  for (const cat of ordered) {
    let score = 0;
    for (const kw of CAT_KEYWORDS[cat]) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }
  return bestCat;
}

function pickNeben(bias: { imp: number; int: number; ana: number }): Item[] {
  const result: Item[] = [];
  const total = bias.imp + bias.int + bias.ana;
  const impCount = Math.round((bias.imp / total) * 10);
  const intCount = Math.round((bias.int / total) * 10);
  const anaCount = 10 - impCount - intCount;
  const pick = (typ: KompetenzTyp, count: number) => {
    const pool = NEBEN_POOL[typ];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      result.push({ name: pool[i][0], kompetenz: typ, niveau: pool[i][1] });
    }
  };
  pick("Impulsiv", Math.max(1, impCount));
  pick("Intuitiv", Math.max(2, intCount));
  pick("Analytisch", Math.max(1, anaCount));
  while (result.length > 10) result.pop();
  while (result.length < 10) {
    const extras: [string, KompetenzTyp, Niveau][] = [
      ["Anpassungsfähigkeit und konstruktiver Umgang mit Veränderungen", "Intuitiv", "Mittel"],
      ["Verantwortungsbewusstsein gegenüber Aufgaben und dem Arbeitsumfeld", "Impulsiv", "Mittel"],
      ["Kreativität und Ideenreichtum bei der Entwicklung neuer Lösungsansätze", "Intuitiv", "Niedrig"],
    ];
    const extra = extras[result.length - 10] || extras[0];
    result.push({ name: extra[0], kompetenz: extra[1], niveau: extra[2] });
  }
  return result;
}

export function generateGenericKompetenzen(beruf: string): Result {
  const cat = detectCategory(beruf);
  const haupt = HAUPT_POOLS[cat].map(([name, kompetenz, niveau]) => ({ name, kompetenz, niveau }));
  const bias = CAT_BIASES[cat];
  const neben = pickNeben(bias);
  return { haupt, neben };
}

export { detectCategory };
