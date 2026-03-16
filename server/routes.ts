import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/generate-kompetenzen", async (req, res) => {
    try {
      const { beruf, fuehrung, erfolgsfokus, aufgabencharakter, arbeitslogik, zusatzInfo, analyseTexte } = req.body;
      if (!beruf) {
        return res.status(400).json({ error: "Beruf ist erforderlich" });
      }

      const hasFuehrung = fuehrung && fuehrung !== "Keine" && fuehrung !== "";

      let analyseKontext = "";
      if (analyseTexte) {
        const parts: string[] = [];
        if (analyseTexte.bereich1 && !analyseTexte.bereich1.startsWith("Noch keine Analyse")) {
          parts.push(`### Kompetenzverteilung & Rollenprofil (Referenzwissen)\n${analyseTexte.bereich1}`);
        }
        if (analyseTexte.bereich2 && !analyseTexte.bereich2.startsWith("Noch keine Analyse")) {
          parts.push(`### Tätigkeitsanalyse & Anforderungsprofil (Referenzwissen)\n${analyseTexte.bereich2}`);
        }
        if (analyseTexte.bereich3 && !analyseTexte.bereich3.startsWith("Noch keine Analyse")) {
          parts.push(`### Empfehlungen & Entwicklungspotenziale (Referenzwissen)\n${analyseTexte.bereich3}`);
        }
        if (parts.length > 0) {
          analyseKontext = `\n## ANALYSE-REFERENZWISSEN (HÖCHSTE PRIORITÄT)\n\nDie folgenden Texte enthalten verbindliche Definitionen, Zuordnungsregeln und Beispiele. Diese haben VORRANG vor allgemeinen Regeln. Wende sie konsequent auf alle Tätigkeiten und Kompetenzen an:\n\n${parts.join("\n\n")}\n`;
        }
      }

      const prompt = `Du bist ein Experte für Berufsprofile und Kompetenzanalyse im deutschsprachigen Raum.
${analyseKontext}
## ROLLENPROFIL – GESAMTKONTEXT

**Rolle/Beruf:** ${beruf}
**Führungsverantwortung:** ${fuehrung || "Keine"}
**Erfolgsfokus:** ${erfolgsfokus || "Nicht angegeben"}
**Aufgabencharakter:** ${aufgabencharakter || "Nicht angegeben"}
**Arbeitslogik:** ${arbeitslogik || "Nicht angegeben"}
${zusatzInfo ? `**Zusätzlicher Kontext zur Rolle:** ${zusatzInfo}\n\nBERÜCKSICHTIGE diesen zusätzlichen Kontext bei der Erstellung der Tätigkeiten und Kompetenzen. Die Tätigkeiten sollen spezifisch auf diese Rollenausprägung zugeschnitten sein.` : ""}

## BEWERTUNGSMETHODIK – SACHVERHALT VOR EINZELWORT

NIEMALS einzelne Wörter aus einer Tätigkeit isoliert bewerten. IMMER den GESAMTEN Sachverhalt analysieren:

**Schritt 1 – Gesamtaussage erfassen:** Was beschreibt die Tätigkeit INSGESAMT? Was ist das ERGEBNIS dieser Tätigkeit?
**Schritt 2 – Kernkompetenz identifizieren:** Welche PRIMÄRE Fähigkeit braucht jemand, um diese Tätigkeit erfolgreich auszuführen? Denken/Wissen? Fühlen/Beziehung? Handeln/Durchsetzen?
**Schritt 3 – Rollenkontext anwenden:** WIE wird diese Tätigkeit in der konkreten Rolle "${beruf}" mit ${aufgabencharakter || "gemischtem"} Aufgabencharakter und ${arbeitslogik || "nicht spezifizierter"} Arbeitslogik ausgeführt?

## DREI KOMPETENZBEREICHE

### "Analytisch" (= Fach-/Methodenkompetenz – DENKEN & VERSTEHEN)
Die Kernfrage: Braucht diese Tätigkeit primär KOPFARBEIT – Wissen anwenden, Daten verarbeiten, Systeme bedienen, Sachverhalte durchdringen, fachlich bewerten?

Typische Sachverhalte (Analytisch):
- Jede Tätigkeit, die SYSTEMATISCHES ARBEITEN in Systemen erfordert (ERP, CRM, SAP, Software, Datenbanken)
- Jede Tätigkeit, die FACHLICHES BEWERTEN oder SACHLICHES ABWÄGEN erfordert – auch wenn das Wort "Konflikt" oder "klären" vorkommt
- Jede Tätigkeit, die DATEN, ZAHLEN, TERMINE, PROZESSE betrifft
- Jede Tätigkeit, die DOKUMENTATION, REPORTING, MONITORING umfasst
- Jede Tätigkeit, die FACHWISSEN VERMITTELN oder ERKLÄREN erfordert

### "Intuitiv" (= Sozial-/Beziehungskompetenz – FÜHLEN & VERBINDEN)
Die Kernfrage: Braucht diese Tätigkeit primär EMOTIONALE INTELLIGENZ – Menschen lesen, Beziehungen gestalten, Vertrauen aufbauen, Stimmungen wahrnehmen?

Typische Sachverhalte (Intuitiv):
- Jede Tätigkeit, bei der das ZWISCHENMENSCHLICHE im Vordergrund steht
- Jede Tätigkeit, die EMPATHIE, ZUHÖREN, VERSTÄNDNIS für den MENSCHEN erfordert
- Jede Tätigkeit, bei der es um das WIE der Beziehung geht, nicht um das WAS des Inhalts

### "Impulsiv" (= Handlungs-/Umsetzungskompetenz – MACHEN & DURCHSETZEN)
Die Kernfrage: Braucht diese Tätigkeit primär DURCHSETZUNGSKRAFT – Entscheidungen unter Unsicherheit, Ergebnisse gegen Widerstände, Tempo und Pragmatismus?

Typische Sachverhalte (Impulsiv):
- Jede Tätigkeit, die ENTSCHEIDUNGEN UNTER DRUCK oder UNSICHERHEIT erfordert
- Jede Tätigkeit, die ERGEBNISSE GEGEN WIDERSTÄNDE liefern muss
- Jede Tätigkeit, die RISIKOBEREITSCHAFT und VERANTWORTUNGSÜBERNAHME braucht
- NICHT: Routine-Tätigkeiten, administrative Prozesse, systematische Abläufe – auch wenn sie "operativ" sind

## SACHVERHALT-BEWERTUNG – BEISPIELE

Gleiche Wörter, unterschiedliche Sachverhalte:
- "Konflikte zu technischen Entscheidungen klären" → Sachverhalt: FACHLICHE Bewertung von Alternativen → **Analytisch**
- "Konflikte im Team moderieren" → Sachverhalt: ZWISCHENMENSCHLICHE Spannungen lösen → **Intuitiv**
- "Konflikte mit Auftraggeber zur Deadline eskalieren" → Sachverhalt: DURCHSETZEN unter Druck → **Impulsiv**

- "Bestellungen im ERP auslösen" → Sachverhalt: SYSTEMATISCHES Arbeiten im System → **Analytisch**
- "Liefertermine überwachen und nachfassen" → Sachverhalt: MONITORING und Prozesssteuerung → **Analytisch**
- "Wareneingänge buchen und klären" → Sachverhalt: DATENVERARBEITUNG im System → **Analytisch**
- "Stammdaten im ERP pflegen" → Sachverhalt: SYSTEMATISCHE Datenpflege → **Analytisch**

- "Kundenanforderungen fachlich analysieren" → Sachverhalt: FACHBEWERTUNG → **Analytisch**
- "Kundenbeziehungen langfristig pflegen" → Sachverhalt: BEZIEHUNGSAUFBAU → **Intuitiv**
- "Kundenreklamationen sofort entscheiden" → Sachverhalt: ENTSCHEIDUNG unter Druck → **Impulsiv**

## KONTEXTGEWICHTUNG

- Aufgabencharakter "${aufgabencharakter || "Nicht angegeben"}": Beeinflusst die Verteilung, aber NICHT die Sachverhalt-Bewertung. Eine ERP-Buchung bleibt Analytisch, auch bei operativem Charakter.
- Arbeitslogik "${arbeitslogik || "Nicht angegeben"}": Gibt Tendenz vor, überschreibt aber NIE die Sachverhalt-Analyse.
- Erfolgsfokus "${erfolgsfokus || "Nicht angegeben"}": Beeinflusst die Niveau-Bewertung (Hoch/Mittel/Niedrig).

## AUFGABE

Erstelle für die Rolle "${beruf}" im oben beschriebenen Gesamtkontext:

1. **Haupttätigkeiten (haupt)**: Genau 15 typische Haupttätigkeiten für genau diesen Beruf "${beruf}". Jede Tätigkeit als ausformulierter, berufsspezifischer Satz (80-120 Zeichen), der die konkrete Handlung UND deren Zweck/Kontext beschreibt. Beispielformat: "Zubereitung von Speisen nach Rezepten und kreativen Eigenkreationen in hoher Qualität." oder "Bestellung und Kontrolle von Waren sowie Überwachung des Wareneinsatzes und der Kosten." — NICHT generische Stichworte wie "Planung" oder "Kontrolle", sondern konkrete berufstypische Tätigkeiten mit Fachbezug. Bewerte JEDE einzeln nach der Sachverhalt-Methodik.

2. **Humankompetenzen (neben)**: Genau 10 relevante Humankompetenzen (Soft Skills). Bewerte JEDE im Kontext dieser spezifischen Rolle.

${hasFuehrung ? `3. **Führungskompetenzen (fuehrung)**: Genau 10 relevante Führungskompetenzen passend zur Führungsebene "${fuehrung}". Bewerte JEDE im Kontext dieser Branche/Rolle.` : ""}

## NIVEAU-REGELN
- "Hoch": Erfolgskritisch für die Rolle (max. 6 bei Haupttätigkeiten, max. 4 bei anderen)
- "Mittel": Wichtig, aber nicht Kernprofil
- "Niedrig": Wird benötigt, ist aber nicht zentral

Antworte ausschließlich als JSON:
{
  "haupt": [{"name": "...", "kompetenz": "Impulsiv|Intuitiv|Analytisch", "niveau": "Niedrig|Mittel|Hoch"}],
  "neben": [{"name": "...", "kompetenz": "Impulsiv|Intuitiv|Analytisch", "niveau": "Niedrig|Mittel|Hoch"}]${hasFuehrung ? `,
  "fuehrung": [{"name": "...", "kompetenz": "Impulsiv|Intuitiv|Analytisch", "niveau": "Niedrig|Mittel|Hoch"}]` : ""}
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);
      res.json(data);
    } catch (error) {
      console.error("Error generating Kompetenzen:", error);
      res.status(500).json({ error: "Fehler bei der KI-Generierung" });
    }
  });

  app.post("/api/reclassify-kompetenzen", async (req, res) => {
    try {
      const { beruf, fuehrung, aufgabencharakter, arbeitslogik, items } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Keine Einträge zum Neubewerten" });
      }

      const itemsList = items.map((item: any, i: number) =>
        `${i + 1}. "${item.name}" (Kategorie: ${item.kategorie})`
      ).join("\n");

      const prompt = `Du bist ein Experte für Kompetenzanalyse. Bewerte die folgenden Tätigkeits-/Kompetenzbeschreibungen NEU nach der Sachverhalt-Methodik.

## ROLLENKONTEXT
**Rolle/Beruf:** ${beruf || "Nicht angegeben"}
**Führungsverantwortung:** ${fuehrung || "Keine"}
**Aufgabencharakter:** ${aufgabencharakter || "Nicht angegeben"}
**Arbeitslogik:** ${arbeitslogik || "Nicht angegeben"}

## DREI KOMPETENZBEREICHE

### "Analytisch" (= Fach-/Methodenkompetenz – DENKEN & VERSTEHEN)
Braucht diese Tätigkeit primär KOPFARBEIT – Wissen anwenden, Daten verarbeiten, Systeme bedienen, Sachverhalte durchdringen, fachlich bewerten?

### "Intuitiv" (= Sozial-/Beziehungskompetenz – FÜHLEN & VERBINDEN)
Braucht diese Tätigkeit primär EMOTIONALE INTELLIGENZ – Menschen lesen, Beziehungen gestalten, Vertrauen aufbauen?

### "Impulsiv" (= Handlungs-/Umsetzungskompetenz – MACHEN & DURCHSETZEN)
Braucht diese Tätigkeit primär DURCHSETZUNGSKRAFT – Entscheidungen unter Unsicherheit, Ergebnisse gegen Widerstände?

## BEWERTUNGSMETHODIK
1. Gesamtaussage der Tätigkeit erfassen
2. Kernkompetenz identifizieren: Denken? Fühlen? Handeln?
3. Rollenkontext "${beruf}" anwenden

## ZU BEWERTENDE EINTRÄGE
${itemsList}

Antworte als JSON-Objekt mit einem "results" Array mit exakt ${items.length} Einträgen in der gleichen Reihenfolge.
Jeder Eintrag hat GENAU EINEN Wert für "kompetenz" - entweder "Impulsiv" ODER "Intuitiv" ODER "Analytisch". Niemals mehrere Werte kombinieren!

Beispiel für 3 Einträge:
{"results": [{"kompetenz": "Analytisch"}, {"kompetenz": "Impulsiv"}, {"kompetenz": "Intuitiv"}]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);
      let results = data.results || data.items || data.classifications || [];
      if (!Array.isArray(results)) {
        const firstArray = Object.values(data).find(v => Array.isArray(v));
        results = firstArray || [];
      }
      res.json({ results });
    } catch (error) {
      console.error("Error reclassifying:", error);
      res.status(500).json({ error: "Fehler bei der Neubewertung" });
    }
  });

  app.post("/api/generate-bericht", async (req, res) => {
    try {
      const {
        beruf, bereich, fuehrungstyp, aufgabencharakter, arbeitslogik,
        erfolgsfokusLabels, taetigkeiten,
        gesamt, haupt, neben, fuehrungBG, rahmen,
        profileType, intensity, isLeadership
      } = req.body;

      if (!beruf) {
        return res.status(400).json({ error: "Beruf ist erforderlich" });
      }

      const hauptItems = (taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
      const nebenItems = (taetigkeiten || []).filter((t: any) => t.kategorie === "neben");
      const fuehrungItems = (taetigkeiten || []).filter((t: any) => t.kategorie === "fuehrung");

      const formatItems = (items: any[]) => items.map((t: any) =>
        `- ${t.name} (${t.kompetenz}, Niveau: ${t.niveau})`
      ).join("\n");

      const formatItemsByNiveau = (items: any[]) => {
        const hoch = items.filter((t: any) => t.niveau === "Hoch");
        const mittel = items.filter((t: any) => t.niveau === "Mittel");
        const gering = items.filter((t: any) => t.niveau === "Gering");
        let out = "";
        if (hoch.length > 0) out += `**Niveau HOCH (kritisch für Rollenerfolg, individuelle Eignungsprüfung erforderlich):**\n${hoch.map((t: any) => `- ${t.name} (${t.kompetenz})`).join("\n")}\n\n`;
        if (mittel.length > 0) out += `**Niveau MITTEL (Standardanforderung, erlernbar):**\n${mittel.map((t: any) => `- ${t.name} (${t.kompetenz})`).join("\n")}\n\n`;
        if (gering.length > 0) out += `**Niveau GERING (Basisanforderung, wenig differenzierend):**\n${gering.map((t: any) => `- ${t.name} (${t.kompetenz})`).join("\n")}\n`;
        return out.trim();
      };

      const erfolgsfokusText = (erfolgsfokusLabels || []).join(", ") || "Nicht angegeben";

      const describeGaps = (bg: any, label: string) => {
        if (!bg) return "";
        const vals = [
          { key: "Impulsiv", value: bg.imp || 33 },
          { key: "Intuitiv", value: bg.int || 33 },
          { key: "Analytisch", value: bg.ana || 34 },
        ].sort((a, b) => b.value - a.value);
        const [first, second, third] = vals;
        const gap12 = first.value - second.value;
        const gap23 = second.value - third.value;
        const gapAll = Math.abs(first.value - third.value);

        let desc = `${label}: ${first.key} (${first.value}%) > ${second.key} (${second.value}%) > ${third.key} (${third.value}%)\n`;
        if (gapAll <= 6) {
          desc += `→ GLEICHGEWICHT: Alle drei Kompetenzen nahezu gleichauf (max. Differenz ${gapAll}%). Keine dominiert.\n`;
        } else if (first.value >= 55) {
          desc += `→ STARKE DOMINANZ: ${first.key} ist mit ${first.value}% klar überlegen. Vorsprung auf Platz 2: ${gap12} Prozentpunkte.\n`;
        } else if (gap12 >= 15) {
          desc += `→ HOHE DOMINANZ: ${first.key} führt mit großem Abstand (${gap12} Pp. vor ${second.key}). ${third.key} ist klar nachrangig.\n`;
        } else if (gap12 >= 8) {
          desc += `→ DEUTLICHE DOMINANZ: ${first.key} führt erkennbar (${gap12} Pp. vor ${second.key}). Klare Rangfolge.\n`;
        } else if (gap12 <= 5 && gap23 > 5) {
          desc += `→ DOPPELSTRUKTUR: ${first.key} und ${second.key} bilden ein Tandem (nur ${gap12} Pp. Differenz). ${third.key} ist deutlich nachrangig (${gap23} Pp. Abstand).\n`;
        } else if (gap12 >= 5) {
          desc += `→ LEICHTE TENDENZ: ${first.key} liegt leicht vorn (${gap12} Pp. Vorsprung). Keine ausgeprägte Dominanz.\n`;
        } else {
          desc += `→ AUSGEGLICHEN: Geringe Differenzen zwischen den Kompetenzen.\n`;
        }
        return desc;
      };

      const gapAnalysis = [
        describeGaps(gesamt, "Gesamtprofil"),
        describeGaps(haupt, "Tätigkeiten"),
        describeGaps(neben, "Humankompetenzen"),
        describeGaps(rahmen, "Rahmenbedingungen"),
        isLeadership ? describeGaps(fuehrungBG, "Führungskompetenzen") : null,
      ].filter(Boolean).join("\n");

      const PROFILE_TYPE_DESCRIPTIONS: Record<string, string> = {
        "balanced_all": "Ausgeglichenes Profil: Alle drei Kompetenzen (Impulsiv, Intuitiv, Analytisch) sind nahezu gleichauf. Die Rolle verlangt Vielseitigkeit ohne klare Spezialisierung. Beschreibe die Rolle als vielfältig und balanciert.",
        "strong_imp": "Stark Impulsiv-dominiert: Handlungs- und Umsetzungskompetenz dominiert mit großem Vorsprung. Die Rolle verlangt primär Durchsetzung, schnelle Entscheidungen und Ergebnisorientierung. Analytisches und Intuitives sind klar nachrangig.",
        "strong_ana": "Stark Analytisch-dominiert: Fach- und Methodenkompetenz dominiert mit großem Vorsprung. Die Rolle verlangt primär systematisches Denken, Fachwissen und strukturiertes Vorgehen. Impulsives und Intuitives sind klar nachrangig.",
        "strong_int": "Stark Intuitiv-dominiert: Sozial- und Beziehungskompetenz dominiert mit großem Vorsprung. Die Rolle verlangt primär Empathie, Beziehungsgestaltung und emotionale Intelligenz. Impulsives und Analytisches sind klar nachrangig.",
        "dominant_imp": "Impulsiv-dominiert: Handlungskompetenz führt deutlich, aber nicht übermäßig. Die Rolle braucht vor allem Umsetzungsstärke, ergänzt durch die zweitstärkste Kompetenz.",
        "dominant_ana": "Analytisch-dominiert: Fachkompetenz führt deutlich, aber nicht übermäßig. Die Rolle braucht vor allem methodisches Vorgehen, ergänzt durch die zweitstärkste Kompetenz.",
        "dominant_int": "Intuitiv-dominiert: Beziehungskompetenz führt deutlich. Die Rolle braucht vor allem soziale Fähigkeiten, ergänzt durch die zweitstärkste Kompetenz.",
        "light_imp": "Leicht Impulsiv-orientiert: Handlungskompetenz liegt leicht vorn, aber ohne klare Dominanz. Die Rolle tendiert zur Umsetzung, verlangt aber auch Breite in den anderen Kompetenzen.",
        "light_ana": "Leicht Analytisch-orientiert: Fachkompetenz liegt leicht vorn, aber ohne klare Dominanz. Die Rolle tendiert zur Strukturierung, verlangt aber auch Breite in den anderen Kompetenzen.",
        "light_int": "Leicht Intuitiv-orientiert: Beziehungskompetenz liegt leicht vorn, aber ohne klare Dominanz. Die Rolle tendiert zur Beziehungsgestaltung, verlangt aber auch Breite in den anderen Kompetenzen.",
        "hybrid_imp_ana": "Impulsiv-Analytische Doppelstruktur: Handlungs- und Fachkompetenz liegen nah beieinander und bilden ein Tandem. Die Rolle verlangt sowohl Umsetzungsstärke als auch methodisches Denken. Intuitives ist deutlich nachrangig.",
        "hybrid_ana_int": "Analytisch-Intuitive Doppelstruktur: Fach- und Beziehungskompetenz liegen nah beieinander und bilden ein Tandem. Die Rolle verlangt sowohl fachliche Tiefe als auch soziale Fähigkeiten. Impulsives ist deutlich nachrangig.",
        "hybrid_imp_int": "Impulsiv-Intuitive Doppelstruktur: Handlungs- und Beziehungskompetenz liegen nah beieinander und bilden ein Tandem. Die Rolle verlangt sowohl Durchsetzung als auch Empathie. Analytisches ist deutlich nachrangig.",
      };

      const profileDescription = PROFILE_TYPE_DESCRIPTIONS[profileType || "balanced_all"] || PROFILE_TYPE_DESCRIPTIONS["balanced_all"];

      const prompt = `Du bist ein Experte für strukturelle Rollenanalyse und Besetzungsentscheidungen im deutschsprachigen Raum.

## AUFGABE

Erstelle einen vollständigen Entscheidungsbericht (Strukturanalyse) für die Rolle "${beruf}" im Bereich "${bereich || "Nicht angegeben"}".

Der Bericht richtet sich an HR-Entscheider und Geschäftsführer. Er beschreibt die STRUKTURELLEN Anforderungen der Rolle, unabhängig von Lebenslauf, Branchenkenntnis oder bisherigen Erfolgskennzahlen.

## ROLLENPROFIL – GESAMTDATEN

**Beruf:** ${beruf}
**Bereich:** ${bereich || "Nicht angegeben"}
**Führungsverantwortung:** ${fuehrungstyp || "Keine"}
**Aufgabencharakter:** ${aufgabencharakter || "Nicht angegeben"}
**Arbeitslogik:** ${arbeitslogik || "Nicht angegeben"}
**Erfolgsfokus:** ${erfolgsfokusText}

## PROFILKLASSIFIKATION

**Profiltyp:** ${profileType || "balanced_all"}
**Intensität:** ${intensity || "balanced"}
**Bedeutung:** ${profileDescription}

## ABSTANDSANALYSE (exakt berechnet, NICHT verändern)

${gapAnalysis}

## BERECHNETE PROFILWERTE (exakt, NICHT verändern)

Gesamtprofil: Impulsiv ${gesamt?.imp || 33}%, Intuitiv ${gesamt?.int || 33}%, Analytisch ${gesamt?.ana || 34}%
Rahmenbedingungen: Impulsiv ${rahmen?.imp || 33}%, Intuitiv ${rahmen?.int || 33}%, Analytisch ${rahmen?.ana || 34}%
${isLeadership ? `Führungskompetenzen: Impulsiv ${fuehrungBG?.imp || 33}%, Intuitiv ${fuehrungBG?.int || 33}%, Analytisch ${fuehrungBG?.ana || 34}%` : "Keine Führungsverantwortung"}
Tätigkeiten: Impulsiv ${haupt?.imp || 33}%, Intuitiv ${haupt?.int || 33}%, Analytisch ${haupt?.ana || 34}%
Humankompetenzen: Impulsiv ${neben?.imp || 33}%, Intuitiv ${neben?.int || 33}%, Analytisch ${neben?.ana || 34}%

## KOMPETENZBEREICHE (Bedeutung)

- **Impulsiv** = Handlungs-/Umsetzungskompetenz (Machen, Durchsetzen, Entscheiden unter Druck)
- **Intuitiv** = Sozial-/Beziehungskompetenz (Fühlen, Verbinden, Empathie, Beziehungsgestaltung)
- **Analytisch** = Fach-/Methodenkompetenz (Denken, Strukturieren, Analysieren, Fachwissen)

## PROFILDATEN AUS DEM WIZARD – NACH NIVEAU GEORDNET

### Haupttätigkeiten:
${formatItemsByNiveau(hauptItems) || "Keine angegeben"}

### Humankompetenzen:
${formatItemsByNiveau(nebenItems) || "Keine angegeben"}

${fuehrungItems.length > 0 ? `### Führungskompetenzen:\n${formatItemsByNiveau(fuehrungItems)}` : ""}

## NIVEAU-REGELN (WICHTIG für die Textgenerierung)

Das Niveau einer Tätigkeit beschreibt, wie kritisch sie für den Rollenerfolg ist:

- **Niveau HOCH**: Diese Tätigkeit ist ENTSCHEIDEND für den Rollenerfolg. Sie erfordert individuelle Eignungsprüfung. Im Text: betone diese Tätigkeiten besonders, stelle sie als Kernherausforderungen dar, verknüpfe sie mit Risiken bei Fehlbesetzung.
- **Niveau MITTEL**: Standardanforderung, die erlernbar ist. Im Text: erwähne diese als erwartbare Kompetenz, aber ohne besondere Dramatik.
- **Niveau GERING**: Basisanforderung, wenig differenzierend. Im Text: nur am Rande erwähnen oder in Sammelformulierungen einbetten.

Wenn mehrere Tätigkeiten Niveau HOCH haben, beschreibe die KOMBINATION als besondere Herausforderung für die Besetzung. Je mehr Hoch-Niveau-Tätigkeiten, desto anspruchsvoller ist das Anforderungsprofil.

## STIL UND TON

- Direkt, professionell, nüchtern. Kein Marketing, keine Floskeln
- Rollenspezifisches Vokabular verwenden (z.B. für Vertrieb: Pipeline, Forecast, Abschlussquote; für IT: Architektur, Code-Review, Deployment)
- Bullet-Listen für Verantwortungsbereiche, Erfolgsmessung, Führungswirkung, geforderte Kompetenzen
- Spannungsfelder als "X vs. Y" formulieren
- Risiko-Szenarien enden IMMER mit "Im Alltag entsteht..." Kernsatz
- Fazit mit "Entscheidend für die Besetzung ist eine Persönlichkeit, die:" + Bullet-Liste

## WICHTIGE REGELN

1. Verwende KEINE Prozentzahlen in den Texten. Die Prozentwerte werden bereits in den Grafiken angezeigt. Beschreibe stattdessen Verhältnisse qualitativ (z.B. "klar dominierend", "nahezu gleichauf", "deutlich sekundär", "erkennbar nachrangig").
1b. Verwende KEINE Gedankenstriche (–) in den Texten. Formuliere stattdessen vollständige Sätze oder verwende Punkte/Doppelpunkte.
2. Nutze die ABSTANDSANALYSE oben, um die Verhältnisse KORREKT zu beschreiben. Wenn dort "GLEICHGEWICHT" steht, beschreibe KEIN Dominieren. Wenn dort "STARKE DOMINANZ" steht, betone die klare Überlegenheit. Halte dich exakt an die Rangfolge.
3. Wenn intensity="strong": Verwende Formulierungen wie "klar dominiert", "eindeutig geprägt"
4. Wenn intensity="light": Verwende "erkennbare Tendenz", "leichte Ausrichtung"
5. Wenn intensity="balanced": Beschreibe Vielseitigkeit und Gleichgewicht
6. Wenn intensity="clear": Verwende "deutlich geprägt", "erkennbar führend"
7. Bei Führungsrollen: Unterscheide klar zwischen disziplinarischer Führung, fachlicher Führung und Koordination
8. Ohne Führung: Beschreibe wie die Rolle OHNE Führungshebel wirkt (über Expertise, Performance, Überzeugungskraft)
9. Alle Texte müssen SPEZIFISCH für "${beruf}" sein. Keine generischen Formulierungen
10. Tätigkeiten mit Niveau HOCH müssen im Text als besonders kritisch hervorgehoben werden. Tätigkeiten mit Niveau GERING sollen nur beiläufig erwähnt werden

## JSON-AUSGABEFORMAT

Antworte ausschließlich als JSON mit exakt dieser Struktur:

{
  "rollencharakter": "Beschreibender Satz, z.B. 'Steuernd-Umsetzungsorientiert' oder 'Strategisch-Analytisch mit umsetzungsorientierter Durchsetzung'",
  "dominanteKomponente": "z.B. 'Impulsiv mit analytischer Stabilisierung' oder 'Analytisch mit impulsiver Ergänzung' oder 'Impulsiv-Analytische Doppelstruktur'",
  "einleitung": "2-3 kurze Absätze, getrennt durch \\n\\n. Jeder Absatz maximal 2-3 Sätze. Erster Absatz: Was entscheidet diese Rolle? Wovon hängt Wirksamkeit ab? Zweiter Absatz: Warum reicht Fachwissen allein nicht? Was ist strukturell entscheidend? Letzter Absatz: 'Dieser Bericht beschreibt die strukturellen Anforderungen der Rolle, unabhängig von [rollenspezifisch].'",
  "gesamtprofil": "3-4 kurze Absätze, getrennt durch \\n\\n. Jeder Absatz maximal 2-3 Sätze. Erster Absatz: Welche Kompetenz dominiert und warum? Zweiter Absatz: Was bedeutet das für die Rolle? Dritter Absatz: Welche Funktion haben die sekundären Kompetenzen? Letzter Satz: 'Wirksamkeit entsteht [primär/über] ...'",
  "rahmenbedingungen": {
    "beschreibung": "2-3 kurze Absätze getrennt durch \\n\\n, je 2-3 Sätze. Aufgabencharakter beschreiben, Arbeitslogik erklären, was die Rolle konkret verlangt",
    "verantwortungsfelder": ["Konkretes Verantwortungsfeld 1", "Verantwortungsfeld 2", "...mindestens 5"],
    "erfolgsmessung": ["Konkreter Erfolgsfaktor 1", "Erfolgsfaktor 2", "...mindestens 4"],
    "spannungsfelder_rahmen": ["Spannung 1 vs. Gegensatz 1", "Spannung 2 vs. Gegensatz 2", "...mindestens 3"]
  },
  "fuehrungskontext": ${isLeadership ? `{
    "beschreibung": "2-3 kurze Absätze getrennt durch \\n\\n, je 2-3 Sätze. Welche Art von Führung? Wie entsteht Führungswirkung?",
    "wirkungshebel": ["Konkreter Führungshebel 1", "Hebel 2", "...mindestens 4"],
    "analytische_anforderungen": ["Strukturelle Führungsanforderung 1", "...", "mindestens 3"],
    "schlusssatz": "Was passiert ohne diese Stabilisierung?"
  }` : `{
    "beschreibung": "2-3 kurze Absätze getrennt durch \\n\\n, je 2-3 Sätze. Wie wirkt die Rolle OHNE Führungsteam? Über welche Mechanismen entsteht Einfluss?",
    "wirkungshebel": ["Indirekter Wirkungshebel 1", "Hebel 2", "...mindestens 3"],
    "schlusssatz": "Konsequenz: Ohne Führungshebel konzentriert sich..."
  }`},
  "kompetenzanalyse": {
    "taetigkeiten_text": "2 kurze Absätze getrennt durch \\n\\n, je 2-3 Sätze. Interpretation der Tätigkeitsprofilwerte",
    "taetigkeiten_anforderungen": ["Strukturelle Anforderung 1", "Anforderung 2", "...mindestens 5"],
    "taetigkeiten_schluss": "Abschließender Satz: Was verlangt die Rolle im Kern?",
    "human_text": "2 kurze Absätze getrennt durch \\n\\n, je 2-3 Sätze. Interpretation der Humankompetenzen-Profilwerte",
    "human_anforderungen": ["Geforderte Kompetenz 1", "Kompetenz 2", "...mindestens 5"],
    "human_schluss": "Abschließender Satz: Welche Rolle spielt Beziehungsfähigkeit?"
  },
  "spannungsfelder": ["Spannung 1 vs. Gegensatz 1", "Spannung 2 vs. Gegensatz 2", "mindestens 4 Einträge"],
  "spannungsfelder_schluss": "Die Person muss in der Lage sein, diese Spannungsfelder [aktiv zu führen/eigenständig zu regulieren/bewusst zu moderieren]. Es geht nicht darum, sie zu vermeiden.",
  "risikobewertung": [
    {
      "label": "Wird zu viel Struktur eingesetzt",
      "bullets": ["Konsequenz 1", "Konsequenz 2", "Konsequenz 3", "mindestens 4"],
      "alltagssatz": "Im Alltag entsteht [rollenspezifische Beschreibung]."
    },
    {
      "label": "Wird zu viel Tempo gemacht",
      "bullets": ["Konsequenz 1", "Konsequenz 2", "Konsequenz 3", "mindestens 4"],
      "alltagssatz": "Im Alltag entsteht [rollenspezifische Beschreibung]."
    },
    {
      "label": "Wird zu viel Beziehung priorisiert",
      "bullets": ["Konsequenz 1", "Konsequenz 2", "Konsequenz 3", "mindestens 4"],
      "alltagssatz": "Im Alltag entsteht [rollenspezifische Beschreibung]."
    }
  ],
  "fazit": {
    "kernsatz": "1-2 Sätze: Zusammenfassung des Rollencharakters",
    "persoenlichkeit": ["Eigenschaft 1, die die Person mitbringen muss", "Eigenschaft 2", "mindestens 5 Einträge"],
    "fehlbesetzung": "1 Satz: Was passiert bei struktureller Fehlbesetzung?",
    "schlusssatz": "1 Satz: Wofür dieser Bericht die Grundlage bildet"
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);
      res.json(data);
    } catch (error) {
      console.error("Error generating Bericht:", error);
      res.status(500).json({ error: "Fehler bei der Bericht-Generierung" });
    }
  });

  app.post("/api/generate-analyse", async (req, res) => {
    try {
      const { beruf, fuehrung, erfolgsfokus, aufgabencharakter, arbeitslogik, taetigkeiten } = req.body;
      if (!beruf || !taetigkeiten || taetigkeiten.length === 0) {
        return res.status(400).json({ error: "Profildaten sind erforderlich" });
      }

      const haupt = taetigkeiten.filter((t: any) => t.kategorie === "haupt");
      const neben = taetigkeiten.filter((t: any) => t.kategorie === "neben");
      const fuehrungItems = taetigkeiten.filter((t: any) => t.kategorie === "fuehrung");

      const formatItems = (items: any[]) => items.map((t: any) =>
        `- ${t.name} (${t.kompetenz}, ${t.niveau})`
      ).join("\n");

      const prompt = `Du bist ein Experte für Rollenanalyse und Kompetenzprofile. Analysiere das folgende Rollenprofil im GESAMTKONTEXT und erstelle drei Analysebereiche.

## ROLLENPROFIL – GESAMTKONTEXT

**Rolle:** ${beruf}
**Führungsverantwortung:** ${fuehrung || "Keine"}
**Erfolgsfokus:** ${erfolgsfokus || "Nicht angegeben"}
**Aufgabencharakter:** ${aufgabencharakter || "Nicht angegeben"}
**Arbeitslogik:** ${arbeitslogik || "Nicht angegeben"}

## KOMPETENZBEREICHE (zur Einordnung)
- "Analytisch" = Fach-/Methodenkompetenz (Denken, Verstehen, Strukturieren, Fachwissen anwenden)
- "Intuitiv" = Sozial-/Beziehungskompetenz (Fühlen, Verbinden, Empathie, Beziehungen pflegen)
- "Impulsiv" = Handlungs-/Umsetzungskompetenz (Machen, Durchsetzen, Entscheiden, Ergebnisse liefern)

Die Zuordnung hängt vom Kontext ab: "Kommunikationsstärke" kann je nach Rolle Analytisch (Fachwissen vermitteln), Intuitiv (Beziehungen pflegen) oder Impulsiv (Deals abschließen) sein.

## PROFILDATEN

**Haupttätigkeiten:**
${formatItems(haupt)}

**Humankompetenzen:**
${formatItems(neben)}

${fuehrungItems.length > 0 ? `**Führungskompetenzen:**\n${formatItems(fuehrungItems)}` : ""}

## ANALYSE-AUFTRAG

Erstelle eine kontextbezogene Analyse. Prüfe dabei, ob die Zuordnungen der Kompetenzbereiche im Kontext der Rolle stimmig sind. Weise auf Unstimmigkeiten hin.

**Bereich 1 - Kompetenzverteilung & Rollenprofil:**
Analysiere die Verteilung der drei Kompetenzbereiche. Welcher dominiert? Passt diese Verteilung zum Aufgabencharakter (${aufgabencharakter || "k.A."}) und zur Arbeitslogik (${arbeitslogik || "k.A."})? Was sagt das über den Rollentyp? Wie hoch ist das Gesamtanforderungsniveau?

**Bereich 2 - Tätigkeitsanalyse & Anforderungsprofil:**
Welche Tätigkeiten/Kompetenzen erfordern das höchste Niveau und warum? Wo liegen die kritischen Anforderungen im Kontext des Erfolgsfokus (${erfolgsfokus || "k.A."})? Welche Kompetenzkombinationen sind für diese Rolle besonders wichtig?

**Bereich 3 - Empfehlungen & Entwicklungspotenziale:**
Welche Kompetenzen sollten bei einer Besetzung besonders geprüft werden? Wo könnten Lücken entstehen? Empfehlungen für die Besetzung und mögliche Entwicklungspfade.

Antworte als JSON:
{
  "bereich1": "...(ausführlicher Fließtext, 4-6 Sätze)...",
  "bereich2": "...(ausführlicher Fließtext, 4-6 Sätze)...",
  "bereich3": "...(ausführlicher Fließtext, 4-6 Sätze)..."
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);
      res.json(data);
    } catch (error) {
      console.error("Error generating Analyse:", error);
      res.status(500).json({ error: "Fehler bei der Analyse-Generierung" });
    }
  });

  app.post("/api/generate-team-report", async (req, res) => {
    try {
      const { context, profiles, computed, levers } = req.body;
      if (!profiles?.team || !profiles?.person) {
        return res.status(400).json({ error: "Team- und Personenprofil erforderlich" });
      }

      const isTriad = (t: any) => t && typeof t.impulsiv === "number" && typeof t.intuitiv === "number" && typeof t.analytisch === "number";
      if (!isTriad(profiles.team) || !isTriad(profiles.person)) {
        return res.status(400).json({ error: "Profile müssen impulsiv/intuitiv/analytisch enthalten" });
      }
      if (!computed || typeof computed.TS !== "number" || typeof computed.DG !== "number") {
        return res.status(400).json({ error: "Berechnete Werte (computed) erforderlich" });
      }
      const payloadStr = JSON.stringify(req.body);
      if (payloadStr.length > 10000) {
        return res.status(400).json({ error: "Payload zu groß" });
      }

      const isLeading = context?.is_leading === true;
      const personRole = isLeading ? "Führungskraft" : "Teammitglied";

      const systemPrompt = `Du erstellst einen einheitlichen Team-Systemreport (bioLogic) als Managementdokument.
Die Leser kennen das Modell nicht. Du beschreibst keine Persönlichkeit, sondern Arbeits- und Entscheidungslogik im Team.
Schreibe sachlich, präzise, ohne Coaching-Sprache und ohne psychologische Diagnosen.

WICHTIG – Rollenunterscheidung:
Die neue Person ist eine ${personRole}. Das verändert die gesamte Analyse grundlegend:

${isLeading ? `FÜHRUNGSKRAFT-MODUS:
- Die neue Person übernimmt die Führung des Teams. Sie bestimmt Entscheidungslogik, Priorisierung und Steuerung.
- Analysiere, wie die Führungslogik der neuen Person die bestehende Teamdynamik verändert.
- Beschreibe die Verschiebung als "Führungswechsel": Wie verändert sich Entscheidungskultur, Priorisierung und Arbeitsrhythmus?
- Formuliere Risiken aus Führungsperspektive: Akzeptanzverlust, Widerstand, Kulturbruch, Übersteueurung.
- Formuliere Chancen aus Führungsperspektive: Professionalisierung, Ergebnisdisziplin, strategische Klarheit.
- Führungshebel sind Maßnahmen, die die Führungskraft selbst umsetzen kann.
- Im Integrationsplan: Die Führungskraft gestaltet aktiv, das Team reagiert.
- Verwende durchgängig "die neue Führung" oder "die neue Leitung" statt "die neue Person".` :
`TEAMMITGLIED-MODUS:
- Die neue Person wird Teil des bestehenden Teams, nicht in Führungsrolle.
- Analysiere, wie das neue Teammitglied die bestehende Teamdynamik beeinflusst (ohne Steuerungsautorität).
- Beschreibe die Verschiebung als "Teamergänzung": Wie verändert sich die Zusammenarbeit, der Arbeitsrhythmus und die Teambalance?
- Risiken: Integrationsschwierigkeiten, Reibung mit bestehendem Team, stille Isolation, Anpassungsdruck.
- Chancen: Neue Perspektiven, Kompetenzergänzung, breitere Abdeckung, frische Impulse.
- Führungshebel sind Maßnahmen, die die bestehende Führung umsetzen sollte, um die Integration zu steuern.
- Im Integrationsplan: Das bestehende Team und die Führung steuern die Integration, das neue Mitglied wird eingebunden.
- Verwende durchgängig "das neue Teammitglied" oder "die neue Person" statt "die neue Führung".`}

Pflichtprinzipien:
- Keine Modellbegriffe ohne Funktionsübersetzung (Impulsiv/Intuitiv/Analytisch nur als Arbeitslogik erklären).
- Jede Risikoaussage enthält eine konkrete Auswirkung (Tempo, Qualität, KPI, Teamdynamik, Führungsaufwand).
- Keine Floskeln, keine Wiederholungen, keine Metaphern.
- Bulletpoints: max. 2 Sätze, jeweils Beobachtung + Wirkung.
- Nutze Job-/Aufgabenbezug: bewerte die Wirkung entlang der übergebenen Aufgaben und KPI-Schwerpunkte.

Die berechneten Werte (DG, DC, RG, TS, CI, Intensität, Verschiebungstyp, Steuerungsbedarf) sind bereits deterministisch berechnet und werden als Input übergeben. Übernimm sie exakt, berechne sie NICHT neu.

Output-Format:
Gib nur den Report aus (keine Erklärungen, kein JSON). Nutze folgende Gliederung exakt:

1. Executive System Summary
2. Profile im Überblick (Team / ${isLeading ? "Neue Führungskraft" : "Neues Teammitglied"} / Soll optional)
3. Systemtyp & Verschiebungsachse
4. Systemwirkung im Alltag (4 Felder: Entscheidungen/Prioritäten, Qualität, Tempo, Zusammenarbeit)
5. Aufgaben- & KPI-Impact (aus tasks & kpi_focus abgeleitet)
6. Konflikt- & Druckprognose
7. Team-Reifegrad (5 Dimensionen)
8. Chancen (max 6)
9. Risiken (max 6)
10. Führungshebel (max 6, konkret)
11. Integrationsplan (30 Tage, 3 Phasen)
12. Messpunkte (3–5, objektiv)
13. Gesamtbewertung (klar, 4–6 Sätze)

Numerische Werte:
- TS als Zahl 0–100 (gerundet), Intensität (Niedrig/Mittel/Hoch)
- DG, DC, RG, CI optional als Nebenwerte im Summary (kurz, 1 Zeile)

Verbotene Begriffe:
Persönlichkeit, Typ, Mindset, Potenzial entfalten, wertschätzend, ganzheitlich, authentisch, getragen.`;

      const userContent = `Erstelle den Team-Systemreport basierend auf folgenden Daten:\n\n${JSON.stringify({ context, profiles, computed, levers }, null, 2)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
        max_tokens: 4000,
      });

      const report = response.choices[0]?.message?.content || "";
      res.json({ report });
    } catch (error) {
      console.error("Error generating team report:", error);
      res.status(500).json({ error: "Fehler bei der Report-Generierung" });
    }
  });

  app.post("/api/ki-coach", async (req, res) => {
    try {
      const { messages, stammdaten, image } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Keine Nachrichten" });
      }

      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";

      const ALLOWED_TOPICS = [
        "führung", "fuehrung", "leitung", "leadership", "management",
        "gespräch", "gespraech", "kommunikation", "feedback", "dialog", "mitarbeitergespräch", "konflikt",
        "assessment", "beurteilung", "bewertung", "potenzial", "kompetenz", "entwicklung", "stärke", "schwäche",
        "bewerbung", "recruiting", "kandidat", "einstellung", "onboarding", "vorstellung", "interview",
        "mitarbeiter", "team", "personal", "hr", "besetzung", "rolle", "profil", "biologic", "biogram",
        "coaching", "beratung", "mentor", "sparring",
        "stellenanzeige", "anzeige", "jobinserat", "wortsprache", "bildsprache", "marketingrelevant", "recruiting-marketing", "zielgruppe", "ansprache", "formulierung",
        "kündigung", "kuendigung", "trennung", "offboarding", "austritt",
        "motivation", "leistung", "ziel", "delegation", "verantwortung",
        "kultur", "werte", "vertrauen", "zusammenarbeit",
        "struktur", "organisation", "prozess", "entscheidung",
        "verkauf", "verkaufen", "verhandlung", "verhandeln", "abschluss", "angebot", "preis", "kunde", "käufer", "kaeufer",
        "angst", "unsicher", "unsicherheit", "überwindung", "ueberwindung", "hemmung", "blockade", "trau", "traue",
        "selbstführung", "selbstfuehrung", "selbstmanagement",
        "impulsiv", "intuitiv", "analytisch", "dominanz", "triade",
        "rot", "roter", "rote", "rotdominant", "gelb", "gelber", "gelbe", "gelbdominant", "blau", "blauer", "blaue", "blaudominant",
        "rollen-dna", "rollenprofil", "soll-ist", "teamdynamik",
        "hallo", "hi", "guten tag", "hilfe", "help", "was kannst du", "wer bist du",
        "bild", "foto", "image", "analyse", "upload", "hochgeladen", "zeig", "schau",
      ];

      const hasImage = !!image;

      const hasTopicKeyword = ALLOWED_TOPICS.some(t => lastMsg.includes(t));
      const isFirstMessage = messages.length <= 1;
      const isShortMessage = lastMsg.length < 15;
      const isOngoingConversation = messages.length >= 3;

      const isAllowed = hasTopicKeyword || isFirstMessage || isShortMessage || isOngoingConversation || hasImage;

      if (!isAllowed) {
        return res.json({
          reply: "Ich bin spezialisiert auf Führung, Personalentscheidungen, Assessment, Bewerbungsgespräche und Kommunikation im beruflichen Kontext. Bitte stelle mir eine Frage zu diesen Themen.",
          filtered: true,
        });
      }

      const systemPrompt = `Du bist ein erfahrener bioLogic-Coach und Personalberater mit jahrelanger Praxiserfahrung.

DEIN TON:
Professionell. Freundlich. Menschlich. Wie ein erfahrener Coach, der weiß wovon er spricht – und dem man gerne zuhört. Du duzt den Nutzer. Du bist wertschätzend, wo es passt auch motivierend und stärkend – aber immer auf Augenhöhe, nie belehrend. Dein Stil klingt wie ein Mensch, der nachdenkt und dann eine durchdachte Einschätzung gibt.

ABSOLUT VERBOTEN (diese Formulierungen NIEMALS verwenden):
- "Nimm ihn dir zur Seite", "Sag ihm einfach", "Schreib ihm einfach eine kurze Mail", "Sprich ihn direkt an"
- "Mach's sachlich", "ohne Drama", "ohne Schnickschnack", "easy", "klappt schon", "kein Stress"
- "Nachhalten", "verbindlich kontrollieren", "zeitnah Feedback geben", "Transparenz schaffen"
- "Gute Frage!", "Das ist ein spannendes Thema", "Lass mich dir helfen"
- "Stell dir vor...", "Ist gar nicht so schlimm"
- Jeden Ton, der nach Kumpel, Buddy oder lockerem Kollegen klingt

bioLogic-System:
- Rot / rotdominant = IMPULSIV: Will Ergebnisse sehen, entscheidet schnell, braucht Klarheit und Wirkung.
- Gelb / gelbdominant = INTUITIV: Braucht Beziehung und Verbindung, bevor Sachthemen greifen. Harmonie ist kein Luxus, sondern Arbeitsbasis.
- Blau / blaudominant = ANALYTISCH: Denkt in Strukturen, braucht nachvollziehbare Regeln und Fakten. Klarheit gibt Sicherheit.
- Nutze die Farben, wenn der Nutzer sie verwendet.

bioLogic Analyse-Wissen (nutze dieses Fachwissen wenn relevant):

KOMPETENZANALYSE:
- Jede Rolle wird über Tätigkeiten erfasst: Haupttätigkeiten, Nebentätigkeiten (Humankompetenzen), Führungstätigkeiten.
- Gewichtung: Niedrig=0.6, Mittel=1.0, Hoch=1.8. Daraus ergibt sich die Triade (z.B. Impulsiv 25%, Intuitiv 46%, Analytisch 29%).
- Max-Darstellung: 67% ist das Maximum auf Balkendiagrammen.
- Impulsiv (Rot): Handlungs- und Umsetzungskompetenz. Schnelle Entscheidungen, Durchsetzung, Tempo.
- Intuitiv (Gelb): Sozial- und Beziehungskompetenz. Teamarbeit, Empathie, Moderation.
- Analytisch (Blau): Fach- und Methodenkompetenz. Struktur, Datenanalyse, Prozessoptimierung.

PROFILTYPEN:
- Dominante Profile (>50%): stark ausgeprägte Spezialisierung.
- Starke Profile (42-50%): klare Tendenz mit Nebenstärken.
- Leichte Profile (38-42%): erkennbare, aber moderate Tendenz.
- Hybrid-Profile (Doppeldominanzen): Wenn zwei Farben nahezu gleich stark sind (Differenz <5%), entsteht eine Doppeldominanz. Es gibt drei Varianten:
  * Rot-Blau (Impulsiv-Analytisch / "Macher+Struktur"): Handlungs- und Fachkompetenz bilden ein Tandem. Diese Menschen sind umsetzungsstark UND methodisch. Sie treffen schnelle Entscheidungen, aber auf Datenbasis. Schwäche: Beziehungsebene kommt oft zu kurz. Typisch für technische Führungskräfte, Projektleiter, Ingenieure in Leitungsfunktion.
  * Rot-Gelb (Impulsiv-Intuitiv / "Macher+Mensch"): Handlungs- und Beziehungskompetenz bilden ein Tandem. Diese Menschen sind durchsetzungsstark UND empathisch. Sie können begeistern und gleichzeitig Ergebnisse einfordern. Schwäche: Detailarbeit und Dokumentation. Typisch für Vertriebsleiter, Change Manager, charismatische Führungskräfte.
  * Gelb-Blau (Intuitiv-Analytisch / "Mensch+Struktur"): Beziehungs- und Fachkompetenz bilden ein Tandem. Diese Menschen sind empathisch UND strukturiert. Sie können komplexe Sachverhalte menschlich vermitteln. Schwäche: Tempo und schnelle Entscheidungen. Typisch für HR-Leiter, Berater, Trainer, Qualitätsmanager.
- Bei Doppeldominanzen: Die dritte (schwache) Farbe zeigt die größte Entwicklungslücke. Führungsempfehlungen sollten diese Lücke adressieren.
- Balanced: alle drei Bereiche nahezu gleich (Differenz <3%). Vielseitig einsetzbar, aber ohne klares Profil. Risiko: "kann alles ein bisschen, aber nichts richtig gut". Stärke: Brückenbauer zwischen verschiedenen Typen.

SOLL-IST-VERGLEICH (JobCheck):
- Vergleicht Rollen-DNA (Soll) mit Personenprofil (Ist).
- Gleiche Dominanz = geringstes Risiko. Gegensätzliche Dominanz = höchstes Risiko.
- Steuerungsintensität: NIEDRIG (gute Passung), MITTEL (Begleitung nötig), HOCH (aktive Steuerung).
- Fit-Status: SUITABLE (≤15% Abweichung), CONDITIONAL (15-25%), CRITICAL (>25%).

TEAMDYNAMIK:
- Distribution Gap (DG): Unterschied zwischen Team- und Personenprofil.
- Dominance Clash (DC): 0=gleiche, 50=benachbarte, 100=gegensätzliche Dominanz.
- Ampelsystem: GRÜN (stabil), GELB (steuerbar), ROT (Spannungsfeld).
- Shift-Typen: VERSTÄRKUNG, ERGÄNZUNG, REIBUNG, TRANSFORMATION.

FÜHRUNGSROLLEN:
- Fachliche Führung → analytisch-geprägt. Projekt-/Teamkoordination → intuitiv-geprägt. Disziplinarische Führung → impulsiv-geprägt.
- Cap-Regel: Kein Einzelwert darf 53% im Gesamtprofil überschreiten.

Themen: Führung, Personal, Assessment, Bewerbung, Kommunikation, Teamdynamik, Verhandlung, Verkauf, Selbstführung, Konflikte – alles, wo bioLogic hilft, den anderen UND sich selbst besser zu verstehen. Auch private zwischenmenschliche Situationen, wenn bioLogic relevant ist.

ANTWORTAUFBAU:

WICHTIG: Schreibe KEINE Überschriften wie "1. Perspektivwechsel", "2. Handlungsempfehlung", "3. Formulierung" etc. Das wirkt wie ein KI-Template. Schreibe stattdessen als zusammenhängenden, natürlichen Text – wie ein Coach, der in einem echten Gespräch antwortet. Nutze Absätze zur Strukturierung, aber keine nummerierten Abschnitte mit Überschriften.

Deine Antwort enthält immer diese Elemente (als Fließtext, nicht als nummerierte Liste):

A) **Perspektivwechsel** – Erkläre, wie der andere denkt (bioLogic) UND wie der Nutzer selbst tickt und warum er sich schwertut. Hilf dem Nutzer, sich selbst zu verstehen – was genau blockiert ihn? Was ist die innere Hürde aus seiner bioLogic-Sicht? Und wie denkt und reagiert das Gegenüber?

B) **Konkrete Handlungsempfehlung** – Was genau tun, wann, wie. Sowohl fürs geplante Gespräch ALS AUCH für den Moment, wenn die Situation im Alltag wieder auftritt. Wenn der Nutzer eine innere Blockade oder Angst beschreibt: Hilf ihm zuerst, diese zu überwinden – erkläre aus seiner bioLogic, warum er sich schwertut, und gib ihm eine konkrete Technik oder einen Gedanken, der ihm hilft, ins Handeln zu kommen.

C) **Fertige Formulierung** – Ein professioneller Gesprächseinstieg, der zum bioLogic-Typ des Gegenübers passt. Leite die Formulierung natürlich ein, z.B. "Ein Einstieg, der bei einem Roten funktioniert:" – nicht "3. Fertige Formulierung".

D) **Umgang-Tipps** – Praktische Hinweise basierend auf bioLogic, ggf. 2-3 konkrete Spielregeln.

E) **Weiterführender Impuls (PFLICHT)** – JEDE Antwort MUSS mit einem konkreten, einladenden Angebot zum Weitermachen enden. Das muss sich wie eine echte Einladung anfühlen – als eigener Absatz, klar abgesetzt, direkt an den Nutzer gerichtet. NICHT als Punkt in einer Liste, sondern als persönliche Frage.

Gute Beispiele für den weiterführenden Impuls:
"Wollen wir das Gespräch einmal gemeinsam durchspielen? Du sagst mir, wie dein Chef typischerweise reagiert, und ich zeige dir, wie du Schritt für Schritt darauf eingehen kannst."
"Soll ich dir noch zeigen, wie du reagierst, wenn er ausweichend antwortet oder dein Anliegen abblockt?"
"Ich kann dir auch drei verschiedene Einstiege formulieren – dann wählst du den, der sich für dich am natürlichsten anfühlt. Interesse?"

REGELN:
- Antworten: 12-22 Sätze. Genug Tiefe für echten Mehrwert, aber keine Textwand.
- IMMER lösungsorientiert: Was kann die Person morgen konkret anders machen?
- IMMER mit bioLogic begründen: Warum tickt der andere so? Wie wirke ich auf ihn?
- Formulierungen müssen im echten Arbeitsalltag bestehen – professionell, nicht flapsig.
- Wenn jemand ein Problem schildert: Geh auf das KONKRETE Problem ein. Nicht allgemein bleiben. Beschreibe typische Muster dieser bioLogic-Konstellation, damit der Nutzer sich wiedererkennt.
- Gib nicht nur "was tun im Gespräch", sondern auch: Was tun IM MOMENT, wenn die Situation wieder passiert? Konkretes Werkzeug für den Alltag.
- Fertige Formulierungen müssen zum bioLogic-Typ des Gegenübers passen. Einem Roten gegenüber spricht man klar und direkt – keine weichen, diplomatischen Formulierungen. Einem Gelben gegenüber bindet man die Beziehungsebene ein. Einem Blauen gegenüber liefert man Fakten und Struktur.
- Wenn Spielregeln oder Maßnahmen empfohlen werden: Benenne 2-3 konkrete Regeln, nicht nur "vereinbare Spielregeln".
- Wenn der Nutzer Angst, Unsicherheit oder Hemmung beschreibt: Erkläre aus seiner bioLogic WARUM er sich schwertut (z.B. "Als Gelber ist dir Harmonie wichtig – deshalb fühlt sich ein klarer Abschluss wie ein Risiko an"). Gib ihm dann einen konkreten Gedanken oder eine Technik, um diese Hürde zu überwinden. Nicht einfach "Trau dich" – sondern erkläre, was er sich innerlich sagen kann und warum das funktioniert.
- Auch bei Verkauf, Verhandlung oder privaten Situationen: bioLogic anwenden. Die Prinzipien sind universell.
- PFLICHT: JEDE Antwort MUSS mit einem weiterführenden Impuls enden (Punkt 5). Eine Antwort ohne Rückfrage oder Angebot zum Weitermachen ist UNVOLLSTÄNDIG.

TEAMKONSTELLATIONS-BERATUNG:
- Wenn der Nutzer sein Team beschreibt (z.B. "3 Blaue, 1 Roter, 2 Gelbe" oder "mein Team ist eher analytisch"), analysiere die Konstellation systematisch:
  1. Beschreibe die typische Dynamik dieser Zusammensetzung: Wo entstehen Synergien? Was ist die natürliche Stärke dieses Teams?
  2. Benenne konkrete Risiken: Welche Reibungspunkte sind vorprogrammiert? Welche Perspektive fehlt?
  3. Gib 2-3 Führungsempfehlungen, die genau auf diese Konstellation zugeschnitten sind – mit konkreten Maßnahmen, nicht mit allgemeinen Tipps.
  4. Wenn eine Farbe stark unterrepräsentiert ist, erkläre, welche Kompetenz dadurch im Team fehlt und wie die Führungskraft das kompensieren kann.
- Beispiel-Einstieg, wenn der Nutzer sein Team beschreibt: "Das ist eine spannende Konstellation – lass mich dir zeigen, was in diesem Team typischerweise passiert und wo du als Führungskraft gezielt steuern kannst."

GESPRÄCHS-VORBEREITUNG:
- Wenn der Nutzer ein schwieriges Gespräch vorbereiten will, führe ihn Schritt für Schritt durch:
  1. Ziel klären: "Was genau soll nach dem Gespräch anders sein? Was ist dein konkretes Ziel?"
  2. Gegenüber-Typ bestimmen: "Wie würdest du dein Gegenüber einordnen – eher rot, gelb oder blau? Oder beschreib mir, wie er/sie typischerweise reagiert."
  3. Einstieg formulieren: Liefere einen konkreten Gesprächseinstieg, der zum bioLogic-Typ des Gegenübers passt. Bei Rot: direkt und ergebnisorientiert. Bei Gelb: beziehungsorientiert, erst Brücke bauen. Bei Blau: sachlich, mit Fakten beginnen.
  4. Reaktionen antizipieren: "Typischerweise wird ein [Typ] so reagieren: [Reaktion]. Darauf kannst du so antworten: [Formulierung]."
  5. Eskalationsstufen: "Wenn das Gespräch kippt, erkennst du das daran: [Signal]. Dann hilft: [Deeskalation passend zum Typ]."
- Biete nach jedem Schritt an, den nächsten zu machen. Dränge nicht alle Schritte auf einmal auf.

ONBOARDING-BEGLEITUNG:
- Wenn der Nutzer fragt, wie eine neue Person ins Team integriert werden kann, analysiere die Farbkonstellation (neuer Mitarbeiter vs. bestehendes Team):
  1. Erste Woche: Was braucht dieser bioLogic-Typ zum Ankommen? Rot braucht schnell echte Aufgaben. Gelb braucht persönliche Vorstellung und Beziehungsaufbau. Blau braucht klare Strukturen, Handbücher, dokumentierte Prozesse.
  2. Erste 30 Tage: Wo entstehen typische Reibungspunkte zwischen dem neuen Typ und dem bestehenden Team? Was kann die Führungskraft präventiv tun?
  3. 30-90 Tage: Woran erkennt man, ob die Integration gelingt? Welche Warnsignale gibt es je nach Typ?
  4. Gib 2-3 konkrete Maßnahmen pro Phase, die auf die Farbkonstellation zugeschnitten sind.
- Beispiel: "Ein Roter kommt in ein blaues Team" → "In der ersten Woche wird er Tempo machen wollen, während das Team Prozesse einhalten will. Gib ihm sofort eine Aufgabe mit sichtbarem Ergebnis, aber erkläre ihm vorher die 2-3 wichtigsten Spielregeln des Teams – kurz und direkt, nicht als 20-seitiges Handbuch."

STELLENANZEIGEN & RECRUITING-MARKETING (bioLogic-basierte Anzeigengestaltung):
- Stellenanzeigen sollten persönlichkeitsorientiert formuliert werden, um die richtigen Personen anzusprechen.
- Wort- und Bildsprache müssen zum gewünschten bioLogic-Profil passen:

IMPULSIVE (ROTE) PERSONEN ANSPRECHEN:
- Wortsprache: Direkt, ergebnisorientiert, aktionsgeladen. Verben wie "durchsetzen", "umsetzen", "entscheiden", "vorantreiben", "gestalten", "verantworten".
- Formulierungen: "Sie übernehmen Verantwortung", "Sie treiben Ergebnisse", "Sie entscheiden selbstständig", "Wirkung zeigen", "Tempo machen".
- Bildsprache: Dynamisch, kraftvoll, klare Kontraste. Einzelperson in Aktion, Zielerreichung, Wettbewerb, Herausforderung.
- Tonalität: Kurz, prägnant, auf den Punkt. Keine langen Beschreibungen. Bullet Points statt Fließtext.
- Was vermeiden: Zu viel Harmonie-Sprache, zu detaillierte Prozessbeschreibungen, weiche Formulierungen wie "wir würden uns freuen".

INTUITIVE (GELBE) PERSONEN ANSPRECHEN:
- Wortsprache: Beziehungsorientiert, wertschätzend, teamfokussiert. Worte wie "gemeinsam", "zusammen", "Team", "Austausch", "gestalten", "entwickeln", "begleiten".
- Formulierungen: "Sie arbeiten in einem engagierten Team", "Zusammenarbeit auf Augenhöhe", "Wir schätzen Ihre Ideen", "Teil von etwas Größerem", "Menschen begeistern".
- Bildsprache: Teambilder, lachende Menschen, Zusammenarbeit, warme Farben, offene Atmosphäre, gemeinsame Aktivitäten.
- Tonalität: Einladend, persönlich, emotional ansprechend. Unternehmenskultur und Teamgeist hervorheben.
- Was vermeiden: Rein sachliche Aufzählungen, kalte Fakten ohne menschlichen Bezug, zu hierarchische Sprache.

ANALYTISCHE (BLAUE) PERSONEN ANSPRECHEN:
- Wortsprache: Sachlich, strukturiert, faktenbezogen. Worte wie "analysieren", "optimieren", "Qualität", "Präzision", "Expertise", "Standard", "Methode", "Prozess".
- Formulierungen: "Klar definierte Verantwortungsbereiche", "strukturiertes Arbeitsumfeld", "nachvollziehbare Prozesse", "fundierte Entscheidungsgrundlagen", "fachliche Exzellenz".
- Bildsprache: Ordnung, Struktur, Daten, Grafiken, aufgeräumte Arbeitsplätze, professionelle Settings, klare Linienführung.
- Tonalität: Nüchtern, professionell, detailliert. Aufgaben, Anforderungen und Benefits klar auflisten.
- Was vermeiden: Zu emotionale Sprache, vage Beschreibungen, Übertreibungen, unstrukturierte Fließtexte.

STELLENANZEIGEN-AUFBAU nach bioLogic:
1. Stellenanalyse durchführen: Welches bioLogic-Profil braucht die Rolle tatsächlich? (aus der Rollen-DNA)
2. Zielgruppen-Ansprache: Wort- und Bildsprache auf das gewünschte Profil abstimmen.
3. Authentizität: Die Anzeige muss zur tatsächlichen Rolle und Unternehmenskultur passen – keine Versprechen, die nicht eingehalten werden.
4. Kanäle: Unterschiedliche Persönlichkeitstypen nutzen unterschiedliche Plattformen und reagieren auf unterschiedliche Formate.
5. Fehlbesetzungen vermeiden: Eine persönlichkeitsorientierte Anzeige filtert bereits vor – es bewerben sich verstärkt Personen, die zur Rolle passen.

KOMMUNIKATIONSEMPFEHLUNGEN FÜR BEWERBUNGSGESPRÄCHE:
- Impulsive (Rote) Personen: Kurze, direkte Fragen. Fokus auf Ergebnisse und Erfolge. Nicht zu viele Details abfragen. Entscheidungskompetenz testen.
- Intuitive (Gelbe) Personen: Beziehung aufbauen vor Sachfragen. Nach Teamarbeit und Zusammenarbeitserfahrungen fragen. Wohlfühlatmosphäre schaffen.
- Analytische (Blaue) Personen: Strukturiertes Interview mit klarem Ablauf. Fachfragen in der Tiefe. Zeit zum Nachdenken geben. Fakten und Zahlen als Gesprächsbasis.

KONFLIKTMUSTER ERKENNEN:
- Wenn der Nutzer einen wiederkehrenden Konflikt beschreibt, identifiziere das bioLogic-Muster dahinter:
  1. Muster benennen: "Das klingt nach einem klassischen [Typ-A vs. Typ-B]-Muster. Das passiert, weil [bioLogic-Erklärung]."
  2. Strukturelle Ursache erklären: Nicht "die Person ist schwierig", sondern "diese beiden Typen haben fundamental unterschiedliche Bedürfnisse: [Typ A] braucht [X], [Typ B] braucht [Y] – und genau da entsteht die Reibung."
  3. Lösungsansatz auf Struktur-Ebene: Keine Appelle an guten Willen, sondern konkrete Strukturänderungen (z.B. Meetingformat ändern, Kommunikationsweg anpassen, Entscheidungsprozess klären).
  4. Formulierungshilfe: Eine konkrete Formulierung, mit der der Nutzer das Muster im Team ansprechen kann, ohne zu bewerten.
- Typische Muster: Rot vs. Blau (Tempo vs. Gründlichkeit), Rot vs. Gelb (Ergebnis vs. Harmonie), Gelb vs. Blau (Beziehung vs. Sachlichkeit), dominanter Einzelner vs. homogenes Team.

NACHFRAGEN BEI VAGEN ANFRAGEN:
- Wenn die Frage zu unspezifisch ist (z.B. "Wie führe ich besser?" ohne Kontext), stelle 1-2 gezielte Rückfragen, bevor du antwortest. Beispiel: "Um dir eine passende Empfehlung zu geben: Wie ist dein Team zusammengesetzt – eher gleichförmig oder gemischt? Und was genau läuft nicht so, wie du dir das vorstellst?"
- Wenn der Nutzer seine bioLogic-Farbe nicht nennt: Frag danach. Beispiel: "Weißt du, wie du selbst tickst – eher rot, gelb oder blau? Das hilft mir, die Empfehlung passgenau zu machen."
- Aber: Wenn genug Kontext da ist, antworte direkt. Nicht bei jeder Frage nachfragen.

SZENARIEN DURCHSPIELEN:
- Wenn der Nutzer ein konkretes Gespräch oder eine schwierige Situation beschreibt, biete aktiv an, die Situation im Dialog durchzuspielen. Beispiel: "Wir können das gerne einmal durchspielen. Sag mir, was dein Gegenüber typischerweise antwortet oder tut – und ich zeige dir, wie du Schritt für Schritt darauf reagieren kannst."
- Wenn der Nutzer darauf eingeht: Spiele die Rolle des Gegenübers authentisch basierend auf dessen bioLogic-Typ. Nach jeder Runde gib ein kurzes Coaching-Feedback.

KONTEXT MERKEN:
- Beziehe dich auf Informationen, die der Nutzer im bisherigen Gesprächsverlauf genannt hat (z.B. seine bioLogic-Farbe, seine Rolle, sein Team). Wiederhole diese nicht, aber nutze sie als Grundlage.
- Wenn der Nutzer früher im Gespräch gesagt hat "Ich bin gelbdominant", dann bezieh dich darauf, ohne nochmal zu fragen.

ZUSAMMENFASSUNGEN:
- Wenn das Gespräch länger wird (ab ca. 6+ Nachrichten), biete an, die wichtigsten Punkte zusammenzufassen. Beispiel: "Soll ich dir die drei wichtigsten Punkte aus unserem Gespräch kurz zusammenfassen – zum Mitnehmen?"
- Wenn der Nutzer explizit nach einer Zusammenfassung fragt, liefere 3-5 klare Handlungspunkte mit bioLogic-Begründung.

- Deutsch.`;

      let fullSystemPrompt = systemPrompt;
      if (stammdaten && typeof stammdaten === "object" && Object.keys(stammdaten).length > 0) {
        let contextBlock = "\n\nWISSENSBASIS (Stammdaten aus der bioLogic-Analyse – nutze dieses Wissen, um deine Antworten präziser und fundierter zu machen. Zitiere nicht wörtlich, sondern nutze die Inhalte als Hintergrundwissen für deine bioLogic-Begründungen):";
        if (stammdaten.bioCheckIntro) contextBlock += `\n\nbioLogic-Grundlagen:\n${stammdaten.bioCheckIntro}`;
        if (stammdaten.bioCheckText) contextBlock += `\n\nbioCheck-Stellenanforderung:\n${stammdaten.bioCheckText}`;
        if (stammdaten.impulsiveDaten) contextBlock += `\n\nImpulsive Dimension (Rot) – Details:\n${stammdaten.impulsiveDaten}`;
        if (stammdaten.intuitiveDaten) contextBlock += `\n\nIntuitive Dimension (Gelb) – Details:\n${stammdaten.intuitiveDaten}`;
        if (stammdaten.analytischeDaten) contextBlock += `\n\nAnalytische Dimension (Blau) – Details:\n${stammdaten.analytischeDaten}`;
        if (stammdaten.beruf) contextBlock += `\n\nAktuelle Rolle: ${stammdaten.beruf}`;
        if (stammdaten.fuehrung) contextBlock += `\nFührungsverantwortung: ${stammdaten.fuehrung}`;
        if (stammdaten.taetigkeiten) contextBlock += `\nKerntätigkeiten: ${stammdaten.taetigkeiten}`;
        if (stammdaten.bildanalyseKontext) contextBlock += `\n\nBildanalyse-Kontext (nutze diese Anweisungen wenn der Nutzer ein Bild hochlädt):\n${stammdaten.bildanalyseKontext}`;
        fullSystemPrompt += contextBlock;
      }

      const recentMessages = messages.slice(-10);
      const apiMessages: any[] = [
        { role: "system", content: fullSystemPrompt },
      ];

      for (let i = 0; i < recentMessages.length; i++) {
        const m = recentMessages[i];
        const isLastUserWithImage = i === recentMessages.length - 1 && m.role === "user" && image;
        if (isLastUserWithImage) {
          apiMessages.push({
            role: "user",
            content: [
              { type: "text", text: m.content || "Bitte analysiere dieses Bild." },
              { type: "image_url", image_url: { url: image, detail: "high" } },
            ],
          });
        } else {
          apiMessages.push({ role: m.role, content: m.content });
        }
      }

      const webSearchTool = {
        type: "function" as const,
        function: {
          name: "web_search",
          description: "Recherchiere im Internet nach aktuellen Informationen zu Führung, HR, Recruiting, Assessment, Kommunikation oder Teamdynamik. Nutze diese Funktion wenn der Nutzer nach aktuellen Studien, Methoden, Best Practices oder konkreten Fakten fragt, die über allgemeines Wissen hinausgehen.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Die Suchanfrage auf Deutsch oder Englisch, je nach Thema. Beispiel: 'aktuelle Studien Mitarbeiterbindung 2025' oder 'best practices onboarding remote teams'",
              },
            },
            required: ["query"],
          },
        },
      };

      let response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: apiMessages as any,
        tools: [webSearchTool],
        tool_choice: "auto",
        temperature: 0.4,
        max_tokens: 2000,
      });

      let assistantMessage = response.choices[0]?.message;

      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        if (toolCall.function.name === "web_search") {
          let searchQuery = "";
          try {
            const args = JSON.parse(toolCall.function.arguments);
            searchQuery = args.query || "";
          } catch { searchQuery = ""; }

          let searchResult = "Keine Ergebnisse gefunden.";
          if (searchQuery) {
            try {
              const searchUrl = `https://www.googleapis.com/customsearch/v1?key=none&q=${encodeURIComponent(searchQuery)}`;
              const searchResponse = await fetch(`https://search.replit.com/search?q=${encodeURIComponent(searchQuery)}`).catch(() => null);
              
              if (searchResponse && searchResponse.ok) {
                const data = await searchResponse.json();
                searchResult = JSON.stringify(data).slice(0, 3000);
              } else {
                const fallbackResponse = await openai.chat.completions.create({
                  model: "gpt-4.1",
                  messages: [
                    { role: "system", content: "Du bist ein Recherche-Assistent. Fasse dein aktuelles Wissen zu folgender Anfrage zusammen. Gib konkrete Fakten, Studien, Methoden oder Best Practices an, die du kennst. Antworte sachlich und kompakt." },
                    { role: "user", content: `Recherche: ${searchQuery}` },
                  ],
                  temperature: 0.3,
                  max_tokens: 800,
                });
                searchResult = fallbackResponse.choices[0]?.message?.content || "Keine Ergebnisse.";
              }
            } catch {
              const fallbackResponse = await openai.chat.completions.create({
                model: "gpt-4.1",
                messages: [
                  { role: "system", content: "Du bist ein Recherche-Assistent. Fasse dein aktuelles Wissen zu folgender Anfrage zusammen. Gib konkrete Fakten, Studien, Methoden oder Best Practices an, die du kennst. Antworte sachlich und kompakt." },
                  { role: "user", content: `Recherche: ${searchQuery}` },
                ],
                temperature: 0.3,
                max_tokens: 800,
              });
              searchResult = fallbackResponse.choices[0]?.message?.content || "Keine Ergebnisse.";
            }
          }

          (apiMessages as any[]).push({
            role: "assistant",
            content: null,
            tool_calls: assistantMessage.tool_calls,
          });
          (apiMessages as any[]).push({
            role: "tool",
            content: searchResult,
            tool_call_id: toolCall.id,
          });

          response = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: apiMessages as any,
            temperature: 0.4,
            max_tokens: 2000,
          });
          assistantMessage = response.choices[0]?.message;
        }
      }

      const reply = assistantMessage?.content || "Entschuldigung, ich konnte keine Antwort generieren.";
      res.json({ reply, filtered: false });
    } catch (error) {
      console.error("Error in KI-Coach:", error);
      res.status(500).json({ error: "Fehler bei der Verarbeitung" });
    }
  });

  app.post("/api/generate-kandidatenprofil", async (req, res) => {
    try {
      const { beruf, bereich, taetigkeiten, fuehrungstyp, aufgabencharakter, arbeitslogik } = req.body;
      if (!beruf || typeof beruf !== "string") {
        return res.status(400).json({ error: "Beruf ist erforderlich" });
      }
      const safeBeruf = beruf.slice(0, 120);
      const safeBereich = typeof bereich === "string" ? bereich.slice(0, 120) : "";
      const safeFuehrungstyp = typeof fuehrungstyp === "string" ? fuehrungstyp.slice(0, 80) : "";
      const safeAufgabencharakter = typeof aufgabencharakter === "string" ? aufgabencharakter.slice(0, 80) : "";
      const safeArbeitslogik = typeof arbeitslogik === "string" ? arbeitslogik.slice(0, 80) : "";

      const safeTaetigkeiten = Array.isArray(taetigkeiten)
        ? taetigkeiten.slice(0, 20).map((t: any) => ({
            name: typeof t.name === "string" ? t.name.slice(0, 100) : "",
            kategorie: typeof t.kategorie === "string" ? t.kategorie : "",
            niveau: typeof t.niveau === "string" ? t.niveau : "",
          }))
        : [];

      const hochTaetigkeiten = safeTaetigkeiten
        .filter((t) => t.niveau === "Hoch")
        .map((t) => t.name)
        .slice(0, 5);
      const alleTaetigkeiten = safeTaetigkeiten
        .filter((t) => t.kategorie === "haupt")
        .map((t) => t.name)
        .slice(0, 8);

      const prompt = `Du bist ein erfahrener Personalberater. Beschreibe in 2-3 Sätzen, aus welchen Rollen und Arbeitsumfeldern typische Personen für die Position "${safeBeruf}"${safeBereich ? ` (${safeBereich})` : ""} kommen.

Kontext:
- Kerntätigkeiten: ${alleTaetigkeiten.join(", ") || "nicht spezifiziert"}
${safeFuehrungstyp && safeFuehrungstyp !== "Keine" ? `- Führungsverantwortung: ${safeFuehrungstyp}` : "- Keine Führungsverantwortung"}

Wichtig:
- Beschreibe, aus welchen ROLLEN und ARBEITSUMFELDERN die Personen typischerweise kommen (z.B. "Rollen mit intensiver Gästebetreuung und Verantwortung für das Getränkeangebot")
- NICHT: formale Abschlüsse, Zertifikate oder Ausbildungsbezeichnungen (NICHT "abgeschlossene Ausbildung", "nachgewiesen durch", "zertifiziert als")
- NICHT: "idealerweise", "im besten Fall", "in der Regel", "zeichnen sich aus", "bringen mit", "verfügen über"
- Keine Gedankenstriche (–), keine Aufzählungen
- Kurz, konkret, maximal 3 Sätze`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 300,
      });

      const text = response.choices[0]?.message?.content?.trim() || "";
      res.json({ text });
    } catch (error) {
      console.error("Error generating Personenprofil:", error);
      res.status(500).json({ error: "Fehler bei der Generierung" });
    }
  });

  app.post("/api/photo-analyse", async (req, res) => {
    try {
      const { image, bildanalyseKontext } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Kein Bild übermittelt" });
      }

      const ratingPrompt = `You are a professional photo coach. A client has submitted their business portrait for feedback.

Rate this portrait photo on three different communication style scales. This is about the VISUAL IMPRESSION the photo creates — what viewers perceive when they see this headshot.

SCALE A - "DYNAMIC" (power, directness, energy, dominance, presence):
Photos that score HIGH on this scale typically show: direct strong gaze, forward-leaning energy, intense expression, tension/determination, strong jaw, pressed lips, frontal confrontational pose.
Photos that score LOW on this scale show: soft or averted gaze, relaxed posture, no visible tension or dominance.

SCALE B - "WARM" (warmth, approachability, openness, connection, friendliness):
Photos that score HIGH on this scale typically show: genuine smile (the single strongest signal!), warm engaging eyes, open relaxed expression, slight head tilt, laugh lines, natural/unforced look, raised eyebrows.
Photos that score LOW on this scale show: no smile, neutral/flat expression, reserved or distant look.
CRITICAL: A visible smile is the #1 indicator for a high WARM score. A broad genuine smile = very high WARM score.

SCALE C - "COMPOSED" (control, calm, structure, professionalism, distance):
Photos that score HIGH on this scale typically show: no smile, neutral controlled expression, steady calm gaze, straight formal posture, minimal expressiveness, composed reserved look.
Photos that score LOW on this scale show: broad smile, animated expression, relaxed informal look.

Rate each scale from 0.0 to 10.0 where:
- 0-2 = very low presence of this quality
- 3-4 = slight presence
- 5-6 = moderate presence  
- 7-8 = strong presence
- 9-10 = dominant characteristic

IMPORTANT RULES:
- If there is a clear smile → WARM must be at least 6.0, COMPOSED should be lower
- If there is no smile and a neutral look → COMPOSED must be significant
- The three scores do NOT need to add up to any specific total
- Rate based on what you actually see in the photograph
- Ignore background, clothing, hair

Answer ONLY with JSON, no other text:
{"dynamic": <0.0-10.0>, "warm": <0.0-10.0>, "composed": <0.0-10.0>}${bildanalyseKontext ? `\n\nAdditional context from the client:\n${bildanalyseKontext}` : ""}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional photo coach who rates business portrait photos on visual communication scales. This is standard photo coaching practice used by photographers and branding consultants. Always provide honest, specific ratings based on what the photo communicates visually."
          },
          {
            role: "user",
            content: [
              { type: "text", text: ratingPrompt },
              { type: "image_url", image_url: { url: image, detail: "high" } },
            ],
          },
        ] as any,
        temperature: 0.3,
        max_tokens: 200,
      });

      const raw = response.choices[0]?.message?.content?.trim() || "";
      console.log("[photo-analyse] Raw response:", raw);

      let parsedScores: { dynamic: number; warm: number; composed: number };
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Kein JSON gefunden");
        parsedScores = JSON.parse(jsonMatch[0]);
      } catch {
        return res.status(500).json({ error: "Fotoanalyse fehlgeschlagen." });
      }

      if (typeof parsedScores.dynamic !== "number" || typeof parsedScores.warm !== "number" || typeof parsedScores.composed !== "number") {
        return res.status(500).json({ error: "Fotoanalyse fehlgeschlagen — ungültige Bewertung erhalten." });
      }
      const imp = Math.max(0, Math.min(10, parsedScores.dynamic));
      const int_ = Math.max(0, Math.min(10, parsedScores.warm));
      const ana = Math.max(0, Math.min(10, parsedScores.composed));

      const sorted = [
        { key: "impulsiv", value: imp },
        { key: "intuitiv", value: int_ },
        { key: "analytisch", value: ana },
      ].sort((a, b) => b.value - a.value);

      res.json({
        scores: {
          impulsivScore: Number(imp.toFixed(1)),
          intuitivScore: Number(int_.toFixed(1)),
          analytischScore: Number(ana.toFixed(1)),
          primaryEffect: sorted[0].key,
          secondaryEffect: sorted[1].key,
          tertiaryEffect: sorted[2].key,
        },
      });
    } catch (error) {
      console.error("Error in photo-analyse:", error);
      res.status(500).json({ error: "Fehler bei der Fotoanalyse" });
    }
  });

  return httpServer;
}
