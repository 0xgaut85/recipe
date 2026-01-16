import { FC } from "react";

interface StepCardProps {
  num: string;
  title: string;
  desc?: string;
  bgColor?: string;
  className?: string;
}

export const StepCard: FC<StepCardProps> = ({
  num,
  title,
  desc,
  bgColor = "bg-white/[0.02]",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-lg border border-white/10 ${bgColor} ${className}`}
    >
      <span className="font-mono text-claude-orange text-sm bg-claude-orange/10 rounded-md px-2 py-1 w-fit">
        {num}
      </span>
      <div>
        <h4 className="font-display font-semibold text-white text-lg mb-0.5">
          {title}
        </h4>
        {desc && (
          <p className="text-sm text-white/60">{desc}</p>
        )}
      </div>
    </div>
  );
};
