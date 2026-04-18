import { sql } from "drizzle-orm";
import { pgTable, pgEnum, text, varchar, boolean, timestamp, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usageEventTypeEnum = pgEnum("usage_event_type", [
  "ki_coach",
  "rollendna",
  "teamdynamik",
  "teamcheck",
  "matchcheck",
]);

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aiRequestLimit: integer("ai_request_limit"),
  aiRequestsUsed: integer("ai_requests_used").notNull().default(0),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  role: text("role").notNull().default("user"),
  organizationId: integer("organization_id").references(() => organizations.id),
  aiRequestLimit: integer("ai_request_limit").notNull().default(1000),
  aiRequestsUsed: integer("ai_requests_used").notNull().default(0),
  aiPeriodStart: timestamp("ai_period_start").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  courseAccess: boolean("course_access").notNull().default(false),
  coachOnly: boolean("coach_only").notNull().default(false),
  bioCheckSecret: text("bio_check_secret"),
  bioCheckEingeloest: text("bio_check_eingeloest"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull().default("premium"),
  source: text("source").notNull().default("manual"),
  status: text("status").notNull().default("active"),
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  accessUntil: timestamp("access_until").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachFeedback = pgTable("coach_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userMessage: text("user_message").notNull(),
  assistantMessage: text("assistant_message").notNull(),
  feedbackType: text("feedback_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("allgemein"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goldenAnswers = pgTable("golden_answers", {
  id: serial("id").primaryKey(),
  userMessage: text("user_message").notNull(),
  assistantMessage: text("assistant_message").notNull(),
  category: text("category").notNull().default("allgemein"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachTopics = pgTable("coach_topics", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachConversations = pgTable("coach_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  eventType: usageEventTypeEnum("event_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  aiRequestsUsed: true,
  aiPeriodStart: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoachFeedbackSchema = createInsertSchema(coachFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  aiRequestsUsed: true,
  currentPeriodStart: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({
  id: true,
  createdAt: true,
});

export const insertCoachConversationSchema = createInsertSchema(coachConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type CoachFeedback = typeof coachFeedback.$inferSelect;
export type InsertCoachFeedback = z.infer<typeof insertCoachFeedbackSchema>;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type GoldenAnswer = typeof goldenAnswers.$inferSelect;
export type CoachTopic = typeof coachTopics.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type CoachConversation = typeof coachConversations.$inferSelect;
export type InsertCoachConversation = z.infer<typeof insertCoachConversationSchema>;
