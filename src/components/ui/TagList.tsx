import { FC } from "react";

interface TagListProps {
  tags: string[];
  className?: string;
}

export const TagList: FC<TagListProps> = ({ tags, className = "" }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-3 py-1.5 bg-white/5 rounded-lg text-sm border border-white/10 text-white font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};
