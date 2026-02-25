export interface OverweightData {
  bullets: string[];
  text: string;
}

export interface VariantTexts {
  intro: string;
  overall: string;
  tasks: string;
  human: string;
  leadership_section?: string;
  overweight: Record<string, OverweightData>;
  conclusion: string;
}

export interface ProfileTexts {
  noLeadership: Record<string, VariantTexts>;
  leadership: Record<string, VariantTexts>;
}

const imp_overweight_noLead = {
  speed_over: {
    bullets: ["Prozesse werden verkürzt oder übersprungen", "Absicherung und Dokumentation sinken", "Prioritäten wechseln häufiger als tragbar", "Nacharbeit und Korrekturen nehmen spürbar zu"],
    text: "Im Alltag steigt die Geschwindigkeit, gleichzeitig sinkt die Verlässlichkeit in Qualität, Abstimmung und Nachvollziehbarkeit. Fehler werden erst spät sichtbar und kosten dann überproportional Zeit."
  },
  structure_over: {
    bullets: ["Entscheidungen werden verzögert oder delegiert", "Dynamik und Handlungsspielraum sinken", "Chancen werden später erkannt oder gar nicht genutzt", "Wirksamkeit wird durch Prozesse gebremst"],
    text: "Im Alltag steigt die Ordnung, gleichzeitig verliert die Rolle an Schlagkraft und Abschlussgeschwindigkeit. Das Risiko: Die Funktion wird steuernd, aber nicht mehr gestaltend."
  },
  collaboration_over: {
    bullets: ["Abstimmung dominiert über Entscheidung", "Konflikte werden moderiert statt klar gelöst", "Verbindlichkeit nimmt ab", "Zielklarheit verliert an Schärfe"],
    text: "Im Alltag bleibt das Miteinander stabil, jedoch sinkt die Konsequenz in Richtung und Abschluss. Entscheidungen brauchen länger und verlieren an Verbindlichkeit."
  }
};

const imp_overweight_lead = {
  speed_over: {
    bullets: ["Druck im Team steigt spürbar", "Abstimmung wird verkürzt oder übergangen", "Fehlentscheidungen nehmen zu", "Fluktuationsrisiko und Erschöpfung steigen"],
    text: "Im Alltag entsteht Tempo, gleichzeitig steigt die Reibung im Team und die Fehlerquote. Die Führung wirkt getrieben statt steuernd – und verliert an Vertrauen."
  },
  structure_over: {
    bullets: ["Tempo und Entschlossenheit sinken", "Entscheidungen werden zunehmend abgesichert", "Wirksamkeit wird langsamer sichtbar", "Steuerung wirkt bürokratisch statt klar"],
    text: "Im Alltag steigt die Kontrolle, jedoch sinkt die Dynamik in Abschluss und Umsetzung. Die Führung verliert ihre natürliche Stärke: schnelle, klare Entscheidungen."
  },
  collaboration_over: {
    bullets: ["Konsens dominiert über Richtung", "Konsequenz sinkt bei Zielabweichungen", "Ergebnisfokus verwässert zugunsten von Harmonie", "Prioritäten werden verhandelbar statt verbindlich"],
    text: "Im Alltag bleibt das Klima ruhig, jedoch leidet die Klarheit in Ziel und Leistung. Das Team spürt Unsicherheit in der Führung."
  }
};

const ana_overweight_noLead = {
  structure_over: {
    bullets: ["Entscheidungen dauern spürbar länger", "Detailtiefe steigt über das Notwendige hinaus", "Reaktionsgeschwindigkeit sinkt in dynamischen Situationen", "Absicherung wird zum Selbstzweck"],
    text: "Im Alltag steigt die Genauigkeit, gleichzeitig sinkt die Beweglichkeit. In dynamischen Umfeldern fehlt die Fähigkeit, pragmatisch zu entscheiden, bevor alle Fakten vorliegen."
  },
  speed_over: {
    bullets: ["Prozesse werden verkürzt oder übersprungen", "Qualitätssicherung leidet sichtbar", "Nacharbeit und Schnittstellenfehler nehmen zu", "Verlässlichkeit der Ergebnisse sinkt"],
    text: "Im Alltag steigt das Tempo, jedoch sinkt die Verlässlichkeit in Ordnung und Qualität. Die Stärke der Rolle – saubere Struktur – geht verloren."
  },
  collaboration_over: {
    bullets: ["Abstimmung dominiert über Sachlogik", "Entscheidungen werden situativer statt faktenbezogen", "Verbindlichkeit sinkt zugunsten von Kompromissen", "Struktur verliert an Schärfe und Tiefe"],
    text: "Im Alltag bleibt das Umfeld eingebunden, jedoch leidet die Klarheit in Prozess und Priorität. Die Rolle verliert ihre ordnende Wirkung."
  }
};

const ana_overweight_lead = {
  structure_over: {
    bullets: ["Entscheidungen werden zunehmend verzögert", "Kontrolle nimmt überproportional zu", "Tempo und Anpassungsfähigkeit sinken", "Das Team wirkt gebremst und eingeschränkt"],
    text: "Im Alltag steigt die Sicherheit, jedoch sinkt die Dynamik in Umsetzung und Anpassung. Die Führung wirkt kontrollierend statt ermöglichend."
  },
  speed_over: {
    bullets: ["Standards werden aufgeweicht", "Fehlerquote steigt spürbar", "Nacharbeit und Korrekturschleifen nehmen zu", "Planbarkeit und Vorhersagbarkeit sinken"],
    text: "Im Alltag steigt die Geschwindigkeit, jedoch sinkt die Stabilität in Qualität und Prozess. Die Führung verliert ihre Ankerfunktion."
  },
  collaboration_over: {
    bullets: ["Konsens dominiert über fachliche Klarheit", "Prioritäten werden verhandelbar statt gesetzt", "Verbindlichkeit sinkt", "Struktur und Standards werden weicher"],
    text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Richtung und Standard. Die Führung wirkt anpassend statt orientierend."
  }
};

const int_overweight_noLead = {
  collaboration_over: {
    bullets: ["Abstimmung dominiert den Arbeitsalltag", "Entscheidungen werden aufgeschoben oder verwässert", "Prioritäten werden zu situativ gehandhabt", "Verbindlichkeit und Klarheit sinken"],
    text: "Im Alltag bleibt das Miteinander stabil, jedoch kann Klarheit in Priorität und Abschluss nachlassen. Die Rolle verliert ihre Verbindlichkeit."
  },
  speed_over: {
    bullets: ["Entscheidungen werden beschleunigt ohne Rücksicht", "Abstimmung wird verkürzt oder übersprungen", "Konflikte nehmen zu und eskalieren schneller", "Akzeptanz im Umfeld sinkt"],
    text: "Im Alltag steigt die Dynamik, gleichzeitig steigt die Reibung im Umfeld. Die Stärke der Rolle – tragfähige Abstimmung – wird untergraben."
  },
  structure_over: {
    bullets: ["Prozesse werden starrer und formaler", "Flexibilität und Kontextsensibilität sinken", "Zusammenarbeit wird funktionaler statt beziehungsbezogen", "Die Rolle verliert ihre vermittelnde Wirkung"],
    text: "Im Alltag steigt die Ordnung, gleichzeitig sinkt die Anschlussfähigkeit im Umfeld. Die Rolle wird korrekt, aber nicht mehr verbindend."
  }
};

const int_overweight_lead = {
  collaboration_over: {
    bullets: ["Konsens dominiert über klare Richtung", "Leistungsdruck sinkt, Ergebnisorientierung schwindet", "Entscheidungen werden vertagt statt getroffen", "Richtung und Zielklarheit verlieren Schärfe"],
    text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Konsequenz in Ziel und Abschluss. Die Führung wirkt vermittelnd, aber nicht steuernd."
  },
  speed_over: {
    bullets: ["Druck steigt im gesamten Team", "Konflikte nehmen zu und werden sichtbarer", "Abstimmung wird verkürzt oder fällt weg", "Akzeptanz und Vertrauen sinken"],
    text: "Im Alltag entsteht Tempo, gleichzeitig sinkt die Stabilität im Team. Die Führungskraft verliert ihre Brückenfunktion."
  },
  structure_over: {
    bullets: ["Prozesse dominieren über Beziehung", "Flexibilität sinkt spürbar", "Kommunikation wird formaler und kälter", "Das Team fühlt sich eingeengt und kontrolliert"],
    text: "Im Alltag steigt die Ordnung, jedoch sinkt die Anschlussfähigkeit im Team. Die Führung wirkt regulierend statt integrierend."
  }
};

export const PROFILE_TEXTS: Record<string, ProfileTexts> = {
  balanced_all: {
    noLeadership: {
      balanced: {
        intro: "Er zeigt, wie Entscheidungen vorbereitet werden, wie Zusammenarbeit stattfindet und wie stark Struktur im Arbeitsalltag gefordert ist.",
        overall: "Das Rollenbild ist ausgewogen. Die Funktion verlangt sowohl verlässliche Organisation als auch passende Abstimmung im Umfeld. Umsetzung ist notwendig, ohne dass Geschwindigkeit allein zum Treiber wird. Die drei Anforderungsbereiche – zielorientiertes Handeln, kontextbezogene Zusammenarbeit und strukturierte Vorgehensweise – stehen in einem stabilen Gleichgewicht zueinander. Es gibt keinen einzelnen Schwerpunkt, der die Rolle dominiert.",
        tasks: "Die Aufgaben verbinden geordnete Arbeitsweise mit situationsgerechter Abstimmung. Es geht darum, zuverlässig zu liefern und gleichzeitig anschlussfähig im Arbeitskontext zu bleiben. Weder reines Abarbeiten noch dauerhafte Rücksprache sind zielführend – die Aufgaben verlangen beides in einem gesunden Maß.",
        human: "Gefordert ist ein ruhiges, strukturiertes Vorgehen mit der Fähigkeit, unterschiedliche Anforderungen einzuordnen und sauber zu priorisieren. Die Person sollte belastbar, anpassungsfähig und kooperationsbereit sein – ohne dabei den eigenen Qualitätsanspruch aufzugeben.",
        overweight: {
          structure_over: { bullets: ["Entscheidungen werden stärker geprüft", "Detailtiefe nimmt über das Nötige hinaus zu", "Anpassungsfähigkeit sinkt spürbar", "Abstimmung tritt in den Hintergrund"], text: "Im Alltag bleibt die Arbeit sauber und korrekt, jedoch sinkt die Beweglichkeit in wechselnden Situationen. Die Rolle wird starr, wo sie eigentlich flexibel wirken sollte." },
          collaboration_over: { bullets: ["Abstimmung wird priorisiert über Ergebnis", "Prioritäten werden zu situativ angepasst", "Verbindlichkeit kann schleichend abnehmen", "Struktur verliert an Schärfe und Klarheit"], text: "Im Alltag funktioniert das Miteinander, gleichzeitig kann Klarheit in Planung und Zuständigkeit nachlassen. Die Rolle wird harmonisch, aber weniger wirksam." },
          speed_over: { bullets: ["Entscheidungen werden beschleunigt ohne Absicherung", "Prozesse werden verkürzt", "Prioritäten wechseln häufiger als tragbar", "Ordnung und Qualität nehmen ab"], text: "Im Alltag steigt die Dynamik, während Ordnung und Abstimmung an Stabilität verlieren können. Die Rolle gewinnt Tempo, aber verliert Bodenhaftung." },
        },
        conclusion: "Die Rolle ist auf Balance angelegt. Sie verlangt klare Organisation, saubere Abstimmung und verlässliche Umsetzung im gleichen Maß. Erfolgreich wird, wer alle drei Bereiche bedient, ohne einen auf Kosten der anderen zu überdehnen.",
      },
    },
    leadership: {
      balanced: {
        intro: "Er zeigt, wie Ziele gesetzt, Entscheidungen getroffen und Zusammenarbeit im Team gestaltet werden.",
        overall: "Das Rollenbild ist ausgewogen. Die Führungsaufgabe verlangt Orientierung über Struktur, Stabilität in der Zusammenarbeit und verlässliche Umsetzung im Alltag. Kein einzelner Bereich dominiert – die Wirksamkeit entsteht durch das Zusammenspiel von Richtung, Einbindung und Ordnung.",
        tasks: "Die Aufgaben verbinden Steuerung über klare Abläufe mit ausreichender Anpassungsfähigkeit. Entscheidungen müssen tragfähig sein und zugleich im Umfeld funktionieren. Die Aufgabenstruktur verlangt situative Flexibilität ohne Verlust an Verbindlichkeit.",
        human: "Gefordert ist ein klarer Kopf unter Druck, saubere Priorisierung und die Fähigkeit, unterschiedliche Erwartungen zu ordnen, ohne an Verbindlichkeit zu verlieren. Die Person muss verschiedene Perspektiven zusammenführen können.",
        leadership_section: "Führung entsteht hier durch Klarheit und Verlässlichkeit. Ziele werden eindeutig formuliert, Entscheidungen nachvollziehbar getroffen und Verantwortung sauber verteilt. Die Führungskraft wirkt als Ankerpunkt – nicht durch Dominanz, sondern durch Berechenbarkeit.",
        overweight: {
          speed_over: { bullets: ["Druck im Team steigt merklich", "Abstimmung wird verkürzt oder übergangen", "Prioritäten wechseln häufiger als tragbar", "Fehlsteuerung und Unruhe nehmen zu"], text: "Im Alltag entsteht Tempo, gleichzeitig sinkt die Stabilität in Richtung und Verantwortlichkeit. Das Team verliert Orientierung." },
          structure_over: { bullets: ["Entscheidungen werden zunehmend verzögert", "Kontrolle nimmt spürbar zu", "Reaktionsgeschwindigkeit sinkt", "Chancen werden verpasst oder zu spät erkannt"], text: "Im Alltag steigt die Absicherung, jedoch verliert die Führung an Dynamik und Gestaltungskraft." },
          collaboration_over: { bullets: ["Konsens wird priorisiert über Richtung", "Konflikte werden vertagt statt gelöst", "Leistungsorientierung verwässert", "Verbindlichkeit nimmt ab"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Ziel und Konsequenz. Die Führung wirkt ausgleichend, aber nicht mehr richtungsgebend." },
        },
        conclusion: "Die Führungsrolle verlangt Balance. Sie verbindet klare Steuerung, stabile Zusammenarbeit und verlässliche Umsetzung. Wirksamkeit entsteht, wenn alle drei Bereiche gleichmäßig bedient werden.",
      },
    },
  },

  imp: {
    noLeadership: {
      strong: {
        intro: "Im Mittelpunkt steht, wie konsequent umgesetzt wird, wie entschieden wird und wie stark Ziele den Alltag bestimmen.",
        overall: "Die Rolle ist eindeutig auf Ergebnis und Umsetzung ausgerichtet. Entscheidungen werden schnell getroffen und konsequent verfolgt. Struktur unterstützt die Zielerreichung, bleibt aber Mittel zum Zweck. Zusammenarbeit ist vorhanden, jedoch klar nachgeordnet. Der Schwerpunkt ist eindeutig: Diese Funktion lebt von Tempo, Entschlossenheit und der Bereitschaft, Verantwortung sofort zu übernehmen.",
        tasks: "Die Aufgaben sind stark handlungsorientiert. Es geht um Tempo, Konsequenz und Nachverfolgung. Planung dient der Steuerung, nicht der Absicherung. Operative Ergebnisse stehen im Vordergrund – wer zögert, verliert an Wirksamkeit. Die Tätigkeit verlangt schnelle Reaktionsfähigkeit und die Bereitschaft, auch unter Unsicherheit zu entscheiden.",
        human: "Gefordert sind Entschlossenheit, Verantwortungsübernahme und ein klarer Fokus auf Ergebnisse. Prioritäten werden gesetzt und gehalten. Die Person muss Druck aushalten, Widerstände überwinden und dabei handlungsfähig bleiben. Zögern oder übermäßiges Absichern sind in dieser Rolle kontraproduktiv.",
        overweight: imp_overweight_noLead,
        conclusion: "Die Rolle ist klar auf konsequente Umsetzung und Ergebnisverantwortung angelegt. Struktur dient der Steuerung, nicht der Verzögerung. Die Anforderung ist eindeutig ausgeprägt.",
      },
      clear: {
        intro: "Im Mittelpunkt steht, wie zielgerichtet umgesetzt wird und wie stark ergebnisorientiertes Handeln den Arbeitsalltag prägt.",
        overall: "Die Rolle ist deutlich auf Ergebnis und Umsetzung ausgerichtet. Entscheidungen werden zügig getroffen und konsequent verfolgt. Struktur unterstützt den Arbeitsprozess, ohne ihn zu dominieren. Zusammenarbeit spielt eine Rolle, ist jedoch nicht der primäre Treiber. Die Ausrichtung ist klar erkennbar: Wirksamkeit entsteht durch Handeln, nicht durch Absichern.",
        tasks: "Die Aufgaben sind handlungsorientiert und verlangen ein hohes Maß an Eigeninitiative. Tempo und Konsequenz in der Umsetzung sind entscheidend. Planung erfolgt pragmatisch und dient der Zielerreichung, nicht der Kontrolle. Ergebnisse werden sichtbar gemacht und aktiv nachverfolgt.",
        human: "Gefordert sind Eigenverantwortung, Entscheidungsfreude und die Fähigkeit, unter Druck handlungsfähig zu bleiben. Prioritäten werden selbstständig gesetzt und gehalten. Wer abwartet statt handelt, wird dieser Rolle nicht gerecht.",
        overweight: imp_overweight_noLead,
        conclusion: "Die Rolle ist deutlich auf Umsetzung und Ergebnis ausgerichtet. Struktur dient als Leitplanke, nicht als Bremse. Die Ausrichtung ist klar erkennbar.",
      },
      light: {
        intro: "Im Vordergrund steht, wie Ergebnisorientierung und Handlungsfähigkeit den Arbeitsalltag prägen – ohne einseitig zu werden.",
        overall: "Die Rolle zeigt eine erkennbare Tendenz zu Ergebnisorientierung und Umsetzungsstärke. Entscheidungen werden bevorzugt zügig getroffen, Ergebnisse stehen im Fokus. Gleichzeitig spielen Struktur und Zusammenarbeit eine spürbare Rolle. Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv: Die Rolle verlangt Handlungsfähigkeit, ohne andere Anforderungen zu verdrängen.",
        tasks: "Die Aufgaben haben einen spürbaren Handlungsschwerpunkt. Tempo und Nachverfolgung sind wichtig, werden aber ergänzt durch Anforderungen an Planung und Abstimmung. Die Tätigkeit verlangt Initiative, ohne dabei vollständig auf Struktur oder Kooperation zu verzichten.",
        human: "Gefordert sind Eigeninitiative und Ergebnisorientierung, ergänzt durch die Fähigkeit zur Zusammenarbeit und strukturiertem Vorgehen. Die Person sollte entscheidungsfreudig sein, aber auch zuhören und einordnen können.",
        overweight: imp_overweight_noLead,
        conclusion: "Die Rolle verlangt Umsetzungsstärke, ohne einseitig zu sein. Ergebnisorientierung ist der erkennbare Schwerpunkt, wird aber durch Struktur und Kooperation ergänzt.",
      },
    },
    leadership: {
      strong: {
        intro: "Im Mittelpunkt stehen Zielklarheit, Konsequenz und Ergebnisverantwortung in der Führung.",
        overall: "Die Rolle ist eindeutig ergebnis- und steuerungsorientiert. Führung erfolgt über klare Erwartungen, konsequentes Nachhalten und schnelle Entscheidungen. Struktur ist notwendig, um Transparenz zu sichern. Zusammenarbeit ist wichtig, bleibt aber klar nachgeordnet. Die Anforderung ist eindeutig: Wirksamkeit entsteht über Richtung, Tempo und konsequente Umsetzung.",
        tasks: "Die Aufgaben verlangen klare Steuerung der Aktivitäten und konsequentes Einfordern von Ergebnissen. Zielerreichung wird messbar gemacht und aktiv nachgehalten. Abweichungen werden direkt adressiert, nicht vertagt.",
        human: "Gefordert sind Durchsetzung, Entscheidungsstärke und die Fähigkeit, Verantwortung eindeutig zuzuordnen. Die Person muss Klarheit schaffen, auch wenn das unbequem ist. Konfliktvermeidung ist kontraproduktiv.",
        leadership_section: "Führung entsteht über Richtung und Konsequenz. Ziele sind messbar, Prioritäten eindeutig und Verantwortlichkeit klar geregelt. Das Team weiß, was erwartet wird – und was passiert, wenn Ergebnisse ausbleiben. Die Führungskraft steuert aktiv, nicht reaktiv.",
        overweight: imp_overweight_lead,
        conclusion: "Die Führungsrolle ist eindeutig auf Richtung, Ergebnis und konsequente Umsetzung ausgelegt. Struktur sichert Transparenz, ersetzt aber nicht Entscheidung.",
      },
      clear: {
        intro: "Im Mittelpunkt stehen Ergebnisverantwortung, klare Steuerung und zielgerichtetes Führungshandeln.",
        overall: "Die Rolle ist deutlich ergebnisorientiert. Führung erfolgt über klare Erwartungen und konsequentes Nachhalten. Struktur sichert Transparenz, Zusammenarbeit unterstützt die Umsetzung. Die Ausrichtung ist klar erkennbar: Wirksamkeit entsteht durch Klarheit in Ziel und Verantwortung.",
        tasks: "Die Aufgaben verlangen klare Steuerung und systematisches Nachhalten von Ergebnissen. Zielerreichung wird sichtbar gemacht und aktiv eingefordert.",
        human: "Gefordert sind Entscheidungsstärke, Verantwortungsbewusstsein und die Fähigkeit, klare Prioritäten durchzusetzen. Die Person muss auch unter Druck handlungsfähig und richtungsgebend bleiben.",
        leadership_section: "Führung entsteht über Richtung und Verbindlichkeit. Ziele werden klar formuliert, Erwartungen transparent gemacht und Ergebnisse konsequent eingefordert. Das Team erhält Orientierung durch eindeutige Prioritäten.",
        overweight: imp_overweight_lead,
        conclusion: "Die Führungsrolle ist deutlich auf Ergebnis und Richtung ausgelegt. Struktur dient der Transparenz, Zusammenarbeit der Umsetzung.",
      },
      light: {
        intro: "Im Vordergrund steht, wie Ergebnisverantwortung und aktive Steuerung die Führungsarbeit prägen.",
        overall: "Die Rolle zeigt eine erkennbare Tendenz zu Ergebnisorientierung und aktiver Steuerung. Führung erfolgt zielorientiert, wird aber ergänzt durch strukturelle Rahmensetzung und Einbindung des Teams. Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv.",
        tasks: "Die Aufgaben verlangen Zielorientierung und aktives Nachhalten, eingebettet in eine Struktur, die dem Team Orientierung gibt. Ergebnisorientierung prägt die Tätigkeit, ohne sie einseitig zu dominieren.",
        human: "Gefordert sind Eigeninitiative und Entscheidungsbereitschaft, ergänzt durch die Fähigkeit, das Team einzubinden und strukturiert vorzugehen.",
        leadership_section: "Führung entsteht durch klare Zielsetzung und aktives Nachhalten, ergänzt durch Einbindung und verlässliche Rahmenbedingungen. Die Führungskraft steuert, ohne das Team zu übergehen.",
        overweight: imp_overweight_lead,
        conclusion: "Die Führungsrolle verlangt Ergebnisorientierung, ohne einseitig zu sein. Aktive Steuerung wird durch Struktur und Teamarbeit ergänzt.",
      },
    },
  },

  ana: {
    noLeadership: {
      strong: {
        intro: "Im Vordergrund stehen Ordnung, Präzision und planbares Vorgehen als zentrale Erfolgsfaktoren.",
        overall: "Die Rolle ist eindeutig auf Struktur und Genauigkeit ausgerichtet. Entscheidungen werden sorgfältig vorbereitet und nachvollziehbar abgesichert. Umsetzung erfolgt konsequent, jedoch strikt innerhalb klarer Abläufe. Zusammenarbeit unterstützt die Funktion, steht aber deutlich nicht im Zentrum. Die Anforderung ist eindeutig: Qualität entsteht durch Systematik, nicht durch Improvisation.",
        tasks: "Die Aufgaben verlangen saubere Planung, lückenlose Dokumentation und konsequente Qualitätssicherung. Abweichungen werden erkannt, analysiert und systematisch bearbeitet. Die Tätigkeit lebt von Vorhersagbarkeit, Ordnung und einem hohen Maß an fachlicher Tiefe.",
        human: "Gefordert sind Sorgfalt, Verlässlichkeit und ein klares Qualitätsverständnis. Prioritäten werden strukturiert gesetzt und konsequent eingehalten. Die Person muss Komplexität ordnen können, ohne den Überblick zu verlieren. Schnellschüsse und oberflächliche Lösungen sind kontraproduktiv.",
        overweight: ana_overweight_noLead,
        conclusion: "Die Rolle ist eindeutig auf klare Abläufe, Präzision und verlässliche Qualität ausgelegt. Entscheidungen sollen nachvollziehbar und stabil sein. Die Anforderung ist klar ausgeprägt.",
      },
      clear: {
        intro: "Im Vordergrund stehen Ordnung, Qualitätsanspruch und strukturiertes Vorgehen.",
        overall: "Die Rolle ist deutlich auf Struktur und Genauigkeit ausgerichtet. Entscheidungen werden vorbereitet und abgesichert. Umsetzung erfolgt innerhalb klarer Abläufe. Zusammenarbeit unterstützt die Funktion, dominiert sie aber nicht. Die Ausrichtung ist klar erkennbar: Verlässlichkeit entsteht durch Ordnung und Systematik.",
        tasks: "Die Aufgaben verlangen saubere Planung, Dokumentation und Qualitätssicherung. Abweichungen werden erkannt und systematisch bearbeitet. Die Tätigkeit verlangt Genauigkeit und ein gutes Gespür für Prioritäten innerhalb gegebener Strukturen.",
        human: "Gefordert sind Sorgfalt, Verlässlichkeit und ein klares Qualitätsverständnis. Prioritäten werden strukturiert gesetzt und eingehalten. Die Person sollte analytisch denken und sauber arbeiten.",
        overweight: ana_overweight_noLead,
        conclusion: "Die Rolle ist deutlich auf Struktur, Qualität und nachvollziehbare Abläufe ausgerichtet. Die Ausrichtung ist klar erkennbar.",
      },
      light: {
        intro: "Im Vordergrund steht, wie Struktur und Qualitätssicherung den Arbeitsalltag prägen – ergänzt durch Umsetzungsfähigkeit und Abstimmung.",
        overall: "Die Rolle zeigt eine erkennbare Tendenz zu Struktur und Genauigkeit. Entscheidungen werden bevorzugt vorbereitet und abgesichert. Gleichzeitig spielen Umsetzungstempo und Zusammenarbeit eine spürbare Rolle. Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv: Die Rolle verlangt Ordnung, ohne andere Anforderungen zu verdrängen.",
        tasks: "Die Aufgaben haben einen spürbaren Strukturschwerpunkt. Planung und Qualitätssicherung sind wichtig, werden aber ergänzt durch Anforderungen an Umsetzung und Abstimmung. Die Tätigkeit verlangt Genauigkeit, ohne dabei starr zu werden.",
        human: "Gefordert sind Sorgfalt und Verlässlichkeit, ergänzt durch die Fähigkeit zur Zusammenarbeit und pragmatischem Handeln. Die Person sollte strukturiert denken, aber auch anpassungsfähig sein.",
        overweight: ana_overweight_noLead,
        conclusion: "Die Rolle verlangt Struktur und Qualitätsbewusstsein, ohne einseitig zu sein. Ordnung ist der erkennbare Schwerpunkt, wird aber durch Umsetzungsfähigkeit und Kooperation ergänzt.",
      },
    },
    leadership: {
      strong: {
        intro: "Im Vordergrund stehen klare Struktur, stabile Prozesse und verlässliche Entscheidungen als Fundament der Führung.",
        overall: "Führung in dieser Rolle erfolgt eindeutig über Ordnung, Planung und nachvollziehbare Steuerung. Erwartungen werden klar formuliert und über Transparenz gesichert. Umsetzung ist wichtig, bleibt jedoch strikt an klare Standards gebunden. Die Anforderung ist eindeutig: Die Führungskraft schafft Orientierung durch Struktur, nicht durch Charisma.",
        tasks: "Die Aufgaben verlangen Prozessklarheit, konsequente Qualitätssicherung und strukturierte Steuerung der Ergebnisse. Abweichungen werden systematisch analysiert und behoben. Standards sind nicht verhandelbar.",
        human: "Gefordert sind Ruhe, Sorgfalt und die Fähigkeit, Komplexität zu ordnen und Entscheidungen nachvollziehbar zu begründen. Die Person muss auch unter Druck sachlich und strukturiert bleiben.",
        leadership_section: "Führung entsteht durch klare Rahmenbedingungen, definierte Zuständigkeiten und konsequentes Qualitätsniveau. Das Team erhält Orientierung über verlässliche Strukturen, nicht über Appelle. Entscheidungen werden begründet und transparent gemacht.",
        overweight: ana_overweight_lead,
        conclusion: "Die Führungsrolle ist eindeutig auf Prozessklarheit, stabile Standards und nachvollziehbare Steuerung ausgerichtet.",
      },
      clear: {
        intro: "Im Vordergrund stehen klare Struktur, verlässliche Prozesse und nachvollziehbare Steuerung.",
        overall: "Führung in dieser Rolle erfolgt deutlich über Ordnung und Planung. Erwartungen werden klar formuliert und systematisch nachgehalten. Umsetzung erfolgt innerhalb definierter Standards. Die Ausrichtung ist klar erkennbar: Wirksamkeit entsteht über Verlässlichkeit.",
        tasks: "Die Aufgaben verlangen Prozessklarheit, Qualitätssicherung und strukturierte Steuerung. Ergebnisse werden gegen definierte Maßstäbe geprüft.",
        human: "Gefordert sind Sorgfalt, analytisches Denken und die Fähigkeit, komplexe Sachverhalte zu ordnen und klar zu kommunizieren.",
        leadership_section: "Führung entsteht durch klare Rahmenbedingungen und definierte Zuständigkeiten. Das Team erhält Orientierung über nachvollziehbare Strukturen und verlässliche Standards.",
        overweight: ana_overweight_lead,
        conclusion: "Die Führungsrolle ist deutlich auf Struktur, stabile Standards und nachvollziehbare Steuerung ausgerichtet.",
      },
      light: {
        intro: "Im Vordergrund steht, wie strukturierte Steuerung und Qualitätsorientierung die Führungsarbeit prägen.",
        overall: "Die Rolle zeigt eine erkennbare Tendenz zu Struktur und Qualitätsorientierung in der Führung. Entscheidungen werden bevorzugt abgesichert. Gleichzeitig spielen Ergebnisorientierung und Teamarbeit eine spürbare Rolle. Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv.",
        tasks: "Die Aufgaben haben einen spürbaren Strukturschwerpunkt in der Führung. Prozessklarheit und Qualitätssicherung sind wichtig, werden aber ergänzt durch aktive Steuerung und Teameinbindung.",
        human: "Gefordert sind analytisches Denken und Verlässlichkeit, ergänzt durch Entscheidungsbereitschaft und Kommunikationsfähigkeit.",
        leadership_section: "Führung entsteht durch klare Rahmensetzung, ergänzt durch die Bereitschaft, das Team einzubinden und pragmatisch zu steuern. Struktur gibt Orientierung, ohne einzuengen.",
        overweight: ana_overweight_lead,
        conclusion: "Die Führungsrolle verlangt Strukturorientierung, ohne einseitig zu sein. Ordnung wird durch aktive Steuerung und Teamarbeit ergänzt.",
      },
    },
  },

  int: {
    noLeadership: {
      strong: {
        intro: "Im Vordergrund stehen Zusammenarbeit, Abstimmung und situationsgerechtes Handeln als zentrale Anforderungen.",
        overall: "Die Rolle ist eindeutig auf Zusammenarbeit und Kontext ausgerichtet. Entscheidungen sollen anschlussfähig sein und im Umfeld funktionieren. Struktur ist notwendig, bleibt aber klar nachgeordnet. Umsetzung erfolgt weniger über Tempo als über Einbindung. Die Anforderung ist eindeutig: Wirksamkeit entsteht durch tragfähige Beziehungen und situative Einschätzung.",
        tasks: "Die Aufgaben verlangen laufende Abstimmung und ein ausgeprägtes Gespür für Situationen. Schnittstellenarbeit und Kommunikation sind zentral. Die Tätigkeit lebt davon, unterschiedliche Perspektiven zusammenzuführen und Lösungen zu finden, die im gesamten Umfeld funktionieren.",
        human: "Gefordert sind ausgeprägte Kommunikationsstärke, Kooperationsfähigkeit und die Fähigkeit, Spannungen früh zu erkennen und sauber zu klären. Die Person muss Brücken bauen können – zwischen Abteilungen, Interessen und Persönlichkeiten.",
        overweight: int_overweight_noLead,
        conclusion: "Die Rolle ist eindeutig auf tragfähige Zusammenarbeit und situationsgerechtes Handeln ausgerichtet. Entscheidungen sollen im Umfeld funktionieren, nicht nur sachlich korrekt sein.",
      },
      clear: {
        intro: "Im Vordergrund stehen Zusammenarbeit, situationsgerechtes Handeln und tragfähige Abstimmung im Arbeitsumfeld.",
        overall: "Die Rolle ist deutlich auf Zusammenarbeit und Kontextsensibilität ausgerichtet. Entscheidungen sollen anschlussfähig sein. Struktur unterstützt den Arbeitsprozess, dominiert ihn aber nicht. Umsetzung erfolgt über Einbindung, nicht über Tempo. Die Ausrichtung ist klar erkennbar.",
        tasks: "Die Aufgaben verlangen regelmäßige Abstimmung und ein gutes Gespür für Situationen. Schnittstellenarbeit und Kommunikation stehen im Vordergrund.",
        human: "Gefordert sind Kommunikationsstärke, Kooperationsfähigkeit und die Fähigkeit, unterschiedliche Perspektiven zusammenzuführen.",
        overweight: int_overweight_noLead,
        conclusion: "Die Rolle ist deutlich auf Zusammenarbeit und situationsgerechtes Handeln ausgerichtet. Die Ausrichtung ist klar erkennbar.",
      },
      light: {
        intro: "Im Vordergrund steht, wie Zusammenarbeit und situative Abstimmung den Arbeitsalltag prägen – ergänzt durch Struktur und Umsetzung.",
        overall: "Die Rolle zeigt eine erkennbare Tendenz zu Zusammenarbeit und Kontextsensibilität. Entscheidungen werden bevorzugt so getroffen, dass sie im Umfeld funktionieren. Gleichzeitig spielen Struktur und Umsetzungstempo eine spürbare Rolle. Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv.",
        tasks: "Die Aufgaben haben einen spürbaren Schwerpunkt in Abstimmung und Kommunikation. Schnittstellenarbeit ist wichtig, wird aber ergänzt durch Anforderungen an Planung und eigenständiges Handeln.",
        human: "Gefordert sind Kooperationsfähigkeit und Kommunikationsklarheit, ergänzt durch die Fähigkeit zur eigenständigen Strukturierung und pragmatischem Handeln.",
        overweight: int_overweight_noLead,
        conclusion: "Die Rolle verlangt Zusammenarbeit und Kontextsensibilität, ohne einseitig zu sein. Kooperation wird durch Struktur und Umsetzungsfähigkeit ergänzt.",
      },
    },
    leadership: {
      strong: {
        intro: "Im Vordergrund stehen Zusammenarbeit, Stabilität im Team und situationsgerechte Steuerung als Kern der Führungsaufgabe.",
        overall: "Führung in dieser Rolle entsteht eindeutig über Einbindung und klare Kommunikation. Entscheidungen werden so getroffen, dass sie im Team getragen werden. Struktur und Ergebnisorientierung sind wichtig, bleiben aber klar nachgeordnet. Die Anforderung ist eindeutig: Die Führungskraft wirkt als Verbinder, nicht als Antreiber.",
        tasks: "Die Aufgaben verlangen intensive Teamabstimmung, klare Kommunikation und aktive Arbeit an Schnittstellen. Ergebnisse entstehen über das Zusammenspiel im Team, nicht über individuelle Einzelleistung.",
        human: "Gefordert sind ausgeprägte Beziehungsstärke, Konfliktklarheit und ein gutes Gespür für Dynamiken im Team. Die Person muss Vertrauen aufbauen und halten können.",
        leadership_section: "Führung entsteht durch Stabilität im Miteinander und saubere Abstimmung, ohne Verbindlichkeit zu verlieren. Das Team wird eingebunden, Entscheidungen werden gemeinsam getragen. Die Führungskraft schafft Raum für Zusammenarbeit und sichert gleichzeitig Richtung.",
        overweight: int_overweight_lead,
        conclusion: "Die Führungsrolle ist eindeutig auf Teamstabilität und situationsgerechte Steuerung ausgerichtet. Entscheidungen sollen tragfähig und im Team verankert sein.",
      },
      clear: {
        intro: "Im Vordergrund stehen Teamstabilität, situationsgerechte Steuerung und tragfähige Zusammenarbeit.",
        overall: "Führung in dieser Rolle entsteht deutlich über Einbindung und Kommunikation. Entscheidungen werden so gestaltet, dass sie getragen werden. Struktur und Ergebnisorientierung spielen eine Rolle, sind aber nicht dominant. Die Ausrichtung ist klar erkennbar.",
        tasks: "Die Aufgaben verlangen Teamabstimmung, klare Kommunikation und aktive Schnittstellenarbeit.",
        human: "Gefordert sind Beziehungsstärke und die Fähigkeit, Dynamiken im Team zu lesen und konstruktiv zu steuern.",
        leadership_section: "Führung entsteht durch stabile Zusammenarbeit und saubere Abstimmung. Entscheidungen werden im Dialog entwickelt und verbindlich gemacht.",
        overweight: int_overweight_lead,
        conclusion: "Die Führungsrolle ist deutlich auf Teamstabilität und Zusammenarbeit ausgerichtet. Die Ausrichtung ist klar erkennbar.",
      },
      light: {
        intro: "Im Vordergrund steht, wie Zusammenarbeit und Teamorientierung die Führungsarbeit prägen – ergänzt durch Struktur und Ergebnisorientierung.",
        overall: "Die Rolle zeigt eine erkennbare Tendenz zu Zusammenarbeit und Teamorientierung in der Führung. Entscheidungen werden bevorzugt so getroffen, dass sie im Team funktionieren. Gleichzeitig spielen Struktur und Zielerreichung eine spürbare Rolle. Der Schwerpunkt ist erkennbar, jedoch nicht exklusiv.",
        tasks: "Die Aufgaben haben einen spürbaren Schwerpunkt in Teamarbeit und Abstimmung, ergänzt durch Anforderungen an klare Steuerung und Ergebnisnachverfolgung.",
        human: "Gefordert sind Kommunikationsfähigkeit und Teamorientierung, ergänzt durch Entscheidungsbereitschaft und strukturiertes Vorgehen.",
        leadership_section: "Führung entsteht durch Einbindung des Teams, ergänzt durch klare Zielsetzung und verlässliche Rahmenbedingungen. Die Führungskraft verbindet, ohne an Richtung zu verlieren.",
        overweight: int_overweight_lead,
        conclusion: "Die Führungsrolle verlangt Teamorientierung, ohne einseitig zu sein. Zusammenarbeit wird durch Struktur und Ergebnisfokus ergänzt.",
      },
    },
  },

  hybrid_imp_ana: {
    noLeadership: {
      clear: {
        intro: "Im Vordergrund stehen konsequente Umsetzung und klare Struktur als gleichwertige Erfolgsfaktoren.",
        overall: "Die Rolle verbindet Ergebnisorientierung mit planbarer Steuerung. Entscheidungen werden zügig getroffen, aber entlang klarer Prioritäten und Kennzahlen. Umsetzung erfolgt konsequent, ohne dass Ordnung und Nachvollziehbarkeit verloren gehen. Zusammenarbeit unterstützt die Funktion, steht jedoch nicht im Zentrum. Die Wirkung entsteht, wenn Tempo und Systematik zusammenwirken.",
        tasks: "Die Aufgaben verlangen Geschwindigkeit in der Umsetzung und gleichzeitig saubere Steuerung über klare Vorgaben und messbare Ziele. Wer nur schnell oder nur genau arbeitet, wird der Rolle nicht gerecht – beides muss parallel funktionieren.",
        human: "Gefordert sind Entschlossenheit und Struktur. Prioritäten werden klar gesetzt und konsequent eingehalten. Die Person muss handeln und gleichzeitig Ordnung halten können – ohne sich in einem der beiden Bereiche zu verlieren.",
        overweight: {
          speed_over: { bullets: ["Absicherung sinkt spürbar", "Abstimmung wird verkürzt oder übergangen", "Fehlerquote steigt", "Nacharbeit nimmt überproportional zu"], text: "Im Alltag steigt die Dynamik, gleichzeitig sinkt die Verlässlichkeit der Steuerung. Die strukturelle Komponente der Rolle wird geschwächt." },
          structure_over: { bullets: ["Tempo sinkt merklich", "Entscheidungen dauern länger als nötig", "Chancen werden später genutzt", "Wirksamkeit verzögert sich"], text: "Im Alltag steigt die Ordnung, jedoch verliert die Rolle an Abschlussstärke und Handlungsfähigkeit." },
          collaboration_over: { bullets: ["Konsens dominiert über Ergebnis", "Konsequenz sinkt", "Ziele werden verhandelbar statt verbindlich", "Prioritäten wechseln häufiger"], text: "Im Alltag bleibt das Umfeld eingebunden, jedoch sinkt Klarheit und Abschlussgeschwindigkeit." },
        },
        conclusion: "Die Rolle verbindet konsequente Umsetzung mit klarer Steuerung. Sie ist auf Ergebnis und Struktur im gleichen Maß angelegt – Stärke entsteht aus dem Zusammenspiel.",
      },
    },
    leadership: {
      clear: {
        intro: "Im Vordergrund stehen klare Zielsteuerung und verlässliche Struktur als Fundament der Führung.",
        overall: "Führung in dieser Rolle verbindet Richtung und Umsetzung mit klaren Vorgaben. Ziele sind eindeutig, Entscheidungen konsequent, Steuerung erfolgt nachvollziehbar über Kennzahlen und Prioritäten. Zusammenarbeit ist wichtig, bleibt jedoch nachgeordnet zur Ergebnislogik. Die Wirkung entsteht durch die Verbindung von Tempo und Ordnung.",
        tasks: "Die Aufgaben verlangen klare Steuerung der Aktivitäten und konsequentes Nachhalten der Ergebnisse. Zielerreichung wird messbar gemacht und aktiv eingefordert – innerhalb definierter Strukturen.",
        human: "Gefordert sind Durchsetzung und Struktur. Verantwortung wird klar zugeordnet und konsequent verfolgt. Die Person muss Ergebnisse einfordern und gleichzeitig Ordnung sichern können.",
        leadership_section: "Führung entsteht durch klare Ziele, messbare Erwartungen und konsequente Umsetzung innerhalb definierter Regeln. Das Team erhält Orientierung über Transparenz in Zielen und Prozessen.",
        overweight: {
          speed_over: { bullets: ["Druck steigt im Team", "Reibung nimmt zu", "Absicherung sinkt", "Fehlsteuerung steigt"], text: "Im Alltag steigt Tempo, während Struktur und Teamstabilität an Verlässlichkeit verlieren." },
          structure_over: { bullets: ["Tempo sinkt", "Kontrolle steigt überproportional", "Entscheidungen verzögern sich", "Team wirkt gebremst"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Abschlussstärke und Entscheidungsgeschwindigkeit." },
          collaboration_over: { bullets: ["Konsens dominiert über Richtung", "Konsequenz sinkt", "Ziele werden verhandelbar", "Prioritäten verlieren Stabilität"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Richtung und Ergebnis." },
        },
        conclusion: "Die Führungsrolle verbindet konsequente Ergebnissteuerung mit verlässlicher Struktur und klaren Prioritäten.",
      },
    },
  },

  hybrid_ana_int: {
    noLeadership: {
      clear: {
        intro: "Im Vordergrund stehen klare Organisation und tragfähige Abstimmung als gleichwertige Erfolgsfaktoren.",
        overall: "Die Rolle verbindet Struktur mit Kontextsensibilität. Entscheidungen sollen nachvollziehbar vorbereitet werden und zugleich im Arbeitsumfeld funktionieren. Ordnung und Abstimmung stehen gleichwertig nebeneinander. Umsetzung erfolgt verlässlich, ohne dass Geschwindigkeit zum Haupttreiber wird. Die Wirkung entsteht, wenn Systematik und Kooperation zusammenwirken.",
        tasks: "Die Aufgaben verlangen saubere Organisation, klare Prozesse und regelmäßige Abstimmung. Anforderungen werden eingeordnet und planbar bearbeitet. Weder reine Sachlogik noch dauerhafte Rücksprache sind zielführend – die Aufgaben verlangen beides.",
        human: "Gefordert sind Genauigkeit und Kommunikationsklarheit. Die Rolle verlangt ein strukturiertes Vorgehen und die Fähigkeit, Erwartungen sauber zu klären. Die Person muss ordnen und kommunizieren können – in gleichem Maß.",
        overweight: {
          structure_over: { bullets: ["Entscheidungen werden starrer", "Flexibilität sinkt spürbar", "Abstimmung tritt in den Hintergrund", "Anschlussfähigkeit im Umfeld sinkt"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Fähigkeit, Situationen flexibel einzuordnen. Die kooperative Komponente wird geschwächt." },
          collaboration_over: { bullets: ["Abstimmung dominiert über Sachlogik", "Prioritäten werden zu situativ", "Verbindlichkeit sinkt", "Prozessklarheit nimmt spürbar ab"], text: "Im Alltag bleibt das Miteinander stabil, jedoch sinkt die Verlässlichkeit in Planung und Ablauf. Die strukturelle Komponente wird geschwächt." },
          speed_over: { bullets: ["Tempo steigt über das Tragbare", "Absicherung sinkt", "Abstimmung wird verkürzt", "Qualität schwankt"], text: "Im Alltag entsteht Dynamik, während Ordnung und Abstimmung an Stabilität verlieren. Beide Säulen der Rolle werden gleichzeitig geschwächt." },
        },
        conclusion: "Die Rolle verbindet klare Organisation mit tragfähiger Abstimmung. Entscheidungen sollen nachvollziehbar und zugleich anschlussfähig sein – Stärke entsteht aus dem Zusammenspiel.",
      },
    },
    leadership: {
      clear: {
        intro: "Im Vordergrund stehen Orientierung über Struktur und Stabilität über Zusammenarbeit als gleichwertige Führungsprinzipien.",
        overall: "Führung in dieser Rolle verbindet klare Rahmenbedingungen mit tragfähiger Abstimmung. Entscheidungen sollen nachvollziehbar sein und im Team funktionieren. Steuerung erfolgt über klare Prioritäten, ergänzt durch stabile Kommunikation. Die Wirkung entsteht, wenn Ordnung und Einbindung zusammenwirken.",
        tasks: "Die Aufgaben verlangen Prozessklarheit, saubere Organisation und regelmäßige Einbindung des Umfelds. Die Führungskraft muss steuern und einbinden können – parallel.",
        human: "Gefordert sind Struktur und Kommunikationsfähigkeit, mit der Fähigkeit, Erwartungen zu klären und Ordnung zu sichern. Die Person muss systematisch denken und gleichzeitig beziehungsfähig sein.",
        leadership_section: "Führung entsteht durch klare Regeln, saubere Abstimmung und verlässliche Prioritäten. Das Team erhält Orientierung über Struktur und Einbindung gleichermaßen.",
        overweight: {
          structure_over: { bullets: ["Kontrolle steigt überproportional", "Flexibilität sinkt", "Team fühlt sich eingeengt", "Entscheidungen verzögern sich"], text: "Im Alltag steigt Ordnung, jedoch sinkt Beweglichkeit und Anschlussfähigkeit im Team." },
          collaboration_over: { bullets: ["Konsens dominiert", "Verbindlichkeit sinkt", "Prioritäten werden verhandelbar", "Tempo sinkt"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Ziel und Umsetzung." },
          speed_over: { bullets: ["Druck steigt", "Abstimmung sinkt", "Fehlsteuerung steigt", "Reibung nimmt zu"], text: "Im Alltag entsteht Tempo, während Ordnung und Teamstabilität nachlassen." },
        },
        conclusion: "Die Führungsrolle verbindet Struktur und Zusammenarbeit. Sie verlangt klare Organisation und tragfähige Entscheidungen im Teamkontext.",
      },
    },
  },

  hybrid_imp_int: {
    noLeadership: {
      clear: {
        intro: "Im Vordergrund stehen konsequente Umsetzung und tragfähige Zusammenarbeit als gleichwertige Erfolgsfaktoren.",
        overall: "Die Rolle verbindet Handlungsfähigkeit mit enger Abstimmung. Entscheidungen werden getroffen und umgesetzt, müssen jedoch im Umfeld funktionieren. Geschwindigkeit ist wichtig, darf aber nicht zulasten von Anschlussfähigkeit gehen. Struktur unterstützt die Arbeit, steht jedoch nicht im Zentrum. Die Wirkung entsteht, wenn Konsequenz und Kooperation zusammenwirken.",
        tasks: "Die Aufgaben verlangen schnelle Umsetzung und gleichzeitig laufende Abstimmung. Schnittstellen und Kommunikation sind zentral. Wer nur umsetzt ohne abzustimmen, oder nur abstimmt ohne umzusetzen, wird der Rolle nicht gerecht.",
        human: "Gefordert sind Eigeninitiative und Kommunikationsklarheit. Die Rolle verlangt Konsequenz in der Umsetzung und Stabilität in der Zusammenarbeit. Die Person muss handeln und gleichzeitig im Dialog bleiben.",
        overweight: {
          speed_over: { bullets: ["Abstimmung sinkt spürbar", "Konflikte nehmen zu", "Qualität schwankt", "Nacharbeit steigt"], text: "Im Alltag steigt Tempo, während Zusammenarbeit und Stabilität im Umfeld leiden. Die kooperative Komponente wird geschwächt." },
          collaboration_over: { bullets: ["Entscheidungen werden verschoben", "Konsequenz sinkt", "Prioritäten werden zu situativ", "Abschlussstärke sinkt"], text: "Im Alltag bleibt das Umfeld stabil, jedoch sinkt die Durchsetzung in Richtung und Ergebnis. Die Handlungskomponente wird geschwächt." },
          structure_over: { bullets: ["Tempo sinkt merklich", "Handlungsspielraum wird enger", "Flexibilität sinkt", "Wirksamkeit verzögert sich"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Dynamik in Umsetzung und Abschluss. Beide Säulen der Rolle werden gebremst." },
        },
        conclusion: "Die Rolle verbindet konsequente Umsetzung mit tragfähiger Zusammenarbeit. Entscheidungen müssen wirksam und anschlussfähig sein – Stärke entsteht aus dem Zusammenspiel.",
      },
    },
    leadership: {
      clear: {
        intro: "Im Vordergrund stehen klare Umsetzung und stabile Teamarbeit als gleichwertige Führungsprinzipien.",
        overall: "Führung in dieser Rolle verbindet Richtung und Tempo mit Einbindung. Entscheidungen werden getroffen und umgesetzt, müssen jedoch im Team getragen werden. Struktur unterstützt die Steuerung, ohne zum Haupttreiber zu werden. Die Wirkung entsteht, wenn Konsequenz und Teamarbeit zusammenwirken.",
        tasks: "Die Aufgaben verlangen klare Steuerung und konsequentes Nachhalten, ergänzt durch aktive Kommunikation im Team und an Schnittstellen. Die Führungskraft muss steuern und einbinden – parallel.",
        human: "Gefordert sind Durchsetzung und Kommunikationsstärke. Die Rolle verlangt Konsequenz in Ziel und Stabilität im Miteinander. Die Person muss führen und gleichzeitig verbinden können.",
        leadership_section: "Führung entsteht durch klare Richtung und verlässliche Zusammenarbeit. Entscheidungen sollen konsequent und zugleich tragfähig sein. Das Team spürt Führung und Einbindung gleichermaßen.",
        overweight: {
          speed_over: { bullets: ["Druck steigt im Team", "Konflikte nehmen zu", "Abstimmung sinkt", "Akzeptanz sinkt"], text: "Im Alltag steigt Tempo, während Teamstabilität nachlassen kann." },
          collaboration_over: { bullets: ["Konsens dominiert", "Konsequenz sinkt", "Ziele werden verhandelbar", "Leistung verliert Schärfe"], text: "Im Alltag bleibt das Klima stabil, jedoch sinkt die Klarheit in Ziel und Ergebnis." },
          structure_over: { bullets: ["Tempo sinkt", "Kontrolle steigt", "Flexibilität sinkt", "Wirksamkeit verzögert sich"], text: "Im Alltag steigt Ordnung, jedoch sinkt die Dynamik in Umsetzung." },
        },
        conclusion: "Die Führungsrolle verbindet Tempo und Konsequenz mit Teamstabilität. Entscheidungen müssen umgesetzt und getragen werden.",
      },
    },
  },
};
