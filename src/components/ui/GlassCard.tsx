import { FC, ReactNode } from "react";

type GlassCardVariant = "default" | "light" | "panel" | "accent";

interface GlassCardProps {
  variant?: GlassCardVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<GlassCardVariant, string> = {
  default: "glass-card", // Dark theme default
  light: "glass-card-light", // Light version for app terminal
  panel: "glass-panel",
  accent: "accent-card",
};

export const GlassCard: FC<GlassCardProps> = ({
  variant = "default",
  className = "",
  children,
}) => {
  return (
    <div className={`${variantClasses[variant]} ${className}`}>{children}</div>
  );
};
