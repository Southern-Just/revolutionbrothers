import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
  uuid,
  pgEnum,
  integer,
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
  transactionCode: varchar("transaction_code", { length: 100 }).notNull(),
  checkoutRequestId: varchar("checkout_request_id", { length: 64 }), // ✅ optional
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

