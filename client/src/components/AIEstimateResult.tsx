type EstimateItem = {
  name: string;
  unit: string;
  quantity: number;
  workPrice: number;
  materialPrice: number;
};

export function AIEstimateResult({
  room,
  area,
  items,
}: {
  room: string;
  area: number | null;
  items: EstimateItem[];
}) {
  const total = items.reduce(
    (sum, item) => sum + item.quantity * (item.workPrice + item.materialPrice),
    0,
  );

  return (
    <div className="module-panel">
      <div className="eyebrow">ИИ АНАЛИЗ</div>
      <h2>{room}</h2>
      <p>Площадь: {area ? `${area} м²` : "требует уточнения"}</p>

      <div className="document-list">
        {items.map((item) => (
          <div className="document-row" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.unit}</span>
            </div>
            <b>{item.quantity}</b>
            <span>{(item.quantity * (item.workPrice + item.materialPrice)).toLocaleString("ru-RU")} ₽</span>
          </div>
        ))}
      </div>

      <h3>Предварительно: {total.toLocaleString("ru-RU")} ₽</h3>
    </div>
  );
}
