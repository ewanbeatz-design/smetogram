import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { listEntitlements } from "./billing";
import { hashLocalPassword, loginLocalUser, registerLocalUser, addEstimateCategory, addEstimateItem, createProject, deleteEstimateItem, getEstimateCategoryForUser, getEstimateItemForUser, getProjectForUser, inviteProjectMember, listEstimate, listMembers, listProjects, replaceEstimate, updateEstimateItem, updateProject } from "./db";

const projectIdInput = z.object({ projectId: z.number().int().positive() });
const statusSchema = z.enum(["draft", "in_progress", "review", "completed", "archived"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2, "Введите имя").max(120),
        email: z.string().email("Введите корректный email"),
        password: z.string().min(6, "Пароль должен быть не короче 6 символов").max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await registerLocalUser({
          name: input.name,
          email: input.email,
          passwordHash: hashLocalPassword(input.password),
        });
        if (!user) throw new Error("Не удалось создать пользователя");
        const sessionToken = await (await import("./_core/sdk")).sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "",
        });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return user;
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Введите корректный email"),
        password: z.string().min(1, "Введите пароль").max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await loginLocalUser(input.email, input.password);
        if (!user) throw new Error("Не удалось выполнить вход");
        const sessionToken = await (await import("./_core/sdk")).sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "",
        });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return user;
      }),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),
    get: protectedProcedure.input(projectIdInput).query(async ({ ctx, input }) => { const project = await getProjectForUser(input.projectId, ctx.user.id); if (!project) throw new Error("Project not found"); return project; }),
    create: protectedProcedure.input(z.object({ name: z.string().min(2), city: z.string().min(2), clientName: z.string().min(2), clientEmail: z.string().email().optional(), workType: z.string().min(2), deadline: z.coerce.date().optional() })).mutation(({ ctx, input }) => createProject({ ownerId: ctx.user.id, ...input })),
    update: protectedProcedure.input(projectIdInput.extend({ name: z.string().min(2).optional(), city: z.string().min(2).optional(), clientName: z.string().min(2).optional(), workType: z.string().min(2).optional(), status: statusSchema.optional(), deadline: z.coerce.date().nullable().optional() })).mutation(({ ctx, input }) => { const { projectId, ...changes } = input; return updateProject(projectId, ctx.user.id, changes); }),
    members: protectedProcedure.input(projectIdInput).query(async ({ ctx, input }) => { if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found"); return listMembers(input.projectId); }),
    invite: protectedProcedure.input(projectIdInput.extend({ name: z.string().min(2).max(120), email: z.string().email().optional(), phone: z.string().regex(/^\+?[0-9 ()-]{10,20}$/).optional(), role: z.enum(["foreman", "contractor", "designer", "client"]), message: z.string().max(500).optional() }).refine((value) => Boolean(value.email || value.phone), { message: "Укажите email или телефон" })).mutation(async ({ ctx, input }) => {
      if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found");
      const result = await inviteProjectMember({ projectId: input.projectId, invitedEmail: input.email, invitedPhone: input.phone, role: input.role });
      return { ...result, name: input.name, message: input.message || "Вас приглашают присоединиться к проекту в Сметограме." };
    }),
  }),
  estimates: router({
    list: protectedProcedure.input(projectIdInput).query(async ({ ctx, input }) => { if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found"); return listEstimate(input.projectId); }),
    replace: protectedProcedure
      .input(
        projectIdInput.extend({
          groups: z.array(
            z.object({
              name: z.string().min(1),
              sortOrder: z.number().int().nonnegative().optional(),
              items: z.array(
                z.object({
                  name: z.string().min(1),
                  quantity: z.string(),
                  unit: z.string().min(1),
                  price: z.string(),
                  source: z.enum(["manual", "pdf", "scan", "ai"]).optional(),
                })
              ),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found");
        return replaceEstimate(input.projectId, ctx.user.id, input.groups);
      }),
    addCategory: protectedProcedure.input(projectIdInput.extend({ name: z.string().min(1) })).mutation(async ({ ctx, input }) => { if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found"); return addEstimateCategory(input.projectId, input.name); }),
    addItem: protectedProcedure.input(z.object({ categoryId: z.number().int().positive(), name: z.string().min(1), quantity: z.string(), unit: z.string().min(1), price: z.string(), source: z.enum(["manual", "pdf", "scan", "ai"]).optional() })).mutation(async ({ ctx, input }) => {
      if (!await getEstimateCategoryForUser(input.categoryId, ctx.user.id)) throw new Error("Category not found");
      return addEstimateItem(input.categoryId, input);
    }),
    updateItem: protectedProcedure.input(z.object({ itemId: z.number().int().positive(), name: z.string().min(1).optional(), quantity: z.string().optional(), unit: z.string().min(1).optional(), price: z.string().optional() })).mutation(async ({ ctx, input }) => {
      if (!await getEstimateItemForUser(input.itemId, ctx.user.id)) throw new Error("Estimate item not found");
      const { itemId, ...changes } = input;
      return updateEstimateItem(itemId, changes);
    }),
    deleteItem: protectedProcedure.input(z.object({ itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (!await getEstimateItemForUser(input.itemId, ctx.user.id)) throw new Error("Estimate item not found");
      return deleteEstimateItem(input.itemId);
    }),
    generate: protectedProcedure.input(projectIdInput.extend({ sourceText: z.string().min(10).max(120000) })).mutation(async ({ ctx, input }) => {
      if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Ты инженер-сметчик. Извлеки из текста помещения, работы, объёмы и единицы. Не выдумывай отсутствующие данные: если цена не указана, ставь 0. Верни только JSON по заданной схеме." },
          { role: "user", content: input.sourceText },
        ],
        outputSchema: { name: "estimate_draft", strict: true, schema: { type: "object", properties: { categories: { type: "array", items: { type: "object", properties: { name: { type: "string" }, items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" }, price: { type: "number" } }, required: ["name", "quantity", "unit", "price"], additionalProperties: false } } }, required: ["name", "items"], additionalProperties: false } } }, required: ["categories"], additionalProperties: false } },
        maxTokens: 3000,
      });
      const content = response.choices[0]?.message.content;
      if (typeof content !== "string") throw new Error("AI returned an empty estimate");
      return JSON.parse(content) as { categories: Array<{ name: string; items: Array<{ name: string; quantity: number; unit: string; price: number }> }> };
    }),
  }),
  files: router({
    presign: protectedProcedure.input(projectIdInput.extend({ filename: z.string().min(1).max(180), mimeType: z.string().min(1).max(120) })).mutation(async ({ ctx, input }) => {
      if (!await getProjectForUser(input.projectId, ctx.user.id)) throw new Error("Project not found");
      if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("File storage is not configured");
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `projects/${input.projectId}/${ctx.user.id}/${Date.now()}-${safeName}`;
      const response = await fetch(`${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/storage/presign/put?path=${encodeURIComponent(path)}`, { headers: { authorization: `Bearer ${ENV.forgeApiKey}` } });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to create upload URL");
      return { uploadUrl: data.url, stableUrl: `/manus-storage/${path}`, path, mimeType: input.mimeType };
    }),
  }),
  billing: router({
    history: protectedProcedure.query(({ ctx }) => listEntitlements(ctx.user.id)),
  }),
});
export type AppRouter = typeof appRouter;
