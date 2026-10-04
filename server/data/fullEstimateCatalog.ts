export type EstimateCatalogItem = {
  category: string;
  name: string;
  unit: string;
  workPrice: number;
  materialPrice: number;
};

export const fullEstimateCatalog: EstimateCatalogItem[] = [
  { category: "Демонтаж", name: "Демонтаж плитки", unit: "м²", workPrice: 350, materialPrice: 0 },
  { category: "Черновые работы", name: "Штукатурка стен", unit: "м²", workPrice: 650, materialPrice: 220 },
  { category: "Черновые работы", name: "Шпаклевка стен", unit: "м²", workPrice: 420, materialPrice: 180 },
  { category: "Отделка", name: "Покраска стен", unit: "м²", workPrice: 280, materialPrice: 150 },
  { category: "Полы", name: "Укладка ламината", unit: "м²", workPrice: 450, materialPrice: 900 },
  { category: "Плитка", name: "Укладка керамогранита", unit: "м²", workPrice: 1500, materialPrice: 1400 },
  { category: "Электрика", name: "Монтаж розетки", unit: "шт", workPrice: 650, materialPrice: 300 },
  { category: "Сантехника", name: "Монтаж смесителя", unit: "шт", workPrice: 1200, materialPrice: 0 },
  { category: "Потолки", name: "Натяжной потолок", unit: "м²", workPrice: 900, materialPrice: 700 }
];
