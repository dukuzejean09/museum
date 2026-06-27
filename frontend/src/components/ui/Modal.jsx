import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, children, onClose }) => {
 const overlayRef = useRef(null);
 const contentRef = useRef(null);

 const handleEscape = useCallback(
 (e) => {
 if (e.key === 'Escape') onClose();
 },
 [onClose]
 );

 useEffect(() => {
 document.addEventListener('keydown', handleEscape);
 document.body.style.overflow = 'hidden';

 // Focus first focusable element
 const focusable = contentRef.current?.querySelectorAll(
 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
 );
 if (focusable?.length) focusable[0].focus();

 return () => {
 document.removeEventListener('keydown', handleEscape);
 document.body.style.overflow = '';
 };
 }, [handleEscape]);

 const handleOverlayClick = (e) => {
 if (e.target === overlayRef.current) onClose();
 };

 return (
 <div
 ref={overlayRef}
 onClick={handleOverlayClick}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
 >
 <div
 ref={contentRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby="modal-title"
 className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in"
 >
 <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
 <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
 {title}
 </h2>
 <button
 onClick={onClose}
 className="btn-ghost p-1.5 rounded-lg"
 aria-label="Close"
 >
 <X size={18} />
 </button>
 </div>
 <div className="p-6">{children}</div>
 </div>
 </div>
 );
};

export default Modal;
