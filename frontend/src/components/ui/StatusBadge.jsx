const colorMap = {
 draft: 'bg-slate-100 text-slate-600',
 review: 'bg-amber-100 text-amber-700',
 published: 'bg-green-100 text-green-700',
 archived: 'bg-red-100 text-red-700',
 open: 'bg-blue-100 text-blue-700',
 answered: 'bg-green-100 text-green-700',
 closed: 'bg-slate-100 text-slate-600',
 pending: 'bg-yellow-100 text-yellow-700',
 confirmed: 'bg-green-100 text-green-700',
 rejected: 'bg-red-100 text-red-700',
};

const sizeMap = {
 sm: 'px-2 py-0.5 text-[10px]',
 md: 'px-2.5 py-1 text-xs',
};

const StatusBadge = ({ status, size = 'md' }) => {
 const colors = colorMap[status] || colorMap.draft;
 const sizeClass = sizeMap[size] || sizeMap.md;

 return (
 <span className={`inline-flex items-center rounded-full font-medium capitalize ${colors} ${sizeClass}`}>
 {status}
 </span>
 );
};

export default StatusBadge;
