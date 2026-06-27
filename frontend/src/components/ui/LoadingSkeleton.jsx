const pulse = 'animate-pulse bg-slate-700 rounded';

export const CardSkeleton = () => (
  <div className="card-flush">
    <div className={`${pulse} h-48 w-full`} />
    <div className="p-4 space-y-3">
      <div className={`${pulse} h-5 w-3/4`} />
      <div className={`${pulse} h-4 w-full`} />
      <div className={`${pulse} h-4 w-2/3`} />
    </div>
  </div>
);

export const CardGridSkeleton = ({ count = 6, cols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' }) => (
  <div className={`grid ${cols} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
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

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-700">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <div className={`${pulse} h-4 w-20`} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
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

export const DetailPageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-4xl">
    <div className={`${pulse} h-64 w-full rounded-2xl mb-6`} />
    <div className={`${pulse} h-8 w-2/3 mb-4`} />
    <div className="space-y-2 mb-6">
      <div className={`${pulse} h-4 w-full`} />
      <div className={`${pulse} h-4 w-5/6`} />
      <div className={`${pulse} h-4 w-4/6`} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className={`${pulse} h-24 rounded-xl`} />
      <div className={`${pulse} h-24 rounded-xl`} />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-slate-900 rounded-xl shadow-sm p-6 flex items-center gap-4">
    <div className={`${pulse} h-12 w-12 rounded-lg`} />
    <div className="space-y-2 flex-1">
      <div className={`${pulse} h-3 w-16`} />
      <div className={`${pulse} h-6 w-10`} />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div>
    <div className={`${pulse} h-8 w-40 mb-6`} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="bg-slate-900 rounded-xl shadow-sm p-6 mb-8">
      <div className={`${pulse} h-5 w-40 mb-4`} />
      <div className={`${pulse} h-[300px] w-full rounded`} />
    </div>
  </div>
);

export const PageHeaderSkeleton = () => (
  <div className="mb-8">
    <div className={`${pulse} h-8 w-48 mb-2`} />
    <div className={`${pulse} h-4 w-72`} />
  </div>
);
