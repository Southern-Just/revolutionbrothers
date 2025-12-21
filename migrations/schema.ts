import { pgTable, unique, serial, varchar, text, boolean, timestamp, integer, uuid, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const memberRole = pgEnum("member_role", ['chairperson', 'secretary', 'treasurer', 'member'])


export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	pin: varchar({ length: 4 }),
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	sessionToken: uuid("session_token").notNull(),
	userAgent: varchar("user_agent", { length: 255 }),
	ipAddress: varchar("ip_address", { length: 50 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	type: varchar({ length: 10 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	transactionCode: varchar("transaction_code", { length: 100 }).notNull(),
	occurredAt: timestamp("occurred_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const contributions = pgTable("contributions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	month: varchar({ length: 7 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const members = pgTable("members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	role: memberRole().default('member').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
});
