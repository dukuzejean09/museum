import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import ReportFilters from './ReportFilters';
import { exportToCSV, exportToExcel, exportToPDF } from './exportUtils';
import { fetchVisitorReport } from '../../../api';

const VisitorReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month' });

  const loadData = async (params) => {
    try {
      setLoading(true);
      const res = await fetchVisitorReport(params);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load visitor report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(filters); }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData(newFilters);
  };

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'visitors', label: 'Visitors' },
    { key: 'change', label: 'Change (%)', accessor: (row) => `${row.change > 0 ? '+' : ''}${row.change}%` },
  ];

  const handleExportCSV = () => exportToCSV(data?.dailyTrends || [], columns, 'visitor-report');
  const handleExportExcel = () => exportToExcel(data?.dailyTrends || [], columns, 'visitor-report');
  const handleExportPDF = () => exportToPDF('Visitor Report', data?.dailyTrends || [], columns, data?.summary);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm mb-4 transition">
        <ArrowLeft size={16} /> Back to Reports
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">Visitor Report</h1>

      <ReportFilters
        onFilterChange={handleFilterChange}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onPrint={() => window.print()}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Today</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.today || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">This Week</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.thisWeek || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">This Month</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.thisMonth || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Line Chart - Daily Trends */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Daily Visitor Trends</h3>
          {data?.dailyTrends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Line type="monotone" dataKey="visitors" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No visitor data for this period</p>
          )}
        </div>

        {/* Bar Chart - Monthly Trends */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Visitor Trends</h3>
          {data?.monthlyTrends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="visitors" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No monthly data available</p>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-white font-semibold text-sm">Daily Breakdown</h3>
        </div>
        {data?.dailyTrends?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Date</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Visitors</th>
                  <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyTrends.map((row, i) => (
                  <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-200">{row.date}</td>
                    <td className="px-4 py-3 text-slate-200">{row.visitors}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        row.change > 0 ? 'text-green-400' : row.change < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {row.change > 0 ? <TrendingUp size={12} /> : row.change < 0 ? <TrendingDown size={12} /> : null}
                        {row.change > 0 ? '+' : ''}{row.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">No data available for the selected period</p>
        )}
      </div>
    </div>
  );
};

export default VisitorReport;
