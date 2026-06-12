const Card = ({ className = '', children, hover = false, onClick }) => {
  const base = 'bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800';
  const hoverClass = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';

  return (
    <div
      className={`${base} ${hoverClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
