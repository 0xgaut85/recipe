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
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold uppercase tracking-wider mb-6 border border-white/10">
          {badge}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold text-ink mb-8 lowercase">
        {title}
      </h2>
    </div>
  );
};
