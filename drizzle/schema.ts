import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  datetime,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Пользователи
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  openId: varchar("openId", {
    length: 64,
  })
    .notNull()
    .unique(),

  name: text("name"),

  email: varchar("email", {
    length: 320,
  }),

  loginMethod: varchar("loginMethod", {
    length: 64,
  }),

  role: mysqlEnum("role", [
    "user",
    "admin",
  ])
    .default("user")
    .notNull(),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),

  lastSignedIn: timestamp("lastSignedIn")
    .defaultNow()
    .notNull(),
});

/**
 * Проекты
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),

  ownerId: int("ownerId").notNull(),

  name: varchar("name", {
    length: 255,
  }).notNull(),

  city: varchar("city", {
    length: 120,
  }).notNull(),

  clientName: varchar("clientName", {
    length: 255,
  }).notNull(),

  clientEmail: varchar("clientEmail", {
    length: 320,
  }),

  workType: varchar("workType", {
    length: 120,
  }).notNull(),

  status: mysqlEnum("status", [
    "draft",
    "in_progress",
    "review",
    "completed",
    "archived",
  ])
    .default("draft")
    .notNull(),

  deadline: datetime("deadline"),

  budget: decimal("budget", {
    precision: 14,
    scale: 2,
  })
    .default("0")
    .notNull(),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

/**
 * Участники проектов
 */
export const projectMembers = mysqlTable("projectMembers", {
  id: int("id").autoincrement().primaryKey(),

  projectId: int("projectId").notNull(),

  userId: int("userId"),

  invitedEmail: varchar("invitedEmail", {
    length: 320,
  }),

  invitedPhone: varchar("invitedPhone", {
    length: 32,
  }),

  role: mysqlEnum("role", [
    "owner",
    "foreman",
    "contractor",
    "designer",
    "client",
  ]).notNull(),

  inviteToken: varchar("inviteToken", {
    length: 80,
  }).unique(),

  joinedAt: datetime("joinedAt"),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),
});

/**
 * Категории сметы
 */
export const estimateCategories = mysqlTable(
  "estimateCategories",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId").notNull(),

    name: varchar("name", {
      length: 255,
    }).notNull(),

    sortOrder: int("sortOrder")
      .default(0)
      .notNull(),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Позиции сметы
 */
export const estimateItems = mysqlTable("estimateItems", {
  id: int("id").autoincrement().primaryKey(),

  categoryId: int("categoryId").notNull(),

  name: varchar("name", {
    length: 255,
  }).notNull(),

  quantity: decimal("quantity", {
    precision: 12,
    scale: 3,
  })
    .default("1")
    .notNull(),

  unit: varchar("unit", {
    length: 32,
  }).notNull(),

  price: decimal("price", {
    precision: 14,
    scale: 2,
  })
    .default("0")
    .notNull(),

  source: mysqlEnum("source", [
    "manual",
    "pdf",
    "scan",
    "ai",
  ])
    .default("manual")
    .notNull(),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});

/**
 * Файлы проектов
 */
export const projectFiles = mysqlTable("projectFiles", {
  id: int("id").autoincrement().primaryKey(),

  projectId: int("projectId").notNull(),

  uploadedBy: int("uploadedBy").notNull(),

  name: varchar("name", {
    length: 255,
  }).notNull(),

  mimeType: varchar("mimeType", {
    length: 120,
  }).notNull(),

  url: text("url").notNull(),

  kind: mysqlEnum("kind", [
    "design_project",
    "price_list",
    "room_photo",
    "acceptance_photo",
    "document",
    "other",
  ])
    .default("other")
    .notNull(),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),
});

/**
 * Сообщения проекта
 */
export const projectMessages = mysqlTable(
  "projectMessages",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId").notNull(),

    authorId: int("authorId").notNull(),

    channel: mysqlEnum("channel", [
      "team",
      "foreman_client",
      "designer_client",
      "general",
    ])
      .default("general")
      .notNull(),

    body: text("body").notNull(),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Документы проекта
 */
export const projectDocuments = mysqlTable(
  "projectDocuments",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId").notNull(),

    type: mysqlEnum("type", [
      "contract",
      "invoice",
      "act",
    ]).notNull(),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    status: mysqlEnum("status", [
      "draft",
      "sent",
      "signed",
      "cancelled",
    ])
      .default("draft")
      .notNull(),

    fileUrl: text("fileUrl"),

    signedAt: datetime("signedAt"),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Аудит документов
 */
export const documentAudit = mysqlTable(
  "documentAudit",
  {
    id: int("id").autoincrement().primaryKey(),

    documentId: int("documentId").notNull(),

    actorId: int("actorId"),

    action: varchar("action", {
      length: 80,
    }).notNull(),

    metadata: text("metadata"),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Задачи графика
 */
export const scheduleTasks = mysqlTable(
  "scheduleTasks",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId").notNull(),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    startsAt: datetime("startsAt"),

    endsAt: datetime("endsAt"),

    status: mysqlEnum("status", [
      "planned",
      "in_progress",
      "done",
      "blocked",
    ])
      .default("planned")
      .notNull(),

    paymentMilestone: decimal("paymentMilestone", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Этапы приемки
 */
export const acceptanceStages = mysqlTable(
  "acceptanceStages",
  {
    id: int("id").autoincrement().primaryKey(),

    projectId: int("projectId").notNull(),

    scheduleTaskId: int("scheduleTaskId"),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    status: mysqlEnum("status", [
      "pending",
      "submitted",
      "accepted",
      "changes_requested",
    ])
      .default("pending")
      .notNull(),

    amount: decimal("amount", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    holdback: decimal("holdback", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    comment: text("comment"),

    submittedAt: datetime("submittedAt"),

    acceptedAt: datetime("acceptedAt"),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Тарифы
 */
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),

  ownerId: int("ownerId").notNull(),

  code: mysqlEnum("code", [
    "free",
    "estimate",
    "project",
    "brigade",
    "studio",
  ])
    .default("free")
    .notNull(),

  projectsUsed: int("projectsUsed")
    .default(0)
    .notNull(),

  periodStart: timestamp("periodStart")
    .defaultNow()
    .notNull(),

  createdAt: timestamp("createdAt")
    .defaultNow()
    .notNull(),
});

/**
 * Платежные события
 */
export const billingEvents = mysqlTable(
  "billingEvents",
  {
    id: int("id").autoincrement().primaryKey(),

    eventId: varchar("eventId", {
      length: 255,
    })
      .notNull()
      .unique(),

    eventType: varchar("eventType", {
      length: 120,
    }).notNull(),

    userId: int("userId"),

    status: mysqlEnum("status", [
      "received",
      "fulfilled",
      "ignored",
      "failed",
    ])
      .default("received")
      .notNull(),

    providerObjectId: varchar(
      "providerObjectId",
      {
        length: 255,
      },
    ),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),
  },
);

/**
 * Подписки / доступы
 */
export const entitlements = mysqlTable(
  "entitlements",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId").notNull(),

    planCode: mysqlEnum("planCode", [
      "free",
      "estimate",
      "project",
      "brigade",
      "studio",
    ]).notNull(),

    providerCustomerId: varchar(
      "providerCustomerId",
      {
        length: 255,
      },
    ),

    providerSubscriptionId: varchar(
      "providerSubscriptionId",
      {
        length: 255,
      },
    ),

    providerPaymentId: varchar(
      "providerPaymentId",
      {
        length: 255,
      },
    ),

    status: mysqlEnum("status", [
      "active",
      "processing",
      "cancelled",
      "past_due",
    ])
      .default("active")
      .notNull(),

    currentPeriodEnd: datetime(
      "currentPeriodEnd",
    ),

    createdAt: timestamp("createdAt")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
);

/**
 * Типы
 */
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;

export type EstimateCategory =
  typeof estimateCategories.$inferSelect;

export type EstimateItem =
  typeof estimateItems.$inferSelect;