import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    username: varchar("username", { length: 64 }),
    phone: varchar("phone", { length: 24 }).unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    age: int("age"),
    profileImageUrl: varchar("profileImageUrl", { length: 512 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    isPostingRestricted: boolean("isPostingRestricted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => ({
    usernameUnique: uniqueIndex("users_username_ci_unique").on(table.username),
    phoneIndex: index("users_phone_idx").on(table.phone),
  }),
);

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    icon: varchar("icon", { length: 80 }),
    sortOrder: int("sortOrder").default(0).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("categories_slug_unique").on(table.slug),
  }),
);

export const services = mysqlTable(
  "services",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId"),
    submittedBy: int("submittedBy"),
    name: varchar("name", { length: 180 }).notNull(),
    shortDescription: varchar("shortDescription", { length: 500 }),
    description: text("description"),
    phone: varchar("phone", { length: 24 }),
    address: varchar("address", { length: 300 }),
    openingHours: varchar("openingHours", { length: 300 }),
    mapUrl: varchar("mapUrl", { length: 1000 }),
    imageUrl: varchar("imageUrl", { length: 1000 }),
    averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00").notNull(),
    reviewCount: int("reviewCount").default(0).notNull(),
    status: mysqlEnum("status", ["pending", "published", "rejected"]).default("published").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    categoryIndex: index("services_category_idx").on(table.categoryId),
    statusIndex: index("services_status_idx").on(table.status),
  }),
);

export const posts = mysqlTable(
  "posts",
  {
    id: int("id").autoincrement().primaryKey(),
    authorId: int("authorId"),
    category: varchar("category", { length: 80 }).default("সাধারণ").notNull(),
    title: varchar("title", { length: 180 }),
    content: text("content"),
    imageUrls: text("imageUrls"),
    location: varchar("location", { length: 300 }),
    contact: varchar("contact", { length: 80 }),
    lostFoundType: varchar("lostFoundType", { length: 80 }),
    isPinned: boolean("isPinned").default(false).notNull(),
    status: mysqlEnum("status", ["published", "hidden", "removed"]).default("published").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    feedIndex: index("posts_feed_idx").on(table.isPinned, table.createdAt),
    categoryIndex: index("posts_category_idx").on(table.category),
  }),
);

export const comments = mysqlTable(
  "comments",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    authorId: int("authorId").notNull(),
    parentId: int("parentId"),
    body: varchar("body", { length: 1000 }).notNull(),
    status: mysqlEnum("status", ["visible", "hidden", "removed"]).default("visible").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    postIndex: index("comments_post_idx").on(table.postId),
  }),
);

export const reactions = mysqlTable(
  "reactions",
  {
    id: int("id").autoincrement().primaryKey(),
    postId: int("postId").notNull(),
    userId: int("userId").notNull(),
    type: varchar("type", { length: 30 }).default("like").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    postUserUnique: uniqueIndex("reactions_post_user_unique").on(table.postId, table.userId),
  }),
);

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceId: int("serviceId").notNull(),
    userId: int("userId").notNull(),
    rating: int("rating").notNull(),
    body: varchar("body", { length: 1000 }),
    status: mysqlEnum("status", ["visible", "hidden", "removed"]).default("visible").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    serviceUserUnique: uniqueIndex("reviews_service_user_unique").on(table.serviceId, table.userId),
    serviceIndex: index("reviews_service_idx").on(table.serviceId),
  }),
);

export const bloodDonors = mysqlTable(
  "bloodDonors",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    bloodGroup: varchar("bloodGroup", { length: 5 }).notNull(),
    area: varchar("area", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 24 }).notNull(),
    isAvailable: boolean("isAvailable").default(true).notNull(),
    note: varchar("note", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    bloodAreaIndex: index("blood_donors_group_area_idx").on(table.bloodGroup, table.area),
  }),
);

export const emergencyRequests = mysqlTable(
  "emergencyRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    authorId: int("authorId"),
    type: varchar("type", { length: 80 }).notNull(),
    bloodGroup: varchar("bloodGroup", { length: 5 }),
    requiredAmount: varchar("requiredAmount", { length: 40 }),
    hospital: varchar("hospital", { length: 240 }),
    location: varchar("location", { length: 300 }),
    contact: varchar("contact", { length: 80 }).notNull(),
    urgency: mysqlEnum("urgency", ["normal", "urgent", "critical"]).default("urgent").notNull(),
    message: text("message"),
    status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    bloodIndex: index("emergency_blood_idx").on(table.bloodGroup, table.status),
  }),
);

export const notificationTokens = mysqlTable(
  "notificationTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 512 }).notNull(),
    platform: varchar("platform", { length: 30 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    tokenUnique: uniqueIndex("notification_tokens_token_unique").on(table.token),
    userIndex: index("notification_tokens_user_idx").on(table.userId),
  }),
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    title: varchar("title", { length: 180 }).notNull(),
    message: varchar("message", { length: 1000 }).notNull(),
    deepLink: varchar("deepLink", { length: 500 }),
    targetType: varchar("targetType", { length: 40 }).default("system").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userIndex: index("notifications_user_idx").on(table.userId, table.createdAt),
  }),
);

export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId"),
    targetType: varchar("targetType", { length: 40 }).notNull(),
    targetId: int("targetId").notNull(),
    reason: varchar("reason", { length: 120 }).notNull(),
    note: varchar("note", { length: 500 }),
    status: mysqlEnum("status", ["open", "dismissed", "resolved"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => ({
    reportStatusIndex: index("reports_status_idx").on(table.status, table.createdAt),
  }),
);

export const passwordRecoveryRequests = mysqlTable(
  "passwordRecoveryRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    phone: varchar("phone", { length: 24 }).notNull(),
    note: varchar("note", { length: 500 }),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
);

export const appVersions = mysqlTable(
  "appVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    versionName: varchar("versionName", { length: 40 }).notNull(),
    versionCode: int("versionCode").notNull(),
    apkUrl: varchar("apkUrl", { length: 1000 }).notNull(),
    releaseNotes: text("releaseNotes"),
    minimumVersionCode: int("minimumVersionCode").notNull(),
    forceUpdate: boolean("forceUpdate").default(false).notNull(),
    releaseDate: timestamp("releaseDate").defaultNow().notNull(),
    apkSize: varchar("apkSize", { length: 40 }),
    status: mysqlEnum("status", ["draft", "published", "archived"]).default("published").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    versionCodeIndex: index("app_versions_code_idx").on(table.versionCode, table.status),
  }),
);

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
