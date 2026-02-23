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
      const { beruf, fuehrung, erfolgsfokus, aufgabencharakter, arbeitslogik, analyseTexte } = req.body;
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

      const prompt = `Du bist ein Experte für Berufsprofile und Kompetenzanalyse im deutschsprachigen Raum. Du ordnest Tätigkeiten und Kompetenzen IMMER im Gesamtkontext der Rolle zu – nicht isoliert nach dem Namen, sondern danach, WIE und WOZU sie in dieser spezifischen Rolle eingesetzt werden.
${analyseKontext}
## ROLLENPROFIL – GESAMTKONTEXT

**Rolle/Beruf:** ${beruf}
**Führungsverantwortung:** ${fuehrung || "Keine"}
**Erfolgsfokus:** ${erfolgsfokus || "Nicht angegeben"}
**Aufgabencharakter:** ${aufgabencharakter || "Nicht angegeben"}
**Arbeitslogik:** ${arbeitslogik || "Nicht angegeben"}

## ZUORDNUNGSREGELN FÜR KOMPETENZBEREICHE

Ordne jede Tätigkeit/Kompetenz einem Bereich zu. Die Zuordnung hängt NICHT vom Namen ab, sondern davon, WAS die Tätigkeit in dieser konkreten Rolle erfordert:

### "Analytisch" (= Fach-/Methodenkompetenz, Denken & Verstehen)
Zuordnen wenn die Tätigkeit primär erfordert: Analysieren, Bewerten, Strukturieren, Planen, Fachwissen anwenden, Daten interpretieren, Konzepte entwickeln, Strategien ausarbeiten, Qualität prüfen, Komplexes durchdringen, Wissen vermitteln, Sachverhalte aufbereiten, systematisches Arbeiten in IT-Systemen/ERP/Software, Daten pflegen, Dokumentation, Monitoring, Überwachung, Buchungen, Stammdatenpflege, Terminverfolgung, Berichtswesen.
Beispiele: Marktanalysen erstellen, Budgets kalkulieren, Prozesse optimieren, Fachliche Beratung, Komplexe Sachverhalte erklären, Strategien entwickeln, Reporting, ERP-Buchungen durchführen, Bestellungen im System auslösen, Liefertermine überwachen, Wareneingänge buchen, Stammdaten pflegen, Kennzahlen auswerten.

### "Intuitiv" (= Sozial-/Beziehungskompetenz, Fühlen & Verbinden)
Zuordnen wenn die Tätigkeit primär erfordert: Beziehungen aufbauen/pflegen, Empathie zeigen, Konflikte moderieren, Teams zusammenhalten, Vertrauen schaffen, Netzwerken, Emotionale Intelligenz, Zuhören, Bedürfnisse erkennen, Motivation spüren, Stimmungen wahrnehmen.
Beispiele: Mitarbeitergespräche führen, Kundenbeziehungen pflegen, Teamkonflikte lösen, Netzwerk aufbauen, Verhandeln auf Beziehungsebene.

### "Impulsiv" (= Handlungs-/Umsetzungskompetenz, Machen & Durchsetzen)
Zuordnen wenn die Tätigkeit primär erfordert: Entscheidungen unter Druck treffen, Ergebnisse gegen Widerstände liefern, Durchsetzen, Tempo machen, Risiken eingehen, Verantwortung für Resultate übernehmen, Ziele trotz Hindernissen verfolgen, Druck standhalten, Krisen managen.
WICHTIG: Rein administrative, systematische oder prozessgebundene Tätigkeiten sind NICHT "Impulsiv". "Impulsiv" erfordert IMMER ein Element von Durchsetzungskraft, Risikobereitschaft oder Ergebniswillen gegen Widerstände.
Beispiele: Vertriebsziele trotz Marktdruck erreichen, Projekte gegen Widerstände zum Abschluss bringen, Schnelle Entscheidungen unter Unsicherheit treffen, Krisensituationen managen.

## WICHTIGE KONTEXTREGELN

- KRITISCH: Systematische Tätigkeiten in IT-Systemen (ERP, CRM, SAP, etc.) sind IMMER "Analytisch" – z.B. Bestellungen auslösen, Buchungen durchführen, Stammdaten pflegen, Liefertermine überwachen, Wareneingänge buchen, Reports erstellen
- KRITISCH: Wenn "Konflikte" oder "klären" im Zusammenhang mit TECHNISCHEN oder FACHLICHEN Entscheidungen steht, ist das "Analytisch" – denn es geht um sachliche Bewertung, Argumentation und fachliche Abwägung, NICHT um Beziehungspflege. Beispiele: "Konflikte zu technischen Entscheidungen klären" → Analytisch, "Technische Unstimmigkeiten lösen" → Analytisch, "Fachliche Meinungsverschiedenheiten klären" → Analytisch
- KRITISCH: "Intuitiv" bei Konflikten NUR wenn es um zwischenmenschliche/emotionale Konflikte geht (z.B. Teamkonflikte zwischen Personen, Mobbing, persönliche Spannungen)
- "Kommunikationsstärke" bei einem Ingenieur in der Robotik, der Fachwissen vermittelt → "Analytisch" (Wissen aufbereiten und erklären)
- "Kommunikationsstärke" bei einem HR-Manager, der Mitarbeitergespräche führt → "Intuitiv" (Beziehungsebene, Empathie)
- "Kommunikationsstärke" bei einem Vertriebsleiter, der Deals abschließt → "Impulsiv" (Überzeugung, Abschluss erzielen)
- Berücksichtige den Aufgabencharakter: Bei "Überwiegend strategisch" sind mehr Tätigkeiten "Analytisch", bei "Überwiegend operativ" mehr "Impulsiv"
- Berücksichtige die Arbeitslogik: "Menschenorientiert" → mehr "Intuitiv", "Daten-/prozessorientiert" → mehr "Analytisch", "Umsetzungsorientiert" → mehr "Impulsiv"
- Berücksichtige den Erfolgsfokus für die Gewichtung

## AUFGABE

Erstelle für die Rolle "${beruf}" im oben beschriebenen Gesamtkontext:

1. **Haupttätigkeiten (haupt)**: Genau 15 typische Haupttätigkeiten. Jede Tätigkeit ist eine präzise, praxisnahe Beschreibung (max. 60 Zeichen).

2. **Humankompetenzen (neben)**: Genau 10 relevante Humankompetenzen (Soft Skills), die im Kontext dieser Rolle wichtig sind.

${hasFuehrung ? `3. **Führungskompetenzen (fuehrung)**: Genau 10 relevante Führungskompetenzen passend zur Führungsebene "${fuehrung}" im Kontext dieser Branche/Rolle.` : ""}

## NIVEAU-REGELN
- "Hoch": Diese Tätigkeit/Kompetenz ist erfolgskritisch für die Rolle (max. 6 bei Haupttätigkeiten, max. 4 bei anderen)
- "Mittel": Wichtig, aber nicht das Kernprofil
- "Niedrig": Wird benötigt, ist aber nicht zentral

Antworte ausschließlich als JSON:
{
  "haupt": [{"name": "...", "kompetenz": "Impulsiv|Intuitiv|Analytisch", "niveau": "Niedrig|Mittel|Hoch"}],
  "neben": [{"name": "...", "kompetenz": "Impulsiv|Intuitiv|Analytisch", "niveau": "Niedrig|Mittel|Hoch"}]${hasFuehrung ? `,
  "fuehrung": [{"name": "...", "kompetenz": "Impulsiv|Intuitiv|Analytisch", "niveau": "Niedrig|Mittel|Hoch"}]` : ""}
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
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
        model: "gpt-5.2",
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
