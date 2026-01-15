import { FC } from "react";

interface TagListProps {
  tags: string[];
  className?: string;
}

export const TagList: FC<TagListProps> = ({ tags, className = "" }) => {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-4 py-2 bg-white rounded-xl text-sm border-2 border-ink text-ink font-bold shadow-[2px_2px_0px_0px_#1A1A1A] lowercase"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};
