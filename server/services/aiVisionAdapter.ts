import { z } from "zod";

export const aiRoomSchema = z.object({
  room: z.string(),
  area: z.number().optional(),
  walls: z.number().optional(),
  floor: z.number().optional(),
  ceiling: z.number().optional(),
  tasks: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    confidence: z.number().optional(),
  }))
});

export type AIRoomAnalysis = z.infer<typeof aiRoomSchema>;

/**
 * Adapter layer for vision providers.
 * Keeps the application independent from OpenAI/other AI vendors.
 * The provider implementation can be connected through env variables later.
 */
export async function analyzeRoomPhoto(input: {
  imageUrl: string;
  description?: string;
}): Promise<AIRoomAnalysis> {
  return {
    room: input.description || "Помещение",
    tasks: []
  };
}
