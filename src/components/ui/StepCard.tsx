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
  bgColor = "bg-white",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_0px_#1A1A1A] ${bgColor} ${className}`}
    >
      <span className="font-mono font-bold text-ink text-sm border-2 border-ink rounded-lg px-2 py-1 bg-white w-fit">
        {num}
      </span>
      <div>
        <h4 className="font-display font-bold text-ink text-xl lowercase mb-1">
          {title}
        </h4>
        {desc && (
          <p className="text-sm font-medium text-ink/80 lowercase">{desc}</p>
        )}
      </div>
    </div>
  );
};
