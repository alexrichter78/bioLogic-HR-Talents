import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@biologic.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin2024!";

  try {
    const existing = await storage.getUserByEmail(adminEmail);
    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await storage.createUser({
      email: adminEmail,
      passwordHash,
      firstName: "Admin",
      lastName: "",
      companyName: "",
      role: "admin",
      isActive: true,
      emailVerified: true,
    });

    console.log(`Admin account created: ${adminEmail}`);
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }
}
