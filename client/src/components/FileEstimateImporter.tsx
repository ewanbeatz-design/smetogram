import React, { useState } from "react";

export default function FileEstimateImporter() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Смета из файла или фото</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Поддержка PDF, Excel, CSV и изображений.
      </p>

      <input
        type="file"
        accept=".pdf,.xlsx,.xls,.csv,image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {file && <div className="mt-3">Выбран файл: {file.name}</div>}
    </div>
  );
}
