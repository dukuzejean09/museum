const pulse = 'animate-pulse bg-slate-200 dark:bg-slate-700 rounded';

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
    <div className={`${pulse} h-48 w-full`} />
    <div className="p-4 space-y-3">
      <div className={`${pulse} h-5 w-3/4`} />
      <div className={`${pulse} h-4 w-full`} />
      <div className={`${pulse} h-4 w-2/3`} />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className={`${pulse} h-4 w-full`} />
      </td>
    ))}
  </tr>
);

export const TextSkeleton = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${pulse} h-4`}
        style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
      />
    ))}
  </div>
);
