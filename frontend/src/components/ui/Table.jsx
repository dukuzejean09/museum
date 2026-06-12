import { Inbox } from 'lucide-react';
import { TableRowSkeleton } from './LoadingSkeleton';

const Table = ({ columns, data, loading, emptyMessage = 'No data found' }) => {
 return (
 <div className="overflow-x-auto rounded-2xl border border-slate-200">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-200">
 {columns.map((col) => (
 <th
 key={col.key}
 className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
 >
 {col.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {loading ? (
 Array.from({ length: 5 }).map((_, i) => (
 <TableRowSkeleton key={i} cols={columns.length} />
 ))
 ) : data.length === 0 ? (
 <tr>
 <td colSpan={columns.length} className="px-4 py-12 text-center">
 <div className="flex flex-col items-center gap-2 text-slate-400">
 <Inbox size={32} />
 <p className="text-sm">{emptyMessage}</p>
 </div>
 </td>
 </tr>
 ) : (
 data.map((row, i) => (
 <tr
 key={row._id || row.id || i}
 className="bg-white hover:bg-slate-50 transition-colors"
 >
 {columns.map((col) => (
 <td key={col.key} className="px-4 py-3 text-slate-700">
 {col.render ? col.render(row) : row[col.key]}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 );
};

export default Table;
