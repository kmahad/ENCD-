interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="progress">
      {label && <span className="progress__label">{label}</span>}
      <div className="progress__track">
        <div
          className="progress__fill"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="progress__pct">{Math.round(value)}%</span>
    </div>
  );
}
