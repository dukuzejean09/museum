const colorMap = {
 draft: 'bg-slate-800 text-slate-400',
 review: 'bg-amber-900/20 text-amber-400',
 published: 'bg-green-900/20 text-green-400',
 archived: 'bg-red-900/20 text-red-400',
 open: 'bg-blue-900/20 text-blue-400',
 answered: 'bg-green-900/20 text-green-400',
 closed: 'bg-slate-800 text-slate-400',
 pending: 'bg-yellow-900/20 text-yellow-400',
 confirmed: 'bg-green-900/20 text-green-400',
 rejected: 'bg-red-900/20 text-red-400',
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
