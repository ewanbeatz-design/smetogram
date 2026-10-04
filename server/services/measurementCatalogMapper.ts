export type MeasurementTask = {
  name: string;
  quantity: number;
  unit: string;
};

export type EstimateDraftItem = {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  source: "ai";
};

const aliases: Record<string, number> = {
  "покраска стен": 450,
  "шпаклевка стен": 380,
  "грунтовка стен": 80,
  "укладка ламината": 550,
  "укладка плитки": 1200,
  "монтаж розетки": 500,
};

export function mapMeasurementToEstimate(tasks: MeasurementTask[]): EstimateDraftItem[] {
  return tasks.map((task) => ({
    name: task.name,
    quantity: task.quantity,
    unit: task.unit,
    price: aliases[task.name.toLowerCase()] ?? 0,
    source: "ai",
  }));
}
