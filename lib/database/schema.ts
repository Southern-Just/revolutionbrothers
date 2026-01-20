import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
  uuid,
  pgEnum,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "chairperson",
  "secretary",
  "treasurer",
  "member",
]);

export const transactionStatus = pgEnum("transaction_status", [
  "verified",
  "pending",
  "declined",
]);
export const transactionType = pgEnum("transaction_type", [
  "credit",
  "debit",
]);
export const investmentStatus = pgEnum("investment_status", [
  "suggested",
  "approved",
  "active",
  "completed",
]);
export const notificationType = pgEnum("notification_type", [
  "announcement",
  "terms_update",
  "minutes_update",
]);
/* ---------------- USERS ---------------- */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  pin: varchar("pin", { length: 4 }).notNull(),
  role: userRole("user_role").notNull().default("member"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------------- USER PROFILE ---------------- */

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  name: varchar("name", { length: 255 }),  
  username: varchar("username", { length: 50 }).unique(),
  nationalId: varchar("national_id", { length: 20 }).unique(),
  phone: varchar("phone", { length: 20 }),
  profileImage: varchar("profile_image", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


/* ---------------- SESSIONS ---------------- */

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: uuid("session_token").notNull().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------- TRANSACTIONS ---------------- */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month", { length: 7 }).notNull(),
  amount: integer("amount").notNull(),
  type: transactionType("type").notNull(),
  status: transactionStatus("transaction_status").notNull().default("pending"),
  category: varchar("category", { length: 50 }).notNull(),
  mpesaReceipt: varchar("mpesa_receipt", { length: 20 }),
  transactionCode: varchar("transaction_code", { length: 100 }).notNull(),
  checkoutRequestId: varchar("checkout_request_id", { length: 64 }), // ✅ optional
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------- INVESTMENTS ---------------- */
export const investments = pgTable("investments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  details: text("details"),
  cost: varchar("cost", { length: 50 }), // e.g., "KES 220k"
  time: varchar("time", { length: 50 }), // e.g., "24 months"
  return: varchar("return", { length: 50 }), // e.g., "~18%"
  suggesterId: uuid("suggester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: investmentStatus("status").notNull().default("suggested"),
  votes: integer("votes").notNull().default(0), // Computed from votes table
  inCharge: uuid("in_charge").array(), // Array of user IDs (e.g., ["uuid1", "uuid2"])
  progress: integer("progress"), // 0-100 for active investments
  amountInvested: integer("amount_invested"), // In cents or smallest unit (e.g., KES)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------------- INVESTMENT VOTES ---------------- */
export const investmentVotes = pgTable("investment_votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  investmentId: uuid("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueVote: uniqueIndex("unique_vote").on(table.investmentId, table.userId), // Prevent duplicate votes
}));



/* ---------------- NOTIFICATIONS ---------------- */

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  message: text("message"),
  type: varchar("type", { length: 30 }).notNull(),
  readBy: uuid("read_by").array().notNull().default(sql`ARRAY[]::uuid[]`),
  deletedBy: uuid("deleted_by").array().notNull().default(sql`ARRAY[]::uuid[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
