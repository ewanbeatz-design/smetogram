import { useRef, useState } from "react";

export default function CameraCapture({
  onCapture,
}: {
  onCapture?: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();

  function handleChange(file?: File) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onCapture?.(file);
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 text-white"
        onClick={() => inputRef.current?.click()}
      >
        📷 Сделать фото объекта
      </button>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleChange(e.target.files?.[0])}
      />

      {preview && (
        <img src={preview} alt="Замер объекта" className="max-h-80 rounded-lg" />
      )}
    </div>
  );
}
