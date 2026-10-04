import { eq } from "drizzle-orm";
import { billingEvents, entitlements } from "../drizzle/schema";
import { getDb } from "./db";

export async function hasBillingEvent(eventId: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: billingEvents.id }).from(billingEvents).where(eq(billingEvents.eventId, eventId)).limit(1);
  return rows.length > 0;
}

export async function recordBillingEvent(input: { eventId: string; eventType: string; providerObjectId?: string; userId?: number; status?: "received" | "fulfilled" | "ignored" | "failed" }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(billingEvents).values(input).onDuplicateKeyUpdate({ set: { status: input.status ?? "received" } });
}

export async function upsertEntitlement(input: { userId: number; planCode: "free" | "estimate" | "project" | "brigade" | "studio"; providerCustomerId?: string; providerSubscriptionId?: string; providerPaymentId?: string; status?: "active" | "processing" | "cancelled" | "past_due"; currentPeriodEnd?: Date }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: entitlements.id }).from(entitlements).where(eq(entitlements.userId, input.userId)).limit(1);
  if (existing[0]) {
    await db.update(entitlements).set(input).where(eq(entitlements.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(entitlements).values(input);
  return Number(result[0].insertId);
}

export async function listEntitlements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(entitlements).where(eq(entitlements.userId, userId));
}
