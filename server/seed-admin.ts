import { storage, db } from "./storage";
import bcrypt from "bcryptjs";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import { coachTopics, knowledgeDocuments, goldenAnswers } from "@shared/schema";

async function ensureSchema() {
  const ssl = process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl,
  });
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT DEFAULT '';
    `);
    await client.query(`
      UPDATE users SET username = LOWER(email) WHERE username IS NULL OR username = '';
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_username_idx') THEN
          CREATE UNIQUE INDEX users_username_idx ON users(username) WHERE username != '';
        END IF;
      END $$;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS course_access BOOLEAN NOT NULL DEFAULT false;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS coach_system_prompt (
        id SERIAL PRIMARY KEY,
        prompt_text TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Schema migration completed successfully");
  } catch (err) {
    console.error("Schema migration error:", err);
  } finally {
    await client.end();
  }
}

export async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin2024!";

  try {
    await ensureSchema();

    const existing = await storage.getUserByUsername(adminUsername);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (existing) {
      await storage.updateUser(existing.id, { passwordHash });
      console.log(`Admin password updated for: ${adminUsername}`);
    } else {
      await storage.createUser({
        username: adminUsername,
        email: process.env.ADMIN_EMAIL || "admin@biologic.app",
        passwordHash,
        firstName: "Admin",
        lastName: "",
        companyName: "",
        role: "admin",
        isActive: true,
        emailVerified: true,
      });
      console.log(`Admin account created: ${adminUsername}`);
    }
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }

  const resolveSeedFile = (filename: string): string | null => {
    const p1 = path.resolve(path.join(__dirname, filename));
    if (fs.existsSync(p1)) return p1;
    const p2 = path.resolve("server/" + filename);
    if (fs.existsSync(p2)) return p2;
    return null;
  };

  try {
    const existingDocs = await storage.listKnowledgeDocuments();
    if (existingDocs.length === 0) {
      const seedFile = resolveSeedFile("knowledge-seed-data.json");
      if (seedFile) {
        const seedData: { title: string; category: string; content: string }[] = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
        await db.transaction(async (tx) => {
          for (const doc of seedData) {
            await tx.insert(knowledgeDocuments).values({ title: doc.title, content: doc.content, category: doc.category });
          }
        });
        console.log(`Knowledge base seeded: ${seedData.length} documents`);
      } else {
        console.warn("Knowledge seed file not found, skipping");
      }
    }
  } catch (error) {
    console.error("Failed to seed knowledge base:", error);
  }

  try {
    const existingGolden = await storage.listGoldenAnswers();
    if (existingGolden.length === 0) {
      const seedFile = resolveSeedFile("golden-answers-seed.json");
      if (seedFile) {
        const seedData: { user_message: string; assistant_message: string; category: string }[] = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
        await db.transaction(async (tx) => {
          for (const ga of seedData) {
            await tx.insert(goldenAnswers).values({ userMessage: ga.user_message, assistantMessage: ga.assistant_message, category: ga.category });
          }
        });
        console.log(`Golden answers seeded: ${seedData.length} entries`);
      } else {
        console.warn("Golden answers seed file not found, skipping");
      }
    }
  } catch (error) {
    console.error("Failed to seed golden answers:", error);
  }

  try {
    const existingTopics = await db.select().from(coachTopics);
    if (existingTopics.length === 0) {
      const seedFile = resolveSeedFile("coach-topics-seed.json");
      if (seedFile) {
        const seedData: { topic: string }[] = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
        await db.transaction(async (tx) => {
          for (const t of seedData) {
            await tx.insert(coachTopics).values({ topic: t.topic, userId: null });
          }
        });
        console.log(`Coach topics seeded: ${seedData.length} entries`);
      } else {
        console.warn("Coach topics seed file not found, skipping");
      }
    }
  } catch (error) {
    console.error("Failed to seed coach topics:", error);
  }
}
