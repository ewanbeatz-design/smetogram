import { z } from "zod";

export const measurementResultSchema = z.object({
  room: z.string(),
  area: z.number().nonnegative(),
  walls: z.number().nonnegative().optional(),
  floor: z.number().nonnegative().optional(),
  ceiling: z.number().nonnegative().optional(),
  tasks: z.array(z.object({
    name: z.string(),
    quantity: z.number().nonnegative(),
    unit: z.string(),
    category: z.string().optional(),
  })),
});

export type MeasurementResult = z.infer<typeof measurementResultSchema>;

/**
 * Подготовка результата анализа помещения.
 * Сейчас работает как слой нормализации данных.
 * Позже сюда подключается Vision AI без изменения клиентской части.
 */
export function normalizeMeasurement(input: unknown): MeasurementResult {
  return measurementResultSchema.parse(input);
}

export function createEstimateDraftFromMeasurement(result: MeasurementResult) {
  return result.tasks.map((task) => ({
    name: task.name,
    quantity: String(task.quantity),
    unit: task.unit,
    price: "0",
    source: "ai" as const,
    category: task.category ?? "AI замер",
  }));
}
