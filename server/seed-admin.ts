import { storage, db } from "./storage";
import bcrypt from "bcryptjs";
import pg from "pg";
import { coachTopics, knowledgeDocuments, goldenAnswers } from "@shared/schema";
import knowledgeSeedData from "./knowledge-seed-data.json";
import goldenAnswersSeedData from "./golden-answers-seed.json";
import coachTopicsSeedData from "./coach-topics-seed.json";

async function ensureSchema() {
  const ssl = process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl,
  });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL DEFAULT '' UNIQUE,
        email TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        company_name TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        course_access BOOLEAN NOT NULL DEFAULT false,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP
      );
    `);
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
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        ai_request_limit INTEGER,
        ai_requests_used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_request_limit INTEGER NOT NULL DEFAULT 1000;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_requests_used INTEGER NOT NULL DEFAULT 0;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_period_start TIMESTAMP NOT NULL DEFAULT NOW();`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_check_secret TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_check_eingeloest TEXT;`);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan TEXT NOT NULL DEFAULT 'premium',
        source TEXT NOT NULL DEFAULT 'manual',
        status TEXT NOT NULL DEFAULT 'active',
        starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
        access_until TIMESTAMP NOT NULL,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        canceled_at TIMESTAMP,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS coach_feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_message TEXT NOT NULL,
        assistant_message TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'allgemein',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS golden_answers (
        id SERIAL PRIMARY KEY,
        user_message TEXT NOT NULL,
        assistant_message TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'allgemein',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS coach_topics (
        id SERIAL PRIMARY KEY,
        topic TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usage_event_type') THEN
          CREATE TYPE usage_event_type AS ENUM ('ki_coach', 'rollendna', 'teamdynamik', 'teamcheck', 'matchcheck');
        END IF;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        organization_id INTEGER REFERENCES organizations(id),
        event_type usage_event_type NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
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
  const adminPassword = process.env.ADMIN_PASSWORD || "Armadillo78";

  try {
    await ensureSchema();

    console.log(`[seed] ADMIN_PASSWORD env set: ${!!process.env.ADMIN_PASSWORD}, using password length: ${adminPassword.length}`);
    const existing = await storage.getUserByUsername(adminUsername);

    if (existing) {
      console.log(`[seed] Admin account already exists: ${adminUsername} (id=${existing.id}, role=${existing.role}) — no changes made`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
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
      console.log(`[seed] Admin account created: ${adminUsername}`);
    }
  } catch (error) {
    console.error("[seed] Failed to seed admin:", error);
  }

  try {
    const existingDocs = await storage.listKnowledgeDocuments();
    const seedData = knowledgeSeedData as { title: string; category: string; content: string }[];
    const existingTitles = new Set(existingDocs.map(d => d.title));
    const missing = seedData.filter(d => !existingTitles.has(d.title));
    if (missing.length > 0) {
      await db.transaction(async (tx) => {
        for (const doc of missing) {
          await tx.insert(knowledgeDocuments).values({ title: doc.title, content: doc.content, category: doc.category });
        }
      });
      console.log(`[seed] Knowledge base: ${missing.length} new docs added (total seed: ${seedData.length}, existing: ${existingDocs.length})`);
    } else {
      console.log(`[seed] Knowledge base up to date: ${existingDocs.length} docs`);
    }
  } catch (error) {
    console.error("[seed] Failed to seed knowledge base:", error);
  }

  try {
    const existingGolden = await storage.listGoldenAnswers();
    const seedData = goldenAnswersSeedData as { user_message: string; assistant_message: string; category: string }[];
    const existingMsgs = new Set(existingGolden.map(g => g.userMessage));
    const missing = seedData.filter(g => !existingMsgs.has(g.user_message));
    if (missing.length > 0) {
      await db.transaction(async (tx) => {
        for (const ga of missing) {
          await tx.insert(goldenAnswers).values({ userMessage: ga.user_message, assistantMessage: ga.assistant_message, category: ga.category });
        }
      });
      console.log(`[seed] Golden answers: ${missing.length} new entries added (total seed: ${seedData.length}, existing: ${existingGolden.length})`);
    } else {
      console.log(`[seed] Golden answers up to date: ${existingGolden.length} entries`);
    }
  } catch (error) {
    console.error("[seed] Failed to seed golden answers:", error);
  }

  try {
    const existingTopics = await db.select().from(coachTopics);
    const seedData = coachTopicsSeedData as { topic: string }[];
    const existingSet = new Set(existingTopics.map(t => t.topic));
    const missing = seedData.filter(t => !existingSet.has(t.topic));
    if (missing.length > 0) {
      await db.transaction(async (tx) => {
        for (const t of missing) {
          await tx.insert(coachTopics).values({ topic: t.topic, userId: null });
        }
      });
      console.log(`[seed] Coach topics: ${missing.length} new entries added`);
    } else {
      console.log(`[seed] Coach topics up to date: ${existingTopics.length} entries`);
    }
  } catch (error) {
    console.error("[seed] Failed to seed coach topics:", error);
  }
}
