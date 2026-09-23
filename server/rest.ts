import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { Router, type Express, type Request, type Response } from "express";
import {
  appVersions,
  bloodDonors,
  categories,
  emergencyRequests,
  notifications,
  posts,
  reports,
  reviews,
  services,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

type AuthenticatedRequest = Request & { pirganjUser?: typeof users.$inferSelect };

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

async function currentUser(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

async function requireAdmin(req: AuthenticatedRequest, res: Response) {
  const user = await currentUser(req);
  if (!user) {
    sendError(res, 401, "অনুগ্রহ করে আগে লগইন করুন।");
    return null;
  }
  if (user.role !== "admin") {
    sendError(res, 403, "এই কাজটি শুধু প্রশাসক করতে পারবেন।");
    return null;
  }
  req.pirganjUser = user;
  return user;
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseImages(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
}

export function registerRestRoutes(app: Express) {
  const router = Router();

  router.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (_req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  router.get("/health", (_req, res) => {
    res.json({ success: true, service: "pirganj-backend", status: "ok", timestamp: new Date().toISOString() });
  });

  router.get("/app-version", async (_req, res) => {
    const db = await getDb();
    if (!db) return res.json({ success: true, configured: false, data: null });
    const rows = await db
      .select()
      .from(appVersions)
      .where(eq(appVersions.status, "published"))
      .orderBy(desc(appVersions.versionCode))
      .limit(1);
    res.json({ success: true, configured: rows.length > 0, data: rows[0] ?? null });
  });

  router.get("/categories", async (_req, res) => {
    const db = await getDb();
    if (!db) return res.json({ success: true, data: [] });
    const data = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
    res.json({ success: true, data });
  });

  router.get("/services", async (req, res) => {
    const db = await getDb();
    if (!db) return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, hasMore: false } });
    const page = Math.max(1, toNumber(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, toNumber(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const filters = [eq(services.status, "published")];
    if (category) filters.push(eq(services.categoryId, Number(category)));
    if (search) filters.push(like(services.name, `%${search}%`));
    const data = await db
      .select({ service: services, category: categories })
      .from(services)
      .leftJoin(categories, eq(services.categoryId, categories.id))
      .where(and(...filters))
      .orderBy(desc(services.createdAt))
      .limit(limit + 1)
      .offset(offset);
    const hasMore = data.length > limit;
    res.json({
      success: true,
      data: data.slice(0, limit).map(row => ({ ...row.service, category: row.category, averageRating: Number(row.service.averageRating) })),
      pagination: { page, limit, hasMore },
    });
  });

  router.get("/services/:id", async (req, res) => {
    const db = await getDb();
    if (!db) return sendError(res, 503, "সেবা তথ্য এখন পাওয়া যাচ্ছে না।");
    const id = Number(req.params.id);
    const rows = await db
      .select({ service: services, category: categories })
      .from(services)
      .leftJoin(categories, eq(services.categoryId, categories.id))
      .where(and(eq(services.id, id), eq(services.status, "published")))
      .limit(1);
    if (!rows[0]) return sendError(res, 404, "সেবাটি পাওয়া যায়নি।");
    const serviceReviews = await db.select().from(reviews).where(and(eq(reviews.serviceId, id), eq(reviews.status, "visible"))).orderBy(desc(reviews.createdAt)).limit(50);
    res.json({ success: true, data: { ...rows[0].service, category: rows[0].category, averageRating: Number(rows[0].service.averageRating), reviews: serviceReviews } });
  });

  router.get("/posts", async (req, res) => {
    const db = await getDb();
    if (!db) return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, hasMore: false } });
    const page = Math.max(1, toNumber(req.query.page, 1));
    const limit = Math.min(30, Math.max(1, toNumber(req.query.limit, 20)));
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const filters = [eq(posts.status, "published")];
    if (category) filters.push(eq(posts.category, category));
    const rows = await db.select().from(posts).where(and(...filters)).orderBy(desc(posts.isPinned), desc(posts.createdAt)).limit(limit + 1).offset((page - 1) * limit);
    const hasMore = rows.length > limit;
    res.json({ success: true, data: rows.slice(0, limit).map(post => ({ ...post, imageUrls: parseImages(post.imageUrls) })), pagination: { page, limit, hasMore } });
  });

  router.get("/blood-donors", async (req, res) => {
    const db = await getDb();
    if (!db) return res.json({ success: true, data: [] });
    const filters = [eq(bloodDonors.isAvailable, true)];
    if (typeof req.query.bloodGroup === "string") filters.push(eq(bloodDonors.bloodGroup, req.query.bloodGroup));
    if (typeof req.query.area === "string") filters.push(like(bloodDonors.area, `%${req.query.area}%`));
    const data = await db.select().from(bloodDonors).where(and(...filters)).orderBy(asc(bloodDonors.name)).limit(100);
    res.json({ success: true, data });
  });

  router.get("/emergency-requests", async (_req, res) => {
    const db = await getDb();
    if (!db) return res.json({ success: true, data: [] });
    const data = await db.select().from(emergencyRequests).where(eq(emergencyRequests.status, "open")).orderBy(desc(emergencyRequests.createdAt)).limit(50);
    res.json({ success: true, data });
  });

  router.get("/notifications", async (req, res) => {
    const user = await currentUser(req);
    if (!user) return sendError(res, 401, "নোটিফিকেশন দেখতে লগইন করুন।");
    const db = await getDb();
    if (!db) return res.json({ success: true, data: [] });
    const data = await db.select().from(notifications).where(sql`${notifications.userId} IS NULL OR ${notifications.userId} = ${user.id}`).orderBy(desc(notifications.createdAt)).limit(100);
    res.json({ success: true, data });
  });

  router.get("/admin/dashboard", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const db = await getDb();
    if (!db) return sendError(res, 503, "ড্যাশবোর্ড তথ্য এখন পাওয়া যাচ্ছে না।");
    const [[userCount], [postCount], [serviceCount], [donorCount], [emergencyCount], [reportCount]] = await Promise.all([
      db.select({ value: sql<number>`count(*)` }).from(users),
      db.select({ value: sql<number>`count(*)` }).from(posts),
      db.select({ value: sql<number>`count(*)` }).from(services),
      db.select({ value: sql<number>`count(*)` }).from(bloodDonors),
      db.select({ value: sql<number>`count(*)` }).from(emergencyRequests).where(eq(emergencyRequests.status, "open")),
      db.select({ value: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "open")),
    ]);
    res.json({ success: true, data: { users: Number(userCount?.value ?? 0), posts: Number(postCount?.value ?? 0), services: Number(serviceCount?.value ?? 0), donors: Number(donorCount?.value ?? 0), emergencyRequests: Number(emergencyCount?.value ?? 0), openReports: Number(reportCount?.value ?? 0) } });
  });

  app.use("/api", router);
}
