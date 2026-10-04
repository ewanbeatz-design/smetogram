import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { hasBillingEvent, recordBillingEvent } from "../billing";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe requires the exact raw request bytes for signature verification.
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.header("stripe-signature") ?? "";
    if (!secret) return res.status(503).json({ error: "Stripe webhook is not configured" });
    const timestamp = signature.match(/(?:^|,)t=(\d+)/)?.[1];
    const provided = signature.match(/(?:^|,)v1=([a-f0-9]+)/)?.[1];
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
    if (!timestamp || !provided) return res.status(400).json({ error: "Invalid Stripe signature" });
    const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${raw.toString("utf8")}`).digest("hex");
    const valid = provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!valid) return res.status(400).json({ error: "Invalid Stripe signature" });
    try {
      const event = JSON.parse(raw.toString("utf8")) as { id?: string; type?: string; data?: { object?: { id?: string; metadata?: { user_id?: string } } } };
      if (!event.id || !event.type) return res.status(400).json({ error: "Invalid Stripe event" });
      if (await hasBillingEvent(event.id)) return res.json({ received: true, duplicate: true });
      const userId = Number(event.data?.object?.metadata?.user_id);
      await recordBillingEvent({ eventId: event.id, eventType: event.type, providerObjectId: event.data?.object?.id, userId: Number.isFinite(userId) && userId > 0 ? userId : undefined, status: event.type === "checkout.session.completed" ? "fulfilled" : "received" });
      return res.json({ received: true });
    } catch (error) {
      console.error("[Stripe] Webhook processing failed", error);
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
