import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, gte } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import { users, subscriptions, passwordResetTokens, coachFeedback, knowledgeDocuments, type User, type InsertUser, type Subscription, type InsertSubscription, type PasswordResetToken, type CoachFeedback, type InsertCoachFeedback, type KnowledgeDocument, type InsertKnowledgeDocument } from "@shared/schema";

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
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    return allDocs
      .map(doc => {
        const textLower = (doc.title + " " + doc.content + " " + doc.category).toLowerCase();
        const matchCount = queryWords.filter(w => textLower.includes(w)).length;
        return { doc, matchCount };
      })
      .filter(item => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 3)
      .map(item => item.doc);
  }
}

export const storage = new DatabaseStorage();
