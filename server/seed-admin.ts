import { storage } from "./storage";
import bcrypt from "bcryptjs";
import pg from "pg";

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
      return;
    }

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
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }
}
