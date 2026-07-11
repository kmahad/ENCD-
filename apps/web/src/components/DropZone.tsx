import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  directory?: boolean;
  label: string;
  hint: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({
  accept,
  multiple = false,
  directory = false,
  label,
  hint,
  onFiles,
  disabled,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div
      className={`dropzone ${dragOver ? "dropzone--active" : ""} ${disabled ? "dropzone--disabled" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple || directory}
        {...(directory ? { webkitdirectory: "", directory: "" } : {})}
        onChange={onChange}
        hidden
      />
      <div className="dropzone__icon">📁</div>
      <p className="dropzone__label">{label}</p>
      <p className="dropzone__hint">{hint}</p>
    </div>
  );
}
