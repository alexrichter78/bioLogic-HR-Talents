import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, gte } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import { users, subscriptions, passwordResetTokens, coachFeedback, knowledgeDocuments, goldenAnswers, coachTopics, type User, type InsertUser, type Subscription, type InsertSubscription, type PasswordResetToken, type CoachFeedback, type InsertCoachFeedback, type KnowledgeDocument, type InsertKnowledgeDocument, type GoldenAnswer, type CoachTopic } from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool);

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  listUsers(): Promise<User[]>;
  updateLastLogin(id: number): Promise<void>;

  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  getActiveSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<void>;
  listSubscriptions(): Promise<Subscription[]>;

  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenUsed(id: number): Promise<void>;
  deletePasswordResetTokensByUserId(userId: number): Promise<void>;

  createCoachFeedback(data: InsertCoachFeedback): Promise<CoachFeedback>;
  listCoachFeedback(): Promise<CoachFeedback[]>;

  createKnowledgeDocument(data: InsertKnowledgeDocument): Promise<KnowledgeDocument>;
  updateKnowledgeDocument(id: number, data: Partial<InsertKnowledgeDocument>): Promise<KnowledgeDocument | undefined>;
  deleteKnowledgeDocument(id: number): Promise<void>;
  listKnowledgeDocuments(): Promise<KnowledgeDocument[]>;
  searchKnowledgeDocuments(query: string): Promise<KnowledgeDocument[]>;

  createGoldenAnswer(data: { userMessage: string; assistantMessage: string; category: string }): Promise<GoldenAnswer>;
  listGoldenAnswers(): Promise<GoldenAnswer[]>;
  deleteGoldenAnswer(id: number): Promise<void>;
  searchGoldenAnswers(query: string): Promise<GoldenAnswer[]>;

  createCoachTopic(data: { topic: string; userId: number | null }): Promise<CoachTopic>;
  getTopicStats(): Promise<{ topic: string; count: number }[]>;

  getCoachSystemPrompt(): Promise<string | null>;
  saveCoachSystemPrompt(promptText: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...data,
      username: data.username.toLowerCase(),
      email: (data.email || "").toLowerCase(),
    }).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.username) updateData.username = data.username.toLowerCase();
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gte(subscriptions.accessUntil, new Date())
      )
    );
    return sub;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const [sub] = await db.insert(subscriptions).values(data).returning();
    return sub;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [sub] = await db.update(subscriptions).set({ ...data, updatedAt: new Date() } as any).where(eq(subscriptions.id, id)).returning();
    return sub;
  }

  async deleteSubscription(id: number): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  }

  async listSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions);
  }

  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    const [row] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
    return row;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return row;
  }

  async markTokenUsed(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async deletePasswordResetTokensByUserId(userId: number): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  }

  async createCoachFeedback(data: InsertCoachFeedback): Promise<CoachFeedback> {
    const [row] = await db.insert(coachFeedback).values(data).returning();
    return row;
  }

  async listCoachFeedback(): Promise<CoachFeedback[]> {
    return db.select().from(coachFeedback).orderBy(coachFeedback.createdAt);
  }

  async createKnowledgeDocument(data: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
    const [row] = await db.insert(knowledgeDocuments).values(data).returning();
    return row;
  }

  async updateKnowledgeDocument(id: number, data: Partial<InsertKnowledgeDocument>): Promise<KnowledgeDocument | undefined> {
    const [row] = await db.update(knowledgeDocuments).set({ ...data, updatedAt: new Date() } as any).where(eq(knowledgeDocuments.id, id)).returning();
    return row;
  }

  async deleteKnowledgeDocument(id: number): Promise<void> {
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
  }

  async listKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
    return db.select().from(knowledgeDocuments);
  }

  async searchKnowledgeDocuments(query: string): Promise<KnowledgeDocument[]> {
    const allDocs = await db.select().from(knowledgeDocuments);
    const queryLower = query.toLowerCase();

    const SYNONYM_MAP: Record<string, string[]> = {
      "streit": ["konflikt", "auseinandersetzung", "meinungsverschiedenheit", "spannung"],
      "konflikt": ["streit", "auseinandersetzung", "spannung", "reibung"],
      "chef": ["führung", "führungskraft", "vorgesetzter", "leitung", "leader", "leadership"],
      "führung": ["chef", "führungskraft", "vorgesetzter", "leitung", "leader", "management"],
      "führungskraft": ["chef", "führung", "vorgesetzter", "leitung", "leader"],
      "mitarbeiter": ["personal", "team", "teammitglied", "angestellter", "kollege", "belegschaft"],
      "team": ["mitarbeiter", "gruppe", "mannschaft", "teamdynamik", "zusammenarbeit"],
      "bewerbung": ["recruiting", "einstellung", "kandidat", "bewerber", "stellenanzeige", "vorstellungsgespräch"],
      "recruiting": ["bewerbung", "einstellung", "kandidat", "bewerber", "personalsuche"],
      "einstellen": ["recruiting", "bewerbung", "einstellung", "kandidat", "anstellung"],
      "interview": ["vorstellungsgespräch", "bewerbungsgespräch", "gespräch", "assessment"],
      "stress": ["belastung", "druck", "überlastung", "burnout", "stressor", "komfortzone"],
      "burnout": ["stress", "überlastung", "erschöpfung", "belastung"],
      "motivation": ["antrieb", "motive", "engagement", "produktivität", "demotivation"],
      "kommunikation": ["gespräch", "ansprache", "reden", "dialog", "austausch"],
      "gespräch": ["kommunikation", "dialog", "unterhaltung", "austausch", "gesprächsleitfaden"],
      "verkauf": ["vertrieb", "sales", "verkaufen", "kunde", "akquise"],
      "kunde": ["verkauf", "vertrieb", "klient", "auftraggeber", "kundenbeziehung"],
      "rot": ["impulsiv", "dominant", "dynamisch", "temperamentvoll"],
      "gelb": ["intuitiv", "empathisch", "kreativ", "harmonisch"],
      "blau": ["analytisch", "strukturiert", "rational", "logisch"],
      "impulsiv": ["rot", "dominant", "dynamisch", "temperamentvoll", "spontan"],
      "intuitiv": ["gelb", "empathisch", "kreativ", "harmonisch", "einfühlsam"],
      "analytisch": ["blau", "strukturiert", "rational", "logisch", "sachlich"],
      "aufschieben": ["prokrastination", "aufschieberitis", "verzögern"],
      "prokrastination": ["aufschieben", "aufschieberitis", "verzögern"],
      "produktiv": ["produktivität", "effizienz", "leistung", "flow"],
      "resilienz": ["widerstandsfähigkeit", "belastbarkeit", "krisenfestigkeit", "stärke"],
      "onboarding": ["einarbeitung", "einführung", "integration", "einstieg"],
      "fehlbesetzung": ["kündigung", "fluktuation", "falschbesetzung", "fehlentscheidung"],
      "entscheidung": ["entscheidungsfindung", "entscheiden", "entscheidungsverhalten", "wahl"],
      "veränderung": ["wandel", "transformation", "change", "umstrukturierung"],
      "wertschätzung": ["anerkennung", "lob", "feedback", "respekt"],
      "persönlichkeit": ["charakter", "temperament", "profil", "triade", "biologic"],
      "profil": ["persönlichkeit", "triade", "konstellation", "struktur"],
    };

    const CATEGORY_KEYWORDS: Record<string, string[]> = {
      "methodik": ["triade", "konstellation", "profil", "biologic", "methode", "persönlichkeit", "komponente", "wissenschaft", "erkennung", "motive", "entscheidung", "stress"],
      "recruiting": ["bewerbung", "recruiting", "stellenanzeige", "interview", "einstellung", "kandidat", "onboarding", "einarbeitung", "fehlbesetzung", "assessment", "biocheck"],
      "fuehrung": ["führung", "chef", "team", "leadership", "management", "leitung", "vorgesetzter", "teamführung"],
      "teamdynamik": ["team", "zusammenarbeit", "dynamik", "synergie", "ergänzung", "teamdynamik"],
      "kommunikation": ["kommunikation", "gespräch", "dialog", "ansprache", "verkauf", "vertrieb", "kunde", "reden"],
      "allgemein": ["prokrastination", "aufschieben", "produktivität", "resilienz", "stress", "alltag", "selbstentwicklung"],
    };

    const STOP_WORDS = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "und", "oder", "aber", "als", "auch", "auf", "aus", "bei", "bis", "für", "hat", "ich", "ist", "mit", "nach", "nicht", "noch", "nur", "sie", "sind", "über", "von", "vor", "wie", "wird", "wurde", "zum", "zur", "kann", "muss", "soll", "will", "habe", "haben", "sein", "sehr", "mehr", "wenn", "dann", "denn", "weil", "dass", "sich", "mir", "dir", "ihm", "ihr", "uns", "was", "wer", "wen", "wem"]);

    const expandedWords = new Set<string>();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    for (const word of queryWords) {
      expandedWords.add(word);
      for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
        if (word === key) {
          synonyms.forEach(s => expandedWords.add(s));
        }
      }
    }

    const matchedCategories = new Set<string>();
    for (const word of queryWords) {
      for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(k => word === k)) {
          matchedCategories.add(cat);
        }
      }
    }

    const expandedArray = Array.from(expandedWords);

    const scored = allDocs.map(doc => {
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const catLower = doc.category.toLowerCase();
      const textLower = titleLower + " " + contentLower;

      let score = 0;

      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 5;
        if (contentLower.includes(word)) score += 2;
      }

      for (const word of expandedArray) {
        if (!queryWords.includes(word)) {
          if (titleLower.includes(word)) score += 2;
          if (contentLower.includes(word)) score += 1;
        }
      }

      if (matchedCategories.has(catLower)) score += 3;

      const phraseMatch = queryWords.length >= 2;
      if (phraseMatch) {
        for (let i = 0; i < queryWords.length - 1; i++) {
          const bigram = queryWords[i] + " " + queryWords[i + 1];
          if (textLower.includes(bigram)) score += 4;
        }
      }

      return { doc, score };
    });

    const results = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (matchedCategories.size > 1) {
      const seen = new Set<string>();
      const diverse: typeof results = [];
      for (const item of results) {
        if (diverse.length >= 5) break;
        if (!seen.has(item.doc.category)) {
          diverse.push(item);
          seen.add(item.doc.category);
        }
      }
      for (const item of results) {
        if (diverse.length >= 5) break;
        if (!diverse.includes(item)) {
          diverse.push(item);
        }
      }
      return diverse.map(item => item.doc);
    }

    return results.slice(0, 5).map(item => item.doc);
  }

  async createGoldenAnswer(data: { userMessage: string; assistantMessage: string; category: string }): Promise<GoldenAnswer> {
    const [answer] = await db.insert(goldenAnswers).values(data).returning();
    return answer;
  }

  async listGoldenAnswers(): Promise<GoldenAnswer[]> {
    return db.select().from(goldenAnswers);
  }

  async deleteGoldenAnswer(id: number): Promise<void> {
    await db.delete(goldenAnswers).where(eq(goldenAnswers.id, id));
  }

  async searchGoldenAnswers(query: string): Promise<GoldenAnswer[]> {
    const allAnswers = await db.select().from(goldenAnswers);
    if (allAnswers.length === 0) return [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
    if (queryWords.length === 0) return allAnswers.slice(0, 2);
    return allAnswers
      .map(a => {
        const text = (a.userMessage + " " + a.category).toLowerCase();
        const score = queryWords.filter(w => text.includes(w)).length;
        return { a, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(item => item.a);
  }

  async createCoachTopic(data: { topic: string; userId: number | null }): Promise<CoachTopic> {
    const [topic] = await db.insert(coachTopics).values(data).returning();
    return topic;
  }

  async getTopicStats(): Promise<{ topic: string; count: number }[]> {
    const all = await db.select().from(coachTopics);
    const counts: Record<string, number> = {};
    for (const t of all) {
      counts[t.topic] = (counts[t.topic] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }
  async getCoachSystemPrompt(): Promise<string | null> {
    const result = await pool.query("SELECT prompt_text FROM coach_system_prompt ORDER BY id DESC LIMIT 1");
    return result.rows[0]?.prompt_text || null;
  }

  async saveCoachSystemPrompt(promptText: string): Promise<void> {
    const existing = await pool.query("SELECT id FROM coach_system_prompt LIMIT 1");
    if (existing.rows.length > 0) {
      await pool.query("UPDATE coach_system_prompt SET prompt_text = $1, updated_at = NOW() WHERE id = $2", [promptText, existing.rows[0].id]);
    } else {
      await pool.query("INSERT INTO coach_system_prompt (prompt_text) VALUES ($1)", [promptText]);
    }
  }
}

export const storage = new DatabaseStorage();
