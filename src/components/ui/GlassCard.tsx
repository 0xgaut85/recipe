import { FC, ReactNode } from "react";

type GlassCardVariant = "light" | "dark" | "panel" | "pink" | "blue";

interface GlassCardProps {
  variant?: GlassCardVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<GlassCardVariant, string> = {
  light: "glass-card bg-white",
  dark: "glass-card-dark",
  panel: "glass-panel bg-white",
  pink: "glass-card bg-accent-pink",
  blue: "glass-card bg-accent-blue",
};

export const GlassCard: FC<GlassCardProps> = ({
  variant = "light",
  className = "",
  children,
}) => {
  return (
    <div className={`${variantClasses[variant]} ${className}`}>{children}</div>
  );
};
