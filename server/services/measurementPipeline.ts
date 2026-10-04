import { constructionCatalog } from "../data/extendedConstructionCatalog";

export type MeasurementInput = {
  description?: string;
  room?: string;
  area?: number;
  photos?: string[];
};

export type MeasurementResult = {
  room: string;
  area: number | null;
  detected: string[];
  estimateDraft: Array<{
    name: string;
    unit: string;
    quantity: number;
    workPrice: number;
    materialPrice: number;
  }>;
};

/**
 * Подготовительный слой между загрузками пользователя и Vision AI.
 * После подключения AI Vision сюда добавляется реальный анализ изображения.
 */
export function buildMeasurementDraft(input: MeasurementInput): MeasurementResult {
  const text = `${input.description ?? ""} ${input.room ?? ""}`.toLowerCase();
  const detected: string[] = [];

  if (text.includes("ван")) detected.push("сантехника", "плитка");
  if (text.includes("кух")) detected.push("отделка стен", "электрика");
  if (text.includes("комнат")) detected.push("полы", "стены");

  const estimateDraft = constructionCatalog
    .filter((item) => detected.some((name) => item.category.toLowerCase().includes(name)))
    .slice(0, 10)
    .map((item) => ({
      name: item.name,
      unit: item.unit,
      quantity: input.area ?? 1,
      workPrice: item.workPrice,
      materialPrice: item.materialPrice,
    }));

  return {
    room: input.room ?? "Новое помещение",
    area: input.area ?? null,
    detected,
    estimateDraft,
  };
}
