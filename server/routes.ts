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

  return httpServer;
}
