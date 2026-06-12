import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, total, onPageChange }) => {
  if (!pages || pages <= 1) return null;

  const pageSize = Math.ceil(total / pages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const getPageNumbers = () => {
    const nums = [];
    const maxVisible = 5;

    if (pages <= maxVisible + 2) {
      for (let i = 1; i <= pages; i++) nums.push(i);
    } else {
      nums.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(pages - 1, page + 1);

      if (page <= 3) {
        start = 2;
        end = maxVisible;
      } else if (page >= pages - 2) {
        start = pages - maxVisible + 1;
        end = pages - 1;
      }

      if (start > 2) nums.push('...');
      for (let i = start; i <= end; i++) nums.push(i);
      if (end < pages - 1) nums.push('...');
      nums.push(pages);
    }

    return nums;
  };

  const btnBase =
    'px-3 py-1.5 text-sm rounded-lg font-medium transition-colors';
  const btnActive =
    'bg-amber-600 text-white';
  const btnInactive =
    'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
  const btnDisabled =
    'text-slate-300 dark:text-slate-600 cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
        >
          <ChevronLeft size={16} />
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-slate-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={`${btnBase} ${page >= pages ? btnDisabled : btnInactive}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
