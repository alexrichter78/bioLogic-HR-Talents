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
      const { beruf, fuehrung } = req.body;
      if (!beruf) {
        return res.status(400).json({ error: "Beruf ist erforderlich" });
      }

      const hasFuehrung = fuehrung && fuehrung !== "Keine" && fuehrung !== "";

      const prompt = `Du bist ein Experte für Berufsprofile und Kompetenzanalyse im deutschsprachigen Raum.

Für die Rolle/den Beruf "${beruf}" mit Führungsverantwortung: "${fuehrung || "Keine"}", erstelle bitte:

1. **Haupttätigkeiten**: Genau 10 typische Haupttätigkeiten für diese Rolle. Jede Tätigkeit soll eine präzise, praxisnahe Beschreibung sein (max. 2 Zeilen).

2. **Humankompetenzen**: Genau 10 relevante Humankompetenzen (Soft Skills) für diese Rolle.

${hasFuehrung ? `3. **Führungskompetenzen**: Genau 10 relevante Führungskompetenzen passend zur Führungsebene "${fuehrung}".` : ""}

Für jede Tätigkeit/Kompetenz gib auch an:
- **kompetenz**: Welcher Kompetenzbereich passt am besten? Einer von: "Impulsiv" (= Handlungs-/Umsetzungskompetenz), "Intuitiv" (= Sozial-/Beziehungskompetenz), "Analytisch" (= Fach-/Methodenkompetenz)
- **niveau**: Wie hoch ist das typische Anforderungsniveau? Einer von: "Niedrig", "Mittel", "Hoch" (maximal 5x "Hoch" pro Kategorie)

Antworte ausschließlich als JSON-Objekt in folgendem Format:
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

      const prompt = `Du bist ein Experte für Rollenanalyse und Kompetenzprofile. Analysiere das folgende Rollenprofil und erstelle drei Analysebereiche.

**Rolle:** ${beruf}
**Führungsverantwortung:** ${fuehrung || "Keine"}
**Erfolgsfokus:** ${erfolgsfokus || "Nicht angegeben"}
**Aufgabencharakter:** ${aufgabencharakter || "Nicht angegeben"}
**Arbeitslogik:** ${arbeitslogik || "Nicht angegeben"}

**Haupttätigkeiten:**
${formatItems(haupt)}

**Humankompetenzen:**
${formatItems(neben)}

${fuehrungItems.length > 0 ? `**Führungskompetenzen:**\n${formatItems(fuehrungItems)}` : ""}

Erstelle eine detaillierte Analyse in drei Bereichen:

**Bereich 1 - Kompetenzverteilung & Rollenprofil:**
Analysiere die Verteilung der drei Kompetenzbereiche (Impulsiv = Handlungs-/Umsetzungskompetenz, Intuitiv = Sozial-/Beziehungskompetenz, Analytisch = Fach-/Methodenkompetenz). Welcher Bereich dominiert? Was bedeutet das für den Rollentyp? Wie hoch ist das Gesamtniveau?

**Bereich 2 - Tätigkeitsanalyse & Anforderungsprofil:**
Welche Tätigkeiten erfordern das höchste Niveau? Wo liegen die kritischen Anforderungen? Wie passt das zum Aufgabencharakter und der Arbeitslogik? Welche Kompetenzkombinationen sind besonders wichtig?

**Bereich 3 - Empfehlungen & Entwicklungspotenziale:**
Welche Kompetenzen sollten gestärkt werden? Wo gibt es potenzielle Lücken? Empfehlungen für die Besetzung dieser Rolle und mögliche Entwicklungspfade.

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
