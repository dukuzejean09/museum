import { useState } from 'react';
import { Calendar, Filter, Download, Printer, FileText, FileSpreadsheet } from 'lucide-react';

const ReportFilters = ({ onFilterChange, onExportCSV, onExportExcel, onExportPDF, onPrint, defaultPeriod = 'all' }) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      onFilterChange({ period: newPeriod });
    }
  };

  const handleCustomApply = () => {
    if (from && to) {
      onFilterChange({ period: 'custom', from, to });
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Period buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        {[
          { value: 'all', label: 'All Time' },
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
          { value: 'custom', label: 'Custom Range' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              period === opt.value
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-amber-500 focus:border-amber-500"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-amber-500 focus:border-amber-500"
          />
          <button
            onClick={handleCustomApply}
            disabled={!from || !to}
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Apply
          </button>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500 text-xs mr-1">Export:</span>
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 transition"
          >
            <FileText size={13} /> PDF
          </button>
        )}
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium hover:bg-green-500/20 transition"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
        )}
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition"
          >
            <Download size={13} /> CSV
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-lg text-xs font-medium hover:bg-slate-700 transition"
          >
            <Printer size={13} /> Print
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
