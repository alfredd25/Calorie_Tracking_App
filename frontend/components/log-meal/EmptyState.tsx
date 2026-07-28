"use client";

interface EmptyStateProps {
  message: string;
  buttonLabel: string;
  onAction: () => void;
}

export function EmptyState({ message, buttonLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <p className="text-sm text-muted mb-5 max-w-xs">{message}</p>
      <button
        onClick={onAction}
        className="bg-foreground text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
