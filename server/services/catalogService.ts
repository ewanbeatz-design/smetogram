import { extendedConstructionCatalog } from "../data/extendedConstructionCatalog";
import { fullEstimateCatalog } from "../data/fullEstimateCatalog";
import { proConstructionCatalog } from "../data/proConstructionCatalog";

export type CatalogBase = "ФЕР" | "ТЕР" | "ГЭСН";

export type EstimateCatalogResult = {
  id: string;
  base: CatalogBase;
  category: string;
  name: string;
  unit: string;
  workPrice: number;
  materialPrice: number;
  totalPrice: number;
};

const source = [
  ...extendedConstructionCatalog.map((item) => ({
    category: item.category,
    name: item.name,
    unit: item.unit,
    workPrice: item.workPrice,
    materialPrice: item.materialPrice,
  })),
  ...fullEstimateCatalog.map((item) => ({
    category: item.category,
    name: item.name,
    unit: item.unit,
    workPrice: item.workPrice,
    materialPrice: item.materialPrice,
  })),
  ...proConstructionCatalog.map((item) => ({
    category: item.category,
    name: item.name,
    unit: item.unit,
    workPrice: item.work,
    materialPrice: item.material,
  })),
];

const unique = Array.from(
  new Map(source.map((item) => [`${item.category}|${item.name}|${item.unit}`, item])).values(),
);

export function searchEstimateCatalog(input: {
  base: CatalogBase;
  query?: string;
  limit?: number;
}): EstimateCatalogResult[] {
  const query = input.query?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  return unique
    .filter((item) => {
      if (!query) return true;
      return `${item.category} ${item.name} ${item.unit}`
        .toLocaleLowerCase("ru-RU")
        .includes(query);
    })
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      id: `${input.base.toLowerCase()}-${index + 1}`,
      base: input.base,
      totalPrice: item.workPrice + item.materialPrice,
    }));
}
