export type CatalogItem = {
  category: string;
  name: string;
  unit: string;
  workPrice: number;
  materialPrice: number;
};

export const constructionCatalog: CatalogItem[] = [
  { category: "Демонтаж", name: "Демонтаж плитки", unit: "м²", workPrice: 450, materialPrice: 0 },
  { category: "Черновые работы", name: "Грунтовка стен", unit: "м²", workPrice: 80, materialPrice: 40 },
  { category: "Отделка", name: "Шпаклевка стен", unit: "м²", workPrice: 350, materialPrice: 180 },
  { category: "Отделка", name: "Покраска стен", unit: "м²", workPrice: 300, materialPrice: 220 },
  { category: "Полы", name: "Укладка ламината", unit: "м²", workPrice: 550, materialPrice: 900 },
  { category: "Электрика", name: "Монтаж розетки", unit: "шт", workPrice: 700, materialPrice: 350 },
  { category: "Сантехника", name: "Монтаж смесителя", unit: "шт", workPrice: 1200, materialPrice: 0 },
];
