import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!db && ENV.databaseUrl) {
    try {
      pool = new Pool({
        connectionString: ENV.databaseUrl,
        max: Number(process.env.DB_POOL_MAX ?? 5),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      });
      db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      pool = null;
      db = null;
    }
  }
  return db;
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
  db = null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = await getDb();
  if (!database) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const fields = ["username", "phone", "name", "email", "age", "profileImageUrl", "loginMethod"] as const;
  for (const field of fields) {
    if (user[field] !== undefined) {
      values[field] = user[field] as never;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await database.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
