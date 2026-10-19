import React from "react";
import { PackageOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-card/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {icon || <PackageOpen className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h4 className="text-sm sm:text-base font-bold text-foreground font-heading">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
