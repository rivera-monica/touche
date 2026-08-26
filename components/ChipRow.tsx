'use client';

export default function ChipRow({
  options,
  active,
  onToggle,
}: {
  options: string[];
  active: Set<string>;
  onToggle: (option: string) => void;
}) {
  return (
    <div className="chiprow" title="Click multiple to combine — click All to clear">
      {options.map((option) => {
        const isAll = option === 'All';
        const isActive = isAll ? active.size === 0 : active.has(option);
        return (
          <div
            key={option}
            className={'chip' + (isActive ? ' active' : '')}
            onClick={() => onToggle(option)}
          >
            {option}
          </div>
        );
      })}
    </div>
  );
}
