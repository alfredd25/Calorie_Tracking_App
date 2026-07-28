import React from "react";

interface AnimatedRingProps {
  progress: number;
  goal: number;
  label: string;
  colorClass: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedRing({
  progress,
  goal,
  label,
  colorClass,
  size = 88,
  strokeWidth = 6,
}: AnimatedRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((progress / (goal || 1)) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-border fill-none"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`fill-none transition-all duration-700 ease-out ${colorClass}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold leading-none">{progress}</span>
          <span className="text-[10px] text-muted leading-none mt-0.5">/{goal}</span>
        </div>
      </div>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
