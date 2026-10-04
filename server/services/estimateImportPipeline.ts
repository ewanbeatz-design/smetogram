import { z } from "zod";

export const estimateImportResultSchema = z.object({
  sourceType: z.enum(["photo", "pdf", "xlsx", "csv"]),
  title: z.string(),
  items: z.array(z.object({
    name: z.string(),
    unit: z.string(),
    quantity: z.number(),
    confidence: z.number(),
  })),
});

export type EstimateImportResult = z.infer<typeof estimateImportResultSchema>;

export function createEstimateDraft(input: { fileName?: string; type: EstimateImportResult["sourceType"] }): EstimateImportResult {
  return {
    sourceType: input.type,
    title: input.fileName || "Новая смета из файла",
    items: [
      { name: "Распознавание документа", unit: "усл.", quantity: 1, confidence: 0.8 },
    ],
  };
}
