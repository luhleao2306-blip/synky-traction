import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  retentionDays: integer("retention_days"),
  privacyContact: text("privacy_contact").notNull().default(""),
  reportAccessUntil: text("report_access_until"),
  brandPrimary: text("brand_primary").notNull().default("#0A7655"),
  brandSidebar: text("brand_sidebar").notNull().default("#102C2A"),
  brandTagline: text("brand_tagline").notNull().default(""),
  brandLogoKey: text("brand_logo_key"),
  brandLogoType: text("brand_logo_type"),
});

export const appUsers = sqliteTable("app_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appSessions = sqliteTable("app_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => appUsers.id),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("app_sessions_user_idx").on(table.userId)]);

export const authAttempts = sqliteTable("auth_attempts", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  windowStart: text("window_start").notNull(),
});

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  userId: text("user_id"),
  email: text("email").notNull(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("admin"),
  areaId: text("area_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("membership_org_email_unique").on(table.organizationId, table.email),
  index("membership_user_idx").on(table.userId),
]);

export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  data: text("data").notNull().default("{}"),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  version: integer("version").notNull().default(1),
  archivedAt: text("archived_at"),
}, (table) => [index("records_org_kind_idx").on(table.organizationId, table.kind)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  recordId: text("record_id"),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  before: text("before"),
  after: text("after"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("audit_org_created_idx").on(table.organizationId, table.createdAt)]);
