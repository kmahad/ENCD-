import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

interface DropZoneProps {
  label: string;
  hint: string;
  onPick: () => void;
  onDropPath: (path: string) => void;
  disabled?: boolean;
}

export function DropZone({
  label,
  hint,
  onPick,
  onDropPath,
  disabled,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const webview = getCurrentWebview();
        unlisten = await webview.onDragDropEvent((event) => {
          if (disabled) return;
          if (event.payload.type === "enter" || event.payload.type === "over") {
            setDragOver(true);
          } else if (event.payload.type === "drop") {
            setDragOver(false);
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
              onDropPath(paths[0]); // Take the first path
            }
          } else {
            setDragOver(false);
          }
        });
      } catch (err) {
        console.error("Tauri drag-drop listener failed", err);
      }
    };

    setup();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [disabled, onDropPath]);

  return (
    <div
      className={`dropzone ${dragOver ? "dropzone--active" : ""} ${disabled ? "dropzone--disabled" : ""}`}
      onClick={() => !disabled && onPick()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !disabled && onPick()}
    >
      <div className="dropzone__icon">📁</div>
      <p className="dropzone__label">{label}</p>
      <p className="dropzone__hint">{hint}</p>
    </div>
  );
}
