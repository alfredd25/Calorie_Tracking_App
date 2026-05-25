"use client";

interface EmptyStateProps {
  message: string;
  buttonLabel: string;
  onAction: () => void;
}

export function EmptyState({ message, buttonLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <p className="text-slate-600 text-base mb-6 max-w-xs">{message}</p>
      <button
        onClick={onAction}
        className="bg-primary hover:bg-green-600 text-primary-foreground font-semibold px-8 py-3 rounded-full transition-colors shadow-lg shadow-green-200"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
