import React, { useState } from "react";
import CameraCapture from "./CameraCapture";

export default function MeasurementWorkspace() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Готов к замеру");

  function analyze() {
    setStatus("AI анализирует объект...");
    setTimeout(() => setStatus("Черновик сметы подготовлен"), 1200);
  }

  return (
    <div className="space-y-6 rounded-xl border p-6">
      <div>
        <h2 className="text-2xl font-semibold">AI Замер объекта</h2>
        <p className="text-muted-foreground">Фото → анализ → смета</p>
      </div>

      <CameraCapture onCapture={(file) => setPhotos((p) => [...p, file])} />

      <textarea
        className="w-full rounded-lg border p-3"
        placeholder="Опишите объект голосом или текстом: комната, площадь, работы..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button className="rounded-lg bg-primary px-5 py-3 text-white" onClick={analyze}>
        Запустить AI анализ
      </button>

      <div>{status}</div>
      <div>Фото: {photos.length}</div>
    </div>
  );
}
