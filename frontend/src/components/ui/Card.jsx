const Card = ({ className = '', children, hover = false, onClick }) => {
 const base = 'card';
 const hoverClass = hover ? 'card-hover cursor-pointer' : '';

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
