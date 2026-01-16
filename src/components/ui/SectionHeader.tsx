import { FC } from "react";

interface SectionHeaderProps {
  title: string;
  badge?: string;
  className?: string;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  badge,
  className = "",
}) => {
  return (
    <div className={className}>
      {badge && (
        <span className="inline-block px-3 py-1.5 rounded-full bg-claude-orange/10 text-claude-orange text-xs font-medium uppercase tracking-wider mb-6">
          {badge}
        </span>
      )}
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">
        {title}
      </h2>
    </div>
  );
};
