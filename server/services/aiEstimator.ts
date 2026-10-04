import { z } from "zod";

/**
 * AI estimation pipeline foundation.
 * Converts recognized measurements into estimate-ready items.
 * The real Vision provider can be connected here without changing UI/API contracts.
 */

export const aiEstimateSchema = z.object({
  room: z.string().optional(),
  area: z.number().optional(),
  walls: z.number().optional(),
  floor: z.number().optional(),
  tasks: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      unit: z.string(),
      category: z.string().optional(),
    }),
  ),
});

export type AIEstimateResult = z.infer<typeof aiEstimateSchema>;

export function buildEstimateFromAnalysis(input: AIEstimateResult) {
  return input.tasks.map((task) => ({
    ...task,
    total: task.qty,
    source: "ai-analysis",
  }));
}

export async function analyzeConstructionPhoto(payload: {
  imageUrl?: string;
  description?: string;
}) {
  // Provider adapter placeholder.
  // Connect OpenAI Vision / another model here.
  return {
    room: "Не определено",
    description: payload.description ?? "",
    tasks: [],
    confidence: 0,
  };
}
