import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  numeric,
  text,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const memberRoleEnum = pgEnum("member_role", [
  "chairperson",
  "secretary",
  "treasurer",
  "member",
]);

/* ---------------- USERS ---------------- */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  pin: varchar("pin", { length: 4 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------------- USER PROFILE ---------------- */

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  nationalId: varchar("national_id", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  profileImage: varchar("profile_image", { length: 255 }),
});

/* ---------------- MEMBERS ---------------- */

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("member"),
  isActive: boolean("is_active").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
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

/* ---------------- CONTRIBUTIONS ---------------- */

export const contributions = pgTable("contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month", { length: 7 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------- TRANSACTIONS ---------------- */

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  transactionCode: varchar("transaction_code", { length: 100 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
