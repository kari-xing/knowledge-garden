import type { Tag as TagType } from '../../types';

interface TagProps {
  tag: TagType;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

/** 彩色标签徽章 */
export default function TagChip({ tag, onRemove, onClick, size = 'sm' }: TagProps) {
  const cls =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : 'text-sm px-2.5 py-1 gap-1.5';
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-medium transition-colors cursor-default select-none ${cls} ${
        onClick ? 'hover:brightness-110 cursor-pointer' : ''
      }`}
      style={{
        backgroundColor: `${tag.color}22`,
        color: tag.color,
        border: `1px solid ${tag.color}55`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="leading-none opacity-60 hover:opacity-100 text-[0.85em]"
          aria-label={`移除标签 ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
