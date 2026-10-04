export type CatalogItem = {
  category: string;
  name: string;
  unit: string;
  workPrice: number;
  materialPrice: number;
};

export const extendedConstructionCatalog: CatalogItem[] = [
  { category: "Демонтаж", name: "Демонтаж плитки", unit: "м²", workPrice: 350, materialPrice: 0 },
  { category: "Демонтаж", name: "Удаление обоев", unit: "м²", workPrice: 120, materialPrice: 0 },
  { category: "Штукатурка", name: "Выравнивание стен штукатуркой", unit: "м²", workPrice: 650, materialPrice: 280 },
  { category: "Шпаклевка", name: "Финишная шпаклевка стен", unit: "м²", workPrice: 320, materialPrice: 90 },
  { category: "Покраска", name: "Окраска стен водоэмульсионной краской", unit: "м²", workPrice: 250, materialPrice: 160 },
  { category: "Полы", name: "Укладка ламината", unit: "м²", workPrice: 450, materialPrice: 1200 },
  { category: "Плитка", name: "Укладка керамогранита", unit: "м²", workPrice: 1400, materialPrice: 1800 },
  { category: "Электрика", name: "Монтаж розетки", unit: "шт", workPrice: 700, materialPrice: 250 },
  { category: "Сантехника", name: "Монтаж смесителя", unit: "шт", workPrice: 1200, materialPrice: 0 },
  { category: "Потолки", name: "Монтаж натяжного потолка", unit: "м²", workPrice: 700, materialPrice: 900 }
];
