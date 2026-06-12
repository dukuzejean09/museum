import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Search...', debounceMs = 300 }) => {
  const [internal, setInternal] = useState(value || '');

  useEffect(() => {
    setInternal(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internal !== value) {
        onChange(internal);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internal, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setInternal('');
    onChange('');
  };

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
      />
      {internal && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
