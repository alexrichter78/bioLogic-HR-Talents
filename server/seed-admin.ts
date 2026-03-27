import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin2024!";

  try {
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
