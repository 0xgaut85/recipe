import { FC, ReactNode } from "react";

type CardVariant = "default" | "light" | "panel" | "accent" | "bordered";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    background: "transparent",
    border: "1px solid #E5E7EB",
    borderRadius: "0px",
  },
  light: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "0px",
  },
  panel: {
    background: "transparent",
    border: "1px solid #E5E7EB",
    borderRadius: "0px",
  },
  accent: {
    background: "rgba(255, 77, 0, 0.05)",
    border: "1px solid rgba(255, 77, 0, 0.2)",
    borderRadius: "0px",
  },
  bordered: {
    background: "transparent",
    border: "1px solid #E5E7EB",
    borderRadius: "0px",
  },
};

export const GlassCard: FC<CardProps> = ({
  variant = "default",
  className = "",
  children,
  hover = true,
}) => {
  return (
    <div
      className={`r1x-card transition-all duration-300 ${hover ? "card-hover hover:border-[#E57B3A]" : ""} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </div>
  );
};
