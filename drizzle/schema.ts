import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const roleEnum = pgEnum("user_role", ["user", "admin"]);
const serviceStatusEnum = pgEnum("service_status", ["pending", "published", "rejected"]);
const contentStatusEnum = pgEnum("content_status", ["published", "hidden", "removed"]);
const commentStatusEnum = pgEnum("comment_status", ["visible", "hidden", "removed"]);
const reviewStatusEnum = pgEnum("review_status", ["visible", "hidden", "removed"]);
const urgencyEnum = pgEnum("urgency", ["normal", "urgent", "critical"]);
const emergencyStatusEnum = pgEnum("emergency_status", ["open", "closed"]);
const reportStatusEnum = pgEnum("report_status", ["open", "dismissed", "resolved"]);
const recoveryStatusEnum = pgEnum("recovery_status", ["pending", "approved", "rejected", "completed"]);
const versionStatusEnum = pgEnum("version_status", ["draft", "published", "archived"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 128 }).notNull().unique(),
  username: varchar("username", { length: 64 }),
  phone: varchar("phone", { length: 24 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  age: integer("age"),
  profileImageUrl: varchar("profile_image_url", { length: 512 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  isPostingRestricted: boolean("is_posting_restricted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  usernameUnique: uniqueIndex("users_username_ci_unique").on(sql`lower(${table.username})`),
  phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),
  phoneIndex: index("users_phone_idx").on(table.phone),
}));

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 80 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ slugUnique: uniqueIndex("categories_slug_unique").on(table.slug) }));

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id"),
  submittedBy: integer("submitted_by"),
  name: varchar("name", { length: 180 }).notNull(),
  shortDescription: varchar("short_description", { length: 500 }),
  description: text("description"),
  phone: varchar("phone", { length: 24 }),
  address: varchar("address", { length: 300 }),
  openingHours: varchar("opening_hours", { length: 300 }),
  mapUrl: varchar("map_url", { length: 1000 }),
  imageUrl: varchar("image_url", { length: 1000 }),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default("0.00").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  status: serviceStatusEnum("status").default("published").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  categoryIndex: index("services_category_idx").on(table.categoryId),
  statusIndex: index("services_status_idx").on(table.status),
}));

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id"),
  category: varchar("category", { length: 80 }).default("সাধারণ").notNull(),
  title: varchar("title", { length: 180 }),
  content: text("content"),
  imageUrls: text("image_urls"),
  location: varchar("location", { length: 300 }),
  contact: varchar("contact", { length: 80 }),
  lostFoundType: varchar("lost_found_type", { length: 80 }),
  isPinned: boolean("is_pinned").default(false).notNull(),
  status: contentStatusEnum("status").default("published").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  feedIndex: index("posts_feed_idx").on(table.isPinned, table.createdAt),
  categoryIndex: index("posts_category_idx").on(table.category),
}));

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  parentId: integer("parent_id"),
  body: varchar("body", { length: 1000 }).notNull(),
  status: commentStatusEnum("status").default("visible").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ postIndex: index("comments_post_idx").on(table.postId) }));

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 30 }).default("like").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ postUserUnique: uniqueIndex("reactions_post_user_unique").on(table.postId, table.userId) }));

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  body: varchar("body", { length: 1000 }),
  status: reviewStatusEnum("status").default("visible").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  serviceUserUnique: uniqueIndex("reviews_service_user_unique").on(table.serviceId, table.userId),
  serviceIndex: index("reviews_service_idx").on(table.serviceId),
}));

export const bloodDonors = pgTable("blood_donors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  bloodGroup: varchar("blood_group", { length: 5 }).notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userUnique: uniqueIndex("blood_donors_user_unique").on(table.userId),
  bloodAreaIndex: index("blood_donors_group_area_idx").on(table.bloodGroup, table.area),
}));

export const emergencyRequests = pgTable("emergency_requests", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id"),
  type: varchar("type", { length: 80 }).notNull(),
  bloodGroup: varchar("blood_group", { length: 5 }),
  requiredAmount: varchar("required_amount", { length: 40 }),
  hospital: varchar("hospital", { length: 240 }),
  location: varchar("location", { length: 300 }),
  contact: varchar("contact", { length: 80 }).notNull(),
  urgency: urgencyEnum("urgency").default("urgent").notNull(),
  message: text("message"),
  status: emergencyStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ bloodIndex: index("emergency_blood_idx").on(table.bloodGroup, table.status) }));

export const notificationTokens = pgTable("notification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 30 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  tokenUnique: uniqueIndex("notification_tokens_token_unique").on(table.token),
  userIndex: index("notification_tokens_user_idx").on(table.userId),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: varchar("title", { length: 180 }).notNull(),
  message: varchar("message", { length: 1000 }).notNull(),
  deepLink: varchar("deep_link", { length: 500 }),
  targetType: varchar("target_type", { length: 40 }).default("system").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ userIndex: index("notifications_user_idx").on(table.userId, table.createdAt) }));

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id"),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetId: integer("target_id").notNull(),
  reason: varchar("reason", { length: 120 }).notNull(),
  note: varchar("note", { length: 500 }),
  status: reportStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, table => ({ reportStatusIndex: index("reports_status_idx").on(table.status, table.createdAt) }));

export const passwordRecoveryRequests = pgTable("password_recovery_requests", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 24 }).notNull(),
  note: varchar("note", { length: 500 }),
  status: recoveryStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appVersions = pgTable("app_versions", {
  id: serial("id").primaryKey(),
  versionName: varchar("version_name", { length: 40 }).notNull(),
  versionCode: integer("version_code").notNull(),
  apkUrl: varchar("apk_url", { length: 1000 }).notNull(),
  releaseNotes: text("release_notes"),
  minimumVersionCode: integer("minimum_version_code").notNull(),
  forceUpdate: boolean("force_update").default(false).notNull(),
  releaseDate: timestamp("release_date", { withTimezone: true }).defaultNow().notNull(),
  apkSize: varchar("apk_size", { length: 40 }),
  status: versionStatusEnum("status").default("published").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ versionCodeIndex: index("app_versions_code_idx").on(table.versionCode, table.status) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type BloodDonor = typeof bloodDonors.$inferSelect;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;
export type AppVersion = typeof appVersions.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type InsertService = typeof services.$inferInsert;
export type InsertPost = typeof posts.$inferInsert;
export type InsertReview = typeof reviews.$inferInsert;
export type InsertBloodDonor = typeof bloodDonors.$inferInsert;
export type InsertEmergencyRequest = typeof emergencyRequests.$inferInsert;
export type InsertAppVersion = typeof appVersions.$inferInsert;
