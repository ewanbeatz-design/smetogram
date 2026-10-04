import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, estimateCategories, estimateItems, projectMembers, projects, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; } } return _db; }

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId }; const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; } else { values.lastSignedIn = new Date(); updateSet.lastSignedIn = values.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }

export async function listProjects(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.updatedAt)); }
export async function getProjectForUser(projectId: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const owned = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, userId))).limit(1);
  if (owned[0]) return owned[0];
  const member = await db.select({ project: projects }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id)).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))).limit(1);
  return member[0]?.project;
}
export async function createProject(input: { ownerId: number; name: string; city: string; clientName: string; clientEmail?: string; workType: string; deadline?: Date }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const result = await db.insert(projects).values({ ...input, status: "draft", budget: "0" });
  const id = Number(result[0].insertId);
  await db.insert(projectMembers).values({ projectId: id, userId: input.ownerId, role: "owner", joinedAt: new Date() });
  return (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0];
}
export async function updateProject(projectId: number, ownerId: number, input: Partial<{ name: string; city: string; clientName: string; workType: string; status: "draft" | "in_progress" | "review" | "completed" | "archived"; deadline: Date | null }>) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(projects).set(input).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  return getProjectForUser(projectId, ownerId);
}
export async function listEstimate(projectId: number) {
  const db = await getDb(); if (!db) return [];
  const categories = await db.select().from(estimateCategories).where(eq(estimateCategories.projectId, projectId)).orderBy(asc(estimateCategories.sortOrder), asc(estimateCategories.id));
  if (!categories.length) return [];
  const items = await db.select().from(estimateItems).where(inArray(estimateItems.categoryId, categories.map((category) => category.id))).orderBy(asc(estimateItems.id));
  return categories.map((category) => ({ ...category, items: items.filter((item) => item.categoryId === category.id) }));
}
export async function getEstimateItemForUser(itemId: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ item: estimateItems, projectId: estimateCategories.projectId })
    .from(estimateItems)
    .innerJoin(estimateCategories, eq(estimateItems.categoryId, estimateCategories.id))
    .innerJoin(projects, eq(estimateCategories.projectId, projects.id))
    .where(and(eq(estimateItems.id, itemId), eq(projects.ownerId, userId)))
    .limit(1);
  return rows[0];
}
export async function getEstimateCategoryForUser(categoryId: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ category: estimateCategories })
    .from(estimateCategories)
    .innerJoin(projects, eq(estimateCategories.projectId, projects.id))
    .where(and(eq(estimateCategories.id, categoryId), eq(projects.ownerId, userId)))
    .limit(1);
  return rows[0]?.category;
}

export async function addEstimateCategory(projectId: number, name: string) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(estimateCategories).values({ projectId, name }); return (await db.select().from(estimateCategories).where(eq(estimateCategories.id, Number(result[0].insertId))).limit(1))[0]; }
export async function addEstimateItem(categoryId: number, input: { name: string; quantity: string; unit: string; price: string; source?: "manual" | "pdf" | "scan" | "ai" }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(estimateItems).values({ categoryId, ...input }); return (await db.select().from(estimateItems).where(eq(estimateItems.id, Number(result[0].insertId))).limit(1))[0]; }
export async function updateEstimateItem(itemId: number, input: Partial<{ name: string; quantity: string; unit: string; price: string }>) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(estimateItems).set(input).where(eq(estimateItems.id, itemId)); return (await db.select().from(estimateItems).where(eq(estimateItems.id, itemId)).limit(1))[0]; }
export async function deleteEstimateItem(itemId: number) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.delete(estimateItems).where(eq(estimateItems.id, itemId)); return { success: true }; }
export async function listMembers(projectId: number) { const db = await getDb(); if (!db) return []; return db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId)); }
export async function inviteProjectMember(input: { projectId: number; invitedEmail?: string; invitedPhone?: string; role: "foreman" | "contractor" | "designer" | "client" }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const inviteToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  const result = await db.insert(projectMembers).values({ projectId: input.projectId, invitedEmail: input.invitedEmail || null, invitedPhone: input.invitedPhone || null, role: input.role, inviteToken });
  return { id: Number(result[0].insertId), inviteToken, status: "Приглашение создано", inviteUrl: `/invite/${inviteToken}` };
}
